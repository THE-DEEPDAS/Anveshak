import React from "react";
import { useNavigate } from "react-router-dom";
import {
  FaFileUpload,
  FaEnvelope,
  FaSearch,
  FaPaperPlane,
} from "react-icons/fa";
import Button from "../components/ui/Button";

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-purple-700 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
            Land Your Dream Tech Internship with Cold Emails
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto text-blue-100">
            Upload your resume, and we'll automatically generate personalized
            cold emails to companies matching your skills and experience.
          </p>
          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate("/signup")}
            className="bg-blue-600 text-white hover:bg-white hover:text-blue-600 font-semibold px-6 py-2 rounded border border-white transition duration-200"
          >
            Get Started
          </Button>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">
            How It Works
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaFileUpload className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-800">
                Upload Your Resume
              </h3>
              <p className="text-gray-600">
                Upload your resume and our AI will extract your skills,
                experience, and projects.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaSearch className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-800">
                Match with Companies
              </h3>
              <p className="text-gray-600">
                Our AI finds companies that match your skills and retrieves
                relevant contact information.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaPaperPlane className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-800">
                Send Personalized Emails
              </h3>
              <p className="text-gray-600">
                We generate and send personalized cold emails to the right
                people at each company.
              </p>
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
          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate("/onboarding")}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Upload Your Resume
          </Button>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
