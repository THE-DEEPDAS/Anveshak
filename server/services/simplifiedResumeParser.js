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
        // Parse PDF to extract text with enhanced options based on OpenResume algorithm
        const data = await pdfParse(pdfBuffer, {
          // Use a more robust page renderer that properly extracts text content
          pagerender: function (pageData) {
            // Check the content of pageData for debugging
            console.log(
              "Page data type:",
              typeof pageData,
              "has render:",
              !!pageData.render
            );

            // Try different method if pageData has render function
            if (pageData.render) {
              try {
                console.log("Using render method for better text extraction");
                return pageData.render().then(function (opList) {
                  let text = "";
                  for (const op of opList.operatorList) {
                    if (op.fn === "showText") {
                      if (Array.isArray(op.args) && op.args.length > 0) {
                        let textContent = "";
                        for (const arg of op.args) {
                          if (typeof arg === "string") {
                            textContent += arg;
                          } else if (typeof arg === "object" && arg !== null) {
                            // Handle object notation that might contain text
                            try {
                              if (arg.str) {
                                textContent += arg.str;
                              } else if (
                                arg.items &&
                                Array.isArray(arg.items)
                              ) {
                                arg.items.forEach((item) => {
                                  if (item.str) textContent += item.str + " ";
                                });
                              }
                            } catch (e) {
                              // Ignore errors in object handling
                            }
                          }
                        }
                        text += textContent + " ";
                      }
                    }
                  }
                  return text;
                });
              } catch (err) {
                console.log("Render method failed:", err);
                // Fall back to text content method
              }
            }

            // Return the text content directly with improved processing
            // Using the OpenResume algorithm for better text extraction
            return pageData
              .getTextContent({
                normalizeWhitespace: true,
                disableCombineTextItems: false,
              })
              .then(function (textContent) {
                // Process text content items into proper strings with positioning
                // Implementation based on the algorithm described in the OpenResume parser
                let lastY,
                  text = "";
                let lineItems = [];
                let currentLine = [];
                let prevItem = null;

                // Step 1: Group text items that are on the same line
                for (let item of textContent.items) {
                  // Calculate average character width to determine if items should be joined
                  const charWidth = item.width / item.str.length || 1;

                  if (prevItem && lastY === item.transform[5]) {
                    // Check if items should be joined based on proximity
                    const distance =
                      item.transform[4] -
                      (prevItem.transform[4] + prevItem.width);
                    if (distance <= charWidth) {
                      // Items are adjacent, join them
                      currentLine.push(item);
                    } else {
                      // Items are on the same line but separated, add space
                      text += " " + item.str;
                      currentLine.push(item);
                    }
                  } else if (lastY && lastY !== item.transform[5]) {
                    // New line detected
                    if (currentLine.length > 0) {
                      lineItems.push(currentLine);
                      currentLine = [];
                    }
                    text += "\n" + item.str;
                    currentLine.push(item);
                  } else {
                    // First item
                    text += item.str;
                    currentLine.push(item);
                  }

                  lastY = item.transform[5];
                  prevItem = item;
                }

                // Add the last line if exists
                if (currentLine.length > 0) {
                  lineItems.push(currentLine);
                }

                // For debugging
                console.log(`Processed ${lineItems.length} lines from PDF`);

                return text;
              });
          },
          // Increase max content length to handle larger PDFs
          max: 15 * 1024 * 1024, // 15MB limit
        });

        // Extract the text content
        rawText = data.text;

        // Debug the text extraction
        console.log(
          `Successfully extracted text from PDF, length: ${rawText.length}`
        );

        // Check if the text contains "[object Object]" which indicates improper extraction
        if (rawText.includes("[object Object]")) {
          console.warn(
            "Warning: PDF text contains object notation. Attempting to fix."
          );
          // Try to clean up object notation
          rawText = rawText.replace(/\[object Object\]/g, "");
          // If we're left with nothing useful, try an alternative approach
          if (rawText.trim().length < 10) {
            console.warn("Trying alternative PDF parsing approach");
            const dataAlt = await pdfParse(pdfBuffer);
            if (
              dataAlt.text &&
              dataAlt.text.trim().length > 0 &&
              !dataAlt.text.includes("[object Object]")
            ) {
              rawText = dataAlt.text;
              console.log(
                "Alternative parsing successful, retrieved text length:",
                rawText.length
              );
            }
          }
        }

        if (rawText.length < 100) {
          console.log(
            "Warning: Extracted text is very short. Sample:",
            rawText.substring(0, 100)
          );
        }
      } catch (pdfError) {
        console.error("Error parsing PDF:", pdfError);

        // Try a different approach with simpler options
        try {
          console.log("Trying fallback PDF parsing approach");
          const fallbackData = await pdfParse(pdfBuffer, {
            // Use minimal options for maximum compatibility
            max: 15 * 1024 * 1024, // 15MB limit
          });

          if (
            fallbackData &&
            fallbackData.text &&
            fallbackData.text.trim().length > 0
          ) {
            rawText = fallbackData.text;
            console.log(
              "Fallback parsing successful, retrieved text length:",
              rawText.length
            );
          } else {
            // If the input might already be text, try to use it directly
            rawText = pdfBuffer.toString("utf8");
            console.log("Attempting to use buffer as text directly");
          }
        } catch (fallbackError) {
          console.error("Fallback PDF parsing failed:", fallbackError);

          // Last resort - try to use buffer as text directly
          try {
            rawText = pdfBuffer.toString("utf8");
            console.log("Attempting to use buffer as text directly");
          } catch (textError) {
            throw new Error(
              "Failed to extract text from PDF and buffer is not valid text"
            );
          }
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
 * Extract sections from text based on OpenResume algorithm
 * @param {string} text - Raw text from resume
 * @returns {Object} - Object with sections as keys and their content as values
 */
function extractSectionsFromText(text) {
  const sections = {};
  // Expanded list of section headers based on OpenResume algorithm
  const sectionHeaders = [
    // Skills section headers
    "SKILLS",
    "TECHNICAL SKILLS",
    "SKILL SET",
    "TECHNOLOGIES",
    "TECH STACK",
    "PROGRAMMING LANGUAGES",
    "LANGUAGES",
    "TOOLS",
    "TECHNICAL EXPERTISE",
    "CORE COMPETENCIES",
    "PROFICIENCIES",
    "EXPERTISE",
    "QUALIFICATIONS",
    "TECHNICAL PROFICIENCIES",
    "KEY SKILLS",
    "PROFESSIONAL SKILLS",

    // Experience section headers
    "EXPERIENCE",
    "WORK EXPERIENCE",
    "EMPLOYMENT",
    "PROFESSIONAL EXPERIENCE",
    "WORK HISTORY",
    "CAREER",
    "EMPLOYMENT HISTORY",
    "PROFESSIONAL BACKGROUND",
    "PROFESSIONAL SUMMARY",
    "CAREER HISTORY",

    // Projects section headers
    "PROJECTS",
    "PROJECT EXPERIENCE",
    "PERSONAL PROJECTS",
    "ACADEMIC PROJECTS",
    "KEY PROJECTS",
    "RELATED PROJECTS",
    "PORTFOLIO",
    "MAJOR PROJECTS",
    "PROJECT WORK",
    "SOFTWARE PROJECTS",
    "DEVELOPMENT PROJECTS",

    // Additional section headers that might be useful
    "EDUCATION",
    "CERTIFICATIONS",
    "ACHIEVEMENTS",
    "AWARDS",
    "LEADERSHIP",
    "PUBLICATIONS",
    "VOLUNTEER",
  ];

  // Step 1 & 2: Group text items into lines
  // First split text into lines and clean them
  let lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  // Handle special case for PDFs with poor extraction
  if (lines.length <= 3 && text.length > 0) {
    console.log("Very few lines detected, attempting alternate line splitting");
    // Try splitting by periods and other common delimiters
    lines = text
      .replace(/\.\s+/g, ".\n")
      .replace(/•/g, "\n•")
      .replace(/\s{3,}/g, "\n")
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  }

  console.log(`Processing ${lines.length} lines of text`);
  if (lines.length > 0) {
    console.log("Sample of first few lines:");
    lines.slice(0, 5).forEach((line) => console.log(`> ${line}`));
  }

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
        lineUpper.startsWith(header + " ") ||
        lineUpper.includes(" " + header) ||
        lineUpper.includes(" " + header + " ") ||
        lineUpper.includes(" " + header + ":")
      ) {
        matchedHeader = header;
        console.log(`Found section header: ${line} (matched: ${header})`);
        break;
      }
    }

    if (matchedHeader) {
      // Map similar headers to standard categories
      if (
        /SKILL|TECH|PROGRAMMING|LANGUAGES|TOOLS|EXPERTISE|COMPETENC|PROFICIENC|QUALIF/i.test(
          matchedHeader
        )
      ) {
        currentSection = "SKILLS";
      } else if (
        /EXPERIENCE|EMPLOYMENT|WORK|CAREER|PROFESSIONAL|BACKGROUND|HISTORY/i.test(
          matchedHeader
        )
      ) {
        currentSection = "EXPERIENCE";
      } else if (/PROJECT|PORTFOLIO/i.test(matchedHeader)) {
        currentSection = "PROJECTS";
      }

      if (!sectionContent[currentSection]) {
        sectionContent[currentSection] = [];
      }
    } else if (currentSection) {
      sectionContent[currentSection].push(line);
    }
  }

  // If no sections were found with exact matches, try looser matching with more aggressive detection
  if (Object.keys(sectionContent).length === 0) {
    console.log("No exact section headers found, trying looser matching...");

    // First identify potential section headers by formatting cues
    const potentialHeaders = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineUpper = line.toUpperCase();

      // Look for formatting cues that suggest a header
      if (
        lineUpper === lineUpper.toUpperCase() && // All caps
        line.length < 50 && // Not too long
        !/[,.;:]$/.test(line) && // Doesn't end with punctuation
        (/SKILL|TECH|LANGUAGE|TOOL|EXPERT|COMPETENC|PROFICIEN|QUALIF/i.test(
          line
        ) ||
          /EXPERIENCE|EMPLOYMENT|WORK|CAREER|PROFESSIONAL|HISTORY/i.test(
            line
          ) ||
          /PROJECT|PORTFOLIO|APPLICATION|SYSTEM|DEVELOPMENT/i.test(line))
      ) {
        potentialHeaders.push({
          index: i,
          line: line,
          type: /SKILL|TECH|LANGUAGE|TOOL|EXPERT|COMPETENC|PROFICIEN|QUALIF/i.test(
            line
          )
            ? "SKILLS"
            : /EXPERIENCE|EMPLOYMENT|WORK|CAREER|PROFESSIONAL|HISTORY/i.test(
                line
              )
            ? "EXPERIENCE"
            : /PROJECT|PORTFOLIO|APPLICATION|SYSTEM|DEVELOPMENT/i.test(line)
            ? "PROJECTS"
            : null,
        });
        console.log(
          `Found potential header: ${line} (type: ${
            potentialHeaders[potentialHeaders.length - 1].type
          })`
        );
      }
    }

    // If potential headers were found, process them
    if (potentialHeaders.length > 0) {
      for (let i = 0; i < potentialHeaders.length; i++) {
        const header = potentialHeaders[i];
        const nextHeaderIndex =
          i < potentialHeaders.length - 1
            ? potentialHeaders[i + 1].index
            : lines.length;

        // Get content between this header and the next one
        const content = lines.slice(header.index + 1, nextHeaderIndex);
        if (!sectionContent[header.type]) {
          sectionContent[header.type] = [];
        }
        sectionContent[header.type] =
          sectionContent[header.type].concat(content);
      }
    }
  }

  // If still no sections, use keyword-based content assignment approach
  if (Object.keys(sectionContent).length === 0) {
    console.log("Still no sections found, trying content-based assignment...");

    // Check for skill indicators (languages, technologies, etc.)
    const skillLines = [];
    const experienceLines = [];
    const projectLines = [];

    // Common skill indicators
    const skillIndicators = [
      "javascript",
      "python",
      "java",
      "c++",
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
      "proficient in",
      "expertise in",
      "familiar with",
      "skilled in",
    ];

    // Experience indicators
    const experienceIndicators = [
      /\b\d{4}\s*(-|to|–)\s*(\d{4}|present)\b/i, // Date ranges
      /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}\b/i, // Month Year
      /\b(senior|junior|lead|developer|engineer|manager|director)\b/i, // Job titles
    ];

    // Project indicators
    const projectIndicators = [
      /\bbuilt\b/i,
      /\bcreated\b/i,
      /\bdeveloped\b/i,
      /\bproject\b/i,
      /\bapplication\b/i,
      /\bwebsite\b/i,
    ];

    for (const line of lines) {
      const lowerLine = line.toLowerCase();

      // Check for skill indicators
      if (skillIndicators.some((indicator) => lowerLine.includes(indicator))) {
        skillLines.push(line);
      }

      // Check for experience indicators
      if (experienceIndicators.some((indicator) => indicator.test(line))) {
        experienceLines.push(line);
      }

      // Check for project indicators
      if (projectIndicators.some((indicator) => indicator.test(line))) {
        projectLines.push(line);
      }
    }

    if (skillLines.length > 0) {
      sectionContent["SKILLS"] = skillLines;
      console.log(
        `Found ${skillLines.length} potential skill lines based on content`
      );
    }

    if (experienceLines.length > 0) {
      sectionContent["EXPERIENCE"] = experienceLines;
      console.log(
        `Found ${experienceLines.length} potential experience lines based on content`
      );
    }

    if (projectLines.length > 0) {
      sectionContent["PROJECTS"] = projectLines;
      console.log(
        `Found ${projectLines.length} potential project lines based on content`
      );
    }

    // If no sections were found even with content-based approach, just try to identify something
    if (Object.keys(sectionContent).length === 0) {
      console.log("Last resort: using generic content classification");

      // Check for common bullet point or dash patterns that might indicate skills
      const bulletLines = lines.filter((line) => /^[•◦\-*]/.test(line));
      if (bulletLines.length > 0) {
        sectionContent["SKILLS"] = bulletLines;
        console.log(
          `Found ${bulletLines.length} bullet points that might be skills`
        );
      }

      // Look for lines that might be experience (containing dates)
      const dateLines = lines.filter((line) => /\b\d{4}\b/.test(line));
      if (dateLines.length > 0) {
        sectionContent["EXPERIENCE"] = dateLines;
        console.log(
          `Found ${dateLines.length} lines with dates that might be experience`
        );
      }

      // In case the resume text is extremely minimal or no lines were found
      if (lines.length < 5 && rawText.length > 0) {
        console.log(
          "Minimal text detected, attempting to process raw text directly"
        ); // Attempt to extract words that might be skills
        const potentialSkillWords =
          rawText.match(/\b[A-Za-z][A-Za-z+#.]{2,}\b/g) || [];

        // Define common tech skills here to avoid reference error
        const commonSkills = [
          "javascript",
          "python",
          "java",
          "react",
          "node",
          "typescript",
          "html",
          "css",
          "sql",
          "mongodb",
          "aws",
          "docker",
          "git",
          "c++",
          "c#",
          "excel",
          "data",
        ];

        const techSkills = potentialSkillWords.filter((word) => {
          const lowerWord = word.toLowerCase();
          return (
            commonSkills.includes(lowerWord) ||
            /javascript|python|java|react|node|sql|html|css|c\+\+|excel/i.test(
              lowerWord
            )
          );
        });

        if (techSkills.length > 0) {
          sectionContent["SKILLS"] = techSkills;
          console.log(
            `Found ${techSkills.length} potential skills from raw text`
          );
        }
      }
    }
  }

  // Handle special case for skills sections that might be labeled as categories
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (
      line.includes("Programming Languages:") ||
      line.includes("Artificial Intelligence:") ||
      line.includes("Web Development:") ||
      line.includes("Databases & Tools:") ||
      line.includes("Other Skills:") ||
      line.includes("Technical Skills:") ||
      line.includes("Frameworks:") ||
      line.includes("Technologies:") ||
      line.match(/\w+:\s*([\w\s,]+)/) // Any word followed by colon and list
    ) {
      if (!sectionContent["SKILLS"]) {
        sectionContent["SKILLS"] = [];
        console.log(`Found skill category header: ${line}`);
      }
      sectionContent["SKILLS"].push(line);
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
  // Common tech skills to look for in resume text
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
    "php",
    "swift",
    "kotlin",
    "rust",
    "perl",
    "r",
    "bash",
    "shell",
    "scala",

    // Frontend
    "react",
    "angular",
    "vue",
    "svelte",
    "jquery",
    "html",
    "css",
    "sass",
    "bootstrap",
    "tailwind",
    "next.js",
    "gatsby",
    "webpack",
    "vite",

    // Backend
    "node",
    "express",
    "django",
    "flask",
    "spring",
    "aspnet",
    ".net",
    "laravel",
    "graphql",
    "rest api",
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
    "dynamodb",
    "firebase",

    // Cloud & DevOps
    "aws",
    "azure",
    "gcp",
    "docker",
    "kubernetes",
    "jenkins",
    "ci/cd",
    "terraform",
    "ansible",
    "git",
    "github",
    "gitlab",

    // AI/ML
    "machine learning",
    "deep learning",
    "nlp",
    "ai",
    "tensorflow",
    "pytorch",
    "keras",
    "scikit-learn",
    "data science",
    "computer vision",

    // Mobile
    "react native",
    "flutter",
    "android",
    "ios",
    "swift",
    "kotlin",
  ];

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

  // First, attempt to divide experience section into subsections
  // Using the vertical line gap heuristic mentioned in the algorithm
  let subsections = divideIntoSubsections(experienceSection);

  // If no subsections found using vertical line gap, try feature scoring
  if (subsections.length <= 1) {
    // Use feature scoring to identify experience entries
    const scoredExperiences = featureScoreExtraction(
      experienceSection,
      "experience"
    );
    if (scoredExperiences.length > 0) {
      return scoredExperiences.map((item) => item.text);
    }
  }

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
 * Divide section lines into subsections based on vertical line gap heuristic
 * @param {Array} lines - Array of lines in a section
 * @returns {Array} - Array of subsections (each subsection is an array of lines)
 */
function divideIntoSubsections(lines) {
  if (!lines || lines.length === 0) return [];

  const subsections = [];
  let currentSubsection = [lines[0]];
  const typicalLineGapThreshold = 1.4; // Based on algorithm description

  // Calculate typical line height from first few lines
  let lastLineIndex = Math.min(10, lines.length);
  let totalGap = 0;
  let gapCount = 0;

  for (let i = 1; i < lastLineIndex; i++) {
    // In a real PDF we'd measure vertical position, here we simulate with line breaks
    totalGap += 1;
    gapCount++;
  }

  const avgLineGap = gapCount > 0 ? totalGap / gapCount : 1;
  const subsectionThreshold = avgLineGap * typicalLineGapThreshold;

  // Identify subsections based on empty lines or section header formatting
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const prevLine = lines[i - 1];

    // Check for subsection divider: either empty line (simulated by gap) or section header formatting
    const isNewSubsection =
      (i > 1 && lines[i - 1] === "") || // Empty line
      (line.toUpperCase() === line && line.length < 50) || // All caps, not too long
      /\b\d{4}\s*(-|–|to)\s*(\d{4}|present)/i.test(line) || // Date range usually indicates new position
      (/^[•◦\-*]/.test(line) && !/^[•◦\-*]/.test(prevLine)); // First bullet of a list

    if (isNewSubsection) {
      if (currentSubsection.length > 0) {
        subsections.push(currentSubsection);
        currentSubsection = [];
      }
    }

    currentSubsection.push(line);
  }

  // Add the last subsection
  if (currentSubsection.length > 0) {
    subsections.push(currentSubsection);
  }

  return subsections;
}

/**
 * Feature scoring system for better attribute extraction
 * Implements the algorithm described in OpenResume parser
 * @param {Array} lines - Lines from a section
 * @param {string} attributeType - The type of attribute to extract
 * @returns {Array} - Extracted attributes with scores
 */
function featureScoreExtraction(lines, attributeType) {
  const results = [];
  const featureSets = getFeatureSetsByType(attributeType);

  for (const line of lines) {
    let score = 0;
    // Apply all feature sets to the line
    for (const feature of featureSets) {
      if (feature.match(line)) {
        score += feature.score;
      }
    }

    if (score > 0) {
      results.push({
        text: line,
        score: score,
      });
    }
  }

  // Sort by score in descending order
  return results.sort((a, b) => b.score - a.score);
}

/**
 * Get feature sets for different attribute types
 * @param {string} attributeType - Type of attribute (skills, experience, projects)
 * @returns {Array} - Array of feature set objects
 */
function getFeatureSetsByType(attributeType) {
  const commonSets = [
    { match: (line) => /github|website|www\.|http/i.test(line), score: -5 }, // Ignore links
  ];

  if (attributeType === "skills") {
    return [
      ...commonSets,
      // Positive features for skills
      {
        match: (line) =>
          /\b(proficient|skilled|familiar|experience)\s+(in|with)\b/i.test(
            line
          ),
        score: 5,
      },
      {
        match: (line) =>
          /\b(languages|frameworks|tools|technologies)\s*:/i.test(line),
        score: 5,
      },
      {
        match: (line) =>
          /\b(javascript|python|java|react|angular|node|aws|docker)\b/i.test(
            line
          ),
        score: 4,
      },
      {
        match: (line) =>
          line.includes(",") &&
          /\b[a-zA-Z+#]{2,}(,\s*[a-zA-Z+#]{2,})+\b/i.test(line),
        score: 3,
      }, // Comma-separated list
      // Negative features for skills
      { match: (line) => /\b\d{4}\b/.test(line), score: -3 }, // Contains year, likely experience
      {
        match: (line) =>
          /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/i.test(line),
        score: -4,
      }, // Contains month
    ];
  } else if (attributeType === "experience") {
    return [
      ...commonSets,
      // Positive features for experience
      {
        match: (line) => /\b\d{4}\s*(-|–|to)\s*(\d{4}|present)\b/i.test(line),
        score: 5,
      }, // Date range
      {
        match: (line) =>
          /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d{4}\b/i.test(
            line
          ),
        score: 5,
      }, // Month year
      {
        match: (line) =>
          /\b(senior|junior|lead|developer|engineer|manager|director|coordinator)\b/i.test(
            line
          ),
        score: 4,
      }, // Job titles
      {
        match: (line) => /\b(company|corporation|inc|llc|ltd)\b/i.test(line),
        score: 3,
      }, // Company indicators
      // Negative features for experience
      {
        match: (line) =>
          /\b(project|application|web|mobile|app|developed|created|built)\b/i.test(
            line
          ) && !/\b\d{4}\b/.test(line),
        score: -3,
      }, // Likely projects without dates
    ];
  } else if (attributeType === "projects") {
    return [
      ...commonSets,
      // Positive features for projects
      {
        match: (line) =>
          /\b(project|application|web|mobile|app|developed|created|built)\b/i.test(
            line
          ),
        score: 5,
      },
      { match: (line) => /\b(github|demo|website)\b/i.test(line), score: 3 }, // Project link indicators
      {
        match: (line) =>
          /\b(using|utilized|with|technologies|tech stack)\b/i.test(line),
        score: 2,
      },
      // Negative features for projects
      {
        match: (line) => /\b(company|corporation|inc|llc|ltd)\b/i.test(line),
        score: -4,
      }, // Company indicators
      {
        match: (line) =>
          /\b(senior|junior|lead|manager|director|coordinator)\b/i.test(line),
        score: -3,
      }, // Job titles
    ];
  }

  // Default feature set
  return commonSets;
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
