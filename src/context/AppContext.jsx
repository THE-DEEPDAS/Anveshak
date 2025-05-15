import React, { createContext, useContext, useState, useEffect } from "react";
import { getCurrentUser } from "../services/authService";
import { useNavigate } from "react-router-dom";

const AppContext = createContext();

export const useAppContext = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [resume, setResume] = useState(() => {
    try {
      const stored = localStorage.getItem("resume");
      const parsedResume = stored ? JSON.parse(stored) : null;
      // Validate resume data
      if (parsedResume && parsedResume.id && parsedResume.url) {
        return parsedResume;
      }
      return null;
    } catch (error) {
      console.error("Error parsing stored resume:", error);
      localStorage.removeItem("resume");
      return null;
    }
  });
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
        if (
          !PUBLIC_ROUTES.some((route) => location.pathname.startsWith(route))
        ) {
          window.location.href = "/login";
        }
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, [location.pathname]);

  // Save resume to localStorage when it changes
  useEffect(() => {
    if (resume) {
      localStorage.setItem("resume", JSON.stringify(resume));
    } else {
      localStorage.removeItem("resume");
    }
  }, [resume]);

  const contextValue = {
    user,
    setUser,
    resume,
    setResume,
    emails,
    setEmails,
    loading,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
  );
};
