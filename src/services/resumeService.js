import axios from "axios";
import { API_ENDPOINTS } from "../config/api";

export const uploadResume = async (formData) => {
  try {
    const response = await axios.post(
      `${API_ENDPOINTS.resumes}/upload`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error uploading resume:", error);
    throw error;
  }
};

export const getResumeById = async (resumeId) => {
  try {
    const response = await axios.get(`${API_ENDPOINTS.resumes}/${resumeId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching resume:", error);
    throw error;
  }
};

// Mock function for development
export const getMockResumeData = () => {
  return {
    id: "mock-resume-id",
    url: "https://example.com/resume.pdf",
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
