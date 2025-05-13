import React from "react";
import EmailList from "../components/emails/EmailList";
import { useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import { useAppContext } from "../context/AppContext";
import { FaArrowLeft } from "react-icons/fa";

const EmailsPage = () => {
  const navigate = useNavigate();
  const { resume } = useAppContext();

  if (!resume) {
    return (
      <div className="container mx-auto px-4 py-10">
        <div className="max-w-md mx-auto text-center bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            No Resume Found
          </h1>
          <p className="text-gray-600 mb-6">
            You need to upload your resume before accessing your emails.
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
      <div className="mb-6 flex items-center">
        <Button
          variant="outline"
          size="sm"
          leftIcon={<FaArrowLeft className="h-4 w-4" />}
          onClick={() => navigate("/dashboard")}
          className="mr-4"
        >
          Back to Dashboard
        </Button>

        <div>
          <h1 className="text-3xl font-bold text-gray-800">Your Emails</h1>
          <p className="text-gray-600">
            View and manage all your generated cold emails.
          </p>
        </div>
      </div>

      <EmailList />
    </div>
  );
};

export default EmailsPage;
