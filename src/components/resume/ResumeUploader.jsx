import React, { useState, useEffect } from "react";
import { useAppContext } from "../../context/AppContext";
import {
  uploadResume,
  getResumeById,
  retryParseResume,
} from "../../services/resumeService";
import { useNavigate } from "react-router-dom";
import Button from "../ui/Button";
import FileUpload from "../ui/FileUpload";
import {
  FaSpinner,
  FaSync,
  FaRobot,
  FaExclamationTriangle,
  FaTrash,
  FaCodeBranch,
  FaBrain,
  FaCog,
} from "react-icons/fa";
import { useToast } from "../../components/ui/Toaster";

const ResumeUploader = () => {
  const { user, resume, setResume, updateResume } = useAppContext();
  const [isUploading, setIsUploading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [error, setError] = useState(null);
  const [parseWarning, setParseWarning] = useState(null);
  const [parseMode, setParseMode] = useState("auto");
  const [showParseModeOptions, setShowParseModeOptions] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Parse mode options
  const parseModeOptions = [
    {
      value: "auto",
      label: "Auto (Default)",
      description: "Try simplified parser first, fall back to AI if needed",
    },
    {
      value: "simplified",
      label: "Simplified",
      description:
        "Use only the simplified parser (faster, less resource intensive)",
    },
    {
      value: "ai",
      label: "AI Parser",
      description:
        "Use AI to extract resume data (more accurate for complex resumes)",
    },
    {
      value: "retry",
      label: "Alternative Parser",
      description: "Try alternative parsing method",
    },
  ];

  useEffect(() => {
    if (resume?.id && resume.parseStatus === "pending") {
      setIsParsing(true);
      const pollInterval = setInterval(async () => {
        try {
          const data = await getResumeById(resume.id);
          if (data.parseStatus === "completed") {
            clearInterval(pollInterval);
            setIsParsing(false);
            setResume({
              ...resume,
              ...data,
              skills: data.skills || [],
              experience: data.experience || [],
              projects: data.projects || [],
            });
            showToast("Resume parsed successfully!", "success");
          } else if (data.parseStatus === "failed") {
            clearInterval(pollInterval);
            setIsParsing(false);
            setError(data.parseError?.message || "Failed to parse resume");
            showToast(
              data.parseError?.message || "Failed to parse resume",
              "error"
            );
          }
        } catch (err) {
          console.error("Error polling resume data:", err);
        }
      }, 5000); // Poll every 5 seconds

      // Clean up interval after 2 minutes
      setTimeout(() => {
        clearInterval(pollInterval);
        if (isParsing) {
          setIsParsing(false);
          setError("Resume parsing timed out. Please try uploading again.");
          showToast(
            "Resume parsing timed out. Please try uploading again.",
            "error"
          );
        }
      }, 120000);

      return () => clearInterval(pollInterval);
    }
  }, [resume?.id, resume?.parseStatus, setResume, showToast]);
  // Handle retry parsing
  const handleRetry = async (useAI = false) => {
    if (!resume || !resume.id) {
      showToast("No resume available to retry parsing", "error");
      return;
    }

    setIsRetrying(true);
    setError(null);

    try {
      const response = await retryParseResume(resume.id, useAI);

      setResume({
        ...resume,
        ...response.resume,
        skills: response.resume.skills || [],
        experience: response.resume.experience || [],
        projects: response.resume.projects || [],
        parseStatus: response.resume.parseStatus,
        warning: response.warning || null,
      });

      if (response.resume.parseStatus === "failed") {
        setError(
          "Retry parsing failed. Please try uploading a different file format."
        );
        showToast(
          "Retry parsing failed. Please try uploading a different file format.",
          "error"
        );
      } else if (response.warning) {
        setParseWarning(response.warning);
        showToast(
          "Resume parsed with some limitations. " + response.warning,
          "warning"
        );
      } else {
        showToast("Resume successfully re-parsed!", "success");
        setParseWarning(null);
      }
    } catch (error) {
      console.error("Error retrying resume parsing:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to retry parsing";
      setError(errorMessage);
      showToast(errorMessage, "error");
    } finally {
      setIsRetrying(false);
    }
  };

  // Toggle parse mode options display
  const toggleParseModeOptions = () => {
    setShowParseModeOptions(!showParseModeOptions);
  };

  // Handle parse mode selection
  const handleParseModeChange = (mode) => {
    setParseMode(mode);
    setShowParseModeOptions(false);
    showToast(`Parse mode set to: ${mode}`, "info");
  };

  const handleFileUpload = async (file) => {
    if (!file) {
      setError("Please select a file to upload");
      return;
    }
    const formData = new FormData();
    formData.append("resume", file); // Changed from "file" to "resume" to match server's expectation

    setIsUploading(true);
    setError(null);
    setParseWarning(null);

    try {
      const response = await uploadResume(formData, parseMode);

      setResume({
        id: response.resumeId,
        url: response.resume.url,
        parseStatus: response.resume.parseStatus,
        skills: response.resume.skills || [],
        experience: response.resume.experience || [],
        projects: response.resume.projects || [],
        warning: response.resume.warning || null,
        parseMethod: response.resume.parseMethod,
        foundExactSections: response.resume.foundExactSections,
      });

      if (response.resume.parseStatus === "failed") {
        setError(response.parsingError || "Failed to parse resume");
        showToast(response.parsingError || "Failed to parse resume", "error");
      } else if (response.resume.parseStatus === "pending") {
        showToast("Resume uploaded, parsing in progress...", "info");
        setIsParsing(true);
      } else if (response.resume.warning) {
        setParseWarning(response.resume.warning);
        showToast(
          "Resume uploaded with some limitations: " + response.resume.warning,
          "warning"
        );
        navigate("/dashboard");
      } else {
        showToast("Resume uploaded and parsed successfully!", "success");
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Error uploading resume:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to upload resume";
      setError(errorMessage);
      showToast(errorMessage, "error");
    } finally {
      setIsUploading(false);
    }
  };

  if (resume?.url) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Current Resume
        </h2>
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <a
              href={resume.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 underline"
              onClick={(e) => {
                if (!resume.url) {
                  e.preventDefault();
                  showToast("Resume URL is not available", "error");
                }
              }}
            >
              View Current Resume
            </a>

            {/* Parser method indicator */}
            {resume.parseMethod && (
              <div className="flex items-center">
                <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-md flex items-center">
                  {resume.parseMethod === "ai" ||
                  resume.parseMethod === "ai-fallback" ? (
                    <>
                      <FaRobot className="mr-1 text-blue-500" size={12} />
                      AI Parsed
                    </>
                  ) : resume.parseMethod?.includes("simplified") ? (
                    <>
                      <FaCodeBranch className="mr-1 text-green-500" size={12} />
                      Standard Parser
                    </>
                  ) : (
                    <>
                      <FaCog className="mr-1 text-gray-500" size={12} />
                      {resume.parseMethod}
                    </>
                  )}

                  {resume.foundExactSections && (
                    <span
                      className="ml-1 inline-block w-2 h-2 bg-green-500 rounded-full"
                      title="Found exact section headers"
                    ></span>
                  )}
                </span>
              </div>
            )}
          </div>

          {/* Parse status information */}
          {(resume.parseStatus === "failed" ||
            resume.warning ||
            parseWarning) && (
            <div
              className={`p-4 rounded-md ${
                resume.parseStatus === "failed"
                  ? "bg-red-50 border border-red-200"
                  : "bg-yellow-50 border border-yellow-200"
              }`}
            >
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <FaExclamationTriangle
                    className={`h-5 w-5 ${
                      resume.parseStatus === "failed"
                        ? "text-red-500"
                        : "text-yellow-500"
                    }`}
                  />
                </div>
                <div className="ml-3">
                  <h3
                    className={`text-sm font-medium ${
                      resume.parseStatus === "failed"
                        ? "text-red-800"
                        : "text-yellow-800"
                    }`}
                  >
                    {resume.parseStatus === "failed"
                      ? "Resume Parsing Failed"
                      : "Resume Parsing Warning"}
                  </h3>
                  <div
                    className={`mt-2 text-sm ${
                      resume.parseStatus === "failed"
                        ? "text-red-700"
                        : "text-yellow-700"
                    }`}
                  >
                    <p>
                      {resume.parseError?.message ||
                        resume.warning ||
                        parseWarning ||
                        "There was an issue parsing your resume."}
                    </p>
                  </div>{" "}
                  {/* Retry parsing options */}
                  <div className="mt-4">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        onClick={() => handleRetry(false)}
                        disabled={isRetrying}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-bold rounded-md text-black bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        {" "}
                        <FaSync
                          className={`mr-1 h-3 w-3 ${
                            isRetrying ? "animate-spin" : ""
                          }`}
                        />
                        <span className="font-bold text-black">
                          {isRetrying ? "Retrying..." : "Retry Parsing"}
                        </span>
                      </Button>

                      <Button
                        type="button"
                        onClick={() => handleRetry(true)}
                        disabled={isRetrying}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-bold rounded-md text-black bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        {" "}
                        <FaRobot className="mr-1 h-3 w-3" />
                        <span className="font-bold text-black">
                          {isRetrying ? "Processing..." : "Try AI Parsing"}
                        </span>
                      </Button>

                      <Button
                        type="button"
                        onClick={() => {
                          // First update resume with empty skills array
                          updateResume({
                            ...resume,
                            skills: [],
                          })
                            .then(() => {
                              // Then retry parsing with AI
                              handleRetry(true);
                            })
                            .catch((error) => {
                              showToast(
                                "Error clearing skills: " +
                                  (error.message || "Unknown error"),
                                "error"
                              );
                            });
                        }}
                        disabled={isRetrying}
                        className="inline-flex items-center px-3 py-1.5 border border-red-300 text-xs font-bold rounded-md text-black bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        <FaTrash className="mr-1 h-3 w-3" />
                        <span className="font-bold text-black">
                          Clear Skills & Parse
                        </span>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="border-t pt-4">
            <h3 className="text-lg font-medium text-gray-800 mb-2">
              Upload New Resume
            </h3>

            {/* Parse Mode Selection (when resume exists) */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Parse Mode
                </label>
                <button
                  type="button"
                  onClick={toggleParseModeOptions}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                >
                  <FaCog className="mr-1" />
                  {showParseModeOptions ? "Hide Options" : "Show Options"}
                </button>
              </div>

              {showParseModeOptions ? (
                <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
                  <div className="grid gap-3">
                    {parseModeOptions.map((option) => (
                      <div
                        key={option.value}
                        className={`flex items-start p-2 rounded-md cursor-pointer border ${
                          parseMode === option.value
                            ? "border-blue-500 bg-blue-50"
                            : "border-transparent hover:bg-gray-100"
                        }`}
                        onClick={() => handleParseModeChange(option.value)}
                      >
                        <div className="flex items-center h-5">
                          <input
                            type="radio"
                            name="parseMode"
                            checked={parseMode === option.value}
                            onChange={() => handleParseModeChange(option.value)}
                            className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                          />
                        </div>
                        <div className="ml-3">
                          <label className="font-medium text-gray-800 text-sm">
                            {option.label}
                          </label>
                          <p className="text-gray-500 text-xs">
                            {option.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center">
                  <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                    Selected:{" "}
                    {
                      parseModeOptions.find(
                        (option) => option.value === parseMode
                      )?.label
                    }
                  </span>
                </div>
              )}
            </div>

            <FileUpload
              onFileSelect={handleFileUpload}
              accept=".pdf"
              maxSize={5}
              label="Upload a new resume to replace the current one (PDF only, max 5MB)"
              disabled={isUploading || isParsing || isRetrying}
            />
          </div>
        </div>
      </div>
    );
  }
  // Resume uploader UI when no resume exists
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Upload Resume
      </h2>
      <div className="space-y-4">
        {/* Parse Mode Selection */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Parse Mode
            </label>
            <button
              type="button"
              onClick={toggleParseModeOptions}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
            >
              <FaCog className="mr-1" />
              {showParseModeOptions ? "Hide Options" : "Show Options"}
            </button>
          </div>

          {showParseModeOptions ? (
            <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
              <div className="grid gap-3">
                {parseModeOptions.map((option) => (
                  <div
                    key={option.value}
                    className={`flex items-start p-2 rounded-md cursor-pointer border ${
                      parseMode === option.value
                        ? "border-blue-500 bg-blue-50"
                        : "border-transparent hover:bg-gray-100"
                    }`}
                    onClick={() => handleParseModeChange(option.value)}
                  >
                    <div className="flex items-center h-5">
                      <input
                        type="radio"
                        name="parseMode"
                        checked={parseMode === option.value}
                        onChange={() => handleParseModeChange(option.value)}
                        className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                    </div>
                    <div className="ml-3">
                      <label className="font-medium text-gray-800 text-sm">
                        {option.label}
                      </label>
                      <p className="text-gray-500 text-xs">
                        {option.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center">
              <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                Selected:{" "}
                {
                  parseModeOptions.find((option) => option.value === parseMode)
                    ?.label
                }
              </span>
            </div>
          )}
        </div>

        <FileUpload
          onFileSelect={handleFileUpload}
          accept=".pdf"
          maxSize={5}
          label="Upload your resume (PDF only, max 5MB)"
          disabled={isUploading || isParsing || isRetrying}
        />

        {parseWarning && !error && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <FaExclamationTriangle className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">{parseWarning}</p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <FaExclamationTriangle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
                {resume?.id && (
                  <div className="mt-3">
                    {" "}
                    <Button
                      onClick={() => handleRetry(true)}
                      disabled={isRetrying}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-bold rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <FaRobot className="mr-2 h-4 w-4" />
                      <span className="font-bold">
                        {isRetrying
                          ? "Processing..."
                          : "Try Advanced AI Parsing"}
                      </span>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {(isUploading || isParsing || isRetrying) && (
          <div className="flex items-center justify-center py-4">
            <FaSpinner className="animate-spin h-6 w-6 text-blue-600" />
            <span className="ml-2 text-gray-600">
              {isUploading
                ? "Uploading resume..."
                : isRetrying
                ? "Retrying resume parsing..."
                : "Parsing resume..."}
            </span>
          </div>
        )}

        <div className="text-sm text-gray-500 mt-2">
          <p>Having trouble? Make sure your resume:</p>
          <ul className="list-disc list-inside mt-1 ml-2">
            <li>Is a valid PDF file (not password protected)</li>
            <li>Contains text that can be selected (not just images)</li>
            <li>Has clear section headers like "Skills", "Experience", etc.</li>
            <li>Has common formatting (headings, bullets, etc.)</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ResumeUploader;
