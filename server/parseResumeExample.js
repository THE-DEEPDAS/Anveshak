/**
 * Example script showing direct usage of the simplified resume parser
 *
 * This demonstrates how to:
 * 1. Parse a resume PDF directly
 * 2. Extract skills, experience, and projects
 * 3. Process the extracted data
 */

import fs from "fs/promises";
import {
  parseResumeText,
  formatResumeData,
} from "./services/simplifiedResumeParser.js";

async function parseResume(filePath) {
  try {
    console.log(`Parsing resume: ${filePath}`);

    // Read the PDF file
    const fileData = await fs.readFile(filePath);

    // Parse the resume
    const parsedData = await parseResumeText(fileData);

    // Format the data
    const formatted = formatResumeData(parsedData);

    // Show the results
    console.log("\n===== Resume Parsing Results =====\n");

    console.log(`Skills (${formatted.skills.length}):`);
    for (let i = 0; i < Math.min(formatted.skills.length, 10); i++) {
      console.log(`- ${formatted.skills[i]}`);
    }
    if (formatted.skills.length > 10) {
      console.log(`... and ${formatted.skills.length - 10} more skills`);
    }

    console.log(`\nExperience (${formatted.experience.length}):`);
    for (let i = 0; i < Math.min(formatted.experience.length, 3); i++) {
      console.log(
        `- ${formatted.experience[i].substring(0, 100)}${
          formatted.experience[i].length > 100 ? "..." : ""
        }`
      );
    }
    if (formatted.experience.length > 3) {
      console.log(
        `... and ${formatted.experience.length - 3} more experiences`
      );
    }

    console.log(`\nProjects (${formatted.projects.length}):`);
    for (let i = 0; i < Math.min(formatted.projects.length, 3); i++) {
      console.log(
        `- ${formatted.projects[i].substring(0, 100)}${
          formatted.projects[i].length > 100 ? "..." : ""
        }`
      );
    }
    if (formatted.projects.length > 3) {
      console.log(`... and ${formatted.projects.length - 3} more projects`);
    }

    console.log("\n===== End of Results =====");

    return formatted;
  } catch (error) {
    console.error("Error parsing resume:", error);
    return null;
  }
}

// Usage example - pass the file path as an argument
const filePath = process.argv[2];

if (!filePath) {
  console.log("Please provide a file path as an argument");
  console.log("Example: node parseResumeExample.js path/to/resume.pdf");
} else {
  parseResume(filePath);
}
