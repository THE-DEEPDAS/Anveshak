import axios from "axios";
import * as cheerio from "cheerio";
import { config } from "../config/config.js";
import Faculty from "../models/Faculty.js";
import Institution from "../models/Institution.js";
import {
  generateBetterEmailWithLLM,
  genAI,
  generateEmailContent,
} from "./aiService.js";

// Helper function to escape special regex characters
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}

const scrapeFacultyFromWebsite = async (url, department) => {
  try {
    console.log(`Scraping faculty from ${url} for department: ${department}`);

    const response = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);
    const facultyList = [];

    // Enhanced selectors for faculty elements
    const selectors = {
      containers: [
        "div.faculty-directory",
        "div.faculty-list",
        "div.faculty-profiles",
        ".faculty-member",
        ".professor",
        ".faculty-card",
        ".staff-member",
        ".team-member",
        ".person-profile",
        ".directory-item",
        ".faculty",
        ".profile",
        ".bio",
        ".person",
      ],
      nameSelectors: [
        "h1, h2, h3, h4",
        ".name",
        ".faculty-name",
        ".member-name",
        ".profile-name",
        ".title-name",
        ".fullname",
        'strong:contains("Dr.")',
        'strong:contains("Professor")',
      ],
      emailSelectors: [
        'a[href^="mailto:"]',
        ".email",
        ".contact-email",
        ".faculty-email",
        ".profile-email",
        ".contact a",
        ".email-address",
      ],
      researchSelectors: [
        ".research-interests",
        ".interests",
        ".specialties",
        ".expertise",
        ".research-areas",
        ".focus-areas",
        ".research",
        ".specialty",
        'p:contains("research")',
        'p:contains("interests")',
        'div:contains("Research Interests")',
      ],
    };

    // Helper function to clean text
    const cleanText = (text) => {
      return text
        .replace(/\\s+/g, " ")
        .replace(/[\\n\\r\\t]/g, "")
        .trim();
    };

    // Helper function to extract email
    const extractEmail = (element) => {
      const href = element.attr("href");
      if (href?.startsWith("mailto:")) {
        return href.replace("mailto:", "").trim();
      }
      const text = element.text();
      const emailMatch = text.match(
        /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}/
      );
      return emailMatch ? emailMatch[0] : null;
    };

    // Process each container selector
    for (const containerSelector of selectors.containers) {
      $(containerSelector).each((_, element) => {
        const container = $(element);
        let facultyInfo = { researchInterests: [] };

        // Extract name
        for (const nameSelector of selectors.nameSelectors) {
          const nameElement = container.find(nameSelector).first();
          if (nameElement.length) {
            facultyInfo.name = cleanText(nameElement.text());
            break;
          }
        }

        // Extract email
        for (const emailSelector of selectors.emailSelectors) {
          const emailElement = container.find(emailSelector).first();
          if (emailElement.length) {
            facultyInfo.email = extractEmail(emailElement);
            if (facultyInfo.email) break;
          }
        }

        // Extract research interests
        for (const researchSelector of selectors.researchSelectors) {
          const researchElement = container.find(researchSelector);
          if (researchElement.length) {
            const researchText = cleanText(researchElement.text());
            // Split on common delimiters and clean up
            const interests = researchText
              .split(/[,;•]/)
              .map((interest) => cleanText(interest))
              .filter(
                (interest) =>
                  interest.length > 3 &&
                  !interest.toLowerCase().includes("research interests") &&
                  !interest.toLowerCase().includes("specialization")
              );
            if (interests.length > 0) {
              facultyInfo.researchInterests = interests;
              break;
            }
          }
        }

        // Extract faculty profile URL
        const profileLink = container
          .find(
            'a[href*="profile"], a[href*="faculty"], a[href*="staff"], a[href*="people"]'
          )
          .first();
        if (profileLink.length) {
          facultyInfo.website = new URL(
            profileLink.attr("href"),
            url
          ).toString();
        }

        // Add faculty member if we have required info
        if (
          facultyInfo.name &&
          (facultyInfo.email || facultyInfo.website) &&
          facultyInfo.researchInterests.length > 0
        ) {
          facultyList.push(facultyInfo);
        }
      });
    }

    // Respect rate limiting
    await new Promise((resolve) => setTimeout(resolve, 2000));

    return facultyList;
  } catch (error) {
    console.error("Error scraping faculty data:", error);
    return [];
  }
};

async function findFacultyWithLLM(input, keywords = []) {
  if (!process.env.GEMINI_API_KEY) return [];

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Create domain context based on input type
    let domainContext;
    if (Array.isArray(input)) {
      // Case 1: input is array of domains
      domainContext = input.map((domain) => {
        const relatedTerms = [];
        if (domain.toLowerCase().includes("robot")) {
          relatedTerms.push(
            "robotics",
            "automation",
            "control systems",
            "mechatronics",
            "industrial automation",
            "robot vision",
            "robotic manipulation"
          );
        }
        if (
          domain.toLowerCase().includes("ai") ||
          domain.toLowerCase().includes("machine learning")
        ) {
          relatedTerms.push(
            "artificial intelligence",
            "deep learning",
            "neural networks",
            "computer vision",
            "natural language processing",
            "reinforcement learning",
            "machine intelligence",
            "cognitive systems"
          );
        }
        if (
          domain.toLowerCase().includes("drone") ||
          domain.toLowerCase().includes("uav")
        ) {
          relatedTerms.push(
            "unmanned aerial vehicles",
            "autonomous systems",
            "flight control",
            "aerospace engineering",
            "aerial robotics",
            "drone technology",
            "autonomous navigation",
            "UAV systems"
          );
        }
        return { main: domain, related: [...new Set(relatedTerms)] };
      });
    } else {
      // Case 2: input is resume object and keywords array
      domainContext = keywords;
    }

    const prompt = `
      Find relevant faculty members for research collaboration based on the following criteria:
      
      ${
        Array.isArray(input)
          ? `
      RESEARCH DOMAINS:
      ${JSON.stringify(domainContext, null, 2)}
      `
          : `
      CANDIDATE BACKGROUND:
      ${JSON.stringify(
        {
          skills: input.skills,
          interests: keywords,
          education: input.education,
          experience: input.experience?.map((exp) => ({
            title: exp.title,
            description: exp.description,
          })),
          projects: input.projects?.map((proj) => ({
            title: proj.title,
            description: proj.description,
          })),
        },
        null,
        2
      )}

      SEARCH FOCUS:
      - Research areas: ${keywords.join(", ")}
      - Academic fields related to candidate's background
      - Strong potential for collaboration
      `
      }

      TARGET INSTITUTIONS & DEPARTMENTS:
      Primary Institutions:
      1. IITs - Focus on research-active professors
      2. IISc - Particularly robotics and AI labs
      3. NITs - Professors with recent publications
      4. DRDO - Research scientists in relevant areas

      REQUIREMENTS:
      1. Each faculty member MUST have:
         - Full name
         - Valid email address
         - Department/field
         - Research interests
         - Institution details
      2. Ensure research interests align with ${
        Array.isArray(input) ? "specified domains" : "candidate's background"
      }
      3. Only include faculty actively conducting research
      4. Focus on potential for meaningful collaboration

      FORMAT:
      Return a JSON array of faculty profiles:
      {
        "name": "string (full name)",
        "email": "string (valid email)",
        "department": "string",
        "institution": {
          "name": "string",
          "location": "string"
        },
        "researchInterests": ["array of interests"],
        "relevanceScore": number (0-1)
      }
    `;

    const result = await model.generateContent(prompt);
    const response = result.response.text();

    try {
      // Find JSON content
      const jsonStart = response.indexOf("[");
      const jsonEnd = response.lastIndexOf("]") + 1;
      let jsonStr =
        jsonStart >= 0 && jsonEnd > 0
          ? response.slice(jsonStart, jsonEnd)
          : response;

      // Remove markdown
      jsonStr = jsonStr
        .replace(/```json\s*|\s*```$/g, "")
        .replace(/\/\/.*$/gm, "")
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/,(\s*[}\]])/g, "$1");

      // Parse and validate faculty entries
      let faculty = JSON.parse(jsonStr);
      if (!Array.isArray(faculty)) {
        console.log("LLM response is not an array");
        return [];
      }

      // Validate each faculty member
      const validFaculty = faculty.filter((f) => {
        const isValid =
          f &&
          typeof f.name === "string" &&
          typeof f.email === "string" &&
          f.email.includes("@") &&
          f.department &&
          Array.isArray(f.researchInterests) &&
          f.researchInterests.length > 0 &&
          f.institution?.name;

        if (!isValid) {
          console.log(`Invalid faculty entry:`, f);
        }
        return isValid;
      });

      if (validFaculty.length === 0) {
        console.log(
          "No valid faculty profiles from LLM, falling back to database"
        );
        const searchTerms = Array.isArray(input)
          ? domainContext.flatMap((d) => [d.main, ...d.related])
          : keywords;

        const dbFaculty = await Faculty.find({
          email: { $exists: true, $ne: "" },
          researchInterests: {
            $in: searchTerms.map((term) => new RegExp(escapeRegExp(term), "i")),
          },
        })
          .limit(15)
          .lean();

        return dbFaculty.filter((f) => f && f.email && f.email.includes("@"));
      }

      return validFaculty;
    } catch (error) {
      console.error("Error parsing LLM faculty response:", error);
      return [];
    }
  } catch (error) {
    console.error("Error in LLM faculty search:", error);
    return [];
  }
}

export const searchFaculty = async (domains) => {
  try {
    // Validate domains array
    if (!Array.isArray(domains) || domains.length === 0) {
      throw new Error("Invalid domains provided");
    }

    // Filter out any invalid domains
    const validDomains = domains.filter(
      (domain) => typeof domain === "string" && domain.trim().length > 0
    );

    if (validDomains.length === 0) {
      throw new Error("No valid search domains provided");
    }

    // First try finding faculty using LLM
    const llmResults = await findFacultyWithLLM(validDomains);

    // Process and score faculty members
    const processedFaculty = llmResults.map((faculty) => {
      // Calculate research interest overlap score
      const interestOverlap = faculty.researchInterests.filter((interest) =>
        validDomains.some(
          (domain) =>
            interest.toLowerCase().includes(domain.toLowerCase()) ||
            domain.toLowerCase().includes(interest.toLowerCase())
        )
      ).length;

      // Calculate publication relevance score if available
      const publicationScore =
        faculty.publications?.filter((pub) =>
          validDomains.some((domain) =>
            pub.toLowerCase().includes(domain.toLowerCase())
          )
        ).length || 0;

      // Calculate project relevance score if available
      const projectScore =
        faculty.projects?.filter((proj) =>
          validDomains.some((domain) =>
            proj.toLowerCase().includes(domain.toLowerCase())
          )
        ).length || 0;

      return {
        ...faculty,
        matchScore: interestOverlap * 3 + publicationScore * 2 + projectScore,
      };
    });

    // Sort by match score and filter out low-matching faculty
    const relevantFaculty = processedFaculty
      .filter((f) => f.matchScore >= 3 && f.email) // Ensure email exists and good match
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 10); // Limit to top 10 matches

    if (relevantFaculty.length > 0) {
      // Save results to database
      await saveFacultyToDatabase(relevantFaculty);
      return relevantFaculty;
    }

    // Fallback to database search with enhanced matching
    console.log("Falling back to database search...");
    const dbFaculty = await Faculty.find({
      email: { $exists: true, $ne: "" },
      $and: [
        {
          researchInterests: {
            $in: validDomains.map(
              (domain) => new RegExp(escapeRegExp(domain.trim()), "i")
            ),
          },
        },
        {
          $or: [
            { publications: { $exists: true, $not: { $size: 0 } } },
            { projects: { $exists: true, $not: { $size: 0 } } },
          ],
        },
      ],
    })
      .populate("institution")
      .limit(15)
      .lean();

    return dbFaculty
      .map((faculty) => ({
        ...faculty,
        matchScore:
          faculty.researchInterests.filter((interest) =>
            validDomains.some(
              (domain) =>
                interest.toLowerCase().includes(domain.toLowerCase()) ||
                domain.toLowerCase().includes(interest.toLowerCase())
            )
          ).length * 2,
      }))
      .sort((a, b) => b.matchScore - a.matchScore);
  } catch (error) {
    console.error("Error searching faculty:", error);
    throw error;
  }
};

/**
 * Filter faculty by research interests
 */
export const filterFacultyByInterests = (faculty, interests) => {
  return faculty.filter((f) => {
    return (
      f.researchInterests &&
      f.researchInterests.some((interest) => {
        return interests.some((i) =>
          interest.toLowerCase().includes(i.toLowerCase())
        );
      })
    );
  });
};

/**
 * Generate a personalized email for a faculty member
 */
export const generateBetterEmail = async (faculty, resume) => {
  try {
    // Input validation
    if (!faculty || typeof faculty !== "object") {
      throw new Error("Faculty data is required");
    }

    if (!resume || typeof resume !== "object") {
      throw new Error("Resume data is required");
    }

    // Normalize the faculty data
    const normalizedFaculty = {
      name: faculty.name || faculty.fullName || "",
      title: faculty.title || "Professor",
      department: faculty.department || "Research",
      institution: faculty.institution || {},
      email: faculty.email || "",
      researchInterests: Array.isArray(faculty.researchInterests)
        ? faculty.researchInterests
        : [],
      publications: Array.isArray(faculty.publications)
        ? faculty.publications
        : [],
      projects: Array.isArray(faculty.projects) ? faculty.projects : [],
    };

    // Normalize the resume data
    const normalizedResume = {
      user: resume.user || {},
      education: Array.isArray(resume.education) ? resume.education : [],
      experience: Array.isArray(resume.experience) ? resume.experience : [],
      skills: Array.isArray(resume.skills) ? resume.skills : [],
      projects: Array.isArray(resume.projects) ? resume.projects : [],
      publications: Array.isArray(resume.publications)
        ? resume.publications
        : [],
    };

    // Find matching research interests
    const matches = {
      relevantSkills: normalizedResume.skills.filter((skill) =>
        normalizedFaculty.researchInterests.some((interest) =>
          skill.toLowerCase().includes(interest.toLowerCase())
        )
      ),
      relevantExperience: normalizedResume.experience.filter((exp) =>
        normalizedFaculty.researchInterests.some((interest) =>
          exp.description?.toLowerCase().includes(interest.toLowerCase())
        )
      ),
      relevantProjects: normalizedResume.projects.filter((project) =>
        normalizedFaculty.researchInterests.some((interest) =>
          project.description?.toLowerCase().includes(interest.toLowerCase())
        )
      ),
    };

    try {
      // Try to generate email with AI
      const emailContent = await generateBetterEmailWithLLM({
        faculty: normalizedFaculty,
        candidate: normalizedResume,
        matches,
      });

      // Validate AI-generated content
      if (emailContent?.subject && emailContent?.body) {
        return emailContent;
      }
    } catch (aiError) {
      console.error("Error generating email with AI:", aiError);
    }

    // Fallback to template-based email if AI fails
    const fallbackSubject = `Research Opportunity Inquiry - ${
      normalizedResume.user.name || "Prospective Student"
    }`;
    const fallbackBody = `Dear ${normalizedFaculty.title} ${
      normalizedFaculty.name
    },

I am writing to express my strong interest in pursuing research opportunities in your lab at ${
      normalizedFaculty.institution.name || "your institution"
    }. Your work in ${normalizedFaculty.researchInterests.join(
      ", "
    )} aligns perfectly with my research interests and academic background.

${
  matches.relevantSkills.length > 0
    ? `I have experience with ${matches.relevantSkills.join(
        ", "
      )}, which I believe would be valuable for your research projects.`
    : ""
}

${
  matches.relevantProjects.length > 0
    ? `I have worked on relevant projects including: ${matches.relevantProjects
        .map((p) => p.title)
        .join(", ")}.`
    : ""
}

I would greatly appreciate the opportunity to discuss potential research collaboration opportunities with you.

Thank you for your time and consideration.

Best regards,
${normalizedResume.user.name || "Prospective Researcher"}`;

    return {
      subject: fallbackSubject,
      body: fallbackBody,
    };
  } catch (error) {
    console.error("Error in generateBetterEmail:", error);
    throw error;
  }
};

export const generateAcademicEmail = async (faculty, resume) => {
  if (!faculty || !resume) {
    throw new Error("Faculty and resume data are required");
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Extract relevant skills and research areas from resume
    const researchInterests = faculty.researchInterests || [];
    const relevantSkills = resume.skills?.filter((skill) =>
      researchInterests.some(
        (interest) =>
          interest.toLowerCase().includes(skill.toLowerCase()) ||
          skill.toLowerCase().includes(interest.toLowerCase())
      )
    );

    // Find relevant experiences and projects
    const relevantExperience = resume.experience?.filter((exp) =>
      researchInterests.some(
        (interest) =>
          exp.description?.toLowerCase().includes(interest.toLowerCase()) ||
          relevantSkills.some((skill) =>
            exp.description?.toLowerCase().includes(skill.toLowerCase())
          )
      )
    );

    const relevantProjects = resume.projects?.filter((project) =>
      researchInterests.some(
        (interest) =>
          project.description?.toLowerCase().includes(interest.toLowerCase()) ||
          project.title?.toLowerCase().includes(interest.toLowerCase()) ||
          relevantSkills.some((skill) =>
            project.description?.toLowerCase().includes(skill.toLowerCase())
          )
      )
    );
    const prompt = `
Generate a highly personalized academic email for research collaboration.

FACULTY PROFILE:
Name: Dr. ${faculty.name}
Department: ${faculty.department || "Research"}
Institution: ${faculty.institution?.name || ""}
Research Areas: ${faculty.researchInterests.join(", ")}

CANDIDATE BACKGROUND:
Education: ${
      resume.education
        ?.map((edu) => `${edu.degree} in ${edu.field} from ${edu.institution}`)
        .join(", ") || ""
    }
Relevant Skills: ${relevantSkills.join(", ")}
${
  relevantExperience.length > 0
    ? `\nRelevant Experience:\n${relevantExperience
        .map((exp) => `- ${exp.title} at ${exp.company}:\n  ${exp.description}`)
        .join("\n")}`
    : ""
}
${
  relevantProjects.length > 0
    ? `\nRelevant Projects:\n${relevantProjects
        .map((proj) => `- ${proj.title}:\n  ${proj.description}`)
        .join("\n")}`
    : ""
}      OUTPUT REQUIREMENTS:
      1. Subject Line:
         - Reference specific research area from faculty's interests
         - Mention candidate's relevant expertise
         - Include position type (PhD/Research)

      2. Email Structure:
         a) Opening Paragraph:
            - Show deep understanding of their research
            - Reference specific aspects of their work
            - Draw connections to your interests
            - Avoid generic statements

         b) Background Paragraph:
            - Start with most relevant education/experience
            - Highlight achievements in their research areas
            - Focus on technical skills that match their work
            - Include metrics or results where possible

         c) Alignment & Goals:
            - Explain why their specific lab/research
            - Outline potential contributions
            - Share research goals/aspirations
            - Demonstrate long-term thinking

         d) Closing:
            - Clear call to action
            - Offer to provide more information
            - Express gratitude
            - Professional signature

      3. Style Guidelines:
         - Keep paragraphs focused and concise
         - Use formal, academic tone
         - Demonstrate enthusiasm without being overly casual
         - Show respect and professionalism

      REQUIRED FORMAT:
      {
        "subject": "Subject line following the specified structure",
        "body": "Email body with clear paragraph separation and professional signature",
      }

      VALIDATION CHECKS:
      1. Subject must contain research area and position type
      2. Opening must reference their specific research
      3. Body must highlight relevant skills and experience
      4. Must include specific collaboration interests
      5. Clear call to action and professional closing

      Remember:
      - Be genuine and specific
      - Show you've done your research
      - Focus on mutual research interests
      - Maintain professionalism throughout
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let emailContent;
    try {
      const text = response.text();
      // First try to extract JSON from code blocks
      let jsonStr = text;

      // Remove markdown code block syntax if present
      const codeBlockMatch = text.match(/```(?:json)?\n([\s\S]*?)\n```/);
      if (codeBlockMatch) {
        jsonStr = codeBlockMatch[1].trim();
      }

      // Clean up the string to ensure it's valid JSON
      jsonStr = jsonStr.replace(/\\n/g, "\n").replace(/\\/g, "");

      try {
        emailContent = JSON.parse(jsonStr);
      } catch (parseError) {
        // If JSON parsing fails, try to extract manually
        console.log("First parse attempt failed, trying manual extraction...");
        const subjectMatch = text.match(
          /["']?subject["']?\s*:\s*["']([^"']+)["']/i
        );
        const bodyMatch = text.match(/["']?body["']?\s*:\s*["']([^"']+)["']/i);

        if (subjectMatch && bodyMatch) {
          emailContent = {
            subject: subjectMatch[1].trim(),
            body: bodyMatch[1].trim(),
          };
        } else {
          throw new Error("Could not extract email content");
        }
      }
    } catch (error) {
      console.error("Error parsing email content:", error);
      // Final fallback to raw text
      const text = response.text();
      emailContent = {
        subject: "Research Collaboration Interest",
        body: text.trim(),
      };
    }

    // Validate the content
    if (!emailContent.subject || !emailContent.body) {
      throw new Error("Generated email content is incomplete");
    }

    return emailContent;
  } catch (error) {
    console.error("Error generating academic email:", error);
    throw error;
  }
};

export const saveFacultyToDatabase = async (facultyList) => {
  try {
    for (const faculty of facultyList) {
      // Skip invalid entries
      if (!faculty.name) continue;

      // Try to find or create the institution first
      let institution;
      if (typeof faculty.institution === "string") {
        // If institution is just a name string from LLM
        institution = await Institution.findOneAndUpdate(
          { name: faculty.institution },
          {
            name: faculty.institution,
            type: faculty.institution.includes("IIT")
              ? "IIT"
              : faculty.institution.includes("NIT")
              ? "NIT"
              : faculty.institution.includes("IISc")
              ? "IISc"
              : faculty.institution.includes("DRDO")
              ? "DRDO"
              : "OTHER",
            location: faculty.location || "India",
            website:
              faculty.website ||
              `https://www.${faculty.institution
                .toLowerCase()
                .replace(/\s+/g, "")}.ac.in`,
            departments: faculty.department ? [faculty.department] : [],
          },
          { upsert: true, new: true }
        );
      } else if (faculty.institution?._id) {
        institution = await Institution.findById(faculty.institution._id);
      }

      if (!institution) continue;

      // Prepare update data without email
      const updateData = {
        name: faculty.name,
        department: faculty.department || "Unknown",
        institution: institution._id,
        researchInterests: Array.isArray(faculty.researchInterests)
          ? faculty.researchInterests
          : faculty.researchInterests
          ? [faculty.researchInterests]
          : [],
        emailStatus: faculty.emailStatus || "not_contacted",
        website: faculty.website || "",
        updatedAt: new Date(),
      };

      // Only include email in query and update if it exists
      const query = {
        name: faculty.name,
        institution: institution._id,
      };

      // If email exists, add it to both query and update data
      if (faculty.email) {
        query.email = faculty.email;
        updateData.email = faculty.email;
      }

      // Now create or update the faculty member
      await Faculty.findOneAndUpdate(query, updateData, {
        upsert: true,
        new: true,
      });
    }
  } catch (error) {
    console.error("Error saving faculty to database:", error);
    throw error;
  }
};

export const generateEmail = async (faculty, resume) => {
  try {
    // Validate inputs
    if (!faculty || !resume) {
      throw new Error("Missing required parameters");
    }

    // Find relevant skills
    const relevantSkills =
      resume.skills?.filter((skill) =>
        faculty.researchInterests.some(
          (interest) =>
            skill.toLowerCase().includes(interest.toLowerCase()) ||
            interest.toLowerCase().includes(skill.toLowerCase())
        )
      ) || [];

    // Find relevant experiences with detailed context
    const relevantExperience =
      resume.experience
        ?.filter((exp) => {
          const expDescription = exp.description?.toLowerCase() || "";
          const expTitle = exp.title?.toLowerCase() || "";

          return faculty.researchInterests.some((interest) => {
            const interestLower = interest.toLowerCase();
            return (
              expDescription.includes(interestLower) ||
              expTitle.includes(interestLower) ||
              relevantSkills.some(
                (skill) =>
                  expDescription.includes(skill.toLowerCase()) ||
                  expTitle.includes(skill.toLowerCase())
              )
            );
          });
        })
        .map((exp) => ({
          ...exp,
          relevanceContext: faculty.researchInterests.filter(
            (interest) =>
              exp.description?.toLowerCase().includes(interest.toLowerCase()) ||
              exp.title?.toLowerCase().includes(interest.toLowerCase())
          ),
        })) || [];

    // Find relevant projects with detailed context
    const relevantProjects =
      resume.projects
        ?.filter((project) => {
          const projDescription = project.description?.toLowerCase() || "";
          const projTitle = project.title?.toLowerCase() || "";

          return faculty.researchInterests.some((interest) => {
            const interestLower = interest.toLowerCase();
            return (
              projDescription.includes(interestLower) ||
              projTitle.includes(interestLower) ||
              relevantSkills.some(
                (skill) =>
                  projDescription.includes(skill.toLowerCase()) ||
                  projTitle.includes(skill.toLowerCase())
              )
            );
          });
        })
        .map((project) => ({
          ...project,
          relevanceContext: faculty.researchInterests.filter(
            (interest) =>
              project.description
                ?.toLowerCase()
                .includes(interest.toLowerCase()) ||
              project.title?.toLowerCase().includes(interest.toLowerCase())
          ),
        })) || [];

    // Extract publication matches if available
    const relevantPublications =
      faculty.publications?.filter(
        (pub) =>
          relevantSkills.some((skill) =>
            pub.toLowerCase().includes(skill.toLowerCase())
          ) ||
          resume.skills?.some((skill) =>
            pub.toLowerCase().includes(skill.toLowerCase())
          )
      ) || [];

    const emailContext = {
      faculty: {
        name: faculty.name,
        department: faculty.department,
        institution: faculty.institution?.name || "",
        researchAreas: faculty.researchInterests,
        relevantPublications: relevantPublications.slice(0, 3),
      },
      candidate: {
        education: resume.education?.map((edu) => ({
          degree: edu.degree,
          field: edu.field,
          institution: edu.institution,
          period: `${edu.startDate} - ${edu.endDate}`,
        })),
        relevantSkills,
        relevantExperience: relevantExperience.map((exp) => ({
          title: exp.title,
          company: exp.company,
          period: `${exp.startDate} - ${exp.endDate}`,
          description: exp.description,
          relevance: exp.relevanceContext,
        })),
        relevantProjects: relevantProjects.map((proj) => ({
          title: proj.title,
          description: proj.description,
          relevance: proj.relevanceContext,
        })),
      },
    }; // Generate email using improved context
    const emailContent = await generateBetterEmailWithLLM(emailContext);

    // Check that we have both subject and body
    if (!emailContent || !emailContent.subject || !emailContent.body) {
      throw new Error("Generated email content is incomplete");
    }

    const formattedEmail = {
      subject: emailContent.subject.trim(),
      body: emailContent.body.trim(),
    };

    return formattedEmail;
  } catch (error) {
    console.error("Error generating email:", error);
    throw error;
  }
};

export const findRelevantFaculty = async (resume, filters = {}) => {
  try {
    const { skills = [], interests = [], maxResults = 5 } = filters;
    const searchKeywords = [...new Set([...skills, ...interests])].filter(
      Boolean
    );

    if (!searchKeywords.length) {
      console.log("No search keywords provided");
      return [];
    }

    // First try finding faculty using LLM
    console.log("Attempting to find faculty using LLM...");
    const llmResults = await findFacultyWithLLM(resume, searchKeywords);

    // Validate LLM results
    const validResults = llmResults.filter(
      (faculty) =>
        faculty &&
        faculty.email &&
        faculty.name &&
        faculty.researchInterests?.length > 0
    );

    if (validResults && validResults.length > 0) {
      console.log(
        `Found ${validResults.length} valid faculty matches from LLM`
      );
      return validResults;
    }

    // Fallback to database search if LLM results are invalid or empty
    console.log("No valid LLM results, falling back to database search...");

    // Build advanced search criteria
    const searchCriteria = {
      $and: [
        { email: { $exists: true, $ne: "" } },
        {
          $or: [
            {
              researchInterests: {
                $in: searchKeywords.map(
                  (k) => new RegExp(escapeRegExp(k), "i")
                ),
              },
            },
            {
              department: {
                $in: searchKeywords.map(
                  (k) => new RegExp(escapeRegExp(k), "i")
                ),
              },
            },
          ],
        },
      ],
    };

    const faculty = await Faculty.find(searchCriteria)
      .populate("institution")
      .limit(20);

    // Enhanced scoring system
    const scoredFaculty = faculty
      .map((f) => {
        let score = 0;
        let matchedKeywords = new Set();
        let strongMatches = 0;

        // Score research interests matches (highest weight)
        searchKeywords.forEach((keyword) => {
          f.researchInterests.forEach((interest) => {
            if (interest.toLowerCase() === keyword.toLowerCase()) {
              score += 3;
              strongMatches++;
              matchedKeywords.add(keyword);
            } else if (interest.toLowerCase().includes(keyword.toLowerCase())) {
              score += 2;
              matchedKeywords.add(keyword);
            }
          });
        });

        // Score department match
        const deptMatches = searchKeywords.filter((k) =>
          f.department.toLowerCase().includes(k.toLowerCase())
        );
        score += deptMatches.length * 1.5;
        deptMatches.forEach((k) => matchedKeywords.add(k));

        // Score based on resume skills match
        if (resume.skills) {
          resume.skills.forEach((skill) => {
            if (
              f.researchInterests.some(
                (i) => i.toLowerCase() === skill.toLowerCase()
              )
            ) {
              score += 2;
              strongMatches++;
            } else if (
              f.researchInterests.some((i) =>
                i.toLowerCase().includes(skill.toLowerCase())
              )
            ) {
              score += 1;
            }
          });
        }

        // Normalize score based on matches
        const normalizedScore = (score / (searchKeywords.length * 3)) * 100;

        // Only consider faculty with strong relevance
        if (
          strongMatches < 2 ||
          matchedKeywords.size < 2 ||
          normalizedScore < 40
        ) {
          return null;
        }

        return {
          ...f.toObject(),
          score: normalizedScore,
          matchedKeywords: Array.from(matchedKeywords),
          strongMatches,
        };
      })
      .filter(Boolean); // Remove null entries

    // Sort by score and limit results
    const topFaculty = scoredFaculty
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults)
      .map((f) => ({
        ...f,
        relevanceScore: Math.round(f.score),
      }));

    console.log(
      `Found ${topFaculty.length} relevant faculty members from database`
    );
    return topFaculty;
  } catch (error) {
    console.error("Error finding relevant faculty:", error);
    throw error;
  }
};

function cleanEmailContent(text) {
  return text
    .replace(/```json[\s\S]*```/g, "") // Remove JSON code blocks
    .replace(/\\n/g, "\n") // Replace escaped newlines
    .replace(/\\"/g, '"') // Replace escaped quotes
    .trim();
}
