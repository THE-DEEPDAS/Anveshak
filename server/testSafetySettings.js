import dotenv from "dotenv";
import { generateResearchEmail } from "./services/aiService.js";

// Load environment variables
dotenv.config();

/**
 * This script tests the generateResearchEmail function with the fixed safety settings
 */
async function testSafetySettings() {
  console.log(
    "Testing generateResearchEmail with corrected safety settings..."
  );

  // Sample data
  const faculty = {
    name: "Dr. Jane Smith",
    title: "Associate Professor",
    email: "jsmith@university.edu",
    department: "Computer Science",
    institution: {
      name: "University of Technology",
      type: "Research University",
      location: "Boston, MA",
    },
    researchInterests: [
      "Machine Learning",
      "Computer Vision",
      "Natural Language Processing",
      "Robotics",
    ],
    projects: [
      "Autonomous navigation systems for indoor robots",
      "Visual recognition in low-light environments",
      "Multi-modal learning for human-robot interaction",
    ],
    publications: [
      'Smith, J. et al. (2023) "Advances in Low-light Computer Vision", IEEE Conference on Computer Vision',
      'Smith, J. & Johnson, A. (2022) "Robot Learning from Human Demonstration", Robotics and Automation Letters',
      'Smith, J. et al. (2021) "Multi-modal Deep Learning for Object Recognition", CVPR 2021',
    ],
    website: "https://jsmith.university.edu",
  };

  const candidate = {
    skills: [
      "Python",
      "PyTorch",
      "TensorFlow",
      "Computer Vision",
      "Data Analysis",
      "Machine Learning",
      "ROS (Robot Operating System)",
      "OpenCV",
    ],
    experience: [
      "Research Assistant at AI Lab - Implemented computer vision algorithms for object detection",
      "Software Engineering Intern - Developed machine learning pipeline for data processing",
      "Teaching Assistant for Machine Learning course - Led practical sessions on neural networks",
    ],
    projects: [
      "Facial Recognition System: Built facial recognition with 95% accuracy using CNNs",
      "Autonomous Drone Navigation: Implemented vision-based navigation system using ROS",
      "Sentiment Analysis Tool: Created NLP model for analyzing customer reviews",
    ],
    education: [
      {
        institution: "Technical University",
        degree: "Bachelor of Science",
        field: "Computer Science",
        startDate: "2019-09",
        endDate: "2023-05",
        gpa: "3.8",
      },
    ],
    matches: {
      matchingInterests: ["Computer Vision", "Machine Learning"],
      relevantProjects: [
        "Autonomous Drone Navigation using Computer Vision",
        "Object Recognition in Variable Lighting Conditions",
      ],
      relevantSkills: ["PyTorch", "TensorFlow", "OpenCV", "ROS"],
    },
  };

  try {
    console.log("Calling generateResearchEmail with the sample data...");
    const emailContent = await generateResearchEmail({ faculty, candidate });

    console.log("\nGeneration successful!");
    console.log("Subject:", emailContent.subject);
    console.log("\nBody:");
    console.log(emailContent.body);

    return true;
  } catch (error) {
    console.error("Error testing generateResearchEmail:", error);
    return false;
  }
}

// Run the test
testSafetySettings()
  .then((success) => {
    console.log(`\nTest ${success ? "PASSED" : "FAILED"}`);
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error("Unexpected error in test script:", error);
    process.exit(1);
  });
