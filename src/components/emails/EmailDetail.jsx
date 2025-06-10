import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getEmailById, updateEmail } from "../../services/emailService";
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
  FaEdit,
} from "react-icons/fa";
import Button from "../ui/Button";

const EmailDetail = () => {
  const { emailId } = useParams();
  const [email, setEmail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedSubject, setEditedSubject] = useState("");
  const [editedBody, setEditedBody] = useState("");
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEmailDetails = async () => {
      if (!emailId) return;

      try {
        setLoading(true);
        const fetchedEmail = await getEmailById(emailId);
        setEmail(fetchedEmail);
        setEditedSubject(fetchedEmail.subject || "");
        setEditedBody(fetchedEmail.body || "");
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
    // formats this type of date: "2023-10-01T12:34:56.789Z"
    if (!dateStr) return "Not sent yet";
    return format(new Date(dateStr), "MMMM dd, yyyy 'at' h:mm a");
  };

  const formatTechStack = (techStack) => {
    if (!techStack) return "No tech stack available";
    if (typeof techStack === "string") return techStack;
    if (typeof techStack === "object") {
      const stack = Object.entries(techStack)
        .filter(([_, values]) => Array.isArray(values) && values.length > 0)
        .map(([category, values]) => `${category}: ${values.join(", ")}`)
        .join("\n");
      return stack || "No tech stack available";
    }
    return "No tech stack available";
  };

  // Initialize edit mode with current values
  const startEditing = () => {
    setEditedSubject(email.subject);
    setEditedBody(email.body);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditedSubject("");
    setEditedBody("");
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const updatedEmail = await updateEmail(emailId, {
        subject: editedSubject,
        body: editedBody,
      });
      setEmail(updatedEmail);
      setIsEditing(false);
      setSaving(false);
    } catch (err) {
      console.error("Error saving email:", err);
      setError("Failed to save changes");
      setSaving(false);
    }
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
          {/* Header */}{" "}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">
              {isEditing ? "Edit Email" : email.subject}
            </h1>
            <div className="flex items-center space-x-4">
              {email.status === "draft" && !isEditing && (
                <Button variant="secondary" onClick={startEditing}>
                  <FaEdit className="mr-2" /> Edit Email
                </Button>
              )}
              {getStatusBadge(email.status)}
            </div>
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
          </div>{" "}
          {/* Email Content */}
          {isEditing ? (
            <div className="space-y-4 mb-8">
              <div>
                <label
                  htmlFor="subject"
                  className="block text-sm font-medium text-gray-700"
                >
                  Subject
                </label>
                <input
                  type="text"
                  id="subject"
                  value={editedSubject}
                  onChange={(e) => setEditedSubject(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Enter email subject..."
                />
              </div>
              <div>
                <label
                  htmlFor="body"
                  className="block text-sm font-medium text-gray-700"
                >
                  Body
                </label>
                <textarea
                  id="body"
                  rows={15}
                  // flag jevu che je kai changes thase to batavse
                  value={editedBody}
                  onChange={(e) => setEditedBody(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 font-mono"
                  placeholder="Enter email body..."
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  onClick={cancelEditing}
                  variant="secondary"
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button onClick={handleSave} variant="primary" loading={saving}>
                  Save Changes
                </Button>
              </div>
            </div>
          ) : (
            <div className="mb-8">
              <div className="mb-4">
                <h2 className="text-lg font-semibold mb-2">Subject</h2>
                <div className="bg-gray-50 p-4 rounded-lg">{email.subject}</div>
              </div>
              <div>
                <h2 className="text-lg font-semibold mb-2">Body</h2>
                <div className="bg-gray-50 p-6 rounded-lg whitespace-pre-wrap font-mono text-gray-700">
                  {email.body}
                </div>
              </div>
            </div>
          )}
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
                      <pre className="text-gray-600 whitespace-pre-wrap font-mono text-sm bg-white p-3 rounded border">
                        {formatTechStack(email.companyResearch.techStack)}
                      </pre>
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
