import { extractJsonFromResponse } from "../utils/enhancedJsonExtractor.js";

// Strict prompts requiring JSON-only responses
const SKILLS_PROMPT = `SYSTEM: You are a strict JSON parser that must only output valid JSON.

Extract all professional skills from the resume text and return them as a JSON array.

REQUIREMENTS:
- Output must be a plain JSON array ONLY
- Each skill must be a string
- NO markdown, NO code blocks, NO text explanations
- NO backticks, NO special formatting
- NO comments before or after the JSON

Example valid response:
["JavaScript", "React", "Node.js"]

CRITICAL: Entire response must be parseable JSON with no surrounding text.`;

const EXPERIENCE_PROMPT = `SYSTEM: You are a strict JSON parser that must only output valid JSON.

Extract all professional experience from the resume text and return as a JSON array.

REQUIREMENTS:
- Output must be a plain JSON array of objects ONLY
- NO markdown, NO code blocks, NO text explanations
- NO backticks, NO special formatting
- NO comments before or after the JSON
- Each experience must have: title, company, duration, description

Example valid response:
[{
  "title": "Software Engineer",
  "company": "Example Corp",
  "duration": "2020-2023",
  "description": "Led development of microservices architecture"
}]

CRITICAL: Entire response must be parseable JSON with no surrounding text.`;

const PROJECTS_PROMPT = `SYSTEM: You are a strict JSON parser that must only output valid JSON.

Extract all projects from the resume text and return as a JSON array.

REQUIREMENTS:
- Output must be a plain JSON array of objects ONLY
- NO markdown, NO code blocks, NO text explanations
- NO backticks, NO special formatting
- NO comments before or after the JSON
- Each project must have: name, description, technologies array

Example valid response:
[{
  "name": "E-commerce Platform",
  "description": "Built a full-stack e-commerce solution",
  "technologies": ["React", "Node.js", "MongoDB"]
}]

CRITICAL: Entire response must be parseable JSON with no surrounding text.`;

/**
 * Extracts skills from resume text using LLM
 * @param {string} text Resume text
 * @param {Object} llmService LLM service instance
 * @returns {Promise<string[]>} Array of skills
 */
const extractSkills = async (text, llmService) => {
  try {
    const systemPrefix =
      "You are in JSON-only mode. Your entire response must be valid JSON with no other text.\\n\\n";
    const response = await llmService.getCompletion(
      systemPrefix + SKILLS_PROMPT + "\\n\\nTEXT:\\n" + text
    );
    const jsonData = extractJsonFromResponse(response);
    return Array.isArray(jsonData) ? jsonData : [];
  } catch (error) {
    console.error("Error extracting skills:", error);
    return [];
  }
};

/**
 * Extracts experience from resume text using LLM
 * @param {string} text Resume text
 * @param {Object} llmService LLM service instance
 * @returns {Promise<Array<Object>>} Array of experience objects
 */
const extractExperience = async (text, llmService) => {
  try {
    const systemPrefix =
      "You are in JSON-only mode. Your entire response must be valid JSON with no other text.\\n\\n";
    const response = await llmService.getCompletion(
      systemPrefix + EXPERIENCE_PROMPT + "\\n\\nTEXT:\\n" + text
    );
    const jsonData = extractJsonFromResponse(response);
    return Array.isArray(jsonData) ? jsonData : [];
  } catch (error) {
    console.error("Error extracting experience:", error);
    return [];
  }
};

/**
 * Extracts projects from resume text using LLM
 * @param {string} text Resume text
 * @param {Object} llmService LLM service instance
 * @returns {Promise<Array<Object>>} Array of project objects
 */
const extractProjects = async (text, llmService) => {
  try {
    const systemPrefix =
      "You are in JSON-only mode. Your entire response must be valid JSON with no other text.\\n\\n";
    const response = await llmService.getCompletion(
      systemPrefix + PROJECTS_PROMPT + "\\n\\nTEXT:\\n" + text
    );
    const jsonData = extractJsonFromResponse(response);
    return Array.isArray(jsonData) ? jsonData : [];
  } catch (error) {
    console.error("Error extracting projects:", error);
    return [];
  }
};

export { extractSkills, extractExperience, extractProjects };
