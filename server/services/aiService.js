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
      Extract all technical skills from the following resume text.
      - Look for sections labeled "Skills", "Technical Skills", "Technologies", etc.
      - For sections with bullet points or comma-separated lists, extract those directly
      - For skills written in sentences, extract individual technical terms
      - Remove common words and focus on technical terms, tools, frameworks, and languages
      - Be thorough and extract ALL technical skills mentioned anywhere in the resume
      - Include programming languages, frameworks, libraries, tools, platforms, methodologies
      - Look in experience and project descriptions for mentioned technologies
      - Return ONLY an array of strings with no other text or explanation
      - Format each skill consistently (proper capitalization for acronyms like "HTML", "CSS")
      - For compound skills like "React.js", keep them as one skill
      
      Resume text:
      ${text}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();

    // Parse response as JSON array
    let skills;
    try {
      // Handle different JSON formatting in the response
      if (responseText.includes("[") && responseText.includes("]")) {
        // Extract the array part if it exists
        const arrayMatch = responseText.match(/\[([^\]]*)\]/);
        if (arrayMatch && arrayMatch[1]) {
          const cleanedText = arrayMatch[1].trim();
          const itemsText = `[${cleanedText}]`;
          skills = JSON.parse(itemsText);
        } else {
          // If we can't extract just the array part, try parsing the whole response
          skills = JSON.parse(responseText);
        }
      } else {
        // Clean the text to make it a valid array
        const cleanedText = responseText
          .replace(/```json|```|\[|\]/g, "")
          .trim();
        const itemsText = `[${cleanedText}]`;
        skills = JSON.parse(itemsText);
      }
    } catch (parseError) {
      console.log("Error parsing skills JSON:", parseError);

      // Enhanced fallback parsing
      skills = responseText
        .split(/[,\n]/) // Split by commas or newlines
        .map((skill) =>
          skill
            .replace(/[^\w\s-+#.]/g, "") // Remove special chars except -, +, #, .
            .trim()
        )
        .filter(
          (skill) =>
            skill &&
            skill.length >= 2 && // Must be at least 2 chars
            !/^(and|or|in|with|using|including|the|for|to)$/i.test(skill) // Filter common connecting words
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
      You are an expert resume parser with extensive knowledge of technical fields, job roles, and industries. Parse this resume text and extract the following information with maximum accuracy:

      1. **Technical Skills**: Identify and list ALL technical skills throughout the entire resume. This includes:
         - Programming languages (e.g., Python, Java, JavaScript, TypeScript, C++, C#, Ruby)
         - Frameworks & libraries (e.g., React, Angular, Vue, Django, Flask, Spring, Express)
         - Databases (e.g., SQL, MySQL, PostgreSQL, MongoDB, Redis, DynamoDB)
         - Cloud services (e.g., AWS, GCP, Azure, Firebase, Heroku, Netlify)
         - DevOps tools (e.g., Docker, Kubernetes, Jenkins, GitHub Actions, CircleCI)
         - Version control systems (e.g., Git, GitHub, GitLab, BitBucket)
         - Design tools (e.g., Figma, Adobe XD, Sketch, Photoshop)
         - Project management tools (e.g., Jira, Asana, Trello, Notion)
         - Methodologies (e.g., Agile, Scrum, Kanban, TDD, BDD)
         - Look for skills within experience descriptions and project details, not just skills sections
         - Extract skills even if briefly mentioned or part of a list
         - Look for domain-specific technologies and tools

      2. **Work Experience**: Extract ALL work experiences, including:
         - Role/title and company name as the first part of each entry
         - Employment dates (if available)
         - Concise summary of responsibilities, achievements, and technologies used
         - Include internships, part-time roles, freelance work, and volunteer positions
         - Separate each distinct role into its own entry
         - Keep entries concise but include key details about technologies used and accomplishments

      3. **Projects**: Extract ALL projects mentioned, including:
         - Project name/title as the first part of each entry
         - Brief description of purpose and functionality
         - Technologies, frameworks, and tools used
         - Key features implemented or challenges overcome
         - Include both personal and professional projects
         - Include academic projects if mentioned

      Critical parsing instructions:
      - Be extremely thorough in extracting ALL technical skills mentioned anywhere in the resume
      - For skills in experience descriptions, extract the specific technologies (e.g., "Built RESTful APIs using Node.js and Express" → extract "Node.js" and "Express")
      - Format all entries consistently and ensure they're readable
      - Preserve technical terms with their exact capitalization (e.g., "React", "TypeScript", "AWS")
      - If the resume is in a non-standard format, make your best effort to identify and categorize content
      - If you're uncertain about a section or entry, include it in the most appropriate category
      - For resumes with limited content, be extra thorough in extracting every possible skill
      - Keep experience and project descriptions under 250 characters each for readability
      - For any potentially valuable skills or experience, err on the side of including them
      - Ensure skills are properly separated (e.g., "React.js" is one skill, not "React" and "js")

      Resume text:
      ${text}

      Return ONLY a JSON object with this exact structure (no markdown, no explanations):
      {
        "skills": ["skill1", "skill2", ...],
        "experience": ["Role at Company, Dates: Brief description with responsibilities and technologies", ...],
        "projects": ["Project Name: Brief description with purpose and technologies used", ...]
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
      
      Return as a strict JSON array, example:
      [
        {
          "name": "Company Name",
          "email": "email@company.com",
          "role": "Position Title",
          "matchReason": "Reason for match"
        }
      ]`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();

    try {
      // First try to extract JSON from code blocks
      const jsonMatch = responseText.match(/```(?:json)?\n([\s\S]*?)\n```/);
      if (jsonMatch && jsonMatch[1]) {
        // Clean the extracted JSON string
        const cleanedJson = jsonMatch[1].trim();
        return JSON.parse(cleanedJson);
      }

      // If no code blocks, try parsing the raw response
      const cleanedResponse = responseText
        .replace(/^[^\[]*\[/, "[") // Remove any text before the first [
        .replace(/\][^\]]*$/, "]") // Remove any text after the last ]
        .trim();

      return JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError);
      // If parsing fails, return mock data
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
