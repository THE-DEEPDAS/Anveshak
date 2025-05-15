import React, { createContext, useContext, useState, useEffect } from "react";
import { getCurrentUser } from "../services/authService";
import { useNavigate } from "react-router-dom";
import { updateResume as updateResumeService } from "../services/resumeService";
import { useToast } from "../components/ui/Toaster";

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
  const { showToast } = useToast();

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
          !location.pathname.startsWith("/login") &&
          !location.pathname.startsWith("/signup") &&
          !location.pathname.startsWith("/verify")
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

  const updateResume = async (updatedResume) => {
    try {
      const response = await updateResumeService(updatedResume);

      if (!response || !response.id) {
        throw new Error("Invalid response from server");
      }

      setResume({
        id: response.id,
        url: response.url,
        skills: response.skills || [],
        experience: response.experience || [],
        projects: response.projects || [],
        parseStatus: response.parseStatus || "completed",
      });

      showToast(response.message || "Resume updated successfully", "success");
      return response;
    } catch (error) {
      console.error("Error saving resume updates:", error);
      const errorMessage =
        typeof error === "string"
          ? error
          : error.message || "Failed to save changes";
      showToast(errorMessage, "error");
      throw error;
    }
  };

  const value = {
    user,
    setUser,
    resume,
    setResume,
    updateResume,
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

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
