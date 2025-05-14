import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaUserCircle, FaChevronDown } from "react-icons/fa";
import { useAppContext } from "../../context/AppContext";
import { logout } from "../../services/authService";
import AnveshakLogo from "../../components/assets/Anveshak.jpg";
import axios from "axios";
import { API_ENDPOINTS } from "../../config/api";

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAppContext();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [resume, setResume] = useState(null);
  const menuRef = useRef(null);
  const hasCheckedResume = useRef(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Check resume status only once when user is available
  useEffect(() => {
    if (user && !hasCheckedResume.current) {
      hasCheckedResume.current = true;
      axios
        .get(`${API_ENDPOINTS.resumes}/user/${user._id}/has-resume`)
        .then((response) => {
          setResume(response.data.hasResume ? { id: "exists" } : null);
        })
        .catch((error) => {
          console.error("Error checking resume status:", error);
        });
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      await logout();
      hasCheckedResume.current = false; // Reset the check for next login
      setResume(null);
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const toggleProfileMenu = () => {
    setShowProfileMenu(!showProfileMenu);
  };

  const renderAuthLinks = () => {
    // Don't show login/signup if user is logged in
    if (user) {
      return null;
    }

    // Only show auth links if not on login or signup pages
    if (location.pathname === "/login" || location.pathname === "/signup") {
      return null;
    }

    return (
      <>
        <Link
          to="/signup"
          className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
        >
          Sign Up
        </Link>
        <Link
          to="/login"
          className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
        >
          Login
        </Link>
      </>
    );
  };

  const renderProfileMenu = () => {
    if (!user) return null;

    return (
      <div className="relative" ref={menuRef}>
        <button
          onClick={toggleProfileMenu}
          className="flex items-center space-x-2 px-3 py-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors focus:outline-none"
        >
          <FaUserCircle className="h-5 w-5 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">{user.name}</span>
          <FaChevronDown
            className={`h-3 w-3 text-gray-500 transition-transform ${
              showProfileMenu ? "rotate-180" : ""
            }`}
          />
        </button>

        {showProfileMenu && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-50 border border-gray-200">
            <div className="px-4 py-2 border-b border-gray-200">
              <p className="text-sm font-medium text-gray-900">{user.name}</p>
              <p className="text-xs text-gray-600">{user.email}</p>
            </div>

            {resume && (
              <Link
                to="/dashboard"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => setShowProfileMenu(false)}
              >
                Dashboard
              </Link>
            )}

            <button
              onClick={() => {
                setShowProfileMenu(false);
                handleLogout();
              }}
              className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <img
            src={AnveshakLogo}
            alt="Anveshak Logo"
            className="h-8 w-8 object-contain rounded-full"
          />
          <span className="font-bold text-xl text-gray-800">Anveshak</span>
        </Link>

        <nav className="flex items-center space-x-6">
          <Link
            to="/"
            className={`text-sm font-medium ${
              location.pathname === "/"
                ? "text-blue-600"
                : "text-gray-600 hover:text-blue-600 transition-colors"
            }`}
          >
            Home
          </Link>
          {resume && (
            <Link
              to="/dashboard"
              className={`text-sm font-medium ${
                location.pathname === "/dashboard"
                  ? "text-blue-600"
                  : "text-gray-600 hover:text-blue-600 transition-colors"
              }`}
            >
              Dashboard
            </Link>
          )}
          {renderAuthLinks()}
          {renderProfileMenu()}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
