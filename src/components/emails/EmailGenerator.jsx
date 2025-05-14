import React, { useState, useEffect } from "react";
import Button from "../ui/Button";
import { useAppContext } from "../../context/AppContext";
import { generateEmails } from "../../services/emailService";
import CompanySelector from "./CompanySelector";
import { useToast } from "../../components/ui/Toaster";
import { FaSpinner } from "react-icons/fa";

const EmailGenerator = () => {
  const { resume } = useAppContext();
  const [companies, setCompanies] = useState([]);
  const [generatedEmails, setGeneratedEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [step, setStep] = useState("find-companies");
  const { showToast } = useToast();

  // Reset error when step changes
  useEffect(() => {
    setError(null);
  }, [step]);

  // Validate resume before operations
  const validateResume = () => {
    if (!resume) {
      throw new Error("Please upload your resume first");
    }
    if (!resume.id) {
      throw new Error(
        "Resume data is incomplete. Please try reuploading your resume"
      );
    }
    if (!resume.url) {
      throw new Error(
        "Resume file is not accessible. Please try reuploading your resume"
      );
    }
    if (
      !resume.skills?.length &&
      !resume.experience?.length &&
      !resume.projects?.length
    ) {
      throw new Error(
        "Resume parsing is incomplete. Please wait a moment and try again"
      );
    }
  };

  const findCompanies = async () => {
    setLoading(true);
    setError(null);
    try {
      validateResume();
      const response = await generateEmails(resume.id, {
        action: "find-companies",
        skills: resume.skills,
        experience: resume.experience,
        projects: resume.projects,
      });
      if (!response.companies?.length) {
        throw new Error(
          "No matching companies found. Try updating your resume with more details about your skills and experience."
        );
      }
      setCompanies(response.companies);
      setStep("select-companies");
    } catch (error) {
      console.error("Error finding companies:", error);
      setError(error.message || "Error finding matching companies");
      showToast(error.message || "Error finding matching companies", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCompaniesSelected = async (selectedCompanies) => {
    if (!selectedCompanies?.length) {
      showToast("Please select at least one company", "error");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      validateResume();
      const response = await generateEmails(resume.id, {
        action: "generate-emails",
        companies: selectedCompanies,
      });
      if (!response.emails?.length) {
        throw new Error("No emails were generated");
      }
      setGeneratedEmails(response.emails);
      setStep("review-emails");
    } catch (error) {
      console.error("Error generating emails:", error);
      setError(error.message || "Error generating emails");
      showToast(error.message || "Error generating emails", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmails = async () => {
    if (!generatedEmails?.length) {
      showToast("No emails to send", "error");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      validateResume();
      await generateEmails(resume.id, {
        action: "send-emails",
        emailIds: generatedEmails.map((email) => email._id),
      });
      showToast("Emails sent successfully!", "success");
      setStep("find-companies");
      setCompanies([]);
      setGeneratedEmails([]);
    } catch (error) {
      console.error("Error sending emails:", error);
      setError(error.message || "Error sending emails");
      showToast(error.message || "Error sending emails", "error");
    } finally {
      setLoading(false);
    }
  };

  const renderError = () => {
    if (!error) return null;
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <p className="text-red-600">{error}</p>
      </div>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <FaSpinner className="animate-spin h-8 w-8 text-blue-600 mb-4" />
          <p className="text-gray-600">
            {step === "find-companies"
              ? "Finding matching companies..."
              : step === "select-companies"
              ? "Generating emails..."
              : "Sending emails..."}
          </p>
        </div>
      );
    }

    return (
      <>
        {renderError()}

        {step === "find-companies" && (
          <div className="text-center py-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Find Matching Companies
            </h2>
            <p className="text-gray-600 mb-6">
              We'll analyze your skills and projects to find companies that
              would be a great fit.
            </p>
            <Button onClick={findCompanies}>Find Companies</Button>
          </div>
        )}

        {step === "select-companies" && (
          <CompanySelector
            companies={companies}
            onCompaniesSelected={handleCompaniesSelected}
          />
        )}

        {step === "review-emails" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Review Generated Emails
            </h2>

            {generatedEmails.map((email, index) => (
              <div
                key={index}
                className="bg-gray-50 rounded-lg p-6 border border-gray-200"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      {email.company}
                    </h3>
                    <p className="text-gray-600 text-sm">{email.recipient}</p>
                  </div>
                </div>
                <div className="mb-4">
                  <p className="font-medium text-gray-700">Subject:</p>
                  <p className="text-gray-800">{email.subject}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-700 mb-2">Body:</p>
                  <div className="bg-white p-4 rounded border border-gray-200 whitespace-pre-wrap text-gray-800">
                    {email.body}
                  </div>
                </div>
              </div>
            ))}

            <div className="flex justify-between items-center pt-6">
              <Button
                variant="outline"
                onClick={() => setStep("select-companies")}
              >
                Back to Selection
              </Button>
              <Button variant="primary" onClick={handleSendEmails}>
                Send Emails
              </Button>
            </div>
          </div>
        )}
      </>
    );
  };

  if (!resume) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <p className="text-yellow-800">
          Please upload your resume first to generate emails.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">{renderContent()}</div>
  );
};

export default EmailGenerator;
