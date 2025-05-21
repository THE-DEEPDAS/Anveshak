import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_SECURE === "true", // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER, // your email address
    pass: process.env.EMAIL_PASS, // your email password or app password
  },
});

const mailOptions = {
  from: process.env.EMAIL_USER, // sender address
  to: process.env.EMAIL_USER, // recipient address (use your own email for testing)
  subject: "Test Email from Anveshak ", // Subject line
  text: "This is a test email to verify the email credentials.", // plain text body
};

transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    return console.error("Error sending email:", error);
  }
  console.log("Email sent successfully:", info.response);
});
