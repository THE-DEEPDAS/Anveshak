import nodemailer from "nodemailer";
import { config } from "../config/config.js";

// Configure transporter
let transporter;

const initializeTransporter = () => {
  if (transporter) return;

  // Use SMTP configuration from config
  transporter = nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: config.email.secure,
    auth: {
      user: config.email.user,
      pass: config.email.pass,
    },
  });
};

// Initialize on first import
initializeTransporter();

export const sendEmail = async ({
  to,
  from,
  subject,
  text,
  html,
  userName,
}) => {
  try {
    if (!transporter) {
      initializeTransporter();

      // If still no transporter, throw error
      if (!transporter) {
        throw new Error("Email transporter not initialized");
      }
    }

    // Set up email options
    const mailOptions = {
      from: config.email.user || from,
      to,
      subject,
      text,
      html: html || text.replace(/\n/g, "<br>"),
    };

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

export const sendPasswordResetEmail = async (to, resetToken) => {
  const resetUrl = `${config.frontend.url}/reset-password/${resetToken}`;
  const subject = "Password Reset Request";
  const text = `You requested a password reset. Click the link below to reset your password:

${resetUrl}

If you did not request this, please ignore this email.`;

  await sendEmail({
    to,
    subject,
    text,
  });
};

export const sendVerificationEmail = async (to, verificationToken) => {
  const verificationUrl = `${config.frontend.url}/verify/${verificationToken}`;
  const subject = "Email Verification";
  const text = `Please verify your email by clicking the link below:

${verificationUrl}

If you did not request this, please ignore this email.`;

  await sendEmail({
    to,
    subject,
    text,
  });
};
