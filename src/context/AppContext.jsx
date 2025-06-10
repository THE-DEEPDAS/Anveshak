import React, { createContext, useContext, useState, useEffect } from "react";
import { getCurrentUser } from "../services/authService";
import { useNavigate } from "react-router-dom";
import {
  updateResume as updateResumeService,
  deleteSkill as deleteSkillService,
  getUserResumes,
} from "../services/resumeService";
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
  // List of public routes that don't require auth
  const publicRoutes = ["/login", "/signup", "/verify-email", "/"];
  // Fetch resume data when user logs in
  useEffect(() => {
    // this will show that a component is active and prevent memory leaks
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        // Special handling for verification page
        const currentPath = window.location.pathname;
        if (currentPath === "/verify-email") {
          const verificationEmail = sessionStorage.getItem("verificationEmail");
          if (verificationEmail) {
            // Allow access to verification page if we have a pending verification
            setLoading(false);
            return;
          }
        }

        // Check if we're on a public route
        if (publicRoutes.includes(currentPath)) {
          setLoading(false);
          return;
        }

        // For protected routes, verify authentication
        try {
          const currentUser = await getCurrentUser();
          if (isMounted) {
            if (currentUser) {
              setUser(currentUser);
            } else {
              // No user found, clear state and redirect if needed
              setUser(null);
              if (!publicRoutes.includes(currentPath) && currentPath !== "/verify-email") {
                navigate("/login");
              }
            }
          }
        } catch (error) {
          console.error("Auth check failed:", error);
          if (isMounted) {
            setUser(null);
            // Only redirect if not on a public route
            if (!publicRoutes.includes(currentPath)) {
              navigate("/login");
            }
          }
        }
      } finally{
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
    };
  }, []); // Only run on mount

  // Fetch resume data when user logs in
  useEffect(() => {
    const fetchUserData = async () => {
      if (user?._id) {
        try {
          // Get all user's resumes
          const resumes = await getUserResumes(user._id);
          if (resumes?.length > 0) {
            // Set the most recent resume
            setResume(resumes[0]);
          }
        } catch (error) {
          console.error("Error fetching resume:", error);
        }
      }
    };
    fetchUserData();
  }, [user]);

  // Fetch user emails when user is authenticated
  useEffect(() => {
    const fetchUserEmails = async () => {
      if (!user?._id) return;

      try {
        const { getUserEmails } = await import("../services/emailService");
        const userEmails = await getUserEmails(user._id);
        setEmails(userEmails || []);
      } catch (error) {
        console.error("Error fetching user emails:", error);
      }
    };

    fetchUserEmails();
  }, [user]);

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

  const deleteSkill = async (skillIndex) => {
    if (!resume || !resume.id) {
      showToast("No resume available", "error");
      return;
    }

    try {
      const response = await deleteSkillService(resume.id, skillIndex);

      if (!response || !response.id) {
        throw new Error("Invalid response from server");
      }

      setResume({
        ...resume,
        skills: response.skills || [],
        parseStatus: response.parseStatus || "completed",
      });

      showToast("Skill removed successfully", "success");
      return response;
    } catch (error) {
      console.error("Error deleting skill:", error);
      const errorMessage =
        typeof error === "string"
          ? error
          : error.message || "Failed to delete skill";
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
    deleteSkill,
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
