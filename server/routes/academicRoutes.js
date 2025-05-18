import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import {
  searchFaculty,
  generateBetterEmail,
  saveFacultyToDatabase,
} from "../services/academicEmailService.js";
import { sendEmail } from "../services/emailService.js";
import Email from "../models/Email.js";
import Resume from "../models/Resume.js";

const router = express.Router();

/**
 * Generate email previews for selected faculty
 */
router.post("/generate-preview-emails", async (req, res) => {
  try {
    const { resumeId, selectedFaculty } = req.body;

    if (
      !resumeId ||
      !Array.isArray(selectedFaculty) ||
      selectedFaculty.length === 0
    ) {
      return res.status(400).json({
        message: "Resume ID and selected faculty array are required",
      });
    }

    // Get resume data
    const resume = await Resume.findById(resumeId);
    if (!resume) {
      return res.status(404).json({ message: "Resume not found" });
    }

    // Generate emails for each faculty member
    const emails = [];
    for (const faculty of selectedFaculty) {
      try {
        const emailContent = await generateBetterEmail(faculty, resume);
        emails.push({
          faculty,
          subject: emailContent.subject,
          content: emailContent.body,
        });
      } catch (error) {
        console.error(`Error generating email for ${faculty.name}:`, error);
        // Continue with other faculty members even if one fails
      }
    }

    if (emails.length === 0) {
      return res.status(500).json({
        message: "Failed to generate any email previews",
      });
    }

    res.json({ emails });
  } catch (error) {
    console.error("Error generating email previews:", error);
    res.status(500).json({
      message: "Error generating email previews",
      error: error.message,
    });
  }
});

// Protect all routes
router.use(authenticateToken);

// Helper function to wait between email sends
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Route to search for faculty and generate emails.
 * Three steps:
 * 1. Find matching faculty based on domains
 * 2. Generate personalized emails with LLM
 * 3. Send emails and save to database
 */
router.post("/search-and-email", async (req, res) => {
  try {
    const { domains } = req.body;

    if (!Array.isArray(domains) || domains.length === 0) {
      return res
        .status(400)
        .json({ message: "Valid domains array is required" });
    }

    // Search for faculty
    const facultyList = await searchFaculty(domains);

    if (!facultyList?.length) {
      return res.status(404).json({
        message: "No matching faculty found for your profile",
      });
    }

    // Save faculty to database for future use
    await saveFacultyToDatabase(facultyList);

    res.status(200).json({ facultyList });
  } catch (error) {
    console.error("Error in search-and-email:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Send emails to selected faculty members with rate limiting
router.post("/send-faculty-emails", async (req, res) => {
  try {
    const { resumeId, selectedFaculty } = req.body;

    if (
      !resumeId ||
      !Array.isArray(selectedFaculty) ||
      selectedFaculty.length === 0
    ) {
      return res
        .status(400)
        .json({ message: "Resume ID and selected faculty are required" });
    }

    // Find resume with user data
    const resume = await Resume.findById(resumeId).populate("user");
    if (!resume) {
      return res.status(404).json({ message: "Resume not found" });
    }

    const results = [];
    const failedEmails = [];

    // Process emails with rate limiting
    for (const faculty of selectedFaculty) {
      try {
        // Generate personalized email content
        const emailContent = await generateBetterEmail(faculty, resume);

        // Create email document
        const email = new Email({
          user: resume.user._id,
          resume: resume._id,
          company: faculty.institution?.name || "Unknown Institution",
          recipient: faculty.email,
          role: `${faculty.department || "Research"} Faculty`,
          subject:
            emailContent.subject ||
            `Research Collaboration Interest - ${resume.user.name}`,
          body: emailContent.body,
          status: "draft",
          companyResearch: {
            overview: faculty.researchInterests?.join(", "),
          },
          matchReason: "Research interests alignment",
          retryCount: 0, // Track retry attempts
        });

        // Save email first as draft
        await email.save();

        try {
          // Attempt to send email
          await sendEmail({
            to: faculty.email,
            subject: email.subject,
            text: email.body,
            replyTo: resume.user.email,
          });

          // Update email status on success
          email.status = "sent";
          email.sentAt = new Date();
          await email.save();

          results.push({
            success: true,
            emailId: email._id,
            recipient: faculty.email,
            facultyName: faculty.name,
          });
        } catch (sendError) {
          console.error(`Error sending email to ${faculty.email}:`, sendError);

          // Update email status on failure
          email.status = "failed";
          email.lastError = sendError.message;
          await email.save();

          failedEmails.push({
            success: false,
            emailId: email._id,
            recipient: faculty.email,
            facultyName: faculty.name,
            error: sendError.message,
          });
        }

        // Rate limit: wait between sends
        await delay(1000); // 1 second delay between emails
      } catch (error) {
        console.error(
          `Error processing faculty member ${faculty.name}:`,
          error
        );
        failedEmails.push({
          success: false,
          recipient: faculty.email,
          facultyName: faculty.name,
          error: error.message,
        });
      }
    }

    // Return appropriate response based on results
    if (failedEmails.length > 0) {
      if (results.length === 0) {
        // All emails failed
        return res.status(500).json({
          message: "Failed to send all emails",
          results: failedEmails,
        });
      } else {
        // Some emails failed
        return res.status(207).json({
          message: "Some emails failed to send",
          results: [...results, ...failedEmails],
          summary: {
            total: selectedFaculty.length,
            sent: results.length,
            failed: failedEmails.length,
          },
        });
      }
    }

    // All emails sent successfully
    return res.status(200).json({
      message: "All emails sent successfully",
      results,
      summary: {
        total: selectedFaculty.length,
        sent: results.length,
        failed: 0,
      },
    });
  } catch (error) {
    console.error("Error sending faculty emails:", error);
    res.status(500).json({
      message: "Server error processing emails",
      error: error.message,
    });
  }
});

// Extra findings route
router.post("/extra-findings", async (req, res) => {
  try {
    const { domains } = req.body;

    if (!Array.isArray(domains) || domains.length === 0) {
      return res
        .status(400)
        .json({ message: "Valid domains array is required" });
    }

    // Search for faculty
    const facultyList = await searchFaculty(domains);

    // Filter faculty based on allied interests
    const alliedInterests = [
      "robotics",
      "drones",
      "UAVs",
      "control systems",
      "mechatronics",
      "AI",
      "machine learning",
      "deep learning",
      "computer vision",
      "autonomous systems",
      "embedded systems",
      "IoT",
    ];

    const filteredFaculty = facultyList.filter((faculty) =>
      faculty.researchInterests.some((interest) =>
        alliedInterests.some((allied) =>
          interest.toLowerCase().includes(allied.toLowerCase())
        )
      )
    );

    res.status(200).json({ facultyList: filteredFaculty });
  } catch (error) {
    console.error("Error getting extra findings:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

/**
 * Generate email previews for selected faculty
 */
router.post("/generate-preview-emails", async (req, res) => {
  try {
    const { resumeId, selectedFaculty } = req.body;

    if (
      !resumeId ||
      !Array.isArray(selectedFaculty) ||
      selectedFaculty.length === 0
    ) {
      return res.status(400).json({
        message: "Resume ID and selected faculty array are required",
      });
    }

    // Get resume data
    const resume = await Resume.findById(resumeId);
    if (!resume) {
      return res.status(404).json({ message: "Resume not found" });
    }

    // Generate emails for each faculty member
    const emails = [];
    for (const faculty of selectedFaculty) {
      try {
        const emailContent = await generateBetterEmail(faculty, resume);
        emails.push({
          faculty,
          subject: emailContent.subject,
          content: emailContent.body,
        });
      } catch (error) {
        console.error(`Error generating email for ${faculty.name}:`, error);
        // Continue with other faculty members even if one fails
      }
    }

    if (emails.length === 0) {
      return res.status(500).json({
        message: "Failed to generate any email previews",
      });
    }

    res.json({ emails });
  } catch (error) {
    console.error("Error generating email previews:", error);
    res.status(500).json({
      message: "Error generating email previews",
      error: error.message,
    });
  }
});

export default router;
