/**
 * Enhanced JSON extractor with robust cleaning and parsing capabilities
 * @param {string} response The raw response from the LLM
 * @returns {any} Parsed JSON data or null if invalid
 */
export const extractJsonFromResponse = (response) => {
  if (!response) return null;

  try {
    // Step 1: Clean markdown and code blocks
    let cleanResponse = response
      // g is global flag to replace all occurrences
      .replace(/```(?:json)?\s*\n/g, "") // Remove opening markers
      .replace(/\n\s*```/g, "") // Remove closing markers
      .replace(/`/g, "") // Remove any remaining backticks
      .trim();

    // Step 2: Find JSON content
    const jsonStartChars = ["{", "["];
    const jsonEndChars = ["}", "]"];

    let start = -1;
    let end = -1;

    // Find first JSON start character
    for (let i = 0; i < cleanResponse.length; i++) {
      if (jsonStartChars.includes(cleanResponse[i])) {
        start = i;
        break;
      }
    }

    // Find last JSON end character
    for (let i = cleanResponse.length - 1; i >= 0; i--) {
      if (jsonEndChars.includes(cleanResponse[i])) {
        end = i + 1;
        break;
      }
    }

    if (start !== -1 && end !== -1) {
      cleanResponse = cleanResponse.slice(start, end);

      // Step 3: Try parsing with progressive cleaning
      try {
        // Try direct parse first
        return JSON.parse(cleanResponse);
      } catch {
        // If fails, try aggressive cleaning
        const sanitized = cleanResponse
          .replace(/[\u201C\u201D\u2033]/g, '"') // Fix smart quotes and double primes
          .replace(/[\u2018\u2019\u2032]/g, "'") // Fix smart single quotes and primes
          .replace(/[\u2013\u2014]/g, "-") // Fix em and en dashes
          .replace(/\n\s*\/\/.*/g, "") // Remove comments
          .replace(/,(\s*[}\]])/g, "$1") // Remove trailing commas
          // "$1" captures the closing brace or bracket and keeps it
          .replace(/^\s*\/\*[\s\S]*?\*\/\s*/g, "") // Remove multiline comments
          .replace(/\s*:\s*/g, ":") // Normalize spacing around colons
          .replace(/\s*,\s*/g, ",") // Normalize spacing around commas
          .replace(/\s*{\s*/g, "{") // Normalize spacing around braces
          .replace(/\s*}\s*/g, "}") // Normalize spacing around braces
          .replace(/\s*\[\s*/g, "[") // Normalize spacing around brackets
          .replace(/\s*\]\s*/g, "]") // Normalize spacing around brackets
          .trim();

        try {
          return JSON.parse(sanitized);
        } catch (error) {
          console.error("Failed to parse even after sanitization:", error);
          return null;
        }
      }
    }
    return null;
  } catch (error) {
    console.error("Error in JSON extraction:", error);
    return null;
  }
};
