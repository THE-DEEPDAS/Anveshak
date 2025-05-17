/**
 * Resume parsing retry service
 * This service helps with retrying failed resume parsing attempts
 */
import Resume from "../models/Resume.js";
import { parseResumeText } from "./resumeParser.js";
import { parseResumeWithAI } from "./aiService.js";

/**
 * Retry parsing a resume with enhanced methods
 * @param {string} resumeId - The ID of the resume to retry parsing
 * @param {boolean} forceAI - Force using AI parsing even if regular parsing succeeds
 * @returns {Promise<Object>} - The updated resume data
 */
export const retryParseResume = async (resumeId, forceAI = false) => {
  try {
    // Find the resume
    const resume = await Resume.findById(resumeId);
    if (!resume) {
      throw new Error(`Resume not found with ID: ${resumeId}`);
    }

    console.log(
      `Retrying parse for resume: ${resumeId}, cloudinaryId: ${resume.cloudinaryPublicId}`
    );

    // Create previous version data for fallback
    const previousVersionData = {
      skills: resume.skills || [],
      experience: resume.experience || [],
      projects: resume.projects || [],
      text: resume.text || "",
    };

    // Get the raw text from the resume, if we have it already
    const rawText = resume.text;
    let parsedData;
    if (rawText && rawText.length > 0 && forceAI) {
      // If we have the text and want to force AI parsing, use AI directly
      console.log("Using AI parsing directly with existing text");

      try {
        const aiResult = await parseResumeWithAI(rawText);

        // Always clear previous skills and use the new AI-parsed skills
        // This ensures we're not mixing old and new skills when forcing AI parsing
        parsedData = {
          text: rawText, // Keep original text
          ...aiResult,
          parseMethod: "ai_retry",
          parsedAt: new Date(),
        };

        console.log(`AI parsing found ${aiResult.skills?.length || 0} skills`);
      } catch (aiError) {
        console.error("AI retry parsing error:", aiError);

        // If AI parsing fails, fall back to previous data
        parsedData = {
          ...previousVersionData,
          parseMethod: "previous_version_retry",
          warning:
            "AI parsing failed on retry. Using previously extracted data.",
          parsedAt: new Date(),
        };
      }
    } else {
      // Do a full parse attempt from the PDF again, will use simplified parser by default
      console.log(
        "Attempting full re-parse from PDF using simplified parser by default"
      );

      try {
        parsedData = await parseResumeText(
          resume.cloudinaryPublicId,
          previousVersionData
        );
      } catch (parseError) {
        console.error("Retry parsing error:", parseError);

        // If parsing fails again, keep previous data but mark the method
        parsedData = {
          ...previousVersionData,
          parseMethod: "previous_version_retry",
          warning:
            "Resume parsing failed on retry. Using previously extracted data.",
          parsedAt: new Date(),
        };
      }
    }

    // Update the resume with the new parsed data
    await resume.updateParseResults(parsedData);

    return resume;
  } catch (error) {
    console.error("Error in retry parsing service:", error);
    throw error;
  }
};

/**
 * Get statistics about resume parsing success/failure rates
 * @returns {Promise<Object>} - Statistics about parsing
 */
export const getParsingStats = async () => {
  try {
    const total = await Resume.countDocuments();
    const completed = await Resume.countDocuments({ parseStatus: "completed" });
    const failed = await Resume.countDocuments({ parseStatus: "failed" });
    const pending = await Resume.countDocuments({ parseStatus: "pending" });
    const partial = await Resume.countDocuments({ parseStatus: "partial" });

    // Get method stats
    const regularMethod = await Resume.countDocuments({
      parseMethod: "regular",
    });
    const aiMethod = await Resume.countDocuments({ parseMethod: "ai" });
    const combinedMethod = await Resume.countDocuments({
      parseMethod: "combined",
    });
    const manualRequired = await Resume.countDocuments({
      parseMethod: "manual_required",
    });
    const previousVersion = await Resume.countDocuments({
      parseMethod: {
        $in: [
          "previous_version",
          "previous_version_fallback",
          "previous_version_error_fallback",
        ],
      },
    });

    return {
      total,
      statuses: {
        completed,
        failed,
        pending,
        partial,
      },
      methods: {
        regular: regularMethod,
        ai: aiMethod,
        combined: combinedMethod,
        manualRequired,
        previousVersion,
      },
      successRate:
        total > 0 ? ((completed / total) * 100).toFixed(2) + "%" : "0%",
    };
  } catch (error) {
    console.error("Error getting parsing stats:", error);
    throw error;
  }
};

export default {
  retryParseResume,
  getParsingStats,
};
