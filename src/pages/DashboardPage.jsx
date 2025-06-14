import React from "react";
import { useNavigate } from "react-router-dom";
import ResumeUploader from "../components/resume/ResumeUploader";
import ResumeAnalysis from "../components/resume/ResumeAnalysis";
import EmailGenerator from "../components/emails/EmailGenerator";
import EmailStats from "../components/emails/EmailStats";
import Button from "../components/ui/Button";
import { useAppContext } from "../context/AppContext";
import { FaEnvelope, FaUpload, FaChartBar } from "react-icons/fa";

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user, resume } = useAppContext();

  const canShowEmailGenerator = () => {
    return (
      resume && (resume.skills?.length > 0 || resume.experience?.length > 0)
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome, {user?.name || "User"}!
          </h1>
          <p className="mt-2 text-gray-600">
            Manage your resume and generate personalized cold emails
          </p>
        </div>

        <div className="space-y-8">
          {!resume ? (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="text-center">
                <FaUpload className="mx-auto h-12 w-12 text-gray-400" />
                <h2 className="mt-4 text-xl font-semibold text-gray-900">
                  Upload Your Resume
                </h2>
                <p className="mt-2 text-gray-600">
                  Start by uploading your resume to analyze your skills and
                  experience
                </p>
              </div>
              <div className="mt-6">
                <ResumeUploader />
              </div>
            </div>
          ) : (
            <div className="grid gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      Current Resume
                    </h2>
                    <p className="text-sm text-gray-500">
                      Upload a new version anytime to update your analysis
                    </p>
                  </div>
                  <ResumeUploader />
                </div>
              </div>{" "}
              <ResumeAnalysis />
              {canShowEmailGenerator() && (
                <>
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <FaChartBar className="h-5 w-5 text-blue-500 mr-2" />
                        <h2 className="text-xl font-semibold text-gray-800">
                          Email Analytics
                        </h2>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<FaEnvelope className="h-4 w-4" />}
                        onClick={() => navigate("/emails")}
                      >
                        View All Emails
                      </Button>
                    </div>

                    <EmailStats />
                  </div>

                  <EmailGenerator />
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
