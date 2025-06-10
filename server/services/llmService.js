import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini Pro
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

/**
 * Get completion from LLM
 * @param {string} prompt The prompt to send to the LLM
 * @returns {Promise<string>} The LLM's response
 */
async function getCompletion(prompt) {
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error getting LLM completion:", error);
    throw error;
  }
}

export default {
  getCompletion,
};
