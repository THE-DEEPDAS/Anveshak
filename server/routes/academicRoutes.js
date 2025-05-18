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

// Protect all routes
router.use(authenticateToken);

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

// Send emails to selected faculty members
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

    const emailPromises = selectedFaculty.map(async (faculty) => {
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
        });

        // Save email
        await email.save();

        // Send email
        await sendEmail({
          to: faculty.email,
          subject: email.subject,
          text: email.body,
          replyTo: resume.user.email,
        });

        // Update email status
        email.status = "sent";
        email.sentAt = new Date();
        await email.save();

        return {
          success: true,
          emailId: email._id,
          recipient: faculty.email,
          facultyName: faculty.name,
        };
      } catch (error) {
        console.error(`Error sending email to ${faculty.email}:`, error);
        return {
          success: false,
          recipient: faculty.email,
          facultyName: faculty.name,
          error: error.message,
        };
      }
    });

    const results = await Promise.all(emailPromises);

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
  } catch (error) {
    console.error("Error sending faculty emails:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

/**
 * Route to generate personalized emails for selected faculty
 */
router.post("/generate", async (req, res) => {
  try {
    const { resumeId, facultyIds } = req.body;

    if (!resumeId || !Array.isArray(facultyIds) || facultyIds.length === 0) {
      return res
        .status(400)
        .json({ message: "Resume ID and faculty IDs are required" });
    }

    // Find resume
    const resume = await Resume.findById(resumeId);
    if (!resume) {
      return res.status(404).json({ message: "Resume not found" });
    }

    // Generate emails for each faculty member
    const emailPromises = facultyIds.map(async (facultyId) => {
      const faculty = await Faculty.findById(facultyId).populate("institution");

      if (!faculty) {
        throw new Error(`Faculty not found: ${facultyId}`);
      }

      // Generate email content with LLM
      const emailContent = await generateBetterEmail(faculty, resume);

      // Create new email document
      const email = new Email({
        user: resume.user,
        resume: resume._id,
        company: faculty.institution.name,
        recipient: faculty.email,
        role: "Research Internship",
        subject: emailContent.subject,
        body: emailContent.body,
        status: "draft",
        companyResearch: {
          overview: faculty.researchInterests.join(", "),
          projects: faculty.projects.join(", "),
          achievements: faculty.publications.join(", "),
        },
        matchReason: `Research interests align with your ${
          resume.skills.some((skill) =>
            faculty.researchInterests.some((interest) =>
              interest.toLowerCase().includes(skill.toLowerCase())
            )
          )
            ? "skills"
            : "experience"
        }`,
      });

      return email.save();
    });

    const savedEmails = await Promise.all(emailPromises);
    res.status(200).json({ emails: savedEmails });
  } catch (error) {
    console.error("Error generating academic emails:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

/**
 * Route to get extra findings based on domains.
 */
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
 * Route to handle sending emails to selected faculty members
 */
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

    const emailPromises = selectedFaculty.map(async (faculty) => {
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
        });

        // Save email
        await email.save();

        // Send email
        await sendEmail({
          to: faculty.email,
          subject: email.subject,
          text: email.body,
          replyTo: resume.user.email,
        });

        // Update email status
        email.status = "sent";
        email.sentAt = new Date();
        await email.save();

        return {
          success: true,
          emailId: email._id,
          recipient: faculty.email,
          facultyName: faculty.name,
        };
      } catch (error) {
        console.error(`Error sending email to ${faculty.email}:`, error);
        return {
          success: false,
          recipient: faculty.email,
          facultyName: faculty.name,
          error: error.message,
        };
      }
    });

    const results = await Promise.all(emailPromises);

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
  } catch (error) {
    console.error("Error sending faculty emails:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;
