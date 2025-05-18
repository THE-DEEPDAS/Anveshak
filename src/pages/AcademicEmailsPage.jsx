import React from "react";
import { useAppContext } from "../context/AppContext";
import AcademicEmailGenerator from "../components/emails/AcademicEmailGenerator";

const AcademicEmailsPage = () => {
  const { resume } = useAppContext();

  if (!resume) {
    navigate("/onboarding");
    return null;
  }

  return <AcademicEmailGenerator />;
};

export default AcademicEmailsPage;
