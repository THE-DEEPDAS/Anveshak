import mongoose from "mongoose";

const facultySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
  institution: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Institution",
    required: true,
  },
  department: {
    type: String,
    required: true,
    trim: true,
  },
  researchInterests: [
    {
      type: String,
      trim: true,
    },
  ],
  portfolio: {
    type: String,
    trim: true,
  },
  publications: [
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

facultySchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

const Faculty = mongoose.model("Faculty", facultySchema);

export default Faculty;
