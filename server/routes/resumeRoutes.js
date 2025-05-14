import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { v2 as cloudinary } from "cloudinary";
import User from "../models/User.js";
import Resume from "../models/Resume.js";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { parseResumeText } from "../services/resumeParser.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
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
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    // Accept only PDF files
    if (file.mimetype !== "application/pdf") {
      return cb(new Error("Only PDF files are allowed"));
    }
    cb(null, true);
  },
});

const router = express.Router();

// Upload and process resume
router.post("/upload", upload.single("resume"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Get user info from request
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: "Name and email are required" });
    }

    // Create or find user - now handles unverified users
    let user = await User.findOne({ email });

    if (!user) {
      // Create new unverified user without password
      user = new User({
        name,
        email,
        isVerified: false, // Explicitly set as unverified
      });
      try {
        await user.save();
      } catch (userError) {
        console.error("Error creating user:", userError);
        if (userError.code === 11000) {
          // Duplicate key error
          return res
            .status(409)
            .json({
              message:
                "Email already exists. Please log in or use a different email.",
            });
        }
        throw userError;
      }
    }

    // Upload file to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      resource_type: "raw",
      public_id: `resumes/${user._id}/${path.basename(
        req.file.filename,
        ".pdf"
      )}`,
      tags: ["resume"],
    });

    // Parse resume text using Cloudinary URL
    const resumeData = await parseResumeText(result.secure_url);

    // Create resume record
    const resume = new Resume({
      user: user._id,
      filename: req.file.filename,
      originalFilename: req.file.originalname,
      cloudinaryUrl: result.secure_url,
      skills: resumeData.skills,
      experience: resumeData.experience,
      projects: resumeData.projects,
    });

    await resume.save();

    // Clean up local file
    fs.unlinkSync(req.file.path);

    res.status(200).json({
      message: "Resume uploaded successfully",
      resumeId: resume._id,
      userId: user._id,
      url: result.secure_url,
      skills: resumeData.skills,
      experience: resumeData.experience,
      projects: resumeData.projects,
    });
  } catch (error) {
    console.error("Error uploading resume:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get resume by ID
router.get("/:id", async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id).populate("user");

    if (!resume) {
      return res.status(404).json({ message: "Resume not found" });
    }

    res.status(200).json(resume);
  } catch (error) {
    console.error("Error fetching resume:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get all resumes for a user
router.get("/user/:userId", async (req, res) => {
  try {
    const resumes = await Resume.find({ user: req.params.userId }).sort({
      createdAt: -1,
    });
    res.status(200).json(resumes);
  } catch (error) {
    console.error("Error fetching user resumes:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;
