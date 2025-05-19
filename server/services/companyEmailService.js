import axios from "axios";
import * as cheerio from "cheerio";
import Company from "../models/Company.js";
import { genAI } from "./aiService.js";
import { scrapeCompanyWebsite } from "./companyScraper.js";

// Helper function to escape special regex characters
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const logLLMResponse = (responseText, companies) => {
  console.log("\n=== LLM Response Debug ===");
  console.log("Raw response length:", responseText?.length);
  console.log("First 200 chars:", responseText?.substring(0, 200));
  console.log("\nParsed companies:", companies?.length);
  console.log(
    "Valid companies:",
    companies?.filter(
      (c) => c && c.name && c.email && c.role && c.technologiesUsed?.length
    ).length
  );
  if (companies?.[0]) {
    console.log("\nSample company:");
    console.log(JSON.stringify(companies[0], null, 2));
  }
  console.log("========================\n");
};

const findCompaniesWithLLM = async (skills, role) => {
  if (!process.env.GEMINI_API_KEY) {
    console.log("Gemini API key not found");
    return [];
  }

  console.log("Starting LLM search with:", { skills, role });
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Create a focused job search context
    const searchContext = {
      role: role,
      skills: skills,
      relatedRoles: getRelatedRoles(role),
      relatedSkills: getRelatedSkills(skills),
    };
    const prompt = `[INSTRUCTION]
You are an expert tech industry researcher. Generate a JSON array of tech company profiles matching this candidate:
${JSON.stringify(searchContext, null, 2)}

[OUTPUT RULES]
1. Return ONLY a valid JSON array - NO explanations, NO markdown
2. Each company MUST be a real, actively hiring company
3. Each company MUST have all required fields
4. Generate exactly 5 highly relevant companies
5. Ensure relevanceScore > 0.7 for all companies
6. Every company MUST have a valid email
7. Format JSON with proper spacing and indentation
8. No trailing commas, no unquoted keys
9. No markdown, no code blocks, no extra text

[COMPANY CRITERIA]
      1. Fast-growing startups with recent funding
      2. Tech companies with strong innovation focus
      3. Companies with active hiring in relevant domains
      4. Organizations with good career growth potential
      5. Companies known for strong engineering culture

      SEARCH PARAMETERS:
      1. Role Alignment:
         - Primary focus on exact role matches
         - Consider related positions
         - Look for recent job postings
         - Check for team expansion signals

      2. Company Profile:
         - Currently active in hiring
         - Strong technical focus
         - Good work culture
         - Growth trajectory
         - Innovation focus

      3. Technical Environment:
         - Modern tech stack
         - Engineering-driven culture
         - Active in relevant domains
         - Investment in new technologies      OUTPUT FORMAT:
      Return a JSON array of company profiles, each with:
      {
        "name": "string (company name) - REQUIRED",
        "email": "string (recruiting/careers email) - REQUIRED",
        "role": "string (specific role title matching the skills) - REQUIRED",
        "description": "string (brief company overview)",
        "industry": "string (primary industry)",
        "size": "string (startup|small|medium|large|enterprise)",
        "technologiesUsed": ["array of tech stack"] - REQUIRED,
        "openRoles": [{ - REQUIRED
          "title": "string (job title)",
          "department": "string (e.g., Engineering)",
          "skills": ["required skills"],
          "experience": "string (required experience)",
          "location": "string",
          "remote": boolean
        }],
        "culture": {
          "values": ["array of company values"],
          "benefits": ["array of key benefits"]
        },
        "location": {
          "city": "string",
          "country": "string",
          "remote": boolean
        },
        "website": "string or null",
        "relevanceScore": number (0-1) - REQUIRED
      }

      COMPULSARY RESPONSE REQUIREMENTS:
      1. Generate 5-10 highly relevant companies
      2. Ensure factual accuracy
      3. Include only actively hiring companies
      4. Focus on companies matching the skills
      5. Return only valid JSON array, nothing else will be accepted as it is directly being parsed.
      6. Do not include without email responses, it is of the utmost importance.
      7. Do not include any other text or explanations
    `;
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 2048,
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_NONE",
        },
      ],
    });
    const response = await result.response;
    let responseText = response.text();
    console.log("Received LLM response");

    try {
      // Simple JSON parsing
      let companies = [];
      try {
        // Remove any code block markers
        responseText = responseText
          .replace(/```(?:json)?\s*|\s*```/g, "")
          .trim();

        // Find the JSON array
        const start = responseText.indexOf("[");
        const end = responseText.lastIndexOf("]") + 1;

        if (start >= 0 && end > start) {
          // Extract and parse the JSON array
          const jsonStr = responseText.slice(start, end);
          companies = JSON.parse(jsonStr);
          console.log("Successfully parsed JSON array");
        } else {
          console.log("No valid JSON array found in response");
        }
      } catch (e) {
        console.error("JSON parsing failed:", e);
      }
      console.log("Raw companies found:", companies.length);
      // Filter and normalize companies
      const validCompanies = companies
        .filter((company) => {
          if (!company) return false;

          const validationChecks = {
            // Basic info validation
            hasName:
              typeof company.name === "string" && company.name.length > 0,
            validName:
              !company.name?.includes("[") && !company.name?.includes("]"),
            hasEmail:
              typeof company.email === "string" && company.email.includes("@"),

            // Role and tech stack validation
            hasRoles:
              Array.isArray(company.openRoles) && company.openRoles.length > 0,
            validRoles: company.openRoles?.some((r) => r && r.title),
            hasTechStack:
              Array.isArray(company.technologiesUsed) &&
              company.technologiesUsed.length > 0,

            // Relevance validation
            highRelevance:
              typeof company.relevanceScore === "number" &&
              company.relevanceScore > 0.7,
          };

          const isValid = Object.values(validationChecks).every(Boolean);

          if (!isValid) {
            console.log("Invalid company:", {
              name: company.name,
              ...validationChecks,
            });
          }
          return isValid;
        })
        .map((company) => {
          // Clean and normalize company name
          const normalizedName = company.name
            .trim()
            .replace(/\s+/g, " ") // Normalize whitespace
            .replace(/[^\w\s.-]/g, ""); // Remove special chars except dots and dashes

          // Generate domain name for email
          const domainName = normalizedName
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "");

          // Ensure valid role title exists
          const inferredRole =
            company.openRoles?.find((r) => r?.title)?.title ||
            role ||
            "Software Engineer";

          // Clean and dedupe tech stack
          const cleanTechStack = Array.from(
            new Set(
              company.technologiesUsed
                .filter(Boolean)
                .map((tech) => tech.trim())
                .filter((tech) => tech.length > 0)
            )
          );

          return {
            ...company,
            name: normalizedName,
            email: company.email || `careers@${domainName}.com`,
            role: inferredRole,
            website: company.website || `https://www.${domainName}.com`,
            openRoles: [
              { title: inferredRole, ...company.openRoles?.[0] },
              ...(company.openRoles?.slice(1) || []),
            ].filter((r) => r?.title), // Keep only roles with titles
            technologiesUsed: cleanTechStack,
            relevanceScore: Math.min(
              Math.max(company.relevanceScore || 0.7, 0),
              1
            ), // Clamp between 0-1
          };
        });

      logLLMResponse(responseText, validCompanies);
      console.log("Filtered down to", validCompanies.length, "valid companies");
      return validCompanies;
    } catch (e) {
      console.error("Failed to parse LLM response:", e);
      console.error("Response text:", responseText);
      return []; // Return empty array on parse failure
    }
  } catch (error) {
    console.error("LLM search failed:", error);
    return [];
  }
};

// Helper function to get related roles
const getRelatedRoles = (role) => {
  const roleMap = {
    "software engineer": [
      "software developer",
      "full stack developer",
      "backend developer",
      "frontend developer",
      "application developer",
    ],
    "data scientist": [
      "machine learning engineer",
      "ai engineer",
      "data engineer",
      "research scientist",
      "analytics engineer",
    ],
    "devops engineer": [
      "site reliability engineer",
      "platform engineer",
      "cloud engineer",
      "infrastructure engineer",
      "systems engineer",
    ],
  };

  const normalizedRole = role.toLowerCase();
  for (const [key, values] of Object.entries(roleMap)) {
    if (
      normalizedRole.includes(key) ||
      values.some((v) => normalizedRole.includes(v))
    ) {
      return values;
    }
  }
  return [];
};

// Helper function to get related skills
const getRelatedSkills = (skills) => {
  const skillMap = {
    python: [
      "django",
      "flask",
      "fastapi",
      "pytorch",
      "tensorflow",
      "pandas",
      "numpy",
    ],
    javascript: ["typescript", "node.js", "react", "vue", "angular", "next.js"],
    java: ["spring", "hibernate", "kotlin", "scala", "microservices"],
    aws: ["azure", "gcp", "docker", "kubernetes", "terraform"],
    "machine learning": [
      "deep learning",
      "neural networks",
      "nlp",
      "computer vision",
      "data science",
    ],
  };

  const relatedSkills = new Set();
  for (const skill of skills) {
    const normalizedSkill = skill.toLowerCase();
    for (const [key, values] of Object.entries(skillMap)) {
      if (normalizedSkill.includes(key)) {
        values.forEach((v) => relatedSkills.add(v));
      }
    }
  }
  return [...relatedSkills];
};

export const searchCompanies = async (skills, role) => {
  try {
    // First try LLM search
    console.log("Attempting to find companies using LLM...");
    const llmCompanies = await findCompaniesWithLLM(skills, role);
    let dbCompanies = [];

    if (!llmCompanies?.length) {
      // If LLM search fails or returns no results, fall back to database
      console.log("No LLM results, falling back to database search...");

      // First try exact match
      dbCompanies = await Company.find({
        $or: [
          { roles: { $in: [role] } },
          { role: { $regex: new RegExp(escapeRegExp(role), "i") } },
          {
            "technologiesUsed.name": {
              $in: skills.map((skill) => new RegExp(escapeRegExp(skill), "i")),
            },
          },
        ],
      }).lean();

      // If still no results, get some default tech companies
      if (!dbCompanies.length) {
        console.log("No exact matches, getting default tech companies...");
        dbCompanies = await Company.find({
          $or: [
            { industry: { $in: ["Technology", "Software", "IT"] } },
            { role: "Software Engineer" },
          ],
        })
          .sort({ lastUpdated: -1 })
          .limit(5)
          .lean();
      }
    }

    // Use LLM results if available, otherwise use DB results
    const baseCompanies = llmCompanies?.length
      ? llmCompanies
      : dbCompanies || [];
    console.log(
      `Found ${baseCompanies.length} companies in ${
        llmCompanies?.length ? "LLM" : "database"
      }`
    );

    // Deduplicate results
    const uniqueCompanies = Array.from(
      new Map(
        baseCompanies.map((company) => [company.name.toLowerCase(), company])
      ).values()
    );

    // Ensure all companies have required fields with proper format
    return uniqueCompanies.map((company) => {
      const normalizedName = company.name.trim();
      const domainName = normalizedName.toLowerCase().replace(/[^a-z0-9]/g, "");

      return {
        name: normalizedName,
        email: company.email || `careers@${domainName}.com`,
        role: company.role || role || "Software Engineer",
        technologiesUsed: company.technologiesUsed || [],
        openRoles: company.openRoles || [
          { title: role || "Software Engineer" },
        ],
        research: company.research || {},
        matchReason:
          company.matchReason ||
          `Skills match with ${skills.slice(0, 3).join(", ")}`,
      };
    });
  } catch (error) {
    console.error("Error in searchCompanies:", error);
    return [];
  }
};

const calculateRelevanceScore = (
  company,
  role,
  skills,
  experiences,
  projects
) => {
  let score = 0;
  const maxScore = 100;

  // Check technology stack match
  const techStackMatch =
    company.technologiesUsed?.filter((tech) =>
      skills.some(
        (skill) =>
          skill.toLowerCase().includes(tech.toLowerCase()) ||
          tech.toLowerCase().includes(skill.toLowerCase())
      )
    ).length || 0;
  score += (techStackMatch / (company.technologiesUsed?.length || 1)) * 30;

  // Check role requirements match
  const targetRole = company.openRoles.find((r) =>
    r.title.toLowerCase().includes(role.toLowerCase())
  );
  if (targetRole) {
    const roleSkillsMatch =
      targetRole.skills?.filter((skill) =>
        skills.some(
          (userSkill) =>
            userSkill.toLowerCase().includes(skill.toLowerCase()) ||
            skill.toLowerCase().includes(userSkill.toLowerCase())
        )
      ).length || 0;
    score += (roleSkillsMatch / (targetRole.skills?.length || 1)) * 30;
  }

  // Check experience relevance
  const expMatch =
    experiences?.filter(
      (exp) =>
        company.industry
          ?.toLowerCase()
          .includes(exp.description?.toLowerCase()) ||
        exp.description
          ?.toLowerCase()
          .includes(company.industry?.toLowerCase()) ||
        targetRole?.skills?.some((skill) =>
          exp.description?.toLowerCase().includes(skill.toLowerCase())
        )
    ).length || 0;
  score += (expMatch / (experiences?.length || 1)) * 20;

  // Check project relevance
  const projMatch =
    projects?.filter((proj) =>
      company.technologiesUsed?.some(
        (tech) =>
          proj.description?.toLowerCase().includes(tech.toLowerCase()) ||
          proj.title?.toLowerCase().includes(tech.toLowerCase())
      )
    ).length || 0;
  score += (projMatch / (projects?.length || 1)) * 20;

  return Math.min(Math.round(score), maxScore);
};

export const generateCompanyEmail = async (company, role, resume) => {
  if (!company || !role || !resume) {
    throw new Error("Company, role, and resume data are required");
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Match skills with job requirements
    const matchedSkills =
      resume.skills?.filter((skill) =>
        company.technologiesUsed?.some(
          (tech) =>
            tech.toLowerCase().includes(skill.toLowerCase()) ||
            skill.toLowerCase().includes(tech.toLowerCase())
        )
      ) || [];

    // Find relevant experiences
    const relevantExperience =
      resume.experience?.filter(
        (exp) =>
          exp.description?.toLowerCase().includes(role.toLowerCase()) ||
          matchedSkills.some((skill) =>
            exp.description?.toLowerCase().includes(skill.toLowerCase())
          )
      ) || [];

    // Find relevant projects
    const relevantProjects =
      resume.projects?.filter((project) =>
        matchedSkills.some(
          (skill) =>
            project.description?.toLowerCase().includes(skill.toLowerCase()) ||
            project.title?.toLowerCase().includes(skill.toLowerCase())
        )
      ) || [];

    const prompt = `
      Write a personalized cold email for a ${role} position at ${company.name}.

      COMPANY CONTEXT:
      ${JSON.stringify(
        {
          name: company.name,
          industry: company.industry,
          size: company.size,
          techStack: company.technologiesUsed,
          culture: company.culture,
          socialPresence: company.social,
          researchData: company.research || {},
        },
        null,
        2
      )}

      CANDIDATE CONTEXT:
      ${JSON.stringify(
        {
          skills: matchedSkills,
          relevantExperience,
          relevantProjects,
          education: resume.education,
        },
        null,
        2
      )}

      REQUIREMENTS:
      1. Subject Line:
         - Specific role and key matching skills
         - Company name
         Example: "Senior Frontend Developer with React/Node.js expertise for [Company]"

      2. Opening (2-3 sentences):
         - Show company knowledge
         - Reference specific product/achievement
         - Connect to company values

      3. Skills & Experience (4-5 sentences):
         - Highlight matching skills
         - Mention relevant projects
         - Include specific achievements
         - Quantify results

      4. Cultural Fit (2-3 sentences):
         - Connect to company values
         - Show enthusiasm
         - Demonstrate research

      5. Call to Action:
         - Clear next steps
         - Professional closing

      FORMAT:
      {
        "subject": "Your subject line here",
        "body": "Your email body here"
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let emailContent;

    try {
      emailContent = JSON.parse(response.text());
    } catch (error) {
      console.error("Error parsing email content:", error);
      const text = response.text();
      emailContent = {
        subject:
          text.match(/subject:?\s*([^\n]+)/i)?.[1] ||
          `${role} Position - Experienced Developer`,
        body: text.replace(/subject:?\s*[^\n]+\s*/i, "").trim(),
      };
    }

    return emailContent;
  } catch (error) {
    console.error("Error generating company email:", error);
    throw error;
  }
};

export const saveCompaniesToDatabase = async (companies) => {
  try {
    for (const company of companies) {
      if (!company.name) continue;

      // Normalize research data structure
      const normalizedCompany = {
        ...company,
        companyResearch: {
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
        },
        lastScraped: new Date(),
      };

      // Create or update company with normalized data
      await Company.findOneAndUpdate(
        { name: company.name },
        normalizedCompany,
        { upsert: true, new: true }
      );
    }
  } catch (error) {
    console.error("Error saving companies to database:", error);
    throw error;
  }
};
