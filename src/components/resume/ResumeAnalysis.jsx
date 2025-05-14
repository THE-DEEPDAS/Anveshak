import React from "react";
import { useAppContext } from "../../context/AppContext";

const ResumeAnalysis = () => {
  const { resume } = useAppContext();

  if (!resume) {
    return null;
  }

  const pdfUrl = resume.url?.replace(/\s/g, "%20"); // URL encode spaces in the PDF URL

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Resume Analysis
      </h2>
      <div className="space-y-6">
        {pdfUrl && (
          <div className="mb-4">
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 underline"
            >
              View Resume PDF
            </a>
            <p className="text-sm text-gray-500 mt-1">
              Note: The link is temporarily valid and will expire after some
              time
            </p>
          </div>
        )}

        {resume.parseStatus === "pending" && (
          <div className="text-gray-500">Analyzing resume contents...</div>
        )}

        {resume.parseStatus === "failed" && (
          <div className="text-red-500">
            Failed to analyze resume: {resume.parseError?.message}
          </div>
        )}

        {resume.parseStatus === "completed" && (
          <>
            {resume.skills && resume.skills.length > 0 ? (
              <div>
                <h3 className="text-lg font-medium text-gray-700">Skills</h3>
                <ul className="list-disc list-inside">
                  {resume.skills.map((skill, index) => (
                    <li key={index} className="text-gray-600">
                      {skill}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="text-gray-500">No skills detected</div>
            )}

            {resume.experience && resume.experience.length > 0 ? (
              <div>
                <h3 className="text-lg font-medium text-gray-700">
                  Experience
                </h3>
                <ul className="list-disc list-inside">
                  {resume.experience.map((exp, index) => (
                    <li key={index} className="text-gray-600">
                      {exp}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="text-gray-500">No experience detected</div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ResumeAnalysis;
