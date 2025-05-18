import axios from "axios";
import { API_ENDPOINTS } from "../config/api";

export const generateEmailContent = async (resumeData, facultyMember) => {
  try {
    const response = await axios.post(
      `${API_ENDPOINTS.academic}/generate-email`,
      {
        context: {
          resume: {
            education: resumeData.education,
            experience: resumeData.experience,
            skills: resumeData.skills,
            projects: resumeData.projects,
            research: resumeData.research,
          },
          faculty: {
            name: facultyMember.name,
            department: facultyMember.department,
            institution: facultyMember.institution?.name,
            researchInterests: facultyMember.researchInterests,
          },
        },
      }
    );

    return response.data.emailContent;
  } catch (error) {
    console.error("Error generating email content:", error);
    throw new Error(
      error.response?.data?.message || "Failed to generate email content"
    );
  }
};

export const regenerateEmail = async (
  resumeData,
  facultyMember,
  previousContent
) => {
  try {
    const response = await axios.post(
      `${API_ENDPOINTS.academic}/regenerate-email`,
      {
        context: {
          resume: {
            education: resumeData.education,
            experience: resumeData.experience,
            skills: resumeData.skills,
            projects: resumeData.projects,
            research: resumeData.research,
          },
          faculty: {
            name: facultyMember.name,
            department: facultyMember.department,
            institution: facultyMember.institution?.name,
            researchInterests: facultyMember.researchInterests,
          },
          previousContent,
        },
      }
    );

    return response.data.emailContent;
  } catch (error) {
    console.error("Error regenerating email content:", error);
    throw new Error(
      error.response?.data?.message || "Failed to regenerate email content"
    );
  }
};
