import mongoose from "mongoose";
import { config } from "../config/config.js";
import Institution from "../models/Institution.js";
import Faculty from "../models/Faculty.js";

const sampleInstitutions = [
  {
    name: "Indian Institute of Technology, Bombay",
    type: "IIT",
    location: "Mumbai, Maharashtra",
    departments: [
      "Computer Science",
      "Mechanical Engineering",
      "Aerospace Engineering",
      "Electrical Engineering",
    ],
    website: "https://www.iitb.ac.in",
  },
  {
    name: "Indian Institute of Technology, Delhi",
    type: "IIT",
    location: "New Delhi",
    departments: [
      "Computer Science",
      "Electrical Engineering",
      "Mechanical Engineering",
    ],
    website: "https://www.iitd.ac.in",
  },
  {
    name: "Indian Institute of Technology, Madras",
    type: "IIT",
    location: "Chennai, Tamil Nadu",
    departments: ["Robotics", "AI/ML", "Mechanical Engineering"],
    website: "https://www.iitm.ac.in",
  },
  {
    name: "Indian Space Research Organisation, Bangalore",
    type: "ISRO",
    location: "Bangalore, Karnataka",
    departments: [
      "Remote Sensing",
      "Space Technology",
      "Satellite Communications",
      "Rocket Propulsion",
    ],
    website: "https://www.isro.gov.in",
  },
  {
    name: "Defence Research and Development Organisation, Delhi",
    type: "DRDO",
    location: "New Delhi",
    departments: [
      "Aeronautics",
      "Combat Vehicles",
      "Naval Systems",
      "Missiles",
    ],
    website: "https://www.drdo.gov.in",
  },
  {
    name: "Indian Institute of Science Education and Research, Pune",
    type: "IISER",
    location: "Pune, Maharashtra",
    departments: ["Data Science", "Physics", "Chemistry", "Biology"],
    website: "http://www.iiserpune.ac.in",
  },
  {
    name: "National Institute of Technology, Trichy",
    type: "NIT",
    location: "Tiruchirappalli, Tamil Nadu",
    departments: ["Computer Science", "Electronics", "Mechanical"],
    website: "https://www.nitt.edu",
  },
  {
    name: "Indian Institute of Information Technology, Allahabad",
    type: "IIIT",
    location: "Allahabad, Uttar Pradesh",
    departments: ["IT", "Electronics", "Applied Sciences"],
    website: "https://www.iiita.ac.in",
  },
  {
    name: "Indian Institute of Space Science and Technology",
    type: "IIST",
    location: "Thiruvananthapuram, Kerala",
    departments: ["Aerospace", "Avionics", "Space Technology"],
    website: "https://www.iist.ac.in",
  },
  {
    name: "National Institute of Science Education and Research",
    type: "NISER",
    location: "Bhubaneswar, Odisha",
    departments: ["Physics", "Chemistry", "Mathematics", "Computer Science"],
    website: "https://www.niser.ac.in",
  },
  {
    name: "Indian Institute of Science",
    type: "IISc",
    location: "Bangalore, Karnataka",
    departments: ["Computer Science", "AI/ML", "Robotics", "Aerospace"],
    website: "https://www.iisc.ac.in",
  },
  {
    name: "Indian Institute of Technology, Kanpur",
    type: "IIT",
    location: "Kanpur, Uttar Pradesh",
    departments: [
      "Computer Science",
      "Aerospace Engineering",
      "Mechanical Engineering",
    ],
    website: "https://www.iitk.ac.in",
  },
  {
    name: "Indian Institute of Technology, Kharagpur",
    type: "IIT",
    location: "Kharagpur, West Bengal",
    departments: [
      "Computer Science",
      "Robotics and AI",
      "Mechanical Engineering",
    ],
    website: "https://www.iitkgp.ac.in",
  },
];

const sampleFaculty = [
  // IIT Bombay Faculty - Drone and AI Specialists
  {
    name: "Dr. Venkat Raman",
    department: "Aerospace Engineering",
    researchInterests: [
      "drone swarms",
      "autonomous UAVs",
      "AI in aviation",
      "flight control",
    ],
    portfolio: "https://www.iitb.ac.in/~venkat",
    publications: [
      "Swarm Intelligence for UAV Coordination",
      "AI-Driven Flight Control Systems",
      "Multi-Agent Drone Networks",
    ],
    projects: [
      "Urban Air Mobility Platform",
      "Autonomous Drone Swarms",
      "Smart Aviation Systems",
    ],
    email: "venkat.raman@iitb.ac.in",
    emailStatus: "not_contacted",
  },
  {
    name: "Dr. Priya Mehta",
    department: "Computer Science",
    researchInterests: [
      "computer vision",
      "deep learning",
      "drone perception",
      "autonomous systems",
    ],
    portfolio: "https://www.iitb.ac.in/~priya",
    publications: [
      "Vision-Based Drone Navigation",
      "Deep Learning for Aerial Perception",
      "Real-time Object Detection in UAVs",
    ],
    projects: [
      "Aerial Vision Systems",
      "Drone Object Recognition",
      "Autonomous Navigation Platform",
    ],
    email: "priya.mehta@iitb.ac.in",
    emailStatus: "not_contacted",
  },

  // IIT Delhi - AI and Robotics Experts
  {
    name: "Dr. Arun Kumar",
    department: "Computer Science",
    researchInterests: [
      "artificial intelligence",
      "machine learning",
      "robotics",
      "autonomous systems",
    ],
    portfolio: "https://www.iitd.ac.in/~arun",
    publications: [
      "Advanced AI Architectures",
      "Robot Learning Systems",
      "Autonomous Decision Making",
    ],
    projects: [
      "AI Research Platform",
      "Robotic Learning Framework",
      "Intelligent Systems Lab",
    ],
    email: "arun.kumar@iitd.ac.in",
    emailStatus: "not_contacted",
  },
  {
    name: "Dr. Shalini Singh",
    department: "Electrical Engineering",
    researchInterests: [
      "drone electronics",
      "embedded AI",
      "sensor fusion",
      "autonomous systems",
    ],
    portfolio: "https://www.iitd.ac.in/~shalini",
    publications: [
      "Embedded AI for Drones",
      "Smart Sensor Integration",
      "Real-time Control Systems",
    ],
    projects: [
      "Smart Drone Platform",
      "Autonomous Control Systems",
      "Intelligent Sensor Networks",
    ],
    email: "shalini.singh@iitd.ac.in",
    emailStatus: "not_contacted",
  },

  // IIT Madras - Advanced Computing
  {
    name: "Dr. Ramesh Babu",
    department: "AI/ML",
    researchInterests: [
      "deep learning",
      "neural networks",
      "AI optimization",
      "machine learning",
    ],
    portfolio: "https://www.iitm.ac.in/~ramesh",
    publications: [
      "Advanced Neural Architectures",
      "Deep Learning Optimization",
      "AI System Design",
    ],
    projects: [
      "Neural Computing Platform",
      "AI Research Lab",
      "Machine Learning Systems",
    ],
    email: "ramesh.babu@iitm.ac.in",
    emailStatus: "not_contacted",
  },

  // IIT Kanpur - Drone Technologies
  {
    name: "Dr. Arjun Sharma",
    department: "Aerospace Engineering",
    researchInterests: [
      "UAV design",
      "drone aerodynamics",
      "autonomous flight",
      "control systems",
    ],
    portfolio: "https://www.iitk.ac.in/~arjun",
    publications: [
      "Advanced UAV Design Principles",
      "Autonomous Flight Systems",
      "Drone Control Architecture",
    ],
    projects: [
      "Next-Gen UAV Platform",
      "Autonomous Flight Lab",
      "Drone Research Center",
    ],
    email: "arjun.sharma@iitk.ac.in",
    emailStatus: "not_contacted",
  },

  // IIT Kharagpur - Robotics and AI
  {
    name: "Dr. Divya Patel",
    department: "Computer Science",
    researchInterests: [
      "robotics",
      "AI",
      "computer vision",
      "autonomous systems",
    ],
    portfolio: "https://www.iitkgp.ac.in/~divya",
    publications: [
      "Robot Vision Systems",
      "AI in Robotics",
      "Autonomous Robot Control",
    ],
    projects: [
      "Robotics Research Lab",
      "AI Vision Platform",
      "Autonomous Systems",
    ],
    email: "divya.patel@iitkgp.ac.in",
    emailStatus: "not_contacted",
  },

  // IISc - AI and Robotics
  {
    name: "Dr. Rohit Verma",
    department: "Computer Science",
    researchInterests: [
      "AI systems",
      "machine learning",
      "robotics",
      "autonomous control",
    ],
    portfolio: "https://www.iisc.ac.in/~rohit",
    publications: [
      "AI System Architecture",
      "Machine Learning in Robotics",
      "Autonomous Control Design",
    ],
    projects: ["AI Systems Lab", "Robotics Platform", "Autonomous Research"],
    email: "rohit.verma@iisc.ac.in",
    emailStatus: "not_contacted",
  },

  // Additional Drone Specialists
  {
    name: "Dr. Nandini Rao",
    department: "Aerospace Engineering",
    researchInterests: [
      "drone systems",
      "UAV navigation",
      "autonomous flight",
      "aerial robotics",
    ],
    portfolio: "https://www.iitm.ac.in/~nandini",
    publications: [
      "Drone Navigation Systems",
      "Autonomous UAV Control",
      "Aerial Robotics Design",
    ],
    projects: [
      "UAV Research Lab",
      "Drone Navigation Platform",
      "Autonomous Flight Systems",
    ],
    email: "nandini.rao@iitm.ac.in",
    emailStatus: "not_contacted",
  },
  {
    name: "Dr. Rajiv Mehta",
    department: "Mechanical Engineering",
    researchInterests: [
      "drone mechanics",
      "UAV design",
      "aerial systems",
      "robotics",
    ],
    portfolio: "https://www.iitb.ac.in/~rajiv",
    publications: [
      "Mechanical Design of UAVs",
      "Drone System Integration",
      "Aerial Robot Mechanics",
    ],
    projects: [
      "Drone Design Lab",
      "Aerial Systems Platform",
      "Robotics Integration",
    ],
    email: "rajiv.mehta@iitb.ac.in",
    emailStatus: "not_contacted",
  },

  // AI Research Specialists
  {
    name: "Dr. Meena Iyer",
    department: "AI/ML",
    researchInterests: [
      "artificial intelligence",
      "deep learning",
      "neural networks",
      "machine learning",
    ],
    portfolio: "https://www.iisc.ac.in/~meena",
    publications: [
      "Advanced AI Frameworks",
      "Deep Learning Systems",
      "Neural Network Design",
    ],
    projects: [
      "AI Research Center",
      "Machine Learning Lab",
      "Neural Computing Platform",
    ],
    email: "meena.iyer@iisc.ac.in",
    emailStatus: "not_contacted",
  },
  {
    name: "Dr. Sameer Mathur",
    department: "Computer Science",
    researchInterests: [
      "AI systems",
      "machine learning",
      "computer vision",
      "deep learning",
    ],
    portfolio: "https://www.iitd.ac.in/~sameer",
    publications: [
      "AI System Architecture",
      "Machine Learning Platforms",
      "Computer Vision Systems",
    ],
    projects: [
      "AI Research Lab",
      "Vision Computing Center",
      "Machine Learning Platform",
    ],
    email: "sameer.mathur@iitd.ac.in",
    emailStatus: "not_contacted",
  },
  {
    name: "Dr. Karthik Ranganathan",
    department: "Computer Science",
    researchInterests: [
      "artificial intelligence",
      "machine learning",
      "reinforcement learning",
    ],
    portfolio: "https://www.iisc.ac.in/~karthik",
    publications: [
      "Large Language Models",
      "Reinforcement Learning Systems",
      "AI for Scientific Discovery",
    ],
    projects: [
      "Advanced AI Agents",
      "Scientific AI Platform",
      "AI Research Framework",
    ],
    email: "karthik.r@iisc.ac.in",
    emailStatus: "not_contacted",
  },
  {
    name: "Dr. Sarita Devi",
    department: "Data Science",
    researchInterests: ["big data", "data analytics", "machine learning"],
    portfolio: "https://www.iisc.ac.in/~sarita",
    publications: [
      "Big Data Analytics",
      "Predictive Modeling",
      "Data Mining Techniques",
    ],
    projects: [
      "Data Analysis Platform",
      "Predictive Analytics",
      "Machine Learning Systems",
    ],
    email: "sarita.devi@iisc.ac.in",
    emailStatus: "not_contacted",
  },
  {
    name: "Dr. Sunita Rao",
    department: "Aerospace Engineering",
    researchInterests: ["drone swarms", "UAV networks", "aerial robotics"],
    portfolio: "https://www.iisc.ac.in/~sunita",
    publications: [
      "Swarm Intelligence in UAVs",
      "Networked Drone Systems",
      "Aerial Robot Coordination",
    ],
    projects: [
      "Urban Drone Network",
      "Swarm Robotics Platform",
      "Emergency Response Fleet",
    ],
    email: "sunita.rao@iisc.ac.in",
    emailStatus: "not_contacted",
  },

  // Computer Vision and AI Experts
  {
    name: "Dr. Anita Desai",
    department: "Computer Science",
    researchInterests: [
      "computer vision",
      "deep learning",
      "AI",
      "image processing",
    ],
    portfolio: "https://www.iitkgp.ac.in/~anita",
    publications: [
      "Advanced Computer Vision",
      "Deep Learning for Vision",
      "AI in Image Processing",
    ],
    projects: [
      "Vision Research Lab",
      "AI Imaging Platform",
      "Deep Learning Systems",
    ],
    email: "anita.desai@iitkgp.ac.in",
    emailStatus: "not_contacted",
  },
  {
    name: "Dr. Rahul Mishra",
    department: "AI/ML",
    researchInterests: [
      "artificial intelligence",
      "machine learning",
      "neural networks",
      "AI ethics",
    ],
    portfolio: "https://www.iitk.ac.in/~rahul",
    publications: [
      "Ethical AI Development",
      "Machine Learning Systems",
      "Neural Network Design",
    ],
    projects: [
      "AI Ethics Lab",
      "Machine Learning Center",
      "Neural Computing Research",
    ],
    email: "rahul.mishra@iitk.ac.in",
    emailStatus: "not_contacted",
  },

  // Robotics and Automation Experts
  {
    name: "Dr. Vikram Shah",
    department: "Robotics",
    researchInterests: ["robotics", "automation", "AI", "control systems"],
    portfolio: "https://www.iitb.ac.in/~vikram",
    publications: [
      "Advanced Robotics Systems",
      "AI in Automation",
      "Robot Control Design",
    ],
    projects: [
      "Robotics Research Center",
      "Automation Lab",
      "Control Systems Platform",
    ],
    email: "vikram.shah@iitb.ac.in",
    emailStatus: "not_contacted",
  },
  {
    name: "Dr. Priyanka Reddy",
    department: "Mechanical Engineering",
    researchInterests: [
      "robotics",
      "mechatronics",
      "automation",
      "control systems",
    ],
    portfolio: "https://www.iitm.ac.in/~priyanka",
    publications: ["Mechatronic Systems", "Robot Design", "Automation Control"],
    projects: ["Robotics Lab", "Mechatronics Center", "Automation Research"],
    email: "priyanka.reddy@iitm.ac.in",
    emailStatus: "not_contacted",
  },

  // More Drone and UAV Specialists
  {
    name: "Dr. Aditya Kumar",
    department: "Aerospace Engineering",
    researchInterests: [
      "UAV systems",
      "drone design",
      "autonomous flight",
      "control",
    ],
    portfolio: "https://www.iitk.ac.in/~aditya",
    publications: [
      "UAV System Design",
      "Autonomous Flight Control",
      "Drone Navigation",
    ],
    projects: ["UAV Research Center", "Drone Lab", "Flight Control Systems"],
    email: "aditya.kumar@iitk.ac.in",
    emailStatus: "not_contacted",
  },
  {
    name: "Dr. Sneha Gupta",
    department: "Electrical Engineering",
    researchInterests: [
      "drone electronics",
      "control systems",
      "autonomous systems",
    ],
    portfolio: "https://www.iitd.ac.in/~sneha",
    publications: [
      "Drone Electronic Systems",
      "Control Architecture",
      "Autonomous Electronics",
    ],
    projects: [
      "Drone Electronics Lab",
      "Control Systems Research",
      "Autonomous Platforms",
    ],
    email: "sneha.gupta@iitd.ac.in",
    emailStatus: "not_contacted",
  },

  // AI and Machine Learning Experts
  {
    name: "Dr. Naveen Kumar",
    department: "Computer Science",
    researchInterests: [
      "artificial intelligence",
      "deep learning",
      "machine learning",
    ],
    portfolio: "https://www.iisc.ac.in/~naveen",
    publications: [
      "AI System Design",
      "Deep Learning Architecture",
      "Machine Learning Platforms",
    ],
    projects: [
      "AI Research Lab",
      "Deep Learning Center",
      "ML Systems Platform",
    ],
    email: "naveen.kumar@iisc.ac.in",
    emailStatus: "not_contacted",
  },
  {
    name: "Dr. Anjali Menon",
    department: "AI/ML",
    researchInterests: [
      "AI",
      "neural networks",
      "machine learning",
      "deep learning",
    ],
    portfolio: "https://www.iitm.ac.in/~anjali",
    publications: [
      "Neural Network Systems",
      "AI Platform Design",
      "Machine Learning Research",
    ],
    projects: [
      "AI Systems Lab",
      "Neural Computing Center",
      "ML Research Platform",
    ],
    email: "anjali.menon@iitm.ac.in",
    emailStatus: "not_contacted",
  },

  // Additional AI and Robotics Specialists
  {
    name: "Dr. Mohan Rao",
    department: "Robotics and AI",
    researchInterests: ["robotics", "AI", "automation", "control systems"],
    portfolio: "https://www.iitkgp.ac.in/~mohan",
    publications: [
      "Robotic AI Systems",
      "Automation Control",
      "AI in Robotics",
    ],
    projects: [
      "Robotics AI Lab",
      "Automation Research",
      "Control Systems Center",
    ],
    email: "mohan.rao@iitkgp.ac.in",
    emailStatus: "not_contacted",
  },
  {
    name: "Dr. Deepika Singh",
    department: "Computer Science",
    researchInterests: [
      "AI",
      "machine learning",
      "computer vision",
      "robotics",
    ],
    portfolio: "https://www.iitb.ac.in/~deepika",
    publications: [
      "AI Vision Systems",
      "Machine Learning in Robotics",
      "Computer Vision AI",
    ],
    projects: ["AI Vision Lab", "Robotics Research", "ML Systems Platform"],
    email: "deepika.singh@iitb.ac.in",
    emailStatus: "not_contacted",
  },
];

// Database initialization functions
const institutionMap = {};

async function createInstitutions() {
  for (const inst of sampleInstitutions) {
    const institution = new Institution(inst);
    try {
      const saved = await institution.save();
      institutionMap[inst.name] = saved._id;
    } catch (error) {
      console.error(`Error creating institution ${inst.name}:`, error);
    }
  }
  console.log("Institutions created");
}

async function createFaculty() {
  for (let faculty of sampleFaculty) {
    let matchingInstitution = null;

    // Enhanced institution matching
    if (faculty.email.includes("iisc")) {
      matchingInstitution = institutionMap["Indian Institute of Science"];
    } else if (faculty.email.includes("iitb")) {
      matchingInstitution =
        institutionMap["Indian Institute of Technology, Bombay"];
    } else if (faculty.email.includes("iitd")) {
      matchingInstitution =
        institutionMap["Indian Institute of Technology, Delhi"];
    } else if (faculty.email.includes("iitm")) {
      matchingInstitution =
        institutionMap["Indian Institute of Technology, Madras"];
    } else if (faculty.email.includes("iitk")) {
      matchingInstitution =
        institutionMap["Indian Institute of Technology, Kanpur"];
    } else if (faculty.email.includes("iitkgp")) {
      matchingInstitution =
        institutionMap["Indian Institute of Technology, Kharagpur"];
    } else if (faculty.email.includes("isro")) {
      matchingInstitution =
        institutionMap["Indian Space Research Organisation, Bangalore"];
    } else if (faculty.email.includes("drdo")) {
      matchingInstitution =
        institutionMap["Defence Research and Development Organisation, Delhi"];
    } else if (faculty.email.includes("iiser")) {
      matchingInstitution =
        institutionMap[
          "Indian Institute of Science Education and Research, Pune"
        ];
    } else if (faculty.email.includes("nitt")) {
      matchingInstitution =
        institutionMap["National Institute of Technology, Trichy"];
    } else if (faculty.email.includes("iiita")) {
      matchingInstitution =
        institutionMap["Indian Institute of Information Technology, Allahabad"];
    } else if (faculty.email.includes("iist")) {
      matchingInstitution =
        institutionMap["Indian Institute of Space Science and Technology"];
    } else if (faculty.email.includes("niser")) {
      matchingInstitution =
        institutionMap["National Institute of Science Education and Research"];
    }

    if (matchingInstitution) {
      const facultyDoc = new Faculty({
        ...faculty,
        institution: matchingInstitution,
        emailStatus: "not_sent",
      });
      try {
        await facultyDoc.save();
      } catch (error) {
        console.error(`Error creating faculty ${faculty.name}:`, error);
      }
    } else {
      console.warn(
        `No matching institution found for faculty ${faculty.name} with email ${faculty.email}`
      );
    }
  }
  console.log("Faculty created");
}

async function initializeDatabase() {
  try {
    await mongoose.connect(config.mongodb.uri);
    console.log("Connected to MongoDB");

    await Promise.all([Institution.deleteMany({}), Faculty.deleteMany({})]);
    console.log("Cleared existing data");

    await createInstitutions();
    await createFaculty();

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
