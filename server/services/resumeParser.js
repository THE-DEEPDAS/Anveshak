import pdfParse from "pdf-parse";
import fs from "fs";
import path from "path";
import {
  getSkillsFromText,
  getExperienceFromText,
  getProjectsFromText,
} from "./aiService.js";
import { v2 as cloudinary } from "cloudinary";
import axios from "axios";

// Configure Cloudinary
const configureCloudinary = () => {
  // Check for individual environment variables first
  if (
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  ) {
    return cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });
  }

  // Fall back to CLOUDINARY_URL if individual vars aren't set
  if (!process.env.CLOUDINARY_URL) {
    console.error(
      "Cloudinary configuration is missing. Please set CLOUDINARY_URL or individual credentials."
    );
    if (process.env.NODE_ENV === "production") {
      throw new Error("Cloudinary configuration is required");
    }
    return null;
  }

  try {
    // Parse CLOUDINARY_URL (format: cloudinary://api_key:api_secret@cloud_name)
    const cloudinaryUrl = process.env.CLOUDINARY_URL;
    const match = cloudinaryUrl.match(/cloudinary:\/\/([^:]+):([^@]+)@(.+)/);

    if (!match) {
      throw new Error("Invalid CLOUDINARY_URL format");
    }

    const [_, apiKey, apiSecret, cloudName] = match;

    return cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });
  } catch (error) {
    console.error("Error configuring Cloudinary:", error.message);
    if (process.env.NODE_ENV === "production") {
      throw error;
    }
    return null;
  }
};

// Initialize Cloudinary configuration
configureCloudinary();

export const parseResumeText = async (
  cloudinaryUrl,
  previousVersion = null
) => {
  let dataBuffer = null;

  try {
    // Ensure we have a valid Cloudinary URL
    if (!cloudinaryUrl) {
      throw new Error("Cloudinary URL is required");
    }

    // Extract public ID from URL if it's a full Cloudinary URL
    let publicId;
    if (cloudinaryUrl.includes("cloudinary.com")) {
      const urlParts = cloudinaryUrl.split("/");
      publicId = urlParts
        .slice(urlParts.indexOf("upload") + 1)
        .join("/")
        .split(".")[0];
    } else {
      publicId = cloudinaryUrl;
    }

    // Check if Cloudinary is configured
    if (!cloudinary.config().api_key) {
      throw new Error("Cloudinary is not properly configured");
    }

    // Generate signed URL with authentication
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = cloudinary.utils.api_sign_request(
      {
        public_id: publicId,
        timestamp: timestamp,
        resource_type: "raw",
        type: "private",
      },
      cloudinary.config().api_secret
    );

    // Create authenticated URL
    const downloadUrl = cloudinary.url(publicId, {
      resource_type: "raw",
      type: "private",
      timestamp: timestamp,
      signature: signature,
      api_key: cloudinary.config().api_key,
      secure: true,
    });

    // Download file from Cloudinary using axios
    try {
      const response = await axios({
        method: "get",
        url: downloadUrl,
        responseType: "arraybuffer",
        headers: {
          "User-Agent": "Cold-Mailer-App/1.0",
        },
      });

      if (!response.data) {
        throw new Error("No data received from Cloudinary");
      }

      dataBuffer = Buffer.from(response.data);
    } catch (downloadError) {
      console.error(
        "Error downloading from Cloudinary:",
        downloadError.message
      );
      if (downloadError.response) {
        console.error("Response status:", downloadError.response.status);
        console.error("Response headers:", downloadError.response.headers);
      }
      throw new Error(
        `Failed to download file from Cloudinary: ${downloadError.message}`
      );
    }

    // Parse PDF
    if (!dataBuffer || dataBuffer.length === 0) {
      throw new Error("Invalid PDF data received");
    }

    const data = await pdfParse(dataBuffer);

    if (!data || !data.text || data.text.trim().length === 0) {
      throw new Error("No text content found in PDF");
    }

    const text = data.text;

    // Extract information using AI with previous context if available
    const [skills, experience, projects] = await Promise.all([
      getSkillsFromText(text, previousVersion?.skills),
      getExperienceFromText(text, previousVersion?.experience),
      getProjectsFromText(text, previousVersion?.projects),
    ]);

    // Validate the parsed data
    if (!skills?.length && !experience?.length && !projects?.length) {
      throw new Error("No relevant content extracted from PDF");
    }

    const parseResult = {
      skills,
      experience,
      projects,
      parsedAt: new Date(),
    };

    return parseResult;
  } catch (error) {
    console.error("Resume parsing error:", error);

    // In production, fail on parsing errors
    if (process.env.NODE_ENV === "production") {
      throw new Error("Resume parsing failed: " + error.message);
    }

    // In development, try basic parsing if we have the data buffer
    if (dataBuffer) {
      try {
        console.log("Attempting basic parsing...");
        const text = await pdfParse(dataBuffer);
        const parsedData = await parseTextWithoutAI(text.text);
        if (
          parsedData.skills.length > 0 ||
          parsedData.experience.length > 0 ||
          parsedData.projects.length > 0
        ) {
          console.log("Successfully parsed resume using basic parsing");
          return parsedData;
        }
      } catch (parseError) {
        console.error("Basic parsing failed:", parseError);
      }
    }

    console.warn("Falling back to mock data for development");
    return getMockResumeData();
  }
};

// Basic text parsing function without AI
const parseTextWithoutAI = async (text) => {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const skills = [];
  const experience = [];
  const projects = [];

  let currentSection = "";

  for (const line of lines) {
    const lowerLine = line.toLowerCase();

    // Detect sections
    if (
      lowerLine.includes("skill") ||
      lowerLine.includes("technology") ||
      lowerLine.includes("tech stack")
    ) {
      currentSection = "skills";
      continue;
    } else if (
      lowerLine.includes("experience") ||
      lowerLine.includes("work") ||
      lowerLine.includes("employment")
    ) {
      currentSection = "experience";
      continue;
    } else if (
      lowerLine.includes("project") ||
      lowerLine.includes("portfolio")
    ) {
      currentSection = "projects";
      continue;
    }

    // Skip common section headers
    if (
      lowerLine.includes("education") ||
      lowerLine.includes("contact") ||
      lowerLine.includes("reference") ||
      lowerLine.includes("summary") ||
      lowerLine.length < 3
    ) {
      continue;
    }

    // Add content to appropriate section
    switch (currentSection) {
      case "skills":
        // Split line into individual skills
        line.split(/[,|•]/).forEach((skill) => {
          const cleanedSkill = skill.trim();
          if (cleanedSkill.length > 2 && !skills.includes(cleanedSkill)) {
            skills.push(cleanedSkill);
          }
        });
        break;
      case "experience":
        if (line.length > 10) {
          experience.push(line);
        }
        break;
      case "projects":
        if (line.length > 10) {
          projects.push(line);
        }
        break;
    }
  }

  return {
    skills,
    experience,
    projects,
    parsedAt: new Date(),
  };
};

// Function to iterate parsing with feedback
export const iterateParsing = async (resume, feedback) => {
  try {
    // Get the latest parse result
    const latestVersion = resume.parseHistory[resume.parseHistory.length - 1];

    // Parse again with feedback context
    const newParseResult = await parseResumeText(
      resume.cloudinaryUrl,
      latestVersion
    );

    // Add new parse result to history
    resume.parseHistory.push(newParseResult);
    resume.currentVersion += 1;

    // Update current values
    resume.skills = newParseResult.skills;
    resume.experience = newParseResult.experience;
    resume.projects = newParseResult.projects;

    return resume;
  } catch (error) {
    console.error("Parse iteration error:", error);
    throw error;
  }
};

// Mock data for development/testing
const getMockResumeData = () => ({
  skills: ["JavaScript", "React", "Node.js", "MongoDB", "Express"],
  experience: [
    "Frontend Developer - Built responsive web applications",
    "Backend Developer - Developed RESTful APIs",
  ],
  projects: [
    "E-commerce Platform - MERN stack application",
    "Portfolio Website - React and Node.js",
  ],
  parsedAt: new Date(),
});
