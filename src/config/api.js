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

    // If the error is due to an expired token
    if (error.response?.status === 401 && !originalRequest._retry) {
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

        // Redirect to login if not already there
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      }
    }

    // If the error is not 401 or refresh fails, reject the promise
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
