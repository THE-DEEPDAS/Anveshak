import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import { config } from "./config/config.js";

// Routes
import resumeRoutes from "./routes/resumeRoutes.js";
import emailRoutes from "./routes/emailRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import authRoutes from "./routes/authRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create Express app
const app = express();

// CORS configuration
app.use(cors(config.cors));

// Enable pre-flight requests for all routes
app.options("*", cors(config.cors));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Custom morgan format to minimize console noise
app.use(
  morgan(":method :url :status - :response-time ms", {
    skip: (req, res) => {
      // Skip logging for successful static file requests
      return (
        req.method === "GET" &&
        (req.url.startsWith("/static/") ||
          req.url.includes(".") ||
          req.url === "/favicon.ico")
      );
    },
  })
);

// Temporary storage for development
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "uploads/"));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

// Make the uploads directory if it doesn't exist
import fs from "fs";
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Trust proxy if in production
if (config.server.nodeEnv === "production") {
  app.set("trust proxy", 1);
}

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/resumes", resumeRoutes);
app.use("/api/emails", emailRoutes);
app.use("/api/users", userRoutes);

// Database connection
mongoose
  .connect(config.mongodb.uri)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  });

// Serve static files in production
if (config.server.nodeEnv === "production") {
  app.use(express.static(path.join(__dirname, "../dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../dist", "index.html"));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  // Log full error in development
  if (config.server.nodeEnv === "development") {
    console.error(err);
  }

  // Log only error message and stack in production
  console.error(`${err.name}: ${err.message}`);

  // Don't expose error details in production
  const response = {
    message:
      config.server.nodeEnv === "development"
        ? err.message
        : "An error occurred",
    error:
      config.server.nodeEnv === "development"
        ? {
            name: err.name,
            message: err.message,
            stack: err.stack,
          }
        : undefined,
  };

  res.status(err.status || 500).json(response);
});

// Start server
const server = app.listen(config.server.port, () => {
  console.log(`Server running on port ${config.server.port}`);
});

// Handle uncaught exceptions and rejections
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  // Gracefully shutdown
  server.close(() => process.exit(1));
});

process.on("unhandledRejection", (error) => {
  console.error("Unhandled Rejection:", error);
  // Gracefully shutdown
  server.close(() => process.exit(1));
});

export default app;
