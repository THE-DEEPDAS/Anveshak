// Base API configuration for frontend services
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const API_ENDPOINTS = {
  auth: `${API_BASE_URL}/auth`,
  resumes: `${API_BASE_URL}/resumes`,
  emails: `${API_BASE_URL}/emails`,
  users: `${API_BASE_URL}/users`,
};

export default API_ENDPOINTS;
