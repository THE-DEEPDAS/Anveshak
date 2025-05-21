import express from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/User.js";
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
} from "../services/emailService.js";
import { authenticateToken } from "../middleware/auth.js";
import { verifyEmailLimiter, apiLimiter } from "../middleware/rateLimiter.js";
import { config } from "../config/config.js";

const router = express.Router();

// Apply rate limiter to all auth routes
router.use(apiLimiter);

// Register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email, and password are required",
        missing: {
          name: !name,
          email: !email,
          password: !password,
        },
      });
    }

    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Create verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user
    user = new User({
      name,
      email,
      password, // Password will be hashed by the pre-save hook
      verificationToken,
      verificationTokenExpiry,
    });

    await user.save();

    // Get origin from request headers
    const origin = req.get("origin");

    // Send verification email
    try {
      await sendVerificationEmail(email, verificationToken, origin);
    } catch (emailError) {
      console.error("Error sending verification email:", emailError);
      // Don't fail registration if email fails, but log it
    }

    res.status(201).json({
      message:
        "Registration successful. Please check your email to verify your account.",
      userId: user._id,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
});

// Verify email - add verifyEmailLimiter
router.get("/verify/:token", verifyEmailLimiter, async (req, res) => {
  try {
    const user = await User.findOne({
      verificationToken: req.params.token,
      verificationTokenExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid or expired verification token" });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "Email is already verified" });
    }    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpiry = undefined;
    await user.save();

    // Send confirmation email
    await sendEmail({
      to: user.email,
      subject: "Email Verification Successful",
      text: `Your email has been successfully verified! You can now log in to your account at ${process.env.FRONTEND_URL || 'http://localhost:5173'}.

Best regards,
The Anveshak Team`
    });

    // Send HTML response instead of JSON
    res.send(`
      <html>
        <head>
          <title>Email Verified</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; text-align: center; }
            .container { max-width: 600px; margin: 40px auto; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); background: white; }
            h1 { color: #2563eb; margin-bottom: 16px; }
            p { color: #4b5563; margin-bottom: 24px; }
            .check-icon { color: #10b981; font-size: 48px; margin-bottom: 20px; }
          </style>
        </head>
        <body style="background-color: #f3f4f6;">
          <div class="container">
            <div class="check-icon">✓</div>
            <h1>Email Verified Successfully!</h1>
            <p>Your email has been verified. You will receive a confirmation email shortly.</p>
            <p>You can now close this window and log in to your account.</p>
          </div>
        </body>
      </html>
    `);
  } catch (error) {
    console.error("Verification error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Check if verified
    if (!user.isVerified) {
      return res
        .status(400)
        .json({ message: "Please verify your email before logging in" });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Create token with 30 days expiration
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "30d",
    });

    // Set HTTP-only cookie that expires in 30 days
    res.cookie("token", token, config.cookie);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Request password reset
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpiry = Date.now() + 3600000; // 1 hour

    await user.save();

    // Get origin from request headers
    const origin = req.get("origin");

    // Send password reset email
    await sendPasswordResetEmail(email, resetToken, origin);

    res.json({ message: "Password reset email sent" });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Reset password
router.post("/reset-password/:token", async (req, res) => {
  try {
    const { password } = req.body;
    const user = await User.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordTokenExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid or expired reset token" });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordTokenExpiry = undefined;
    await user.save();

    res.json({ message: "Password reset successful" });
  } catch (error) {
    console.error("Password reset error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get current user
router.get("/me", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Refresh token
router.get("/refresh-token", async (req, res) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select("-password");

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Create new token
      const newToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
        expiresIn: "30d",
      });

      // Set new cookie
      res.cookie("token", newToken, config.cookie);

      // Send new token and user data
      res.json({
        token: newToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
        },
      });
    } catch (error) {
      // Clear invalid token
      res.clearCookie("token", config.cookie);
      return res.status(401).json({ message: "Invalid or expired token" });
    }
  } catch (error) {
    console.error("Token refresh error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Logout
router.post("/logout", (req, res) => {
  res.clearCookie("token", {
    ...config.cookie,
    maxAge: 0,
  });
  res.json({ message: "Logged out successfully" });
});

export default router;
