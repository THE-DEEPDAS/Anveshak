import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../../context/AppContext";
import Button from "../ui/Button";
import {
  FaGraduationCap,
  FaSpinner,
  FaCheck,
  FaEnvelope,
} from "react-icons/fa";
import {
  searchAcademicFaculty,
  generatePreviewEmails,
} from "../../services/academicEmailService";
import axios from "axios";
import { API_ENDPOINTS } from "../../config/api";
import { useToast } from "../ui/Toaster";
import EmailPreview from "./EmailPreview";

const AcademicEmailGenerator = () => {
  const { resume } = useAppContext();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [faculty, setFaculty] = useState([]);
  const [selectedFaculty, setSelectedFaculty] = useState([]);
  const [selectedFacultyIds, setSelectedFacultyIds] = useState(new Set());
  const [step, setStep] = useState(1);
  const [showPreview, setShowPreview] = useState(false);
  const [previewEmails, setPreviewEmails] = useState([]);
  const handlePreviewEmails = async () => {
    if (!resume?.id) {
      showToast("Please upload a resume first", "error");
      return;
    } // Education is optional

    if (selectedFaculty.length === 0) {
      showToast("Please select at least one faculty member", "error");
      return;
    }

    setIsLoading(true);
    try {
      const emails = await generatePreviewEmails(resume.id, selectedFaculty);
      setPreviewEmails(emails);
      setShowPreview(true);
    } catch (error) {
      console.error("Error generating email previews:", error);
      showToast(error.message || "Failed to generate email previews", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateEmail = async (recipient, newContent) => {
    const emailToUpdate = previewEmails.find(
      (email) => email.recipient === recipient
    );
    if (!emailToUpdate) return;

    try {
      // Store the updated content
      setPreviewEmails((prev) =>
        prev.map((email) =>
          email.recipient === recipient
            ? { ...email, content: newContent }
            : email
        )
      );
      showToast("Email content updated successfully", "success");
    } catch (error) {
      console.error("Error updating email:", error);
      showToast("Failed to update email content", "error");
    }
  };

  const handleRegenerateEmail = async (email) => {
    try {
      setIsLoading(true);
      const faculty = selectedFaculty.find((f) => f.email === email.recipient);
      if (!faculty) throw new Error("Faculty member not found");

      const newContent = await regenerateEmail(resume, faculty, email.content);

      setPreviewEmails((prev) =>
        prev.map((e) =>
          e.recipient === email.recipient ? { ...e, content: newContent } : e
        )
      );
      showToast("Email regenerated successfully", "success");
    } catch (error) {
      console.error("Error regenerating email:", error);
      showToast(error.message || "Failed to regenerate email", "error");
    } finally {
      setIsLoading(false);
    }
  };
  const handleSendEmails = async (email) => {
    try {
      const response = await axios.post(
        `${API_ENDPOINTS.academic}/generate-preview-emails`,
        {
          resumeId: resume.id,
          selectedFaculty: [
            {
              _id: email.facultyId,
              email: email.recipient,
              name: selectedFaculty.find((f) => f._id === email.facultyId)
                ?.name,
              department: selectedFaculty.find((f) => f._id === email.facultyId)
                ?.department,
              institution: selectedFaculty.find(
                (f) => f._id === email.facultyId
              )?.institution,
              researchInterests: selectedFaculty.find(
                (f) => f._id === email.facultyId
              )?.researchInterests,
            },
          ],
        }
      );

      if (!response.data?.emails) {
        throw new Error("Failed to generate email preview");
      }

      return response.data.emails[0];
    } catch (error) {
      console.error("Error sending email:", error);
      throw new Error(error.response?.data?.message || "Failed to send email");
    }
  };

  const handleSearch = async () => {
    if (!resume?.skills?.length) {
      showToast("Please upload a resume with skills first", "error");
      return;
    }

    setIsLoading(true);
    try {
      const domains = [
        ...new Set([
          ...resume.skills,
          "robotics",
          "drones",
          "UAVs",
          "AI",
          "machine learning",
        ]),
      ];
      const result = await searchAcademicFaculty(domains);

      // Ensure result is an array and has required properties
      const validFaculty = (result || []).filter(
        (f) =>
          f &&
          typeof f === "object" &&
          f.name &&
          (!f.researchInterests || Array.isArray(f.researchInterests))
      );

      setFaculty(validFaculty);

      if (validFaculty.length > 0) {
        setStep(2);
      } else {
        showToast("No matching faculty found", "info");
      }
    } catch (error) {
      console.error("Error searching faculty:", error);
      showToast(error.message || "Failed to search faculty", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFacultySelection = (facultyMember) => {
    if (!facultyMember.email) {
      showToast("Faculty member must have an email address", "error");
      return;
    }
    setSelectedFaculty((prev) => {
      const isSelected = prev.some((f) => f._id === facultyMember._id);
      if (isSelected) {
        return prev.filter((f) => f._id !== facultyMember._id);
      }
      return [...prev, facultyMember];
    });
  };
  const handleFacultySelect = (facultyId) => {
    const selectedFacultyMember = faculty.find((f) => f._id === facultyId);
    if (!selectedFacultyMember) return;

    if (!selectedFacultyMember.email) {
      showToast("Faculty member must have an email address", "error");
      return;
    }

    setSelectedFacultyIds((prev) => {
      const newSelection = new Set(prev);
      if (newSelection.has(facultyId)) {
        newSelection.delete(facultyId);
      } else {
        // Only allow one selection at a time
        newSelection.clear();
        newSelection.add(facultyId);
      }
      return newSelection;
    });

    // Update selectedFaculty to match selectedFacultyIds
    setSelectedFaculty((prev) => {
      if (prev.some((f) => f._id === facultyId)) {
        return prev.filter((f) => f._id !== facultyId);
      }
      return [selectedFacultyMember];
    });
  };

  const renderFacultyList = () => {
    return faculty.map((faculty) => (
      <div
        key={faculty._id}
        className={`p-4 border rounded-lg mb-4 cursor-pointer ${
          selectedFacultyIds.has(faculty._id)
            ? "border-blue-500 bg-blue-50"
            : "border-gray-200 hover:border-blue-300"
        }`}
        onClick={() => handleFacultySelect(faculty._id)}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">{faculty.name}</h3>
            <p className="text-sm text-gray-600">{faculty.department}</p>
            <p className="text-sm text-gray-500">{faculty.institution?.name}</p>
          </div>
          <input
            type="checkbox"
            checked={selectedFacultyIds.has(faculty._id)}
            onChange={() => handleFacultySelect(faculty._id)}
            className="h-5 w-5 text-blue-600"
          />
        </div>
        <div className="mt-2">
          <p className="text-sm font-medium">Research Interests:</p>
          <div className="flex flex-wrap gap-2 mt-1">
            {faculty.researchInterests.map((interest, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-100 rounded-full text-xs"
              >
                {interest}
              </span>
            ))}
          </div>
        </div>
        {faculty.relevanceScore && (
          <div className="mt-2 text-sm text-gray-600">
            Match Score: {Math.round(faculty.relevanceScore)}%
          </div>
        )}
      </div>
    ));
  };

  const handleGenerateEmails = () => {
    if (selectedFaculty.length === 0) {
      showToast("Please select at least one faculty member", "error");
      return;
    }
    navigate("/emails");
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Academic Email Generator
            </h1>
            <p className="text-gray-600">
              Connect with faculty in top academic institutions
            </p>
          </div>
          <FaGraduationCap className="h-12 w-12 text-blue-600" />
        </div>
        {/* Step 1: Initial Search */}
        {step === 1 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-xl font-semibold mb-4">
                Find Research Opportunities
              </h2>
              <p className="text-gray-600 mb-6">
                We'll search for faculty members in IITs, NITs, IIITs, ISRO,
                DRDO, IIST, IISERs, and NISER whose research interests align
                with your skills and interests.
              </p>
              <Button
                variant="primary"
                size="lg"
                onClick={handleSearch}
                isLoading={isLoading}
                disabled={isLoading}
              >
                Start Faculty Search
              </Button>
            </div>
          </div>
        )}
        {/* Step 2: Faculty Selection */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">
                Select Faculty Members
              </h2>
              <div className="space-y-4">{renderFacultyList()}</div>
            </div>{" "}
            {/* Action Buttons */}
            <div className="flex justify-end space-x-4">
              <Button variant="secondary" size="lg" onClick={() => setStep(1)}>
                Back to Search
              </Button>
              <Button
                variant="primary"
                size="lg"
                onClick={handlePreviewEmails}
                isLoading={isLoading}
                disabled={selectedFaculty.length === 0 || isLoading}
              >
                <FaEnvelope className="mr-2" />
                Preview & Send ({selectedFaculty.length} selected)
              </Button>
            </div>
          </div>
        )}{" "}
      </div>
      {showPreview && (
        <EmailPreview
          emails={previewEmails}
          onSend={handleSendEmails}
          onClose={() => setShowPreview(false)}
          onUpdateEmail={handleUpdateEmail}
          onRegenerate={handleRegenerateEmail}
        />
      )}
    </div>
  );
};

export default AcademicEmailGenerator;
