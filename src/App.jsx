import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster, ToastProvider } from "./components/ui/Toaster";
import React from "react";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import HomePage from "./pages/HomePage";
import OnboardingPage from "./pages/OnboardingPage";
import DashboardPage from "./pages/DashboardPage";
import EmailsPage from "./pages/EmailsPage";
import EmailDetailPage from "./pages/EmailDetailPage";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import { AppProvider } from "./context/AppContext";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import AcademicEmailsPage from "./pages/AcademicEmailsPage";
import AboutUsPage from "./pages/AboutUsPage";
import ContactUsPage from "./pages/ContactUsPage";
import PricingPage from "./pages/PricingPage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import TermsPage from "./pages/TermsPage";
import RefundPolicyPage from "./pages/RefundPolicyPage";
import PaymentRequiredPage from "./pages/PaymentRequiredPage";

// Enable React Router v7 future flags
const router = {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true,
  },
};

function App() {
  return (
    <ToastProvider>
      <Router {...router}>
        <AppProvider> 
          <div className="flex flex-col min-h-screen bg-gray-50">
            <Navbar />
            <main className="flex-grow">
              {" "}
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/verify-email" element={<VerifyEmailPage />} />
                <Route path="/about-us" element={<AboutUsPage />} />
                <Route path="/contact-us" element={<ContactUsPage />} />
                <Route path="/pricing" element={<PricingPage />} />
                <Route
                  path="/privacy-policy"
                  element={<PrivacyPolicyPage />}
                />{" "}
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/refund-policy" element={<RefundPolicyPage />} />
                <Route
                  path="/payment-required"
                  element={<PaymentRequiredPage />}
                />
                <Route
                  path="/onboarding"
                  element={
                    <ProtectedRoute>
                      <OnboardingPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <DashboardPage />
                    </ProtectedRoute>
                  }
                />{" "}
                <Route
                  path="/emails"
                  element={
                    <ProtectedRoute>
                      <EmailsPage />
                    </ProtectedRoute>
                  }
                />{" "}
                <Route
                  path="/emails/:emailId"
                  element={
                    <ProtectedRoute>
                      <EmailDetailPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/academic-emails"
                  element={
                    <ProtectedRoute>
                      <AcademicEmailsPage />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </main>
            <Footer />
            <Toaster />
          </div>
        </AppProvider>
      </Router>
    </ToastProvider>
  );
}

export default App;
