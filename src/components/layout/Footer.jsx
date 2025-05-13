import React from 'react';
import { FaEnvelope, FaGithub, FaLinkedin } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-gray-200 py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <div className="flex items-center space-x-2">
              <FaEnvelope className="h-5 w-5 text-blue-400" />
              <span className="font-bold text-lg">Anveshak</span>
            </div>
            <p className="text-sm text-gray-400 mt-1">
              Helping students land their dream tech internships
            </p>
          </div>
          
          <div className="flex flex-col md:flex-row md:space-x-8 text-center md:text-left">
            <div className="mb-4 md:mb-0">
              <h3 className="font-semibold mb-2 text-white">Links</h3>
              <ul className="space-y-1 text-sm">
                <li><a href="/" className="text-gray-400 hover:text-white transition-colors">Home</a></li>
                <li><a href="/onboarding" className="text-gray-400 hover:text-white transition-colors">Upload Resume</a></li>
                <li><a href="/dashboard" className="text-gray-400 hover:text-white transition-colors">Dashboard</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2 text-white">Connect</h3>
              <div className="flex space-x-4 justify-center md:justify-start">
                <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                  <FaGithub className="h-5 w-5" />
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                  <FaLinkedin className="h-5 w-5" />
                </a>
                <a href="mailto:contact@coldmailer.com" className="text-gray-400 hover:text-white transition-colors">
                  <FaEnvelope className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-6 pt-6 text-center text-xs text-gray-500">
          <p>&copy; {new Date().getFullYear()} ColdMailer. All rights reserved.</p>
          <p className="mt-1">Built with React, Node.js, MongoDB, and Gemini AI.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;