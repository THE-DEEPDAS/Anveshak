import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAppContext } from "../../context/AppContext";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAppContext();
  const location = useLocation();
  const token = localStorage.getItem("token");

  // Don't redirect while loading auth state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Only redirect if there's no token and no user
  if (!token && !user) {
    return <Navigate to="/onboarding" state={{ from: location.pathname }} replace />;
  }

  return children;
};

export default ProtectedRoute;
