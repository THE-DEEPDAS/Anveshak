import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { v2 as cloudinary } from "cloudinary";
import User from "../models/User.js";
import Resume from "../models/Resume.js";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { parseResume, generatePdfUrl } from "../services/resumeParser.js";
import { retryParseResume } from "../services/retryParser.js";
import { authenticateToken } from "../middleware/auth.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, "../uploads");
    if (!fs.existsSync(uploadDir)) {
      // parent directory for uploads does not exist, create it
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    // no error, pass the upload directory to multer
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
    cb(null, Date.now() + "-" + sanitizedName);
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    fieldSize: 10 * 1024 * 1024, // 10MB field size limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"), false);
    }
  },
}).single("resume");

const router = express.Router();

// Upload resume with enhanced error handling and validation
router.post("/upload", authenticateToken, (req, res) => {
  upload(req, res, async (err) => {
    // Track if this is a resume update
    const isUpdate = req.body.updateExisting === "true";
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res
          .status(413)
          .json({ error: "File size too large. Maximum size is 10MB" });
      }
      return res.status(400).json({ error: err.message });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }
    try {
      // Extract parseMode after multer has processed the multipart form data
      const parseMode = req.body.parseMode || "auto";
      console.log(`Resume upload with parseMode: ${parseMode}`);

      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      if (!req.user || !req.user.userId) {
        return res
          .status(401)
          .json({ error: "User not properly authenticated" });
      }

      // Check if file is actually a PDF (more thorough validation)
      const fileBuffer = fs.readFileSync(req.file.path);
      // ascii encoding thi string ma "%PDF-" check kariye che
      const isPDF = fileBuffer.toString("ascii", 0, 5) === "%PDF-";

      if (!isPDF) {
        // Clean up invalid file
        // delete a file asynchronously
        fs.unlink(req.file.path, (err) => {
          if (err) console.error("Error deleting invalid file:", err);
        });
        return res.status(400).json({ error: "Invalid PDF file format" });
      }

      // Get the most recent resume for this user (if it exists) to use as fallback
      let previousResume = null;
      try {
        previousResume = await Resume.findOne({
          user: req.user.userId,
        }).sort({ createdAt: -1 });

        // If this is an update and we found a previous resume, we'll delete it after successful upload
        if (isUpdate && previousResume) {
          console.log(
            `Preparing to replace previous resume: ${previousResume._id}`
          );
        }
      } catch (prevError) {
        console.log("No previous resume found, continuing without fallback");
      }

      console.log(`Uploading resume to Cloudinary: ${req.file.filename}`);

      // If updating, delete the old file from Cloudinary
      if (isUpdate && previousResume?.cloudinaryPublicId) {
        try {
          await cloudinary.uploader.destroy(previousResume.cloudinaryPublicId);
          console.log(
            `Deleted old resume file: ${previousResume.cloudinaryPublicId}`
          );
        } catch (deleteError) {
          console.error("Error deleting old resume file:", deleteError);
          // Continue with upload even if delete fails
        }
      }

      // Upload to Cloudinary with enhanced configuration for reliability
      const result = await cloudinary.uploader.upload(req.file.path, {
        resource_type: "raw",
        public_id: req.file.filename,
        folder: `resumes/${req.user.userId}`,
        use_filename: true,
        unique_filename: true,
        type: "upload",
        timeout: 180000, // 180 second timeout
        chunk_size: 6000000, // 6MB chunks for more reliable upload
        eager_async: true,
        eager_notification_url: null,
        tags: ["resume", `user_${req.user.userId}`],
        overwrite: true,
      });

      console.log(`Resume uploaded to Cloudinary: ${result.public_id}`);

      // Clean up local file
      fs.unlink(req.file.path, (err) => {
        if (err) console.error("Error deleting local file:", err);
      });

      // Create resume record before parsing
      const resume = new Resume({
        user: req.user.userId,
        filename: req.file.filename,
        originalFilename: req.file.originalname,
        cloudinaryPublicId: result.public_id, // This should already include folder path
        cloudinaryUrl: result.secure_url, // Use the direct secure URL from Cloudinary
        parseStatus: "pending",
      });

      await resume.save();
      console.log(`Resume record created with ID: ${resume._id}`);

      // Set up timeout protection for the parsing process
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error("Resume parsing timed out after 90 seconds"));
        }, 90000); // 90 second timeout
      });

      let parsedData;
      try {
        // Pass the full public_id which includes the folder path
        // Also pass the previous version for fallback
        const previousVersionData = previousResume
          ? {
              skills: previousResume.skills || [],
              experience: previousResume.experience || [],
              projects: previousResume.projects || [],
              text: previousResume.text || "",
            }
          : null; // Race between parsing and timeout
        parsedData = await Promise.race([
          parseResume(result.public_id, {
            parseMode: parseMode,
            previousVersionData,
          }),
          timeoutPromise,
        ]);

        await resume.updateParseResults(parsedData);
        console.log(
          `Resume parsed successfully with method: ${parsedData.parseMethod}`
        );
      } catch (parseError) {
        console.error("Resume parsing error:", parseError);
        await resume.markParseFailed(parseError);

        // If parsing failed but we have previous data, use that as fallback
        if (
          previousResume &&
          previousResume.skills &&
          previousResume.skills.length > 0
        ) {
          console.log(
            "Using previous resume data as fallback after parse failure"
          );
          await resume.updateParseResults({
            skills: previousResume.skills,
            experience: previousResume.experience,
            projects: previousResume.projects,
            text: previousResume.text || "",
            parseMethod: "previous_version_fallback",
            warning:
              "Parsing failed. Using data from your previous resume as a starting point.",
            parsedAt: new Date(),
          });
        }
      }

      // If this was an update, delete the old resume document
      if (isUpdate && previousResume) {
        try {
          await Resume.findByIdAndDelete(previousResume._id);
          console.log(`Deleted old resume document: ${previousResume._id}`);
        } catch (deleteError) {
          console.error("Error deleting old resume document:", deleteError);
          // Continue since the new resume is already saved
        }
      }

      res.json({
        message: isUpdate
          ? "Resume updated and parsed successfully"
          : "Resume uploaded and parsed successfully",
        resumeId: resume._id,
        resume: {
          ...resume.toObject(),
          url: result.secure_url,
        },
        parsingError: resume.parseError?.message,
      });
    } catch (error) {
      console.error("Resume upload error:", error);
      res.status(500).json({ error: "Error uploading resume" });
    }
  });
});

// Get resume by ID
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const resume = await Resume.findOne({
      _id: req.params.id,
      user: req.user.userId,
    });

    if (!resume) {
      return res.status(404).json({ error: "Resume not found" });
    }

    // Generate fresh authenticated URL using the shared function
    const authenticatedUrl = generatePdfUrl(resume.cloudinaryPublicId);

    res.json({
      ...resume.toObject(),
      url: authenticatedUrl,
    });
  } catch (error) {
    console.error("Resume fetch error:", error);
    res.status(500).json({ error: "Error fetching resume" });
  }
});

// Get all resumes for a user
router.get("/user/:userId", authenticateToken, async (req, res) => {
  try {
    // Only allow users to fetch their own resumes
    if (req.params.userId !== req.user.userId) {
      return res
        .status(403)
        .json({ message: "Unauthorized to access these resumes" });
    }
    const resumes = await Resume.find({ user: req.user.userId }).sort({
      createdAt: -1,
    });

    // Generate fresh authenticated URLs for each resume using the shared function
    const resumesWithUrls = resumes.map((resume) => ({
      ...resume.toObject(),
      url: generatePdfUrl(resume.cloudinaryPublicId),
    }));

    res.status(200).json(resumesWithUrls);
  } catch (error) {
    console.error("Error fetching user resumes:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Check if a user has uploaded a resume
router.get("/user/:userId/has-resume", authenticateToken, async (req, res) => {
  try {
    // Only allow users to check their own resume status
    if (req.params.userId !== req.user.userId) {
      return res
        .status(403)
        .json({ message: "Unauthorized to check this user's resume status" });
    }
    const resumeExists = await Resume.exists({ user: req.user.userId });
    res.status(200).json({ hasResume: !!resumeExists });
  } catch (error) {
    console.error("Error checking resume existence:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Update resume by ID
router.patch("/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const { skills, experience, projects } = req.body;

    const resume = await Resume.findOne({
      _id: id,
      user: req.user.userId,
    });

    if (!resume) {
      return res.status(404).json({ message: "Resume not found" });
    }

    // Update only the provided fields
    if (skills !== undefined) resume.skills = skills;
    if (experience !== undefined) resume.experience = experience;
    if (projects !== undefined) resume.projects = projects;

    // Clear any parsing warnings since user has manually edited
    resume.warning = null;

    // Add to parse history
    resume.parseHistory.push({
      skills: resume.skills,
      experience: resume.experience,
      projects: resume.projects,
      parsedAt: new Date(),
    });

    // Ensure parseStatus is completed after manual edits
    resume.parseStatus = "completed";

    await resume.save();

    // Generate fresh authenticated URL
    const authenticatedUrl = generatePdfUrl(resume.cloudinaryPublicId);

    // Return the complete resume object with URL
    res.json({
      id: resume._id,
      ...resume.toObject(),
      url: authenticatedUrl,
      message: "Resume updated successfully",
    });
  } catch (error) {
    console.error("Error updating resume:", error);
    res.status(500).json({
      message: "Error updating resume",
      error: error.message,
    });
  }
});

// Retry parsing a resume
router.post("/:id/retry-parse", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { forceAI } = req.body;

    // Verify the resume belongs to the requesting user
    const resume = await Resume.findOne({
      _id: id,
      user: req.user.userId,
    });

    if (!resume) {
      return res.status(404).json({ message: "Resume not found" });
    }

    console.log(`Requesting retry parse for resume ${id}, forceAI: ${forceAI}`);

    // Attempt to retry parsing
    const updatedResume = await retryParseResume(id, forceAI === true);

    // Generate fresh authenticated URL
    const authenticatedUrl = generatePdfUrl(updatedResume.cloudinaryPublicId);

    res.json({
      message:
        updatedResume.parseStatus === "completed"
          ? "Resume parsing retry successful"
          : "Resume parsing retry completed with warnings",
      resume: {
        ...updatedResume.toObject(),
        url: authenticatedUrl,
      },
      warning: updatedResume.warning,
    });
  } catch (error) {
    console.error("Error retrying resume parse:", error);
    res.status(500).json({
      message: "Error retrying resume parse",
      error: error.message,
    });
  }
});

// Delete an individual skill from a resume
router.delete("/:id/skills/:index", authenticateToken, async (req, res) => {
  try {
    const { id, index } = req.params;
    const skillIndex = parseInt(index);

    // Input validation
    if (isNaN(skillIndex) || skillIndex < 0) {
      return res.status(400).json({ message: "Invalid skill index" });
    }

    const resume = await Resume.findOne({
      _id: id,
      user: req.user.userId,
    });

    if (!resume) {
      return res.status(404).json({ message: "Resume not found" });
    }

    if (!resume.skills || skillIndex >= resume.skills.length) {
      return res.status(404).json({ message: "Skill not found" });
    }

    // Store current state in history before updating
    resume.parseHistory.push({
      skills: [...resume.skills],
      experience: resume.experience,
      projects: resume.projects,
      parseMethod: "user_deletion",
      parsedAt: new Date(),
    });

    // Remove the skill at the specified index
    resume.skills.splice(skillIndex, 1);
    resume.currentVersion += 1;
    resume.lastModifiedBy = "user";

    await resume.save();

    // Generate fresh authenticated URL
    const authenticatedUrl = generatePdfUrl(resume.cloudinaryPublicId);

    res.json({
      id: resume._id,
      ...resume.toObject(),
      url: authenticatedUrl,
      message: "Skill removed successfully",
    });
  } catch (error) {
    console.error("Error removing skill:", error);
    res.status(500).json({
      message: "Error removing skill",
      error: error.message,
    });
  }
});

export default router;
