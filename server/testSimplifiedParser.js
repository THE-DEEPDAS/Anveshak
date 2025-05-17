import {
  parseResumeText,
  formatResumeData,
} from "./services/simplifiedResumeParser.js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function testSimplifiedParser() {
  try {
    // Check if a file path was provided as a command line argument
    const filePath =
      process.argv[2] ||
      path.join(__dirname, "test", "data", "05-versions-space.pdf");

    console.log(`Testing simplified resume parser with file: ${filePath}`);

    // Check if the file exists
    try {
      await fs.access(filePath);
    } catch (error) {
      console.error(`Error: The file ${filePath} does not exist.`);
      return;
    }
    console.time("Parsing resume");

    // Check if the file is a PDF or a text file
    const isTextFile = filePath.toLowerCase().endsWith(".txt");

    let contentToProcess;
    if (isTextFile) {
      // Read the text file directly
      contentToProcess = await fs.readFile(filePath, "utf8");
      console.log("Processing text file directly");
    } else {
      // Read the PDF file into buffer
      contentToProcess = await fs.readFile(filePath);
      console.log("Processing PDF file");
    }

    // Parse the resume
    const parsedResume = await parseResumeText(contentToProcess);

    console.timeEnd("Parsing resume");

    // Format the resume data
    const formattedResume = formatResumeData(parsedResume);

    // Create a output directory if it doesn't exist
    const outputDir = path.join(__dirname, "test", "output");
    await fs.mkdir(outputDir, { recursive: true });

    // Save the parsed resume to a file
    const outputPath = path.join(
      outputDir,
      `${path.basename(filePath, path.extname(filePath))}-simplified.json`
    );
    await fs.writeFile(outputPath, JSON.stringify(parsedResume, null, 2));

    console.log(`Parsing complete. Results saved to: ${outputPath}`);

    // Print some statistics
    console.log("\nResume Parsing Statistics:");
    console.log(`- Skills: ${parsedResume.skills.length}`);
    console.log(`- Experience: ${parsedResume.experience.length}`);
    console.log(`- Projects: ${parsedResume.projects.length}`);

    console.log("\nSkills Preview:");
    if (parsedResume.skills.length > 0) {
      console.log(parsedResume.skills.slice(0, 10).join(", "));
      if (parsedResume.skills.length > 10) {
        console.log(`...and ${parsedResume.skills.length - 10} more`);
      }
    } else {
      console.log("No skills found");
    }

    console.log("\nExperience Preview:");
    if (parsedResume.experience.length > 0) {
      console.log(parsedResume.experience[0]);
      if (parsedResume.experience.length > 1) {
        console.log(
          `...and ${parsedResume.experience.length - 1} more experiences`
        );
      }
    } else {
      console.log("No experience found");
    }

    console.log("\nProjects Preview:");
    if (parsedResume.projects.length > 0) {
      console.log(parsedResume.projects[0]);
      if (parsedResume.projects.length > 1) {
        console.log(`...and ${parsedResume.projects.length - 1} more projects`);
      }
    } else {
      console.log("No projects found");
    }
  } catch (error) {
    console.error("Error testing simplified resume parser:", error);
  }
}

// Run the test function
testSimplifiedParser();
