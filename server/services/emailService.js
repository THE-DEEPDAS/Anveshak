import nodemailer from "nodemailer";
import { config } from "../config/config.js";

// Create reusable transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: config.email.secure,
  auth: {
    user: config.email.user,
    pass: config.email.pass,
  },
});

// Verify transporter on startup
transporter.verify(function (error, success) {
  if (error) {
    console.error("SMTP connection error:", error);
  } else {
    console.log("SMTP server is ready to send emails");
  }
});

// Send email function
export const sendEmail = async ({ to, subject, text, cc, bcc, replyTo }) => {
  try {
    // Default sender
    const from = `${process.env.COMPANY_NAME || "Cold Mailer"} <${
      config.email.user
    }>`;

    const mailOptions = {
      from,
      to,
      subject,
      text,
      ...(cc && { cc }),
      ...(bcc && { bcc }),
      ...(replyTo && { replyTo }),
    };

    // Log email attempt in development
    if (process.env.NODE_ENV === "development") {
      console.log("Sending email:", {
        to,
        subject,
        textLength: text.length,
      });
    }

    // Send email
    const info = await transporter.sendMail(mailOptions);

    // For test emails, log the preview URL
    if (info.messageId && info.testMessageUrl) {
      console.log("Preview URL: %s", info.testMessageUrl);
    }

    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

// Send verification email
export const sendVerificationEmail = async (to, verificationToken) => {
  const verificationUrl = `${config.frontend.url}/verify/${verificationToken}`;
  const subject = "Email Verification";
  const text = `Thank you for signing up! Please verify your email by clicking the link below:

${verificationUrl}

This link will expire in 24 hours.

If you did not sign up for an account, please ignore this email.`;

  await sendEmail({
    to,
    subject,
    text,
  });
};

// Send password reset email
export const sendPasswordResetEmail = async (to, resetToken) => {
  const resetUrl = `${config.frontend.url}/reset-password/${resetToken}`;
  const subject = "Password Reset Request";
  const text = `You requested a password reset. Click the link below to reset your password:

${resetUrl}

If you did not request this, please ignore this email.

This link will expire in 1 hour.`;

  await sendEmail({
    to,
    subject,
    text,
  });
};

// Send test email
export const sendTestEmail = async (to) => {
  const subject = "Test Email from Cold Mailer";
  const text =
    "This is a test email to verify the email sending functionality is working correctly.";

  await sendEmail({
    to,
    subject,
    text,
  });
};
