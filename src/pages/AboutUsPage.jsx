import React from "react";
import { FaLinkedin, FaGithub, FaGlobe } from "react-icons/fa";

const AboutUsPage = () => {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
          About Us
        </h1>

        <div className="bg-white rounded-lg shadow-lg p-8 mb-10">
          <h2 className="text-2xl font-semibold mb-6 text-gray-700">
            Our Mission
          </h2>
          <p className="text-gray-600 mb-6 leading-relaxed">
            At Anveshak, we're on a mission to empower students to secure their
            dream internships and job opportunities in the competitive tech
            landscape. We understand the challenges students face when reaching
            out to potential employers, which is why we've developed an
            intelligent email generation platform that helps you create
            personalized, professional cold emails that get responses.
          </p>
          <p className="text-gray-600 mb-6 leading-relaxed">
            Our platform leverages cutting-edge AI technologies, including
            Google's Gemini AI, to analyze resumes with exceptional accuracy and
            help you craft tailored emails to companies and professors. With
            multiple parsing algorithms and advanced AI capabilities, we ensure
            precise extraction of your skills and experience, increasing your
            chances of landing interviews and research opportunities. We believe
            that every student deserves a fair shot at their dream role,
            regardless of their background or connections.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 mb-10">
          <h2 className="text-2xl font-semibold mb-6 text-gray-700">
            Meet the Founder
          </h2>

          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            <div className="w-48 h-48 md:w-64 md:h-64 overflow-hidden rounded-full flex-shrink-0 bg-gray-100 flex items-center justify-center">
              <img
                src="https://avatars.githubusercontent.com/u/96739252"
                alt="Deep Das"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src =
                    "https://ui-avatars.com/api/?name=Deep+Das&size=256&background=0D8ABC&color=fff";
                }}
              />
            </div>

            <div className="flex-1">
              {" "}
              <h3 className="text-xl font-semibold mb-2 text-gray-700">
                Deep Das
              </h3>
              <p className="text-gray-500 mb-4">Founder & Developer</p>
              <p className="text-gray-600 mb-4 leading-relaxed">
                Deep Das is a passionate software developer and AI enthusiast
                with a strong background in educational technology. With
                expertise in full-stack development and AI applications, Deep
                created Anveshak to solve a critical challenge that students
                face in their job search journey.
              </p>
              <div className="flex space-x-4">
                <a
                  href="https://www.linkedin.com/in/deep-das-4b5aa527b/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <FaLinkedin className="h-6 w-6" />
                </a>
                <a
                  href="https://github.com/THE-DEEPDAS"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-700 hover:text-gray-900 transition-colors"
                >
                  <FaGithub className="h-6 w-6" />
                </a>
                <a
                  href="https://deepdas.tech"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-600 hover:text-green-800 transition-colors"
                >
                  <FaGlobe className="h-6 w-6" />
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-semibold mb-6 text-gray-700">
            Our Values
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-3 text-gray-700">
                Innovation
              </h3>{" "}
              <p className="text-gray-600">
                We continuously innovate by integrating the latest AI
                technologies like Google's Gemini AI and advanced parsing
                algorithms to provide the most accurate resume analysis and the
                best possible experience for our users.
              </p>
            </div>

            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-3 text-gray-700">
                Accessibility
              </h3>
              <p className="text-gray-600">
                We believe that all students should have access to tools that
                help them succeed, regardless of their background or financial
                situation. We're committed to keeping our platform affordable
                and accessible.
              </p>
            </div>

            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-3 text-gray-700">
                Quality
              </h3>
              <p className="text-gray-600">
                We're dedicated to providing high-quality content and tools that
                actually help students get interviews and land opportunities.
                Your success is our success.
              </p>
            </div>

            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-3 text-gray-700">
                Privacy
              </h3>
              <p className="text-gray-600">
                We respect your privacy and handle your data with the utmost
                care. We only use your information to improve your experience
                and never share it with third parties without your consent.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutUsPage;
