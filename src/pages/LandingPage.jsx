import React from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto px-4 py-20 text-center">
      <h1 className="text-4xl font-bold text-gray-800 mb-6">
        Welcome to ColdMailer
      </h1>
      <p className="text-lg text-gray-600 mb-8">
        Helping students land their dream tech internships with personalized
        cold emails.
      </p>
      <div className="space-x-4">
        <Button variant="primary" size="lg" onClick={() => navigate("/signup")}>
          Sign Up
        </Button>
        <Button variant="outline" size="lg" onClick={() => navigate("/login")}>
          Login
        </Button>
      </div>
    </div>
  );
};

export default LandingPage;
