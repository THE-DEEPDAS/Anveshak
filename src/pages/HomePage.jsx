import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaFileUpload,
  FaEnvelope,
  FaSearch,
  FaPaperPlane,
  FaQuoteLeft,
  FaGithub,
  FaLinkedin,
} from "react-icons/fa";
import statsService from "../services/statsService";
import Button from "../components/ui/Button";

const HomePage = () => {
  const navigate = useNavigate();
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [pageViews, setPageViews] = useState(0);
  const [stats, setStats] = useState({
    activeUsers: 0,
    emailsGenerated: 0,
    responseRate: 0,
    githubStars: 0,
  });

  const testimonials = [
    /* For all those reading this, these are real, they are just hardcoded 😅 */
    {
      quote:
        "As a drone enthusiast, I used Anveshak  to reach out to Academic Institutions for collaboaration. I'm now collaborating with professors from IIT Bombay on my drone project.",
      author: "Bodhini Jain",
      position: "CSE Student, SVNIT Surat",
      image: "https://randomuser.me/api/portraits/women/44.jpg",
    },
    {
      quote:
        "The open-source nature of Anveshak  allowed me to add features specific to the Indian job market. I now use it to help fellow students at SVNIT land internships.",
      author: "Swapna K",
      position: "Software Developer, SVNIT Alumni",
      image: "https://randomuser.me/api/portraits/women/22.jpg",
    },
    {
      quote:
        "I used Anveshak  during my second year at SVNIT to connect with industry professionals. Within a month, I had three interview offers from top companies!",
      author: "Vikram Singh",
      position: "Machine Learning Engineer, SVNIT",
      image: "https://randomuser.me/api/portraits/men/28.jpg",
    },
  ];

  useEffect(() => {
    // Rotate testimonials every 5 seconds
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    // Fetch initial stats and increment page view counter
    const fetchData = async () => {
      try {
        // Get homepage statistics
        const homepageStats = await statsService.getHomepageStats();
        setStats(homepageStats);

        // Increment and get page views
        const pageViewData = await statsService.incrementPageViews();
        setPageViews(pageViewData.pageViews);
      } catch (error) {
        console.error("Error fetching homepage data:", error);
      }
    };

    fetchData();

    return () => {
      clearInterval(interval);
    };
  }, [testimonials.length]);

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-purple-700 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="mb-3 flex justify-center space-x-2">
            <span className="bg-white text-blue-600 px-4 py-1 rounded-full text-sm font-bold">
              Open Source
            </span>
            <span className="bg-white text-green-600 px-4 py-1 rounded-full text-sm font-bold">
              Production Ready
            </span>
            <span className="bg-white text-purple-600 px-4 py-1 rounded-full text-sm font-bold">
              AI-Powered
            </span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Land Your Dream Tech Role with AI-Powered Cold Emails
          </h1>
          <p className="text-xl md:text-2xl mb-6 max-w-3xl mx-auto text-blue-100">
            The ultimate open-source platform that analyzes your resume, matches
            with companies, and generates personalized outreach that gets
            responses. Built by developers, for developers.
          </p>
          <div className="flex justify-center gap-8 mb-8 max-w-3xl mx-auto">
            <div className="text-center">
              <div className="text-4xl font-bold text-white">
                {stats.activeUsers > 0
                  ? `${stats.activeUsers.toLocaleString()}+`
                  : "500+"}
              </div>
              <div className="text-blue-100 text-sm">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white">
                {stats.emailsGenerated > 0
                  ? `${stats.emailsGenerated.toLocaleString()}+`
                  : "2,500+"}
              </div>
              <div className="text-blue-100 text-sm">Emails Generated</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white">
                {stats.responseRate > 0 ? `${stats.responseRate}%` : "35%"}
              </div>
              <div className="text-blue-100 text-sm">Response Rate</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white">
                {stats.githubStars > 0
                  ? `${stats.githubStars.toLocaleString()}+`
                  : "250+"}
              </div>
              <div className="text-blue-100 text-sm">GitHub Stars</div>
            </div>
          </div>
          <div className="flex justify-center space-x-4">
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate("/signup")}
              //   className="bg-blue-600 text-white hover:bg-white hover:text-blue-600 font-semibold px-6 py-2 rounded border border-white transition duration-200"
              // >
              className="bg-transparent text-white hover:bg-white hover:text-blue-600 font-semibold px-8 py-3 rounded-lg border border-white transition duration-200"
            >
              Get Started
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() =>
                window.open("https://github.com/THE-DEEPDAS/Anveshak", "_blank")
              }
              className="bg-transparent text-white hover:bg-white hover:text-blue-600 font-semibold px-8 py-3 rounded-lg border border-white transition duration-200"
            >
              <span className="flex items-center">
                <FaGithub className="mr-2" /> Star on GitHub
              </span>
            </Button>
          </div>
          <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto text-center">
            <div className="bg-blue-700 bg-opacity-40 p-3 rounded-lg hover:bg-opacity-60 transition-all">
              <div className="font-bold text-lg">Modern Stack</div>
              <div className="text-blue-100 text-sm">
                React, Node.js, MongoDB
              </div>
            </div>
            <div className="bg-blue-700 bg-opacity-40 p-3 rounded-lg hover:bg-opacity-60 transition-all">
              <div className="font-bold text-lg">Open Source</div>
              <div className="text-blue-100 text-sm">
                MIT Licensed & Contribution Ready
              </div>
            </div>
            <div className="bg-blue-700 bg-opacity-40 p-3 rounded-lg hover:bg-opacity-60 transition-all">
              <div className="font-bold text-lg">Quality Code</div>
              <div className="text-blue-100 text-sm">
                Clean Architecture & Patterns
              </div>
            </div>
            <div className="bg-blue-700 bg-opacity-40 p-3 rounded-lg hover:bg-opacity-60 transition-all">
              <div className="font-bold text-lg">Well Tested</div>
              <div className="text-blue-100 text-sm">
                Comprehensive Test Suite
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <span className="text-blue-600 font-semibold text-lg">
              Seamless Process
            </span>
            <h2 className="text-4xl font-bold mt-2 mb-4 text-gray-800">
              How Anveshak  Works
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Our intelligent workflow combines resume parsing, AI matching, and
              personalized email generation to maximize your outreach
              effectiveness.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-lg text-center relative hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              <span className="absolute -top-4 -left-4 bg-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg">
                1
              </span>
              <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <FaFileUpload className="h-10 w-10 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-800">
                Smart Resume Parsing
              </h3>
              <p className="text-gray-600">
                Our advanced algorithms extract skills, experience, and projects
                with industry-leading accuracy using multiple parsing methods.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-lg text-center relative hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              <span className="absolute -top-4 -left-4 bg-purple-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg">
                2
              </span>
              <div className="bg-purple-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <FaSearch className="h-10 w-10 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-800">
                AI-Powered Matching
              </h3>
              <p className="text-gray-600">
                Leveraging Google's Gemini AI to find companies and academic
                institutions that are perfect matches for your unique skillset.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-lg text-center relative hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              <span className="absolute -top-4 -left-4 bg-green-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg">
                3
              </span>
              <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <FaPaperPlane className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-800">
                Custom Email Generation
              </h3>
              <p className="text-gray-600">
                Generate compelling emails that highlight your relevant
                experience, using research-backed templates that get responses.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-lg text-center relative hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              <span className="absolute -top-4 -left-4 bg-amber-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg">
                4
              </span>
              <div className="bg-amber-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-10 w-10 text-amber-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-800">
                Track & Analyze Results
              </h3>
              <p className="text-gray-600">
                Monitor email performance, gather insights, and optimize your
                outreach strategy for maximum effectiveness.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack Showcase */}
      <section className="py-16 bg-gradient-to-r from-gray-50 to-blue-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-blue-600 font-semibold text-lg">
              Built With Modern Technologies
            </span>
            <h2 className="text-3xl font-bold mt-2 mb-4 text-gray-800">
              Production-Grade Architecture
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Anveshak  is built using industry best practices and a modern
              tech stack, making it perfect for both learning and production
              use.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-all">
              <h3 className="text-xl font-semibold mb-3 text-gray-800 border-b pb-2">
                Frontend
              </h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-center">
                  <span className="bg-blue-100 w-2 h-2 rounded-full mr-2"></span>
                  React with Hooks & Context API
                </li>
                <li className="flex items-center">
                  <span className="bg-blue-200 w-2 h-2 rounded-full mr-2"></span>
                  TailwindCSS for Responsive Design
                </li>
                <li className="flex items-center">
                  <span className="bg-blue-300 w-2 h-2 rounded-full mr-2"></span>
                  Vite for Lightning Fast Builds
                </li>
                <li className="flex items-center">
                  <span className="bg-blue-400 w-2 h-2 rounded-full mr-2"></span>
                  React Router for Navigation
                </li>
              </ul>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-all">
              <h3 className="text-xl font-semibold mb-3 text-gray-800 border-b pb-2">
                Backend
              </h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-center">
                  <span className="bg-green-100 w-2 h-2 rounded-full mr-2"></span>
                  Node.js & Express Framework
                </li>
                <li className="flex items-center">
                  <span className="bg-green-200 w-2 h-2 rounded-full mr-2"></span>
                  MongoDB with Mongoose ORM
                </li>
                <li className="flex items-center">
                  <span className="bg-green-300 w-2 h-2 rounded-full mr-2"></span>
                  JWT Authentication
                </li>
                <li className="flex items-center">
                  <span className="bg-green-400 w-2 h-2 rounded-full mr-2"></span>
                  Microservice-inspired Architecture
                </li>
              </ul>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-all">
              <h3 className="text-xl font-semibold mb-3 text-gray-800 border-b pb-2">
                AI & Integration
              </h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-center">
                  <span className="bg-purple-100 w-2 h-2 rounded-full mr-2"></span>
                  Google Gemini AI Integration
                </li>
                <li className="flex items-center">
                  <span className="bg-purple-200 w-2 h-2 rounded-full mr-2"></span>
                  Multiple Resume Parsing Algorithms
                </li>
                <li className="flex items-center">
                  <span className="bg-purple-300 w-2 h-2 rounded-full mr-2"></span>
                  Cloudinary for File Management
                </li>
                <li className="flex items-center">
                  <span className="bg-purple-400 w-2 h-2 rounded-full mr-2"></span>
                  Axios & Cheerio for Web Scraping
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">
            Why Choose Our Platform
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="flex items-start">
              <div className="bg-blue-100 p-3 rounded-full mr-4">
                <FaEnvelope className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2 text-gray-800">
                  Personalized Cold Emails
                </h3>
                <p className="text-gray-600">
                  Our AI tailors each email to the specific company,
                  highlighting your relevant skills and experience.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="bg-blue-100 p-3 rounded-full mr-4">
                <FaSearch className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2 text-gray-800">
                  Smart Company Matching
                </h3>
                <p className="text-gray-600">
                  We find companies that are looking for someone with your
                  specific skill set and experience.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="bg-blue-100 p-3 rounded-full mr-4">
                <FaPaperPlane className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2 text-gray-800">
                  Automated Sending
                </h3>
                <p className="text-gray-600">
                  Send multiple emails at once, saving you hours of manual work
                  while you focus on preparing for interviews.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="bg-blue-100 p-3 rounded-full mr-4">
                <FaFileUpload className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2 text-gray-800">
                  Resume Analysis
                </h3>
                <p className="text-gray-600">
                  Get insights into how your resume is being parsed and which
                  skills are being highlighted to companies.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Practical Use Cases */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-blue-600 font-semibold text-lg">
              Real-World Applications
            </span>
            <h2 className="text-3xl font-bold mt-2 mb-4 text-gray-800">
              Practical Use Cases
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Anveshak  is designed to solve real problems for job seekers,
              students, and professionals. See how it's making a difference.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="bg-gray-50 rounded-xl p-8 shadow-md">
              <h3 className="text-xl font-bold mb-4 text-gray-800">
                For Job Seekers
              </h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-green-500 mt-1 mr-2"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>
                    Find companies that match your skills and experience
                  </span>
                </li>
                <li className="flex items-start">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-green-500 mt-1 mr-2"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>
                    Generate personalized cold emails that highlight relevant
                    experience
                  </span>
                </li>
                <li className="flex items-start">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-green-500 mt-1 mr-2"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Save hours of research and writing time</span>
                </li>
                <li className="flex items-start">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-green-500 mt-1 mr-2"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>
                    Track email performance and optimize your approach
                  </span>
                </li>
              </ul>
            </div>

            <div className="bg-gray-50 rounded-xl p-8 shadow-md">
              <h3 className="text-xl font-bold mb-4 text-gray-800">
                For Students & Researchers
              </h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-green-500 mt-1 mr-2"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>
                    Connect with faculty members based on research interests
                  </span>
                </li>
                <li className="flex items-start">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-green-500 mt-1 mr-2"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>
                    Create tailored academic emails for research opportunities
                  </span>
                </li>
                <li className="flex items-start">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-green-500 mt-1 mr-2"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>
                    Find academic institutions that match your research
                    interests
                  </span>
                </li>
                <li className="flex items-start">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-green-500 mt-1 mr-2"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>
                    Increase chances of securing academic collaborations
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-blue-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-blue-600 font-semibold text-lg">
              Success Stories
            </span>
            <h2 className="text-3xl font-bold mt-2 mb-4 text-gray-800">
              What Our Users Say
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Join thousands of satisfied users who have used Anveshak  to
              land interviews, connect with researchers, and advance their
              careers.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-8 md:p-12 relative">
              <FaQuoteLeft className="text-blue-100 text-8xl absolute top-6 left-6" />
              <div className="relative z-10">
                <p className="text-xl text-gray-700 mb-6 italic">
                  "{testimonials[activeTestimonial].quote}"
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full overflow-hidden mr-4">
                    <img
                      src={testimonials[activeTestimonial].image}
                      alt={testimonials[activeTestimonial].author}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-bold text-gray-800">
                      {testimonials[activeTestimonial].author}
                    </p>
                    <p className="text-gray-600 text-sm">
                      {testimonials[activeTestimonial].position}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-center mt-6">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  className={`w-3 h-3 rounded-full mx-1 ${
                    i === activeTestimonial ? "bg-blue-600" : "bg-gray-300"
                  }`}
                  onClick={() => setActiveTestimonial(i)}
                  aria-label={`View testimonial ${i + 1}`}
                />
              ))}
            </div>
          </div>

          <div className="mt-12 text-center text-gray-600">
            <p>
              <span className="font-semibold">
                {pageViews > 0 ? pageViews.toLocaleString() : "2,100+"}
              </span>{" "}
              job seekers visited our platform this month
            </p>
          </div>
        </div>
      </section>

      {/* Open Source Community */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-blue-600 font-semibold text-lg">
              Join Our Community
            </span>
            <h2 className="text-3xl font-bold mt-2 mb-4 text-gray-800">
              Open Source Collaboration
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Anveshak  is built by developers for developers. Join our
              growing community and contribute to a project that's making a real
              difference.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-md text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Contribute Code</h3>
              <p className="text-gray-600">
                Help improve features, fix bugs, and add new functionality to
                make Anveshak  even better.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">MIT Licensed</h3>
              <p className="text-gray-600">
                Use Anveshak  freely in your projects, modify it, and make it
                your own. Our permissive license gives you freedom.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Grow Your Network</h3>
              <p className="text-gray-600">
                Join a community of like-minded developers who are passionate
                about creating innovative solutions.
              </p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <Button
              variant="primary"
              size="lg"
              onClick={() =>
                window.open("https://github.com/THE-DEEPDAS/Anveshak", "_blank")
              }
              className="bg-blue-600 hover:bg-blue-700"
            >
              Star on GitHub
            </Button>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gray-900 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">
            Ready to Land Your Dream Internship?
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto text-gray-300">
            Start sending personalized cold emails today and increase your
            chances of getting noticed by top tech companies.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate("/signup")}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Upload Your Resume
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() =>
                window.open(
                  "https://github.com/THE-DEEPDAS/Anveshak/blob/main/docs/comprehensive-documentation.md",
                  "_blank"
                )
              }
              className="bg-transparent border border-white hover:bg-white hover:text-gray-900"
            >
              Read Documentation
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
