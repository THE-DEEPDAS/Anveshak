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
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    if (resume?.id && resume.parseStatus === "pending") {
      setIsParsing(true);
      const pollInterval = setInterval(async () => {
        try {
          const data = await getResumeById(resume.id);
          if (data.parseStatus === "completed") {
            clearInterval(pollInterval);
            setIsParsing(false);
            setResume({
              ...resume,
              ...data,
              skills: data.skills || [],
              experience: data.experience || [],
              projects: data.projects || [],
            });
            showToast("Resume parsed successfully!", "success");
          } else if (data.parseStatus === "failed") {
            clearInterval(pollInterval);
            setIsParsing(false);
            setError(data.parseError?.message || "Failed to parse resume");
            showToast(
              data.parseError?.message || "Failed to parse resume",
              "error"
            );
          }
        } catch (err) {
          console.error("Error polling resume data:", err);
        }
      }, 5000); // Poll every 5 seconds

      // Clean up interval after 2 minutes
      setTimeout(() => {
        clearInterval(pollInterval);
        if (isParsing) {
          setIsParsing(false);
          setError("Resume parsing timed out. Please try uploading again.");
          showToast(
            "Resume parsing timed out. Please try uploading again.",
            "error"
          );
        }
      }, 120000);

      return () => clearInterval(pollInterval);
    }
  }, [resume?.id, resume?.parseStatus, setResume, showToast]);

  const handleUpload = async (file) => {
    if (!file) return;

    // Validate file type and size
    if (file.type !== "application/pdf") {
      showToast("Only PDF files are allowed", "error");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast("File size must be less than 5MB", "error");
      return;
    }

    const formData = new FormData();
    formData.append("resume", file);
    formData.append("name", user.name);
    formData.append("email", user.email);

    setIsUploading(true);
    setError(null);

    try {
      const response = await uploadResume(formData);

      setResume({
        id: response.resumeId,
        url: response.resume.url,
        parseStatus: response.resume.parseStatus,
        skills: response.resume.skills || [],
        experience: response.resume.experience || [],
        projects: response.resume.projects || [],
      });

      if (response.resume.parseStatus === "failed") {
        setError(response.parsingError || "Failed to parse resume");
        showToast(response.parsingError || "Failed to parse resume", "error");
      } else if (response.resume.parseStatus === "pending") {
        showToast("Resume uploaded, parsing in progress...", "info");
        setIsParsing(true);
      } else {
        showToast("Resume uploaded and parsed successfully!", "success");
      }

      navigate("/dashboard");
    } catch (error) {
      console.error("Error uploading resume:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to upload resume";
      setError(errorMessage);
      showToast(errorMessage, "error");
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
              onClick={(e) => {
                if (!resume.url) {
                  e.preventDefault();
                  showToast("Resume URL is not available", "error");
                }
              }}
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
              disabled={isUploading || isParsing}
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
          disabled={isUploading || isParsing}
        />

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {(isUploading || isParsing) && (
          <div className="flex items-center justify-center py-4">
            <FaSpinner className="animate-spin h-6 w-6 text-blue-600" />
            <span className="ml-2 text-gray-600">
              {isUploading ? "Uploading resume..." : "Parsing resume..."}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumeUploader;
