/**
 * Simplified Resume Parser
 *
 * This module implements a focused resume parsing algorithm that extracts:
 * 1. Skills
 * 2. Experience
 * 3. Projects
 *
 * It works with the existing pdf-parse library, no additional dependencies required.
 */

import pdfParse from "pdf-parse";

/**
 * Main function to parse resume text
 * @param {Buffer} pdfBuffer - PDF buffer or text content
 * @returns {Promise<Object>} - Parsed resume data
 */
export async function parseResumeText(pdfBuffer) {
  try {
    console.log("Starting simplified resume parsing");
    let rawText = "";

    // Check if input is already text content
    if (Buffer.isBuffer(pdfBuffer)) {
      try {
        // Parse PDF to extract text
        const data = await pdfParse(pdfBuffer, {
          pagerender: (pageData) => {
            return pageData.getTextContent({
              normalizeWhitespace: true,
              disableCombineTextItems: false,
            });
          },
        });

        // Extract the text content
        rawText = data.text;
      } catch (pdfError) {
        console.error("Error parsing PDF:", pdfError);

        // If the input might already be text, try to use it directly
        try {
          rawText = pdfBuffer.toString("utf8");
          console.log("Attempting to use buffer as text directly");
        } catch (textError) {
          throw new Error(
            "Failed to extract text from PDF and buffer is not valid text"
          );
        }
      }
    } else if (typeof pdfBuffer === "string") {
      // The input is already text
      rawText = pdfBuffer;
    } else if (pdfBuffer && typeof pdfBuffer === "object" && pdfBuffer.text) {
      // This might be the result of pdf-parse directly
      rawText = pdfBuffer.text;
    } else {
      throw new Error(
        "Invalid input type. Expected Buffer, string, or pdf-parse result."
      );
    }

    // Process the text to extract sections
    const sections = extractSectionsFromText(rawText);
    console.log(
      `Found ${Object.keys(sections).length} sections: ${Object.keys(
        sections
      ).join(", ")}`
    );

    // Extract skills, experience, and projects
    const skills = extractSkills(sections);
    const experience = extractExperience(sections);
    const projects = extractProjects(sections);

    console.log(
      `Extracted ${skills.length} skills, ${experience.length} experiences, ${projects.length} projects`
    );

    return {
      skills,
      experience,
      projects,
      rawText,
    };
  } catch (error) {
    console.error("Error parsing resume:", error);
    throw error;
  }
}

/**
 * Extract sections from text
 * @param {string} text - Raw text from resume
 * @returns {Object} - Object with sections as keys and their content as values
 */
function extractSectionsFromText(text) {
  const sections = {};
  const sectionHeaders = [
    "SKILLS",
    "TECHNICAL SKILLS",
    "SKILL SET",
    "TECHNOLOGIES",
    "TECH STACK",
    "PROGRAMMING LANGUAGES",
    "LANGUAGES",
    "TOOLS",
    "EXPERIENCE",
    "WORK EXPERIENCE",
    "EMPLOYMENT",
    "PROFESSIONAL EXPERIENCE",
    "WORK HISTORY",
    "PROJECTS",
    "PROJECT EXPERIENCE",
    "PERSONAL PROJECTS",
    "ACADEMIC PROJECTS",
    "KEY PROJECTS",
  ];

  // Normalize text into lines
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  let currentSection = null;
  const sectionContent = {};

  // First pass: identify sections by exact headers
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineUpper = line.toUpperCase();

    // Check if this line is a standalone section header (exact match or contains the header)
    let matchedHeader = null;
    for (const header of sectionHeaders) {
      if (
        lineUpper === header ||
        lineUpper.startsWith(header + ":") ||
        lineUpper.startsWith(header + " ")
      ) {
        matchedHeader = header;
        break;
      }
    }

    if (matchedHeader) {
      // Map similar headers to standard categories
      if (/SKILL|TECH|PROGRAMMING|LANGUAGES|TOOLS/i.test(matchedHeader)) {
        currentSection = "SKILLS";
      } else if (/EXPERIENCE|EMPLOYMENT|WORK/i.test(matchedHeader)) {
        currentSection = "EXPERIENCE";
      } else if (/PROJECT/i.test(matchedHeader)) {
        currentSection = "PROJECTS";
      }

      if (!sectionContent[currentSection]) {
        sectionContent[currentSection] = [];
      }
    } else if (currentSection) {
      sectionContent[currentSection].push(line);
    }
  }

  // If no sections were found with exact matches, try looser matching
  if (Object.keys(sectionContent).length === 0) {
    console.log("No exact section headers found, trying looser matching...");

    // Look for lines that are likely section headers
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineUpper = line.toUpperCase();

      // Check for standalone words that match section names
      if (
        lineUpper === "SKILLS" ||
        lineUpper === "SKILL" ||
        /^SKILLS?$/.test(lineUpper)
      ) {
        currentSection = "SKILLS";
        if (!sectionContent[currentSection]) {
          sectionContent[currentSection] = [];
        }
      } else if (lineUpper === "EXPERIENCE" || /^EXPERIENCE$/.test(lineUpper)) {
        currentSection = "EXPERIENCE";
        if (!sectionContent[currentSection]) {
          sectionContent[currentSection] = [];
        }
      } else if (
        lineUpper === "PROJECTS" ||
        lineUpper === "PROJECT" ||
        /^PROJECTS?$/.test(lineUpper)
      ) {
        currentSection = "PROJECTS";
        if (!sectionContent[currentSection]) {
          sectionContent[currentSection] = [];
        }
      } else if (currentSection) {
        sectionContent[currentSection].push(line);
      }
      // Handle special case for skills sections that might be labeled as categories
      else if (
        line.includes("Programming Languages:") ||
        line.includes("Artificial Intelligence:") ||
        line.includes("Web Development:") ||
        line.includes("Databases & Tools:") ||
        line.includes("Other Skills:")
      ) {
        currentSection = "SKILLS";
        if (!sectionContent[currentSection]) {
          sectionContent[currentSection] = [];
        }
        sectionContent[currentSection].push(line);
      }
    }
  }

  return sectionContent;
}

/**
 * Extract skills from sections
 * @param {Object} sections - Sections extracted from text
 * @returns {Array} - Array of skills
 */
function extractSkills(sections) {
  const skillsSection = sections["SKILLS"] || [];
  if (!skillsSection.length) return [];

  let allSkills = [];

  for (const line of skillsSection) {
    // Check for common resume formats with bullet points
    if (
      line.startsWith("•") ||
      line.startsWith("◦") ||
      line.startsWith("-") ||
      line.startsWith("*")
    ) {
      const cleanedLine = line.replace(/^[•◦\-*]\s*/, "").trim();

      // If the line after bullet includes a category with colon (e.g., "Programming Languages: Python, JavaScript")
      if (
        cleanedLine.includes(":") &&
        cleanedLine.indexOf(":") < cleanedLine.length / 2
      ) {
        const colonIndex = cleanedLine.indexOf(":");
        const skillsList = cleanedLine.substring(colonIndex + 1).trim();

        // Split the skills by comma
        const skillsInLine = skillsList
          .split(/[,|;]/)
          .map((skill) => skill.trim())
          .filter((skill) => skill.length > 1);

        allSkills.push(...skillsInLine);
      } else {
        // The bullet point itself might be a skill
        allSkills.push(cleanedLine);
      }
    }
    // Check if line contains a category with a list of skills
    else if (line.includes(":") && line.indexOf(":") < line.length / 2) {
      // Something like "Programming Languages: Java, Python, JavaScript"
      const colonIndex = line.indexOf(":");
      const category = line.substring(0, colonIndex).trim();
      const skillsList = line.substring(colonIndex + 1).trim();

      // Skip if this appears to be a job title or date
      if (
        /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sept|Oct|Nov|Dec|January|February|March|April|May|June|July|August|September|October|November|December|20\d{2})\b/i.test(
          skillsList
        )
      ) {
        continue;
      }

      const skillsInLine = skillsList
        .split(/[,|;]/)
        .map((skill) => skill.trim())
        .filter((skill) => skill.length > 1);

      allSkills.push(...skillsInLine);
    } else if (line.includes(",")) {
      // List of skills separated by commas
      const skillsInLine = line
        .split(",")
        .map((skill) => skill.replace(/^[-•*]\s*/, "").trim())
        .filter((skill) => skill.length > 1);

      allSkills.push(...skillsInLine);
    } else if (
      line.length > 2 &&
      !line.match(/^\d\.|\(\d\)/) &&
      !line.toLowerCase().includes("skill")
    ) {
      // Standalone skill, not a numbered list or section header
      allSkills.push(line.replace(/^[-•*]\s*/, "").trim());
    }
  }

  // Handle special case - if no skills were found but we have lines that might contain skills
  if (allSkills.length === 0 && skillsSection.length > 0) {
    // Look for lines with common programming languages, frameworks, etc.
    const skillIndicators = [
      "python",
      "javascript",
      "java",
      "c\\+\\+",
      "html",
      "css",
      "react",
      "node",
      "typescript",
      "sql",
      "mongodb",
      "aws",
      "docker",
      "git",
      "machine learning",
      "ai",
      "data",
    ];

    const regex = new RegExp(skillIndicators.join("|"), "i");

    for (const line of skillsSection) {
      if (regex.test(line)) {
        // This line likely contains skills
        allSkills.push(
          ...line
            .split(/[,|;:]/)
            .map((part) => part.replace(/^[-•*]\s*/, "").trim())
            .filter((part) => part.length > 1 && part.length < 50)
        );
      }
    }
  }

  // Remove duplicates and clean up
  return [...new Set(allSkills)]
    .filter((skill) => skill.length > 1 && skill.length < 50)
    .map((skill) => skill.trim().replace(/\s+/g, " "));
}

/**
 * Extract experience from sections
 * @param {Object} sections - Sections extracted from text
 * @returns {Array} - Array of experience descriptions
 */
function extractExperience(sections) {
  const experienceSection = sections["EXPERIENCE"] || [];
  if (!experienceSection.length) return [];

  const experiences = [];
  let currentExperience = "";
  let bulletPoints = [];
  let inExperienceItem = false;

  for (let i = 0; i < experienceSection.length; i++) {
    const line = experienceSection[i];
    const nextLine =
      i < experienceSection.length - 1 ? experienceSection[i + 1] : "";

    // Check if line starts with a bullet (indicates start of new experience or bullet point)
    if (line.trim().startsWith("•") || line.trim().startsWith("◦")) {
      // If we have an existing experience saved, add it before starting a new one
      if (inExperienceItem && currentExperience) {
        if (bulletPoints.length > 0) {
          experiences.push(`${currentExperience}: ${bulletPoints.join(" | ")}`);
        } else {
          experiences.push(currentExperience);
        }
        currentExperience = "";
        bulletPoints = [];
      }

      // If followed by a company name or date pattern, this starts a new experience
      const cleanLine = line.replace(/^[•◦]\s*/, "").trim();

      // Check for company/position (likely to contain date patterns)
      const isCompanyLine =
        /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\b|\d{4}\s*[-–]\s*(\d{4}|Present|\w+)/i.test(
          cleanLine
        ) || /\b([A-Z][a-z]{2,}\.?\s*){2,}\b/.test(cleanLine); // Proper noun pattern

      if (
        isCompanyLine ||
        i === 0 ||
        /Remote|Intern|Developer|Engineer|Manager|Director|Consultant|Analyst|Designer/.test(
          cleanLine
        )
      ) {
        currentExperience = cleanLine;
        inExperienceItem = true;
      } else {
        // This is a bullet point for the current experience
        bulletPoints.push(cleanLine);
      }
    }
    // Check for sub-bullet points (often used for job details)
    else if (
      line.trim().startsWith("◦") ||
      line.trim().startsWith("-") ||
      line.trim().startsWith("*")
    ) {
      bulletPoints.push(line.replace(/^[◦\-*]\s*/, "").trim());
    }
    // Look for date patterns or Remote/title words that indicate new experience
    else if (
      (/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\b|\d{4}\s*[-–]\s*(\d{4}|Present)/i.test(
        line
      ) ||
        /Remote|Full[ -]Stack|Engineer|Developer|Manager|Director|Consultant|Analyst|Designer/.test(
          line
        )) &&
      !currentExperience.includes(line)
    ) {
      // Save existing experience if there is one
      if (inExperienceItem && currentExperience) {
        if (bulletPoints.length > 0) {
          experiences.push(`${currentExperience}: ${bulletPoints.join(" | ")}`);
        } else {
          experiences.push(currentExperience);
        }
      }

      currentExperience = line;
      bulletPoints = [];
      inExperienceItem = true;
    } else if (inExperienceItem) {
      // Maybe part of the company/position information
      if (bulletPoints.length === 0) {
        currentExperience += " " + line;
      } else {
        // Maybe continuation of the last bullet point
        if (
          bulletPoints.length > 0 &&
          line.trim() &&
          !line.trim().startsWith("•") &&
          !line.trim().startsWith("◦") &&
          !line.trim().startsWith("-") &&
          !line.trim().startsWith("*")
        ) {
          bulletPoints[bulletPoints.length - 1] += " " + line.trim();
        } else if (line.trim()) {
          bulletPoints.push(line.trim());
        }
      }
    }
  }

  // Add the last experience
  if (inExperienceItem && currentExperience) {
    if (bulletPoints.length > 0) {
      experiences.push(`${currentExperience}: ${bulletPoints.join(" | ")}`);
    } else {
      experiences.push(currentExperience);
    }
  }

  // Special case for if we couldn't extract structured experience
  if (experiences.length === 0 && experienceSection.length > 0) {
    // Look for lines with date patterns that might indicate work experience
    const dateRegex =
      /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\b|\d{4}\s*[-–]\s*(\d{4}|Present)/i;

    let i = 0;
    while (i < experienceSection.length) {
      const line = experienceSection[i];
      if (dateRegex.test(line)) {
        // This is likely an experience entry
        let exp = line;
        let j = i + 1;

        // Include following lines if they seem to be related (bullet points, etc.)
        while (
          j < experienceSection.length &&
          !dateRegex.test(experienceSection[j]) &&
          j - i < 5
        ) {
          // limit to 5 lines per experience
          exp += " | " + experienceSection[j].replace(/^[•◦\-*]\s*/, "");
          j++;
        }

        experiences.push(exp);
        i = j;
      } else {
        i++;
      }
    }
  }

  return experiences;
}

/**
 * Extract projects from sections
 * @param {Object} sections - Sections extracted from text
 * @returns {Array} - Array of project descriptions
 */
function extractProjects(sections) {
  const projectsSection = sections["PROJECTS"] || [];
  if (!projectsSection.length) return [];

  const projects = [];
  let currentProject = "";
  let bulletPoints = [];
  let inProjectItem = false;

  for (let i = 0; i < projectsSection.length; i++) {
    const line = projectsSection[i].trim();
    const nextLine =
      i < projectsSection.length - 1 ? projectsSection[i + 1].trim() : "";

    // Check if line starts with a bullet (indicates start of new project or bullet point)
    if (line.startsWith("•") || line.startsWith("◦")) {
      // If we have an existing project saved, add it before starting a new one
      if (inProjectItem && currentProject) {
        if (bulletPoints.length > 0) {
          projects.push(`${currentProject}: ${bulletPoints.join(" | ")}`);
        } else {
          projects.push(currentProject);
        }
        currentProject = "";
        bulletPoints = [];
      }

      // Clean the line
      const cleanLine = line.replace(/^[•◦]\s*/, "").trim();

      // Check if this is a project title line (usually contains a name and possibly dates or GitHub/Website links)
      const isProjectTitleLine =
        /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\b|\d{4}\s*[-–]\s*(\d{4}|Present)/i.test(
          cleanLine
        ) ||
        /GitHub|Website|Web Application|Mobile App|App|Application|Platform|System|Framework|Tool/.test(
          cleanLine
        ) ||
        /-\s*Present\b/.test(cleanLine);

      if (isProjectTitleLine || i === 0) {
        currentProject = cleanLine;
        inProjectItem = true;
      } else {
        // This is a bullet point for the current project
        bulletPoints.push(cleanLine);
      }
    }
    // Check for sub-bullet points (often used for project details)
    else if (
      line.startsWith("-") ||
      line.startsWith("*") ||
      line.startsWith("◦")
    ) {
      bulletPoints.push(line.replace(/^[◦\-*]\s*/, "").trim());
    }
    // Check for project title format (with date pattern or GitHub/Website mention)
    else if (
      (/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\b|\d{4}\s*[-–]\s*(\d{4}|Present)/i.test(
        line
      ) ||
        /GitHub|Website|Web Application|Mobile App|App|Application|Platform|System|Framework|Tool/.test(
          line
        ) ||
        /-\s*Present\b/.test(line)) &&
      !line.startsWith("◦")
    ) {
      // Save existing project if there is one
      if (inProjectItem && currentProject) {
        if (bulletPoints.length > 0) {
          projects.push(`${currentProject}: ${bulletPoints.join(" | ")}`);
        } else {
          projects.push(currentProject);
        }
      }

      currentProject = line;
      bulletPoints = [];
      inProjectItem = true;
    } else if (inProjectItem) {
      // Maybe part of the project information
      if (bulletPoints.length === 0) {
        currentProject += " " + line;
      } else {
        // Maybe continuation of the last bullet point
        if (
          bulletPoints.length > 0 &&
          line.trim() &&
          !line.startsWith("•") &&
          !line.startsWith("◦") &&
          !line.startsWith("-") &&
          !line.startsWith("*")
        ) {
          bulletPoints[bulletPoints.length - 1] += " " + line;
        } else if (line.trim()) {
          bulletPoints.push(line);
        }
      }
    }
  }

  // Add the last project
  if (inProjectItem && currentProject) {
    if (bulletPoints.length > 0) {
      projects.push(`${currentProject}: ${bulletPoints.join(" | ")}`);
    } else {
      projects.push(currentProject);
    }
  }

  // Special case for if we couldn't extract structured projects
  if (projects.length === 0 && projectsSection.length > 0) {
    // Look for lines that might be project titles
    const projectTitleRegex =
      /\b([A-Z][a-z]+|\w+)(\s+-\s+|\s+:\s+|\s+–\s+)([A-Z][a-z]+|\w+)|\b(Website|GitHub|App|Web|Mobile|Platform|System|API)/i;

    let i = 0;
    while (i < projectsSection.length) {
      const line = projectsSection[i];
      if (projectTitleRegex.test(line)) {
        // This is likely a project entry
        let proj = line;
        let j = i + 1;

        // Include following lines if they seem to be related (bullet points, etc.)
        while (
          j < projectsSection.length &&
          !projectTitleRegex.test(projectsSection[j]) &&
          j - i < 5
        ) {
          // limit to 5 lines per project
          proj += " | " + projectsSection[j].replace(/^[•◦\-*]\s*/, "");
          j++;
        }

        projects.push(proj);
        i = j;
      } else {
        i++;
      }
    }
  }

  return projects;
}

/**
 * Format the parsed resume data
 * @param {Object} parsedResume - The parsed resume data
 * @returns {Object} - Formatted resume data
 */
export function formatResumeData(parsedResume) {
  return {
    skills: parsedResume.skills || [],
    experience: parsedResume.experience || [],
    projects: parsedResume.projects || [],
    rawText: parsedResume.rawText || "",
  };
}

export default {
  parseResumeText,
  formatResumeData,
};
