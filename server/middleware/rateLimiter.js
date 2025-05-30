import rateLimit from "express-rate-limit";

// Rate limiter for verification attempts
export const verifyEmailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window
  max: 3, // limit each IP to 3 requests per windowMs
  message: {
    message: "Too many verification attempts, please try again in an hour.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return `${req.ip}-${req.params.token}`; // Limit by IP and verification token
  },
});

// Increase the general API rate limit to allow more requests during debugging
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Temporarily increase to 500 requests per windowMs
  message: { message: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});
