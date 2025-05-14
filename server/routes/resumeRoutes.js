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
    // Clean filename and ensure PDF extension
    const cleanName = file.originalname
      .replace(/[^a-zA-Z0-9]/g, "-")
      .toLowerCase();
    const timestamp = Date.now();
    cb(null, `${timestamp}-${cleanName}`);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    if (file.mimetype !== "application/pdf") {
      return cb(new Error("Only PDF files are allowed"));
    }
    cb(null, true);
  },
});

const router = express.Router();

// Upload and process resume
router.post("/upload", upload.single("resume"), async (req, res) => {
  let uploadedFile = null;

  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    uploadedFile = req.file;

    const { name, email, replace, previousResumeId } = req.body;

    if (!name || !email) {
      throw new Error("Name and email are required");
    }

    // Create or find user
    let user = await User.findOne({ email });
    if (!user) {
      user = new User({ name, email, isVerified: false });
      try {
        await user.save();
      } catch (userError) {
        if (userError.code === 11000) {
          throw new Error(
            "Email already exists. Please log in or use a different email."
          );
        }
        throw userError;
      }
    }

    // Handle existing resume replacement
    if (replace && previousResumeId) {
      const oldResume = await Resume.findById(previousResumeId);
      if (oldResume) {
        try {
          const publicId = oldResume.cloudinaryUrl
            .split("/")
            .slice(-2)
            .join("/")
            .split(".")[0];
          await cloudinary.uploader.destroy(publicId, {
            resource_type: "raw",
            invalidate: true,
          });
        } catch (deleteError) {
          console.error("Error deleting old resume:", deleteError);
        }
      }
    }

    // Upload to Cloudinary with enhanced settings
    const folderPath = `resumes/${user._id}`;
    const timestamp = Math.floor(Date.now() / 1000);
    const uploadResult = await cloudinary.uploader.upload(req.file.path, {
      resource_type: "raw",
      folder: folderPath,
      public_id: path.basename(req.file.filename, ".pdf"),
      type: "private",
      access_mode: "authenticated",
      timestamp: timestamp,
      use_filename: true,
      unique_filename: true,
      format: "pdf",
      overwrite: true,
      invalidate: true,
    });

    if (!uploadResult?.secure_url) {
      throw new Error("Failed to upload file to Cloudinary");
    }

    // Parse resume with enhanced error handling
    let resumeData;
    try {
      resumeData = await parseResumeText(uploadResult.secure_url);
    } catch (parseError) {
      throw new Error(`Resume parsing failed: ${parseError.message}`);
    }

    if (
      !resumeData ||
      (!resumeData.skills?.length &&
        !resumeData.experience?.length &&
        !resumeData.projects?.length)
    ) {
      throw new Error("Failed to extract content from resume");
    }

    // Create or update resume record
    let resume;
    if (replace && previousResumeId) {
      resume = await Resume.findByIdAndUpdate(
        previousResumeId,
        {
          filename: req.file.filename,
          originalFilename: req.file.originalname,
          cloudinaryUrl: uploadResult.secure_url,
          skills: resumeData.skills,
          experience: resumeData.experience,
          projects: resumeData.projects,
          $push: { parseHistory: resumeData },
          $inc: { currentVersion: 1 },
        },
        { new: true }
      );
    } else {
      resume = new Resume({
        user: user._id,
        filename: req.file.filename,
        originalFilename: req.file.originalname,
        cloudinaryUrl: uploadResult.secure_url,
        skills: resumeData.skills,
        experience: resumeData.experience,
        projects: resumeData.projects,
        parseHistory: [resumeData],
      });
      await resume.save();
    }

    // Clean up local file
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(200).json({
      message: "Resume uploaded successfully",
      resumeId: resume._id,
      userId: user._id,
      url: uploadResult.secure_url,
      skills: resumeData.skills,
      experience: resumeData.experience,
      projects: resumeData.projects,
    });
  } catch (error) {
    console.error("Error uploading resume:", error);

    // Clean up local file if it exists
    if (uploadedFile?.path && fs.existsSync(uploadedFile.path)) {
      fs.unlinkSync(uploadedFile.path);
    }

    res
      .status(error.message.includes("Email already exists") ? 409 : 500)
      .json({
        message: error.message || "Server error while uploading resume",
      });
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

// Add a route to check if a user has uploaded a resume
router.get("/user/:userId/has-resume", async (req, res) => {
  try {
    const resumeExists = await Resume.exists({ user: req.params.userId });
    res.status(200).json({ hasResume: !!resumeExists });
  } catch (error) {
    console.error("Error checking resume existence:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;
