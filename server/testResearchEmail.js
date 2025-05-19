import dotenv from "dotenv";
import { generateResearchEmail } from "./services/aiService.js";

// Load environment variables
dotenv.config();

/**
 * This script tests the research email generation functionality with mock data
 * to verify the prompt being sent to the LLM.
 */
async function testResearchEmailGeneration() {
  console.log("=== Testing Research Email Generation ===\n");

  // Sample faculty data
  const faculty = {
    name: "Jane Smith",
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

  // Sample candidate data
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

  console.log("Faculty data:", JSON.stringify(faculty, null, 2));
  console.log("\nCandidate data:", JSON.stringify(candidate, null, 2));

  try {
    console.log("\nGenerating research email...");

    // Debug: Modify the function to expose the prompt without sending to API
    const email = await generateResearchEmail({ faculty, candidate });

    console.log("\nGenerated Email:");
    console.log("Subject:", email.subject);
    console.log("\nBody:");
    console.log(email.body);
  } catch (error) {
    console.error("Error generating research email:", error);
  }
}

// Add a modified version of the function that logs the prompt instead of calling the API
async function testPromptGeneration() {
  console.log("=== Testing Email Prompt Generation ===\n");

  // Sample faculty data (same as above)
  const faculty = {
    name: "Jane Smith",
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

  // Sample candidate data (same as above)
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

  // Code from aiService.js generateResearchEmail function to create the context
  // Create comprehensive research context with proper data validation
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
      education: Array.isArray(candidate.education) ? candidate.education : [],
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

  // Now construct the prompt like in the original function
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
          .join("\n")
      : "Not available"
  }

Notable Publications:
${
  researchContext.faculty.publications.length > 0
    ? researchContext.faculty.publications
        .slice(0, 3)
        .map((pub) => `- ${pub}`)
        .join("\n")
    : "Not available"
}

CANDIDATE BACKGROUND (YOU MUST CONNECT THESE SKILLS TO THE PROFESSOR'S RESEARCH):
Skills: ${researchContext.candidate.skills.join(", ")}
Relevant Projects: ${
    researchContext.candidate.matches.relevantProjects.length > 0
      ? researchContext.candidate.matches.relevantProjects
          .map((p) => `- ${p}`)
          .join("\n")
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

  // Log the complete prompt for verification
  console.log("--- Generated Prompt: ---\n");
  console.log(prompt);
}

// Run both tests
// Parse command line arguments
const args = process.argv.slice(2);
const mode = args[0] || "both";

(async () => {
  try {
    if (mode === "prompt" || mode === "both") {
      await testPromptGeneration();
    }

    if (mode === "email" || mode === "both") {
      console.log("\n" + "=".repeat(50) + "\n");
      await testResearchEmailGeneration();
    }

    console.log("\nTest completed successfully!");
  } catch (error) {
    console.error("Test failed with error:", error);
    process.exit(1);
  }
})();
