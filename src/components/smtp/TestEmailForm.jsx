import React, { useState } from "react";
import { FaEnvelope } from "react-icons/fa";
import axios from "../../config/api";
import Button from "../ui/Button";

const TestEmailForm = ({ userProfile }) => {
  const [sendingTestEmail, setSendingTestEmail] = useState(false);
  const [testEmailResult, setTestEmailResult] = useState(null);
  const [testEmailAddress, setTestEmailAddress] = useState("");
  const [error, setError] = useState("");

  // Helper to validate email format
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Send test email using saved SMTP settings
  const sendTestEmail = async () => {
    if (!testEmailAddress || !isValidEmail(testEmailAddress)) {
      setError("Please enter a valid email address for the test email");
      return;
    }
    
    if (!userProfile?.smtpSettings?.useCustomSettings) {
      setError("You must enable and save custom SMTP settings before sending a test email");
      return;
    }
    
    try {
      setSendingTestEmail(true);
      setError("");
      setTestEmailResult(null);
      
      const response = await axios.post("/smtp/test-email", {
        recipient: testEmailAddress
      });
      
      setSendingTestEmail(false);
      setTestEmailResult({
        success: true,
        message: `Test email sent successfully to ${testEmailAddress}`,
        details: response.data.details || {}
      });
    } catch (error) {
      setSendingTestEmail(false);
      console.error("Test email failed:", error);
      
      setTestEmailResult({
        success: false,
        message: `Failed to send test email: ${error.response?.data?.message || error.message}`,
        details: error.response?.data?.details || ""
      });
    }
  };

  // Don't render if user doesn't have custom SMTP settings
  if (!userProfile?.smtpSettings?.useCustomSettings) {
    return null;
  }

  return (
    <div className="mt-8 pt-6 border-t border-gray-200">
      <h3 className="text-lg font-medium text-gray-900 mb-3">Send Test Email</h3>
      <p className="text-sm text-gray-600 mb-4">
        Send a test email to verify your SMTP settings are working correctly.
        The email will be sent using your configured SMTP server.
      </p>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {testEmailResult && (
        <div className={`mb-4 p-3 rounded-md ${testEmailResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <p className={`text-sm font-medium ${testEmailResult.success ? 'text-green-800' : 'text-red-800'}`}>
            {testEmailResult.message}
          </p>
          {/* only show additional details when not success */}
          {testEmailResult.details && !testEmailResult.success && (
            <p className="mt-1 text-xs text-red-600">
              {testEmailResult.details}
            </p>
          )}
        </div>
      )}
      
      <div className="flex items-end space-x-4">
        <div className="flex-grow">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Recipient Email
          </label>
          <input
            type="email" 
            value={testEmailAddress}
            onChange={(e) => setTestEmailAddress(e.target.value)}
            placeholder="Enter email address"
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        
        <Button
          type="button"
          onClick={sendTestEmail}
          disabled={sendingTestEmail}
          variant="secondary"
          className="inline-flex items-center mb-0"
        >
          {sendingTestEmail ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Sending...
            </>
          ) : (
            <>
              <FaEnvelope className="mr-2" />
              Send Test Email
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default TestEmailForm;
