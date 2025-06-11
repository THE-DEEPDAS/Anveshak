import axios from "axios";
import { API_ENDPOINTS } from "../config/api";

export const searchAcademicFaculty = async (domains) => {
  try {
    if (!Array.isArray(domains) || domains.length === 0) {
      throw new Error("Invalid domains provided");
    }

    const response = await axios.post(
      `${API_ENDPOINTS.academic}/search-and-email`,
      {
        domains: domains.filter(
          (domain) => typeof domain === "string" && domain.trim().length > 0
        ),
      }
    );

    if (!response.data?.facultyList) {
      return [];
    }

    return response.data.facultyList;
  } catch (error) {
    console.error("Error searching faculty:", error);
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Failed to search faculty"
    );
  }
};

export const getExtraFindings = async (domains) => {
  try {
    const response = await axios.post(
      `${API_ENDPOINTS.academic}/extra-findings`,
      {
        domains,
      }
    );
    return response.data.facultyList || [];
  } catch (error) {
    console.error("Error getting extra findings:", error);
    throw error;
  }
};

export const generatePreviewEmails = async (resumeId, selectedFaculty) => {
  try {
    if (
      !resumeId ||
      !Array.isArray(selectedFaculty) ||
      selectedFaculty.length === 0
    ) {
      throw new Error("Invalid input parameters");
    }

    const response = await axios.post(
      `${API_ENDPOINTS.academic}/generate-preview-emails`,
      {
        resumeId,
        selectedFaculty: selectedFaculty.map((faculty) => ({
          _id: faculty._id,
          name: faculty.name,
          email: faculty.email,
          department: faculty.department,
          institution: faculty.institution,
          researchInterests: faculty.researchInterests,
        })),
      }
    );

    if (!response.data?.emails) {
      throw new Error("No email previews generated");
    }

    return response.data.emails.map((email) => ({
      ...email,
      facultyId: email.faculty._id,
      recipient: email.faculty.email,
    }));
  } catch (error) {
    console.error("Error generating email previews:", error);
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Failed to generate email previews"
    );
  }
};

export const regenerateEmail = async (resume, faculty) => {
  try {
    const response = await axios.post(
      `${API_ENDPOINTS.academic}/regenerate-email`,
      {
        resumeId: resume.id,
        facultyId: faculty._id,
      }
    );

    if (!response.data?.content) {
      throw new Error("No email content received");
    }

    return response.data.content;

    // agar content thi data nai madto to aa use kari leje
    // object ni key nu name bhuli gayo chu me etle
    // backend ma jaine jovu padse ke aa key nu name shu che
    if (!response.data?.email) {
      throw new Error("Failed to regenerate email");
    }

    return response.data.email;
  } catch (error) {
    console.error("Error regenerating email:", error);
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Failed to regenerate email"
    );
  }
};
