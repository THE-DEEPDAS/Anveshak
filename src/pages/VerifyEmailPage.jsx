import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { verifyEmailCode, resendVerificationCode } from "../services/authService";
import Button from "../components/ui/Button";
import { useToast } from "../components/ui/Toaster";

const VerifyEmailPage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [verificationCode, setVerificationCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState("");

  useEffect(() => {
    // Get email from sessionStorage
    const storedEmail = sessionStorage.getItem("verificationEmail");
    if (!storedEmail) {
      navigate("/login");
      return;
    }
    setEmail(storedEmail);
  }, [navigate]);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!verificationCode.trim()) {
      showToast("Please enter the verification code", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      await verifyEmailCode(email, verificationCode);
      showToast("Email verified successfully! Please log in.", "success");
      sessionStorage.removeItem("verificationEmail"); // Clean up
      setTimeout(() => navigate("/login"), 2000);
    } catch (error) {
      const errorMessage = 
        error.response?.data?.message || "Verification failed";
      showToast(errorMessage, "error");
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className="container mx-auto px-4 py-10">
      <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          Email Verification
        </h1>

        <p className="text-gray-600 mb-6">
          Please enter the verification code sent to your email: <br />
          <span className="font-semibold">{email}</span>
        </p>

        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              placeholder="Enter 6-digit code"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength="6"              pattern="[0-9]{6}"
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            isLoading={isSubmitting}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Verifying..." : "Verify Email"}
          </Button>
        </form>

        <div className="mt-4 text-sm">
          <p className="text-gray-600">
            Didn't receive the code?{" "}
            <button
              type="button"              onClick={async () => {
                try {
                  await resendVerificationCode(email);
                  showToast("Verification code resent to your email", "success");
                } catch (error) {
                  showToast(error.response?.data?.message || "Failed to resend code", "error");
                }
              }}
              className="text-blue-500 hover:text-blue-600"
              disabled={isSubmitting}
            >
              Resend Code
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
