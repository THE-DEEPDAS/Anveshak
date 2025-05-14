import pdfParse from "pdf-parse";
import fs from "fs";
import path from "path";
import {
  getSkillsFromText,
  getExperienceFromText,
  getProjectsFromText,
} from "./aiService.js";
import { v2 as cloudinary } from "cloudinary";
import https from "https";
import { config } from "../config/config.js";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const parseResumeText = async (
  cloudinaryUrl,
  previousVersion = null
) => {
  try {
    // Get secure URL from Cloudinary
    const secureUrl = cloudinaryUrl.startsWith("http")
      ? cloudinaryUrl
      : cloudinary.url(cloudinaryUrl, {
          secure: true,
          resource_type: "raw",
          sign_url: true, // Add signature to URL
        });

    // Download file from Cloudinary with auth headers
    const dataBuffer = await new Promise((resolve, reject) => {
      const options = {
        headers: {
          Authorization: `Basic ${Buffer.from(
            process.env.CLOUDINARY_API_KEY +
              ":" +
              process.env.CLOUDINARY_API_SECRET
          ).toString("base64")}`,
        },
      };

      https
        .get(secureUrl, options, (response) => {
          if (response.statusCode !== 200) {
            reject(
              new Error(
                `Failed to fetch file from Cloudinary: ${response.statusCode} ${response.statusMessage}`
              )
            );
            return;
          }

          const chunks = [];
          response.on("data", (chunk) => chunks.push(chunk));
          response.on("end", () => resolve(Buffer.concat(chunks)));
          response.on("error", reject);
        })
        .on("error", reject);
    });

    // Parse PDF
    const data = await pdfParse(dataBuffer);

    if (!data || !data.text || data.text.trim().length === 0) {
      throw new Error("No text content found in PDF");
    }

    const text = data.text;

    // Only use mock data in development if no GEMINI_API_KEY AND text parsing failed
    if (!process.env.GEMINI_API_KEY) {
      console.warn("Warning: GEMINI_API_KEY not set");
      try {
        // Try basic text parsing before falling back to mock data
        const parsedData = await parseTextWithoutAI(text);
        if (
          parsedData.skills.length > 0 ||
          parsedData.experience.length > 0 ||
          parsedData.projects.length > 0
        ) {
          console.log("Successfully parsed resume without AI");
          return parsedData;
        }
      } catch (parseError) {
        console.error("Basic parsing failed:", parseError);
      }
      console.log("Falling back to mock data");
      return getMockResumeData();
    }

    // Extract information using AI with previous context if available
    const [skills, experience, projects] = await Promise.all([
      getSkillsFromText(text, previousVersion?.skills),
      getExperienceFromText(text, previousVersion?.experience),
      getProjectsFromText(text, previousVersion?.projects),
    ]);

    // Validate the parsed data
    if (!skills?.length && !experience?.length && !projects?.length) {
      throw new Error("AI parsing returned no data");
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

    // In production, fail if parsing fails
    if (process.env.NODE_ENV === "production") {
      throw new Error("Resume parsing failed: " + error.message);
    }

    // In development, try basic parsing before using mock data
    try {
      const text = await pdfParse(dataBuffer);
      const parsedData = await parseTextWithoutAI(text.text);
      if (
        parsedData.skills.length > 0 ||
        parsedData.experience.length > 0 ||
        parsedData.projects.length > 0
      ) {
        return parsedData;
      }
    } catch (parseError) {
      console.error("Basic parsing failed:", parseError);
    }

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
