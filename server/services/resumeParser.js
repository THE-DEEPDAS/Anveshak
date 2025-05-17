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

export const parseResumeText = async (publicId, previousVersion = null) => {
  let dataBuffer = null;
  try {
    console.log("Starting resume parsing for publicId:", publicId);

    // Get PDF from Cloudinary
    const result = await cloudinary.api.resource(publicId, {
      resource_type: "raw",
    });

    // Download PDF with improved error handling
    console.log("Downloading PDF from Cloudinary...");
    let response;
    try {
      response = await axios.get(result.secure_url, {
        responseType: "arraybuffer",
        timeout: 30000, // 30 second timeout
        maxContentLength: 15 * 1024 * 1024, // 15MB limit
        headers: {
          Accept: "application/pdf",
        },
      });
    } catch (downloadError) {
      console.error("Error downloading PDF:", downloadError.message);

      // Try an alternative download method
      console.log("Retrying with getFileFromCloudinary...");
      const altData = await getFileFromCloudinary(publicId);
      if (altData) {
        dataBuffer = Buffer.from(altData);
      } else {
        throw new Error("Failed to download PDF after retries");
      }
    }

    if (!dataBuffer && response && response.data) {
      dataBuffer = Buffer.from(response.data);
    }

    if (!dataBuffer) {
      throw new Error("Failed to obtain PDF data");
    }

    console.log("PDF downloaded successfully, parsing text...");

    // Parse PDF with enhanced options for better text extraction
    const data = await pdfParse(dataBuffer, {
      pagerender: (pageData) => {
        return pageData.getTextContent({
          normalizeWhitespace: true,
          disableCombineTextItems: false, // Ensure text items are properly combined
        });
      },
      // Increase max content length to handle larger PDFs
      max: 15 * 1024 * 1024, // 15MB
    });

    if (!data || !data.text) {
      throw new Error("Failed to extract text from PDF");
    }

    let text = data.text.trim();

    // Text pre-processing to improve parsing
    text = text
      .replace(/\r\n/g, "\n") // Normalize line endings
      .replace(/\f/g, "\n\n") // Replace form feeds with double newlines
      .replace(/([A-Za-z0-9])(\n)([A-Za-z0-9])/g, "$1 $3") // Join words broken across lines
      .replace(/\n{3,}/g, "\n\n"); // Replace multiple newlines with double newlines

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

    // 1. Try regular parsing first with improved extractors
    console.log("Attempting regular parsing...");
    const regularSkills = extractSkills(text);
    const regularExperience = extractExperience(text);
    const regularProjects = extractProjects(text);

    // Check if we got substantial content from regular parsing
    const hasSubstantialRegularContent =
      regularSkills.length >= 3 ||
      regularExperience.length >= 1 ||
      regularProjects.length >= 1;

    if (hasSubstantialRegularContent) {
      console.log("Regular parsing successful");
      console.log(
        `Found: ${regularSkills.length} skills, ${regularExperience.length} experiences, ${regularProjects.length} projects`
      );

      return {
        text,
        skills: regularSkills,
        experience: regularExperience,
        projects: regularProjects,
        parsedAt: new Date(),
        parseMethod: "regular",
      };
    }

    // 2. If regular parsing found limited content, try AI parsing
    console.log("Regular parsing found minimal content, trying AI parsing...");
    try {
      const aiResult = await parseResumeWithAI(text);

      // Check if AI returned substantial content
      const hasSubstantialAiContent =
        aiResult &&
        (aiResult.skills?.length >= 3 ||
          aiResult.experience?.length >= 1 ||
          aiResult.projects?.length >= 1);

      if (hasSubstantialAiContent) {
        console.log("AI parsing successful");
        console.log(
          `AI Found: ${aiResult.skills?.length || 0} skills, ${
            aiResult.experience?.length || 0
          } experiences, ${aiResult.projects?.length || 0} projects`
        );

        return {
          text,
          ...aiResult,
          parsedAt: new Date(),
          parseMethod: "ai",
        };
      } // 3. If AI parsing didn't find enough content, combine both results
      console.log("Combining regular and AI parsing results...");

      // Prioritize AI skills but ensure we don't miss any skills from regular parsing
      // This creates a more comprehensive skill list by combining both methods
      const aiSkills = aiResult?.skills || [];
      let combinedSkills = [...aiSkills];

      // Add any regular skills that weren't found by AI
      regularSkills.forEach((skill) => {
        // Only add if not already present (case insensitive comparison)
        if (
          !combinedSkills.some((s) => s.toLowerCase() === skill.toLowerCase())
        ) {
          combinedSkills.push(skill);
        }
      });

      // Merge experiences (prefer AI experiences if available, but add any missing regular experiences)
      const combinedExperiences = [
        ...new Set([...(aiResult?.experience || []), ...regularExperience]),
      ];

      // Merge projects (prefer AI projects if available, but add any missing regular projects)
      const combinedProjects = [
        ...new Set([...(aiResult?.projects || []), ...regularProjects]),
      ];

      const hasSomeCombinedContent =
        combinedSkills.length > 0 ||
        combinedExperiences.length > 0 ||
        combinedProjects.length > 0;

      if (hasSomeCombinedContent) {
        const warningMessage =
          combinedSkills.length < 3
            ? "Limited skills detected. Please review and add any missing skills."
            : "Resume parsed successfully with combined methods.";

        console.log("Combined parsing partially successful");
        console.log(
          `Combined: ${combinedSkills.length} skills, ${combinedExperiences.length} experiences, ${combinedProjects.length} projects`
        );

        return {
          text,
          skills: combinedSkills,
          experience: combinedExperiences,
          projects: combinedProjects,
          parsedAt: new Date(),
          parseMethod: "combined",
          warning: warningMessage,
        };
      }

      // 4. If we still have no content, check for previous version data
      if (
        previousVersion &&
        (previousVersion.skills?.length > 0 ||
          previousVersion.experience?.length > 0 ||
          previousVersion.projects?.length > 0)
      ) {
        console.log("Using data from previous version");

        return {
          text,
          skills: previousVersion.skills || [],
          experience: previousVersion.experience || [],
          projects: previousVersion.projects || [],
          parsedAt: new Date(),
          parseMethod: "previous_version",
          warning:
            "Using data from previous version. Please review and update as needed.",
        };
      }

      // 5. Last resort: return empty data with a manual intervention warning
      const warningMessage =
        "Automated parsing could not extract structured data. Please manually add your skills and experience.";
      console.warn(warningMessage);

      return {
        text,
        skills: [],
        experience: [],
        projects: [],
        parsedAt: new Date(),
        parseMethod: "manual_required",
        warning: warningMessage,
      };
    } catch (aiError) {
      console.error("AI parsing error:", aiError);

      // Fallback to regular parsing results even if limited
      const hasAnyRegularContent =
        regularSkills.length > 0 ||
        regularExperience.length > 0 ||
        regularProjects.length > 0;

      if (hasAnyRegularContent) {
        const warningMessage =
          "AI parsing failed, but some content was extracted. Please review and add missing information.";
        console.warn(warningMessage);

        return {
          text,
          skills: regularSkills,
          experience: regularExperience,
          projects: regularProjects,
          parsedAt: new Date(),
          parseMethod: "regular_fallback",
          warning: warningMessage,
        };
      }

      // If no content at all, return empty with warning
      const warningMessage =
        "Automated parsing had difficulties. Please manually add your skills and experience.";
      console.warn(warningMessage);

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

    // If we have a previous version, use that as fallback
    if (
      previousVersion &&
      (previousVersion.skills?.length > 0 ||
        previousVersion.experience?.length > 0 ||
        previousVersion.projects?.length > 0)
    ) {
      console.log("Error in parsing, using data from previous version");

      return {
        text: previousVersion.text || "",
        skills: previousVersion.skills || [],
        experience: previousVersion.experience || [],
        projects: previousVersion.projects || [],
        parsedAt: new Date(),
        parseMethod: "previous_version_error_fallback",
        warning:
          "There was an error parsing your resume. Using previously stored data. Please review and update as needed.",
      };
    }

    throw error;
  }
};
