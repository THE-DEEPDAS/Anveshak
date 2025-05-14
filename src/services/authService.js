import axios from "axios";
import { API_ENDPOINTS } from "../config/api";

export const register = async (userData) => {
  try {
    const response = await axios.post(
      `${API_ENDPOINTS.auth}/register`,
      userData
    );
    return response.data;
  } catch (error) {
    // Throw a more detailed error object that includes validation errors
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

    // Store token and set default Authorization header
    localStorage.setItem("token", token);
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

    return user;
  } catch (error) {
    const message = error.response?.data?.message || "Login failed";
    throw { response: { data: { message } } };
  }
};

export const logout = () => {
  localStorage.removeItem("token");
  delete axios.defaults.headers.common["Authorization"];
};

export const getCurrentUser = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;

    const response = await axios.get(`${API_ENDPOINTS.auth}/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error("Get current user error:", error);
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
