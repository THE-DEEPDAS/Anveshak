import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { verifyEmail } from "../services/authService";
import Button from "../components/ui/Button";
import { useToast } from "../components/ui/Toaster";

const VerifyEmailPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [status, setStatus] = useState("pending"); // pending, verifying, success, or error
  const [isNavigating, setIsNavigating] = useState(false);

  const verify = useCallback(async () => {
    if (status !== "pending") return; // Prevent multiple verification attempts

    setStatus("verifying");
    try {
      const response = await verifyEmail(token);
      setStatus("success");
      showToast("Email verified successfully! Please log in.", "success");
    } catch (error) {
      setStatus("error");
      const errorMessage =
        error.response?.data?.message || "Email verification failed";
      showToast(errorMessage, "error");
    }
  }, [token, showToast, status]);

  useEffect(() => {
    if (token && status === "pending") {
      verify();
    }
  }, [token, verify, status]);

  const handleRedirect = (path) => {
    if (isNavigating) return;
    setIsNavigating(true);
    navigate(path);
  };

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          Email Verification
        </h1>

        {status === "pending" && (
          <p className="text-gray-600">Preparing verification...</p>
        )}

        {status === "verifying" && (
          <div>
            <p className="text-gray-600 mb-4">
              Verifying your email address...
            </p>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        )}

        {status === "success" && (
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
              onClick={() => handleRedirect("/login")}
              className="w-full"
              disabled={isNavigating}
            >
              {isNavigating ? "Redirecting..." : "Proceed to Login"}
            </Button>
          </div>
        )}

        {status === "error" && (
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
                Sorry, we couldn't verify your email. The verification link may
                be invalid or expired.
              </p>
            </div>
            <Button
              variant="primary"
              onClick={() => handleRedirect("/signup")}
              className="w-full"
              disabled={isNavigating}
            >
              {isNavigating ? "Redirecting..." : "Back to Sign Up"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmailPage;
