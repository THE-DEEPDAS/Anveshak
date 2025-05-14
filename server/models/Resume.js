import mongoose from "mongoose";

const parseResultSchema = new mongoose.Schema({
  skills: [
    {
      type: String,
      trim: true,
    },
  ],
  experience: [
    {
      type: String,
      trim: true,
    },
  ],
  projects: [
    {
      type: String,
      trim: true,
    },
  ],
  parsedAt: {
    type: Date,
    default: Date.now,
  },
});

const resumeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  filename: {
    type: String,
    required: true,
  },
  originalFilename: {
    type: String,
    required: true,
  },
  cloudinaryUrl: {
    type: String,
    required: true,
  },
  currentVersion: {
    type: Number,
    default: 1,
  },
  parseHistory: [parseResultSchema],
  skills: [
    {
      type: String,
      trim: true,
    },
  ],
  experience: [
    {
      type: String,
      trim: true,
    },
  ],
  projects: [
    {
      type: String,
      trim: true,
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt field before saving
resumeSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const Resume = mongoose.model("Resume", resumeSchema);

export default Resume;
