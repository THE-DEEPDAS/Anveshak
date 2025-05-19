import axios, { API_ENDPOINTS } from "../config/api";

const statsService = {
  // Get all homepage stats (active users, emails generated, response rate, GitHub stars)
  getHomepageStats: async () => {
    try {
      const response = await axios.get(`${API_ENDPOINTS.stats}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching homepage stats:", error);
      throw error;
    }
  },

  // Increment and get current page views count
  incrementPageViews: async () => {
    try {
      const response = await axios.post(`${API_ENDPOINTS.stats}/pageview`);
      return response.data;
    } catch (error) {
      console.error("Error incrementing page views:", error);
      throw error;
    }
  },

  // Get current page views count without incrementing
  getPageViews: async () => {
    try {
      const response = await axios.get(`${API_ENDPOINTS.stats}/pageview`);
      return response.data;
    } catch (error) {
      console.error("Error getting page views:", error);
      throw error;
    }
  },
};

export default statsService;
