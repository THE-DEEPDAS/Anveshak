import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Aa main entry point for the React application che
// This file initializes the React application and renders the main App component
// StrictMode helps identify potential problems in the application like deprecated APIs, higlight sideeffects, etc.

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);