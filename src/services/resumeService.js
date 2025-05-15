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
        timeout: 60000, // 60 second timeout
        maxContentLength: 10 * 1024 * 1024, // 10MB
        maxBodyLength: 10 * 1024 * 1024, // 10MB
        onUploadProgress: (progressEvent) => {
          console.log(
            "Upload Progress:",
            Math.round((progressEvent.loaded * 100) / progressEvent.total)
          );
        },
      }
    );
    return response.data;
  } catch (error) {
    if (error.code === "ECONNABORTED") {
      throw new Error(
        "Upload timed out. Please try again with a smaller file or check your connection."
      );
    }
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

export const updateResume = async (resumeData) => {
  try {
    if (!resumeData.id) {
      throw new Error("Resume ID is required");
    }

    const response = await axios.patch(
      `${API_ENDPOINTS.resumes}/${resumeData.id}`,
      {
        skills: resumeData.skills || [],
        experience: resumeData.experience || [],
        projects: resumeData.projects || [],
      }
    );

    if (!response.data) {
      throw new Error("No response from server");
    }

    return response.data;
  } catch (error) {
    console.error("Error updating resume:", error);
    throw (
      error.response?.data?.message || error.message || "Error updating resume"
    );
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
