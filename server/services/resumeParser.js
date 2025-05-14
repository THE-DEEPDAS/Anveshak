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
    // Get secure URL from Cloudinary if it's a public ID
    const secureUrl = cloudinaryUrl.startsWith("http")
      ? cloudinaryUrl
      : cloudinary.url(cloudinaryUrl, { secure: true, resource_type: "raw" });

    // Download file from Cloudinary
    const dataBuffer = await new Promise((resolve, reject) => {
      https
        .get(secureUrl, (response) => {
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

    // For development/testing
    if (!process.env.GEMINI_API_KEY) {
      console.log("Warning: GEMINI_API_KEY not set, using mock data");
      return getMockResumeData();
    }

    // If we have previous version data, include it in the AI context
    const previousContext = previousVersion
      ? {
          skills: previousVersion.skills,
          experience: previousVersion.experience,
          projects: previousVersion.projects,
        }
      : null;

    // Extract information using AI with previous context if available
    const [skills, experience, projects] = await Promise.all([
      getSkillsFromText(text, previousContext?.skills),
      getExperienceFromText(text, previousContext?.experience),
      getProjectsFromText(text, previousContext?.projects),
    ]);

    const parseResult = {
      skills,
      experience,
      projects,
      parsedAt: new Date(),
    };

    return parseResult;
  } catch (error) {
    console.error("Resume parsing error:", error);
    if (process.env.NODE_ENV === "development") {
      console.log("Using mock data as fallback in development");
      return getMockResumeData();
    }
    throw error;
  }
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
