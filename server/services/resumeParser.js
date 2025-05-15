import pdfParse from "pdf-parse";
import {
  getSkillsFromText,
  getExperienceFromText,
  getProjectsFromText,
  parseResumeWithAI,
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

// Helper to extract sections with more flexible detection
const extractSection = (text, sectionNames) => {
  const sections = [];
  const lines = text.split("\n");
  let currentSection = null;
  let sectionContent = [];

  // Normalize text and remove special characters but keep periods and commas
  const normalizeText = (str) =>
    str
      .replace(/[^\w\s,\.:-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const isHeading = (line) => {
    const normalized = normalizeText(line).toLowerCase();
    // More flexible heading detection
    return sectionNames.some((name) => {
      const normalizedName = name.toLowerCase();
      return (
        normalized === normalizedName ||
        normalized.includes(normalizedName + ":") ||
        normalized.startsWith(normalizedName + " ") ||
        normalized.endsWith(" " + normalizedName) ||
        // Check for variations like "technical-skills" or "technical_skills"
        normalized.replace(/[-_]/g, " ").includes(normalizedName) ||
        // Check for partial matches with common prefixes/suffixes
        normalized.includes(normalizedName.replace("experience", "").trim()) ||
        normalized.includes(normalizedName.replace("skills", "").trim())
      );
    });
  };

  // Pre-process the text to handle different formats
  const processedLines = lines.map((line) => {
    // Remove bullet points and numbering
    return line.replace(/^[\s•●\-*\d\.\)]+/, "").trim();
  });

  for (let i = 0; i < processedLines.length; i++) {
    const line = processedLines[i];
    if (!line) continue;

    // Look for section headers
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
      // Add context if it looks like content (not just whitespace or separator)
      if (line.length > 1) {
        sectionContent.push(line);
      }
    } else {
      // Try to detect unlabeled sections by looking at the next few lines
      const nextLines = processedLines
        .slice(i, i + 3)
        .join(" ")
        .toLowerCase();
      if (
        sectionNames.some(
          (name) =>
            nextLines.includes(name.toLowerCase()) ||
            nextLines.includes(name.toLowerCase().replace("experience", "")) ||
            nextLines.includes(name.toLowerCase().replace("skills", ""))
        )
      ) {
        currentSection = line;
      }
    }
  }

  // Add the last section
  if (currentSection && sectionContent.length) {
    sections.push({
      name: currentSection,
      content: sectionContent.join("\n"),
    });
  }

  return sections;
};

// Enhanced skill extraction with better pattern recognition
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
    "TECHNICAL",
    "TECHNOLOGIES USED",
    "LANGUAGES",
    "FRAMEWORKS",
  ];

  // Additional technical terms to look for
  const technicalTerms = [
    "programming",
    "software",
    "development",
    "web",
    "database",
    "frontend",
    "backend",
    "full stack",
    "api",
    "cloud",
  ];

  const sections = extractSection(text, [
    ...skillSectionNames,
    ...technicalTerms,
  ]);
  let skills = new Set();

  // Process each section
  sections.forEach((section) => {
    const content = section.content
      .replace(/[•●*]/g, ",") // Replace bullets with commas
      .replace(/[|┃│⎪⎥⎢⎜]/g, ",") // Replace vertical bars
      .replace(/[:]/g, ",") // Replace colons
      .replace(/[-]/g, " "); // Replace hyphens with spaces

    // Split by multiple possible delimiters
    const parts = content
      .split(/[,;•\n]/)
      .map((part) => part.trim())
      .filter(
        (part) =>
          part &&
          part.length >= 2 &&
          !/^(and|or|in|with|using|including)$/i.test(part)
      );

    parts.forEach((part) => skills.add(part));
  });

  // If no skills found, try looking for technical terms in the entire text
  if (skills.size === 0) {
    const words = text
      .split(/[\s,;:|•]/)
      .map((word) => word.trim())
      .filter((word) => word.length >= 2);

    // Look for common programming terms
    const commonTech = [
      "java",
      "python",
      "javascript",
      "typescript",
      "react",
      "node",
      "angular",
      "vue",
      "css",
      "html",
      "sql",
      "mongodb",
      "aws",
      "docker",
      "kubernetes",
      "git",
      "api",
      "rest",
      "graphql",
    ];

    words.forEach((word) => {
      if (
        commonTech.some((tech) =>
          word.toLowerCase().includes(tech.toLowerCase())
        )
      ) {
        skills.add(word);
      }
    });
  }

  return Array.from(skills);
};

// Enhanced experience extraction
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
    "EMPLOYMENT",
    "WORK",
    "CAREER",
    "INTERNSHIP",
    "INTERNSHIPS",
    "TRAINING",
    "TRAINING AND INTERNSHIP",
    "PROFESSIONAL TRAINING",
    "VOLUNTEER EXPERIENCE",
  ];

  const sections = extractSection(text, experienceSectionNames);
  let experiences = [];

  sections.forEach((section) => {
    const lines = section.content.split("\n");
    let currentExp = [];

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      // New experience entry indicators
      const isNewEntry =
        /^\d{4}/.test(trimmed) || // Starts with year
        /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i.test(trimmed) || // Starts with month
        /^[A-Z][^a-z]{2,}/.test(trimmed) || // All caps company name
        trimmed.length > 20; // Long enough to be a title

      if (isNewEntry && currentExp.length > 0) {
        experiences.push(currentExp.join(" "));
        currentExp = [];
      }
      currentExp.push(trimmed);
    });

    if (currentExp.length > 0) {
      experiences.push(currentExp.join(" "));
    }
  });

  return experiences;
};

// Enhanced project extraction
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
    "PROJECT WORK",
    "DEVELOPMENT PROJECTS",
    "SOFTWARE PROJECTS",
  ];

  const sections = extractSection(text, projectSectionNames);
  let projects = [];

  sections.forEach((section) => {
    const lines = section.content.split("\n");
    let currentProject = [];

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      // New project indicators
      const isNewProject =
        /^[•●\-*]/.test(trimmed) || // Bullet points
        /^\d+[\.\)]/.test(trimmed) || // Numbered lists
        /^[\[\(\{]/.test(trimmed) || // Brackets/braces
        /^(Project|System|Application|Website)[\s\d]*:/.test(trimmed) || // Project headers
        /^[A-Z][^a-z]{2,}/.test(trimmed) || // All caps title
        trimmed.length > 30; // Long project title

      if (isNewProject && currentProject.length > 0) {
        projects.push(currentProject.join(" "));
        currentProject = [];
      }
      currentProject.push(trimmed);
    });

    if (currentProject.length > 0) {
      projects.push(currentProject.join(" "));
    }
  });

  return projects;
};

export const parseResumeText = async (publicId, previousVersion = null) => {
  let dataBuffer = null;
  try {
    // Get PDF from Cloudinary
    const result = await cloudinary.api.resource(publicId, {
      resource_type: "raw",
    });

    // Download PDF
    const response = await axios.get(result.secure_url, {
      responseType: "arraybuffer",
    });
    dataBuffer = Buffer.from(response.data);

    // Parse PDF
    const data = await pdfParse(dataBuffer, {
      pagerender: (pageData) => {
        return pageData.getTextContent({ normalizeWhitespace: true });
      },
    });

    if (!data || !data.text) {
      throw new Error("Failed to extract text from PDF");
    }

    const text = data.text.trim();
    if (text.length < 10) {
      return {
        text,
        skills: [],
        experience: [],
        projects: [],
        parsedAt: new Date(),
        parseMethod: "failed",
        warning: "Extracted text is too short to parse meaningfully",
      };
    }

    console.log("Successfully extracted text, length:", text.length);

    // 1. Try regular parsing first
    console.log("Attempting regular parsing...");
    const regularSkills = extractSkills(text);
    const regularExperience = extractExperience(text);
    const regularProjects = extractProjects(text);

    if (
      regularSkills.length > 0 ||
      regularExperience.length > 0 ||
      regularProjects.length > 0
    ) {
      console.log("Regular parsing successful");
      return {
        text,
        skills: regularSkills,
        experience: regularExperience,
        projects: regularProjects,
        parsedAt: new Date(),
        parseMethod: "regular",
      };
    }

    // 2. If regular parsing found no content, try AI parsing
    console.log("Regular parsing found minimal content, trying AI parsing...");
    try {
      const aiResult = await parseResumeWithAI(text);
      if (
        aiResult &&
        (aiResult.skills?.length > 0 ||
          aiResult.experience?.length > 0 ||
          aiResult.projects?.length > 0)
      ) {
        console.log("AI parsing successful");
        return {
          text,
          ...aiResult,
          parsedAt: new Date(),
          parseMethod: "ai",
        };
      } else {
        // AI parsing attempted but returned no content
        const warningMessage =
          "Parsing completed but found limited content. You can manually add your skills and experience.";
        console.warn(warningMessage);
        return {
          text,
          skills: aiResult?.skills || [],
          experience: aiResult?.experience || [],
          projects: aiResult?.projects || [],
          parsedAt: new Date(),
          parseMethod: "partial",
          warning: warningMessage,
        };
      }
    } catch (aiError) {
      const warningMessage =
        "Automated parsing had difficulties. You can manually add your skills and experience.";
      console.warn(warningMessage);
      // Return what we have with a warning
      return {
        text,
        skills: [],
        experience: [],
        projects: [],
        parsedAt: new Date(),
        parseMethod: "manual_required",
        warning: warningMessage,
      };
    }
  } catch (error) {
    console.error("Resume parsing error:", error);
    throw error;
  }
};
