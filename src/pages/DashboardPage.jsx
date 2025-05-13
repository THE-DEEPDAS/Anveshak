import React from "react";
import { useNavigate } from "react-router-dom";
import ResumeAnalysis from "../components/resume/ResumeAnalysis";
import EmailGenerator from "../components/emails/EmailGenerator";
import Button from "../components/ui/Button";
import { useAppContext } from "../context/AppContext";
import { FaEnvelope } from "react-icons/fa";

const DashboardPage = () => {
  const navigate = useNavigate();
  const { resume, emails } = useAppContext();

  if (!resume) {
    return (
      <div className="container mx-auto px-4 py-10">
        <div className="max-w-md mx-auto text-center bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            No Resume Found
          </h1>
          <p className="text-gray-600 mb-6">
            You need to upload your resume before accessing the dashboard.
          </p>
          <Button variant="primary" onClick={() => navigate("/onboarding")}>
            Upload Resume
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-600">
          Generate personalized cold emails based on your resume.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <ResumeAnalysis />
        </div>

        <div className="md:col-span-2">
          <EmailGenerator />

          {emails.length > 0 && (
            <div className="mt-6 bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  Email Status
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<FaEnvelope className="h-4 w-4" />}
                  onClick={() => navigate("/emails")}
                >
                  View All Emails
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <p className="text-sm text-blue-700 mb-1">Total Emails</p>
                  <p className="text-2xl font-bold text-blue-800">
                    {emails.length}
                  </p>
                </div>

                <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                  <p className="text-sm text-green-700 mb-1">Sent</p>
                  <p className="text-2xl font-bold text-green-800">
                    {emails.filter((email) => email.status === "sent").length}
                  </p>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                  <p className="text-sm text-purple-700 mb-1">Pending</p>
                  <p className="text-2xl font-bold text-purple-800">
                    {emails.filter((email) => email.status === "draft").length}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
