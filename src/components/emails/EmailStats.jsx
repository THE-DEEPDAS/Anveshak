import React, { useState, useEffect } from "react";
import { useAppContext } from "../../context/AppContext";
import { getUserEmails } from "../../services/emailService";
import {
  FaEnvelope,
  FaEnvelopeOpen,
  FaExclamationTriangle,
} from "react-icons/fa";

const EmailStats = () => {
  const { user } = useAppContext();
  // created an object to hold email statistics
  // and used useState to manage its state
  const [stats, setStats] = useState({
    total: 0,
    sent: 0,
    draft: 0,
    failed: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEmailStats = async () => {
      if (!user?._id) return;

      try {
        setLoading(true);
        const emails = await getUserEmails(user._id);

        const newStats = {
          total: emails.length,
          // filter thi je emails conidition satisfy kare te return thaay(element return kare)
          sent: emails.filter((email) => email.status === "sent").length,
          draft: emails.filter((email) => email.status === "draft").length,
          failed: emails.filter((email) => email.status === "failed").length,
        };

        setStats(newStats);
      } catch (error) {
        console.error("Error fetching email stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEmailStats();
  }, [user]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Email Statistics
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
          <div className="flex items-center">
            <FaEnvelope className="text-blue-500 text-xl mr-3" />
            <div>
              <h3 className="text-sm font-medium text-gray-500">
                Total Emails
              </h3>
              <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg border border-green-100">
          <div className="flex items-center">
            <FaEnvelopeOpen className="text-green-500 text-xl mr-3" />
            <div>
              <h3 className="text-sm font-medium text-gray-500">Sent</h3>
              <p className="text-2xl font-bold text-green-600">{stats.sent}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
          <div className="flex items-center">
            <FaEnvelope className="text-gray-500 text-xl mr-3" />
            <div>
              <h3 className="text-sm font-medium text-gray-500">Drafts</h3>
              <p className="text-2xl font-bold text-gray-600">{stats.draft}</p>
            </div>
          </div>
        </div>

        <div className="bg-red-50 p-4 rounded-lg border border-red-100">
          <div className="flex items-center">
            <FaExclamationTriangle className="text-red-500 text-xl mr-3" />
            <div>
              <h3 className="text-sm font-medium text-gray-500">Failed</h3>
              <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailStats;
