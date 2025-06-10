/**
 * LLM-based Resume Extractor
 *
 * This module uses an LLM to extract structured information from resume text.
 * It passes the raw resume text to an LLM and asks it to return skills,
 * experience, and projects as JSON objects.
 */

import { getLLMResponse } from "../utils/llm.js";

/**
 * Extract skills from resume text using an LLM
 * @param {string} resumeText - Raw text extracted from a resume
 * @returns {Promise<Array>} - Array of skills
 */
async function extractSkillsWithLLM(resumeText) {
  try {
    console.log("Extracting skills with LLM");

    const prompt = `You are a resume parsing assistant that must output ONLY valid JSON.
STRICT REQUIREMENTS:
- Output must be a single valid JSON object with ONLY a skills array
- Do not include any text or comments before or after the JSON
- Do not include any explanations
- Each skill should be 1-3 words maximum
- Focus only on technical and professional skills

Extract ALL skills from this resume and output EXACTLY this JSON structure:
{
  "skills": ["skill1", "skill2", "skill3"]
}

Resume text to parse:
${resumeText}`;

    // Call the LLM with the prompt - no delay for first call
    const llmResponse = await getLLMResponse(prompt, { skipDelay: true });
    console.log("Skills extraction response received");

    // Extract JSON from the response
    let skills = [];
    try {
      // Find JSON object in the response
      const jsonMatch = llmResponse.match(/\{[\s\S]*"skills"[\s\S]*\}/);
      if (jsonMatch) {
        const skillsJson = JSON.parse(jsonMatch[0]);
        if (Array.isArray(skillsJson.skills)) {
          skills = skillsJson.skills
            .filter(
              (skill) => typeof skill === "string" && skill.trim().length > 0
            )
            .map((skill) => skill.trim());
        }
      }
    } catch (error) {
      console.error("Error parsing skills JSON:", error);
    }

    console.log(`Extracted ${skills.length} skills`);
    return skills;
  } catch (error) {
    console.error("Error extracting skills:", error);
    return [];
  }
}

/**
 * Extract experience from resume text using an LLM
 * @param {string} resumeText - Raw text extracted from a resume
 * @returns {Promise<Array>} - Array of experience objects
 */
async function extractExperienceWithLLM(resumeText) {
  try {
    console.log("Extracting experience with LLM");

    const prompt = `You are a resume parsing assistant that must output ONLY valid JSON.
STRICT REQUIREMENTS:
- Output must be a single valid JSON object with ONLY an experience array
- Do not include any text or comments before or after the JSON
- Do not include any explanations
- Be precise about job titles, companies, and dates

Extract ALL work experience from this resume and output EXACTLY this JSON structure:
{
  "experience": [
    {
      "title": "Software Engineer",
      "company": "Company Name",
      "location": "City, State",
      "startDate": "YYYY-MM",
      "endDate": "YYYY-MM or null if current",
      "description": "Job description"
    }
  ]
}

Resume text to parse:
${resumeText}`;

    // Call the LLM with the prompt - force delay to avoid throttling
    const llmResponse = await getLLMResponse(prompt, {
      forceDelay: true,
      customDelay: 5000,
    });
    console.log("Experience extraction response received");

    // Extract JSON from the response
    let experience = [];
    try {
      // Find JSON object in the response
      const jsonMatch = llmResponse.match(/\{[\s\S]*"experience"[\s\S]*\}/);
      if (jsonMatch) {
        const experienceJson = JSON.parse(jsonMatch[0]);
        if (Array.isArray(experienceJson.experience)) {
          experience = experienceJson.experience
            .filter((exp) => exp && typeof exp === "object")
            .map((exp) => ({
              title: typeof exp.title === "string" ? exp.title.trim() : "",
              company:
                typeof exp.company === "string" ? exp.company.trim() : "",
              location:
                typeof exp.location === "string" ? exp.location.trim() : "",
              startDate:
                typeof exp.startDate === "string" ? exp.startDate.trim() : "",
              endDate: exp.endDate
                ? typeof exp.endDate === "string"
                  ? exp.endDate.trim()
                  : null
                : null,
              description:
                typeof exp.description === "string"
                  ? exp.description.trim()
                  : "",
            }))
            .filter((exp) => exp.title || exp.company || exp.description);
        }
      }
    } catch (error) {
      console.error("Error parsing experience JSON:", error);
    }

    console.log(`Extracted ${experience.length} experience items`);
    return experience;
  } catch (error) {
    console.error("Error extracting experience:", error);
    return [];
  }
}

/**
 * Extract projects from resume text using an LLM
 * @param {string} resumeText - Raw text extracted from a resume
 * @returns {Promise<Array>} - Array of project objects
 */
async function extractProjectsWithLLM(resumeText) {
  try {
    console.log("Extracting projects with LLM");

    const prompt = `You are a resume parsing assistant that must output ONLY valid JSON.
STRICT REQUIREMENTS:
- Output must be a single valid JSON object with ONLY a projects array
- Do not include any text or comments before or after the JSON
- Do not include any explanations
- Include all technologies used in each project

Extract ALL projects from this resume and output EXACTLY this JSON structure:
{
  "projects": [
    {
      "name": "Project Name",
      "description": "Project description",
      "technologies": ["tech1", "tech2"],
      "url": "project url or empty string"
    }
  ]
}

Resume text to parse:
${resumeText}`;

    // Call the LLM with the prompt - force delay to avoid throttling
    const llmResponse = await getLLMResponse(prompt, {
      forceDelay: true,
      customDelay: 5000,
    });
    console.log("Projects extraction response received");

    // Extract JSON from the response
    let projects = [];
    try {
      // Find JSON object in the response
      const jsonMatch = llmResponse.match(/\{[\s\S]*"projects"[\s\S]*\}/);
      if (jsonMatch) {
        const projectsJson = JSON.parse(jsonMatch[0]);
        if (Array.isArray(projectsJson.projects)) {
          projects = projectsJson.projects
            .filter((proj) => proj && typeof proj === "object")
            .map((proj) => ({
              name: typeof proj.name === "string" ? proj.name.trim() : "",
              description:
                typeof proj.description === "string"
                  ? proj.description.trim()
                  : "",
              technologies: Array.isArray(proj.technologies)
                ? proj.technologies
                    .filter(
                      (tech) =>
                        typeof tech === "string" && tech.trim().length > 0
                    )
                    .map((tech) => tech.trim())
                : [],
              url: typeof proj.url === "string" ? proj.url.trim() : "",
            }))
            .filter(
              (proj) =>
                proj.name ||
                proj.description ||
                (Array.isArray(proj.technologies) &&
                  proj.technologies.length > 0)
            );
        }
      }
    } catch (error) {
      console.error("Error parsing projects JSON:", error);
    }

    console.log(`Extracted ${projects.length} projects`);
    return projects;
  } catch (error) {
    console.error("Error extracting projects:", error);
    return [];
  }
}

/**
 * Extract structured information from resume text using an LLM with separate calls for each section
 * @param {string} resumeText - Raw text extracted from a resume
 * @returns {Promise<Object>} - Structured resume data
 */
async function extractResumeDataWithLLM(resumeText) {
  try {
    console.log("Starting LLM-based resume extraction with separate calls");

    // Make separate LLM calls for each section
    const [skills, experience, projects] = await Promise.all([
      extractSkillsWithLLM(resumeText),
      extractExperienceWithLLM(resumeText),
      extractProjectsWithLLM(resumeText),
    ]);

    console.log("All extraction calls completed");
    console.log(
      `Skills: ${skills.length}, Experience: ${experience.length}, Projects: ${projects.length}`
    );

    // Return the combined data
    return {
      skills,
      experience,
      projects,
    };
  } catch (error) {
    console.error("Error extracting resume data with LLM:", error);
    return {
      skills: [],
      experience: [],
      projects: [],
    };
  }
}

/**
 * Parse resume text using LLM and format the results
 * @param {Buffer|string} pdfBuffer - PDF buffer or text content
 * @returns {Promise<Object>} - Parsed resume data
 */
async function parseResumeWithLLM(pdfBuffer) {
  try {
    let rawText = "";

    // Extract text from the PDF or use the provided text
    if (Buffer.isBuffer(pdfBuffer)) {
      try {
        // Use PDF parsing library to get text
        const pdfParse = (await import("pdf-parse")).default;
        const fallbackData = await pdfParse(pdfBuffer, {
          max: 15 * 1024 * 1024, // 15MB limit
        });

        if (
          fallbackData &&
          fallbackData.text &&
          fallbackData.text.trim().length > 0
        ) {
          rawText = fallbackData.text;
          console.log(
            "PDF parsing successful, retrieved text length:",
            rawText.length
          );
        } else {
          // If the input might already be text, try to use it directly
          rawText = pdfBuffer.toString("utf8");
          console.log("Attempting to use buffer as text directly");
        }
      } catch (pdfError) {
        console.error("Error parsing PDF:", pdfError);
        // Try to use buffer as text directly as a last resort
        try {
          rawText = pdfBuffer.toString("utf8");
          console.log("Attempting to use buffer as text directly");
        } catch (textError) {
          console.error("Failed to extract text:", textError);
          return {
            skills: [],
            experience: [],
            projects: [],
            rawText: "",
          };
        }
      }
    } else if (typeof pdfBuffer === "string") {
      // The input is already text
      rawText = pdfBuffer;
      console.log(`Using provided text content, length: ${rawText.length}`);
    } else if (pdfBuffer && typeof pdfBuffer === "object" && pdfBuffer.text) {
      // This might be the result of pdf-parse directly
      rawText = pdfBuffer.text;
      console.log(
        `Using text from pdf-parse object, length: ${rawText.length}`
      );
    } else {
      console.error("Invalid input type");
      return {
        skills: [],
        experience: [],
        projects: [],
        rawText: "",
      };
    }

    // Extract data using LLM
    const extractedData = await extractResumeDataWithLLM(rawText);
    console.log("LLM extraction complete. Data structure:");
    console.log(`Skills: ${extractedData.skills.length} items`);
    console.log(`Experience: ${extractedData.experience.length} items`);
    console.log(`Projects: ${extractedData.projects.length} items`);

    // Return the extracted and normalized data
    return {
      ...extractedData,
      rawText,
    };
  } catch (error) {
    console.error("Error parsing resume with LLM:", error);
    return {
      skills: [],
      experience: [],
      projects: [],
      rawText: "",
    };
  }
}

export { parseResumeWithLLM, extractResumeDataWithLLM };
