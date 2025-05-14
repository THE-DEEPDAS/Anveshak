import axios from "axios";
import { API_ENDPOINTS } from "../config/api";

// Configure axios to include credentials
axios.defaults.withCredentials = true;

export const register = async (userData) => {
  try {
    const response = await axios.post(
      `${API_ENDPOINTS.auth}/register`,
      userData
    );
    return response.data;
  } catch (error) {
    if (error.response) {
      throw {
        response: {
          data: {
            message: error.response.data.message,
            missing: error.response.data.missing || {},
          },
        },
      };
    }
    throw error;
  }
};

export const login = async (credentials) => {
  try {
    const response = await axios.post(
      `${API_ENDPOINTS.auth}/login`,
      credentials
    );
    const { token, user } = response.data;

    // Store user data in localStorage for persistence
    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("token", token);

    // Set default auth header for future requests
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

    return user;
  } catch (error) {
    const message = error.response?.data?.message || "Login failed";
    throw { response: { data: { message } } };
  }
};

export const logout = async () => {
  try {
    // Clear local storage
    localStorage.removeItem("user");
    localStorage.removeItem("token");

    // Clear auth header
    delete axios.defaults.headers.common["Authorization"];

    // Clear the cookie by making a request to the server
    await axios.post(`${API_ENDPOINTS.auth}/logout`);
  } catch (error) {
    console.error("Logout error:", error);
  }
};

export const getCurrentUser = async () => {
  try {
    // First try to get user from localStorage
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      // Verify the stored user is still valid
      const response = await axios.get(`${API_ENDPOINTS.auth}/me`);
      if (response.data) {
        return response.data;
      }
    }

    // If no stored user or invalid, try to get from server
    const response = await axios.get(`${API_ENDPOINTS.auth}/me`);
    if (response.data) {
      localStorage.setItem("user", JSON.stringify(response.data));
      return response.data;
    }

    return null;
  } catch (error) {
    console.error("Get current user error:", error);
    // Clear stored data if there's an error
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    return null;
  }
};

export const verifyEmail = async (token) => {
  try {
    const response = await axios.get(`${API_ENDPOINTS.auth}/verify/${token}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const forgotPassword = async (email) => {
  try {
    const response = await axios.post(`${API_ENDPOINTS.auth}/forgot-password`, {
      email,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const resetPassword = async (token, password) => {
  try {
    const response = await axios.post(
      `${API_ENDPOINTS.auth}/reset-password/${token}`,
      { password }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
