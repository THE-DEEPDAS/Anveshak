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
    // Clear the server-side cookie
    await axios.post(
      `${API_ENDPOINTS.auth}/logout`,
      {},
      { withCredentials: true }
    );

    // Clear local storage
    localStorage.removeItem("user");
    localStorage.removeItem("token");

    // Clear auth header
    delete axios.defaults.headers.common["Authorization"];

    // Clear AppContext user state by reloading the page
    window.location.href = "/";
  } catch (error) {
    console.error("Logout error:", error);
    // Still clear local data even if server request fails
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    delete axios.defaults.headers.common["Authorization"];
    window.location.href = "/";
  }
};

export const getCurrentUser = async () => {
  try {
    // Ensure Authorization header is set if token exists
    const token = localStorage.getItem("token");
    if (token && !axios.defaults.headers.common["Authorization"]) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }

    // Get user data from /me endpoint
    const response = await axios.get(`${API_ENDPOINTS.auth}/me`);
    if (response.data) {
      localStorage.setItem("user", JSON.stringify(response.data));
      return response.data;
    }
    return null;
  } catch (error) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Clear invalid session
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      delete axios.defaults.headers.common["Authorization"];
    }
    throw error;
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

export const verifyEmailCode = async (email, code) => {
  try {
    const response = await axios.post(`${API_ENDPOINTS.auth}/verify-code`, {
      email,
      code,
    });
    return response.data;
  } catch (error) {
    throw {
      response: {
        data: {
          message: error.response?.data?.message || "Verification failed",
        },
      },
    };
  }
};

export const resendVerificationCode = async (email) => {
  try {
    const response = await axios.post(
      `${API_ENDPOINTS.auth}/resend-verification`,
      {
        email,
      }
    );
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message || "Failed to resend verification code";
    throw { response: { data: { message } } };
  }
};
