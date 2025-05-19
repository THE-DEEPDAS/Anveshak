import dotenv from "dotenv";
import { generateResearchEmail } from "./services/aiService.js";
import mongoose from "mongoose";
import Resume from "./models/Resume.js";
import Faculty from "./models/Faculty.js";
import { matchCandidateToFaculty } from "./services/academicEmailService.js";
import config from "./config/config.js";

// Load environment variables
dotenv.config();

/**
 * This script tests the academic email route flow by:
 * 1. Connecting to the database
 * 2. Retrieving actual user and faculty data
 * 3. Testing the matching process
 * 4. Testing the email generation with the matched data
 * 5. Logging each step of the process with detailed data
 */
async function testAcademicEmailRoute() {
  try {
    // Connect to MongoDB
    console.log("Connecting to MongoDB...");
    await mongoose.connect(config.mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB Connected!");

    // Get a sample resume from the database
    const resume = await Resume.findOne().populate("user");
    if (!resume) {
      console.error("No resumes found in the database");
      process.exit(1);
    }
    console.log("Found resume:", resume._id);
    console.log("User:", resume.user ? resume.user._id : "No user found");

    // Print resume data
    console.log("\nResume Data:");
    console.log("Skills:", resume.skills);
    console.log("Experience:", resume.experience.length, "items");
    console.log("Projects:", resume.projects.length, "items");
    console.log("Education:", resume.education.length, "items");

    // Get a sample faculty from the database
    const faculty = await Faculty.findOne().populate("institution");
    if (!faculty) {
      console.error("No faculty found in the database");
      process.exit(1);
    }
    console.log("\nFound faculty:", faculty._id);
    console.log("Name:", faculty.name);
    console.log("Department:", faculty.department);
    console.log("Research Interests:", faculty.researchInterests);

    // Match candidate to faculty (simulating the route process)
    console.log("\nMatching candidate to faculty...");
    const candidateData = {
      skills: resume.skills || [],
      experience: resume.experience || [],
      projects: resume.projects || [],
      education: resume.education || [],
    };

    console.log("Candidate data being passed to matcher:");
    console.log(JSON.stringify(candidateData, null, 2));

    const matches = await matchCandidateToFaculty(candidateData, faculty);
    console.log("\nMatch results:");
    console.log(JSON.stringify(matches, null, 2));

    // Combine candidate data with matches (as the route should do)
    const enrichedCandidate = {
      ...candidateData,
      matches: matches,
    };

    // Generate the email
    console.log("\nGenerating research email...");
    console.log("Faculty data passed to generator:");
    console.log(JSON.stringify(faculty, null, 2));
    console.log("\nCandidate data passed to generator:");
    console.log(JSON.stringify(enrichedCandidate, null, 2));

    const email = await generateResearchEmail({
      faculty: faculty,
      candidate: enrichedCandidate,
    });

    console.log("\nGenerated Email:");
    console.log("Subject:", email.subject);
    console.log("\nBody:");
    console.log(email.body);
  } catch (error) {
    console.error("Error in academic email route test:", error);
  } finally {
    // Close the MongoDB connection
    await mongoose.connection.close();
    console.log("MongoDB connection closed");
  }
}

// Create a special debug version to check route structure from academicRoutes.js
function simulateRouteFlow() {
  console.log("=== Simulating Route Flow (without DB) ===\n");

  // Sample data as it would appear in the route
  const mockResumeData = {
    skills: [
      "Machine Learning",
      "Python",
      "TensorFlow",
      "Computer Vision",
      "Data Analysis",
    ],
    experience: [
      "Research Assistant - Computer Vision Lab",
      "Machine Learning Intern - Tech Company",
      "Teaching Assistant - AI Course",
    ],
    projects: [
      "Object Detection System using YOLOv5",
      "Sentiment Analysis Tool for Customer Feedback",
      "Image Classification with CNNs",
    ],
    education: [
      {
        institution: "University of Technology",
        degree: "Bachelor of Science",
        field: "Computer Science",
        startDate: "2018-09",
        endDate: "2022-05",
        gpa: "3.9",
      },
    ],
  };

  const mockFaculty = {
    name: "Dr. Sarah Johnson",
    email: "sjohnson@university.edu",
    title: "Associate Professor",
    department: "Computer Science",
    institution: {
      name: "University of Science",
      type: "Research University",
      location: "San Francisco, CA",
    },
    researchInterests: [
      "Computer Vision",
      "Deep Learning",
      "Autonomous Systems",
      "Medical Imaging",
    ],
    projects: [
      "Neural Networks for Medical Image Analysis",
      "Self-Driving Vehicle Perception Systems",
      "Video Recognition for Human Activity Monitoring",
    ],
    publications: [
      'Johnson, S. et al. (2022) "Deep Learning Applications in Medical Imaging", IEEE Medical Imaging',
      'Johnson, S. & Lee, K. (2021) "Real-time Object Detection for Autonomous Vehicles", CVPR 2021',
    ],
  };

  // Simulate the route processing
  console.log("Route step 1: Received resume data");
  console.log(JSON.stringify(mockResumeData, null, 2));

  console.log("\nRoute step 2: Received faculty data");
  console.log(JSON.stringify(mockFaculty, null, 2));

  // Simulate the matching process
  console.log("\nRoute step 3: Matching candidate to faculty");
  const mockMatches = {
    matchingInterests: ["Computer Vision", "Deep Learning"],
    relevantProjects: [
      "Object Detection System using YOLOv5",
      "Image Classification with CNNs",
    ],
    relevantSkills: [
      "Machine Learning",
      "Python",
      "TensorFlow",
      "Computer Vision",
    ],
  };

  console.log("\nRoute step 4: Match results");
  console.log(JSON.stringify(mockMatches, null, 2));

  // Simulate preparing data for email generation
  const enrichedCandidate = {
    ...mockResumeData,
    matches: mockMatches,
  };

  console.log("\nRoute step 5: Data prepared for email generation");
  console.log("Faculty data sent to generateResearchEmail:");
  console.log(JSON.stringify(mockFaculty, null, 2));
  console.log("\nCandidate data sent to generateResearchEmail:");
  console.log(JSON.stringify(enrichedCandidate, null, 2));

  // Simulate the structure that would be created in the researchContext
  const simulatedResearchContext = {
    faculty: {
      name: mockFaculty.name,
      title: mockFaculty.title || "Professor",
      department: mockFaculty.department,
      institution: {
        name: mockFaculty.institution.name,
        type: mockFaculty.institution.type || "University",
        location: mockFaculty.institution.location || "",
      },
      researchInterests: Array.isArray(mockFaculty.researchInterests)
        ? mockFaculty.researchInterests
        : [],
      website:
        mockFaculty.website ||
        (mockFaculty.institution && mockFaculty.institution.website) ||
        "",
      projects: Array.isArray(mockFaculty.projects) ? mockFaculty.projects : [],
      publications: Array.isArray(mockFaculty.publications)
        ? mockFaculty.publications
        : [],
    },
    candidate: {
      skills: Array.isArray(enrichedCandidate.skills)
        ? enrichedCandidate.skills
        : [],
      experience: Array.isArray(enrichedCandidate.experience)
        ? enrichedCandidate.experience
        : [],
      projects: Array.isArray(enrichedCandidate.projects)
        ? enrichedCandidate.projects
        : [],
      education: Array.isArray(enrichedCandidate.education)
        ? enrichedCandidate.education
        : [],
      matches: {
        matchingInterests: Array.isArray(
          enrichedCandidate.matches?.matchingInterests
        )
          ? enrichedCandidate.matches.matchingInterests
          : [],
        relevantProjects: Array.isArray(
          enrichedCandidate.matches?.relevantProjects
        )
          ? enrichedCandidate.matches.relevantProjects.map((p) =>
              typeof p === "object" ? p.title || p.toString() : p
            )
          : [],
        relevantSkills: Array.isArray(enrichedCandidate.matches?.relevantSkills)
          ? enrichedCandidate.matches.relevantSkills
          : [],
      },
    },
  };

  console.log("\nRoute step 6: researchContext that will be used for prompt:");
  console.log(JSON.stringify(simulatedResearchContext, null, 2));
}

// Allow running in different modes
if (process.argv[2] === "route") {
  testAcademicEmailRoute().then(() => process.exit());
} else if (process.argv[2] === "simulate") {
  simulateRouteFlow();
} else {
  simulateRouteFlow();
  console.log(
    "\nTo test with actual database data, run with: node testResearchEmail.js route"
  );
}
