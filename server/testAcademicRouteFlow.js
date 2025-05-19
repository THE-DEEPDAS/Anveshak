import dotenv from "dotenv";
import { generateResearchEmail } from "./services/aiService.js";
import { matchCandidateToFaculty } from "./services/academicEmailService.js";

// Load environment variables
dotenv.config();

/**
 * This script tests the route flow from academicRoutes.js to ensure the correct data is being passed
 * to the generateResearchEmail function
 */
async function testRouteFlow() {
  // This simulates the data that would be available in the route handler
  const mockResume = {
    _id: "resume123",
    skills: [
      "Machine Learning",
      "Python",
      "TensorFlow",
      "Computer Vision",
      "Deep Learning",
      "NLP",
    ],
    experience: [
      "AI Research Assistant at University Lab - Developed neural networks for image classification",
      "Machine Learning Intern - Implemented NLP models for text summarization",
    ],
    projects: [
      "Autonomous Drone Navigation: Built vision-based navigation system with 90% accuracy",
      "Medical Image Analysis: Developed deep learning model for tumor detection",
      "Sentiment Analysis: Created NLP model for customer review analysis",
    ],
    education: [
      {
        institution: "University of Technology",
        degree: "Master of Science",
        field: "Computer Science",
        startDate: "2022-09",
        endDate: "2024-05",
        gpa: "3.9",
      },
    ],
    user: "user123",
  };

  const mockFaculty = {
    _id: "faculty123",
    name: "Dr. John Doe",
    email: "jdoe@research.edu",
    title: "Associate Professor",
    department: "Computer Science",
    institution: {
      _id: "inst123",
      name: "Research University",
      type: "University",
      location: "San Francisco, CA",
      website: "https://research.edu",
    },
    researchInterests: [
      "Computer Vision",
      "Deep Learning",
      "Medical Image Analysis",
      "Autonomous Systems",
    ],
    projects: [
      "Neural networks for cancer detection in medical images",
      "Visual recognition systems for autonomous vehicles",
      "Efficient deep learning architectures for edge devices",
    ],
    publications: [
      'Doe, J. et al. (2024) "Deep Learning for Medical Image Analysis", IEEE Medical Imaging',
      'Doe, J. & Smith, A. (2023) "Efficient Vision Transformers", CVPR 2023',
    ],
    website: "https://research.edu/~jdoe",
  };

  console.log("STEP 1: Match candidate to faculty");
  console.log("=================================");

  // Step 1: Match the candidate with faculty (as done in the route)
  const matches = await matchCandidateToFaculty(mockResume, mockFaculty);
  console.log("Matching result:", JSON.stringify(matches, null, 2));

  console.log("\nSTEP 2: Prepare candidate data with matches");
  console.log("=========================================");

  // Step 2: Prepare data for email generation
  const enrichedCandidate = {
    ...mockResume,
    matches: matches,
  };

  console.log(
    "Enriched candidate:",
    JSON.stringify(
      {
        skills: enrichedCandidate.skills,
        matches: enrichedCandidate.matches,
      },
      null,
      2
    )
  );

  console.log("\nSTEP 3: Generate research email");
  console.log("==============================");

  // Step 3: Generate the email using the same params as in the route
  try {
    console.log(
      "Calling generateResearchEmail with faculty and enriched candidate..."
    );

    const email = await generateResearchEmail({
      faculty: mockFaculty,
      candidate: enrichedCandidate,
    });

    console.log("\nGenerated Email:");
    console.log("-----------------");
    console.log("Subject:", email.subject);
    console.log("\nBody:");
    console.log(email.body);

    return email;
  } catch (error) {
    console.error("Error generating email:", error);
    throw error;
  }
}

// Execute the test
(async () => {
  try {
    console.log("Starting academic route flow test...\n");
    await testRouteFlow();
    console.log("\nTest completed successfully!");
  } catch (error) {
    console.error("\nTest failed with error:", error);
    process.exit(1);
  }
})();
