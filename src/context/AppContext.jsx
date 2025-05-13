import React, { createContext, useContext, useState } from 'react';

const AppContext = createContext();

export const useAppContext = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [resume, setResume] = useState(null);
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(false);

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        resume,
        setResume,
        emails,
        setEmails,
        loading,
        setLoading,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};