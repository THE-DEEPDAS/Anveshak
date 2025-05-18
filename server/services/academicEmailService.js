import axios from "axios";
import { config } from "../config/config.js";
import Faculty from "../models/Faculty.js";
import Institution from "../models/Institution.js";
import { generateBetterEmailWithLLM } from "./aiService.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini API
const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

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
      Given these technical skills and research interests: ${domains.join(", ")}
      
      Search our faculty database for professors and researchers who:
      1. Have research interests matching these skills
      2. Work in robotics, drones, UAVs, AI, or related fields
      3. Are from Indian institutions (IITs, NITs, IISc, DRDO, etc.)
      
      For each faculty member, provide:
      - Name
      - Department
      - Institution
      - Research interests
      - Website (if available)
      
      Format as JSON array of objects with these fields.
      If no exact matches, include faculty in related or overlapping fields.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();

    try {
      const facultyList = JSON.parse(responseText);
      if (Array.isArray(facultyList) && facultyList.length > 0) {
        return facultyList;
      }
    } catch (e) {
      console.error("Failed to parse LLM response:", e);
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

export const generateBetterEmail = async (faculty, resume) => {
  try {
    if (!faculty || !resume) {
      throw new Error("Faculty and resume data are required");
    }

    if (!genAI) {
      throw new Error("AI service not configured");
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `
      Create a personalized email to Professor ${faculty.name} at ${
      faculty.institution?.name || "their institution"
    }.
      
      Professor's Details:
      - Department: ${faculty.department || "Research"}
      - Research Interests: ${
        faculty.researchInterests?.join(", ") || "various research areas"
      }
      
      Student's Background:
      - Skills: ${resume.skills?.join(", ")}
      - Experience: ${resume.experience
        ?.map((exp) => exp.title + " at " + exp.company)
        .join(", ")}
      - Projects: ${resume.projects?.map((proj) => proj.title).join(", ")}
      
      Requirements:
      1. Write a formal but engaging email
      2. Show genuine interest in their research
      3. Highlight relevant skills and experience
      4. Be specific about potential collaboration areas
      5. Keep it concise (max 250 words)
      6. Include a clear call to action
      
      Format the response as a JSON object with:
      {
        "subject": "Email subject line",
        "body": "Email body text"
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();

    try {
      const emailContent = JSON.parse(responseText);
      if (!emailContent.subject || !emailContent.body) {
        throw new Error("Invalid email content generated");
      }
      return emailContent;
    } catch (e) {
      console.error("Error parsing LLM response:", e);
      // Fallback to basic format if JSON parsing fails
      const lines = responseText.split("\n");
      return {
        subject:
          lines[0] || `Research Collaboration Interest - ${resume.user?.name}`,
        body:
          lines.slice(1).join("\n") ||
          `Dear Professor ${faculty.name},\n\nI am writing to express my interest in research collaboration opportunities...`,
      };
    }
  } catch (error) {
    console.error("Error generating email:", error);
    throw error;
  }
};

export const filterFacultyByInterests = (faculty, interests) => {
  return faculty.filter((f) =>
    f.researchInterests.some((interest) =>
      interests.some((i) => interest.toLowerCase().includes(i.toLowerCase()))
    )
  );
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
