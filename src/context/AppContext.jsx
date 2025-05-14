import React, { createContext, useContext, useState, useEffect } from "react";
import { getCurrentUser } from "../services/authService";

const AppContext = createContext();

export const useAppContext = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [resume, setResume] = useState(null);
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const contextValue = {
    user,
    setUser,
    resume,
    setResume,
    emails,
    setEmails,
    loading,
    setLoading,
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
