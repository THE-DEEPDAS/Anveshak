import { GoogleGenerativeAI } from "@google/generative-ai";

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
      Extract technical skills from the following resume text.
      - Look for sections labeled "Skills", "Technical Skills", "Technologies", etc.
      - For sections with bullet points or comma-separated lists, extract those directly
      - For skills written in sentences, extract individual technical terms
      - Remove common words and focus on technical terms, tools, frameworks, and languages
      - Return ONLY an array of strings with no other text or explanation
      
      Resume text:
      ${text}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();

    // Parse response as JSON array
    let skills;
    try {
      // Clean the text to make it a valid array
      const cleanedText = responseText.replace(/```json|```|\[|\]/g, "").trim();
      const itemsText = `[${cleanedText}]`;
      skills = JSON.parse(itemsText);
    } catch (parseError) {
      // Enhanced fallback parsing
      skills = responseText
        .split(/[,\n]/) // Split by commas or newlines
        .map((skill) =>
          skill
            .replace(/[^\w\s-+#]/g, "") // Remove special chars except -, +, #
            .trim()
        )
        .filter(
          (skill) =>
            skill &&
            skill.length >= 2 && // Must be at least 2 chars
            !/^(and|or|in|with|using|including)$/i.test(skill) // Filter common connecting words
        );
    }

    // Remove duplicates and empty values
    return [...new Set(skills.filter(Boolean))];
  } catch (error) {
    console.error("Error extracting skills with AI:", error);
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
      const cleanedText = responseText.replace(/```json|```|\[|\]/g, "").trim();
      const itemsText = `[${cleanedText}]`;
      experience = JSON.parse(itemsText);
    } catch (parseError) {
      // Fallback to line splitting
      experience = responseText
        .split("\n")
        .filter(Boolean)
        .map((item) => item.trim());
    }

    return experience.filter(Boolean);
  } catch (error) {
    console.error("Error extracting experience with AI:", error);
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
      const cleanedText = responseText.replace(/```json|```|\[|\]/g, "").trim();
      const itemsText = `[${cleanedText}]`;
      projects = JSON.parse(itemsText);
    } catch (parseError) {
      // Fallback to line splitting
      projects = responseText
        .split("\n")
        .filter(Boolean)
        .map((item) => item.trim());
    }

    return projects.filter(Boolean);
  } catch (error) {
    console.error("Error extracting projects with AI:", error);
    return getMockProjects();
  }
};

// Direct AI parsing of resume text
export const parseResumeWithAI = async (text) => {
  if (!genAI)
    return {
      skills: getMockSkills(),
      experience: getMockExperience(),
      projects: getMockProjects(),
    };

  try {
    const model = getModel();
    const prompt = `
      You are an expert resume parser. Parse this resume text and extract the following information accurately:

      1.  **Technical Skills**: Identify and list all technical skills. This includes programming languages (e.g., Python, Java, JavaScript), frameworks (e.g., React, Angular, Node.js), databases (e.g., SQL, MongoDB), tools (e.g., Git, Docker, Jenkins), cloud platforms (e.g., AWS, Azure, GCP), operating systems, and other relevant technologies. Extract skills even if mentioned within descriptive sentences.
      2.  **Work Experience**: Extract all work experiences. For each experience, include the job title/role, company name, employment dates (if available), and a summary of key responsibilities, achievements, or technologies used. If dates are not explicitly stated, note that. If a section is titled "Internships" or "Training", treat entries within as experiences.
      3.  **Projects**: Extract all academic, personal, or professional projects. For each project, include the project name or a descriptive title, and a summary of its purpose, key features, or technologies used. If experience entries seem more like projects (e.g., "Developed a mobile app for X"), classify them as projects if they don't fit a formal work experience structure.

      Important parsing rules:
      -   Focus on extracting factual information for skills, experience, and projects.
      -   For Skills: Extract individual skills/technologies. "Experience with Python and Django" should yield "Python" and "Django".
      -   For Experience: Clearly separate distinct roles or internships.
      -   For Projects: Clearly separate distinct projects.
      -   Handle various resume formats, including those with unconventional section titles or less structured text.
      -   Preserve technical terms exactly as written.
      -   Remove any redundant or duplicate information within each category.
      -   If a section is missing (e.g., no explicit "Projects" section), return an empty array for that field.

      Resume text:
      ${text}

      Return ONLY a JSON object with this exact structure (no other text or explanations):
      {
        "skills": ["skill1", "skill2", ...],
        "experience": ["description of experience 1 (e.g., Role at Company, Dates: Summary)", "description of experience 2", ...],
        "projects": ["description of project 1 (e.g., Project Name: Summary)", "description of project 2", ...]
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();

    try {
      // Try to parse the JSON response
      const cleanedResponse = responseText
        .replace(/```json\n?|\n?```/g, "") // Remove markdown code blocks
        .trim();

      const parsed = JSON.parse(cleanedResponse);

      return {
        skills: Array.isArray(parsed.skills) ? parsed.skills : [],
        experience: Array.isArray(parsed.experience) ? parsed.experience : [],
        projects: Array.isArray(parsed.projects) ? parsed.projects : [],
      };
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError);
      // Fallback to individual section parsing
      const [skills, experience, projects] = await Promise.all([
        getSkillsFromText(text),
        getExperienceFromText(text),
        getProjectsFromText(text),
      ]);

      return { skills, experience, projects };
    }
  } catch (error) {
    console.error("Error using AI for resume parsing:", error);
    return {
      skills: getMockSkills(),
      experience: getMockExperience(),
      projects: getMockProjects(),
    };
  }
};

// Research company information
export const researchCompany = async (companyName) => {
  if (!genAI) return getMockCompanyResearch(companyName);

  try {
    const model = getModel();
    const prompt = `
      Research the company "${companyName}" and provide the following information:
      1. Brief company overview
      2. Notable achievements and milestones
      3. Company culture and values
      4. Current projects or products
      5. Tech stack or technologies used (if available)
      
      Return as a JSON object with properties: overview, achievements, culture, projects, techStack
      Keep it concise but informative.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();

    let companyInfo;
    try {
      const jsonMatch =
        responseText.match(/```json\n([\s\S]*)\n```/) ||
        responseText.match(/```\n([\s\S]*)\n```/);

      if (jsonMatch && jsonMatch[1]) {
        companyInfo = JSON.parse(jsonMatch[1]);
      } else {
        companyInfo = JSON.parse(responseText);
      }
    } catch (parseError) {
      console.error("Error parsing company research:", parseError);
      return getMockCompanyResearch(companyName);
    }

    return companyInfo;
  } catch (error) {
    console.error("Error researching company:", error);
    return getMockCompanyResearch(companyName);
  }
};

// Enhanced company search with role matching
export const findCompaniesForSkills = async (
  skills = [],
  experience = [],
  projects = []
) => {
  if (!genAI) return getMockCompanies();

  try {
    const model = getModel();

    // Combine skills and experience into a profile
    const profile = {
      skills: skills.join(", "),
      experience: experience.join("\n"),
      projects: projects.join("\n"),
    };

    const prompt = `Find matching companies for a candidate with the following profile:
      ${profile.skills ? `Skills: ${profile.skills}` : ""}
      ${profile.experience ? `Experience:\n${profile.experience}` : ""}
      ${profile.projects ? `Projects:\n${profile.projects}` : ""}
      
      Return a list of companies that would be a good fit based on their tech stack, projects, and culture.
      Each company should include:
      - name: Company name
      - email: HR or recruiting email
      - role: Suitable role for the candidate
      - matchReason: Why this company is a good match
      
      Return as JSON array.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();

    try {
      const jsonMatch =
        responseText.match(/```json\n([\s\S]*)\n```/) ||
        responseText.match(/```\n([\s\S]*)\n```/);
      if (jsonMatch && jsonMatch[1]) {
        return JSON.parse(jsonMatch[1]);
      }
      return JSON.parse(responseText);
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError);
      return getMockCompanies();
    }
  } catch (error) {
    console.error("Error finding companies:", error);
    return getMockCompanies();
  }
};

// Enhanced email content generation
export const generateEmailContent = async ({
  userName,
  userEmail,
  company,
  skills,
  experience,
  projects,
  role,
  companyResearch,
}) => {
  if (!genAI) return getMockEmailContent(company, role);

  try {
    const model = getModel();
    const skillsStr = skills.join(", ");
    const experienceStr = experience.join("\n");
    const projectsStr = projects.join("\n");

    const prompt = `
      Write a personalized cold email for ${userName} (${userEmail}) to send to ${company} for a ${role} position.
      
      About ${userName}:
      - Skills: ${skillsStr}
      - Experience: ${experienceStr}
      - Projects: ${projectsStr}
      
      Company Research:
      - Overview: ${companyResearch.overview}
      - Achievements: ${companyResearch.achievements}
      - Culture: ${companyResearch.culture}
      - Projects: ${companyResearch.projects}
      - Tech Stack: ${companyResearch.techStack}
      
      Guidelines:
      1. Start by mentioning a specific achievement or project of ${company} to show research
      2. Reference how their tech stack aligns with your skills
      3. Describe a specific project you've done that's relevant to their work
      4. Connect your experience to their company culture
      5. Express genuine interest in their current projects
      6. End with a clear call to action
      7. Keep it under 250 words
      8. Make the subject line specific and attention-grabbing
      
      Return as JSON with properties: subject, body
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();

    let emailContent;
    try {
      const jsonMatch =
        responseText.match(/```json\n([\s\S]*)\n```/) ||
        responseText.match(/```\n([\s\S]*)\n```/);

      if (jsonMatch && jsonMatch[1]) {
        emailContent = JSON.parse(jsonMatch[1]);
      } else {
        emailContent = JSON.parse(responseText);
      }

      return {
        subject: emailContent.subject,
        body: emailContent.body,
      };
    } catch (parseError) {
      console.error("Error parsing AI email response:", parseError);
      return getMockEmailContent(company, role);
    }
  } catch (error) {
    console.error("Error generating email:", error);
    return getMockEmailContent(company, role);
  }
};

// Mock data functions for development
const getMockSkills = () => {
  return [
    "JavaScript",
    "React",
    "Node.js",
    "MongoDB",
    "Express",
    "TypeScript",
    "Git",
    "HTML",
    "CSS",
  ];
};

const getMockExperience = () => {
  return [
    "Frontend Developer Intern at TechCorp - Developed responsive web applications using React and TypeScript",
    "Web Developer at University Project - Built a full-stack e-commerce platform with MERN stack",
    "Personal Project - Created a task management app with real-time updates using Socket.io",
  ];
};

const getMockProjects = () => {
  return [
    "E-commerce Platform - Built with MERN stack featuring user authentication, product search, and payment integration",
    "Task Management App - React Native mobile app with offline capabilities and cloud sync",
    "Portfolio Website - Responsive personal website showcasing projects and skills",
  ];
};

const getMockCompanies = () => {
  return [
    {
      name: "Tech Innovations Inc.",
      email: "hiring@techinnovations.com",
      role: "Frontend Developer Intern",
    },
    {
      name: "Data Systems Co.",
      email: "careers@datasystems.com",
      role: "Junior Full Stack Developer",
    },
    {
      name: "Mobile Solutions Ltd.",
      email: "internships@mobilesolutions.com",
      role: "React Developer Intern",
    },
    {
      name: "Cloud Services Group",
      email: "jobs@cloudservicesgroup.com",
      role: "Web Development Intern",
    },
    {
      name: "Digital Products Agency",
      email: "talent@digitalproducts.com",
      role: "Frontend Engineering Intern",
    },
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
Test User`,
  };
};

const getMockCompanyResearch = (companyName) => {
  return {
    overview: `${companyName} is a leading technology company focused on innovative solutions`,
    achievements:
      "Successfully launched multiple products, grew user base by 200% in 2024",
    culture: "Values innovation, collaboration, and continuous learning",
    projects:
      "Currently developing AI-powered analytics platforms and mobile applications",
    techStack: "React, Node.js, MongoDB, TypeScript, AWS",
  };
};
