import express from "express";
import Email from "../models/Email.js";
import Resume from "../models/Resume.js";
import {
  generateEmailContent,
  findCompaniesForSkills,
  researchCompany,
} from "../services/aiService.js";
import { sendEmail } from "../services/emailService.js";

const router = express.Router();

// Multi-step email generation
router.post("/generate", async (req, res) => {
  try {
    const { resumeId, action, companies, emailIds } = req.body;

    // Validate resumeId
    if (!resumeId || typeof resumeId !== "string") {
      return res.status(400).json({ message: "Valid Resume ID is required" });
    }

    // Find resume with user data
    const resume = await Resume.findById(resumeId).populate("user");
    if (!resume) {
      return res.status(404).json({ message: "Resume not found" });
    }

    // Validate resume has required data
    if (!resume.skills?.length || !resume.projects?.length) {
      return res.status(400).json({
        message: "Resume must have skills and projects to generate emails",
      });
    }

    switch (action) {
      case "find-companies":
        // Find matching companies based on skills and projects
        const matchingCompanies = await findCompaniesForSkills(
          resume.skills,
          resume.projects
        );

        if (!matchingCompanies?.length) {
          return res.status(404).json({
            message: "No matching companies found for your skills and projects",
          });
        }

        return res.status(200).json({ companies: matchingCompanies });

      case "generate-emails":
        if (!Array.isArray(companies) || companies.length === 0) {
          return res
            .status(400)
            .json({ message: "Selected companies are required" });
        }

        // Generate personalized emails for selected companies
        const emailPromises = companies.map(async (company) => {
          if (!company.name || !company.email || !company.role) {
            throw new Error("Invalid company data");
          }

          // Generate email content with company research
          const emailContent = await generateEmailContent({
            userName: resume.user.name,
            userEmail: resume.user.email,
            company: company.name,
            skills: resume.skills,
            experience: resume.experience,
            projects: resume.projects,
            role: company.role,
            companyResearch: company.research,
          });

          // Create new email document
          const email = new Email({
            user: resume.user._id,
            resume: resume._id,
            company: company.name,
            recipient: company.email,
            role: company.role,
            subject: emailContent.subject,
            body: emailContent.body,
            status: "draft",
            companyResearch: company.research,
            matchReason: company.matchReason,
          });

          return email.save();
        });

        try {
          const savedEmails = await Promise.all(emailPromises);
          return res.status(200).json({ emails: savedEmails });
        } catch (error) {
          console.error("Error generating emails:", error);
          return res.status(400).json({
            message: "Error generating emails: " + error.message,
          });
        }

      case "send-emails":
        if (!Array.isArray(emailIds) || emailIds.length === 0) {
          return res.status(400).json({ message: "Email IDs are required" });
        }

        // Find all emails to send
        const emailsToSend = await Email.find({
          _id: { $in: emailIds },
          status: "draft",
        });

        if (emailsToSend.length === 0) {
          return res
            .status(400)
            .json({ message: "No valid emails found to send" });
        }

        // Send each email
        const sendPromises = emailsToSend.map(async (email) => {
          try {
            await sendEmail({
              to: email.recipient,
              subject: email.subject,
              text: email.body,
              replyTo: resume.user.email,
            });

            // Update email status to sent
            email.status = "sent";
            email.sentAt = new Date();
            await email.save();

            return {
              success: true,
              emailId: email._id,
              recipient: email.recipient,
            };
          } catch (error) {
            console.error(`Error sending email to ${email.recipient}:`, error);

            // Update email status to failed
            email.status = "failed";
            await email.save();

            return {
              success: false,
              emailId: email._id,
              recipient: email.recipient,
              error: error.message,
            };
          }
        });

        const results = await Promise.all(sendPromises);

        // Check if any emails failed to send
        const failedEmails = results.filter((result) => !result.success);
        if (failedEmails.length > 0) {
          return res.status(207).json({
            message: "Some emails failed to send",
            results,
          });
        }

        return res.status(200).json({
          message: "All emails sent successfully",
          results,
        });

      default:
        return res.status(400).json({ message: "Invalid action specified" });
    }
  } catch (error) {
    console.error("Error processing email request:", error);
    res.status(500).json({
      message: "Server error processing email request",
      error: error.message,
    });
  }
});

// Get emails by resume ID
router.get("/resume/:resumeId", async (req, res) => {
  try {
    const emails = await Email.find({ resume: req.params.resumeId }).sort({
      createdAt: -1,
    });
    res.status(200).json(emails);
  } catch (error) {
    console.error("Error fetching emails by resume ID:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get emails by user ID
router.get("/user/:userId", async (req, res) => {
  try {
    const emails = await Email.find({ user: req.params.userId }).sort({
      createdAt: -1,
    });
    res.status(200).json(emails);
  } catch (error) {
    console.error("Error fetching emails by user ID:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get email by ID
router.get("/:id", async (req, res) => {
  try {
    const email = await Email.findById(req.params.id).populate("user resume");

    if (!email) {
      return res.status(404).json({ message: "Email not found" });
    }

    res.status(200).json(email);
  } catch (error) {
    console.error("Error fetching email:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;
