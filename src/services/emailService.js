import axios from "axios";
import { API_ENDPOINTS } from "../config/api";

export const generateEmails = async (resumeId, options = {}) => {
  if (!resumeId) {
    throw new Error("Resume ID is required");
  }

  try {
    const response = await axios.post(`${API_ENDPOINTS.emails}/generate`, {
      resumeId: resumeId.toString(),
      ...options,
    });
    return response.data;
  } catch (error) {
    console.error("Error in email generation:", error);
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw error;
  }
};

export const sendEmails = async (emailIds) => {
  try {
    const response = await axios.post(`${API_ENDPOINTS.emails}/send`, {
      emailIds,
    });
    return response.data;
  } catch (error) {
    console.error("Error sending emails:", error);
    throw error;
  }
};

export const getEmailsByResumeId = async (resumeId) => {
  try {
    const response = await axios.get(
      `${API_ENDPOINTS.emails}/resume/${resumeId}`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching emails:", error);
    throw error;
  }
};

export const getEmailById = async (emailId) => {
  try {
    const response = await axios.get(`${API_ENDPOINTS.emails}/${emailId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching email:", error);
    throw error;
  }
};

export const getUserEmails = async (userId) => {
  try {
    const response = await axios.get(`${API_ENDPOINTS.emails}/user/${userId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching user emails:", error);
    throw error;
  }
};

// Mock function for development
export const getMockEmails = () => {
  return [
    {
      id: "email-1",
      company: "Tech Innovations Inc.",
      recipient: "hiring@techinnovations.com",
      subject: "Junior Developer Position - Experienced React Developer",
      body: `Dear Hiring Manager,

I was impressed by Tech Innovations' recent work on AI-powered analytics platforms, especially your commitment to user-centered design and performance optimization.

I'm a frontend developer with strong experience in React and TypeScript, which I see aligns well with your tech stack. During my internship at TechCorp, I helped develop responsive web applications that improved user engagement by 25%.

I'd love to contribute my skills to your team and am particularly interested in any internship opportunities you might have. I'm available for an interview at your convenience to discuss how my experience could benefit Tech Innovations.

Thank you for your consideration.

Best regards,
Test User`,
      status: "draft",
    },
    {
      id: "email-2",
      company: "Data Systems Co.",
      recipient: "careers@datasystems.com",
      subject: "Full Stack Developer Position Inquiry",
      body: `Dear Hiring Team,

I've been following Data Systems' groundbreaking work in cloud infrastructure and was particularly impressed by your recent case study on scalable database solutions.

As a full-stack developer with experience in the MERN stack, I believe my skills align well with your technical requirements. I recently built an e-commerce platform featuring user authentication, product search, and payment integration, which gave me hands-on experience with many of the technologies you use.

I'm eager to explore internship opportunities at Data Systems where I can contribute to your innovative projects while further developing my skills.

Looking forward to discussing how I can contribute to your team.

Best regards,
Test User`,
      status: "draft",
    },
    {
      id: "email-3",
      company: "Mobile Solutions Ltd.",
      recipient: "internships@mobilesolutions.com",
      subject: "Mobile Developer Internship Application",
      body: `Dear Internship Coordinator,

I recently used Mobile Solutions' travel app and was impressed by its intuitive interface and performance. Your commitment to creating seamless mobile experiences aligns perfectly with my development philosophy.

I've developed a React Native task management app with offline capabilities and cloud sync as part of my portfolio. This project helped me gain experience in mobile development principles like state management and responsive design.

I'm very interested in your summer internship program and would appreciate the opportunity to learn from your experienced team while contributing my skills to your mobile projects.

Thank you for considering my application.

Best regards,
Test User`,
      status: "draft",
    },
  ];
};
