import React from "react";
import { Link, useLocation } from "react-router-dom";
import { FaEnvelope } from "react-icons/fa";

const Navbar = () => {
  const location = useLocation();
  const token = localStorage.getItem("token");

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
              location.pathname === "/"
                ? "text-blue-600"
                : "text-gray-600 hover:text-blue-600 transition-colors"
            }`}
          >
            Home
          </Link>
          {!token ? (
            <>
              <Link
                to="/signup"
                className={`text-sm font-medium ${
                  location.pathname === "/signup"
                    ? "text-blue-600"
                    : "text-gray-600 hover:text-blue-600 transition-colors"
                }`}
              >
                Sign Up
              </Link>
              <Link
                to="/login"
                className={`text-sm font-medium ${
                  location.pathname === "/login"
                    ? "text-blue-600"
                    : "text-gray-600 hover:text-blue-600 transition-colors"
                }`}
              >
                Login
              </Link>
            </>
          ) : (
            <Link
              to="/dashboard"
              className={`text-sm font-medium ${
                location.pathname === "/dashboard"
                  ? "text-blue-600"
                  : "text-gray-600 hover:text-blue-600 transition-colors"
              }`}
            >
              Profile
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
