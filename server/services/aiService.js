import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini API
export const genAI = process.env.GEMINI_API_KEY
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
      1. Brief company overview (focus on their technical products/services)
      2. Notable achievements and milestones (especially technical ones)
      3. Company culture and values (engineering culture emphasis)
      4. Current projects or products (technical details)
      5. Tech stack breakdown in these categories:
         - Frontend: frameworks, libraries, tools
         - Backend: languages, frameworks, databases
         - DevOps: cloud services, tools, practices
         - Other: domain-specific technologies
      
      Return a JSON object with these properties:
      {
        "overview": "Company technical overview",
        "achievements": "Notable technical achievements",
        "culture": "Engineering culture description",
        "projects": "Current technical projects",
        "techStack": {
          "frontend": ["tech1", "tech2"],
          "backend": ["tech1", "tech2"],
          "devops": ["tech1", "tech2"],
          "other": ["tech1", "tech2"]
        }
      }

      Keep responses factual and technically focused.
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
  skills = [],
  experience = [],
  projects = [],
  role = "position of interest",
  companyResearch = {
    overview: "",
    achievements: "",
    culture: "",
    projects: "",
    techStack: {},
  },
}) => {
  if (!genAI) return getMockEmailContent(company, role);
  try {
    const model = getModel();

    // Validate and normalize input arrays
    const skillsStr = Array.isArray(skills)
      ? skills.filter(Boolean).join(", ")
      : "";
    const experienceStr = Array.isArray(experience)
      ? experience.filter(Boolean).join("\n")
      : "";
    const projectsStr = Array.isArray(projects)
      ? projects.filter(Boolean).join("\n")
      : "";

    const prompt = `
      Write a highly personalized cold email for ${userName} to send to ${company} for a ${role} position.

      CANDIDATE BACKGROUND:
      Skills & Technologies:
      ${skillsStr}

      Experience Highlights:
      ${experienceStr}

      Relevant Projects:
      ${projectsStr}

      COMPANY RESEARCH:
      Company Overview: ${companyResearch.overview}
      Recent Achievements: ${companyResearch.achievements}
      Company Culture: ${companyResearch.culture}
      Current Projects: ${companyResearch.projects}
      Tech Stack: ${JSON.stringify(companyResearch.techStack)}

      EMAIL REQUIREMENTS:
      1. Subject Line:
         - Be specific and attention-grabbing
         - Reference the role and a key skill match
         - Keep it under 60 characters

      2. Email Structure:
         a) Opening (2-3 sentences):
            - Reference a specific company achievement or project
            - Show understanding of their work
            - Connect it to your interest in the role

         b) Skills Match (1-2 paragraphs):
            - Highlight 2-3 most relevant skills
            - Connect your experience to their tech stack
            - Give specific examples from your projects
            - Use metrics and results where possible

         c) Culture & Values (1 paragraph):
            - Connect your experience to their company culture
            - Show alignment with their values
            - Reference their current projects

         d) Call to Action:
            - Request a specific next step
            - Offer to provide more information
            - Thank them for their time

      3. Tone & Style:
         - Professional but conversational
         - Show enthusiasm without being over-eager
         - Be confident but humble
         - Focus on what you can contribute

      FORMAT:
      Return a JSON object with "subject" and "body". Make sure the body uses proper paragraphs and line breaks.
      
      VALIDATION:
      - Must reference at least one specific company achievement/project
      - Must connect candidate skills to company tech stack
      - Must include specific examples from experience/projects
      - Must have a clear call to action
      - Keep total length between 200-250 words
      
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

// Generate a personalized email for a research internship application
export const generateBetterEmailWithLLM = async (context) => {
  try {
    const model = getModel();
    if (!model) {
      throw new Error("AI model not initialized");
    }

    // Extract data from context
    const { faculty, candidate, matches } = context;

    const prompt = `Write a personalized research internship application email in plain text format.

Context:
- Professor: ${faculty.name}
- Department: ${faculty.department || ""}
- Research Areas: ${(faculty.researchInterests || []).join(", ")}
${
  faculty.publications
    ? `- Recent Publications: ${faculty.publications.join(", ")}`
    : ""
}
${faculty.projects ? `- Current Projects: ${faculty.projects.join(", ")}` : ""}

Student Profile:
- Skills: ${(candidate.skills || []).join(", ")}
${
  matches.relevantExperience
    ? `- Relevant Experience: ${matches.relevantExperience
        .map((exp) => exp.title)
        .join(", ")}`
    : ""
}
${
  matches.relevantProjects
    ? `- Relevant Projects: ${matches.relevantProjects
        .map((proj) => proj.title)
        .join(", ")}`
    : ""
}

FORMAT:
1. Start with:
   Subject: [Write a clear subject line]

2. Then write the email body
   - Start with "Dear Dr. [Name]"
   - Use proper paragraphs and line breaks
   - End with a professional signature

REQUIREMENTS:
1. Reference specific research areas
2. Connect student's skills to professor's work
3. Highlight relevant projects and experience
4. Keep it concise (250-300 words)
5. Include a clear call to action
6. Be formal and professional

Write the complete email now, starting with "Subject:" on its own line.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text(); // Clean and parse the response
    const cleanText = text
      .replace(/```[\s\S]*?```/g, "") // Remove any code blocks
      .replace(/\\n/g, "\n") // Replace escaped newlines
      .replace(/\\"/g, '"') // Replace escaped quotes
      .trim();

    // Extract subject and body
    const subjectMatch = cleanText.match(/Subject:\s*(.+?)(?:\n|$)/i);
    const subject = subjectMatch
      ? subjectMatch[1].trim()
      : "Research Internship Application";

    // Get everything after the subject line as the body
    const body = cleanText.replace(/Subject:.+?(?:\n|$)/i, "").trim();

    // Ensure both subject and body are present
    if (!subject || !body) {
      throw new Error("Failed to generate complete email content");
    }

    return {
      subject,
      body,
    };
  } catch (error) {
    console.error("Error generating email with LLM:", error);
    throw error;
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
