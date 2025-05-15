import mongoose from "mongoose";

const parseResultSchema = new mongoose.Schema({
  skills: [{ type: String, trim: true }],
  experience: [{ type: String, trim: true }],
  projects: [{ type: String, trim: true }],
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
    lastParseAttempt: {
      type: Date,
      default: Date.now,
    },
    parseStatus: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },
    parseError: {
      message: String,
      timestamp: Date,
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
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
resumeSchema.index({ user: 1, createdAt: -1 });
resumeSchema.index({ cloudinaryPublicId: 1 }, { unique: true });

// Method to update parse results
resumeSchema.methods.updateParseResults = function (parseResults) {
  this.text = parseResults.text; // Store raw text
  this.skills = parseResults.skills || [];
  this.experience = parseResults.experience || [];
  this.projects = parseResults.projects || [];
  this.warning = parseResults.warning; // Store any warnings
  this.parseHistory.push({
    skills: this.skills,
    experience: this.experience,
    projects: this.projects,
    parsedAt: new Date(),
  });
  this.currentVersion += 1;
  this.parseStatus = "completed";
  this.lastParseAttempt = new Date();
  return this.save();
};

// Method to mark parsing as failed
resumeSchema.methods.markParseFailed = function (error) {
  this.parseStatus = "failed";
  this.parseError = {
    message: error.message,
    timestamp: new Date(),
  };
  this.lastParseAttempt = new Date();
  return this.save();
};

const Resume = mongoose.model("Resume", resumeSchema);

export default Resume;
