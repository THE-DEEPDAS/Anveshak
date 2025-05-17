import {
  parseResumePdf,
  formatResumeData,
} from "./services/advancedResumeParser.js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function testResumeParser() {
  try {
    // Check if a file path was provided as a command line argument
    const filePath =
      process.argv[2] ||
      path.join(__dirname, "test", "data", "05-versions-space.pdf");

    console.log(`Testing advanced resume parser with file: ${filePath}`);

    // Check if the file exists
    try {
      await fs.access(filePath);
    } catch (error) {
      console.error(`Error: The file ${filePath} does not exist.`);
      return;
    }

    console.time("Parsing resume");

    // Parse the resume
    const parsedResume = await parseResumePdf(filePath);

    console.timeEnd("Parsing resume");

    // Format the resume data
    const formattedResume = formatResumeData(parsedResume);

    // Create a output directory if it doesn't exist
    const outputDir = path.join(__dirname, "test", "output");
    await fs.mkdir(outputDir, { recursive: true });

    // Save the parsed resume to a file
    const outputPath = path.join(
      outputDir,
      `${path.basename(filePath, path.extname(filePath))}-parsed.json`
    );
    await fs.writeFile(outputPath, JSON.stringify(parsedResume, null, 2));

    // Save the formatted resume to a file
    const formattedOutputPath = path.join(
      outputDir,
      `${path.basename(filePath, path.extname(filePath))}-formatted.json`
    );
    await fs.writeFile(
      formattedOutputPath,
      JSON.stringify(formattedResume, null, 2)
    );

    console.log(
      `Parsing complete. Results saved to:\n- ${outputPath}\n- ${formattedOutputPath}`
    );

    // Print some statistics
    console.log("\nResume Parsing Statistics:");
    console.log(
      `- Profile Information: ${
        Object.values(parsedResume.profile).filter(Boolean).length
      } items`
    );
    console.log(`- Education Entries: ${parsedResume.education.length}`);
    console.log(`- Experience Entries: ${parsedResume.experience.length}`);
    console.log(
      `- Skills: ${Object.values(parsedResume.skills).flat().length}`
    );
    console.log(`- Projects: ${parsedResume.projects.length}`);

    console.log("\nFormatted Resume Preview:");
    if (formattedResume.profile && formattedResume.profile.name) {
      console.log(`Name: ${formattedResume.profile.name}`);
    }
    if (formattedResume.skills && formattedResume.skills.length) {
      console.log(
        `Skills: ${formattedResume.skills.slice(0, 5).join(", ")}${
          formattedResume.skills.length > 5 ? "..." : ""
        }`
      );
    }
    if (formattedResume.experience && formattedResume.experience.length) {
      console.log(
        `Latest Experience: ${formattedResume.experience[0].title} at ${formattedResume.experience[0].company}`
      );
    }
  } catch (error) {
    console.error("Error testing resume parser:", error);
  }
}

// Run the test function
testResumeParser();
