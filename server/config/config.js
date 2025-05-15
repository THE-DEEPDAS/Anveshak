import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname } from "path";
import path from "path";
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

// Validate required configurations
const validateConfig = () => {
  const requiredEnvVars = [
    "MONGODB_URI",
    "JWT_SECRET",
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
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
};

// CORS settings
const corsConfig = {
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["set-cookie"],
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
    uri: process.env.MONGODB_URI,
  },
  server: {
    port: parseInt(process.env.PORT, 10) || 5000,
    nodeEnv: process.env.NODE_ENV || "development",
  },
  frontend: {
    url: process.env.FRONTEND_URL || "http://localhost:5173",
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

export default config;
