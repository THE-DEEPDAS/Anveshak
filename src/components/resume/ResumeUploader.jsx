import React, { useState, useEffect } from "react";
import { useAppContext } from "../../context/AppContext";
import { uploadResume, getResumeById } from "../../services/resumeService";
import { useNavigate } from "react-router-dom";
import Button from "../ui/Button";
import FileUpload from "../ui/FileUpload";
import { FaSpinner } from "react-icons/fa";
import { useToast } from "../../components/ui/Toaster";

const ResumeUploader = () => {
  const { user, resume, setResume } = useAppContext();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    if (resume?.id) {
      getResumeById(resume.id)
        .then((data) => {
          if (
            data.skills?.length ||
            data.experience?.length ||
            data.projects?.length
          ) {
            setResume({
              ...resume,
              skills: data.skills,
              experience: data.experience,
              projects: data.projects,
            });
          } else {
            showToast("Resume parsing in progress, please wait...", "info");
            // Poll for parsed data
            const pollInterval = setInterval(async () => {
              try {
                const updatedData = await getResumeById(resume.id);
                if (
                  updatedData.skills?.length ||
                  updatedData.experience?.length ||
                  updatedData.projects?.length
                ) {
                  clearInterval(pollInterval);
                  setResume({
                    ...resume,
                    skills: updatedData.skills,
                    experience: updatedData.experience,
                    projects: updatedData.projects,
                  });
                  showToast("Resume parsed successfully!", "success");
                }
              } catch (err) {
                console.error("Error polling resume data:", err);
              }
            }, 5000); // Poll every 5 seconds

            // Clean up interval after 2 minutes (24 attempts)
            setTimeout(() => {
              clearInterval(pollInterval);
              if (!resume.skills?.length) {
                showToast(
                  "Resume parsing taking longer than expected. Please try again.",
                  "error"
                );
              }
            }, 120000);

            return () => clearInterval(pollInterval);
          }
        })
        .catch((err) => {
          console.error("Error fetching resume details:", err);
          setError("Failed to load resume details");
          showToast("Error loading resume details", "error");
        });
    }
  }, [resume?.id, setResume, showToast]);

  const handleUpload = async (file) => {
    if (!file) return;

    const formData = new FormData();
    formData.append("resume", file);
    formData.append("name", user.name);
    formData.append("email", user.email);

    // If there's an existing resume, add a flag to indicate replacement
    if (resume?.id) {
      formData.append("replace", "true");
      formData.append("previousResumeId", resume.id);
    }

    setIsUploading(true);
    setError(null);

    try {
      const response = await uploadResume(formData);
      setResume({
        id: response.resumeId,
        url: response.url,
        skills: response.skills,
        experience: response.experience,
        projects: response.projects,
      });
      showToast("Resume uploaded successfully!", "success");
      navigate("/dashboard");
    } catch (error) {
      console.error("Error uploading resume:", error);
      setError(
        error.response?.data?.message ||
          "Failed to upload resume. Please try again."
      );
      showToast(
        error.response?.data?.message || "Failed to upload resume",
        "error"
      );
    } finally {
      setIsUploading(false);
    }
  };

  if (resume?.url) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Current Resume
        </h2>
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <a
              href={resume.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 underline"
            >
              View Current Resume
            </a>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-lg font-medium text-gray-800 mb-2">
              Upload New Resume
            </h3>
            <FileUpload
              onFileSelect={handleUpload}
              accept=".pdf"
              maxSize={5}
              label="Upload a new resume to replace the current one (PDF only, max 5MB)"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Upload Resume
      </h2>
      <div className="space-y-4">
        <FileUpload
          onFileSelect={handleUpload}
          accept=".pdf"
          maxSize={5}
          label="Upload your resume (PDF only, max 5MB)"
        />

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {isUploading && (
          <div className="flex items-center justify-center py-4">
            <FaSpinner className="animate-spin h-6 w-6 text-blue-600" />
            <span className="ml-2 text-gray-600">Uploading resume...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumeUploader;
