import dotenv from "dotenv";
import { generateBetterEmail } from "./services/academicEmailService.js";

// Load environment variables
dotenv.config();

/**
 * Complete test script that simulates the exact flow from the academicRoutes.js endpoint
 * to the email generation function
 */
async function testCompleteEmailFlow() {
  console.log("=== Testing Complete Email Flow ===\n");

  try {
    // This data structure mimics what we get in the route
    const faculty = {
      name: "Dr. Jane Smith",
      email: "jsmith@university.edu",
      title: "Associate Professor",
      department: "Computer Science",
      institution: {
        name: "University of Technology",
        type: "Research University",
        location: "Boston, MA",
        website: "https://university.edu",
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
      ],
      website: "https://university.edu/~jsmith",
    };

    console.log("Faculty data:", JSON.stringify(faculty.name));

    // Resume data structure similar to what we'd get from the database
    const resume = {
      skills: [
        "Python",
        "TensorFlow",
        "PyTorch",
        "Computer Vision",
        "Machine Learning",
        "Natural Language Processing",
        "ROS (Robot Operating System)",
        "OpenCV",
        "Deep Learning",
      ],
      experience: [
        "Research Assistant at AI Lab - Developed computer vision algorithms for object detection",
        "Machine Learning Intern - Built NLP models for document classification",
        "Teaching Assistant for Robotics - Instructed students on ROS and robot control",
      ],
      projects: [
        "Autonomous Drone Navigation: Implemented vision-based navigation using deep learning",
        "Medical Image Analysis: Developed CNN model for tumor detection in MRI scans",
        "Language Translation System: Built seq2seq model for English-Spanish translation",
      ],
      education: [
        {
          institution: "Technical University",
          degree: "Master of Science",
          field: "Computer Science",
          startDate: "2022-09",
          endDate: "2024-05",
          gpa: "3.9",
        },
      ],
      parseResults: [
        {
          skills: [
            "Python",
            "TensorFlow",
            "PyTorch",
            "Computer Vision",
            "Machine Learning",
            "Natural Language Processing",
            "ROS (Robot Operating System)",
            "OpenCV",
            "Deep Learning",
          ],
          experience: [
            "Research Assistant at AI Lab - Developed computer vision algorithms for object detection",
            "Machine Learning Intern - Built NLP models for document classification",
            "Teaching Assistant for Robotics - Instructed students on ROS and robot control",
          ],
          projects: [
            "Autonomous Drone Navigation: Implemented vision-based navigation using deep learning",
            "Medical Image Analysis: Developed CNN model for tumor detection in MRI scans",
            "Language Translation System: Built seq2seq model for English-Spanish translation",
          ],
        },
      ],
      user: {
        name: "Alex Johnson",
        email: "alex@example.com",
        education: [],
        github: "https://github.com/alexj",
        linkedin: "https://linkedin.com/in/alexj",
        website: "https://alexj.dev",
      },
    };

    console.log(
      "Resume data:",
      JSON.stringify(
        {
          skills: resume.skills.length + " items",
          experience: resume.experience.length + " items",
          projects: resume.projects.length + " items",
        },
        null,
        2
      )
    );

    // Call the email generation function exactly as in the route
    console.log("\nGenerating email...");
    const emailContent = await generateBetterEmail(faculty, resume);

    // Output results
    console.log("\nGenerated Email:");
    console.log("Subject:", emailContent.subject);
    console.log("\nBody:");
    console.log(emailContent.body);

    return {
      success: true,
      email: emailContent,
    };
  } catch (error) {
    console.error("Error in test flow:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Run the test
(async () => {
  const result = await testCompleteEmailFlow();
  console.log("\nTest result:", result.success ? "SUCCESS" : "FAILED");
  process.exit(result.success ? 0 : 1);
})();
