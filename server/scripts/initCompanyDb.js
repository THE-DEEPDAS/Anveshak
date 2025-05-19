import mongoose from "mongoose";
import { config } from "../config/config.js";
import Company from "../models/Company.js";

// Real companies dataset focused on robotics, AI, and technology
const companies = [
  {
    name: "Cruise",
    email: "careers@getcruise.com",
    role: "Robotics Software Engineer",
    description:
      "Autonomous vehicle technology company developing self-driving cars and robotaxis",
    website: "https://www.getcruise.com",
    linkedIn: "https://www.linkedin.com/company/cruise-automation",
    domains: ["autonomous-vehicles", "robotics", "artificial-intelligence"],
    industry: ["Automotive", "Robotics", "Artificial Intelligence"],
    technologiesUsed: [
      {
        name: "C++",
        category: "language",
        expertise: "primary",
      },
      {
        name: "Python",
        category: "language",
        expertise: "primary",
      },
      {
        name: "ROS",
        category: "framework",
        expertise: "primary",
      },
    ],
    openRoles: [
      {
        title: "Robotics Software Engineer",
        department: "Engineering",
        skills: [
          {
            name: "C++",
            required: true,
            priority: "must-have",
          },
          {
            name: "ROS",
            required: true,
            priority: "must-have",
          },
        ],
        experience: {
          min: 3,
          max: 8,
          level: "senior",
        },
        location: {
          city: "San Francisco",
          state: "California",
          country: "USA",
          remote: "hybrid",
        },
        active: true,
        postedDate: new Date(),
        updatedDate: new Date(),
      },
    ],
    size: "1001-5000",
    funding: {
      status: "acquired",
      totalAmount: "10000000000",
      lastRound: {
        type: "Acquisition",
        amount: "Acquired by GM",
        date: new Date("2016-03-11"),
        investors: ["General Motors"],
      },
    },
    location: {
      headquarters: {
        city: "San Francisco",
        state: "California",
        country: "USA",
      },
    },
    products: [
      {
        name: "Cruise Origin",
        description: "Purpose-built autonomous vehicle for ridesharing",
        type: "hardware",
        technologies: ["Autonomous Systems", "LiDAR", "Computer Vision"],
      },
    ],
    companyResearch: {
      overview:
        "Autonomous vehicle technology company at the forefront of self-driving car development",
      achievements: [
        "Successfully deployed autonomous vehicles in San Francisco",
        "Developed proprietary self-driving technology stack",
        "Achieved significant milestones in safety and reliability",
      ],
      culture:
        "Strong focus on engineering excellence and safety-first approach",
      projects: [
        "Cruise Origin autonomous vehicle development",
        "Self-driving technology platform enhancement",
        "Urban mobility solutions",
      ],
      techStack: {
        frontend: ["React", "TypeScript", "WebGL"],
        backend: ["C++", "Python", "ROS"],
        devops: ["Kubernetes", "Docker", "AWS"],
        other: ["Computer Vision", "Machine Learning", "Sensor Fusion"],
      },
    },
  },
  {
    name: "Boston Dynamics",
    description:
      "Leading robotics company specializing in advanced mobile manipulation robots",
    website: "https://www.bostondynamics.com",
    linkedIn: "https://www.linkedin.com/company/boston-dynamics",
    domains: ["robotics", "mobile-manipulation", "legged-locomotion"],
    industry: ["Robotics", "Engineering", "Defense"],
    technologiesUsed: [
      {
        name: "C++",
        category: "language",
        expertise: "primary",
      },
      {
        name: "Python",
        category: "language",
        expertise: "secondary",
      },
      {
        name: "ROS",
        category: "framework",
        expertise: "primary",
      },
    ],
    openRoles: [
      {
        title: "Controls Engineer",
        department: "Engineering",
        skills: [
          {
            name: "Control Systems",
            required: true,
            priority: "must-have",
          },
          {
            name: "C++",
            required: true,
            priority: "must-have",
          },
        ],
        experience: {
          min: 5,
          max: 10,
          level: "senior",
        },
        location: {
          city: "Waltham",
          state: "Massachusetts",
          country: "USA",
          remote: "no",
        },
        active: true,
        postedDate: new Date(),
        updatedDate: new Date(),
      },
    ],
    size: "501-1000",
    funding: {
      status: "acquired",
      totalAmount: "500000000",
      lastRound: {
        type: "Acquisition",
        amount: "Acquired by Hyundai",
        date: new Date("2020-12-11"),
        investors: ["Hyundai Motor Group"],
      },
    },
    location: {
      headquarters: {
        city: "Waltham",
        state: "Massachusetts",
        country: "USA",
      },
    },
    products: [
      {
        name: "Spot",
        description: "Agile mobile robot for industrial inspection",
        type: "hardware",
        technologies: [
          "Legged Locomotion",
          "Computer Vision",
          "Autonomous Navigation",
        ],
      },
      {
        name: "Atlas",
        description: "Advanced humanoid robot for research and development",
        type: "hardware",
        technologies: [
          "Humanoid Robotics",
          "Dynamic Control",
          "Machine Learning",
        ],
      },
    ],
    companyResearch: {
      overview:
        "Leading robotics company specializing in advanced mobile manipulation robots",
      achievements: [
        "Developed the world's first commercially available bipedal robot",
        "Pioneered the use of AI and machine learning in robotics",
        "Achieved significant advancements in robot mobility and manipulation",
      ],
      culture:
        "Innovative and research-driven culture with a focus on robotics advancements",
      projects: [
        "Development of Spot, the agile mobile robot",
        "Advancements in humanoid robot capabilities",
        "Research in AI-driven robotic perception and navigation",
      ],
      techStack: {
        frontend: ["React", "Node.js"],
        backend: ["Python", "C++"],
        devops: ["Docker", "AWS", "CI/CD"],
        other: ["ROS", "OpenCV", "TensorFlow"],
      },
    },
  },
  {
    name: "Anthropic",
    description:
      "AI research company focused on developing safe and ethical AI systems",
    website: "https://www.anthropic.com",
    linkedIn: "https://www.linkedin.com/company/anthropic",
    domains: ["artificial-intelligence", "machine-learning", "AI-safety"],
    industry: ["Artificial Intelligence", "Research"],
    technologiesUsed: [
      {
        name: "Python",
        category: "language",
        expertise: "primary",
      },
      {
        name: "PyTorch",
        category: "framework",
        expertise: "primary",
      },
      {
        name: "JAX",
        category: "framework",
        expertise: "primary",
      },
    ],
    openRoles: [
      {
        title: "Research Scientist",
        department: "Research",
        skills: [
          {
            name: "Machine Learning",
            required: true,
            priority: "must-have",
          },
          {
            name: "Python",
            required: true,
            priority: "must-have",
          },
        ],
        experience: {
          min: 4,
          max: 10,
          level: "senior",
        },
        location: {
          city: "San Francisco",
          state: "California",
          country: "USA",
          remote: "hybrid",
        },
        active: true,
        postedDate: new Date(),
        updatedDate: new Date(),
      },
    ],
    size: "201-500",
    funding: {
      status: "series-c",
      totalAmount: "1300000000",
      lastRound: {
        type: "Series C",
        amount: "450000000",
        date: new Date("2023-05-23"),
        investors: ["Sam Bankman-Fried", "Dustin Moskovitz"],
      },
    },
    location: {
      headquarters: {
        city: "San Francisco",
        state: "California",
        country: "USA",
      },
    },
    products: [
      {
        name: "Claude",
        description: "Advanced AI language model focused on safety and ethics",
        type: "software",
        technologies: [
          "Natural Language Processing",
          "Machine Learning",
          "Neural Networks",
        ],
      },
    ],
    companyResearch: {
      overview:
        "AI research company focused on developing safe and ethical AI systems",
      achievements: [
        "Developed Claude, an AI language model with safety and ethical considerations",
        "Pioneered research in constitutional AI and AI alignment",
        "Contributed to open-source AI safety research and tools",
      ],
      culture:
        "Collaborative and mission-driven culture with a focus on AI safety",
      projects: [
        "Research and development of AI language models",
        "AI safety and alignment research",
        "Open-source contributions and collaborations",
      ],
      techStack: {
        frontend: ["React", "Flask"],
        backend: ["Python", "FastAPI"],
        devops: ["Docker", "Kubernetes", "AWS"],
        other: ["PyTorch", "TensorFlow", "JAX"],
      },
    },
  },
  {
    name: "TCS (Tata Consultancy Services)",
    description:
      "India's largest IT services company providing consulting, technology, and digital solutions",
    website: "https://www.tcs.com",
    linkedIn: "https://www.linkedin.com/company/tata-consultancy-services",
    domains: ["it-services", "consulting", "digital-transformation"],
    industry: ["Information Technology", "Consulting", "Digital Services"],
    technologiesUsed: [
      {
        name: "Java",
        category: "language",
        expertise: "primary",
      },
      {
        name: "Python",
        category: "language",
        expertise: "primary",
      },
      {
        name: "Cloud Technologies",
        category: "platform",
        expertise: "primary",
      },
    ],
    openRoles: [
      {
        title: "Technical Lead",
        department: "Engineering",
        skills: [
          {
            name: "Java",
            required: true,
            priority: "must-have",
          },
          {
            name: "Cloud Architecture",
            required: true,
            priority: "must-have",
          },
        ],
        experience: {
          min: 8,
          max: 12,
          level: "senior",
        },
        location: {
          city: "Mumbai",
          state: "Maharashtra",
          country: "India",
          remote: "hybrid",
        },
        active: true,
        postedDate: new Date(),
        updatedDate: new Date(),
      },
    ],
    size: "500000+",
    funding: {
      status: "public",
      totalAmount: "N/A",
      lastRound: {
        type: "Public",
        amount: "Listed on NSE/BSE",
        date: new Date("1995-08-25"),
        investors: ["Public"],
      },
    },
    location: {
      headquarters: {
        city: "Mumbai",
        state: "Maharashtra",
        country: "India",
      },
    },
    products: [
      {
        name: "TCS BaNCS",
        description: "Suite of financial solutions",
        type: "software",
        technologies: ["Banking Technology", "Financial Services", "Cloud"],
      },
    ],
    companyResearch: {
      overview:
        "India's largest IT services company providing consulting, technology, and digital solutions",
      achievements: [
        "Pioneered IT services and consulting in India",
        "Consistently ranked among the top IT service providers globally",
        "Achieved significant milestones in digital transformation and cloud services",
      ],
      culture:
        "Diverse and inclusive culture with a focus on innovation and excellence",
      projects: [
        "Large-scale IT service management and consulting projects",
        "Digital transformation initiatives for global clients",
        "Cloud migration and management projects",
      ],
      techStack: {
        frontend: ["Angular", "React"],
        backend: ["Java", "Python", "Node.js"],
        devops: ["Docker", "Kubernetes", "AWS", "Azure"],
        other: ["SAP", "Oracle", "Salesforce"],
      },
    },
  },
  {
    name: "Ather Energy",
    description:
      "Indian electric vehicle manufacturer pioneering smart electric scooters",
    website: "https://www.atherenergy.com",
    linkedIn: "https://www.linkedin.com/company/ather-energy",
    domains: ["electric-vehicles", "automotive", "clean-tech"],
    industry: ["Automotive", "Clean Energy", "Technology"],
    technologiesUsed: [
      {
        name: "C++",
        category: "language",
        expertise: "primary",
      },
      {
        name: "Python",
        category: "language",
        expertise: "primary",
      },
      {
        name: "IoT",
        category: "platform",
        expertise: "primary",
      },
    ],
    openRoles: [
      {
        title: "Embedded Systems Engineer",
        department: "Engineering",
        skills: [
          {
            name: "Embedded C++",
            required: true,
            priority: "must-have",
          },
          {
            name: "IoT",
            required: true,
            priority: "must-have",
          },
        ],
        experience: {
          min: 3,
          max: 8,
          level: "mid-senior",
        },
        location: {
          city: "Bangalore",
          state: "Karnataka",
          country: "India",
          remote: "onsite",
        },
        active: true,
        postedDate: new Date(),
        updatedDate: new Date(),
      },
    ],
    size: "1001-5000",
    funding: {
      status: "series-e",
      totalAmount: "800000000",
      lastRound: {
        type: "Series E",
        amount: "128000000",
        date: new Date("2023-01-15"),
        investors: [
          "National Investment and Infrastructure Fund",
          "Hero MotoCorp",
        ],
      },
    },
    location: {
      headquarters: {
        city: "Bangalore",
        state: "Karnataka",
        country: "India",
      },
    },
    products: [
      {
        name: "Ather 450X",
        description: "Smart electric scooter with advanced connected features",
        type: "hardware",
        technologies: ["Electric Powertrain", "IoT", "Smart Connectivity"],
      },
    ],
    companyResearch: {
      overview:
        "Indian electric vehicle manufacturer pioneering smart electric scooters",
      achievements: [
        "Launched India's first smart electric scooter, Ather 450",
        "Established a robust charging infrastructure with Ather Grid",
        "Achieved significant advancements in electric powertrain technology",
      ],
      culture:
        "Innovative and sustainability-focused culture with a passion for clean energy",
      projects: [
        "Development of next-gen electric scooters",
        "Expansion of charging infrastructure",
        "Research in battery technology and energy management systems",
      ],
      techStack: {
        frontend: ["React", "Node.js"],
        backend: ["Python", "C++"],
        devops: ["Docker", "Kubernetes", "AWS"],
        other: ["IoT", "Machine Learning", "Computer Vision"],
      },
    },
  },
  {
    name: "DeepMind",
    description: "World-leading artificial intelligence research company",
    website: "https://www.deepmind.com",
    linkedIn: "https://www.linkedin.com/company/deepmind",
    domains: ["artificial-intelligence", "machine-learning", "research"],
    industry: ["Artificial Intelligence", "Research", "Technology"],
    technologiesUsed: [
      {
        name: "Python",
        category: "language",
        expertise: "primary",
      },
      {
        name: "TensorFlow",
        category: "framework",
        expertise: "primary",
      },
      {
        name: "JAX",
        category: "framework",
        expertise: "primary",
      },
    ],
    openRoles: [
      {
        title: "Research Scientist",
        department: "Research",
        skills: [
          {
            name: "Deep Learning",
            required: true,
            priority: "must-have",
          },
          {
            name: "Python",
            required: true,
            priority: "must-have",
          },
        ],
        experience: {
          min: 5,
          max: 15,
          level: "senior",
        },
        location: {
          city: "London",
          state: "England",
          country: "UK",
          remote: "hybrid",
        },
        active: true,
        postedDate: new Date(),
        updatedDate: new Date(),
      },
    ],
    size: "1001-5000",
    funding: {
      status: "acquired",
      totalAmount: "500000000",
      lastRound: {
        type: "Acquisition",
        amount: "Acquired by Google",
        date: new Date("2014-01-26"),
        investors: ["Google"],
      },
    },
    location: {
      headquarters: {
        city: "London",
        state: "England",
        country: "UK",
      },
    },
    products: [
      {
        name: "AlphaFold",
        description: "AI system for protein structure prediction",
        type: "software",
        technologies: ["Deep Learning", "Computational Biology", "AI"],
      },
    ],
    companyResearch: {
      overview: "World-leading artificial intelligence research company",
      achievements: [
        "Developed AlphaFold, a revolutionary AI system for protein folding prediction",
        "Pioneered research in deep reinforcement learning and neural networks",
        "Contributed to significant advancements in AI safety and ethics",
      ],
      culture:
        "Cutting-edge research culture with a focus on collaboration and innovation",
      projects: [
        "Research in AI for healthcare and drug discovery",
        "Advancements in AI safety and ethical considerations",
        "Open-source AI research and tools development",
      ],
      techStack: {
        frontend: ["React", "Flask"],
        backend: ["Python", "TensorFlow", "JAX"],
        devops: ["Docker", "Kubernetes", "GCP"],
        other: ["Deep Learning", "Reinforcement Learning", "Neural Networks"],
      },
    },
  },
  {
    name: "Agnikul Cosmos",
    description:
      "Indian space technology company developing small satellite launch vehicles",
    website: "https://www.agnikul.in",
    linkedIn: "https://www.linkedin.com/company/agnikul-cosmos",
    domains: ["space-tech", "aerospace", "rockets"],
    industry: ["Aerospace", "Space Technology"],
    technologiesUsed: [
      {
        name: "CAD/CAM",
        category: "tool",
        expertise: "primary",
      },
      {
        name: "Python",
        category: "language",
        expertise: "primary",
      },
      {
        name: "3D Printing",
        category: "technology",
        expertise: "primary",
      },
    ],
    openRoles: [
      {
        title: "Propulsion Engineer",
        department: "Engineering",
        skills: [
          {
            name: "Rocket Propulsion",
            required: true,
            priority: "must-have",
          },
          {
            name: "Fluid Dynamics",
            required: true,
            priority: "must-have",
          },
        ],
        experience: {
          min: 3,
          max: 8,
          level: "mid-senior",
        },
        location: {
          city: "Chennai",
          state: "Tamil Nadu",
          country: "India",
          remote: "onsite",
        },
        active: true,
        postedDate: new Date(),
        updatedDate: new Date(),
      },
    ],
    size: "101-500",
    funding: {
      status: "series-b",
      totalAmount: "70000000",
      lastRound: {
        type: "Series B",
        amount: "20000000",
        date: new Date("2023-03-15"),
        investors: ["Mayfield India", "pi Ventures"],
      },
    },
    location: {
      headquarters: {
        city: "Chennai",
        state: "Tamil Nadu",
        country: "India",
      },
    },
    products: [
      {
        name: "Agnibaan",
        description: "Small satellite launch vehicle",
        type: "hardware",
        technologies: [
          "3D Printing",
          "Rocket Technology",
          "Propulsion Systems",
        ],
      },
    ],
    companyResearch: {
      overview:
        "Indian space technology company developing small satellite launch vehicles",
      achievements: [
        "Successfully tested India's first private rocket, Agnibaan",
        "Developed innovative 3D printing technology for rocket components",
        "Achieved significant milestones in small satellite launch capabilities",
      ],
      culture:
        "Dynamic and innovative culture with a focus on space technology advancements",
      projects: [
        "Development of Agnibaan small satellite launch vehicle",
        "Research in propulsion systems and fluid dynamics",
        "Advancements in 3D printing technology for aerospace applications",
      ],
      techStack: {
        frontend: ["React", "Node.js"],
        backend: ["Python", "CAD/CAM"],
        devops: ["Docker", "Kubernetes", "AWS"],
        other: ["3D Printing", "Rocket Propulsion", "Fluid Dynamics"],
      },
    },
  },
  {
    name: "IonQ",
    description:
      "Leading quantum computing company developing trapped-ion quantum computers",
    website: "https://ionq.com",
    linkedIn: "https://www.linkedin.com/company/ionq",
    domains: ["quantum-computing", "hardware", "research"],
    industry: ["Quantum Computing", "Technology", "Research"],
    technologiesUsed: [
      {
        name: "Python",
        category: "language",
        expertise: "primary",
      },
      {
        name: "Qiskit",
        category: "framework",
        expertise: "primary",
      },
      {
        name: "Ion Trapping",
        category: "technology",
        expertise: "primary",
      },
    ],
    openRoles: [
      {
        title: "Quantum Engineer",
        department: "Engineering",
        skills: [
          {
            name: "Quantum Computing",
            required: true,
            priority: "must-have",
          },
          {
            name: "Python",
            required: true,
            priority: "must-have",
          },
        ],
        experience: {
          min: 4,
          max: 10,
          level: "senior",
        },
        location: {
          city: "College Park",
          state: "Maryland",
          country: "USA",
          remote: "hybrid",
        },
        active: true,
        postedDate: new Date(),
        updatedDate: new Date(),
      },
    ],
    size: "101-500",
    funding: {
      status: "public",
      totalAmount: "734000000",
      lastRound: {
        type: "IPO",
        amount: "650000000",
        date: new Date("2021-10-01"),
        investors: ["Public Market"],
      },
    },
    location: {
      headquarters: {
        city: "College Park",
        state: "Maryland",
        country: "USA",
      },
    },
    products: [
      {
        name: "IonQ Aria",
        description: "32-qubit trapped-ion quantum computer",
        type: "hardware",
        technologies: ["Quantum Computing", "Ion Trapping", "Quantum Control"],
      },
    ],
    companyResearch: {
      overview:
        "Leading quantum computing company developing trapped-ion quantum computers",
      achievements: [
        "Developed the world's most powerful quantum computer, IonQ Aria",
        "Pioneered research in trapped-ion quantum computing technology",
        "Achieved significant advancements in quantum algorithm development",
      ],
      culture:
        "Innovative and research-focused culture with a passion for quantum computing",
      projects: [
        "Development of IonQ Aria quantum computer",
        "Research in quantum algorithms and software",
        "Advancements in trapped-ion quantum computing technology",
      ],
      techStack: {
        frontend: ["React", "Redux"],
        backend: ["Python", "Node.js"],
        devops: ["Docker", "Kubernetes", "AWS"],
        other: ["Qiskit", "Ion Trapping", "Quantum Algorithms"],
      },
    },
  },
  {
    name: "Moderna",
    description:
      "Biotechnology company pioneering mRNA therapeutics and vaccines",
    website: "https://www.modernatx.com",
    linkedIn: "https://www.linkedin.com/company/modernatx",
    domains: ["biotech", "pharmaceuticals", "research"],
    industry: ["Biotechnology", "Pharmaceuticals", "Healthcare"],
    technologiesUsed: [
      {
        name: "Python",
        category: "language",
        expertise: "primary",
      },
      {
        name: "R",
        category: "language",
        expertise: "primary",
      },
      {
        name: "Bioinformatics",
        category: "field",
        expertise: "primary",
      },
    ],
    openRoles: [
      {
        title: "Senior Scientist",
        department: "Research",
        skills: [
          {
            name: "Molecular Biology",
            required: true,
            priority: "must-have",
          },
          {
            name: "mRNA Technology",
            required: true,
            priority: "must-have",
          },
        ],
        experience: {
          min: 5,
          max: 15,
          level: "senior",
        },
        location: {
          city: "Cambridge",
          state: "Massachusetts",
          country: "USA",
          remote: "onsite",
        },
        active: true,
        postedDate: new Date(),
        updatedDate: new Date(),
      },
    ],
    size: "5001-10000",
    funding: {
      status: "public",
      totalAmount: "N/A",
      lastRound: {
        type: "IPO",
        amount: "604000000",
        date: new Date("2018-12-07"),
        investors: ["Public Market"],
      },
    },
    location: {
      headquarters: {
        city: "Cambridge",
        state: "Massachusetts",
        country: "USA",
      },
    },
    products: [
      {
        name: "Spikevax",
        description: "mRNA-based COVID-19 vaccine",
        type: "biotech",
        technologies: [
          "mRNA Technology",
          "Vaccine Development",
          "Bioinformatics",
        ],
      },
    ],
    companyResearch: {
      overview:
        "Biotechnology company pioneering mRNA therapeutics and vaccines",
      achievements: [
        "Developed the first mRNA vaccine, Spikevax, for COVID-19",
        "Pioneered research in mRNA technology and its applications",
        "Contributed to significant advancements in vaccine development and infectious diseases",
      ],
      culture:
        "Mission-driven culture with a focus on innovation and scientific excellence",
      projects: [
        "Research and development of mRNA therapeutics and vaccines",
        "Advancements in vaccine delivery and formulation technologies",
        "Collaborations for global health initiatives and pandemic response",
      ],
      techStack: {
        frontend: ["React", "Redux"],
        backend: ["Python", "Node.js"],
        devops: ["Docker", "Kubernetes", "AWS"],
        other: ["mRNA Technology", "Bioinformatics", "Vaccine Development"],
      },
    },
  },
  {
    name: "Zerodha",
    description:
      "India's largest retail stockbroker revolutionizing trading and investing",
    website: "https://zerodha.com",
    linkedIn: "https://www.linkedin.com/company/zerodha",
    domains: ["fintech", "trading", "investment"],
    industry: ["Financial Services", "Technology", "Trading"],
    technologiesUsed: [
      {
        name: "Python",
        category: "language",
        expertise: "primary",
      },
      {
        name: "Go",
        category: "language",
        expertise: "primary",
      },
      {
        name: "Vue.js",
        category: "framework",
        expertise: "primary",
      },
    ],
    openRoles: [
      {
        title: "Backend Developer",
        department: "Engineering",
        skills: [
          {
            name: "Go",
            required: true,
            priority: "must-have",
          },
          {
            name: "Distributed Systems",
            required: true,
            priority: "must-have",
          },
        ],
        experience: {
          min: 3,
          max: 8,
          level: "mid-senior",
        },
        location: {
          city: "Bangalore",
          state: "Karnataka",
          country: "India",
          remote: "hybrid",
        },
        active: true,
        postedDate: new Date(),
        updatedDate: new Date(),
      },
    ],
    size: "1001-5000",
    funding: {
      status: "bootstrapped",
      totalAmount: "Self-funded",
      lastRound: {
        type: "Bootstrapped",
        amount: "N/A",
        date: new Date("2010-01-01"),
        investors: ["Self-funded"],
      },
    },
    location: {
      headquarters: {
        city: "Bangalore",
        state: "Karnataka",
        country: "India",
      },
    },
    products: [
      {
        name: "Kite",
        description: "Modern trading and investment platform",
        type: "software",
        technologies: ["Trading Systems", "Real-time Data", "Web Technologies"],
      },
    ],
    companyResearch: {
      overview:
        "India's largest retail stockbroker revolutionizing trading and investing",
      achievements: [
        "Launched Zerodha Kite, a pioneering trading platform in India",
        "Introduced innovative pricing models disrupting traditional brokerage",
        "Achieved significant growth in retail participation in stock markets",
      ],
      culture:
        "Customer-centric and innovative culture with a focus on financial empowerment",
      projects: [
        "Development of Zerodha Kite trading platform",
        "Research in algorithmic trading and market analytics",
        "Initiatives for investor education and awareness",
      ],
      techStack: {
        frontend: ["Angular", "React"],
        backend: ["Python", "Go", "Node.js"],
        devops: ["Docker", "Kubernetes", "AWS"],
        other: ["WebSockets", "REST APIs", "SQL/NoSQL Databases"],
      },
    },
  },
  {
    name: "Razorpay",
    description:
      "Indian fintech company providing payment solutions and banking services",
    website: "https://razorpay.com",
    linkedIn: "https://www.linkedin.com/company/razorpay",
    domains: ["fintech", "payments", "banking"],
    industry: ["Financial Technology", "Payments", "Banking"],
    technologiesUsed: [
      {
        name: "Node.js",
        category: "language",
        expertise: "primary",
      },
      {
        name: "Python",
        category: "language",
        expertise: "primary",
      },
      {
        name: "React",
        category: "framework",
        expertise: "primary",
      },
    ],
    openRoles: [
      {
        title: "Senior Software Engineer",
        department: "Engineering",
        skills: [
          {
            name: "Node.js",
            required: true,
            priority: "must-have",
          },
          {
            name: "Microservices",
            required: true,
            priority: "must-have",
          },
        ],
        experience: {
          min: 4,
          max: 8,
          level: "senior",
        },
        location: {
          city: "Bangalore",
          state: "Karnataka",
          country: "India",
          remote: "hybrid",
        },
        active: true,
        postedDate: new Date(),
        updatedDate: new Date(),
      },
    ],
    size: "1001-5000",
    funding: {
      status: "series-f",
      totalAmount: "2100000000",
      lastRound: {
        type: "Series F",
        amount: "375000000",
        date: new Date("2021-12-19"),
        investors: ["Lone Pine Capital", "Alkeon Capital"],
      },
    },
    location: {
      headquarters: {
        city: "Bangalore",
        state: "Karnataka",
        country: "India",
      },
    },
    products: [
      {
        name: "Payment Gateway",
        description: "Complete payment processing solution",
        type: "software",
        technologies: ["Payment Processing", "Banking APIs", "Security"],
      },
    ],
    companyResearch: {
      overview:
        "Indian fintech company providing payment solutions and banking services",
      achievements: [
        "Launched Razorpay Payment Gateway, a comprehensive payment processing solution",
        "Pioneered the use of UPI in merchant payments",
        "Achieved significant growth in transaction volume and merchant adoption",
      ],
      culture:
        "Dynamic and customer-focused culture with a passion for fintech innovation",
      projects: [
        "Development of Razorpay Payment Gateway",
        "Research in payment security and fraud detection",
        "Initiatives for financial inclusion and digital banking",
      ],
      techStack: {
        frontend: ["React", "Redux"],
        backend: ["Node.js", "Python", "Java"],
        devops: ["Docker", "Kubernetes", "AWS"],
        other: ["UPI", "PCI DSS Compliance", "Payment Analytics"],
      },
    },
  },
  {
    name: "Rigetti Computing",
    description:
      "Quantum computing company developing superconducting quantum processors",
    website: "https://www.rigetti.com",
    linkedIn: "https://www.linkedin.com/company/rigetti",
    domains: ["quantum-computing", "hardware", "research"],
    industry: ["Quantum Computing", "Technology", "Research"],
    technologiesUsed: [
      {
        name: "Python",
        category: "language",
        expertise: "primary",
      },
      {
        name: "Quil",
        category: "framework",
        expertise: "primary",
      },
      {
        name: "Forest SDK",
        category: "framework",
        expertise: "primary",
      },
    ],
    openRoles: [
      {
        title: "Quantum Hardware Engineer",
        department: "Engineering",
        skills: [
          {
            name: "Quantum Electronics",
            required: true,
            priority: "must-have",
          },
          {
            name: "Superconducting Circuits",
            required: true,
            priority: "must-have",
          },
        ],
        experience: {
          min: 4,
          max: 10,
          level: "senior",
        },
        location: {
          city: "Berkeley",
          state: "California",
          country: "USA",
          remote: "onsite",
        },
        active: true,
        postedDate: new Date(),
        updatedDate: new Date(),
      },
    ],
    size: "101-500",
    funding: {
      status: "public",
      totalAmount: "200000000",
      lastRound: {
        type: "SPAC",
        amount: "1500000000",
        date: new Date("2022-03-02"),
        investors: ["Public Market"],
      },
    },
    location: {
      headquarters: {
        city: "Berkeley",
        state: "California",
        country: "USA",
      },
    },
    products: [
      {
        name: "Aspen Processors",
        description: "Superconducting quantum processors",
        type: "hardware",
        technologies: [
          "Quantum Computing",
          "Superconducting Circuits",
          "Quantum Control",
        ],
      },
    ],
    companyResearch: {
      overview:
        "Quantum computing company developing superconducting quantum processors",
      achievements: [
        "Developed the world's first quantum computer with superconducting qubits",
        "Pioneered research in quantum machine learning and quantum software",
        "Achieved significant advancements in quantum hardware and algorithms",
      ],
      culture:
        "Innovative and research-driven culture with a focus on quantum technologies",
      projects: [
        "Development of Aspen superconducting quantum processors",
        "Research in quantum algorithms and machine learning",
        "Advancements in quantum hardware and software integration",
      ],
      techStack: {
        frontend: ["React", "Node.js"],
        backend: ["Python", "Quil"],
        devops: ["Docker", "Kubernetes", "AWS"],
        other: [
          "Quantum Computing",
          "Superconducting Circuits",
          "Quantum Algorithms",
        ],
      },
    },
  },
  {
    name: "Tesla",
    description: "Leading electric vehicle and clean energy company",
    website: "https://www.tesla.com",
    linkedIn: "https://www.linkedin.com/company/tesla-motors",
    domains: ["electric-vehicles", "energy", "autonomous-driving"],
    industry: ["Automotive", "Energy", "Technology"],
    technologiesUsed: [
      {
        name: "C++",
        category: "language",
        expertise: "primary",
      },
      {
        name: "Python",
        category: "language",
        expertise: "primary",
      },
      {
        name: "CUDA",
        category: "framework",
        expertise: "primary",
      },
    ],
    openRoles: [
      {
        title: "Autopilot Software Engineer",
        department: "Engineering",
        skills: [
          {
            name: "Computer Vision",
            required: true,
            priority: "must-have",
          },
          {
            name: "C++",
            required: true,
            priority: "must-have",
          },
        ],
        experience: {
          min: 5,
          max: 12,
          level: "senior",
        },
        location: {
          city: "Palo Alto",
          state: "California",
          country: "USA",
          remote: "hybrid",
        },
        active: true,
        postedDate: new Date(),
        updatedDate: new Date(),
      },
    ],
    size: "100000+",
    funding: {
      status: "public",
      totalAmount: "N/A",
      lastRound: {
        type: "IPO",
        amount: "226000000",
        date: new Date("2010-06-29"),
        investors: ["Public Market"],
      },
    },
    location: {
      headquarters: {
        city: "Austin",
        state: "Texas",
        country: "USA",
      },
    },
    products: [
      {
        name: "Model S",
        description: "Premium electric sedan",
        type: "hardware",
        technologies: [
          "Electric Powertrain",
          "Autopilot",
          "Battery Technology",
        ],
      },
      {
        name: "Powerwall",
        description: "Home battery system",
        type: "hardware",
        technologies: ["Energy Storage", "Power Electronics", "Smart Grid"],
      },
    ],
    companyResearch: {
      overview: "Leading electric vehicle and clean energy company",
      achievements: [
        "Developed the first highway-capable autonomous vehicle",
        "Pioneered the use of AI and machine learning in self-driving cars",
        "Achieved significant advancements in battery technology and energy storage",
      ],
      culture:
        "Innovative and mission-driven culture with a focus on sustainability and technology",
      projects: [
        "Development of Tesla Autopilot and Full Self-Driving features",
        "Advancements in battery technology and energy solutions",
        "Research in sustainable energy and transportation systems",
      ],
      techStack: {
        frontend: ["React", "Redux"],
        backend: ["Python", "C++", "CUDA"],
        devops: ["Docker", "Kubernetes", "AWS"],
        other: ["TensorFlow", "OpenCV", "ROS"],
      },
    },
  },
];

async function initializeDatabase() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(config.mongodb.uri);
    console.log("Connected to MongoDB");

    // Clear existing data
    await Company.deleteMany({});
    console.log("Cleared existing companies");

    // Insert new companies with proper validation and error handling
    for (const companyData of companies) {
      // Ensure required fields: email and role
      if (!companyData.email) {
        // Try to infer domain from website, fallback to generic
        let domain = "example.com";
        if (companyData.website) {
          try {
            domain = new URL(companyData.website).hostname.replace(
              /^www\./,
              ""
            );
          } catch {}
        }
        companyData.email = `careers@${domain}`;
      }
      if (!companyData.role) {
        // Use first openRole title if available, else fallback
        if (
          Array.isArray(companyData.openRoles) &&
          companyData.openRoles.length > 0 &&
          companyData.openRoles[0].title
        ) {
          companyData.role = companyData.openRoles[0].title;
        } else {
          companyData.role = "Software Engineer";
        }
      }
      try {
        // Normalize companyResearch and techStack
        if (companyData.companyResearch) {
          companyData.companyResearch = {
            overview: companyData.companyResearch.overview || "",
            achievements: Array.isArray(
              companyData.companyResearch.achievements
            )
              ? companyData.companyResearch.achievements
              : [],
            culture: companyData.companyResearch.culture || "",
            projects: Array.isArray(companyData.companyResearch.projects)
              ? companyData.companyResearch.projects
              : [],
            techStack: {
              frontend: Array.isArray(
                companyData.companyResearch.techStack?.frontend
              )
                ? companyData.companyResearch.techStack.frontend
                : [],
              backend: Array.isArray(
                companyData.companyResearch.techStack?.backend
              )
                ? companyData.companyResearch.techStack.backend
                : [],
              devops: Array.isArray(
                companyData.companyResearch.techStack?.devops
              )
                ? companyData.companyResearch.techStack.devops
                : [],
              other: Array.isArray(companyData.companyResearch.techStack?.other)
                ? companyData.companyResearch.techStack.other
                : [],
            },
          };
        }

        const company = new Company(companyData);
        await company.save();
        console.log(`Added company: ${company.name}`);
      } catch (error) {
        console.error(
          `Error adding company ${companyData.name}:`,
          error.message
        );
      }
    }

    console.log("Database initialization complete");
  } catch (error) {
    console.error("Database initialization failed:", error);
  } finally {
    await mongoose.connection.close();
    console.log("Database connection closed");
  }
}

// Run the initialization
initializeDatabase();
