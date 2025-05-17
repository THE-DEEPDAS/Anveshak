import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getEmailById } from "../../services/emailService";
import { format } from "date-fns";
import {
  FaEnvelope,
  FaEnvelopeOpen,
  FaExclamationTriangle,
  FaArrowLeft,
  FaUser,
  FaBuilding,
  FaBriefcase,
  FaClock,
} from "react-icons/fa";
import Button from "../ui/Button";

const EmailDetail = () => {
  const { emailId } = useParams();
  const [email, setEmail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEmailDetails = async () => {
      if (!emailId) return;

      try {
        setLoading(true);
        const fetchedEmail = await getEmailById(emailId);
        setEmail(fetchedEmail);
      } catch (err) {
        console.error("Error fetching email details:", err);
        setError("Failed to load email details");
      } finally {
        setLoading(false);
      }
    };

    fetchEmailDetails();
  }, [emailId]);

  const getStatusBadge = (status) => {
    switch (status) {
      case "sent":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <FaEnvelopeOpen className="mr-1" /> Sent
          </span>
        );
      case "draft":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <FaEnvelope className="mr-1" /> Draft
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <FaExclamationTriangle className="mr-1" /> Failed
          </span>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "Not sent yet";
    return format(new Date(dateStr), "MMMM dd, yyyy 'at' h:mm a");
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-10">
        <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md">
          <div className="animate-pulse flex flex-col space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-10">
        <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md text-center">
          <p className="text-red-500">{error}</p>
          <Button
            variant="primary"
            className="mt-4"
            onClick={() => navigate("/emails")}
          >
            Back to Email List
          </Button>
        </div>
      </div>
    );
  }

  if (!email) {
    return (
      <div className="container mx-auto px-4 py-10">
        <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md text-center">
          <p className="text-gray-600">Email not found</p>
          <Button
            variant="primary"
            className="mt-4"
            onClick={() => navigate("/emails")}
          >
            Back to Email List
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="outline"
          leftIcon={<FaArrowLeft />}
          onClick={() => navigate("/emails")}
          className="mb-4"
        >
          Back to Email List
        </Button>

        <div className="bg-white rounded-lg shadow-md p-8">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <h1 className="text-2xl font-bold text-gray-800">
              {email.subject}
            </h1>
            {getStatusBadge(email.status)}
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center">
              <FaBuilding className="text-gray-500 mr-2" />
              <div>
                <p className="text-sm text-gray-500">Company</p>
                <p className="font-medium">{email.company}</p>
              </div>
            </div>

            <div className="flex items-center">
              <FaUser className="text-gray-500 mr-2" />
              <div>
                <p className="text-sm text-gray-500">Recipient</p>
                <p className="font-medium">{email.recipient}</p>
              </div>
            </div>

            <div className="flex items-center">
              <FaBriefcase className="text-gray-500 mr-2" />
              <div>
                <p className="text-sm text-gray-500">Role</p>
                <p className="font-medium">{email.role || "Not specified"}</p>
              </div>
            </div>

            <div className="flex items-center">
              <FaClock className="text-gray-500 mr-2" />
              <div>
                <p className="text-sm text-gray-500">
                  {email.status === "sent" ? "Sent At" : "Created At"}
                </p>
                <p className="font-medium">
                  {email.status === "sent"
                    ? formatDate(email.sentAt)
                    : formatDate(email.createdAt)}
                </p>
              </div>
            </div>
          </div>

          {/* Email Body */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-2">Email Content</h2>
            <div className="bg-gray-50 p-6 rounded-lg whitespace-pre-wrap font-mono text-gray-700">
              {email.body}
            </div>
          </div>

          {/* Company Research (if available) */}
          {email.companyResearch &&
            Object.values(email.companyResearch).some((value) => value) && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold mb-2">Company Research</h2>
                <div className="bg-gray-50 p-4 rounded-lg">
                  {email.companyResearch.overview && (
                    <div className="mb-4">
                      <h3 className="font-semibold text-gray-700">Overview</h3>
                      <p className="text-gray-600">
                        {email.companyResearch.overview}
                      </p>
                    </div>
                  )}

                  {email.companyResearch.achievements && (
                    <div className="mb-4">
                      <h3 className="font-semibold text-gray-700">
                        Achievements
                      </h3>
                      <p className="text-gray-600">
                        {email.companyResearch.achievements}
                      </p>
                    </div>
                  )}

                  {email.companyResearch.culture && (
                    <div className="mb-4">
                      <h3 className="font-semibold text-gray-700">Culture</h3>
                      <p className="text-gray-600">
                        {email.companyResearch.culture}
                      </p>
                    </div>
                  )}

                  {email.companyResearch.projects && (
                    <div className="mb-4">
                      <h3 className="font-semibold text-gray-700">Projects</h3>
                      <p className="text-gray-600">
                        {email.companyResearch.projects}
                      </p>
                    </div>
                  )}

                  {email.companyResearch.techStack && (
                    <div className="mb-4">
                      <h3 className="font-semibold text-gray-700">
                        Tech Stack
                      </h3>
                      <p className="text-gray-600">
                        {email.companyResearch.techStack}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

          {email.status === "draft" && (
            <div className="flex justify-end">
              <Button variant="primary">Send Email</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailDetail;
