import mongoose from "mongoose";

const institutionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  type: {
    type: String,
    required: true,
    enum: [
      "IIT",
      "NIT",
      "IIIT",
      "ISRO",
      "DRDO",
      "IIST",
      "IISER",
      "NISER",
      "IISc",
      "OTHER",
    ],
    trim: true,
  },
  location: {
    type: String,
    required: true,
    trim: true,
  },
  departments: [
    {
      type: String,
      trim: true,
    },
  ],
  website: {
    type: String,
    required: true,
    trim: true,
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

institutionSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

const Institution = mongoose.model("Institution", institutionSchema);

export default Institution;
