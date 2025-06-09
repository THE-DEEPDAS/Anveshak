import User from "../models/User.js";
import jwt from "jsonwebtoken";

export const checkPaymentMiddleware = async (req, res, next) => {
  try {
    // Set no-cache headers
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
    res.set("Expires", "0");
    res.set("Pragma", "no-cache");

    // Check for Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "No token provided",
      });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Invalid token format",
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded?.userId) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Invalid token",
      });
    }

    // Find user and check payment status
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "User not found",
      });
    }

    req.user = user;

    // Skip payment check for payment routes
    if (req.path.startsWith("/api/payment/")) {
      return next();
    }

    const hasValidPayment =
      Boolean(user.hasValidPayment) &&
      user.paymentExpiryDate &&
      new Date(user.paymentExpiryDate) > new Date();

    if (!hasValidPayment) {
      return res.status(402).json({
        error: "Payment Required",
        message: "Please subscribe to access this feature",
      });
    }

    next();
  } catch (error) {
    console.error("Payment middleware error:", error);
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Invalid token",
      });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Token expired",
      });
    }
    res.status(500).json({
      error: "Internal server error",
      message: "An error occurred while checking payment status",
    });
  }
};
