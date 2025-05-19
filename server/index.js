import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import compression from "compression";
import { config } from "./config/config.js";
import Faculty from "./models/Faculty.js";
import Institution from "./models/Institution.js";
import { EventEmitter } from "events";

// Increase max listeners
EventEmitter.defaultMaxListeners = 15;

// Routes
import resumeRoutes from "./routes/resumeRoutes.js";
import emailRoutes from "./routes/emailRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import academicRoutes from "./routes/academicRoutes.js";
import statsRoutes from "./routes/statsRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create Express app
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());
app.use(cors(config.cors));

// Increase timeout for all routes
app.use((req, res, next) => {
  res.setTimeout(300000, () => {
    console.log("Request has timed out.");
    res.status(408).send("Request has timed out");
  });
  next();
});

// Enable gzip compression
app.use(compression());

// CORS configuration
app.use(cors(config.cors));

// Enable pre-flight requests for all routes
app.options("*", cors(config.cors));

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

// Cleanup old files from uploads directory
const cleanupUploads = () => {
  try {
    const files = fs.readdirSync(uploadsDir);
    const now = Date.now();
    files.forEach((file) => {
      const filePath = path.join(uploadsDir, file);
      const stats = fs.statSync(filePath);
      // Remove files older than 1 hour
      if (now - stats.mtimeMs > 60 * 60 * 1000) {
        fs.unlinkSync(filePath);
        console.log(`Cleaned up old upload: ${file}`);
      }
    });
  } catch (error) {
    console.error("Error cleaning up uploads:", error);
  }
};

// Run cleanup every hour
setInterval(cleanupUploads, 60 * 60 * 1000);
// Run cleanup on startup
cleanupUploads();

// Trust proxy if in production
if (config.server.nodeEnv === "production") {
  app.set("trust proxy", 1);
}

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/resumes", resumeRoutes);
app.use("/api/emails", emailRoutes);
app.use("/api/users", userRoutes);
app.use("/api/academic", academicRoutes);
app.use("/api/stats", statsRoutes);

// Database connection
mongoose
  .connect(config.mongodb.uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    family: 4, // Force IPv4
    retryWrites: true,
    maxPoolSize: 10,
    minPoolSize: 5,
    maxIdleTimeMS: 10000,
  })
  .then(async () => {
    console.log("Connected to MongoDB");

    // Check if we need to initialize the academic database
    const facultyCount = await Faculty.countDocuments();
    const institutionCount = await Institution.countDocuments();

    if (facultyCount === 0 || institutionCount === 0) {
      console.log("Initializing academic database...");
      try {
        const { default: initAcademicDb } = await import(
          "./scripts/initAcademicDb.js"
        );
        await initAcademicDb();
        console.log("Academic database initialized successfully");
      } catch (error) {
        console.error("Error initializing academic database:", error);
      }
    }
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
    // Don't exit process, let it retry
    if (error.name === "MongooseServerSelectionError") {
      console.log("Will retry connection automatically...");
    }
  });

// Handle MongoDB connection events
mongoose.connection.on("error", (err) => {
  console.error("MongoDB connection error:", err);
});

mongoose.connection.on("disconnected", () => {
  console.log("MongoDB disconnected. Attempting to reconnect...");
});

mongoose.connection.on("reconnected", () => {
  console.log("MongoDB reconnected successfully");
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
