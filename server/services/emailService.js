import nodemailer from "nodemailer";
import { config } from "../config/config.js";

// Validate email format
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate email content
const validateEmailContent = ({ to, subject, text, cc, bcc }) => {
  const errors = [];

  if (!to || !isValidEmail(to)) {
    errors.push("Invalid recipient email address");
  }

  if (!subject || subject.trim().length === 0) {
    errors.push("Subject is required");
  }

  if (!text || text.trim().length === 0) {
    errors.push("Email body is required");
  }

  if (cc && (!Array.isArray(cc) || !cc.every(isValidEmail))) {
    errors.push("Invalid CC email address(es)");
  }

  if (bcc && (!Array.isArray(bcc) || !bcc.every(isValidEmail))) {
    errors.push("Invalid BCC email address(es)");
  }

  return errors;
};

// Helper to retry failed email sending
const retryEmailSend = async (mailOptions, maxRetries = 3, delay = 1000) => {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log(`Email sent successfully on attempt ${attempt}`);
      return info;
    } catch (error) {
      console.error(`Email send attempt ${attempt} failed:`, error);
      lastError = error;

      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, delay * attempt));
      }
    }
  }
  throw lastError;
};

// Create reusable transporter object using SMTP transport with better configuration
const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: config.email.secure,
  auth: {
    user: config.email.user,
    pass: config.email.pass,
  },
  // Add better error handling and retries
  pool: true, // Use pooled connections
  maxConnections: 5,
  maxMessages: 100,
  rateLimit: 5, // Limit to 5 emails per second
  rateDelta: 1000, // Time window for rate limiting
});

// Verify transporter on startup
transporter.verify(function (error, success) {
  if (error) {
    console.error("SMTP connection error:", error);
  } else {
    console.log("SMTP server is ready to send emails");
  }
});

// Send email function with validation and retry logic
export const sendEmail = async ({ to, subject, text, cc, bcc, replyTo }) => {
  try {
    // Validate email content
    const validationErrors = validateEmailContent({
      to,
      subject,
      text,
      cc,
      bcc,
    });
    if (validationErrors.length > 0) {
      throw new Error(
        `Email validation failed: ${validationErrors.join(", ")}`
      );
    }

    // Default sender with better formatting
    const from = `${process.env.COMPANY_NAME || "Cold Mailer"} <${
      config.email.user
    }>`;

    // Prepare mail options with improved settings
    const mailOptions = {
      from,
      to,
      subject: subject.trim(),
      text: text.trim(),
      ...(cc && { cc }),
      ...(bcc && { bcc }),
      ...(replyTo && { replyTo }),
      // Add message priority and tracking options
      priority: "high",
      headers: {
        "X-Entity-Ref-ID": Date.now().toString(),
      },
    };

    // Log email attempt in development
    if (process.env.NODE_ENV === "development") {
      console.log("Sending email:", {
        to,
        subject,
        textLength: text.length,
        timestamp: new Date().toISOString(),
      });
    }

    // Try to send email with retries
    const info = await retryEmailSend(mailOptions);

    // For test emails, log the preview URL
    if (info.messageId && info.testMessageUrl) {
      console.log("Preview URL:", info.testMessageUrl);
    }

    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

// Send verification email with improved format
export const sendVerificationEmail = async (to, verificationToken, origin) => {
  // Check if the origin is in allowed URLs, otherwise use default
  const allowedUrls = process.env.FRONTEND_URLS ? process.env.FRONTEND_URLS.split(',') : [process.env.FRONTEND_URL];
  const baseUrl = allowedUrls.includes(origin) ? origin : allowedUrls[0];
  const verificationUrl = `${baseUrl}/verify/${verificationToken}`;
  const subject = "Email Verification";
  const text = `Thank you for signing up! Please verify your email by clicking the link below:

${verificationUrl}

This link will expire in 24 hours.

If you did not sign up for an account, please ignore this email.

Best regards,
The Cold Mailer Team`;

  return sendEmail({ to, subject, text });
};

// Send password reset email with improved format
export const sendPasswordResetEmail = async (to, resetToken, origin) => {
  // Check if the origin is in allowed URLs, otherwise use default
  const allowedUrls = process.env.FRONTEND_URLS ? process.env.FRONTEND_URLS.split(',') : [process.env.FRONTEND_URL];
  const baseUrl = allowedUrls.includes(origin) ? origin : allowedUrls[0];
  const resetUrl = `${baseUrl}/reset-password/${resetToken}`;
  const subject = "Password Reset Request";
  const text = `You requested a password reset. Click the link below to reset your password:

${resetUrl}

If you did not request this, please ignore this email.

This link will expire in 1 hour.

Best regards,
The Cold Mailer Team`;

  return sendEmail({ to, subject, text });
};

// Send test email with improved format
export const sendTestEmail = async (to) => {
  const subject = "Test Email from Cold Mailer";
  const text = `This is a test email to verify the email sending functionality is working correctly.

Best regards,
The Cold Mailer Team`;

  return sendEmail({ to, subject, text });
};
