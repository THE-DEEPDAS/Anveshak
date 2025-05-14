import React, { useState } from "react";
import Button from "../ui/Button";

const CompanySelector = ({ companies, onCompaniesSelected }) => {
  const [selectedCompanies, setSelectedCompanies] = useState([]);

  const toggleCompanySelection = (company) => {
    setSelectedCompanies((prev) => {
      if (prev.find((c) => c.name === company.name)) {
        return prev.filter((c) => c.name !== company.name);
      }
      return [...prev, company];
    });
  };

  const handleSubmit = () => {
    if (selectedCompanies.length > 0) {
      onCompaniesSelected(selectedCompanies);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Select Target Companies
      </h2>

      <div className="space-y-6 mb-8">
        {companies.map((company) => (
          <div
            key={company.name}
            className={`p-4 border rounded-lg transition-colors cursor-pointer ${
              selectedCompanies.find((c) => c.name === company.name)
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 hover:border-blue-300"
            }`}
            onClick={() => toggleCompanySelection(company)}
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  {company.name}
                </h3>
                <p className="text-blue-600 font-medium">{company.role}</p>
              </div>
              <div className="text-sm text-gray-600">{company.email}</div>
            </div>

            <div className="mt-4 space-y-2">
              <div className="text-sm">
                <span className="font-medium text-gray-700">
                  Match Reason:{" "}
                </span>
                <span className="text-gray-600">{company.matchReason}</span>
              </div>

              {company.research && (
                <>
                  <div className="text-sm">
                    <span className="font-medium text-gray-700">
                      Overview:{" "}
                    </span>
                    <span className="text-gray-600">
                      {company.research.overview}
                    </span>
                  </div>

                  <div className="text-sm">
                    <span className="font-medium text-gray-700">
                      Recent Achievements:{" "}
                    </span>
                    <span className="text-gray-600">
                      {company.research.achievements}
                    </span>
                  </div>

                  <div className="text-sm">
                    <span className="font-medium text-gray-700">
                      Current Projects:{" "}
                    </span>
                    <span className="text-gray-600">
                      {company.research.projects}
                    </span>
                  </div>

                  <div className="text-sm">
                    <span className="font-medium text-gray-700">
                      Tech Stack:{" "}
                    </span>
                    <span className="text-gray-600">
                      {company.research.techStack}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600">
          {selectedCompanies.length} companies selected
        </p>
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={selectedCompanies.length === 0}
        >
          Generate Emails
        </Button>
      </div>
    </div>
  );
};

export default CompanySelector;
