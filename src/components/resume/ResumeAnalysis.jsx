import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../../context/AppContext";
import { useToast } from "../../components/ui/Toaster";
import {
  FaSpinner,
  FaTrash,
} from "react-icons/fa";

const ResumeAnalysis = () => {
  const { resume, updateResume, deleteSkill } = useAppContext();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [isEditingSkills, setIsEditingSkills] = useState(false);
  const [isEditingExperience, setIsEditingExperience] = useState(false);
  const [isEditingProjects, setIsEditingProjects] = useState(false);
  const [editableSkills, setEditableSkills] = useState([]);
  const [editableExperience, setEditableExperience] = useState([]);
  const [editableProjects, setEditableProjects] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  // Reset editable states when resume changes
  useEffect(() => {
    if (resume) {
      setEditableSkills(resume.skills || []);
      setEditableExperience(resume.experience || []);
      setEditableProjects(resume.projects || []);
    }
  }, [resume]);

  const handleSave = async (field, data, setEditingState) => {
    if (isSaving) return; // Prevent multiple saves
    setIsSaving(true);

    try {
      // trim thi aagad ane pachad ni whitespaces ne remove kare che
      const validData = data.filter((item) => item.trim());
      if (validData.length === 0) {
        throw new Error(`Please add at least one ${field} item`);
      }

      const updatedData = {
        ...resume,
        [field]: validData,
      };

      await updateResume(updatedData);
      setEditingState(false); // Hide edit mode after successful save
    } catch (error) {
      console.error(`Error saving ${field}:`, error);
      showToast(error.message || `Failed to save ${field}`, "error");
      // Don't hide edit mode on error so user can try again
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSkills = () =>
    handleSave("skills", editableSkills, setIsEditingSkills);
  const handleSaveExperience = () =>
    handleSave("experience", editableExperience, setIsEditingExperience);
  const handleSaveProjects = () =>
    handleSave("projects", editableProjects, setIsEditingProjects);

  const handleEditToggle = (field) => {
    switch (field) {
      case "skills":
        if (isEditingSkills) {
          setEditableSkills(resume.skills || []);
        }
        setIsEditingSkills(!isEditingSkills);
        break;
      case "experience":
        if (isEditingExperience) {
          setEditableExperience(resume.experience || []);
        }
        setIsEditingExperience(!isEditingExperience);
        break;
      case "projects":
        if (isEditingProjects) {
          setEditableProjects(resume.projects || []);
        }
        setIsEditingProjects(!isEditingProjects);
        break;
    }
  };

  const hasValidContent = () => {
    const hasValidSkills =
      Array.isArray(resume?.skills) &&
      resume.skills.some((skill) => skill.trim());
    const hasValidExperience =
      Array.isArray(resume?.experience) &&
      resume.experience.some((exp) => exp.trim());
    return (
      (hasValidSkills || hasValidExperience) &&
      resume?.parseStatus === "completed"
    );
  };

  const canProceedToEmails = () => hasValidContent();

  const handleEmailGeneration = () => {
    if (canProceedToEmails()) {
      navigate("/emails");
    }
  };

  if (!resume) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <p className="text-yellow-800">
          Please upload your resume to see the analysis.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4">
      {resume.parseStatus === "pending" ? (
        <div className="flex items-center justify-center py-12 text-gray-600">
          <FaSpinner className="animate-spin mr-3 h-6 w-6" />
          <span>Analyzing resume contents... This may take a moment.</span>
        </div>
      ) : (
        <>          <div className="space-y-6">
            <div className="border rounded p-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold">Skills</h3>
                <button
                  onClick={() => handleEditToggle("skills")}
                  className="text-blue-600 hover:text-blue-800"
                  disabled={isSaving}
                >
                  {isEditingSkills ? "Cancel" : "Edit"}
                </button>
              </div>{" "}
              {isEditingSkills ? (
                <div className="space-y-2">
                  {editableSkills.map((skill, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={skill}
                        onChange={(e) => {
                          const newSkills = [...editableSkills];
                          newSkills[index] = e.target.value;
                          setEditableSkills(newSkills);
                        }}
                        className="border p-2 w-full rounded"
                      />
                      <button
                        onClick={() => {
                          const newSkills = [...editableSkills];
                          newSkills.splice(index, 1);
                          setEditableSkills(newSkills);
                        }}
                        className="text-red-600 hover:text-red-800 px-2 py-1 rounded"
                        title="Delete skill"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <div className="flex space-x-2 mt-4">
                    <button
                      onClick={() => setEditableSkills([...editableSkills, ""])}
                      className="text-green-600 hover:text-green-800 border border-green-600 px-3 py-1 rounded"
                      disabled={isSaving}
                    >
                      + Add Skill
                    </button>
                    <button
                      onClick={() => setEditableSkills([])}
                      className="text-red-600 hover:text-red-800 border border-red-600 px-3 py-1 rounded"
                      disabled={isSaving}
                    >
                      Clear All
                    </button>
                    <button
                      onClick={handleSaveSkills}
                      className="ml-2 bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
                      disabled={isSaving}
                    >
                      {isSaving ? "Saving..." : "Save"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {resume?.skills?.length > 0 ? (
                    <ul className="list-disc list-inside">
                      {resume.skills.map((skill, index) => (
                        <li
                          key={index}
                          className="flex items-center justify-between py-1"
                        >
                          <span>{skill}</span>
                          <button
                            onClick={async () => {
                              try {
                                setIsSaving(true);
                                await deleteSkill(index);
                                // No need to show toast as deleteSkill does it already
                              } catch (error) {
                                // Error handling is done in deleteSkill
                                console.error(
                                  "Error calling deleteSkill:",
                                  error
                                );
                              } finally {
                                setIsSaving(false);
                              }
                            }}
                            className="text-red-600 hover:text-red-800"
                            disabled={isSaving}
                            title="Delete skill"
                          >
                            <FaTrash size={14} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500 italic">
                      No skills found. Click Edit to add skills.
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="border rounded p-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold">Experience</h3>
                <button
                  onClick={() => handleEditToggle("experience")}
                  className="text-blue-600 hover:text-blue-800"
                  disabled={isSaving}
                >
                  {isEditingExperience ? "Cancel" : "Edit"}
                </button>
              </div>
              {isEditingExperience ? (
                <div className="space-y-2">
                  {editableExperience.map((exp, index) => (
                    <textarea
                      key={index}
                      value={exp}
                      onChange={(e) => {
                        const newExp = [...editableExperience];
                        newExp[index] = e.target.value;
                        setEditableExperience(newExp);
                      }}
                      className="border p-2 w-full rounded"
                      rows="3"
                    />
                  ))}
                  <button
                    onClick={() =>
                      setEditableExperience([...editableExperience, ""])
                    }
                    className="text-green-600 hover:text-green-800"
                    disabled={isSaving}
                  >
                    + Add Experience
                  </button>
                  <button
                    onClick={handleSaveExperience}
                    className="ml-2 bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
                    disabled={isSaving}
                  >
                    {isSaving ? "Saving..." : "Save"}
                  </button>
                </div>
              ) : (
                <ul className="list-disc list-inside">
                  {resume?.experience?.map((exp, index) => (
                    <li key={index}>{exp}</li>
                  ))}
                </ul>
              )}
            </div>

            <div className="border rounded p-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold">Projects (Optional)</h3>
                <button
                  onClick={() => handleEditToggle("projects")}
                  className="text-blue-600 hover:text-blue-800"
                  disabled={isSaving}
                >
                  {isEditingProjects ? "Cancel" : "Edit"}
                </button>
              </div>
              {isEditingProjects ? (
                <div className="space-y-2">
                  {editableProjects.map((proj, index) => (
                    <textarea
                      key={index}
                      value={proj}
                      onChange={(e) => {
                        const newProj = [...editableProjects];
                        newProj[index] = e.target.value;
                        setEditableProjects(newProj);
                      }}
                      className="border p-2 w-full rounded"
                      rows="3"
                    />
                  ))}
                  <button
                    onClick={() =>
                      setEditableProjects([...editableProjects, ""])
                    }
                    className="text-green-600 hover:text-green-800"
                    disabled={isSaving}
                  >
                    + Add Project
                  </button>
                  <button
                    onClick={handleSaveProjects}
                    className="ml-2 bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
                    disabled={isSaving}
                  >
                    {isSaving ? "Saving..." : "Save"}
                  </button>
                </div>
              ) : (
                <ul className="list-disc list-inside">
                  {resume?.projects?.map((proj, index) => (
                    <li key={index}>{proj}</li>
                  ))}
                </ul>
              )}
            </div>

            <div className="mt-4">
              {canProceedToEmails() ? (
                <button
                  onClick={handleEmailGeneration}
                  className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
                >
                  Continue to Email Generation
                </button>
              ) : (
                <p className="text-amber-600">
                  {resume?.skills?.length === 0 &&
                  resume?.experience?.length === 0
                    ? "Please add some skills or experience to continue with email generation."
                    : resume?.parseStatus !== "completed"
                    ? "Waiting for resume parsing to complete..."
                    : "Please ensure you have added either skills or experience to continue."}
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ResumeAnalysis;
