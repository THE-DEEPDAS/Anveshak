import Company from "../models/Company.js";

const defaultCompanies = [
  {
    name: "Google",
    email: "careers@google.com",
    role: "Software Engineer",
    industry: ["Technology", "Software"],
    technologiesUsed: [
      "Python",
      "Java",
      "Go",
      "JavaScript",
      "Kubernetes",
      "TensorFlow",
    ],
    openRoles: [
      {
        title: "Software Engineer",
        department: "Engineering",
        skills: ["Python", "Java", "Cloud Computing"],
      },
    ],
    description:
      "Leading technology company focusing on search, cloud computing, software, and AI",
    size: "enterprise",
  },
  {
    name: "Microsoft",
    email: "careers@microsoft.com",
    role: "Software Engineer",
    industry: ["Technology", "Software"],
    technologiesUsed: ["C#", ".NET", "Azure", "TypeScript", "React", "Node.js"],
    openRoles: [
      {
        title: "Software Engineer",
        department: "Engineering",
        skills: ["C#", "Azure", "Cloud Computing"],
      },
    ],
    description:
      "Global technology company specializing in software, cloud computing, and AI",
    size: "enterprise",
  },
  {
    name: "Meta",
    email: "careers@meta.com",
    role: "Software Engineer",
    industry: ["Technology", "Social Media"],
    technologiesUsed: ["React", "Python", "C++", "PHP", "GraphQL", "PyTorch"],
    openRoles: [
      {
        title: "Software Engineer",
        department: "Engineering",
        skills: ["React", "Python", "Machine Learning"],
      },
    ],
    description:
      "Social technology company working on social media, virtual reality, and metaverse",
    size: "enterprise",
  },
  {
    name: "Amazon",
    email: "careers@amazon.com",
    role: "Software Engineer",
    industry: ["Technology", "E-commerce", "Cloud Computing"],
    technologiesUsed: [
      "Java",
      "AWS",
      "Python",
      "JavaScript",
      "React",
      "Node.js",
    ],
    openRoles: [
      {
        title: "Software Engineer",
        department: "Engineering",
        skills: ["Java", "AWS", "Cloud Computing"],
      },
    ],
    description:
      "Global technology company focusing on e-commerce, cloud computing, and AI",
    size: "enterprise",
  },
  {
    name: "Tesla",
    email: "careers@tesla.com",
    role: "Software Engineer",
    industry: ["Technology", "Automotive", "Energy"],
    technologiesUsed: [
      "Python",
      "C++",
      "React",
      "Machine Learning",
      "Computer Vision",
    ],
    openRoles: [
      {
        title: "Software Engineer",
        department: "Engineering",
        skills: ["Python", "C++", "Machine Learning"],
      },
    ],
    description:
      "Electric vehicle and clean energy company focusing on sustainable technology",
    size: "enterprise",
  },
];

export const initializeDefaultCompanies = async () => {
  try {
    // Insert companies one by one, updating if they already exist
    for (const company of defaultCompanies) {
      await Company.findOneAndUpdate(
        { name: company.name },
        {
          ...company,
          lastUpdated: new Date(),
          lastScraped: new Date(),
        },
        { upsert: true, new: true }
      );
    }
    console.log("Default companies initialized successfully");
  } catch (error) {
    console.error("Error initializing default companies:", error);
  }
};

// Run if this file is executed directly
if (process.argv[1].endsWith("defaultCompanies.js")) {
  import("../config/config.js").then(async () => {
    await initializeDefaultCompanies();
    process.exit(0);
  });
}
