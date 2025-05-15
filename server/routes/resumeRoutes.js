import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { v2 as cloudinary } from "cloudinary";
import User from "../models/User.js";
import Resume from "../models/Resume.js";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { parseResumeText, generatePdfUrl } from "../services/resumeParser.js";
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
      fs.mkdirSync(uploadDir, { recursive: true });
    }
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

// Upload resume with custom error handling
router.post("/upload", authenticateToken, (req, res) => {
  upload(req, res, async (err) => {
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
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      if (!req.user || !req.user.userId) {
        return res
          .status(401)
          .json({ error: "User not properly authenticated" });
      }

      // Upload to Cloudinary with better configuration
      const result = await cloudinary.uploader.upload(req.file.path, {
        resource_type: "raw",
        public_id: req.file.filename,
        folder: `resumes/${req.user.userId}`,
        use_filename: true,
        unique_filename: true,
        type: "upload",
        timeout: 120000, // 120 second timeout
        chunk_size: 10000000, // 10MB chunks
        eager_async: true,
        eager_notification_url: null,
      });

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

      let parsedData;
      try {
        // Pass the full public_id which includes the folder path
        parsedData = await parseResumeText(result.public_id);
        await resume.updateParseResults(parsedData);
      } catch (parseError) {
        console.error("Resume parsing error:", parseError);
        await resume.markParseFailed(parseError);
      }

      // Use the actual secure_url from Cloudinary for consistency
      res.json({
        message:
          resume.parseStatus === "completed"
            ? "Resume uploaded and parsed successfully"
            : "Resume uploaded but parsing failed",
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

export default router;
