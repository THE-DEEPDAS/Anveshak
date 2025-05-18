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
