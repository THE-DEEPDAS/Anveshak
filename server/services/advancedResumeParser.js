/**
 * Advanced Resume Parser
 *
 * This module implements a comprehensive resume parsing algorithm that follows four main steps:
 * 1. Read text items from PDF file (using pdf.js)
 * 2. Group text items into lines
 * 3. Group lines into sections
 * 4. Extract resume data from sections
 *
 * Based on the OpenResume parser algorithm
 */

import * as pdfjs from "pdfjs-dist";
import fs from "fs/promises";
import path from "path";

// Set the pdf.js worker source
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

/**
 * Main function to parse a resume PDF file
 * @param {string} filePath - Path to the PDF file
 * @returns {Promise<Object>} - Parsed resume data
 */
export async function parseResumePdf(filePath) {
  try {
    console.log("Starting advanced resume parsing for:", filePath);

    // Step 1: Extract text items from PDF
    const textItems = await extractTextItemsFromPdf(filePath);
    console.log(`Extracted ${textItems.length} text items from PDF`);

    // Step 2: Group text items into lines
    const lines = groupTextItemsIntoLines(textItems);
    console.log(`Grouped into ${lines.length} lines`);

    // Step 3: Group lines into sections
    const sections = groupLinesIntoSections(lines);
    console.log(`Identified ${Object.keys(sections).length} sections`);

    // Step 4: Extract resume data from sections
    const resumeData = extractResumeFromSections(sections);
    console.log("Resume parsing complete");

    return resumeData;
  } catch (error) {
    console.error("Error parsing resume:", error);
    throw error;
  }
}

/**
 * Step 1: Extract text items from PDF
 * @param {string} filePath - Path to the PDF file
 * @returns {Promise<Array>} - Array of text items with metadata
 */
async function extractTextItemsFromPdf(filePath) {
  try {
    // Read the PDF file into an array buffer
    const data = await fs.readFile(filePath);
    const arrayBuffer = new Uint8Array(data);

    // Load the PDF document
    const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
    const pdfDoc = await loadingTask.promise;
    console.log(`PDF document loaded with ${pdfDoc.numPages} pages`);

    const textItems = [];

    // Extract text content from each page
    for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const content = await page.getTextContent();

      content.items.forEach((item, index) => {
        if (!item.str.trim()) return; // Skip empty items

        // Extract text and position information
        const { str, transform, fontName, bold = false } = item;
        const x1 = transform[4]; // x position
        const x2 = x1 + calculateTextWidth(str, fontName); // approximate end x position
        const y = transform[5]; // y position

        // Determine if this item starts a new line
        const isNewLine =
          index === 0 ||
          Math.abs(y - content.items[index - 1].transform[5]) > 5;

        // Determine if the text is bold based on font name (approximate)
        const isBold = bold || fontName.toLowerCase().includes("bold");

        // Check if it's all uppercase (might indicate a section title)
        const isAllCaps =
          str === str.toUpperCase() && str !== str.toLowerCase();

        textItems.push({
          text: str,
          x1,
          x2,
          y,
          bold: isBold,
          allCaps: isAllCaps,
          newLine: isNewLine,
          pageNum,
        });
      });
    }

    // Sort text items by page, y position (descending), and x position (ascending)
    return textItems.sort((a, b) => {
      if (a.pageNum !== b.pageNum) return a.pageNum - b.pageNum;
      if (Math.abs(a.y - b.y) > 5) return b.y - a.y; // Descending y
      return a.x1 - b.x1; // Ascending x
    });
  } catch (error) {
    console.error("Error extracting text from PDF:", error);
    throw error;
  }
}

/**
 * Helper function to calculate approximate text width
 * @param {string} text - The text string
 * @param {string} fontName - The font name
 * @returns {number} - Approximate width of the text
 */
function calculateTextWidth(text, fontName) {
  // This is a simplified approximation
  // For a more accurate calculation, we would need font metrics
  const isBold = fontName.toLowerCase().includes("bold");
  const isMonospace = fontName.toLowerCase().includes("mono");

  let avgCharWidth = 5.5; // default
  if (isBold) avgCharWidth = 6.5;
  if (isMonospace) avgCharWidth = 6.0;

  return text.length * avgCharWidth;
}

/**
 * Step 2: Group text items into lines
 * @param {Array} textItems - Array of text items with metadata
 * @returns {Array} - Array of line objects
 */
function groupTextItemsIntoLines(textItems) {
  if (!textItems.length) return [];

  // Calculate average character width to determine if items should be merged
  let totalWidth = 0;
  let totalChars = 0;

  textItems.forEach((item) => {
    if (!item.bold && item.text.trim()) {
      totalWidth += item.x2 - item.x1;
      totalChars += item.text.length;
    }
  });

  const avgCharWidth = totalChars > 0 ? totalWidth / totalChars : 5.5;
  const mergeThreshold = avgCharWidth * 0.8; // If items are closer than this, merge them

  // Group items into lines based on y-position and merge adjacent items
  const lines = [];
  let currentLine = [];
  let currentY = null;

  for (const item of textItems) {
    // If this is a new line or significant y-position change
    if (currentY === null || Math.abs(item.y - currentY) > 5) {
      if (currentLine.length > 0) {
        lines.push(organizeLineItems(currentLine));
      }
      currentLine = [item];
      currentY = item.y;
    } else {
      // Check if this item should be merged with the previous one
      const prevItem = currentLine[currentLine.length - 1];

      if (item.x1 - prevItem.x2 <= mergeThreshold) {
        // Merge with previous item
        prevItem.text += item.text;
        prevItem.x2 = item.x2;
      } else {
        // Add as separate item in the same line
        currentLine.push(item);
      }
    }
  }

  // Add the last line if it exists
  if (currentLine.length > 0) {
    lines.push(organizeLineItems(currentLine));
  }

  return lines;
}

/**
 * Helper function to organize items in a line
 * @param {Array} lineItems - Items in a line
 * @returns {Object} - Line object with text content and metadata
 */
function organizeLineItems(lineItems) {
  // Sort items by x position
  const sortedItems = [...lineItems].sort((a, b) => a.x1 - b.x1);

  // Combine text content of the line
  const fullText = sortedItems.map((item) => item.text).join(" ");

  // Determine line properties
  const isBold = sortedItems.every((item) => item.bold);
  const isAllCaps =
    fullText === fullText.toUpperCase() && fullText !== fullText.toLowerCase();
  const hasBulletPoint =
    fullText.trim().startsWith("•") || fullText.trim().startsWith("-");

  return {
    text: fullText,
    items: sortedItems,
    bold: isBold,
    allCaps: isAllCaps,
    bullet: hasBulletPoint,
    y: sortedItems[0].y,
    pageNum: sortedItems[0].pageNum,
  };
}

/**
 * Step 3: Group lines into sections
 * @param {Array} lines - Array of line objects
 * @returns {Object} - Object with section names as keys and arrays of lines as values
 */
function groupLinesIntoSections(lines) {
  if (!lines.length) return {};

  const sections = {};
  let currentSection = "PROFILE"; // Default section for header content

  // Common section titles in resumes
  const sectionKeywords = [
    "EDUCATION",
    "EXPERIENCE",
    "WORK EXPERIENCE",
    "EMPLOYMENT",
    "SKILLS",
    "TECHNICAL SKILLS",
    "PROFICIENCIES",
    "PROJECTS",
    "PROJECT EXPERIENCE",
    "CERTIFICATIONS",
    "ACHIEVEMENTS",
    "HONORS",
    "AWARDS",
    "VOLUNTEER",
    "VOLUNTEERING",
    "COMMUNITY SERVICE",
    "PUBLICATIONS",
    "PRESENTATIONS",
    "RESEARCH",
    "LANGUAGES",
    "INTERESTS",
    "ACTIVITIES",
    "OBJECTIVE",
    "SUMMARY",
    "PROFILE",
    "ABOUT",
  ];

  // Initialize the PROFILE section
  sections[currentSection] = [];

  // Process each line
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if this line is a section title
    const isSectionTitle =
      // Main heuristic: all caps, bold, single item in the line
      (line.bold && line.allCaps && line.items.length === 1) ||
      // Fallback heuristic: keyword matching
      sectionKeywords.some(
        (keyword) =>
          line.text.toUpperCase().includes(keyword) &&
          line.text.split(" ").length <= 4 && // Not too long
          (line.bold || (i > 0 && lines[i - 1].text.trim() === "")) // Is bold or preceded by blank line
      );

    if (isSectionTitle) {
      // Clean up the section name
      currentSection = line.text
        .replace(/[^\w\s]/g, "")
        .trim()
        .toUpperCase();

      // If this section name is not already a key in the sections object, add it
      if (!sections[currentSection]) {
        sections[currentSection] = [];
      }
    }

    // Add the line to the current section
    sections[currentSection].push(line);
  }

  // Process subsections for EDUCATION and EXPERIENCE sections
  const subsectionSections = [
    "EDUCATION",
    "EXPERIENCE",
    "WORK EXPERIENCE",
    "EMPLOYMENT",
    "VOLUNTEER",
  ];

  for (const sectionName of Object.keys(sections)) {
    if (!subsectionSections.some((keyword) => sectionName.includes(keyword)))
      continue;

    const sectionLines = sections[sectionName];
    const subsections = parseSubsections(sectionLines);

    // Replace the original lines with organized subsections
    if (subsections.length > 0) {
      sections[sectionName] = subsections;
    }
  }

  return sections;
}

/**
 * Helper function to parse subsections within a section
 * @param {Array} sectionLines - Lines in a section
 * @returns {Array} - Array of subsection objects
 */
function parseSubsections(sectionLines) {
  if (sectionLines.length <= 1) return [];

  const subsections = [];
  let currentSubsection = [];

  // Skip the section title
  for (let i = 1; i < sectionLines.length; i++) {
    const line = sectionLines[i];
    const nextLine = i < sectionLines.length - 1 ? sectionLines[i + 1] : null;

    // Add the line to the current subsection
    currentSubsection.push(line);

    // Check if this is the end of a subsection
    // Criteria: 1) Gap between lines is larger than usual, or 2) next line is bold and current isn't
    const isEndOfSubsection =
      (nextLine && Math.abs(line.y - nextLine.y) > 15) || // Gap between lines
      (nextLine && nextLine.bold && !line.bold && !nextLine.bullet); // Bold transition

    if (isEndOfSubsection || i === sectionLines.length - 1) {
      if (currentSubsection.length > 0) {
        subsections.push(currentSubsection);
        currentSubsection = [];
      }
    }
  }

  return subsections;
}

/**
 * Step 4: Extract resume data from sections
 * @param {Object} sections - Object with section names as keys and arrays of lines as values
 * @returns {Object} - Structured resume data
 */
function extractResumeFromSections(sections) {
  const resume = {
    profile: extractProfileData(sections["PROFILE"] || []),
    objective: extractObjectiveData(sections["OBJECTIVE"] || []),
    education: extractEducationData(sections["EDUCATION"] || []),
    experience: extractExperienceData(
      sections["EXPERIENCE"] ||
        sections["WORK EXPERIENCE"] ||
        sections["EMPLOYMENT"] ||
        []
    ),
    skills: extractSkillsData(
      sections["SKILLS"] || sections["TECHNICAL SKILLS"] || []
    ),
    projects: extractProjectsData(
      sections["PROJECTS"] || sections["PROJECT EXPERIENCE"] || []
    ),
    volunteer: extractVolunteerData(
      sections["VOLUNTEER"] || sections["VOLUNTEERING"] || []
    ),
    achievements: extractAchievementsData(
      sections["ACHIEVEMENTS"] || sections["HONORS"] || sections["AWARDS"] || []
    ),
  };

  return resume;
}

/**
 * Extract profile data from the PROFILE section
 * @param {Array} lines - Lines in the PROFILE section
 * @returns {Object} - Profile data
 */
function extractProfileData(lines) {
  if (!lines.length) return {};

  const profile = {
    name: "",
    email: "",
    phone: "",
    location: "",
    url: "",
  };

  // Scoring system for each field
  const scoreFunctions = {
    name: (text) => {
      let score = 0;
      // Contains only letters, spaces or periods
      if (/^[a-zA-Z\s\.]+$/.test(text)) score += 3;
      // Is bolded
      if (text.bold) score += 2;
      // Contains all uppercase letters
      if (text.allCaps) score += 2;
      // Contains @
      if (text.includes("@")) score -= 4;
      // Contains number
      if (/\d/.test(text)) score -= 4;
      // Contains ,
      if (text.includes(",")) score -= 4;
      // Contains /
      if (text.includes("/")) score -= 4;
      return score;
    },

    email: (text) => {
      let score = 0;
      // Match email format
      if (/\S+@\S+\.\S+/.test(text)) score += 4;
      // Contains @
      if (text.includes("@")) score += 2;
      // Is bolded
      if (text.bold) score -= 1;
      return score;
    },

    phone: (text) => {
      let score = 0;
      // Match phone format
      if (/\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}/.test(text)) score += 4;
      // Contains numbers
      if (/\d/.test(text)) score += 2;
      // Is bolded
      if (text.bold) score -= 1;
      return score;
    },

    location: (text) => {
      let score = 0;
      // Match city and state format
      if (/[A-Z][a-zA-Z\s]+, [A-Z]{2}/.test(text)) score += 3;
      // Contains comma
      if (text.includes(",")) score += 2;
      // Is bolded
      if (text.bold) score -= 1;
      return score;
    },

    url: (text) => {
      let score = 0;
      // Match url format
      if (/\S+\.[a-z]+\/\S+/.test(text)) score += 3;
      // Contains .com, .net, etc.
      if (/\.(com|net|org|io|me)/.test(text)) score += 2;
      // Contains http:// or https://
      if (text.includes("http")) score += 2;
      // Is bolded
      if (text.bold) score -= 1;
      return score;
    },
  };

  // Score each line for each field and find the best match
  for (const field of Object.keys(profile)) {
    let bestScore = -Infinity;
    let bestText = "";

    for (const line of lines) {
      const score = scoreFunctions[field](line.text);
      if (score > bestScore) {
        bestScore = score;
        bestText = line.text;
      }
    }

    // Only set the field if the score is positive
    if (bestScore > 0) {
      profile[field] = bestText.trim();
    }
  }

  return profile;
}

/**
 * Extract objective data from the OBJECTIVE section
 * @param {Array} lines - Lines in the OBJECTIVE section
 * @returns {string} - Objective statement
 */
function extractObjectiveData(lines) {
  if (!lines.length) return "";

  // Skip the section title
  const objectiveLines = lines.slice(1);

  // Combine all lines into a single objective statement
  return objectiveLines
    .map((line) => line.text)
    .join(" ")
    .trim();
}

/**
 * Extract education data from the EDUCATION section
 * @param {Array} lines - Lines or subsections in the EDUCATION section
 * @returns {Array} - Array of education entries
 */
function extractEducationData(lines) {
  if (!lines.length) return [];

  // Check if lines is a nested array (subsections)
  const isSubsectioned = Array.isArray(lines[0]);

  if (isSubsectioned) {
    // Process each subsection
    return lines.map((subsection) => extractEducationEntry(subsection));
  } else {
    // Skip the section title and try to find schools
    const educationLines = lines.slice(1);
    const schools = [];
    let currentSchool = null;

    for (const line of educationLines) {
      // Check for school name (bold and not a bullet point)
      if (line.bold && !line.bullet) {
        if (currentSchool) {
          schools.push(currentSchool);
        }
        currentSchool = { name: line.text, degree: "", date: "", gpa: "" };
      } else if (currentSchool) {
        // Add other information to the current school
        if (
          /bachelor|master|associate|ph\.?d|doctorate|degree|diploma/i.test(
            line.text
          )
        ) {
          currentSchool.degree = line.text;
        } else if (/\b(gpa|grade)\b.*?\b[0-4]\.\d{1,2}\b/i.test(line.text)) {
          const gpaMatch = line.text.match(/\b[0-4]\.\d{1,2}\b/);
          if (gpaMatch) {
            currentSchool.gpa = gpaMatch[0];
          }
        } else if (
          /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|may|june|july|august|september|october|november|december|spring|summer|fall|winter|20\d{2}|19\d{2}|present)\b/i.test(
            line.text
          )
        ) {
          currentSchool.date = line.text;
        }
      }
    }

    // Add the last school if it exists
    if (currentSchool) {
      schools.push(currentSchool);
    }

    return schools;
  }
}

/**
 * Helper function to extract education entry from a subsection
 * @param {Array} subsection - Lines in an education subsection
 * @returns {Object} - Education entry
 */
function extractEducationEntry(subsection) {
  const education = {
    name: "",
    degree: "",
    date: "",
    gpa: "",
  };

  // First line usually contains school name and potentially graduation date
  if (subsection.length > 0) {
    const firstLine = subsection[0];
    education.name = firstLine.text;

    // Extract date if present in the first line
    const dateMatch = firstLine.text.match(
      /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|may|june|july|august|september|october|november|december|spring|summer|fall|winter|20\d{2}|19\d{2}|present)\b/i
    );
    if (dateMatch) {
      education.date = firstLine.text.substring(dateMatch.index);
      education.name = firstLine.text.substring(0, dateMatch.index).trim();
    }
  }

  // Process remaining lines
  for (let i = 1; i < subsection.length; i++) {
    const line = subsection[i];

    // Look for degree information
    if (
      /bachelor|master|associate|ph\.?d|doctorate|degree|diploma/i.test(
        line.text
      )
    ) {
      education.degree = line.text;
    }
    // Look for GPA
    else if (/\b(gpa|grade)\b.*?\b[0-4]\.\d{1,2}\b/i.test(line.text)) {
      const gpaMatch = line.text.match(/\b[0-4]\.\d{1,2}\b/);
      if (gpaMatch) {
        education.gpa = gpaMatch[0];
      }
    }
    // Look for dates if not already extracted
    else if (
      !education.date &&
      /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|may|june|july|august|september|october|november|december|spring|summer|fall|winter|20\d{2}|19\d{2}|present)\b/i.test(
        line.text
      )
    ) {
      education.date = line.text;
    }
  }

  return education;
}

/**
 * Extract experience data from the EXPERIENCE section
 * @param {Array} lines - Lines or subsections in the EXPERIENCE section
 * @returns {Array} - Array of experience entries
 */
function extractExperienceData(lines) {
  if (!lines.length) return [];

  // Check if lines is a nested array (subsections)
  const isSubsectioned = Array.isArray(lines[0]);

  if (isSubsectioned) {
    // Process each subsection
    return lines.map((subsection) => extractExperienceEntry(subsection));
  } else {
    // Skip the section title
    const experienceLines = lines.slice(1);
    const experiences = [];
    let currentExperience = null;
    let descriptionItems = [];

    for (const line of experienceLines) {
      // Check for company/position (bold and not a bullet point)
      if (line.bold && !line.bullet) {
        if (currentExperience) {
          currentExperience.description = descriptionItems;
          experiences.push(currentExperience);
          descriptionItems = [];
        }
        currentExperience = {
          company: line.text,
          title: "",
          date: "",
          description: [],
        };
      } else if (currentExperience) {
        // Check for bullet points
        if (line.bullet) {
          descriptionItems.push(line.text.replace(/^[•\-]\s*/, "").trim());
        }
        // Check for job title or date
        else if (
          /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|may|june|july|august|september|october|november|december|spring|summer|fall|winter|20\d{2}|19\d{2}|present)\b/i.test(
            line.text
          )
        ) {
          currentExperience.date = line.text;
        } else if (
          !line.bullet &&
          !line.bold &&
          descriptionItems.length === 0
        ) {
          currentExperience.title = line.text;
        }
      }
    }

    // Add the last experience if it exists
    if (currentExperience) {
      currentExperience.description = descriptionItems;
      experiences.push(currentExperience);
    }

    return experiences;
  }
}

/**
 * Helper function to extract experience entry from a subsection
 * @param {Array} subsection - Lines in an experience subsection
 * @returns {Object} - Experience entry
 */
function extractExperienceEntry(subsection) {
  const experience = {
    company: "",
    title: "",
    date: "",
    description: [],
  };

  // First line usually contains company and potentially date
  if (subsection.length > 0) {
    const firstLine = subsection[0];
    experience.company = firstLine.text;

    // Extract date if present in the first line
    const dateMatch = firstLine.text.match(
      /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|may|june|july|august|september|october|november|december|spring|summer|fall|winter|20\d{2}|19\d{2}|present)\b/i
    );
    if (dateMatch) {
      experience.date = firstLine.text.substring(dateMatch.index);
      experience.company = firstLine.text.substring(0, dateMatch.index).trim();
    }
  }

  // Second line often contains the job title
  if (subsection.length > 1 && !subsection[1].bullet) {
    experience.title = subsection[1].text;
  }

  // Process bullet points for description
  for (let i = 1; i < subsection.length; i++) {
    const line = subsection[i];
    if (
      line.bullet ||
      line.text.trim().startsWith("•") ||
      line.text.trim().startsWith("-")
    ) {
      experience.description.push(line.text.replace(/^[•\-]\s*/, "").trim());
    }
    // Extract date if not already found
    else if (
      !experience.date &&
      /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|may|june|july|august|september|october|november|december|spring|summer|fall|winter|20\d{2}|19\d{2}|present)\b/i.test(
        line.text
      )
    ) {
      experience.date = line.text;
    }
    // If there's no title yet and this isn't a bullet point, it's probably the title
    else if (!experience.title && i > 0 && !line.bullet) {
      experience.title = line.text;
    }
  }

  return experience;
}

/**
 * Extract skills data from the SKILLS section
 * @param {Array} lines - Lines in the SKILLS section
 * @returns {Object} - Skills data grouped by category
 */
function extractSkillsData(lines) {
  if (!lines.length) return {};

  // Skip the section title
  const skillsLines = lines.slice(1);

  const skills = {
    technical: [],
    languages: [],
    soft: [],
    other: [],
  };

  let currentCategory = "other";

  for (const line of skillsLines) {
    // Check for category headers
    if (
      line.text.toLowerCase().includes("technical") ||
      line.text.toLowerCase().includes("computer") ||
      line.text.toLowerCase().includes("programming")
    ) {
      currentCategory = "technical";
    } else if (line.text.toLowerCase().includes("language")) {
      currentCategory = "languages";
    } else if (
      line.text.toLowerCase().includes("soft") ||
      line.text.toLowerCase().includes("interpersonal")
    ) {
      currentCategory = "soft";
    }

    // Extract skills from the line
    const lineText = line.text;
    const colonIndex = lineText.indexOf(":");

    if (colonIndex !== -1) {
      const skillsList = lineText.substring(colonIndex + 1).trim();
      const skillsArray = skillsList
        .split(/[,|]/)
        .map((skill) => skill.trim())
        .filter(Boolean);
      skills[currentCategory].push(...skillsArray);
    } else if (!line.bold) {
      // If there's no colon and it's not bold, it's probably a list of skills
      const skillsArray = lineText
        .split(/[,|]/)
        .map((skill) => skill.trim())
        .filter(Boolean);
      skills[currentCategory].push(...skillsArray);
    }
  }

  return skills;
}

/**
 * Extract projects data from the PROJECTS section
 * @param {Array} lines - Lines or subsections in the PROJECTS section
 * @returns {Array} - Array of project entries
 */
function extractProjectsData(lines) {
  if (!lines.length) return [];

  // Check if lines is a nested array (subsections)
  const isSubsectioned = Array.isArray(lines[0]);

  if (isSubsectioned) {
    // Process each subsection
    return lines.map((subsection) => extractProjectEntry(subsection));
  } else {
    // Skip the section title
    const projectLines = lines.slice(1);
    const projects = [];
    let currentProject = null;
    let descriptionItems = [];

    for (const line of projectLines) {
      // Check for project name (bold and not a bullet point)
      if (line.bold && !line.bullet) {
        if (currentProject) {
          currentProject.description = descriptionItems;
          projects.push(currentProject);
          descriptionItems = [];
        }
        currentProject = {
          name: line.text,
          date: "",
          technologies: "",
          description: [],
        };
      } else if (currentProject) {
        // Check for bullet points
        if (line.bullet) {
          descriptionItems.push(line.text.replace(/^[•\-]\s*/, "").trim());
        }
        // Check for date or technologies
        else if (
          /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|may|june|july|august|september|october|november|december|spring|summer|fall|winter|20\d{2}|19\d{2}|present)\b/i.test(
            line.text
          )
        ) {
          currentProject.date = line.text;
        } else if (
          /technologies|tools|tech stack|built with/i.test(line.text)
        ) {
          currentProject.technologies = line.text;
        } else if (!line.bullet && descriptionItems.length === 0) {
          // Additional project info line
          if (!currentProject.description) {
            currentProject.description = [];
          }
          currentProject.description.push(line.text);
        }
      }
    }

    // Add the last project if it exists
    if (currentProject) {
      currentProject.description = descriptionItems;
      projects.push(currentProject);
    }

    return projects;
  }
}

/**
 * Helper function to extract project entry from a subsection
 * @param {Array} subsection - Lines in a project subsection
 * @returns {Object} - Project entry
 */
function extractProjectEntry(subsection) {
  const project = {
    name: "",
    date: "",
    technologies: "",
    description: [],
  };

  // First line usually contains project name and potentially date
  if (subsection.length > 0) {
    const firstLine = subsection[0];
    project.name = firstLine.text;

    // Extract date if present in the first line
    const dateMatch = firstLine.text.match(
      /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|may|june|july|august|september|october|november|december|spring|summer|fall|winter|20\d{2}|19\d{2}|present)\b/i
    );
    if (dateMatch) {
      project.date = firstLine.text.substring(dateMatch.index);
      project.name = firstLine.text.substring(0, dateMatch.index).trim();
    }
  }

  // Process remaining lines
  for (let i = 1; i < subsection.length; i++) {
    const line = subsection[i];

    // Extract bullet points for description
    if (
      line.bullet ||
      line.text.trim().startsWith("•") ||
      line.text.trim().startsWith("-")
    ) {
      project.description.push(line.text.replace(/^[•\-]\s*/, "").trim());
    }
    // Extract technologies
    else if (/technologies|tools|tech stack|built with/i.test(line.text)) {
      project.technologies = line.text;
    }
    // Extract date if not already found
    else if (
      !project.date &&
      /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|may|june|july|august|september|october|november|december|spring|summer|fall|winter|20\d{2}|19\d{2}|present)\b/i.test(
        line.text
      )
    ) {
      project.date = line.text;
    }
    // Additional non-bullet description
    else {
      project.description.push(line.text);
    }
  }

  return project;
}

/**
 * Extract volunteer data from the VOLUNTEER section
 * @param {Array} lines - Lines or subsections in the VOLUNTEER section
 * @returns {Array} - Array of volunteer entries
 */
function extractVolunteerData(lines) {
  // Very similar to experience extraction
  return extractExperienceData(lines);
}

/**
 * Extract achievements data from the ACHIEVEMENTS/HONORS/AWARDS section
 * @param {Array} lines - Lines in the section
 * @returns {Array} - Array of achievement entries
 */
function extractAchievementsData(lines) {
  if (!lines.length) return [];

  // Skip the section title
  const achievementLines = lines.slice(1);
  const achievements = [];

  let currentAchievement = null;

  for (const line of achievementLines) {
    // Check for achievement title (bold or bullet)
    if (line.bold || line.bullet) {
      if (currentAchievement) {
        achievements.push(currentAchievement);
      }
      currentAchievement = {
        title: line.text.replace(/^[•\-]\s*/, "").trim(),
        date: "",
        description: "",
      };

      // Extract date if present in the title
      const dateMatch = currentAchievement.title.match(
        /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|may|june|july|august|september|october|november|december|spring|summer|fall|winter|20\d{2}|19\d{2})\b/i
      );
      if (dateMatch) {
        currentAchievement.date = currentAchievement.title.substring(
          dateMatch.index
        );
        currentAchievement.title = currentAchievement.title
          .substring(0, dateMatch.index)
          .trim();
      }
    } else if (currentAchievement) {
      // Check if this line contains a date
      if (
        /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|may|june|july|august|september|october|november|december|spring|summer|fall|winter|20\d{2}|19\d{2})\b/i.test(
          line.text
        )
      ) {
        currentAchievement.date = line.text;
      } else {
        // Additional description
        currentAchievement.description += line.text + " ";
      }
    }
  }

  // Add the last achievement if it exists
  if (currentAchievement) {
    achievements.push(currentAchievement);
  }

  return achievements;
}

/**
 * Format parsed resume into a structure suitable for the Anveshak  application
 * @param {Object} parsedResume - Raw parsed resume data
 * @returns {Object} - Formatted resume data for the application
 */
export function formatResumeData(parsedResume) {
  const { profile, experience, education, skills, projects } = parsedResume;

  // Format profile data
  const formattedProfile = {
    name: profile.name || "",
    email: profile.email || "",
    phone: profile.phone || "",
    location: profile.location || "",
    website: profile.url || "",
  };

  // Format experience data
  const formattedExperience = experience.map((exp) => ({
    company: exp.company || "",
    title: exp.title || "",
    location: "", // Location is often part of company, but we don't extract it separately
    startDate: extractStartDate(exp.date),
    endDate: extractEndDate(exp.date),
    description: exp.description || [],
  }));

  // Format education data
  const formattedEducation = education.map((edu) => ({
    school: edu.name || "",
    degree: edu.degree || "",
    field: "", // Field is often part of degree, but we don't extract it separately
    startDate: extractStartDate(edu.date),
    endDate: extractEndDate(edu.date),
    gpa: edu.gpa || "",
  }));

  // Format skills
  const formattedSkills = [];
  if (skills.technical && skills.technical.length) {
    formattedSkills.push(...skills.technical);
  }
  if (skills.languages && skills.languages.length) {
    formattedSkills.push(...skills.languages);
  }
  if (skills.soft && skills.soft.length) {
    formattedSkills.push(...skills.soft);
  }
  if (skills.other && skills.other.length) {
    formattedSkills.push(...skills.other);
  }

  // Format projects
  const formattedProjects = projects.map((proj) => ({
    name: proj.name || "",
    description: Array.isArray(proj.description)
      ? proj.description.join(" ")
      : proj.description || "",
    technologies: proj.technologies || "",
  }));

  return {
    profile: formattedProfile,
    experience: formattedExperience,
    education: formattedEducation,
    skills: formattedSkills,
    projects: formattedProjects,
  };
}

/**
 * Extract start date from a date range string
 * @param {string} dateString - Date range string
 * @returns {string} - Start date
 */
function extractStartDate(dateString) {
  if (!dateString) return "";

  // Check for patterns like "Jan 2020 - Present" or "2018-2020"
  const dateMatch = dateString.match(
    /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|may|june|july|august|september|october|november|december|spring|summer|fall|winter)?\s*\d{4}\b/i
  );

  if (dateMatch) {
    return dateMatch[0].trim();
  }

  return "";
}

/**
 * Extract end date from a date range string
 * @param {string} dateString - Date range string
 * @returns {string} - End date
 */
function extractEndDate(dateString) {
  if (!dateString) return "";

  // Check for "Present" or "Current"
  if (/present|current/i.test(dateString)) {
    return "Present";
  }

  // Check for a date range with a dash or similar separator
  const dateRangeMatch = dateString.match(
    /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|may|june|july|august|september|october|november|december|spring|summer|fall|winter)?\s*\d{4}\b.*?[-–—].*?\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|may|june|july|august|september|october|november|december|spring|summer|fall|winter)?\s*\d{4}\b/i
  );

  if (dateRangeMatch) {
    const fullMatch = dateRangeMatch[0];
    const separatorMatch = fullMatch.match(/[-–—]/);
    if (separatorMatch) {
      return fullMatch.substring(separatorMatch.index + 1).trim();
    }
  }

  return "";
}

// Export the module
export default {
  parseResumePdf,
  formatResumeData,
};
