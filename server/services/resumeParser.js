import pdfParse from "pdf-parse";
import {
  getSkillsFromText,
  getExperienceFromText,
  getProjectsFromText,
} from "./aiService.js";
import axios from "axios";
import { v2 as cloudinary } from "cloudinary";
import crypto from "crypto";

// Configure Cloudinary
const configureCloudinary = () => {
  if (
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  ) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });
    return true;
  }

  if (!process.env.CLOUDINARY_URL) {
    console.error(
      "Cloudinary configuration is missing. Please set CLOUDINARY_URL or individual credentials."
    );
    if (process.env.NODE_ENV === "production") {
      throw new Error("Cloudinary configuration is required");
    }
    return false;
  }

  try {
    const match = process.env.CLOUDINARY_URL.match(
      /cloudinary:\/\/([^:]+):([^@]+)@(.+)/
    );
    if (!match) {
      throw new Error("Invalid CLOUDINARY_URL format");
    }

    const [_, apiKey, apiSecret, cloudName] = match;
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });
    return true;
  } catch (error) {
    console.error("Error configuring Cloudinary:", error.message);
    if (process.env.NODE_ENV === "production") {
      throw error;
    }
    return false;
  }
};

// Initialize Cloudinary configuration
configureCloudinary();

// Generate authenticated PDF URL helper
const generatePdfUrl = (publicId) => {
  // The publicId already includes the folder path and filename
  return `https://res.cloudinary.com/${
    cloudinary.config().cloud_name
  }/raw/upload/v1/${publicId}`;
};

// Get file from Cloudinary using signed URL with retries
const getFileFromCloudinary = async (publicId, retries = 3) => {
  try {
    const url = generatePdfUrl(publicId);
    console.log("Downloading from signed URL:", url);

    const response = await axios({
      method: "get",
      url: url,
      responseType: "arraybuffer",
      maxContentLength: 10 * 1024 * 1024, // 10MB max
      timeout: 30000, // 30 second timeout per attempt
      headers: {
        Accept: "application/pdf",
      },
    });

    if (!response.data || response.data.length === 0) {
      throw new Error("Empty response from Cloudinary");
    }

    return response.data;
  } catch (error) {
    console.error("Error fetching file from Cloudinary:", error);
    if (retries > 0) {
      console.log(`Retrying download, ${retries} attempts remaining...`);
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds before retry
      return getFileFromCloudinary(publicId, retries - 1);
    }
    throw error;
  }
};

// Export the URL generation function for use in other modules
export { generatePdfUrl };

// Helper to extract sections using various common section names and formats
const extractSection = (text, sectionNames) => {
  const sections = [];
  const lines = text.split("\n");
  let currentSection = null;
  let sectionContent = [];

  // Normalize the text by removing excessive spaces and special characters
  const normalizeText = (str) => str.replace(/\s+/g, " ").trim();

  const isHeading = (line) => {
    // Check if line is likely a heading (all caps, ends with :, etc)
    const normalized = normalizeText(line).toLowerCase();
    return sectionNames.some(
      (name) =>
        normalized === name.toLowerCase() ||
        normalized.includes(name.toLowerCase() + ":") ||
        normalized.startsWith(name.toLowerCase() + " ") ||
        normalized.endsWith(" " + name.toLowerCase())
    );
  };

  for (let line of lines) {
    line = normalizeText(line);
    if (!line) continue;

    // Check if this line is a section heading
    if (isHeading(line)) {
      // If we were collecting content for a previous section, save it
      if (currentSection && sectionContent.length) {
        sections.push({
          name: currentSection,
          content: sectionContent.join("\n"),
        });
      }
      currentSection = line;
      sectionContent = [];
    } else if (currentSection) {
      // Add line to current section if it's not just whitespace
      if (line.trim()) {
        sectionContent.push(line);
      }
    }
  }

  // Don't forget to add the last section
  if (currentSection && sectionContent.length) {
    sections.push({
      name: currentSection,
      content: sectionContent.join("\n"),
    });
  }

  return sections;
};

// Extract skills from text looking for various formats
const extractSkills = (text) => {
  const skillSectionNames = [
    "SKILLS",
    "TECHNICAL SKILLS",
    "CORE COMPETENCIES",
    "TECHNOLOGIES",
    "TECHNICAL EXPERTISE",
    "TOOLS & TECHNOLOGIES",
    "PROGRAMMING LANGUAGES",
    "EXPERTISE",
    "PROFICIENCIES",
    "COMPUTER SKILLS",
    "KEY SKILLS",
  ];

  const sections = extractSection(text, skillSectionNames);
  let skills = new Set();

  sections.forEach((section) => {
    // Split by common delimiters and clean up
    const extracted = section.content
      .replace(/[•●*]/g, ",") // Replace bullets with commas
      .replace(/[|┃│⎪⎥⎢⎜]/g, ",") // Replace vertical bars with commas
      .split(/[,;•]/) // Split by common delimiters
      .map((skill) => skill.trim())
      .filter(
        (skill) =>
          skill &&
          skill.length >= 2 &&
          !/^(and|or|in|with|using|including)$/i.test(skill)
      );

    extracted.forEach((skill) => skills.add(skill));
  });

  return Array.from(skills);
};

// Extract experience sections with various common section names
const extractExperience = (text) => {
  const experienceSectionNames = [
    "EXPERIENCE",
    "WORK EXPERIENCE",
    "PROFESSIONAL EXPERIENCE",
    "EMPLOYMENT HISTORY",
    "WORK HISTORY",
    "CAREER HISTORY",
    "RELEVANT EXPERIENCE",
    "PROFESSIONAL BACKGROUND",
  ];

  const sections = extractSection(text, experienceSectionNames);
  return sections.map((section) => section.content);
};

// Extract projects with various common section names and formats
const extractProjects = (text) => {
  const projectSectionNames = [
    "PROJECTS",
    "PROJECT EXPERIENCE",
    "TECHNICAL PROJECTS",
    "PERSONAL PROJECTS",
    "KEY PROJECTS",
    "ACADEMIC PROJECTS",
    "RELEVANT PROJECTS",
    "FEATURED PROJECTS",
    "MAJOR PROJECTS",
    "RESEARCH PROJECTS",
    "DEVELOPMENT PROJECTS",
    "INDIVIDUAL PROJECTS",
  ];

  const sections = extractSection(text, projectSectionNames);
  let projects = [];

  sections.forEach((section) => {
    // Split content into individual projects
    let projectItems = [];
    let currentProject = [];
    const lines = section.content.split("\n");

    for (let line of lines) {
      line = line.trim();
      if (!line) continue;

      // Check if this line starts a new project (common patterns)
      const isNewProject =
        /^[•●\-*]/.test(line) || // Bullet points
        /^\d+[\.\)]/.test(line) || // Numbered lists
        /^[\[\(\{]/.test(line) || // Starts with bracket/brace
        /^(Project|System|Application)[\s\d]*:/.test(line) || // Project headers
        (line.length > 10 && /^[A-Z][^a-z]{2,}/.test(line)); // All caps title

      if (isNewProject && currentProject.length > 0) {
        projectItems.push(currentProject.join(" ").trim());
        currentProject = [];
      }
      currentProject.push(line);
    }

    // Don't forget to add the last project
    if (currentProject.length > 0) {
      projectItems.push(currentProject.join(" ").trim());
    }

    // Clean up each project description
    projectItems.forEach((project) => {
      // Remove bullet points and common prefixes
      let cleaned = project
        .replace(/^[•●\-*\d\.\)\[\]\{\}]+\s*/, "")
        .replace(/^(Project|System|Application)[\s\d]*:/, "")
        .trim();

      // Only add if it looks like a valid project (has some substance)
      if (cleaned.length > 10 && !/^(and|or|using|with)$/i.test(cleaned)) {
        projects.push(cleaned);
      }
    });
  });

  return projects;
};

export const parseResumeText = async (publicId, previousVersion = null) => {
  let dataBuffer = null;

  try {
    if (!publicId) {
      throw new Error("Cloudinary public ID is required");
    }

    try {
      console.log("Downloading from Cloudinary using public ID:", publicId);
      const fileData = await getFileFromCloudinary(publicId);

      if (!fileData) {
        throw new Error("No data received from Cloudinary");
      }

      dataBuffer = Buffer.from(fileData);
      console.log(
        "Successfully downloaded PDF, size:",
        dataBuffer.length,
        "bytes"
      );
    } catch (downloadError) {
      console.error(
        "Error downloading from Cloudinary:",
        downloadError.message
      );
      throw new Error(
        `Failed to download file from Cloudinary: ${downloadError.message}`
      );
    }

    console.log("Attempting to parse PDF data...");
    const data = await pdfParse(dataBuffer, {
      max: 0,
      timeout: 30000,
      pagerender: function (pageData) {
        let render_options = {
          normalizeWhitespace: false,
          disableCombineTextItems: false,
        };
        return pageData.getTextContent(render_options);
      },
    });

    if (!data || !data.text) {
      throw new Error("Failed to extract text from PDF");
    }

    const text = data.text.trim();
    console.log("Successfully extracted text, length:", text.length);

    // More lenient minimum length check
    if (text.length < 20) {
      throw new Error("Extracted text is too short to be valid content");
    }

    // Extract information using the new parsing functions
    const skills = extractSkills(text);
    const experience = extractExperience(text);
    const projects = extractProjects(text);

    // If no sections were found with standard names, try AI parsing as fallback
    if (!skills.length && !experience.length && !projects.length) {
      console.log(
        "No sections found with standard parsing, trying AI parsing..."
      );
      const [aiSkills, aiExperience, aiProjects] = await Promise.all([
        getSkillsFromText(text, previousVersion?.skills),
        getExperienceFromText(text, previousVersion?.experience),
        getProjectsFromText(text, previousVersion?.projects),
      ]);

      return {
        skills: aiSkills || [],
        experience: aiExperience || [],
        projects: aiProjects || [],
        parsedAt: new Date(),
      };
    }

    return {
      skills,
      experience,
      projects,
      parsedAt: new Date(),
    };
  } catch (error) {
    console.error("Resume parsing error:", error);
    throw error;
  }
};
