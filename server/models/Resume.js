import mongoose from "mongoose";

const parseResultSchema = new mongoose.Schema({
  skills: [{ type: String, trim: true }],
  experience: [{ type: String, trim: true }],
  projects: [{ type: String, trim: true }],
  education: [
    {
      institution: { type: String, trim: true },
      degree: { type: String, trim: true },
      field: { type: String, trim: true },
      startDate: { type: String },
      endDate: { type: String },
      gpa: { type: String },
    },
  ],
  parseMethod: { type: String }, // Track which parsing method was used
  warning: { type: String }, // Store any warnings at the history level
  parsedAt: { type: Date, default: Date.now },
});

const resumeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    education: {
      type: [
        {
          name: { type: String, trim: true },
          institution: { type: String, trim: true },
          degree: { type: String, trim: true },
          field: { type: String, trim: true },
          startDate: { type: String },
          endDate: { type: String },
          gpa: { type: String },
        },
      ],
      default: [], // Make education optional with empty array default
    },
    filename: {
      type: String,
      required: true,
    },
    originalFilename: {
      type: String,
      required: true,
    },
    cloudinaryPublicId: {
      type: String,
      required: true,
      unique: true,
    },
    cloudinaryUrl: {
      type: String,
      required: true,
    },
    text: { type: String }, // Store raw extracted text
    skills: [{ type: String, trim: true }],
    experience: [{ type: String, trim: true }],
    projects: [{ type: String, trim: true }],
    parseHistory: [parseResultSchema],
    currentVersion: {
      type: Number,
      default: 1,
    },
    parseMethod: {
      type: String,
      enum: [
        "regular",
        "ai",
        "combined",
        "advanced",
        "simplified",
        "manual_required",
        "previous_version",
        "previous_version_fallback",
        "previous_version_error_fallback",
        "regular_fallback",
        "failed",
        "partial",
      ],
    },
    lastParseAttempt: {
      type: Date,
      default: Date.now,
    },
    parseStatus: {
      type: String,
      enum: ["pending", "completed", "failed", "partial"],
      default: "pending",
    },
    parseError: {
      message: String,
      timestamp: Date,
      stack: String, // Store stack trace for debugging
    },
    warning: { type: String }, // Store parsing warnings
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    lastModifiedBy: {
      type: String,
      enum: ["system", "user", "ai"],
      default: "system",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
resumeSchema.index({ user: 1, createdAt: -1 });
resumeSchema.index({ cloudinaryPublicId: 1 }, { unique: true });

// Enhanced method to update parse results with more details
resumeSchema.methods.updateParseResults = function (parseResults) {
  this.text = parseResults.text; // Store raw text

  // Replace (not append) skills, experience, projects and education with new values
  this.skills = parseResults.skills || [];
  this.experience = parseResults.experience || [];
  this.projects = parseResults.projects || [];
  this.education = parseResults.education || [];

  this.warning = parseResults.warning; // Store any warnings
  this.parseMethod = parseResults.parseMethod || "regular";

  // Add to parse history with method and warnings
  this.parseHistory.push({
    skills: this.skills,
    experience: this.experience,
    projects: this.projects,
    parseMethod: this.parseMethod,
    warning: this.warning,
    parsedAt: parseResults.parsedAt || new Date(),
  });

  this.currentVersion += 1;

  // Set status based on content and warnings
  if (
    this.skills.length === 0 &&
    this.experience.length === 0 &&
    this.projects.length === 0
  ) {
    this.parseStatus = "partial";
  } else {
    this.parseStatus = "completed";
  }

  this.lastParseAttempt = new Date();
  this.lastModifiedBy = "system";
  return this.save();
};

// Enhanced method to mark parsing as failed with more details
resumeSchema.methods.markParseFailed = function (error) {
  this.parseStatus = "failed";
  this.parseMethod = "failed";
  this.parseError = {
    message: error.message || "Unknown error parsing resume",
    timestamp: new Date(),
    stack: error.stack || null,
  };
  this.lastParseAttempt = new Date();
  return this.save();
};

// Method for manual updates from user
resumeSchema.methods.updateManually = function (userData) {
  // Store previous values in history before updating
  this.parseHistory.push({
    skills: this.skills || [],
    experience: this.experience || [],
    projects: this.projects || [],
    parseMethod: this.parseMethod,
    warning: this.warning,
    parsedAt: new Date(),
  });

  // Update with user-provided data
  if (userData.skills !== undefined) this.skills = userData.skills;
  if (userData.experience !== undefined) this.experience = userData.experience;
  if (userData.projects !== undefined) this.projects = userData.projects;
  if (userData.education !== undefined) this.education = userData.education;

  // Clear warnings and errors since user has manually fixed
  this.warning = null;
  this.parseError = null;

  // Update metadata
  this.currentVersion += 1;
  this.lastModifiedBy = "user";
  this.parseStatus = "completed"; // Manual edits always set status to completed

  return this.save();
};

const Resume = mongoose.model("Resume", resumeSchema);

export default Resume;
