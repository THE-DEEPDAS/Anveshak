import React, { useState } from "react";
import PropTypes from "prop-types";

const FileUpload = ({
  onFileSelect,
  accept,
  maxSize,
  label,
  disabled = false,
}) => {
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState("");

  const handleDragOver = (event) => {
    if (disabled) return;
    event.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => {
    if (disabled) return;
    setDragging(false);
  };

  const handleDrop = (event) => {
    if (disabled) return;
    event.preventDefault();
    setDragging(false);

    const file = event.dataTransfer.files[0];
    if (file) {
      if (maxSize && file.size > maxSize * 1024 * 1024) {
        alert(`File size exceeds the maximum limit of ${maxSize} MB.`);
        return;
      }
      setFileName(file.name);
      onFileSelect(file);
    }
  };

  const handleFileChange = (event) => {
    if (disabled) return;
    const file = event.target.files[0];
    if (file) {
      if (maxSize && file.size > maxSize * 1024 * 1024) {
        alert(`File size exceeds the maximum limit of ${maxSize} MB.`);
        return;
      }
      setFileName(file.name);
      onFileSelect(file);
    }
  };

  const triggerFileInput = () => {
    if (disabled) return;
    document.getElementById("file-input").click();
  };

  const removeFile = () => {
    if (disabled) return;
    setFileName("");
    onFileSelect(null);
  };

  return (
    <div
      className={`file-upload ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      }`}
    >
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <div
        className={`border-2 border-dashed rounded-lg p-4 text-center ${
          disabled
            ? "bg-gray-100"
            : dragging
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300"
        } ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={triggerFileInput}
      >
        {fileName ? (
          <div className="flex flex-col items-center">
            <p className="text-sm text-gray-700 mb-2">{fileName}</p>
            {!disabled && (
              <button
                type="button"
                onClick={removeFile}
                className="text-red-500 hover:underline text-sm"
              >
                Remove File
              </button>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            {disabled
              ? "File upload disabled"
              : "Drag and drop a file here, or click to select a file"}
          </p>
        )}
      </div>
      <input
        id="file-input"
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />
    </div>
  );
};

FileUpload.propTypes = {
  onFileSelect: PropTypes.func.isRequired,
  accept: PropTypes.string,
  maxSize: PropTypes.number, // in MB
  label: PropTypes.string.isRequired,
  disabled: PropTypes.bool,
};

export default FileUpload;
