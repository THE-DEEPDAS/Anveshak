import React from "react";
import { useAppContext } from "../../context/AppContext";

const EmailList = () => {
  const { emails } = useAppContext();

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Email List</h2>
      <ul className="space-y-4">
        {emails.map((email, index) => (
          <li key={index} className="border-b border-gray-200 pb-4">
            <h3 className="text-lg font-medium text-gray-700">
              {email.subject}
            </h3>
            <p className="text-gray-600">{email.body}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default EmailList;
