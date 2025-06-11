import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAppContext } from "../../context/AppContext";
import { checkPaymentStatus } from "../../services/paymentService";

const ProtectedRoute = ({ children }) => {
  const { user, loading, getCurrentUser } = useAppContext();
  const [hasValidPayment, setHasValidPayment] = useState(null);
  const [checkingPayment, setCheckingPayment] = useState(true);
  const location = useLocation();
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (token && !user && !loading) {
      getCurrentUser();
    }
  }, [token, user, loading, getCurrentUser]);

  useEffect(() => {
    const checkPayment = async () => {
      if (user) {
        try {
          const { hasValidPayment: isValid, paymentExpiryDate } =
            await checkPaymentStatus();
          const now = new Date();
          const expiryDate = paymentExpiryDate
            ? new Date(paymentExpiryDate)
            : null;
          const isValidPayment = isValid && expiryDate && expiryDate > now;

          // Special case: don't check payment for these paths
          const noPaymentCheckPaths = [
            "/payment-required",
            "/pricing",
            "/upload-resume",
            "/verify",
            "/verify/",
            "/onboarding",
            "/login",
            "/signup",
          ];

          const skipPaymentCheck = noPaymentCheckPaths.some((path) =>
            location.pathname.startsWith(path)
          );

          if (!isValidPayment && !skipPaymentCheck) {
            // Clear location state to prevent infinite redirects
            window.history.replaceState({}, "", "/payment-required");
            setHasValidPayment(false);
          } else {
            setHasValidPayment(isValidPayment || skipPaymentCheck);
          }
        } catch (error) {
          // Handle different error types appropriately
          if (error.response) {
            switch (error.response.status) {
              case 401:
                // Unauthorized - token issues
                console.warn(
                  "Auth error during payment check:",
                  error.response.data.message
                );
                localStorage.removeItem("token");
                window.location.href = "/login";
                break;
              case 402:
                // Payment required
                console.warn("Payment required:", error.response.data.message);
                setHasValidPayment(false);
                break;
              case 403:
                // Forbidden - permissions issues
                console.warn("Permission denied:", error.response.data.message);
                setHasValidPayment(false);
                break;
              default:
                // Other API errors
                console.error(
                  "Payment check error:",
                  error.response.data.message
                );
                setHasValidPayment(false);
            }
          } else if (error.request) {
            // Network error
            console.error("Network error during payment check:", error);
            setHasValidPayment(false);
          } else {
            // Other errors
            console.error("Payment check error:", error);
            setHasValidPayment(false);
          }
        }
      } else {
        setHasValidPayment(false);
      }
      setCheckingPayment(false);
    };

    checkPayment();
  }, [user, location.pathname]);

  if (loading || checkingPayment) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!token && !user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Special case paths that don't require payment validation
  const noPaymentCheckPaths = [
    "/payment-required",
    "/pricing",
    "/upload-resume",
    "/verify",
    "/verify/",
    "/onboarding",
    "/login",
    "/signup",
  ];

  if (!noPaymentCheckPaths.some((path) => location.pathname.startsWith(path))) {
    if (hasValidPayment === false) {
      return <Navigate to="/payment-required" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
