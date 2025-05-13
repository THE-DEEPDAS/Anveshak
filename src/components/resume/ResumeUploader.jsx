import React, { useState } from "react";
import { FaUpload, FaSpinner } from "react-icons/fa";
import FileUpload from "../ui/FileUpload.jsx";
import Button from "../ui/Button";
import { useAppContext } from "../../context/AppContext";
import { uploadResume } from "../../services/resumeService";

const ResumeUploader = ({ onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const { setResume, setUser } = useAppContext();

  const handleFileSelect = (selectedFile) => {
    setFile(selectedFile);
    setError(null);
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a resume to upload");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("resume", file);

      // Add user data - in a real app, this would come from a form
      formData.append("name", "Test User");
      formData.append("email", "test@example.com");

      const response = await uploadResume(formData);

      setResume({
        id: response.resumeId,
        url: response.url,
        skills: response.skills,
        experience: response.experience,
        projects: response.projects,
      });

      setUser({
        id: response.userId,
        name: "Test User",
        email: "test@example.com",
      });

      onUploadSuccess();
    } catch (err) {
      console.error("Error uploading resume:", err);
      setError("Failed to upload resume. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Upload Your Resume
      </h2>

      <div className="space-y-6">
        <FileUpload
          onFileSelect={handleFileSelect}
          accept=".pdf"
          maxSize={5}
          label="Upload your resume (PDF)"
        />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end">
          <Button
            variant="primary"
            size="md"
            isLoading={uploading}
            disabled={!file || uploading}
            leftIcon={uploading ? undefined : <FaUpload className="h-4 w-4" />}
            onClick={handleUpload}
          >
            {uploading ? "Uploading..." : "Upload Resume"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ResumeUploader;
