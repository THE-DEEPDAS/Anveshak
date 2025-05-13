import axios from 'axios';

const API_URL = 'http://localhost:5000/api/auth';

export const register = async (userData) => {
  try {
    const response = await axios.post(`${API_URL}/register`, userData);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const login = async (credentials) => {
  try {
    const response = await axios.post(`${API_URL}/login`, credentials);
    const { token, user } = response.data;
    
    // Store token
    localStorage.setItem('token', token);
    
    // Set default authorization header
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    return user;
  } catch (error) {
    throw error.response.data;
  }
};

export const logout = () => {
  localStorage.removeItem('token');
  delete axios.defaults.headers.common['Authorization'];
};

export const getCurrentUser = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;

    const response = await axios.get(`${API_URL}/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
};

export const verifyEmail = async (token) => {
  try {
    const response = await axios.get(`${API_URL}/verify/${token}`);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const forgotPassword = async (email) => {
  try {
    const response = await axios.post(`${API_URL}/forgot-password`, { email });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const resetPassword = async (token, password) => {
  try {
    const response = await axios.post(`${API_URL}/reset-password/${token}`, { password });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};