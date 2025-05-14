import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { verifyEmail } from "../services/authService";
import Button from "../components/ui/Button";
import { useToast } from "../components/ui/Toaster";

const VerifyEmailPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [status, setStatus] = useState("verifying");
  const [verificationAttempted, setVerificationAttempted] = useState(false);

  useEffect(() => {
    const verify = async () => {
      if (verificationAttempted) return;

      try {
        setVerificationAttempted(true);
        await verifyEmail(token);
        setStatus("success");
        showToast("Email verified successfully!", "success");
      } catch (error) {
        setStatus("error");
        showToast(
          error.response?.data?.message || "Email verification failed",
          "error"
        );
      }
    };

    if (token) {
      verify();
    }
  }, [token, showToast, verificationAttempted]);

  // Prevent unnecessary re-renders by moving the content to constants
  const verifyingContent = (
    <div>
      <p className="text-gray-600 mb-4">Verifying your email address...</p>
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
    </div>
  );

  const successContent = (
    <div>
      <div className="mb-6">
        <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <svg
            className="w-6 h-6 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M5 13l4 4L19 7"
            ></path>
          </svg>
        </div>
        <p className="text-gray-600">
          Your email has been verified successfully!
        </p>
      </div>
      <Button
        variant="primary"
        onClick={() => navigate("/login")}
        className="w-full"
      >
        Proceed to Login
      </Button>
    </div>
  );

  const errorContent = (
    <div>
      <div className="mb-6">
        <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <svg
            className="w-6 h-6 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M6 18L18 6M6 6l12 12"
            ></path>
          </svg>
        </div>
        <p className="text-gray-600">
          Sorry, we couldn't verify your email. The verification link may be
          invalid or expired.
        </p>
      </div>
      <Button
        variant="primary"
        onClick={() => navigate("/signup")}
        className="w-full"
      >
        Back to Sign Up
      </Button>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          Email Verification
        </h1>
        {status === "verifying" && verifyingContent}
        {status === "success" && successContent}
        {status === "error" && errorContent}
      </div>
    </div>
  );
};

export default VerifyEmailPage;
