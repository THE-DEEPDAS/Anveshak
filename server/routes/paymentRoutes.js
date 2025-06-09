import express from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import { authenticateToken as authMiddleware } from "../middleware/auth.js";
import User from "../models/User.js";
import paymentConfig from "../config/payment.js";

const router = express.Router();

// Validate Razorpay credentials
if (!paymentConfig.razorpay.key_id || !paymentConfig.razorpay.key_secret) {
  console.error("Razorpay credentials are missing!", {
    key_id_exists: !!paymentConfig.razorpay.key_id,
    key_secret_exists: !!paymentConfig.razorpay.key_secret,
  });
  throw new Error("Razorpay credentials are required");
}

// Initialize Razorpay instance
let razorpay;
function initializeRazorpay() {
  try {
    // Basic validation of key format
    const keyId = paymentConfig.razorpay.key_id;
    const keySecret = paymentConfig.razorpay.key_secret;

    if (!keyId || !keySecret) {
      throw new Error("Razorpay credentials are missing");
    }

    if (!keyId.startsWith("rzp_")) {
      throw new Error("Invalid Razorpay key format");
    }

    // Initialize Razorpay with validated credentials
    razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    // Log key type being used
    const isLiveKey = keyId.startsWith("rzp_live_");
    console.log(`Using Razorpay ${isLiveKey ? "live" : "test"} key`);

    return true;
  } catch (error) {
    console.error("Failed to initialize Razorpay client:", error);
    return false;
  }
}

// Initialize Razorpay
if (!initializeRazorpay()) {
  throw new Error("Payment service initialization failed");
}

// Create order
router.post("/create-order", authMiddleware, async (req, res) => {
  try {
    // Verify Razorpay instance is initialized
    if (!razorpay) {
      if (!initializeRazorpay()) {
        throw new Error("Payment service initialization failed");
      }
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    // Check for existing valid payment
    const now = new Date();
    if (
      user.hasValidPayment &&
      user.paymentExpiryDate &&
      new Date(user.paymentExpiryDate) > now
    ) {
      return res
        .status(400)
        .json({ error: "User already has an active subscription" });
    }

    // Generate shorter receipt ID to stay within 40 chars
    const timestamp = Math.floor(Date.now() / 1000)
      .toString()
      .slice(-8); // Last 8 digits
    const shortUserId = user._id.toString().slice(-4); // Last 4 chars
    const receipt = `ord_${timestamp}_${shortUserId}`; // ~16 chars total

    // Validate amount and currency
    const amount = parseInt(paymentConfig.razorpay.amount);
    if (isNaN(amount) || amount <= 0) {
      throw new Error("Invalid payment amount configured");
    }

    const currency = paymentConfig.razorpay.currency || "INR";
    if (!/^[A-Z]{3}$/.test(currency)) {
      throw new Error("Invalid currency code configured");
    }

    const options = {
      amount,
      currency,
      receipt,
      notes: {
        userId: user._id.toString(),
        userEmail: user.email,
        validityDays: paymentConfig.razorpay.validity_days,
      },
      payment_capture: 1,
    };

    let order;
    try {
      order = await razorpay.orders.create(options);
    } catch (error) {
      throw new Error(
        error.error?.description || "Failed to create Razorpay order"
      );
    }

    if (!order?.id) {
      throw new Error("Invalid order response from Razorpay");
    }

    // Send minimal required information to client
    return res.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: paymentConfig.razorpay.key_id,
      receipt: order.receipt,
    });
  } catch (error) {
    console.error("Payment order creation error:", error);
    return res.status(500).json({
      error: "Error creating payment order",
      details: error.message,
    });
  }
});

// Verify payment
router.post("/verify", authMiddleware, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    // Validate required parameters
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        error: "Incomplete payment verification data",
        details: "Missing one or more required parameters",
      });
    }

    // Verify signature
    const sign = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSign = crypto
      .createHmac("sha256", paymentConfig.razorpay.key_secret)
      .update(sign)
      .digest("hex");

    if (razorpay_signature !== expectedSign) {
      return res.status(400).json({
        error: "Invalid signature",
        details: "Payment verification failed",
      });
    }

    // Fetch payment details from Razorpay
    let paymentDetails;
    try {
      paymentDetails = await razorpay.payments.fetch(razorpay_payment_id);
    } catch (error) {
      throw new Error(`Failed to fetch payment details: ${error.message}`);
    }

    if (paymentDetails.status !== "captured") {
      return res.status(400).json({
        error: "Invalid payment status",
        details: `Payment status is ${paymentDetails.status}`,
      });
    }

    // Create payment record
    const paymentRecord = {
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      amount: paymentDetails.amount,
      status: paymentDetails.status,
      timestamp: new Date(),
    };

    // Update user payment status
    const validityDays = paymentConfig.razorpay.validity_days || 30;
    await User.findByIdAndUpdate(req.user.userId, {
      hasValidPayment: true,
      paymentExpiryDate: new Date(
        Date.now() + validityDays * 24 * 60 * 60 * 1000
      ),
      lastPaymentId: razorpay_payment_id,
      $push: { paymentHistory: paymentRecord },
    });

    return res.status(200).json({
      message: "Payment verified successfully",
      paymentDetails: paymentRecord,
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    return res.status(500).json({
      error: "Payment verification failed",
      details: error.message,
    });
  }
});

// Check payment status
router.get("/status", authMiddleware, async (req, res) => {
  try {
    // Set headers to prevent caching
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
    res.set("Expires", "0");
    res.set("Pragma", "no-cache");
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(401).json({
        hasValidPayment: false,
        paymentExpiryDate: null,
        lastPaymentId: null,
        message: "User not found",
      });
    }

    // Strict payment validation
    const now = new Date();
    const hasValidPayment =
      Boolean(user.hasValidPayment) &&
      user.paymentExpiryDate &&
      new Date(user.paymentExpiryDate) > now;

    res.json({
      hasValidPayment,
      paymentExpiryDate: user.paymentExpiryDate,
      lastPaymentId: user.lastPaymentId,
    });
  } catch (error) {
    console.error("Error checking payment status:", error);
    res.status(500).json({
      error: "Error checking payment status",
      details: error.message,
    });
  }
});

// Get payment history
router.get("/history", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    res.json(user.paymentHistory || []);
  } catch (error) {
    console.error("Error fetching payment history:", error);
    res.status(500).json({
      error: "Error fetching payment history",
      details: error.message,
    });
  }
});

export default router;
