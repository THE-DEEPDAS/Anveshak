import pdfParse from "pdf-parse";
import {
  getSkillsFromText,
  getExperienceFromText,
  getProjectsFromText,
} from "./aiService.js";
import axios from "axios";
import { v2 as cloudinary } from "cloudinary";
import crypto from "crypto";

// Configure Cloudinary
const configureCloudinary = () => {
  if (
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  ) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });
    return true;
  }

  if (!process.env.CLOUDINARY_URL) {
    console.error(
      "Cloudinary configuration is missing. Please set CLOUDINARY_URL or individual credentials."
    );
    if (process.env.NODE_ENV === "production") {
      throw new Error("Cloudinary configuration is required");
    }
    return false;
  }

  try {
    const match = process.env.CLOUDINARY_URL.match(
      /cloudinary:\/\/([^:]+):([^@]+)@(.+)/
    );
    if (!match) {
      throw new Error("Invalid CLOUDINARY_URL format");
    }

    const [_, apiKey, apiSecret, cloudName] = match;
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });
    return true;
  } catch (error) {
    console.error("Error configuring Cloudinary:", error.message);
    if (process.env.NODE_ENV === "production") {
      throw error;
    }
    return false;
  }
};

// Initialize Cloudinary configuration
configureCloudinary();

// Generate authenticated PDF URL helper
const generatePdfUrl = (publicId) => {
  const version = Math.floor(Date.now() / 1000); // This creates a version number
  const cloudConfig = cloudinary.config();

  // Construct the URL in the correct format
  return `https://res.cloudinary.com/${cloudConfig.cloud_name}/raw/upload/v${version}/${publicId}`;
};

// Get file from Cloudinary using signed URL
const getFileFromCloudinary = async (publicId) => {
  try {
    const url = generatePdfUrl(publicId);
    console.log("Downloading from signed URL:", url);

    const response = await axios({
      method: "get",
      url: url,
      responseType: "arraybuffer",
      maxContentLength: 10 * 1024 * 1024,
      timeout: 30000,
      headers: {
        Accept: "application/pdf",
      },
    });

    if (!response.data || response.data.length === 0) {
      throw new Error("Empty response from Cloudinary");
    }

    return response.data;
  } catch (error) {
    console.error("Error fetching file from Cloudinary:", error);
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response headers:", error.response.headers);
    }
    throw error;
  }
};

// Export the URL generation function for use in other modules
export { generatePdfUrl };

export const parseResumeText = async (publicId, previousVersion = null) => {
  let dataBuffer = null;

  try {
    if (!publicId) {
      throw new Error("Cloudinary public ID is required");
    }

    const cleanPublicId = publicId.replace(/\.pdf$/, "");

    try {
      console.log(
        "Downloading from Cloudinary using public ID:",
        cleanPublicId
      );
      const fileData = await getFileFromCloudinary(cleanPublicId);

      if (!fileData) {
        throw new Error("No data received from Cloudinary");
      }

      dataBuffer = Buffer.from(fileData);
      console.log(
        "Successfully downloaded PDF, size:",
        dataBuffer.length,
        "bytes"
      );

      if (dataBuffer.length < 100) {
        // Basic sanity check
        throw new Error("Downloaded file is too small to be a valid PDF");
      }
    } catch (downloadError) {
      console.error(
        "Error downloading from Cloudinary:",
        downloadError.message
      );
      throw new Error(
        `Failed to download file from Cloudinary: ${downloadError.message}`
      );
    }

    console.log("Attempting to parse PDF data...");
    const data = await pdfParse(dataBuffer, {
      max: 0,
      pagerender: function (pageData) {
        let render_options = {
          normalizeWhitespace: false,
          disableCombineTextItems: false,
        };
        return pageData.getTextContent(render_options);
      },
      version: "v2.0.0",
    });

    if (!data || !data.text) {
      throw new Error("Failed to extract text from PDF");
    }

    const text = data.text.trim();
    console.log("Successfully extracted text, length:", text.length);

    if (text.length < 50) {
      // Basic sanity check
      throw new Error("Extracted text is too short to be a valid resume");
    }

    // Extract information using AI
    const [skills, experience, projects] = await Promise.all([
      getSkillsFromText(text, previousVersion?.skills),
      getExperienceFromText(text, previousVersion?.experience),
      getProjectsFromText(text, previousVersion?.projects),
    ]);

    // Validate the parsed data
    if (!skills?.length && !experience?.length && !projects?.length) {
      throw new Error("No relevant content extracted from PDF");
    }

    return {
      skills,
      experience,
      projects,
      parsedAt: new Date(),
    };
  } catch (error) {
    console.error("Resume parsing error:", error);
    throw error;
  }
};
