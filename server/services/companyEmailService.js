import axios from "axios";
import * as cheerio from "cheerio";
import Company from "../models/Company.js";
import { genAI } from "./aiService.js";
import { scrapeCompanyWebsite } from "./companyScraper.js";

// Helper function to escape special regex characters
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const findCompaniesWithLLM = async (skills, role) => {
  if (!process.env.GEMINI_API_KEY) return [];

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Create a focused job search context
    const searchContext = {
      role: role,
      skills: skills,
      relatedRoles: getRelatedRoles(role),
      relatedSkills: getRelatedSkills(skills),
    };

    const prompt = `
      You are an expert tech industry researcher with comprehensive knowledge of companies and startups.
      Generate detailed company profiles that are actively hiring for roles matching this context:
      ${JSON.stringify(searchContext, null, 2)}

      TARGET COMPANIES:
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
         - Investment in new technologies

      OUTPUT FORMAT:
      Return a JSON array of company profiles, each with:
      {
        "name": "string (company name)",
        "description": "string (brief company overview)",
        "industry": "string (primary industry)",
        "size": "string (startup|small|medium|large|enterprise)",
        "technologiesUsed": ["array of tech stack"],
        "openRoles": [{
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
        "relevanceScore": number (0-1)
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
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let responseText = response.text();
    try {
      // Try to find and clean JSON array in the response
      const jsonStart = responseText.indexOf("[");
      const jsonEnd = responseText.lastIndexOf("]") + 1;
      let jsonStr =
        jsonStart >= 0 && jsonEnd > 0
          ? responseText.slice(jsonStart, jsonEnd)
          : responseText;

      // 1. Remove markdown code block markers
      jsonStr = jsonStr.replace(/```json\s*|\s*```$/g, "");

      // 2. Find the last complete company object by looking for the pattern },\s*{
      const companies = [];
      let depth = 0;
      let currentObject = "";
      let inString = false;
      let escapeNext = false;

      for (let i = 0; i < jsonStr.length; i++) {
        const char = jsonStr[i];

        // Handle string literals
        if (char === '"' && !escapeNext) {
          inString = !inString;
        }
        escapeNext = char === "\\" && !escapeNext;

        if (!inString) {
          if (char === "{") depth++;
          if (char === "}") depth--;
        }

        currentObject += char;

        // Complete object found
        if (depth === 0 && currentObject.trim()) {
          try {
            // Try to parse current object
            let obj = JSON.parse(currentObject);
            if (obj && typeof obj === "object") {
              companies.push(obj);
            }
            currentObject = "";
          } catch (e) {
            // If parsing fails, this might be the incomplete/corrupted part
            break;
          }
        }
      }

      // Filter valid companies
      const validCompanies = companies.filter((company) => {
        return (
          company &&
          typeof company.name === "string" &&
          !company.name.includes("[") && // Filter out template placeholders
          !company.name.includes("]") &&
          company.openRoles?.length > 0 &&
          company.technologiesUsed?.length > 0 &&
          company.relevanceScore > 0.7 // Only keep highly relevant matches
        );
      });

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
    if (!Array.isArray(skills) || !role) {
      throw new Error("Invalid search parameters");
    }

    // First try finding companies using LLM
    console.log("Attempting to find companies using LLM...");
    const llmResults = await findCompaniesWithLLM(skills, role);
    console.log("LLM Results:", JSON.stringify(llmResults, null, 2));

    if (llmResults && llmResults.length > 0) {
      // Enrich each company with web data
      const enrichedResults = await Promise.all(
        llmResults.map(async (company) => {
          if (company.website) {
            const scrapedData = await scrapeCompanyWebsite(company.website);
            if (scrapedData) {
              return {
                ...company,
                openRoles: [
                  ...(company.openRoles || []),
                  ...(scrapedData.openRoles || []),
                ],
                technologiesUsed: [
                  ...new Set([
                    ...(company.technologiesUsed || []),
                    ...(scrapedData.techStack || []),
                  ]),
                ],
                culture: {
                  values: [
                    ...new Set([
                      ...(company.culture?.values || []),
                      ...(scrapedData.culture?.values || []),
                    ]),
                  ],
                  benefits: [
                    ...new Set([
                      ...(company.culture?.benefits || []),
                      ...(scrapedData.culture?.benefits || []),
                    ]),
                  ],
                },
                social: scrapedData.social,
              };
            }
          }
          return company;
        })
      );

      // Save enriched results to database
      await saveCompaniesToDatabase(enrichedResults);
      return enrichedResults;
    }

    // Explicit fallback to database search
    console.log("No LLM results, falling back to database search...");
    const companies = await Company.aggregate([
      {
        $match: {
          $or: [
            {
              openRoles: {
                $elemMatch: {
                  title: { $regex: escapeRegExp(role), $options: "i" },
                },
              },
            },
            {
              technologiesUsed: {
                $in: skills.map(
                  (skill) => new RegExp(escapeRegExp(skill), "i")
                ),
              },
            },
          ],
          "openRoles.0": { $exists: true },
        },
      },
      {
        $addFields: {
          roleMatchCount: {
            $size: {
              $filter: {
                input: "$openRoles",
                as: "role",
                cond: {
                  $regexMatch: {
                    input: "$$role.title",
                    regex: escapeRegExp(role),
                    options: "i",
                  },
                },
              },
            },
          },
          skillMatchCount: {
            $size: {
              $setIntersection: ["$technologiesUsed", skills],
            },
          },
        },
      },
      {
        $addFields: {
          relevanceScore: {
            $add: [
              { $multiply: ["$roleMatchCount", 30] },
              { $multiply: ["$skillMatchCount", 5] },
              {
                $switch: {
                  branches: [
                    { case: { $eq: ["$size", "startup"] }, then: 20 },
                    { case: { $eq: ["$size", "small"] }, then: 15 },
                    { case: { $eq: ["$size", "medium"] }, then: 10 },
                  ],
                  default: 5,
                },
              },
            ],
          },
        },
      },
      {
        $match: {
          $or: [
            { roleMatchCount: { $gt: 0 } },
            { skillMatchCount: { $gt: 0 } },
          ],
        },
      },
      { $sort: { relevanceScore: -1 } },
      { $limit: 15 },
    ]);

    if (companies.length === 0) {
      console.log("No companies found in database either");
      return [];
    }

    console.log(`Found ${companies.length} companies in database`);
    return companies;
  } catch (error) {
    console.error("Error searching companies:", error);
    throw error;
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
      // Skip invalid entries
      if (!company.name) continue;

      // Create or update company
      await Company.findOneAndUpdate(
        { name: company.name },
        {
          ...company,
          lastScraped: new Date(),
        },
        { upsert: true, new: true }
      );
    }
  } catch (error) {
    console.error("Error saving companies to database:", error);
    throw error;
  }
};
