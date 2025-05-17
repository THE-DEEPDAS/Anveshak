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
import {
  parseResumeText as parseSimplified,
  formatResumeData,
} from "./simplifiedResumeParser.js";
import path from "path";
import fs from "fs/promises";

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
    // Skip lines that are too long to be headers (likely paragraph content)
    if (line.length > 50) return false;

    const normalized = normalizeText(line).toLowerCase();

    // Check if this is a section header by formatting characteristics
    const formattingHints =
      // Check for common formatting patterns indicating section headers
      /^[A-Z\s]+$/.test(line) || // All caps
      /^\s*[A-Z][a-z]+:/.test(line) || // Title case followed by colon
      /^\s*[A-Z][a-z]+ [A-Z][a-z]+:/.test(line) || // Two title case words followed by colon
      line.includes("______") || // Underscores
      line.includes("====="); // Equal signs

    // More flexible heading detection
    return (
      sectionNames.some((name) => {
        const normalizedName = name.toLowerCase();
        // Check for exact matches first
        if (normalized === normalizedName) return true;

        // Then partial matches with common patterns
        return (
          normalized.includes(normalizedName + ":") ||
          normalized.startsWith(normalizedName + " ") ||
          normalized.endsWith(" " + normalizedName) ||
          // Check for variations like "technical-skills" or "technical_skills"
          normalized.replace(/[-_]/g, " ").includes(normalizedName) ||
          // Check for partial matches with common prefixes/suffixes
          normalized.includes(
            normalizedName.replace("experience", "").trim()
          ) ||
          normalized.includes(normalizedName.replace("skills", "").trim()) ||
          // Check for common abbreviations
          (normalizedName === "skills" &&
            (normalized.includes("tech") || normalized.includes("comp"))) ||
          (normalizedName.includes("experience") &&
            (normalized.includes("work") ||
              normalized.includes("prof") ||
              normalized.includes("employment") ||
              normalized.includes("career")))
        );
      }) || formattingHints
    ); // Consider either section name match or formatting hints
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
    "QUALIFICATIONS",
    "TECHNICAL QUALIFICATIONS",
    "CAPABILITIES",
    "TECH STACK",
    "COMPETENCIES",
    "STRENGTHS",
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
    "devops",
    "mobile",
    "application",
    "design",
  ];

  // Much more comprehensive list of common tech skills
  const commonTechSkills = [
    // Programming languages
    "java",
    "python",
    "javascript",
    "typescript",
    "c++",
    "c#",
    "ruby",
    "go",
    "golang",
    "php",
    "swift",
    "kotlin",
    "scala",
    "rust",
    "perl",
    "r",
    "matlab",
    "fortran",
    "cobol",
    "bash",
    "shell",
    "powershell",
    "groovy",
    "objective-c",
    "dart",
    "lua",
    "haskell",
    "clojure",
    "erlang",
    "elixir",
    "f#",

    // Frontend
    "react",
    "angular",
    "vue",
    "svelte",
    "jquery",
    "backbone",
    "ember",
    "next.js",
    "gatsby",
    "nuxt",
    "redux",
    "mobx",
    "bootstrap",
    "material-ui",
    "tailwind",
    "bulma",
    "sass",
    "less",
    "css",
    "html",
    "webpack",
    "babel",
    "vite",
    "jsx",
    "tsx",
    "styled-components",
    "emotion",
    "chakra",
    "pwa",

    // Backend
    "node",
    "express",
    "django",
    "flask",
    "spring",
    "laravel",
    "rails",
    "asp.net",
    "strapi",
    "koa",
    "fastapi",
    "nestjs",
    "graphql",
    "rest",
    "soap",
    "grpc",
    "microservices",
    "serverless",

    // Databases
    "sql",
    "nosql",
    "mongodb",
    "postgresql",
    "mysql",
    "sqlite",
    "oracle",
    "cassandra",
    "redis",
    "couchdb",
    "dynamodb",
    "mariadb",
    "firestore",
    "neo4j",
    "elasticsearch",
    "firebase",

    // Cloud & DevOps
    "aws",
    "azure",
    "gcp",
    "google cloud",
    "docker",
    "kubernetes",
    "jenkins",
    "travis",
    "circleci",
    "github actions",
    "gitlab ci",
    "terraform",
    "ansible",
    "chef",
    "puppet",
    "nginx",
    "apache",
    "heroku",
    "netlify",
    "vercel",
    "digitalocean",
    "cloudflare",
    "serverless",
    "lambda",

    // Testing
    "jest",
    "mocha",
    "chai",
    "cypress",
    "selenium",
    "puppeteer",
    "enzyme",
    "testing-library",
    "junit",
    "testng",
    "pytest",
    "rspec",
    "cucumber",
    "jasmine",
    "karma",
    "playwright",
    "postman",

    // Version Control
    "git",
    "github",
    "gitlab",
    "bitbucket",
    "svn",
    "mercurial",

    // Mobile
    "react native",
    "flutter",
    "ionic",
    "xamarin",
    "swift",
    "swiftui",
    "android",
    "ios",
    "kotlin",
    "objective-c",
    "capacitor",
    "cordova",

    // UI/UX
    "figma",
    "sketch",
    "adobe xd",
    "photoshop",
    "illustrator",
    "invision",
    "zeplin",
    "axure",

    // AI/ML
    "tensorflow",
    "pytorch",
    "keras",
    "scikit-learn",
    "pandas",
    "numpy",
    "jupyter",
    "matplotlib",
    "seaborn",
    "opencv",
    "machine learning",
    "deep learning",
    "nlp",
    "ai",

    // Project Management
    "agile",
    "scrum",
    "kanban",
    "jira",
    "asana",
    "trello",
    "slack",
    "notion",

    // Big Data
    "hadoop",
    "spark",
    "kafka",
    "airflow",
    "tableau",
    "power bi",
    "dbt",
    "snowflake",
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
      .split(/[,;•\n\t\/]/) // Added tab and slash as delimiters
      .map((part) => part.trim())
      .filter(
        (part) =>
          part &&
          part.length >= 2 &&
          !/^(and|or|in|with|using|including|also|other|etc|such|as|the|for)$/i.test(
            part
          )
      );

    parts.forEach((part) => {
      // Remove parentheses and their contents
      const cleanedPart = part.replace(/\([^)]*\)/g, "").trim();
      if (cleanedPart.length >= 2) {
        skills.add(cleanedPart);
      }
    });
  });

  // Special case: Extract skills from bullet points in experience sections too
  const experienceSections = extractSection(text, [
    "EXPERIENCE",
    "WORK EXPERIENCE",
    "PROFESSIONAL EXPERIENCE",
    "EMPLOYMENT",
  ]);
  experienceSections.forEach((section) => {
    // Look for technologies mentioned in experience sections
    commonTechSkills.forEach((tech) => {
      try {
        // Escape special regex characters in tech name
        const escapedTech = tech.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        // Use word boundaries to avoid partial matches
        const regex = new RegExp(`\\b${escapedTech}\\b`, "i");
        if (regex.test(section.content)) {
          // Capitalize first letter for consistency
          skills.add(tech.charAt(0).toUpperCase() + tech.slice(1));
        }
      } catch (regexError) {
        console.warn(
          `Regex error for skill in experience "${tech}":`,
          regexError.message
        );
        // Try fallback without regex
        if (section.content.toLowerCase().includes(tech.toLowerCase())) {
          skills.add(tech.charAt(0).toUpperCase() + tech.slice(1));
        }
      }
    });
  });
  // If still no skills found or very few, try looking for technical terms in the entire text
  if (skills.size < 3) {
    // Extract skills from the whole text using regular expressions
    commonTechSkills.forEach((tech) => {
      try {
        // Escape special regex characters in tech name
        const escapedTech = tech.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        // Use word boundaries to avoid partial matches
        const regex = new RegExp(`\\b${escapedTech}\\b`, "i");
        if (regex.test(text)) {
          // Capitalize first letter for consistency
          skills.add(tech.charAt(0).toUpperCase() + tech.slice(1));
        }
      } catch (regexError) {
        console.warn(`Regex error for skill "${tech}":`, regexError.message);
        // Try fallback without regex
        if (text.toLowerCase().includes(tech.toLowerCase())) {
          skills.add(tech.charAt(0).toUpperCase() + tech.slice(1));
        }
      }
    });

    // Look for skill patterns like "Proficient in X" or "Experience with Y"
    const skillPatterns = [
      /(?:proficient|skilled|experienced|familiar|knowledge)\s+(?:in|with|of)\s+([A-Za-z0-9+#.\-/\s]+)/gi,
      /(?:expertise|specialization|competence)\s+(?:in|with|of)\s+([A-Za-z0-9+#.\-/\s]+)/gi,
      /(?:using|utilize|employed)\s+([A-Za-z0-9+#.\-/\s]+?)\s+(?:to|for)/gi,
    ];

    skillPatterns.forEach((pattern) => {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        if (match[1] && match[1].length >= 2) {
          // Break multi-word matches into potential individual skills
          const words = match[1].split(/\s+/);
          words.forEach((word) => {
            if (
              word.length >= 2 &&
              commonTechSkills.some((tech) => word.toLowerCase().includes(tech))
            ) {
              skills.add(word);
            }
          });
        }
      }
    });
  }

  // Clean up skills and make them more consistent
  const cleanedSkills = Array.from(skills)
    .filter((skill) => skill.length >= 2 && !/^[0-9]+$/.test(skill)) // Remove pure numbers
    .map((skill) => {
      // Try to normalize common variations
      const normalized = skill.replace(/\s+/g, " ").trim();

      // Handle .NET framework specifically
      if (/\.net/i.test(normalized)) {
        return ".NET";
      }

      // Capitalize correctly known technologies
      const lowerNormalized = normalized.toLowerCase();
      const knownTech = commonTechSkills.find(
        (tech) =>
          lowerNormalized === tech.toLowerCase() ||
          lowerNormalized.includes(tech.toLowerCase())
      );

      if (knownTech) {
        // For exact matches, use the known capitalization
        if (lowerNormalized === knownTech.toLowerCase()) {
          // Special cases for acronyms
          if (/^[a-z]+$/.test(knownTech) && knownTech.length <= 4) {
            return knownTech.toUpperCase(); // Convert short terms to uppercase (like CSS, HTML)
          }
          // Retain known capitalization for others
          return knownTech.charAt(0).toUpperCase() + knownTech.slice(1);
        }
      }

      return normalized;
    });

  // Remove duplicates
  return [...new Set(cleanedSkills)];
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
    "EXPERIENCE SUMMARY",
    "PROFESSIONAL SUMMARY",
    "POSITIONS HELD",
    "JOB HISTORY",
  ];

  const sections = extractSection(text, experienceSectionNames);
  let experiences = [];

  // Regular expressions for date detection
  const datePatterns = [
    /(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{4} (?:-|to|–) (?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{4}/i,
    /(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{4} (?:-|to|–) (?:Present|Current)/i,
    /\d{1,2}\/\d{4} (?:-|to|–) \d{1,2}\/\d{4}/,
    /\d{1,2}\/\d{4} (?:-|to|–) (?:Present|Current)/i,
    /\d{4} (?:-|to|–) \d{4}/,
    /\d{4} (?:-|to|–) (?:Present|Current)/i,
    /(?:Since|From) \d{4}/i,
  ];

  // Regular expressions for company/title patterns
  const companyTitlePatterns = [
    // Company - Title format
    /([A-Za-z0-9\s.,&]+) - ([A-Za-z0-9\s.,]+)/,
    // Title at Company format
    /([A-Za-z0-9\s.,]+) at ([A-Za-z0-9\s.,&]+)/,
    // Title, Company format
    /([A-Za-z0-9\s.,]+), ([A-Za-z0-9\s.,&]+)/,
  ];

  sections.forEach((section) => {
    // Pre-process: try to detect experience entries by patterns
    // This helps with PDFs where formatting/line breaks might be lost
    let content = section.content;

    // Check if section has date patterns that indicate experience entries
    const hasDatePatterns = datePatterns.some((pattern) =>
      pattern.test(content)
    );

    // If we detect date patterns, we'll try a different parsing approach
    if (hasDatePatterns) {
      // Try to split by date patterns first
      let chunks = [];
      let lastIndex = 0;

      // Combine all date patterns
      const combinedDatePattern = new RegExp(
        datePatterns.map((p) => p.source).join("|"),
        "gi"
      );
      let match;

      while ((match = combinedDatePattern.exec(content)) !== null) {
        // If this isn't the first match and it's far enough from the last match,
        // consider everything between as one experience entry
        if (match.index > lastIndex + 20) {
          chunks.push(content.substring(lastIndex, match.index).trim());
        }
        lastIndex = match.index;
      }

      // Add the remaining text
      if (lastIndex < content.length) {
        chunks.push(content.substring(lastIndex).trim());
      }

      if (chunks.length > 0) {
        experiences = [...experiences, ...chunks];
      }
    }

    // Fallback: traditional line-by-line parsing if date patterns didn't produce good results
    if (
      experiences.length === 0 ||
      (sections.length === 1 && experiences.length < 2)
    ) {
      const lines = section.content.split("\n");
      let currentExp = [];
      let foundEntryPattern = false;

      lines.forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed) return;

        // New experience entry indicators with improved detection
        const hasDate = datePatterns.some((pattern) => pattern.test(trimmed));
        const hasCompanyTitlePattern = companyTitlePatterns.some((pattern) =>
          pattern.test(trimmed)
        );

        // Enhanced new entry detection
        const isNewEntry =
          hasDate || // Contains a date pattern
          hasCompanyTitlePattern || // Contains company/title pattern
          /^\d{4}/.test(trimmed) || // Starts with year
          /^(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i.test(
            trimmed
          ) || // Starts with month
          /^[A-Z][a-zA-Z]* (?:LLC|Inc|Corp|Corporation|Company|Co\.|Ltd)/i.test(
            trimmed
          ) || // Company name pattern
          /^[A-Z][^a-z]{2,}/.test(trimmed) || // All caps text (likely company name)
          /^(?:Senior|Junior|Lead|Principal|Software|Web|Full|Associate|Assistant|Director)/i.test(
            trimmed
          ); // Job title starters

        if ((isNewEntry || foundEntryPattern) && currentExp.length > 0) {
          experiences.push(currentExp.join(" ").replace(/\s+/g, " "));
          currentExp = [];
          foundEntryPattern = false;
        }

        if (isNewEntry) {
          foundEntryPattern = true;
        }

        currentExp.push(trimmed);
      });

      if (currentExp.length > 0) {
        experiences.push(currentExp.join(" ").replace(/\s+/g, " "));
      }
    }
  });

  // Post-processing: Cleanup and formatting
  let cleanedExperiences = experiences
    .filter((exp) => exp && exp.length > 10) // Ensure minimum content
    .map((exp) => {
      // Normalize spacing
      let cleaned = exp.replace(/\s+/g, " ").trim();
      // Truncate if too long (likely a parsing error)
      if (cleaned.length > 500) {
        cleaned = cleaned.substring(0, 497) + "...";
      }
      return cleaned;
    });

  // If we didn't extract any experiences but we found sections, take the entire section as one experience
  if (cleanedExperiences.length === 0 && sections.length > 0) {
    cleanedExperiences = sections.map((section) => {
      let cleaned = section.content.replace(/\s+/g, " ").trim();
      if (cleaned.length > 500) {
        cleaned = cleaned.substring(0, 497) + "...";
      }
      return cleaned;
    });
  }

  return cleanedExperiences;
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
    "PORTFOLIO",
    "PORTFOLIO PROJECTS",
    "SELECTED PROJECTS",
    "ENGINEERING PROJECTS",
    "CAPSTONE PROJECT",
    "RESEARCH PROJECTS",
    "SIDE PROJECTS",
    "GITHUB PROJECTS",
  ];

  const sections = extractSection(text, projectSectionNames);
  let projects = [];

  // Regular expressions for project title patterns
  const projectTitlePatterns = [
    /^([A-Za-z0-9\s.,&]+)(?::|–|-)/, // Project name followed by colon, em dash or hyphen
    /^(Project|System|Application|Website|Platform|Tool|Game)(?:\s+\d+)?:\s+([A-Za-z0-9\s.,&]+)/, // "Project:" followed by name
    /^([A-Za-z0-9\s.,&]{3,50})$/, // Stand-alone project name (3-50 chars)
  ];

  sections.forEach((section) => {
    // Check for bullet points or numbering patterns that indicate separate projects
    const hasBulletPoints = /[•●\-*]|^\d+[\.\)]/.test(section.content);

    const lines = section.content.split("\n");
    let currentProject = [];
    let foundProjectPattern = false;

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      // New project indicators - enhanced detection
      const isProjectTitle = projectTitlePatterns.some((pattern) =>
        pattern.test(trimmed)
      );
      const isBulletOrNumbered =
        /^[•●\-*]/.test(trimmed) || /^\d+[\.\)]/.test(trimmed);

      // Enhanced new project detection
      const isNewProject =
        (hasBulletPoints && isBulletOrNumbered) || // Bullet in a section with bullets
        isProjectTitle || // Matches title pattern
        /^[\[\(\{]/.test(trimmed) || // Brackets/braces
        /^(Project|System|Application|Website|Platform|Tool|Game)[\s\d]*:/.test(
          trimmed
        ) || // Project headers
        /^[A-Z][^a-z]{1,2}[A-Z]/.test(trimmed) || // Likely an acronym project name
        /github\.com\/[^\/]+\/[^\/\s]+/i.test(trimmed) || // GitHub repo URL
        (trimmed.length > 5 &&
          trimmed.length < 60 &&
          /^[A-Z]/.test(trimmed) &&
          !/[.:]$/.test(trimmed)); // Likely a title

      if ((isNewProject || foundProjectPattern) && currentProject.length > 0) {
        // Add accumulated project
        projects.push(currentProject.join(" ").replace(/\s+/g, " "));
        currentProject = [];
        foundProjectPattern = false;
      }

      if (isNewProject) {
        foundProjectPattern = true;
      }

      currentProject.push(trimmed);
    });

    if (currentProject.length > 0) {
      projects.push(currentProject.join(" ").replace(/\s+/g, " "));
    }

    // If no projects were found using delimiters but content exists,
    // try to extract GitHub links or URLs that might reference projects
    if (projects.length === 0 && section.content.length > 0) {
      // Look for GitHub repositories
      const githubRepoRegex = /github\.com\/[^\/\s]+\/([^\/\s]+)/gi;
      let match;
      while ((match = githubRepoRegex.exec(section.content)) !== null) {
        if (match[1]) {
          // Format GitHub repo name nicely
          const repoName = match[1]
            .replace(/[-_]/g, " ")
            .replace(/([a-z])([A-Z])/g, "$1 $2") // Add space between camelCase
            .replace(/\b\w/g, (l) => l.toUpperCase()); // Capitalize words

          projects.push(`${repoName} - GitHub repository`);
        }
      }

      // If still no projects, treat paragraphs as individual projects
      if (projects.length === 0) {
        const paragraphs = section.content.split(/\n\s*\n/);
        projects = paragraphs
          .filter((p) => p.trim().length > 10) // Minimum content length
          .map((p) => p.replace(/\s+/g, " ").trim());
      }
    }
  });

  // Post-processing: clean up projects
  let cleanedProjects = projects
    .filter((proj) => proj && proj.length >= 5) // Ensure minimum content
    .map((proj) => {
      // Normalize spacing
      let cleaned = proj.replace(/\s+/g, " ").trim();

      // Remove leading bullet points or numbers
      cleaned = cleaned.replace(/^[•●\-*\d\.\)]+\s*/, "");

      // Truncate if too long
      if (cleaned.length > 300) {
        cleaned = cleaned.substring(0, 297) + "...";
      }

      return cleaned;
    });

  // If no projects were found from designated sections, try to find project-like content in experience sections
  if (cleanedProjects.length === 0) {
    const experienceSections = extractSection(text, [
      "EXPERIENCE",
      "WORK EXPERIENCE",
    ]);

    experienceSections.forEach((section) => {
      // Look for project indicators in experience text
      const projectIndicators = [
        /\bbuilt\b/i,
        /\bcreated\b/i,
        /\bdeveloped\b/i,
        /\bimplemented\b/i,
        /\bproject\b/i,
        /\bapplication\b/i,
        /\bwebsite\b/i,
        /\bsystem\b/i,
      ];

      const lines = section.content.split("\n");

      // Group lines by technical content
      let technicalBlockStarted = false;
      let currentBlock = [];

      lines.forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed) {
          if (technicalBlockStarted && currentBlock.length > 0) {
            cleanedProjects.push(currentBlock.join(" ").replace(/\s+/g, " "));
            currentBlock = [];
            technicalBlockStarted = false;
          }
          return;
        }

        // Check if line has project indicators
        const hasIndicator = projectIndicators.some((pattern) =>
          pattern.test(trimmed)
        );

        if (hasIndicator) {
          technicalBlockStarted = true;
        }

        if (technicalBlockStarted) {
          currentBlock.push(trimmed);
        }
      });

      if (technicalBlockStarted && currentBlock.length > 0) {
        cleanedProjects.push(currentBlock.join(" ").replace(/\s+/g, " "));
      }
    });
  }

  return cleanedProjects;
};

// Process the resume and extract text and skills
export const parseResume = async (path, options = {}) => {
  console.log(`⏳ Parsing resume from path: ${path}`);
  // Check if the path is a URL, local file path, or a Cloudinary public ID
  const isCloudinaryUrl =
    path.startsWith("http") ||
    path.includes("cloudinary") ||
    path.startsWith("resumes/") || // Handles Cloudinary folder structure
    path.includes("/"); // Handles any path with forward slashes (likely a Cloudinary path)// Handles direct public IDs

  try {
    let dataBuffer = null;
    let tempFilePath = null;
    if (isCloudinaryUrl) {
      console.log("Cloudinary URL or public ID detected, downloading PDF...");

      // Handle different path formats
      let publicId;
      if (path.includes("/upload/")) {
        // It's a full Cloudinary URL
        publicId = path.split("/upload/")[1];
      } else if (path.startsWith("resumes/") || path.includes("/")) {
        // It's already a public ID (e.g., "resumes/userid/filename.pdf")
        publicId = path;
      } else {
        throw new Error("Invalid Cloudinary identifier format");
      }

      console.log(`Using Cloudinary public ID: ${publicId}`);

      // Download the file from Cloudinary
      try {
        dataBuffer = await getFileFromCloudinary(publicId);
        console.log(
          `Downloaded PDF from Cloudinary, size: ${dataBuffer.length} bytes`
        );
      } catch (cloudinaryError) {
        console.error("Error downloading from Cloudinary:", cloudinaryError);
        throw new Error("Failed to download PDF from Cloudinary");
      }
    } else {
      console.log("Local file path detected, reading file...");

      // Check if the path contains forward slashes but wasn't caught by isCloudinaryUrl
      if (path.includes("/") && !path.includes(":\\")) {
        console.log(
          "Path appears to be a Cloudinary ID but wasn't recognized earlier. Attempting to treat as Cloudinary ID..."
        );
        try {
          dataBuffer = await getFileFromCloudinary(path);
          console.log(
            `Downloaded PDF from Cloudinary, size: ${dataBuffer.length} bytes`
          );
        } catch (cloudinaryError) {
          console.error(
            "Failed treating as Cloudinary ID, falling back to local file read:",
            cloudinaryError
          );
          // Continue to try as local file
        }
      }

      // If we still don't have data, try as local file
      if (!dataBuffer) {
        // For local files, read the file into memory
        try {
          dataBuffer = await fs.readFile(path);
          console.log(`Read local PDF file, size: ${dataBuffer.length} bytes`);
        } catch (readError) {
          console.error("Error reading local file:", readError);
          throw new Error("Failed to read local PDF file");
        }
      }
    }

    if (!dataBuffer && response && response.data) {
      dataBuffer = Buffer.from(response.data);
    }
    if (!dataBuffer) {
      throw new Error("Failed to obtain PDF data");
    }
    console.log("PDF loaded successfully, parsing text...");

    // Parse options
    const parseMode = options.parseMode || "auto"; // 'auto', 'simplified', 'ai', 'retry'
    console.log(`Using parse mode: ${parseMode}`);

    // Clean up temporary file if it exists before parsing
    if (tempFilePath) {
      try {
        await fs.unlink(tempFilePath);
        console.log("Temporary PDF file cleaned up");
      } catch (cleanupError) {
        console.error("Error cleaning up temporary PDF file:", cleanupError);
      }
    }

    try {
      // Log buffer info for debugging
      console.log(
        `Processing PDF buffer: ${
          dataBuffer ? "Valid buffer" : "Invalid buffer"
        }, Size: ${dataBuffer ? dataBuffer.length : 0} bytes`
      );

      // First attempt: Use simplified parser
      const parsedData = await parseSimplified(dataBuffer);
      const formattedData = formatResumeData(parsedData);

      console.log("Simplified parsing complete");
      console.log(
        `Found: ${formattedData.skills?.length || 0} skills, ${
          formattedData.experience?.length || 0
        } experiences, ${formattedData.projects?.length || 0} projects`
      );

      // Check if we found exact section matches
      const { foundExactSections } = parsedData;
      console.log(`Found exact section matches: ${foundExactSections}`);

      // Check if we have meaningful content from the simplified parser
      const hasMinimalContent =
        formattedData.skills.length > 0 ||
        formattedData.experience.length > 0 ||
        formattedData.projects.length > 0;

      // If user specified a specific parseMode, honor that request
      if (
        parseMode === "simplified" ||
        (parseMode === "auto" && (hasMinimalContent || foundExactSections))
      ) {
        console.log("Using simplified parser results");
        return {
          text: parsedData.rawText || "",
          skills: formattedData.skills || [],
          experience: formattedData.experience || [],
          projects: formattedData.projects || [],
          parsedAt: new Date(),
          parseMethod: "simplified",
          foundExactSections: foundExactSections,
        };
      } else if (
        parseMode === "ai" ||
        (parseMode === "auto" && !foundExactSections && !hasMinimalContent)
      ) {
        // Use AI parser if:
        // 1. User explicitly requested AI parsing
        // 2. In auto mode, simplified parser didn't find exact sections or any content
        console.log("Attempting AI parsing");
        const rawText = parsedData.rawText || "";

        if (rawText.length > 50) {
          try {
            const aiResult = await parseResumeWithAI(rawText);

            console.log("AI parsing complete");
            console.log(
              `AI found: ${aiResult.skills?.length || 0} skills, ${
                aiResult.experience?.length || 0
              } experiences, ${aiResult.projects?.length || 0} projects`
            );

            return {
              text: rawText,
              skills: aiResult.skills || [],
              experience: aiResult.experience || [],
              projects: aiResult.projects || [],
              parsedAt: new Date(),
              parseMethod: "ai",
              foundExactSections: false,
            };
          } catch (aiError) {
            console.error("Error in AI parsing:", aiError);
            console.log(
              "AI parser failed, returning simplified results as fallback"
            );

            // Return simplified results as fallback
            return {
              text: parsedData.rawText || "",
              skills: formattedData.skills || [],
              experience: formattedData.experience || [],
              projects: formattedData.projects || [],
              parsedAt: new Date(),
              parseMethod: "simplified-fallback",
              foundExactSections: foundExactSections,
            };
          }
        } else {
          console.log(
            "Text too short for AI parsing, returning simplified results"
          );
          // Return simplified results if text is too short
          return {
            text: parsedData.rawText || "",
            skills: formattedData.skills || [],
            experience: formattedData.experience || [],
            projects: formattedData.projects || [],
            parsedAt: new Date(),
            parseMethod: "simplified-fallback",
            foundExactSections: foundExactSections,
          };
        }
      } else if (parseMode === "retry") {
        // Retry with advanced parser (for future implementation)
        console.log("Retry parsing requested, using alternative method");
        // Placeholder for retry logic
        // For now, return simplified results
        return {
          text: parsedData.rawText || "",
          skills: formattedData.skills || [],
          experience: formattedData.experience || [],
          projects: formattedData.projects || [],
          parsedAt: new Date(),
          parseMethod: "simplified-retry",
          foundExactSections: foundExactSections,
        };
      }

      // Default fallback
      return {
        text: parsedData.rawText || "",
        skills: formattedData.skills || [],
        experience: formattedData.experience || [],
        projects: formattedData.projects || [],
        parsedAt: new Date(),
        parseMethod: "simplified-default",
        foundExactSections: foundExactSections,
      };
    } catch (simplifiedError) {
      console.error("Error in simplified parsing:", simplifiedError);
      console.log("Simplified parser failed, attempting AI parser as fallback");

      try {
        // Try to extract at least some text from the PDF for AI parsing
        const fallbackData = await pdfParse(dataBuffer, {
          max: 15 * 1024 * 1024,
        });

        if (
          fallbackData &&
          fallbackData.text &&
          fallbackData.text.length > 50
        ) {
          try {
            const aiResult = await parseResumeWithAI(fallbackData.text);

            return {
              text: fallbackData.text,
              skills: aiResult.skills || [],
              experience: aiResult.experience || [],
              projects: aiResult.projects || [],
              parsedAt: new Date(),
              parseMethod: "ai-fallback",
              foundExactSections: false,
            };
          } catch (aiError) {
            console.error("AI fallback parsing failed:", aiError);
          }
        }
      } catch (fallbackError) {
        console.error("Fallback extraction failed:", fallbackError);
      }

      // If all parsing attempts failed, return empty results
      return {
        text: "",
        skills: [],
        experience: [],
        projects: [],
        parsedAt: new Date(),
        parseMethod: "failed",
        foundExactSections: false,
      };
    }
  } catch (error) {
    console.error("Error parsing resume:", error);
    throw error;
  }
};
