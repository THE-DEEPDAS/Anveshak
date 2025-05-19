import axios from "axios";
import * as cheerio from "cheerio";
import { config } from "../config/config.js";
import Faculty from "../models/Faculty.js";
import Institution from "../models/Institution.js";
import { generateResearchEmail, genAI } from "./aiService.js";

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
    const prompt = `[INSTRUCTION]
You are an academic researcher finder. Find faculty members from top Indian institutions matching these criteria:

[INPUT]
${
  Array.isArray(input)
    ? `RESEARCH DOMAINS:\n${JSON.stringify(domainContext, null, 2)}`
    : `CANDIDATE PROFILE:\n${JSON.stringify(
        {
          skills: input.skills,
          interests: keywords,
          education: input.education,
          experience: input.experience?.map(({ title, description }) => ({
            title,
            description,
          })),
          projects: input.projects?.map(({ title, description }) => ({
            title,
            description,
          })),
        },
        null,
        2
      )}`
}

[OUTPUT RULES]
1. Return ONLY a valid JSON array of faculty profiles - NO explanations, NO markdown
2. Each faculty member MUST be a real, active researcher
3. Each object MUST have this exact structure:
{
  "name": "string (full name) REQUIRED",
  "email": "string (valid .edu or .ac.in email) REQUIRED",
  "department": "string (specific department name) REQUIRED",
  "institution": "string (full institution name) REQUIRED",
  "researchInterests": ["string array (3-5 specific research areas)"] REQUIRED,
  "relevanceScore": number (0.1-1.0) REQUIRED
}

[REQUIREMENTS]
1. Generate 5- 10 highly relevant faculty profiles
2. Only include faculty with verifiable .edu or .ac.in email addresses
3. Research interests must align with ${
      Array.isArray(input) ? "the provided domains" : "candidate's background"
    }
4. Focus on IIT, IISc, NIT or DRDO researchers
5. Do not invent or hallucinate details

[PENALTIES]
- Invalid email formats will be rejected
- Missing required fields will be rejected
- Generic/vague research interests will be rejected
- Made-up faculty members will be rejected

[RESPONSE FORMAT]
[
  {faculty1},
  {faculty2},
  {faculty3},
  ... upto 10 faculty members
]`;

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
        .replace(/,(\s*[}\]])/g, "$1"); // Parse and validate faculty entries
      let faculty;
      try {
        faculty = JSON.parse(jsonStr);
      } catch (e) {
        // Try to salvage partial JSON
        const validJsonStr = jsonStr.replace(/}\s*{/g, "},{").trim();
        if (validJsonStr.startsWith("[") && validJsonStr.endsWith("]")) {
          try {
            faculty = JSON.parse(validJsonStr);
          } catch (e2) {
            console.log("Could not salvage JSON:", e2);
            return [];
          }
        } else {
          return [];
        }
      }

      if (!Array.isArray(faculty)) {
        console.log("LLM response is not an array");
        return [];
      }
      console.log("\nRaw LLM Response Sample:", response.slice(0, 500), "...");
      console.log(
        "\nParsed JSON Sample:",
        JSON.stringify(faculty?.slice(0, 1), null, 2)
      );

      // Strict validation for each faculty member
      const validFaculty = faculty.filter((f) => {
        const isValid =
          f &&
          typeof f.name === "string" &&
          typeof f.email === "string" &&
          (f.email.includes(".edu") || f.email.includes(".ac.in")) &&
          f.department &&
          typeof f.department === "string" &&
          Array.isArray(f.researchInterests) &&
          f.researchInterests.length >= 3 &&
          f.researchInterests.every(
            (i) => typeof i === "string" && i.length > 5
          ) &&
          (typeof f.institution === "string" ||
            (f.institution?.name && typeof f.institution.name === "string")) &&
          typeof f.relevanceScore === "number" &&
          f.relevanceScore >= 0 &&
          f.relevanceScore <= 1;

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
      } // Normalize the institution property
      return validFaculty.map((f) => ({
        ...f,
        institution:
          typeof f.institution === "string"
            ? { name: f.institution }
            : f.institution,
      }));
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
    }); // Enhanced sorting and filtering of faculty matches    // Normalize faculty data before validation
    const normalizedFaculty = processedFaculty.map((f) => ({
      ...f,
      // Normalize institution to always be an object
      institution:
        typeof f.institution === "string"
          ? { name: f.institution }
          : f.institution,
      // Ensure research interests is always an array
      researchInterests: Array.isArray(f.researchInterests)
        ? f.researchInterests
        : typeof f.researchInterests === "string"
        ? [f.researchInterests]
        : [],
    }));

    const relevantFaculty = normalizedFaculty
      .filter((f) => {
        // Must have email and basic match score
        if (!f.email || !f.matchScore) {
          return false;
        }

        // Less strict match score requirement
        if (f.matchScore < 2) {
          return false;
        }

        // Calculate match score based on available data
        const matchScore = f.matchScore;
        const hasValidResearchInterests =
          Array.isArray(f.researchInterests) && f.researchInterests.length > 0;
        const hasValidDepartment =
          f.department && typeof f.department === "string";
        const hasValidInstitution =
          f.institution &&
          (typeof f.institution === "string" || f.institution.name);

        // At least one of research interests, department, or valid institution must be present
        if (
          !hasValidResearchInterests &&
          !hasValidDepartment &&
          !hasValidInstitution
        ) {
          return false;
        }
        // At least have basic contact info
        if (!f.email || !f.name) {
          return false;
        }
        f.deepMatchScore = matchScore;
        return true;
      })
      .sort((a, b) => b.deepMatchScore - a.deepMatchScore)
      .slice(0, 10); // Limit to top 10 matches

    console.log(`\nProcessing Summary:
- Total faculty entries from LLM: ${processedFaculty.length}
- Valid faculty entries after filtering: ${relevantFaculty.length}
- Match scores range: ${Math.min(
      ...relevantFaculty.map((f) => f.matchScore)
    )} to ${Math.max(...relevantFaculty.map((f) => f.matchScore))}
`);

    if (relevantFaculty.length > 0) {
      // Save results to database
      await saveFacultyToDatabase(relevantFaculty);
      console.log(
        `Successfully saved ${relevantFaculty.length} faculty profiles to database`
      );
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
Generate a highly personalized academic email for research collaboration. Make the email uniquely tailored to show understanding of the professor's work.

FACULTY PROFILE:
Professor: Dr. ${faculty.name}
Title: ${faculty.title}
Department: ${faculty.department}
Institution: ${faculty.institution.name}
Type: ${faculty.institution.type}
Location: ${faculty.institution.location}
Website: ${faculty.website || faculty.institution.website}

RESEARCH BACKGROUND:
Research Areas: ${faculty.researchInterests.join(", ")}
Current Projects: ${
      faculty.projects?.slice(0, 5).join("\n- ") || "Not available"
    }

Notable Publications:
${
  faculty.publications
    ?.slice(0, 3)
    .map((pub) => `- ${pub}`)
    .join("\n") || "Not available"
}

CANDIDATE HIGHLIGHTS:
1. Research Interest Alignment:
   ${faculty.researchInterests
     .map((interest) => {
       const matchingSkills = matches.relevantSkills.filter(
         (skill) =>
           skill.toLowerCase().includes(interest.toLowerCase()) ||
           interest.toLowerCase().includes(skill.toLowerCase())
       );
       return `- ${interest}: Matching skills - ${matchingSkills.join(", ")}`;
     })
     .join("\n   ")}

2. Relevant Projects:
   ${matches.relevantProjects
     .map(
       (proj) =>
         `- ${proj.title}
      Description: ${proj.description}
      Technical Skills: ${matches.relevantSkills
        .filter((skill) =>
          proj.description?.toLowerCase().includes(skill.toLowerCase())
        )
        .join(", ")}
    `
     )
     .join("\n   ")}

3. Professional Background:
   ${relevantExperience
     .map(
       (exp) =>
         `- ${exp.title} at ${exp.company}
      Duration: ${exp.period}
      Key Achievements: ${exp.description}
      Research Relevance: ${exp.relevanceContext?.join(", ")}
    `
     )
     .join("\n   ")}

4. Academic Background:
${resume.education
  ?.map(
    (edu) =>
      `- ${edu.degree} in ${edu.field} (${edu.startDate} - ${edu.endDate})
   Institution: ${edu.institution}
   Performance: ${edu.score || "Not specified"}
   Relevant Coursework: ${
     edu.courses
       ?.filter((course) =>
         faculty.researchInterests.some((interest) =>
           course.toLowerCase().includes(interest.toLowerCase())
         )
       )
       .join(", ") || "Not specified"
   }`
  )
  .join("\n")}

5. Publications & Research:
${
  resume.publications
    ?.map(
      (pub) =>
        `- ${pub.title}
   Venue: ${pub.venue}
   Year: ${pub.year}
   Relevance: ${pub.relevanceContext?.join(", ") || "General contribution"}`
    )
    .join("\n") || "No prior publications"
}

EMAIL REQUIREMENTS:

1. Subject Line (Format: [Research Area] - [Specific Position/Collaboration] - [Key Skill]):
   - Must reference one of: ${faculty.researchInterests.join(", ")}
   - Include position type (Research Intern/PhD/Collaboration)
   - Highlight a relevant technical skill

2. Email Structure:

   a) Opening (2-3 sentences):
      - Reference specific faculty research/publication
      - Show understanding of their current work
      - Connect their work to your background
      - Be specific and demonstrate research

   b) Technical Alignment (1 paragraph):
      - Lead with strongest matching skills
      - Cite specific projects/achievements
      - Use quantifiable results
      - Connect each point to faculty's research

   c) Research Background (1 paragraph):
      - Highlight relevant research experience
      - Discuss methodology and results
      - Connect to faculty's research areas
      - Show research aptitude

   d) Academic Foundation (1 paragraph):
      - Relevant coursework/achievements
      - Technical skills development
      - Research preparation
      - Learning trajectory

   e) Collaboration Interest (1-2 paragraphs):
      - Specific research areas of interest
      - Potential contributions
      - Project ideas or extensions
      - Long-term research goals

   f) Professional Closing:
      - Clear next steps
      - Availability for discussion
      - Reference to CV/portfolio
      - Complete contact information

3. Style Guide:
   - Formal academic tone
   - Specific and evidence-based
   - Show enthusiasm appropriately
   - Be concise and focused
   - Avoid generic statements
   - Use active voice
   - Include specific examples

FORMAT:
{
  "subject": "Research area - Position type - Key skill",
  "body": "Dear Dr. [Name]...[Content following structure above]...Best regards, [Your name]"
}

VALIDATION REQUIREMENTS:
1. Must reference at least one specific faculty publication/project
2. Must connect candidate skills to faculty research
3. Must include specific examples from candidate's background
4. Must propose clear collaboration areas
5. Must demonstrate understanding of faculty's work
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
    let savedCount = 0;
    for (const faculty of facultyList) {
      // Skip invalid entries
      if (!faculty.name) continue;

      console.log(`\nProcessing faculty member: ${faculty.name}`);
      console.log(`Institution: ${faculty.institution?.name || "Unknown"}`);
      console.log(`Department: ${faculty.department || "Unknown"}`);
      console.log(
        `Research Interests: ${
          faculty.researchInterests?.join(", ") || "None"
        }\n`
      ); // Try to find or create the institution first
      let institution;
      const instName =
        typeof faculty.institution === "string"
          ? faculty.institution
          : faculty.institution?.name;

      if (instName) {
        // Create or update the institution
        institution = await Institution.findOneAndUpdate(
          { name: instName },
          {
            name: instName,
            type: instName.includes("IIT")
              ? "IIT"
              : instName.includes("NIT")
              ? "NIT"
              : instName.includes("IISc")
              ? "IISc"
              : instName.includes("DRDO")
              ? "DRDO"
              : "OTHER",
            location: faculty.institution?.location || "India",
            website:
              faculty.website ||
              `https://www.${instName.toLowerCase().replace(/\s+/g, "")}.ac.in`,
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
      } // Now create or update the faculty member
      const result = await Faculty.findOneAndUpdate(query, updateData, {
        upsert: true,
        new: true,
      });

      if (result) {
        savedCount++;
        console.log(`Successfully saved/updated faculty: ${faculty.name}`);
      }
    }

    console.log(`\nDatabase Summary:
- Total faculty processed: ${facultyList.length}
- Successfully saved/updated: ${savedCount}
- Failed/Skipped: ${facultyList.length - savedCount}
`);
  } catch (error) {
    console.error("Error saving faculty to database:", error);
    throw error;
  }
};

export const generateEmail = async (faculty, resume) => {
  try {
    if (!faculty || !resume) {
      throw new Error("Missing required parameters");
    }

    // Match the candidate's skills and background with the faculty's research interests
    const matches = await matchCandidateToFaculty(resume, faculty);

    // Generate email using improved research matching with proper object structure
    const emailContent = await generateResearchEmail({
      faculty,
      candidate: {
        ...resume,
        matches: matches,
      },
    });

    // Validate output
    if (!emailContent || !emailContent.subject || !emailContent.body) {
      throw new Error("Generated email content is incomplete");
    }

    return {
      subject: emailContent.subject.trim(),
      body: emailContent.body.trim(),
    };
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

/**
 * Generate a personalized email for a faculty member using strict validation
 */
export const generateBetterEmail = async (faculty, resume) => {
  try {
    // Validate and normalize faculty data
    if (!faculty || typeof faculty !== "object") {
      throw new Error("Invalid faculty data provided");
    }

    const normalizedFaculty = {
      name: faculty.name?.trim(),
      email: faculty.email?.trim(),
      department: faculty.department?.trim() || "Research",
      title: faculty.title?.trim() || "Professor",
      institution: faculty.institution
        ? {
            name: faculty.institution.name?.trim(),
            type: faculty.institution.type?.trim() || "University",
            location: faculty.institution.location?.trim(),
            website: faculty.institution.website?.trim(),
          }
        : null,
      researchInterests: Array.isArray(faculty.researchInterests)
        ? faculty.researchInterests
            .filter(Boolean)
            .map((interest) => interest.trim())
        : [],
      website: faculty.website?.trim(),
      projects: Array.isArray(faculty.projects)
        ? faculty.projects.filter(Boolean)
        : [],
      publications: Array.isArray(faculty.publications)
        ? faculty.publications.filter(Boolean)
        : [],
    };

    // Validate required faculty fields
    if (!normalizedFaculty.name || !normalizedFaculty.email) {
      throw new Error("Faculty name and email are required");
    }
    if (!normalizedFaculty.institution?.name) {
      throw new Error("Faculty institution name is required");
    }
    if (normalizedFaculty.researchInterests.length === 0) {
      throw new Error("Faculty must have at least one research interest");
    }

    // Normalize and validate resume data
    if (!resume || typeof resume !== "object") {
      throw new Error("Invalid resume data provided");
    }

    // Extract skills from either parseResults or direct skills array
    const skills =
      resume.parseResults?.length > 0
        ? resume.parseResults[resume.parseResults.length - 1].skills || []
        : resume.skills || [];

    if (!Array.isArray(skills) || skills.length === 0) {
      console.error(
        "Resume skills not found:",
        JSON.stringify({
          resume: { skills, parseResults: resume.parseResults },
        })
      );
      throw new Error("Resume must include skills");
    }

    const normalizedResume = {
      skills: skills.filter(Boolean).map((skill) => skill.trim()),
      experience: (resume.parseResults?.length > 0
        ? resume.parseResults[resume.parseResults.length - 1].experience
        : resume.experience || []
      ).filter(Boolean),
      projects: (resume.parseResults?.length > 0
        ? resume.parseResults[resume.parseResults.length - 1].projects
        : resume.projects || []
      ).filter(Boolean),
      education: Array.isArray(resume.education)
        ? resume.education.filter((edu) => edu && edu.degree)
        : [],
    };

    // Find matches between faculty research and candidate profile
    const matches = {
      matchingInterests: normalizedFaculty.researchInterests.filter(
        (interest) =>
          normalizedResume.skills.some(
            (skill) =>
              interest.toLowerCase().includes(skill.toLowerCase()) ||
              skill.toLowerCase().includes(interest.toLowerCase())
          )
      ),
      relevantProjects: normalizedResume.projects.filter((project) =>
        normalizedFaculty.researchInterests.some((interest) =>
          project.toLowerCase().includes(interest.toLowerCase())
        )
      ),
      relevantSkills: normalizedResume.skills.filter((skill) =>
        normalizedFaculty.researchInterests.some(
          (interest) =>
            interest.toLowerCase().includes(skill.toLowerCase()) ||
            skill.toLowerCase().includes(interest.toLowerCase())
        )
      ),
    };

    // Generate email with validated and enriched data
    const emailContent = await generateResearchEmail({
      faculty: normalizedFaculty,
      candidate: {
        ...normalizedResume,
        matches,
      },
    });

    return emailContent;
  } catch (error) {
    console.error("Error in generateBetterEmail:", error);
    throw error;
  }
};

/**
 * Matches a candidate's skills and background to a faculty member's research interests
 * @param {Object} candidate - Contains skills, experience, projects, education
 * @param {Object} faculty - Faculty member details with research interests
 * @returns {Object} - Matching interests, relevant projects, and relevant skills
 */
export const matchCandidateToFaculty = async (candidate, faculty) => {
  try {
    // Ensure we have the required data
    if (!candidate || !faculty) {
      throw new Error("Missing candidate or faculty data for matching");
    }

    // Normalize candidate data
    const candidateSkills = Array.isArray(candidate.skills)
      ? candidate.skills
      : [];
    const candidateProjects = Array.isArray(candidate.projects)
      ? candidate.projects
      : [];

    // Normalize faculty data
    const facultyInterests = Array.isArray(faculty.researchInterests)
      ? faculty.researchInterests
      : [];

    // Find matching interests (case-insensitive)
    const matchingInterests = facultyInterests.filter((interest) =>
      candidateSkills.some(
        (skill) =>
          skill.toLowerCase().includes(interest.toLowerCase()) ||
          interest.toLowerCase().includes(skill.toLowerCase())
      )
    );

    // Find relevant projects based on faculty interests
    const relevantProjects = candidateProjects.filter((project) =>
      facultyInterests.some((interest) =>
        project.toLowerCase().includes(interest.toLowerCase())
      )
    );

    // Find relevant skills based on faculty interests
    const relevantSkills = candidateSkills.filter((skill) =>
      facultyInterests.some(
        (interest) =>
          skill.toLowerCase().includes(interest.toLowerCase()) ||
          interest.toLowerCase().includes(skill.toLowerCase())
      )
    );

    return {
      matchingInterests,
      relevantProjects,
      relevantSkills,
    };
  } catch (error) {
    console.error("Error matching candidate to faculty:", error);
    // Return empty arrays as fallback
    return {
      matchingInterests: [],
      relevantProjects: [],
      relevantSkills: [],
    };
  }
};
