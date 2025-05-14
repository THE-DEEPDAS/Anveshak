import pdfParse from "pdf-parse";
import fs from "fs";
import path from "path";
import {
  getSkillsFromText,
  getExperienceFromText,
  getProjectsFromText,
} from "./aiService.js";
import cloudinary from "cloudinary";

// Configure Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const parseResumeText = async (cloudinaryUrl) => {
  try {
    // Fetch the file from Cloudinary
    const response = await fetch(cloudinaryUrl);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch file from Cloudinary: ${response.statusText}`
      );
    }

    const dataBuffer = await response.arrayBuffer();

    // Verify the buffer is not empty
    if (!dataBuffer || dataBuffer.byteLength === 0) {
      throw new Error("Empty file received from Cloudinary");
    }

    try {
      // Parse PDF to text
      const data = await pdfParse(Buffer.from(dataBuffer));
      const text = data.text;

      if (!text || text.trim().length === 0) {
        throw new Error("No text content found in PDF");
      }

      // For development/testing - use mock data if AI service is not set up
      if (!process.env.GEMINI_API_KEY) {
        console.log("Warning: GEMINI_API_KEY not set, using mock data");
        return getMockResumeData();
      }

      // Extract skills, experience, and projects using AI
      const [skills, experience, projects] = await Promise.all([
        getSkillsFromText(text),
        getExperienceFromText(text),
        getProjectsFromText(text),
      ]);

      // Validate extracted data
      if (!skills || !experience || !projects) {
        throw new Error("Failed to extract resume information");
      }

      return {
        skills,
        experience,
        projects,
      };
    } catch (pdfError) {
      console.error("PDF parsing error:", pdfError);
      throw new Error(`Failed to parse PDF: ${pdfError.message}`);
    }
  } catch (error) {
    console.error("Error parsing resume:", error);
    // Only return mock data in development
    if (process.env.NODE_ENV === "development") {
      console.log("Using mock data as fallback in development");
      return getMockResumeData();
    }
    throw error;
  }
};

// Mock data for development or if AI parsing fails
const getMockResumeData = () => {
  return {
    skills: [
      "JavaScript",
      "React",
      "Node.js",
      "MongoDB",
      "Express",
      "TypeScript",
      "Git",
    ],
    experience: [
      "Frontend Developer Intern at TechCorp - Developed responsive web applications using React and TypeScript",
      "Web Developer at University Project - Built a full-stack e-commerce platform with MERN stack",
      "Personal Project - Created a task management app with real-time updates using Socket.io",
    ],
    projects: [
      "E-commerce Platform - Built with MERN stack featuring user authentication, product search, and payment integration",
      "Task Management App - React Native mobile app with offline capabilities and cloud sync",
      "Portfolio Website - Responsive personal website showcasing projects and skills",
    ],
  };
};
