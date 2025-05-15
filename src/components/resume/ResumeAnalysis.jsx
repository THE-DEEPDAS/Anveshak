import React from "react";
import { useAppContext } from "../../context/AppContext";
import {
  FaFileDownload,
  FaCode,
  FaBriefcase,
  FaSpinner,
  FaLightbulb,
} from "react-icons/fa";

const ResumeAnalysis = () => {
  const { resume } = useAppContext();

  if (!resume) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <p className="text-yellow-800">
          Please upload your resume to see the analysis.
        </p>
      </div>
    );
  }

  const pdfUrl = resume.url?.replace(/\s/g, "%20");

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 max-w-4xl mx-auto">
      <div className="border-b border-gray-200 pb-4 mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Resume Analysis</h2>
        {pdfUrl && (
          <div className="mt-4 flex items-center">
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              <FaFileDownload className="mr-2" />
              View Resume PDF
            </a>
            <p className="text-sm text-gray-500 ml-4">
              Link expires after some time
            </p>
          </div>
        )}
      </div>

      {resume.parseStatus === "pending" && (
        <div className="flex items-center justify-center py-12 text-gray-600">
          <FaSpinner className="animate-spin mr-3 h-6 w-6" />
          <span>Analyzing resume contents...</span>
        </div>
      )}

      {resume.parseStatus === "failed" && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-red-700">
                Failed to analyze resume: {resume.parseError?.message}
              </p>
            </div>
          </div>
        </div>
      )}

      {resume.parseStatus === "completed" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 shadow-sm">
            <div className="flex items-center mb-4">
              <FaCode className="text-blue-600 text-xl mr-2" />
              <h3 className="text-xl font-semibold text-gray-800">
                Technical Skills
              </h3>
            </div>
            {resume.skills && resume.skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {resume.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-white text-blue-700 rounded-full text-sm font-medium shadow-sm border border-blue-100"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No skills detected</p>
            )}
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 shadow-sm">
            <div className="flex items-center mb-4">
              <FaBriefcase className="text-purple-600 text-xl mr-2" />
              <h3 className="text-xl font-semibold text-gray-800">
                Experience
              </h3>
            </div>
            {resume.experience && resume.experience.length > 0 ? (
              <div className="space-y-3">
                {resume.experience.map((exp, index) => (
                  <div
                    key={index}
                    className="bg-white p-3 rounded-lg shadow-sm border border-purple-100"
                  >
                    <p className="text-gray-700">{exp}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No experience detected</p>
            )}
          </div>

          <div className="md:col-span-2 bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 shadow-sm">
            <div className="flex items-center mb-4">
              <FaLightbulb className="text-green-600 text-xl mr-2" />
              <h3 className="text-xl font-semibold text-gray-800">Projects</h3>
            </div>
            {resume.projects && resume.projects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {resume.projects.map((project, index) => (
                  <div
                    key={index}
                    className="bg-white p-4 rounded-lg shadow-sm border border-green-100 hover:shadow-md transition-shadow"
                  >
                    <h4 className="font-medium text-gray-900 mb-2">
                      Project {index + 1}
                    </h4>
                    <p className="text-gray-700 text-sm">{project}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No projects detected</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeAnalysis;
