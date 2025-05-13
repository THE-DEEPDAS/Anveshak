import React, { useState } from "react";
import Button from "../ui/Button";
import { useAppContext } from "../../context/AppContext";
import { generateEmails } from "../../services/emailService";

const EmailGenerator = () => {
  const { resume } = useAppContext();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGenerateEmail = async () => {
    setLoading(true);
    try {
      const generatedEmail = await generateEmail(resume);
      setEmail(generatedEmail);
    } catch (error) {
      console.error("Error generating email:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Generate Email
      </h2>
      <Button onClick={handleGenerateEmail} isLoading={loading}>
        Generate Email
      </Button>
      {email && (
        <div className="mt-4">
          <h3 className="text-lg font-medium text-gray-700">
            Generated Email:
          </h3>
          <p className="text-gray-600 mt-2">{email}</p>
        </div>
      )}
    </div>
  );
};

export default EmailGenerator;
