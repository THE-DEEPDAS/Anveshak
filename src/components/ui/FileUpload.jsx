import React, { useState } from "react";
import PropTypes from "prop-types";

const FileUpload = ({ onFileSelect, accept, maxSize, label }) => {
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState("");

  const handleDragOver = (event) => {
    event.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => {
    setDragging(false);
  };

  const handleDrop = (event) => {
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
    document.getElementById("file-input").click();
  };

  const removeFile = () => {
    setFileName("");
    onFileSelect(null);
  };

  return (
    <div className="file-upload">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <div
        className={`border-2 border-dashed rounded-lg p-4 text-center ${
          dragging ? "border-blue-500 bg-blue-50" : "border-gray-300"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={triggerFileInput}
      >
        {fileName ? (
          <div className="flex flex-col items-center">
            <p className="text-sm text-gray-700 mb-2">{fileName}</p>
            <button
              type="button"
              onClick={removeFile}
              className="text-red-500 hover:underline text-sm"
            >
              Remove File
            </button>
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            Drag and drop a file here, or click to select a file
          </p>
        )}
      </div>
      <input
        id="file-input"
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
};

FileUpload.propTypes = {
  onFileSelect: PropTypes.func.isRequired,
  accept: PropTypes.string,
  maxSize: PropTypes.number, // in MB
  label: PropTypes.string.isRequired,
};

export default FileUpload;
