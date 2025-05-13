import express from 'express';
import Email from '../models/Email.js';
import Resume from '../models/Resume.js';
import { generateEmailContent, findCompaniesForSkills } from '../services/aiService.js';
import { sendEmail } from '../services/emailService.js';

const router = express.Router();

// Generate cold emails
router.post('/generate', async (req, res) => {
  try {
    const { resumeId } = req.body;
    
    if (!resumeId) {
      return res.status(400).json({ message: 'Resume ID is required' });
    }
    
    // Find resume
    const resume = await Resume.findById(resumeId).populate('user');
    
    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }
    
    // Find companies matching the resume skills
    const companies = await findCompaniesForSkills(resume.skills);
    
    // Generate and save emails
    const emailPromises = companies.map(async (company) => {
      // Generate personalized email content
      const emailContent = await generateEmailContent({
        userName: resume.user.name,
        userEmail: resume.user.email,
        company: company.name,
        skills: resume.skills,
        experience: resume.experience,
        projects: resume.projects,
        role: company.role || 'internship'
      });
      
      // Create new email
      const email = new Email({
        user: resume.user._id,
        resume: resume._id,
        company: company.name,
        recipient: company.email,
        subject: emailContent.subject,
        body: emailContent.body,
        status: 'draft'
      });
      
      return email.save();
    });
    
    const savedEmails = await Promise.all(emailPromises);
    
    res.status(200).json(savedEmails);
  } catch (error) {
    console.error('Error generating emails:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Send emails
router.post('/send', async (req, res) => {
  try {
    const { emailIds } = req.body;
    
    if (!emailIds || !Array.isArray(emailIds) || emailIds.length === 0) {
      return res.status(400).json({ message: 'Email IDs are required' });
    }
    
    // Find emails
    const emails = await Email.find({ _id: { $in: emailIds } }).populate('user resume');
    
    if (emails.length === 0) {
      return res.status(404).json({ message: 'No emails found' });
    }
    
    // Send emails
    const results = await Promise.all(
      emails.map(async (email) => {
        try {
          await sendEmail({
            to: email.recipient,
            from: email.user.email,
            subject: email.subject,
            text: email.body,
            userName: email.user.name
          });
          
          // Update email status
          email.status = 'sent';
          email.sentAt = new Date();
          await email.save();
          
          return { id: email._id, success: true };
        } catch (error) {
          console.error(`Error sending email ${email._id}:`, error);
          
          // Update email status
          email.status = 'failed';
          await email.save();
          
          return { id: email._id, success: false, error: error.message };
        }
      })
    );
    
    const successCount = results.filter(result => result.success).length;
    
    res.status(200).json({
      message: `${successCount} out of ${emails.length} emails sent successfully`,
      sent: successCount,
      total: emails.length,
      results
    });
  } catch (error) {
    console.error('Error sending emails:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get emails by resume ID
router.get('/resume/:resumeId', async (req, res) => {
  try {
    const emails = await Email.find({ resume: req.params.resumeId }).sort({ createdAt: -1 });
    res.status(200).json(emails);
  } catch (error) {
    console.error('Error fetching emails by resume ID:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get emails by user ID
router.get('/user/:userId', async (req, res) => {
  try {
    const emails = await Email.find({ user: req.params.userId }).sort({ createdAt: -1 });
    res.status(200).json(emails);
  } catch (error) {
    console.error('Error fetching emails by user ID:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get email by ID
router.get('/:id', async (req, res) => {
  try {
    const email = await Email.findById(req.params.id).populate('user resume');
    
    if (!email) {
      return res.status(404).json({ message: 'Email not found' });
    }
    
    res.status(200).json(email);
  } catch (error) {
    console.error('Error fetching email:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;