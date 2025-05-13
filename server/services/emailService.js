import nodemailer from "nodemailer";

// Configure transporter
let transporter;

const initializeTransporter = () => {
  if (transporter) return;

  if (
    process.env.EMAIL_HOST &&
    process.env.EMAIL_USER &&
    process.env.EMAIL_PASS
  ) {
    // Use SMTP configuration
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT || 587,
      secure: process.env.EMAIL_SECURE === "true",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  } else {
    // Use ethereal.email for testing
    nodemailer
      .createTestAccount()
      .then((testAccount) => {
        transporter = nodemailer.createTransport({
          host: "smtp.ethereal.email",
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });
        console.log("Using ethereal email for testing:", testAccount.user);
      })
      .catch((error) => {
        console.error("Failed to create test email account:", error);
      });
  }
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
      from: process.env.EMAIL_USER || from,
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
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
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
  const verificationUrl = `${process.env.FRONTEND_URL}/verify/${verificationToken}`;
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
