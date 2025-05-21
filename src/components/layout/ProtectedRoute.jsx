import React, { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAppContext } from "../../context/AppContext";

const ProtectedRoute = ({ children }) => {
  const { user, loading, getCurrentUser } = useAppContext();
  const location = useLocation();
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (token && !user && !loading) {
      getCurrentUser();
    }
  }, [token, user, loading, getCurrentUser]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!token && !user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Special case: don't redirect to resume upload from these paths
  const noRedirectPaths = ['/upload-resume', '/verify', '/verify/', '/onboarding'];
  if (location.pathname && noRedirectPaths.some(path => location.pathname.startsWith(path))) {
    return children;
  }

  return children;
};

export default ProtectedRoute;
