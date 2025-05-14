import mongoose from "mongoose";

const emailSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  resume: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Resume",
    required: true,
  },
  company: {
    type: String,
    required: true,
    trim: true,
  },
  recipient: {
    type: String,
    required: true,
    trim: true,
  },
  role: {
    type: String,
    required: true,
  },
  subject: {
    type: String,
    required: true,
    trim: true,
  },
  body: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["draft", "sent", "failed"],
    default: "draft",
  },
  sentAt: {
    type: Date,
  },
  companyResearch: {
    overview: String,
    achievements: String,
    culture: String,
    projects: String,
    techStack: String,
  },
  matchReason: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update timestamps before saving
emailSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

const Email = mongoose.model("Email", emailSchema);

export default Email;
