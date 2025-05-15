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
  // The publicId already includes the folder path and filename
  return `https://res.cloudinary.com/${
    cloudinary.config().cloud_name
  }/raw/upload/v1/${publicId}`;
};

// Get file from Cloudinary using signed URL with retries
const getFileFromCloudinary = async (publicId, retries = 3) => {
  try {
    const url = generatePdfUrl(publicId);
    console.log("Downloading from signed URL:", url);

    const response = await axios({
      method: "get",
      url: url,
      responseType: "arraybuffer",
      maxContentLength: 10 * 1024 * 1024, // 10MB max
      timeout: 30000, // 30 second timeout per attempt
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
    if (retries > 0) {
      console.log(`Retrying download, ${retries} attempts remaining...`);
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds before retry
      return getFileFromCloudinary(publicId, retries - 1);
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

    try {
      console.log("Downloading from Cloudinary using public ID:", publicId);
      const fileData = await getFileFromCloudinary(publicId);

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
      timeout: 30000, // 30 second timeout for parsing
      pagerender: function (pageData) {
        let render_options = {
          normalizeWhitespace: false,
          disableCombineTextItems: false,
        };
        return pageData.getTextContent(render_options);
      },
    });

    if (!data || !data.text) {
      throw new Error("Failed to extract text from PDF");
    }

    const text = data.text.trim();
    console.log("Successfully extracted text, length:", text.length);

    if (text.length < 50) {
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
