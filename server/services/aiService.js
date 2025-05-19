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
  if (!genAI) return getMockData();

  try {
    const model = getModel();
    const prompt = `
      You are an expert resume parser. Extract information from this resume text into a detailed structured format.
      Follow these instructions precisely:

      1. Technical Skills:
         - Extract ALL technical skills mentioned anywhere (skills sections, experience, projects)
         - Include: languages, frameworks, libraries, tools, platforms, methodologies
         - Format consistently with proper capitalization (e.g., "TypeScript", "React.js", "AWS")
         - Keep compound terms together (e.g., "Node.js", "React Native")

      2. Experience:
         For each position, structure as:
         {
           "company": "Company name",
           "title": "Job title",
           "description": "Key responsibilities and achievements",
           "startDate": "YYYY-MM format",
           "endDate": "YYYY-MM format or 'Present'",
           "location": "City, Country if available"
         }

      3. Projects:
         For each project, structure as:
         {
           "name": "Project name",
           "description": "Project purpose and achievements",
           "technologies": ["tech1", "tech2"],
           "date": "Date or date range if available"
         }

      4. Education:
         For each entry, structure as:
         {
           "institution": "School name",
           "degree": "Degree type",
           "field": "Field of study",
           "startDate": "YYYY-MM",
           "endDate": "YYYY-MM",
           "gpa": "GPA if available"
         }

      Resume text to parse:
      ${text}

      Return only a JSON object with this structure (no markdown, no comments):
      {
        "skills": ["skill1", "skill2", ...],
        "experience": [{company, title, description, startDate, endDate, location}, ...],
        "projects": [{name, description, technologies, date}, ...],
        "education": [{institution, degree, field, startDate, endDate, gpa}, ...]
      }`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3, // Lower temperature for more consistent parsing
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 2048,
      },
    });

    const response = await result.response;
    const responseText = response.text().trim();

    try {
      // Try parsing the raw response first
      let parsed = JSON.parse(responseText);

      // Validate and normalize the parsed data
      const normalized = {
        skills: Array.isArray(parsed.skills)
          ? [
              ...new Set(
                parsed.skills.filter(
                  (skill) => typeof skill === "string" && skill.length >= 2
                )
              ),
            ]
          : [],

        experience: Array.isArray(parsed.experience)
          ? parsed.experience
              .map((exp) => ({
                company: String(exp.company || "").trim(),
                title: String(exp.title || "").trim(),
                description: String(exp.description || "").trim(),
                startDate: String(exp.startDate || "").trim(),
                endDate: String(exp.endDate || "").trim(),
                location: String(exp.location || "").trim(),
              }))
              .filter((exp) => exp.company || exp.title)
          : [],

        projects: Array.isArray(parsed.projects)
          ? parsed.projects
              .map((proj) => ({
                name: String(proj.name || "").trim(),
                description: String(proj.description || "").trim(),
                technologies: Array.isArray(proj.technologies)
                  ? proj.technologies.filter((tech) => typeof tech === "string")
                  : [],
                date: String(proj.date || "").trim(),
              }))
              .filter((proj) => proj.name || proj.description)
          : [],

        education: Array.isArray(parsed.education)
          ? parsed.education
              .map((edu) => ({
                institution: String(edu.institution || "").trim(),
                degree: String(edu.degree || "").trim(),
                field: String(edu.field || "").trim(),
                startDate: String(edu.startDate || "").trim(),
                endDate: String(edu.endDate || "").trim(),
                gpa: String(edu.gpa || "").trim(),
              }))
              .filter((edu) => edu.institution || edu.degree)
          : [],
      };

      // Format experience and projects for storage in Resume model
      return {
        skills: normalized.skills,
        experience: normalized.experience.map(
          (exp) =>
            `${exp.title} at ${exp.company}${
              exp.location ? ` (${exp.location})` : ""
            }, ${exp.startDate} - ${exp.endDate}: ${exp.description}`
        ),
        projects: normalized.projects.map(
          (proj) =>
            `${proj.name}: ${proj.description}${
              proj.technologies.length
                ? ` [${proj.technologies.join(", ")}]`
                : ""
            }${proj.date ? ` (${proj.date})` : ""}`
        ),
        education: normalized.education,
      };
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError);
      // If JSON parsing fails completely, attempt individual extractions
      return {
        skills: await getSkillsFromText(text),
        experience: await getExperienceFromText(text),
        projects: await getProjectsFromText(text),
        education: [], // Fallback to empty education
      };
    }
  } catch (error) {
    console.error("Error using AI for resume parsing:", error);
    return getMockData();
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

const getMockData = () => {
  return {
    skills: [
      "JavaScript",
      "TypeScript",
      "React",
      "Node.js",
      "Express",
      "MongoDB",
      "Git",
      "AWS",
      "Docker",
    ],
    experience: [
      "Senior Software Engineer at TechCorp (San Francisco), 2023-01 - Present: Led development of microservices architecture using Node.js and TypeScript",
      "Full Stack Developer at WebSolutions (Remote), 2021-06 - 2022-12: Built and maintained React applications with REST APIs",
      "Software Developer Intern at StartupX (New York), 2021-01 - 2021-05: Developed features for e-commerce platform using MERN stack",
    ],
    projects: [
      "E-commerce Platform: Built full-stack marketplace with React, Node.js, and MongoDB [React, Node.js, Express, MongoDB] (2023)",
      "Task Management App: Developed real-time collaborative todo app [React Native, Firebase, Redux] (2022)",
      "Portfolio Website: Personal site with blog and project showcase [Next.js, TailwindCSS, Vercel] (2021)",
    ],
    education: [
      {
        institution: "University of Technology",
        degree: "Bachelor of Science",
        field: "Computer Science",
        startDate: "2018-09",
        endDate: "2022-05",
        gpa: "3.8",
      },
    ],
  };
};

export const generateResearchEmail = async ({ faculty, candidate }) => {
  // Maximum number of retries for generation
  const MAX_RETRIES = 2;
  let retryCount = 0;

  // Full validation of required faculty data
  if (!faculty || typeof faculty !== "object") {
    throw new Error("Invalid faculty data provided");
  }

  // Comprehensive faculty data validation
  const requiredFields = ["name", "email", "department", "institution"];
  const missingFields = requiredFields.filter((field) => !faculty[field]);
  if (missingFields.length > 0) {
    throw new Error(
      `Missing required faculty data: ${missingFields.join(", ")}`
    );
  }

  // Research interests validation and normalization
  if (
    !Array.isArray(faculty.researchInterests) ||
    faculty.researchInterests.length === 0
  ) {
    throw new Error("Faculty must have at least one research interest");
  }
  faculty.researchInterests = faculty.researchInterests
    .filter(Boolean)
    .map((interest) => interest.trim());

  // Validate and normalize institution data
  if (!faculty.institution || typeof faculty.institution !== "object") {
    throw new Error("Invalid institution data");
  }
  if (!faculty.institution.name) {
    throw new Error("Institution name is required");
  }

  // Validate candidate data
  if (!candidate || typeof candidate !== "object") {
    throw new Error("Invalid candidate data provided");
  }
  if (!Array.isArray(candidate.skills) || candidate.skills.length === 0) {
    throw new Error("Candidate must have skills listed");
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Create comprehensive research context    // Create comprehensive research context with proper data validation
    const researchContext = {
      faculty: {
        name: faculty.name,
        title: faculty.title || "Professor",
        department: faculty.department,
        institution: {
          name: faculty.institution.name,
          type: faculty.institution.type || "University",
          location: faculty.institution.location || "",
        },
        researchInterests: Array.isArray(faculty.researchInterests)
          ? faculty.researchInterests
          : [],
        website:
          faculty.website ||
          (faculty.institution && faculty.institution.website) ||
          "",
        projects: Array.isArray(faculty.projects) ? faculty.projects : [],
        publications: Array.isArray(faculty.publications)
          ? faculty.publications
          : [],
      },
      candidate: {
        skills: Array.isArray(candidate.skills) ? candidate.skills : [],
        experience: Array.isArray(candidate.experience)
          ? candidate.experience
          : [],
        projects: Array.isArray(candidate.projects) ? candidate.projects : [],
        education: Array.isArray(candidate.education)
          ? candidate.education
          : [],
        matches: {
          matchingInterests: Array.isArray(candidate.matches?.matchingInterests)
            ? candidate.matches.matchingInterests
            : [],
          relevantProjects: Array.isArray(candidate.matches?.relevantProjects)
            ? // Extract project titles if they're objects, or use as-is if they're strings
              candidate.matches.relevantProjects.map((p) =>
                typeof p === "object" ? p.title || p.toString() : p
              )
            : [],
          relevantSkills: Array.isArray(candidate.matches?.relevantSkills)
            ? candidate.matches.relevantSkills
            : [],
        },
      },
    };
    const prompt = `
Generate a highly personalized academic email for research collaboration that directly addresses THIS SPECIFIC PROFESSOR's work. DO NOT use generic placeholders like "[Insert GitHub Link Here]" or "[mention a specific technique]" in the final email.

FACULTY PROFILE (YOU MUST REFERENCE THESE SPECIFIC DETAILS):
Professor: Dr. ${researchContext.faculty.name}
Title: ${researchContext.faculty.title}
Department: ${researchContext.faculty.department}
Institution: ${researchContext.faculty.institution.name}
Type: ${researchContext.faculty.institution.type}
Location: ${researchContext.faculty.institution.location || "Not specified"}
Website: ${researchContext.faculty.website || "Not provided"}

RESEARCH BACKGROUND (YOU MUST REFERENCE AT LEAST 2 SPECIFIC RESEARCH AREAS OR PROJECTS):
Research Areas: ${researchContext.faculty.researchInterests.join(", ")}
Current Projects: ${
      researchContext.faculty.projects.length > 0
        ? researchContext.faculty.projects
            .slice(0, 5)
            .map((p) => `- ${p}`)
            .join("\\n")
        : "Not available"
    }

Notable Publications:
${
  researchContext.faculty.publications.length > 0
    ? researchContext.faculty.publications
        .slice(0, 3)
        .map((pub) => `- ${pub}`)
        .join("\\n")
    : "Not available"
}

CANDIDATE BACKGROUND (YOU MUST CONNECT THESE SKILLS TO THE PROFESSOR'S RESEARCH):
Skills: ${researchContext.candidate.skills.join(", ")}
Relevant Projects: ${
      researchContext.candidate.matches.relevantProjects.length > 0
        ? researchContext.candidate.matches.relevantProjects
            .map((p) => `- ${p}`)
            .join("\\n")
        : "None"
    }
Matching Research Interests: ${
      researchContext.candidate.matches.matchingInterests.length > 0
        ? researchContext.candidate.matches.matchingInterests.join(", ")
        : "None"
    }

EMAIL STRUCTURE REQUIREMENTS:
1. Subject: Must reference a SPECIFIC research area from the professor's actual interests listed above
2. Opening paragraph: Reference the professor's specific research and institution directly
3. Middle paragraphs: Connect candidate skills to specific professor research areas
4. Final paragraph: Clear call to action for collaboration or next steps

IMPORTANT:
- DO NOT use placeholder text like "[Insert X Here]" or "[mention Y]" in the final output
- DO NOT make up research areas or projects not mentioned above
- DO NOT use generic content - the email must specifically reference THIS professor's research
- DO NOT mention projects or skills that aren't listed in the candidate background

FORMAT:
Return ONLY a strict JSON object in the following exact format, without any extra text, markdown, or explanations:
{
  "subject": "Research Collaboration Interest - [SPECIFIC RESEARCH AREA]",
  "body": "Dear Professor [ACTUAL NAME],\\n\\n[PERSONALIZED EMAIL BODY]\\n\\nBest regards,\\n[Use 'Your Name' as signature]"
}

REQUIREMENTS:
1. Subject line must contain a specific research area from faculty's interests
2. Paragraphs must be separated by double newlines (\\n\\n)
3. Email must directly reference actual professor name, department, and institution
4. Content must be precise and focused on the specific research areas listed
5. Length should be 250-350 words
6. Use formal academic tone`;
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.75,
        topP: 0.95,
        topK: 50,
        maxOutputTokens: 2048,
        stopSequences: ["```"], // Prevent code block markers in output
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
      ],
    });

    const response = await result.response;
    const text = response.text().trim(); // Debug logging
    console.log("Raw LLM response:", text.substring(0, 200)); // Sanitize and prepare the response for JSON parsing
    let jsonStr = text
      // Remove terminal markers like [0] that might appear in the response
      .replace(/^\[0\]\s*|(\n\[0\])\s*/g, "")
      // Remove JSON code block markers
      .replace(/```json\s*|\s*```/g, "")
      // Trim whitespace
      .trim(); // Try to parse the response as JSON directly first
    try {
      // If text is empty or very short, it's definitely incomplete
      if (!jsonStr || jsonStr.length < 20) {
        console.warn("Response text is too short:", jsonStr);
        throw new Error("Response text is too short to be valid JSON");
      }

      // Check if JSON is potentially incomplete by ensuring it has both opening and closing braces
      if (!jsonStr.includes("{") || !jsonStr.includes("}")) {
        console.warn("Response JSON appears to be incomplete:", jsonStr);
        throw new Error("JSON response appears to be incomplete");
      }

      // Check if braces are balanced (basic JSON structure check)
      const openingBraces = (jsonStr.match(/\{/g) || []).length;
      const closingBraces = (jsonStr.match(/\}/g) || []).length;
      if (openingBraces !== closingBraces) {
        console.warn(
          `Unbalanced JSON braces: ${openingBraces} opening vs ${closingBraces} closing`
        );
        throw new Error("JSON has unbalanced braces");
      }

      // Handle control characters that might be causing the parsing error
      // This replaces all control characters (0x00-0x1F) except regular whitespace (\n, \r, \t)
      const sanitizedJson = jsonStr.replace(
        /[\u0000-\u0008\u000B-\u000C\u000E-\u001F]/g,
        ""
      );

      // Function to repair JSON more thoroughly
      function repairJson(jsonString) {
        let result = jsonString;

        // Fix trailing commas before closing braces
        result = result.replace(/,\s*}/g, "}");
        result = result.replace(/,\s*\]/g, "]");

        // Fix unquoted property names
        result = result.replace(/(\{|\,)\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":');

        // Handle values without quotes (focus on subject and body properties)
        result = result.replace(
          /"subject"\s*:\s*([^"'\{\[].*?)(\s*[,\}])/g,
          '"subject":"$1"$2'
        );
        result = result.replace(
          /"body"\s*:\s*([^"'\{\[].*?)(\s*[,\}])/g,
          '"body":"$1"$2'
        );

        // Handle escaped quotes within content that might break JSON
        result = result.replace(/\\"/g, '"');
        result = result.replace(/([^\\])"/g, '$1\\"');
        result = result.replace(/"([^"]*)("|$)/g, '"$1"');

        // Fix common escape sequence issues
        result = result.replace(/([^\\])\\([^\\nrtbf"'])/g, "$1$2");

        return result;
      }

      // Try to fix common JSON formatting issues
      const fixedJson = repairJson(sanitizedJson);

      // Log what we're trying to parse for debugging
      console.log(
        "Attempting to parse JSON:",
        fixedJson.substring(0, 100) + (fixedJson.length > 100 ? "..." : "")
      );

      let emailContent;
      try {
        emailContent = JSON.parse(fixedJson);
      } catch (innerParseError) {
        // If parsing fails, try to extract JSON by finding the outer braces
        console.warn(
          "Initial JSON.parse failed, trying to find proper JSON object bounds"
        );
        const jsonStartIndex = fixedJson.indexOf("{");
        const jsonEndIndex = fixedJson.lastIndexOf("}") + 1;

        if (jsonStartIndex !== -1 && jsonEndIndex > jsonStartIndex) {
          const extractedJson = fixedJson.substring(
            jsonStartIndex,
            jsonEndIndex
          );
          console.log(
            "Extracted JSON object:",
            extractedJson.substring(0, 100) +
              (extractedJson.length > 100 ? "..." : "")
          );
          emailContent = JSON.parse(extractedJson);
        } else {
          throw innerParseError; // Re-throw if we couldn't extract JSON
        }
      }

      // Validate the content
      if (!emailContent?.subject || !emailContent?.body) {
        throw new Error("Generated email content is incomplete");
      }

      // Check for placeholder text which indicates the model didn't properly use the context
      const placeholderRegex =
        /\[(insert|mention|specific|your|name|actual|personalized|email body).*?\]/i;
      if (
        placeholderRegex.test(emailContent.subject) ||
        placeholderRegex.test(emailContent.body)
      ) {
        console.warn(
          "Email contains placeholder text - regenerating with more specific instructions"
        );
        throw new Error("Email contains placeholder text");
      } // Clean up any remaining newline inconsistencies in the body
      // First handle escaped newlines
      let cleanBody = emailContent.body.replace(/\\n/g, "\n");

      // Fix common formatting issues
      cleanBody = cleanBody
        .replace(/\n{3,}/g, "\n\n") // Replace multiple newlines with doubles
        .replace(/\s+$/gm, "") // Trim trailing whitespace on each line
        .replace(/([^.\n])(\n)([A-Z])/g, "$1\n\n$3") // Fix paragraphs missing double newlines
        .replace(/Dear Professor ([^,\n]+)([^\n,])/g, "Dear Professor $1,$2") // Ensure comma after professor name
        .replace(/Best regards,\n([A-Z])/g, "Best regards,\n\n$1") // Fix signature spacing
        .replace(/your name/gi, "Your Name"); // Replace "your name" with "Your Name"

      return {
        subject: emailContent.subject.trim(),
        body: cleanBody,
      };
    } catch (parseError) {
      console.error("Error parsing email content:", parseError); // Log the failure for debugging
      console.log(
        "JSON parsing failed, falling back to regex extraction methods"
      );

      // Try multiple regex extraction methods as fallbacks

      // Method 1: Basic property extraction with quotes
      const subjectMatch = text.match(/"subject"\s*:\s*"([^"]+)"/);
      const bodyMatch = text.match(
        /"body"\s*:\s*"([\s\S]+?)(?:"\s*}|\s*"\s*$)/
      );

      if (subjectMatch && bodyMatch) {
        const subject = subjectMatch[1].trim();
        const bodyText = bodyMatch[1]
          .replace(/\\n/g, "\n")
          .replace(/\n{3,}/g, "\n\n")
          .replace(/\s+$/, "");

        console.log("Successfully extracted email via regex method 1");
        return { subject, body: bodyText };
      }

      // Method 2: More robust extraction for non-standard JSON
      const subjectMatch2 = text.match(
        /"subject"[^"]*?[:=]\s*["']?([^"'\n,}]+)["']?/i
      );
      const bodyStart = text.indexOf('"body"');

      if ((subjectMatch || subjectMatch2) && bodyStart !== -1) {
        // Extract subject from either match
        const subject = (
          subjectMatch ? subjectMatch[1] : subjectMatch2[1]
        ).trim();

        // Extract body more carefully
        let bodyText = "";
        let bodyExtract = text.substring(bodyStart + 6); // Skip past "body"

        // Skip colon and any whitespace
        let colonIndex = bodyExtract.indexOf(":");
        if (colonIndex !== -1) {
          bodyExtract = bodyExtract.substring(colonIndex + 1).trim();

          // Find the opening quote (if any)
          const openingQuote = bodyExtract.indexOf('"');
          let startIdx = 0;

          if (openingQuote !== -1) {
            startIdx = openingQuote + 1;
            bodyExtract = bodyExtract.substring(startIdx);

            // Extract until the last quote before closing brace
            const closingBrace = bodyExtract.indexOf("}");
            // Find the last quote that appears before the closing brace
            const closingQuote =
              closingBrace !== -1
                ? bodyExtract.lastIndexOf('"', closingBrace)
                : bodyExtract.lastIndexOf('"');

            if (closingQuote !== -1) {
              bodyText = bodyExtract
                .substring(0, closingQuote)
                .replace(/\\n/g, "\n")
                .replace(/\n{3,}/g, "\n\n")
                .replace(/\s+$/, "");
            } else {
              // No closing quote found, extract until closing brace or end
              const endPos =
                closingBrace !== -1 ? closingBrace : bodyExtract.length;
              bodyText = bodyExtract
                .substring(0, endPos)
                .replace(/\\n/g, "\n")
                .replace(/\n{3,}/g, "\n\n")
                .replace(/\s+$/, "");
            }
          } else {
            // No quotes around body, extract until closing brace
            const closingBrace = bodyExtract.indexOf("}");
            const endPos =
              closingBrace !== -1 ? closingBrace : bodyExtract.length;
            bodyText = bodyExtract
              .substring(0, endPos)
              .replace(/\\n/g, "\n")
              .replace(/\n{3,}/g, "\n\n")
              .replace(/\s+$/, "");
          }
        }

        if (subject && bodyText) {
          console.log("Successfully extracted email via regex method 2");
          return { subject, body: bodyText };
        }
      }

      // Method 3: Content structure extraction - look for patterns like "Dear Professor X" and email body structure
      const emailBodyMatch = text.match(
        /Dear\s+Professor\s+([^,\n]+)([^]*?)(Best|Sincerely|Thank you|Regards)/i
      );

      if (emailBodyMatch) {
        const professorName = emailBodyMatch[1].trim();
        const emailBody = emailBodyMatch[0].trim();

        // Try to find a subject-like line for the subject
        const potentialSubject = text.match(
          /Research\s+(?:Collaboration|Interest|Opportunity|Inquiry)[^.\n]+/i
        );
        const subject = potentialSubject
          ? potentialSubject[0].trim()
          : `Research Collaboration Interest with Professor ${professorName}`;

        console.log(
          "Successfully extracted email via method 3 (content pattern matching)"
        );
        return { subject, body: emailBody };
      } // If we reach here, we couldn't extract via regex either
      // Create a fallback response with the raw text
      const lines = text
        .split("\n")
        .filter((line) => line.trim() && !line.startsWith("[0]"));
      if (lines.length > 2) {
        // Try to create a basic email from the text
        return {
          subject: "Research Collaboration Interest",
          body: lines
            .join("\n")
            .replace(/```json|```/g, "")
            .replace(/[\u0000-\u001F]/g, "") // Remove control chars
            .trim(),
        };
      }

      throw new Error("Could not extract email content");
    }
  } catch (error) {
    console.error(
      `Error generating research email (attempt ${retryCount + 1}/${
        MAX_RETRIES + 1
      }):`,
      error
    );

    // If we haven't reached max retries and error is related to content generation, retry
    if (
      retryCount < MAX_RETRIES &&
      (error.message.includes("placeholder") ||
        error.message.includes("parsing") ||
        error.message.includes("incomplete"))
    ) {
      retryCount++;
      console.log(
        `Retrying email generation, attempt ${retryCount + 1}/${
          MAX_RETRIES + 1
        }`
      );

      // Increase temperature slightly with each retry to encourage different output
      const adjustedTemperature = 0.75 + retryCount * 0.1;

      try {
        // Wait a moment before retrying
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Try generation again with modified prompt
        const result = await model.generateContent({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text:
                    prompt +
                    `\n\nPrevious attempt failed. This is retry #${retryCount}. Please ensure you create HIGHLY SPECIFIC content referencing the exact faculty research areas and avoid ANY placeholder text.`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: adjustedTemperature, // Increase temperature for retry
            topP: 0.95,
            topK: 50,
            maxOutputTokens: 2048,
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE",
            },
          ],
        });

        const response = await result.response;
        const retryText = response.text().trim();
        console.log("Raw retry LLM response:", retryText.substring(0, 200));

        // Process the retry response with the same robust parsing we use for the original attempt
        try {
          // Prepare the JSON string with the same cleaning as the original attempt
          let jsonStr = retryText
            .replace(/^\[0\]\s*|(\n\[0\])\s*/g, "") // Remove terminal markers
            .replace(/```json\s*|\s*```/g, "") // Remove JSON markers
            .replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F]/g, "") // Remove control chars
            .trim();

          // Check basic JSON validity
          if (!jsonStr || jsonStr.length < 20) {
            throw new Error(
              "Retry response text is too short to be valid JSON"
            );
          }

          if (!jsonStr.includes("{") || !jsonStr.includes("}")) {
            throw new Error("Retry JSON response appears to be incomplete");
          }

          // Check for balanced braces
          const openingBraces = (jsonStr.match(/\{/g) || []).length;
          const closingBraces = (jsonStr.match(/\}/g) || []).length;
          if (openingBraces !== closingBraces) {
            throw new Error(
              `Retry JSON has unbalanced braces: ${openingBraces} opening vs ${closingBraces} closing`
            );
          }

          // Use the same JSON repair function we defined earlier
          function repairJson(jsonString) {
            let result = jsonString;

            // Fix trailing commas before closing braces
            result = result.replace(/,\s*}/g, "}");
            result = result.replace(/,\s*\]/g, "]");

            // Fix unquoted property names
            result = result.replace(
              /(\{|\,)\s*([a-zA-Z0-9_]+)\s*:/g,
              '$1"$2":'
            );

            // Handle values without quotes
            result = result.replace(
              /"subject"\s*:\s*([^"'\{\[].*?)(\s*[,\}])/g,
              '"subject":"$1"$2'
            );
            result = result.replace(
              /"body"\s*:\s*([^"'\{\[].*?)(\s*[,\}])/g,
              '"body":"$1"$2'
            );

            // Handle escaped quotes within content
            result = result.replace(/\\"/g, '"');
            result = result.replace(/([^\\])"/g, '$1\\"');
            result = result.replace(/"([^"]*)("|$)/g, '"$1"');

            // Fix common escape sequence issues
            result = result.replace(/([^\\])\\([^\\nrtbf"'])/g, "$1$2");

            return result;
          }

          const sanitizedJson = repairJson(jsonStr);
          console.log(
            "Attempting to parse retry JSON:",
            sanitizedJson.substring(0, 100) +
              (sanitizedJson.length > 100 ? "..." : "")
          );

          let emailContent;
          try {
            emailContent = JSON.parse(sanitizedJson);
          } catch (innerParseError) {
            // If parsing fails, try to extract JSON by finding the outer braces
            console.warn(
              "Initial retry JSON.parse failed, trying to find proper JSON object bounds"
            );
            const jsonStartIndex = sanitizedJson.indexOf("{");
            const jsonEndIndex = sanitizedJson.lastIndexOf("}") + 1;

            if (jsonStartIndex !== -1 && jsonEndIndex > jsonStartIndex) {
              const extractedJson = sanitizedJson.substring(
                jsonStartIndex,
                jsonEndIndex
              );
              console.log(
                "Extracted retry JSON object:",
                extractedJson.substring(0, 100) +
                  (extractedJson.length > 100 ? "..." : "")
              );
              emailContent = JSON.parse(extractedJson);
            } else {
              throw innerParseError; // Re-throw if we couldn't extract JSON
            }
          }

          if (!emailContent?.subject || !emailContent?.body) {
            throw new Error("Retry generated incomplete email content");
          }

          // Ensure the content doesn't have placeholders
          const placeholderRegex =
            /\[(insert|mention|specific|your|name|actual|personalized|email body).*?\]/i;
          if (
            placeholderRegex.test(emailContent.subject) ||
            placeholderRegex.test(emailContent.body)
          ) {
            throw new Error("Retry still contains placeholder text");
          }

          // Success - return the properly generated content
          return {
            subject: emailContent.subject.trim(),
            body: emailContent.body
              .replace(/\\n/g, "\n")
              .replace(/\n{3,}/g, "\n\n")
              .replace(/\s+$/, ""),
          };
        } catch (retryError) {
          // Continue to fallback if retry also fails
          console.error("Retry also failed:", retryError);
        }
      } catch (retryAttemptError) {
        console.error("Error during retry attempt:", retryAttemptError);
      }
    }

    // Return a fallback response if all retries fail or we hit an unexpected error
    return {
      subject: "Research Collaboration Interest",
      body: `Dear Professor ${
        faculty.name
      },\n\nI am writing to express my interest in research opportunities in ${
        faculty.researchInterests[0] || "your field"
      } at ${faculty.institution.name}.\n\nAs a student with background in ${
        candidate.skills.slice(0, 3).join(", ") || "relevant fields"
      }, I am particularly interested in your work and would appreciate the opportunity to discuss potential collaboration.\n\nThank you for your consideration.\n\nBest regards,\nYour Name`,
    };
  }
};
