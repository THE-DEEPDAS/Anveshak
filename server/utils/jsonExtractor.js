/**
 * Extracts JSON data from an LLM response string with enhanced error handling
 * @param {string} response The raw response from the LLM
 * @returns {any} Parsed JSON data or null if invalid
 */
export const extractJsonFromResponse = (response) => {
  if (!response) return null;

  try {
    // Step 1: Clean markdown and code blocks
    let cleanResponse = response
      .replace(/```(?:json)?\s*\n?/g, "") // Remove opening markers with or without 'json'
      .replace(/\n?\s*```/g, "") // Remove closing markers
      .replace(/`/g, "") // Remove any remaining backticks
      .trim();

    // Step 2: Find JSON content boundaries
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

    // Step 3: Extract and clean JSON content
    if (start !== -1 && end !== -1) {
      cleanResponse = cleanResponse.slice(start, end);

      // Try parsing with progressive cleaning
      try {
        // Try direct parse first
        return JSON.parse(cleanResponse);
      } catch (initialError) {
        console.log("Initial parse failed, attempting cleanup...");

        // If fails, try aggressive cleaning
        const sanitized = cleanResponse
          .replace(/[\u201C\u201D\u2033]/g, '"') // Fix smart quotes and double primes
          .replace(/[\u2018\u2019\u2032]/g, "'") // Fix smart single quotes and primes
          .replace(/[\u2013\u2014]/g, "-") // Fix em and en dashes
          .replace(/\n\s*\/\/.*/g, "") // Remove comments
          .replace(/,(\s*[}\]])/g, "$1") // Remove trailing commas
          .replace(/^\s*\/\*[\s\S]*?\*\/\s*/g, "") // Remove multiline comments
          .replace(/\s*:\s*/g, ":") // Normalize spacing around colons
          .replace(/\s*,\s*/g, ",") // Normalize spacing around commas
          .replace(/\s*{\s*/g, "{") // Normalize spacing around braces
          .replace(/\s*}\s*/g, "}") // Normalize spacing around braces
          .replace(/\s*\[\s*/g, "[") // Normalize spacing around brackets
          .replace(/\s*\]\s*/g, "]") // Normalize spacing around brackets
          .replace(/\\\\/g, "\\") // Fix double backslashes
          .replace(/\\"/g, '"') // Fix escaped quotes
          .replace(/\\'/g, "'") // Fix escaped single quotes
          .trim();

        try {
          return JSON.parse(sanitized);
        } catch (error) {
          console.error("Failed to parse even after sanitization:", error);
          // One final attempt: try to fix any remaining invalid JSON
          const desperation = sanitized
            .replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3') // Quote unquoted keys
            .replace(/,\s*([}\]])/g, "$1"); // Remove trailing commas

          try {
            return JSON.parse(desperation);
          } catch (finalError) {
            console.error("All parsing attempts failed");
            return null;
          }
        }
      }
    }

    // Find the first occurrence of [ or {
    const jsonStart =
      response.indexOf("{") !== -1
        ? response.indexOf("{")
        : response.indexOf("[");

    if (jsonStart === -1) {
      return null;
    }

    // Find the last occurrence of ] or }
    const jsonEnd =
      response.lastIndexOf("}") !== -1
        ? response.lastIndexOf("}") + 1
        : response.lastIndexOf("]") + 1;

    if (jsonEnd === 0) {
      return null;
    }

    // Extract the potential JSON string
    const jsonStr = response.substring(jsonStart, jsonEnd);

    // Try to parse it
    const parsed = JSON.parse(jsonStr);
    return parsed;
  } catch (error) {
    console.error("Error extracting JSON from response:", error);
    return null;
  }
};
