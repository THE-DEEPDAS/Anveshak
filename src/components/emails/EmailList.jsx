import React, { useState, useEffect } from "react";
import { useAppContext } from "../../context/AppContext";
import { getUserEmails } from "../../services/emailService";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import {
  FaEnvelope,
  FaEnvelopeOpen,
  FaExclamationTriangle,
  FaCalendar,
  FaBuilding,
  FaUser,
  FaBriefcase,
} from "react-icons/fa";

const EmailList = () => {
  const { user, resume } = useAppContext();
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEmails = async () => {
      if (!user?._id) return;

      try {
        setLoading(true);
        const fetchedEmails = await getUserEmails(user._id);
        setEmails(fetchedEmails);
      } catch (err) {
        console.error("Error fetching emails:", err);
        setError("Failed to load your emails");
      } finally {
        setLoading(false);
      }
    };

    fetchEmails();
  }, [user]);

  const getStatusIcon = (status) => {
    switch (status) {
      case "sent":
        return <FaEnvelopeOpen className="text-green-500" />;
      case "draft":
        return <FaEnvelope className="text-gray-500" />;
      case "failed":
        return <FaExclamationTriangle className="text-red-500" />;
      default:
        return <FaEnvelope className="text-gray-500" />;
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return format(new Date(dateStr), "MMM dd, yyyy h:mm a");
  };

  const filteredEmails = emails.filter((email) => {
    if (selectedFilter === "all") return true;
    return email.status === selectedFilter;
  });

  const viewEmailDetails = (emailId) => {
    navigate(`/emails/${emailId}`);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        Loading your emails...
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-red-500 text-center">
        {error}
      </div>
    );
  }

  if (!emails.length) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <p className="text-gray-600 mb-4">
          You haven't created any emails yet.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Email History</h2>
        <div className="flex space-x-2">
          <button
            className={`px-3 py-1 text-sm rounded-full ${
              selectedFilter === "all"
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-100"
            }`}
            onClick={() => setSelectedFilter("all")}
          >
            All
          </button>
          <button
            className={`px-3 py-1 text-sm rounded-full ${
              selectedFilter === "sent"
                ? "bg-green-100 text-green-700"
                : "bg-gray-100"
            }`}
            onClick={() => setSelectedFilter("sent")}
          >
            Sent
          </button>
          <button
            className={`px-3 py-1 text-sm rounded-full ${
              selectedFilter === "draft"
                ? "bg-gray-200 text-gray-700"
                : "bg-gray-100"
            }`}
            onClick={() => setSelectedFilter("draft")}
          >
            Draft
          </button>
          <button
            className={`px-3 py-1 text-sm rounded-full ${
              selectedFilter === "failed"
                ? "bg-red-100 text-red-700"
                : "bg-gray-100"
            }`}
            onClick={() => setSelectedFilter("failed")}
          >
            Failed
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Company
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Recipient
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Subject
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sent At
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredEmails.map((email) => (
              <tr
                key={email._id}
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => viewEmailDetails(email._id)}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {getStatusIcon(email.status)}
                    <span className="ml-2 capitalize text-sm">
                      {email.status}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <FaBuilding className="text-gray-400 mr-2" />
                    <span className="text-sm">{email.company}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <FaUser className="text-gray-400 mr-2" />
                    <span className="text-sm">{email.recipient}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <FaBriefcase className="text-gray-400 mr-2" />
                    <span className="text-sm">{email.role}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm font-medium text-gray-900 truncate block max-w-[300px]">
                    {email.subject}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <FaCalendar className="text-gray-400 mr-2" />
                    <span className="text-sm">{formatDate(email.sentAt)}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EmailList;
