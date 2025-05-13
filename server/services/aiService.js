import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini API
const genAI = process.env.GEMINI_API_KEY 
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

// Main model - use Gemini 1.5 Flash when available
const getModel = () => {
  if (!genAI) return null;
  return genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
};

// Extract skills from resume text
export const getSkillsFromText = async (text) => {
  if (!genAI) return getMockSkills();
  
  try {
    const model = getModel();
    const prompt = `
      Extract a list of technical skills from the following resume text. 
      Return ONLY an array of strings with no other text or explanation.
      Resume: ${text}
    `;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();
    
    // Parse response as JSON array
    let skills;
    try {
      // Clean the text to make it a valid array
      const cleanedText = responseText.replace(/```json|```|\[|\]/g, '').trim();
      const itemsText = `[${cleanedText}]`;
      skills = JSON.parse(itemsText);
    } catch (parseError) {
      // Fallback to simple string splitting
      skills = responseText.split(',').map(skill => skill.trim());
    }
    
    return skills.filter(Boolean);
  } catch (error) {
    console.error('Error extracting skills with AI:', error);
    return getMockSkills();
  }
};

// Extract experience from resume text
export const getExperienceFromText = async (text) => {
  if (!genAI) return getMockExperience();
  
  try {
    const model = getModel();
    const prompt = `
      Extract work and relevant experience items from the following resume text.
      Return ONLY an array of strings with no other text or explanation.
      Each string should be a concise summary of one experience item.
      Keep each item under 100 characters.
      Resume: ${text}
    `;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();
    
    // Parse response
    let experience;
    try {
      // Clean the text to make it a valid array
      const cleanedText = responseText.replace(/```json|```|\[|\]/g, '').trim();
      const itemsText = `[${cleanedText}]`;
      experience = JSON.parse(itemsText);
    } catch (parseError) {
      // Fallback to line splitting
      experience = responseText.split('\n').filter(Boolean).map(item => item.trim());
    }
    
    return experience.filter(Boolean);
  } catch (error) {
    console.error('Error extracting experience with AI:', error);
    return getMockExperience();
  }
};

// Extract projects from resume text
export const getProjectsFromText = async (text) => {
  if (!genAI) return getMockProjects();
  
  try {
    const model = getModel();
    const prompt = `
      Extract project details from the following resume text.
      Return ONLY an array of strings with no other text or explanation.
      Each string should be a concise summary of one project.
      Keep each project description under 100 characters.
      Resume: ${text}
    `;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();
    
    // Parse response
    let projects;
    try {
      // Clean the text to make it a valid array
      const cleanedText = responseText.replace(/```json|```|\[|\]/g, '').trim();
      const itemsText = `[${cleanedText}]`;
      projects = JSON.parse(itemsText);
    } catch (parseError) {
      // Fallback to line splitting
      projects = responseText.split('\n').filter(Boolean).map(item => item.trim());
    }
    
    return projects.filter(Boolean);
  } catch (error) {
    console.error('Error extracting projects with AI:', error);
    return getMockProjects();
  }
};

// Find relevant companies based on skills
export const findCompaniesForSkills = async (skills) => {
  if (!genAI) return getMockCompanies();
  
  try {
    const model = getModel();
    const skillsStr = skills.join(', ');
    
    const prompt = `
      Based on the following skills: ${skillsStr}
      
      Find 5 companies where a student with these skills might find an internship.
      For each company, provide:
      1. The company name
      2. A relevant email address (like hr@company.com)
      3. A specific internship role that matches these skills
      
      Return the results as a JSON array of objects with properties: name, email, role
      Do not include any other text or explanation.
    `;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();
    
    // Extract and parse JSON
    let companies;
    try {
      // Try to extract JSON from markdown code block
      const jsonMatch = responseText.match(/```json\n([\s\S]*)\n```/) || 
                        responseText.match(/```\n([\s\S]*)\n```/);
      
      if (jsonMatch && jsonMatch[1]) {
        companies = JSON.parse(jsonMatch[1]);
      } else {
        // Try to parse the entire response as JSON
        companies = JSON.parse(responseText);
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      return getMockCompanies();
    }
    
    return companies;
  } catch (error) {
    console.error('Error finding companies with AI:', error);
    return getMockCompanies();
  }
};

// Generate email content
export const generateEmailContent = async ({ 
  userName, 
  userEmail, 
  company, 
  skills, 
  experience, 
  projects, 
  role 
}) => {
  if (!genAI) return getMockEmailContent(company, role);
  
  try {
    const model = getModel();
    const skillsStr = skills.join(', ');
    const experienceStr = experience.join('\n');
    const projectsStr = projects.join('\n');
    
    const prompt = `
      Write a personalized cold email for ${userName} (${userEmail}) to send to ${company} for a ${role} position.
      
      About ${userName}:
      - Skills: ${skillsStr}
      - Experience: ${experienceStr}
      - Projects: ${projectsStr}
      
      Guidelines for the email:
      - Start with a brief mention of something specific about ${company} to show research
      - Highlight 2-3 most relevant skills and experiences for this company
      - Express interest in the ${role} role
      - Keep it under 250 words
      - End with a call to action
      - Make the subject line attention-grabbing
      
      Return the result as a JSON object with properties: subject, body
    `;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();
    
    // Extract and parse JSON
    let emailContent;
    try {
      // Try to extract JSON from markdown code block
      const jsonMatch = responseText.match(/```json\n([\s\S]*)\n```/) || 
                        responseText.match(/```\n([\s\S]*)\n```/);
      
      if (jsonMatch && jsonMatch[1]) {
        emailContent = JSON.parse(jsonMatch[1]);
      } else {
        // Try to parse the entire response as JSON
        emailContent = JSON.parse(responseText);
      }
      
      return {
        subject: emailContent.subject,
        body: emailContent.body
      };
    } catch (parseError) {
      console.error('Error parsing AI email response:', parseError);
      return getMockEmailContent(company, role);
    }
  } catch (error) {
    console.error('Error generating email with AI:', error);
    return getMockEmailContent(company, role);
  }
};

// Mock data functions for development
const getMockSkills = () => {
  return ['JavaScript', 'React', 'Node.js', 'MongoDB', 'Express', 'TypeScript', 'Git', 'HTML', 'CSS'];
};

const getMockExperience = () => {
  return [
    'Frontend Developer Intern at TechCorp - Developed responsive web applications using React and TypeScript',
    'Web Developer at University Project - Built a full-stack e-commerce platform with MERN stack',
    'Personal Project - Created a task management app with real-time updates using Socket.io'
  ];
};

const getMockProjects = () => {
  return [
    'E-commerce Platform - Built with MERN stack featuring user authentication, product search, and payment integration',
    'Task Management App - React Native mobile app with offline capabilities and cloud sync',
    'Portfolio Website - Responsive personal website showcasing projects and skills'
  ];
};

const getMockCompanies = () => {
  return [
    { name: 'Tech Innovations Inc.', email: 'hiring@techinnovations.com', role: 'Frontend Developer Intern' },
    { name: 'Data Systems Co.', email: 'careers@datasystems.com', role: 'Junior Full Stack Developer' },
    { name: 'Mobile Solutions Ltd.', email: 'internships@mobilesolutions.com', role: 'React Developer Intern' },
    { name: 'Cloud Services Group', email: 'jobs@cloudservicesgroup.com', role: 'Web Development Intern' },
    { name: 'Digital Products Agency', email: 'talent@digitalproducts.com', role: 'Frontend Engineering Intern' }
  ];
};

const getMockEmailContent = (company, role) => {
  return {
    subject: `${role} Position Inquiry - Passionate Developer with MERN Stack Experience`,
    body: `Dear Hiring Manager at ${company},

I recently came across ${company}'s innovative work in the tech industry and was particularly impressed by your commitment to creating user-friendly solutions with cutting-edge technology.

As a full-stack developer with experience in the MERN stack, I believe my skills would be valuable to your team. During my previous internship, I developed responsive web applications using React and TypeScript that improved user engagement by 25%. Additionally, I built an e-commerce platform featuring user authentication, product search, and payment integration.

I'm very interested in the ${role} position at ${company} and would love the opportunity to contribute to your projects while further developing my skills. I'm particularly drawn to your company's focus on [specific company value or project].

Would it be possible to discuss how my experience might benefit your team? I'm available for an interview at your convenience.

Thank you for considering my application.

Best regards,
Test User`
  };
};