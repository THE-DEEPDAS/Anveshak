import axios from "axios";

// Base API configuration for frontend services
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Configure axios defaults
axios.defaults.baseURL = API_BASE_URL;
axios.defaults.withCredentials = true;
axios.defaults.headers.common["Content-Type"] = "application/json";

// Axios interceptor to handle authentication
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear local storage on authentication error
      localStorage.removeItem("user");
      localStorage.removeItem("token");

      // Redirect to login if not already there
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export const API_ENDPOINTS = {
  auth: "/auth",
  users: "/users",
  resumes: "/resumes",
  emails: "/emails",
};

export default axios;
