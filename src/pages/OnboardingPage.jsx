import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ResumeUploader from '../components/resume/ResumeUploader';
import { FaArrowRight } from 'react-icons/fa';
import Button from '../components/ui/Button';
import { useAppContext } from '../context/AppContext';

const OnboardingPage = () => {
  const [uploadComplete, setUploadComplete] = useState(false);
  const navigate = useNavigate();
  const { resume } = useAppContext();

  const handleUploadSuccess = () => {
    setUploadComplete(true);
  };

  const handleContinue = () => {
    navigate('/dashboard');
  };

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-3">Let's Get Started</h1>
          <p className="text-gray-600">
            Upload your resume and we'll help you create personalized cold emails to send to companies.
          </p>
        </div>
        
        <div className="mb-8">
          <ResumeUploader onUploadSuccess={handleUploadSuccess} />
        </div>
        
        {uploadComplete && (
          <div className="text-center">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-lg font-medium text-gray-800">Resume uploaded successfully!</p>
              <p className="text-gray-600">We've analyzed your skills and experience.</p>
            </div>
            
            <Button
              variant="primary"
              size="lg"
              rightIcon={<FaArrowRight className="h-4 w-4" />}
              onClick={handleContinue}
            >
              Continue to Dashboard
            </Button>
          </div>
        )}
        
        {resume && !uploadComplete && (
          <div className="text-center">
            <p className="text-gray-600 mb-4">You've already uploaded a resume.</p>
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate('/dashboard')}
            >
              Go to Dashboard
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OnboardingPage;