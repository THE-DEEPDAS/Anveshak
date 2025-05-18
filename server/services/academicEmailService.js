import axios from "axios";
import { config } from "../config/config.js";
import Faculty from "../models/Faculty.js";
import Institution from "../models/Institution.js";
import { generateBetterEmailWithLLM, genAI } from "./aiService.js";

// Helper function to escape special regex characters
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}

const scrapeFacultyFromWebsite = async (url, department) => {
  // This is a placeholder for the actual web scraping logic
  // In a production environment, this would use tools like Puppeteer or Cheerio
  // and handle rate limiting, IP rotation, etc.
  try {
    console.log(
      `Would scrape faculty data from ${url} for department ${department}`
    );
    return [];
  } catch (error) {
    console.error("Error scraping faculty data:", error);
    return [];
  }
};

async function findFacultyWithLLM(domains) {
  if (!process.env.GEMINI_API_KEY) return [];

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `
      You are a faculty search assistant. Generate an array of faculty members based on these skills: ${domains.join(
        ", "
      )}

      STRICT OUTPUT FORMAT:
      Respond ONLY with a JSON array. Each object in the array must have these exact fields:
      {
        "name": "string",
        "department": "string",
        "institution": "string",
        "researchInterests": ["string"],
        "website": "string or null"
      }

      SEARCH CRITERIA:
      1. Find professors whose research aligns with: ${domains.join(", ")}
      2. Focus on robotics, drones, UAVs, AI, and related fields
      3. Only include faculty from Indian institutions (IITs, NITs, IISc, DRDO)
      4. If no exact matches, include faculty in related fields
      
      EXAMPLE RESPONSE FORMAT:
      [
        {
          "name": "Dr. Ramesh Kumar",
          "department": "Mechanical Engineering",
          "institution": "IIT Delhi",
          "researchInterests": ["Robotics", "Control Systems", "AI"],
          "website": "http://me.iitd.ac.in/ramesh"
        }
      ]

      Generate 5-10 relevant faculty members. Output only valid JSON.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let responseText = response.text();

    // Attempt to extract JSON from the response if it contains other text
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      responseText = jsonMatch[0];
    }

    try {
      const facultyList = JSON.parse(responseText);
      if (Array.isArray(facultyList) && facultyList.length > 0) {
        // Validate the structure of each faculty member
        const validFacultyList = facultyList.filter((faculty) => {
          return (
            faculty &&
            typeof faculty === "object" &&
            typeof faculty.name === "string" &&
            typeof faculty.department === "string" &&
            typeof faculty.institution === "string" &&
            Array.isArray(faculty.researchInterests)
          );
        });

        if (validFacultyList.length > 0) {
          return validFacultyList;
        }
      }
    } catch (e) {
      console.error("Failed to parse LLM response:", e);
      console.error("Response text:", responseText);
    }
  } catch (error) {
    console.error("LLM search failed:", error);
  }
  return [];
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
    if (llmResults.length > 0) {
      // Save LLM results to database if they're new
      await saveFacultyToDatabase(llmResults);
      return llmResults;
    }

    // Fallback to database search if LLM found nothing
    console.log("Falling back to database search...");
    const faculty = await Faculty.find({
      researchInterests: {
        $in: validDomains.map(
          (domain) => new RegExp(escapeRegExp(domain.trim()), "i")
        ),
      },
    }).populate("institution");

    // Expand search domains with related fields
    const expandedDomains = new Set(domains);
    if (domains.some((d) => d.toLowerCase().includes("robot"))) {
      expandedDomains.add("control systems");
      expandedDomains.add("mechatronics");
      expandedDomains.add("automation");
    }
    if (
      domains.some(
        (d) =>
          d.toLowerCase().includes("ai") ||
          d.toLowerCase().includes("machine learning")
      )
    ) {
      expandedDomains.add("deep learning");
      expandedDomains.add("neural networks");
      expandedDomains.add("data science");
    }
    if (
      domains.some(
        (d) =>
          d.toLowerCase().includes("drone") || d.toLowerCase().includes("uav")
      )
    ) {
      expandedDomains.add("aerospace");
      expandedDomains.add("avionics");
      expandedDomains.add("flight control");
    }

    // If we have enough results, return them
    if (faculty.length >= 5) {
      return faculty;
    }

    // Otherwise, try to find more faculty members
    const newFaculty = [];
    const institutions = await Institution.find({});

    for (const institution of institutions) {
      // For each relevant department in the institution
      for (const department of institution.departments) {
        if (
          department.toLowerCase().includes("computer") ||
          department.toLowerCase().includes("electr") ||
          department.toLowerCase().includes("robot") ||
          department.toLowerCase().includes("mech") ||
          department.toLowerCase().includes("aero")
        ) {
          // Scrape faculty data from the institution's website
          const scrapedFaculty = await scrapeFacultyFromWebsite(
            institution.website,
            department
          );
          newFaculty.push(...scrapedFaculty);
        }
      }
    }

    // Save new faculty to database
    if (newFaculty.length > 0) {
      await Faculty.insertMany(newFaculty);
    }

    // Return combined results
    return [...faculty, ...newFaculty];
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
  if (!faculty || !resume) {
    throw new Error("Faculty and resume data are required");
  }

  if (!genAI) {
    throw new Error("AI service not configured");
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Extract key experiences and projects that match faculty research interests
    const relevantExperience =
      resume.experience?.filter((exp) =>
        faculty.researchInterests?.some(
          (interest) =>
            exp.description?.toLowerCase().includes(interest.toLowerCase()) ||
            exp.title?.toLowerCase().includes(interest.toLowerCase())
        )
      ) || [];

    const relevantProjects =
      resume.projects?.filter((project) =>
        faculty.researchInterests?.some(
          (interest) =>
            project.description
              ?.toLowerCase()
              .includes(interest.toLowerCase()) ||
            project.title?.toLowerCase().includes(interest.toLowerCase())
        )
      ) || [];

    // Extract relevant skills based on faculty's research
    const relevantSkills =
      resume.skills?.filter((skill) =>
        faculty.researchInterests?.some(
          (interest) =>
            interest.toLowerCase().includes(skill.toLowerCase()) ||
            skill.toLowerCase().includes(interest.toLowerCase())
        )
      ) || [];
    const prompt = `
      Write a personalized academic email to ${faculty.name} at ${
      faculty.institution?.name || "their institution"
    }.

      CONTEXT:
      Professor's Details:
      - Department: ${faculty.department || "Research"}
      - Research Areas: ${
        faculty.researchInterests?.join(", ") || "various research areas"
      }
      - Institution: ${faculty.institution?.name}
      
      Your Background:
      ${
        relevantSkills.length > 0
          ? `- Relevant Skills: ${relevantSkills.join(", ")}`
          : ""
      }
      ${
        relevantExperience.length > 0
          ? `- Relevant Experience:\n${relevantExperience
              .map(
                (exp) =>
                  `  * ${exp.title} at ${exp.company}: ${exp.description}`
              )
              .join("\n")}`
          : ""
      }
      ${
        relevantProjects.length > 0
          ? `- Relevant Projects:\n${relevantProjects
              .map((proj) => `  * ${proj.title}: ${proj.description}`)
              .join("\n")}`
          : ""
      }
      ${
        resume.education
          ? `- Education: ${resume.education
              .map(
                (edu) => `${edu.degree} in ${edu.field} from ${edu.institution}`
              )
              .join(", ")}`
          : ""
      }
      
      CREATE EMAIL WITH THIS EXACT STRUCTURE:
      1. Subject line should include:
         - Specific research area (e.g., "Research Inquiry: Robotics and Control Systems")
         - Position type (PhD/Research position)
         - Main relevant skill
         Example: "Research Position Inquiry: AI & Robotics - Background in Deep Learning"

      2. Email body structure:
         Paragraph 1: Knowledge of their research
         - Mention specific research areas
         - Show understanding of their work
         - Connect their work to your interests

         Paragraph 2: Your relevant background
         - Highlight experiences matching their research
         - Mention specific projects and results
         - Focus on technical skills relevant to them

         Paragraph 3: Why their lab specifically
         - Why you want to work with them
         - Future research goals
         - How you can contribute

         Closing:
         - Request for meeting/discussion
         - Professional sign-off
         - Your name and current status

      FORMAT:
      Subject: [Your subject line]

      Dear Professor [Name],

      [Body paragraphs]

      [Closing]

      [Your name]
      [Current status/institution]

      IMPORTANT:
      - Keep tone formal but engaging
      - Be specific and concise
      - Show genuine interest
      - Focus on alignment between your skills and their research
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const emailText = response.text();

    // Split into subject and body
    const [subject, ...bodyParts] = emailText.split("\n\n");

    return {
      subject: subject.trim(),
      body: bodyParts.join("\n\n").trim(),
    };
  } catch (error) {
    console.error("Error generating email:", error);
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

      // Now create or update the faculty member
      await Faculty.findOneAndUpdate(
        { name: faculty.name, institution: institution._id },
        {
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
        },
        { upsert: true, new: true }
      );
    }
  } catch (error) {
    console.error("Error saving faculty to database:", error);
    throw error;
  }
};
