import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Configure axios defaults
axios.defaults.baseURL = API_BASE_URL;
axios.defaults.withCredentials = true;
axios.defaults.headers.common["Content-Type"] = "application/json";

// Request interceptor
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isLoginPage = window.location.pathname === "/login";
    const isLandingPage = window.location.pathname === "/";
    const isSignupPage = window.location.pathname === "/signup";
    const isRefreshRequest = originalRequest.url === "/auth/refresh-token";

    // Don't retry if:
    // 1. It's already a refresh token request
    // 2. We're on the login page
    // 3. The request has already been retried
    // 4. We're on the Signup page
    // 5. We're on the Landing page
    if (
      error.response?.status === 401 &&
      !isRefreshRequest &&
      !isLandingPage &&
      !isLoginPage &&
      !isSignupPage &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        // Try to get a new token using the HTTP-only cookie
        const response = await axios.get("/auth/refresh-token");
        const { token } = response.data;

        // Store the new token
        localStorage.setItem("token", token);
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

        // Retry the original request
        return axios(originalRequest);
      } catch (refreshError) {
        // If refresh token fails, clean up and redirect to login
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        delete axios.defaults.headers.common["Authorization"];

        // Only redirect if we're not already on the login page
        if (!isLandingPage) {
          window.location.href = "/";
        }
        return Promise.reject(refreshError);
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
  academic: "/academic",
  stats: "/stats",
};

export default axios;
