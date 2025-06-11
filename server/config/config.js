import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path, { dirname } from "path";
import { v2 as cloudinary } from "cloudinary";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from the root .env file
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Get allowed origins from environment variables
const getAllowedOrigins = () => {
  const defaultOrigins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://anveshak-git-main-the-deepdas-projects.vercel.app",
    "https://anveshak-the-deepdas-projects.vercel.app",
    "https://anveshak.vercel.app",
    "https://anveshak-8dq6lnxy9-the-deepdas-projects.vercel.app",
  ];

  let origins = [];

  // Add origins from environment variables
  if (process.env.FRONTEND_URLS) {
    const envOrigins = process.env.FRONTEND_URLS.split(",").map((url) =>
      url.trim()
    );
    origins.push(...envOrigins);
  }

  if (process.env.FRONTEND_URL) {
    origins.push(process.env.FRONTEND_URL);
  }

  // Combine with defaults and remove duplicates
  origins = [...new Set([...defaultOrigins, ...origins])];

  console.log("Configured CORS origins:", origins);
  return origins;
};

// CORS Configuration
const corsConfig = {
  origin: getAllowedOrigins(),
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Cache-Control",
    "Pragma",
    "Expires",
  ],
  // headers that can be exposed to the browser, allow access matlab
  exposedHeaders: ["Set-Cookie", "Cache-Control", "Pragma", "Expires"],
  // false means preflight requests will not be sent to next and will be responded immediately
  preflightContinue: false,
  // status code for successful preflight requests but no response body
  optionsSuccessStatus: 204,
};

// Validate required configurations
const validateConfig = () => {
  const requiredEnvVars = [
    "MONGODB_URI",
    "JWT_SECRET",
    "GEMINI_API_KEY",
    [
      "CLOUDINARY_URL",
      ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"],
    ],
  ];

  for (const envVar of requiredEnvVars) {
    if (Array.isArray(envVar)) {
      // Check if either the main variable or all alternatives are set
      const [mainVar, alternatives] = envVar;
      const mainVarExists = process.env[mainVar];
      const allAlternativesExist = alternatives.every(
        (alt) => process.env[alt]
      );

      if (!mainVarExists && !allAlternativesExist) {
        console.error(
          `Missing required configuration: ${mainVar} or all of [${alternatives.join(
            ", "
          )}]`
        );
        if (process.env.NODE_ENV === "production") {
          throw new Error(
            `Missing required configuration: ${mainVar} or alternatives`
          );
        }
      }
      continue;
    }

    if (!process.env[envVar]) {
      console.error(`Missing required configuration: ${envVar}`);
      if (process.env.NODE_ENV === "production") {
        throw new Error(`Missing required configuration: ${envVar}`);
      }
    }
  }
};

validateConfig();

// Cookie settings
const cookieConfig = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "development",
  sameSite: process.env.NODE_ENV === "development" ? "strict" : "lax",
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
};

// Helper to parse MongoDB URI and add options
const getMongoDBUri = () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI environment variable is not set");
    return "";
  }

  try {
    const url = new URL(uri);
    // Add connection options if not already present
    const searchParams = new URLSearchParams(url.search);
    if (!searchParams.has("retryWrites"))
      searchParams.set("retryWrites", "true");
    if (!searchParams.has("w")) searchParams.set("w", "majority");
    if (!searchParams.has("maxPoolSize")) searchParams.set("maxPoolSize", "10");
    url.search = searchParams.toString();
    return url.toString();
  } catch (error) {
    console.error("Error parsing MongoDB URI:", error);
    return uri;
  }
};

// Get backend URL based on environment
const getBackendUrl = () => {
  if (process.env.NODE_ENV === "production") {
    return process.env.BACKEND_URL || "https://anveshak-4md5.onrender.com";
  }
  return "http://localhost:5000";
};

// Export configuration
export const config = {
  email: {
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT, 10),
    secure: process.env.EMAIL_SECURE === "true",
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  mongodb: {
    uri: getMongoDBUri(),
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4, // Force IPv4
      retryWrites: true,
      maxPoolSize: 10,
      minPoolSize: 5,
      maxIdleTimeMS: 10000,
    },
  },
  server: {
    port: parseInt(process.env.PORT, 10) || 5000,
    nodeEnv: process.env.NODE_ENV || "development",
    url: getBackendUrl(),
  },
  frontend: {
    url: process.env.FRONTEND_URL || "http://localhost:5173",
    urls: (
      process.env.FRONTEND_URLS ||
      process.env.FRONTEND_URL ||
      "http://localhost:5173"
    )
      .split(",")
      .map((url) => url.trim()),
  },
  jwt: {
    secret: process.env.JWT_SECRET || "your-secret-key",
    expiresIn: "24h",
  },
  cloudinary: {
    url: process.env.CLOUDINARY_URL,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
    config: {
      folder: "resumes",
      resourceType: "raw",
      type: "authenticated",
      access_mode: "authenticated",
      secure: true,
    },
  },
  cookie: cookieConfig,
  cors: corsConfig,
};

// Export individual configs for direct access
export { corsConfig };

// Default export for backward compatibility
export default config;
