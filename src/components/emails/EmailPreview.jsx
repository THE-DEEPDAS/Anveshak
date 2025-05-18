import React, { useState } from "react";
import Button from "../ui/Button";
import {
  FaEnvelope,
  FaSpinner,
  FaExclamationTriangle,
  FaCheck,
  FaRedo,
  FaEdit,
  FaSync,
} from "react-icons/fa";

const EmailPreview = ({
  emails,
  onSend,
  onClose,
  onUpdateEmail,
  onRegenerate,
}) => {
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [editingEmail, setEditingEmail] = useState(null);
  const [editedContent, setEditedContent] = useState("");
  const [sendingStatus, setSendingStatus] = useState({});
  const [overallProgress, setOverallProgress] = useState({
    sent: 0,
    total: emails.length,
  });

  const handleSendEmails = async () => {
    for (const email of emails) {
      setSendingStatus((prev) => ({
        ...prev,
        [email.recipient]: { status: "sending", attempts: 1 },
      }));

      try {
        await onSend(email);
        setSendingStatus((prev) => ({
          ...prev,
          [email.recipient]: {
            status: "sent",
            attempts: prev[email.recipient].attempts,
          },
        }));
        setOverallProgress((prev) => ({ ...prev, sent: prev.sent + 1 }));
      } catch (error) {
        setSendingStatus((prev) => ({
          ...prev,
          [email.recipient]: {
            status: "failed",
            error: error.message,
            attempts: prev[email.recipient].attempts,
          },
        }));
      }

      // Add delay between sends for rate limiting
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  };

  const handleRetry = async (email) => {
    setSendingStatus((prev) => ({
      ...prev,
      [email.recipient]: {
        status: "sending",
        attempts: prev[email.recipient].attempts + 1,
      },
    }));

    try {
      await onSend(email);
      setSendingStatus((prev) => ({
        ...prev,
        [email.recipient]: {
          status: "sent",
          attempts: prev[email.recipient].attempts,
        },
      }));
      setOverallProgress((prev) => ({ ...prev, sent: prev.sent + 1 }));
    } catch (error) {
      setSendingStatus((prev) => ({
        ...prev,
        [email.recipient]: {
          status: "failed",
          error: error.message,
          attempts: prev[email.recipient].attempts,
        },
      }));
    }
  };

  const handleEditEmail = (email) => {
    setSelectedEmail(null);
    setEditingEmail(email);
    setEditedContent(email.content);
  };

  const handleSaveEdit = () => {
    if (editingEmail && editedContent) {
      onUpdateEmail(editingEmail.recipient, editedContent);
      setEditingEmail(null);
      setEditedContent("");
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "sending":
        return <FaSpinner className="animate-spin text-blue-500" />;
      case "sent":
        return <FaCheck className="text-green-500" />;
      case "failed":
        return <FaExclamationTriangle className="text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Email Preview & Status</h2>
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
          </div>
          <div className="mt-2">
            <div className="bg-gray-100 rounded-lg p-3">
              <div className="flex justify-between items-center">
                <span>Overall Progress:</span>
                <span className="font-semibold">
                  {overallProgress.sent} / {overallProgress.total} sent
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${
                      (overallProgress.sent / overallProgress.total) * 100
                    }%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {editingEmail ? (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="mb-4">
                <h3 className="font-medium text-lg">Edit Email</h3>
                <p className="text-sm text-gray-600">
                  To: {editingEmail.recipient}
                </p>
                <p className="text-sm text-gray-600">
                  Subject: {editingEmail.subject}
                </p>
              </div>
              <textarea
                className="w-full h-96 p-4 border rounded-lg font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
              />
              <div className="flex justify-end space-x-3 mt-4">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setEditingEmail(null);
                    setEditedContent("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    onRegenerate(editingEmail);
                    setEditingEmail(null);
                    setEditedContent("");
                  }}
                >
                  <FaSync className="mr-1" /> Regenerate
                </Button>
                <Button variant="primary" onClick={handleSaveEdit}>
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 gap-4">
              {emails.map((email, index) => (
                <div
                  key={index}
                  className="border rounded-lg p-4 cursor-pointer hover:border-blue-500 transition-colors"
                  onClick={() =>
                    setSelectedEmail(
                      selectedEmail?.recipient === email.recipient
                        ? null
                        : email
                    )
                  }
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{email.recipient}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {email.subject}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(sendingStatus[email.recipient]?.status)}
                      <div className="flex space-x-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditEmail(email);
                          }}
                        >
                          <FaEdit className="mr-1" /> Edit
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRegenerate(email);
                          }}
                        >
                          <FaSync className="mr-1" /> Regenerate
                        </Button>
                        {sendingStatus[email.recipient]?.status ===
                          "failed" && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRetry(email);
                            }}
                          >
                            <FaRedo className="mr-1" /> Retry
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                  {sendingStatus[email.recipient]?.error && (
                    <p className="text-sm text-red-500 mt-2">
                      Error: {sendingStatus[email.recipient].error}
                    </p>
                  )}
                  {sendingStatus[email.recipient]?.attempts > 1 && (
                    <p className="text-sm text-gray-500 mt-1">
                      Attempts: {sendingStatus[email.recipient].attempts}
                    </p>
                  )}
                  {selectedEmail?.recipient === email.recipient && (
                    <div className="mt-4 bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {email.content}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="border-t p-6">
          <div className="flex justify-end space-x-4">
            <Button
              variant="primary"
              onClick={handleSendEmails}
              disabled={Object.keys(sendingStatus).length > 0}
            >
              <FaEnvelope className="mr-2" />
              Send All Emails
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailPreview;
