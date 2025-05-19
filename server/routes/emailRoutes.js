import express from "express";
import Email from "../models/Email.js";
import Resume from "../models/Resume.js";
import Faculty from "../models/Faculty.js";
import Company from "../models/Company.js";
import {
  generateEmailContent,
  findCompaniesForSkills,
  researchCompany,
} from "../services/aiService.js";
import {
  searchCompanies,
  generateCompanyEmail,
} from "../services/companyEmailService.js";
import { generateAcademicEmail } from "../services/academicEmailService.js";
import { sendEmail } from "../services/emailService.js";

// Helper function to escape special regex characters
const escapeRegExp = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

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

    // Validate resume has required data - either skills or experience
    if (!resume.skills?.length && !resume.experience?.length) {
      return res.status(400).json({
        message:
          "Resume must have either skills or experience to generate emails",
      });
    }
    switch (action) {
      case "find-companies": // First try finding companies from our database
        const defaultRole = req.body.role || "Software Engineer";
        let matchingCompanies = await Company.find({
          $or: [
            { roles: { $in: [defaultRole] } },
            {
              "research.techStack": {
                $in: resume.skills.map(
                  (skill) => new RegExp(escapeRegExp(skill), "i")
                ),
              },
            },
          ],
        })
          .sort({ lastUpdated: -1 })
          .limit(5)
          .lean() // Convert to plain objects
          .then((companies) =>
            companies.map((company) => ({
              ...company,
              role: defaultRole,
              email:
                company.email ||
                `careers@${company.name
                  .toLowerCase()
                  .replace(/[^a-z0-9]/g, "")}.com`,
            }))
          );

        // If not enough results, use LLM to find more
        if (matchingCompanies.length < 5) {
          // Search for new companies using LLM
          const newCompanies = await searchCompanies(
            resume.skills || [],
            defaultRole
          ).then((companies) =>
            companies.map((company) => ({
              ...company,
              role: company.role || defaultRole,
              email:
                company.email ||
                `careers@${company.name
                  .toLowerCase()
                  .replace(/[^a-z0-9]/g, "")}.com`,
            }))
          );

          // Merge results, prioritizing DB results
          const existingNames = new Set(
            matchingCompanies.map((c) => c.name.toLowerCase())
          );
          const uniqueNewCompanies = newCompanies.filter(
            (c) => !existingNames.has(c.name.toLowerCase())
          );

          matchingCompanies = [
            ...matchingCompanies,
            ...uniqueNewCompanies,
          ].slice(0, 10);
        }

        if (!matchingCompanies?.length) {
          return res.status(404).json({
            message: "No matching companies found for your profile",
          });
        }

        // Enrich results with researched data          // Validate and enrich companies with research data
        const enrichedCompanies = (
          await Promise.all(
            matchingCompanies.map(async (company) => {
              try {
                if (!company.name) {
                  console.error("Invalid company without name:", company);
                  return null;
                }

                // Ensure basic company structure
                const baseCompany = {
                  name: company.name,
                  email:
                    company.email ||
                    `contact@${company.name
                      .toLowerCase()
                      .replace(/[^a-z0-9]/g, "")}.com`,
                  role:
                    company.role ||
                    company.openRoles?.[0]?.title ||
                    "Software Engineer",
                  technologiesUsed: company.technologiesUsed || [],
                  openRoles: company.openRoles || [],
                };

                // Get research data
                const research = await researchCompany(company.name);

                return {
                  ...baseCompany,
                  research: research || {},
                  matchReason: company.matchReason || "Skills match",
                };
              } catch (error) {
                console.error(
                  `Error processing company ${company.name}:`,
                  error
                );
                return null;
              }
            })
          )
        ).filter(Boolean); // Remove null entries

        return res.status(200).json({ companies: enrichedCompanies });
      case "generate-emails":
        if (!Array.isArray(companies) || companies.length === 0) {
          return res
            .status(400)
            .json({ message: "Selected companies are required" });
        } // Generate personalized emails for selected companies
        const emailPromises = companies.map(async (company) => {
          // Validate required company data
          const requiredFields = ["name", "email", "role"];
          const missingFields = requiredFields.filter(
            (field) => !company[field]
          );

          if (missingFields.length > 0) {
            console.error(
              `Invalid company data for ${
                company.name || "unknown company"
              }. Missing fields:`,
              missingFields
            );
            throw new Error(
              `Invalid company data: Missing ${missingFields.join(", ")}`
            );
          }

          // Normalize and validate email format
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(company.email)) {
            throw new Error(`Invalid email format for company ${company.name}`);
          }

          // Ensure we have research data for the company
          let companyWithResearch = { ...company };
          if (!company.research) {
            const research = await researchCompany(company.name);
            companyWithResearch.research = research;
          }

          // Save or update company in database
          await Company.findOneAndUpdate(
            { name: company.name },
            {
              name: company.name,
              email: company.email,
              roles: [company.role],
              research: companyWithResearch.research,
              lastResearched: new Date(),
              lastUpdated: new Date(),
            },
            { upsert: true }
          );

          // Generate personalized email using enhanced company context
          const emailContent = await generateEmailContent({
            userName: resume.user.name,
            userEmail: resume.user.email,
            company: companyWithResearch.name,
            role: companyWithResearch.role,
            skills: resume.skills || [],
            experience: resume.experience || [],
            projects: resume.projects || [],
            companyResearch: companyWithResearch.research,
          }); // Create new email document with normalized research data
          const normalizedResearch = {
            overview: company.research?.overview || "",
            achievements: Array.isArray(company.research?.achievements)
              ? company.research.achievements
              : [],
            culture: company.research?.culture || "",
            projects: Array.isArray(company.research?.projects)
              ? company.research.projects
              : [],
            techStack: {
              frontend: Array.isArray(company.research?.techStack?.frontend)
                ? company.research.techStack.frontend
                : [],
              backend: Array.isArray(company.research?.techStack?.backend)
                ? company.research.techStack.backend
                : [],
              devops: Array.isArray(company.research?.techStack?.devops)
                ? company.research.techStack.devops
                : [],
              other: Array.isArray(company.research?.techStack?.other)
                ? company.research.techStack.other
                : [],
            },
          };

          const email = new Email({
            user: resume.user._id,
            resume: resume._id,
            company: company.name,
            recipient: company.email,
            role: company.role,
            subject: emailContent.subject,
            body: emailContent.body,
            status: "draft",
            companyResearch: normalizedResearch,
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

// Generate preview emails
router.post("/generate-preview-emails", async (req, res) => {
  try {
    const { resumeId, selectedCompanies } = req.body;

    if (
      !resumeId ||
      !Array.isArray(selectedCompanies) ||
      selectedCompanies.length === 0
    ) {
      return res.status(400).json({ message: "Invalid input parameters" });
    }

    // Find resume with user data
    const resume = await Resume.findById(resumeId).populate("user");
    if (!resume) {
      return res.status(404).json({ message: "Resume not found" });
    } // Generate preview emails for each company
    const previewEmails = await Promise.all(
      selectedCompanies.map(async (company) => {
        try {
          // Ensure we have research data
          let companyWithResearch = company;
          if (!company.research) {
            const research = await researchCompany(company.name);
            companyWithResearch = { ...company, research };
          }

          // Ensure we have all necessary resume data
          if (!resume.user?.name || !resume.user?.email) {
            throw new Error("Resume user data is incomplete");
          }

          // Generate email with complete context
          const emailContent = await generateEmailContent({
            userName: resume.user.name,
            userEmail: resume.user.email,
            company: companyWithResearch.name,
            role: companyWithResearch.role,
            skills: resume.skills || [],
            experience: resume.experience || [],
            projects: resume.projects || [],
            companyResearch: companyWithResearch.research,
          });

          return {
            company: company.name,
            recipient: company.email,
            role: company.role,
            subject: emailContent.subject,
            body: emailContent.body,
            status: "draft",
            companyResearch: companyWithResearch.research,
            matchReason: company.matchReason,
          };
        } catch (error) {
          console.error(`Error generating preview for ${company.name}:`, error);
          return null;
        }
      })
    );

    // Filter out any failed generations
    const validEmails = previewEmails.filter((email) => email !== null);

    if (validEmails.length === 0) {
      return res
        .status(400)
        .json({ message: "Failed to generate preview emails" });
    }

    return res.status(200).json({ emails: validEmails });
  } catch (error) {
    console.error("Error generating preview emails:", error);
    return res.status(500).json({
      message: "Server error generating preview emails",
      error: error.message,
    });
  }
});

// Generate preview emails for academic faculty
router.post("/academic/generate-preview-emails", async (req, res) => {
  try {
    const { resumeId, facultyIds } = req.body;

    // Validate inputs
    if (!resumeId || !Array.isArray(facultyIds) || facultyIds.length === 0) {
      return res.status(400).json({
        message: "Valid Resume ID and faculty IDs array are required",
      });
    }

    // Find resume with user data
    const resume = await Resume.findById(resumeId).populate("user");
    if (!resume) {
      return res.status(404).json({ message: "Resume not found" });
    }

    // Find selected faculty members
    const faculty = await Faculty.find({
      _id: { $in: facultyIds },
    }).populate("institution");

    if (faculty.length === 0) {
      return res.status(404).json({ message: "No faculty members found" });
    }

    // Generate preview emails for each faculty member
    const previewEmails = await Promise.all(
      faculty.map(async (facultyMember) => {
        try {
          const emailContent = await generateAcademicEmail(
            facultyMember,
            resume
          );
          return {
            facultyId: facultyMember._id,
            facultyName: facultyMember.name,
            institution: facultyMember.institution.name,
            subject: emailContent.subject,
            body: emailContent.body,
          };
        } catch (error) {
          console.error(
            `Error generating email for faculty ${facultyMember.name}:`,
            error
          );
          return {
            facultyId: facultyMember._id,
            facultyName: facultyMember.name,
            error: "Failed to generate email",
          };
        }
      })
    );

    return res.status(200).json({ emails: previewEmails });
  } catch (error) {
    console.error("Error generating preview emails:", error);
    return res.status(500).json({ message: "Internal server error" });
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

// Edit email content
router.put("/:id/edit", async (req, res) => {
  try {
    const { id } = req.params;
    const { subject, body } = req.body;

    if (!subject || !body) {
      return res.status(400).json({ message: "Subject and body are required" });
    }

    const email = await Email.findById(id);
    if (!email) {
      return res.status(404).json({ message: "Email not found" });
    }

    // Only allow editing of draft emails
    if (email.status !== "draft") {
      return res
        .status(400)
        .json({ message: "Only draft emails can be edited" });
    }

    email.subject = subject;
    email.body = body;
    email.lastModified = new Date();

    const updatedEmail = await email.save();
    res.status(200).json(updatedEmail);
  } catch (error) {
    console.error("Error updating email:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Update email
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { subject, body } = req.body;

    if (!subject || !body) {
      return res.status(400).json({ message: "Subject and body are required" });
    }

    const email = await Email.findById(id);
    if (!email) {
      return res.status(404).json({ message: "Email not found" });
    }

    // Only allow editing drafts
    if (email.status !== "draft") {
      return res
        .status(400)
        .json({ message: "Only draft emails can be edited" });
    }

    email.subject = subject;
    email.body = body;
    email.updatedAt = new Date();

    await email.save();
    return res.status(200).json(email);
  } catch (error) {
    console.error("Error updating email:", error);
    return res.status(500).json({ message: "Error updating email" });
  }
});

export default router;
