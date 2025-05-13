import React from "react";
import { useAppContext } from "../../context/AppContext";

const ResumeAnalysis = () => {
  const { resume } = useAppContext();

  if (!resume) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Resume Analysis
      </h2>
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium text-gray-700">Skills</h3>
          <ul className="list-disc list-inside">
            {resume.skills.map((skill, index) => (
              <li key={index}>{skill}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-lg font-medium text-gray-700">Experience</h3>
          <ul className="list-disc list-inside">
            {resume.experience.map((exp, index) => (
              <li key={index}>{exp}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ResumeAnalysis;
