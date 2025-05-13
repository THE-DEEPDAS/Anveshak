import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaEnvelope, FaUser } from 'react-icons/fa';
import { useAppContext } from '../../context/AppContext';

const Navbar = () => {
  const location = useLocation();
  const { resume } = useAppContext();
  
  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <FaEnvelope className="h-6 w-6 text-blue-600" />
          <span className="font-bold text-xl text-gray-800">Anveshak</span>
        </Link>
        
        <nav className="flex items-center space-x-6">
          <Link 
            to="/"
            className={`text-sm font-medium ${
              location.pathname === '/' 
                ? 'text-blue-600' 
                : 'text-gray-600 hover:text-blue-600 transition-colors'
            }`}
          >
            Home
          </Link>
          
          <Link 
            to="/onboarding"
            className={`text-sm font-medium ${
              location.pathname === '/onboarding' 
                ? 'text-blue-600' 
                : 'text-gray-600 hover:text-blue-600 transition-colors'
            }`}
          >
            Upload Resume
          </Link>
          
          {resume && (
            <>
              <Link 
                to="/dashboard"
                className={`text-sm font-medium ${
                  location.pathname === '/dashboard' 
                    ? 'text-blue-600' 
                    : 'text-gray-600 hover:text-blue-600 transition-colors'
                }`}
              >
                Dashboard
              </Link>
              
              <Link 
                to="/emails"
                className={`text-sm font-medium ${
                  location.pathname === '/emails' 
                    ? 'text-blue-600' 
                    : 'text-gray-600 hover:text-blue-600 transition-colors'
                }`}
              >
                Emails
              </Link>
            </>
          )}
        </nav>
        
        <div className="flex items-center">
          <button className="flex items-center space-x-1 px-3 py-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
            <FaUser className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Profile</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;