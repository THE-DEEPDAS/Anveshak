# Cold Mailer Frontend Components Documentation

This document provides technical documentation for the frontend components of the Cold Mailer application.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Component Structure](#component-structure)
3. [Core Components](#core-components)
4. [Context & State Management](#context--state-management)
5. [Services & API Integration](#services--api-integration)
6. [UI Components](#ui-components)
7. [Pages](#pages)
8. [Routing](#routing)
9. [Form Handling](#form-handling)
10. [Error Handling](#error-handling)
11. [Performance Considerations](#performance-considerations)

## Architecture Overview

Cold Mailer's frontend is built using React with a component-based architecture. It follows these key architectural principles:

- **Component Encapsulation**: Each component has a specific responsibility
- **Context-based State Management**: AppContext provides global state
- **Service Layer**: API calls are abstracted through service modules
- **Responsive Design**: Uses TailwindCSS for adaptive layouts
- **Route-based Code Splitting**: Improves performance through lazy loading

### Tech Stack

- **React**: UI library (based on React 18+)
- **Vite**: Build tool and development server
- **TailwindCSS**: Utility-first CSS framework
- **React Router**: Client-side routing
- **Axios**: HTTP client for API requests

## Component Structure

The application follows a hierarchical component structure:

```
App (Root)
├── Layout Components
│   ├── Header
│   ├── Sidebar
│   └── Footer
├── Page Components
│   ├── HomePage
│   ├── DashboardPage
│   ├── EmailsPage
│   └── ...
└── Feature Components
    ├── Resume Components
    ├── Email Components
    └── UI Components
```

## Core Components

### AppContext (`src/context/AppContext.jsx`)

Central state management component that provides global state including:

```jsx
const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // User state
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Resume state
  const [resume, setResume] = useState(null);
  const [allResumes, setAllResumes] = useState([]);

  // Email state
  const [emails, setEmails] = useState([]);

  // Loading state
  const [loading, setLoading] = useState(false);

  // App initialization
  useEffect(() => {
    // Load user data, check authentication, fetch resumes
    // ...
  }, []);

  // Methods for user management, resume operations, email handling
  // ...

  const value = {
    user,
    setUser,
    isAuthenticated,
    setIsAuthenticated,
    resume,
    setResume,
    allResumes,
    setAllResumes,
    emails,
    setEmails,
    loading,
    setLoading,
    // Methods exposed to components
    logout,
    uploadResume,
    fetchResumes,
    fetchEmails,
    // ...
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => useContext(AppContext);
```

### App (`src/App.jsx`)

Root component that sets up routing and global providers:

```jsx
function App() {
  return (
    <Router>
      <AppProvider>
        <ToastProvider>
          <div className="app-container">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/verify-email" element={<VerifyEmailPage />} />

              {/* Protected routes */}
              <Route element={<PrivateRoute />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/emails" element={<EmailsPage />} />
                <Route path="/emails/:id" element={<EmailDetailPage />} />
                <Route
                  path="/academic-emails"
                  element={<AcademicEmailsPage />}
                />
                {/* Additional routes */}
              </Route>
            </Routes>
          </div>
        </ToastProvider>
      </AppProvider>
    </Router>
  );
}
```

## Context & State Management

### AppContext

The AppContext serves as the central state management solution providing:

- User authentication state
- Current resume data
- Email collection and statistics
- Application-wide loading state
- Error handling utilities

#### Key Methods:

```jsx
// User authentication
const login = async (credentials) => {
  // Implementation
};

const logout = async () => {
  // Implementation
};

// Resume operations
const uploadResume = async (file) => {
  // Implementation
};

const fetchResumes = async () => {
  // Implementation
};

// Email operations
const fetchEmails = async (filters) => {
  // Implementation
};

const sendEmail = async (emailId) => {
  // Implementation
};
```

### Toast Context

Provides application-wide toast notifications:

```jsx
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = "success", duration = 5000) => {
    // Implementation
  };

  const dismissToast = (id) => {
    // Implementation
  };

  // Render toasts and provide context
};
```

## Services & API Integration

### API Configuration (`src/config/api.js`)

```javascript
import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Configure axios defaults
axios.defaults.baseURL = API_BASE_URL;
axios.defaults.withCredentials = true;
axios.defaults.headers.common["Content-Type"] = "application/json";

// Request interceptor
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Handle token expiration, refresh logic, etc.
    return Promise.reject(error);
  }
);

export const API_ENDPOINTS = {
  auth: "/auth",
  users: "/users",
  resumes: "/resumes",
  emails: "/emails",
  academic: "/academic",
};

export default axios;
```

### Authentication Service (`src/services/authService.js`)

```javascript
import api, { API_ENDPOINTS } from "../config/api";

export const login = async (email, password) => {
  try {
    const response = await api.post(`${API_ENDPOINTS.auth}/login`, {
      email,
      password,
    });

    // Store token in localStorage
    localStorage.setItem("token", response.data.token);

    return response.data;
  } catch (error) {
    console.error("Login error:", error);
    throw error.response?.data || error;
  }
};

export const register = async (userData) => {
  // Implementation
};

export const logout = async () => {
  // Implementation
};

export const verifyEmail = async (token) => {
  // Implementation
};

export const resetPasswordRequest = async (email) => {
  // Implementation
};

export const resetPassword = async (token, password) => {
  // Implementation
};
```

### Resume Service (`src/services/resumeService.js`)

```javascript
import api, { API_ENDPOINTS } from "../config/api";

export const uploadResume = async (file) => {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post(
      `${API_ENDPOINTS.resumes}/upload`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Resume upload error:", error);
    throw error.response?.data || error;
  }
};

export const getResumes = async () => {
  // Implementation
};

export const getResumeById = async (id) => {
  // Implementation
};

export const updateResume = async (id, data) => {
  // Implementation
};

export const retryParse = async (id, forceAI = false) => {
  // Implementation
};
```

### Email Service (`src/services/emailService.js`)

```javascript
import api, { API_ENDPOINTS } from "../config/api";

export const generateEmails = async (resumeId, options) => {
  try {
    const response = await api.post(`${API_ENDPOINTS.emails}/generate`, {
      resumeId,
      ...options,
    });

    return response.data;
  } catch (error) {
    console.error("Email generation error:", error);
    throw error.response?.data || error;
  }
};

export const getEmails = async (filters = {}) => {
  // Implementation
};

export const getEmailById = async (id) => {
  // Implementation
};

export const sendEmail = async (emailId) => {
  // Implementation
};
```

### Academic Email Service (`src/services/academicEmailService.js`)

```javascript
import api, { API_ENDPOINTS } from "../config/api";

export const searchAcademicFaculty = async (domains) => {
  try {
    const response = await api.post(`${API_ENDPOINTS.academic}/search`, {
      domains,
    });

    return response.data.facultyList;
  } catch (error) {
    console.error("Faculty search error:", error);
    throw error.response?.data || error;
  }
};

export const generatePreviewEmails = async (resumeId, selectedFaculty) => {
  // Implementation
};

export const sendFacultyEmails = async (resumeId, selectedFaculty) => {
  // Implementation
};

export const regenerateEmail = async (
  resumeData,
  facultyMember,
  previousContent
) => {
  // Implementation
};
```

## UI Components

### Button Component (`src/components/ui/Button.jsx`)

```jsx
const Button = ({
  children,
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled = false,
  className = "",
  onClick,
  ...props
}) => {
  // Variant classes
  const variantClasses = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white",
    secondary: "bg-gray-200 hover:bg-gray-300 text-gray-800",
    danger: "bg-red-600 hover:bg-red-700 text-white",
    success: "bg-green-600 hover:bg-green-700 text-white",
    outline:
      "bg-transparent border border-blue-600 text-blue-600 hover:bg-blue-50",
  };

  // Size classes
  const sizeClasses = {
    sm: "py-1 px-3 text-sm",
    md: "py-2 px-4",
    lg: "py-3 px-6 text-lg",
  };

  // Base classes
  const baseClasses =
    "rounded font-medium transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50";

  // Disabled classes
  const disabledClasses = "opacity-50 cursor-not-allowed";

  return (
    <button
      className={`
        ${baseClasses}
        ${variantClasses[variant] || variantClasses.primary}
        ${sizeClasses[size] || sizeClasses.md}
        ${disabled || isLoading ? disabledClasses : ""}
        ${className}
      `}
      disabled={disabled || isLoading}
      onClick={onClick}
      {...props}
    >
      {isLoading ? (
        <div className="flex items-center justify-center">
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          {children}
        </div>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;
```

### Toast Component (`src/components/ui/Toast.jsx`)

```jsx
const Toast = ({ id, message, type = "success", onDismiss }) => {
  // Type-based styling
  const typeStyles = {
    success: "bg-green-100 border-green-500 text-green-800",
    error: "bg-red-100 border-red-500 text-red-800",
    warning: "bg-yellow-100 border-yellow-500 text-yellow-800",
    info: "bg-blue-100 border-blue-500 text-blue-800",
  };

  // Type-based icons
  const typeIcons = {
    success: <CheckCircleIcon className="h-5 w-5" />,
    error: <XCircleIcon className="h-5 w-5" />,
    warning: <ExclamationIcon className="h-5 w-5" />,
    info: <InformationCircleIcon className="h-5 w-5" />,
  };

  useEffect(() => {
    // Auto-dismiss after 5 seconds
    const timer = setTimeout(() => {
      onDismiss(id);
    }, 5000);

    return () => clearTimeout(timer);
  }, [id, onDismiss]);

  return (
    <div
      className={`${
        typeStyles[type] || typeStyles.info
      } border-l-4 p-4 rounded shadow-md mb-3 flex justify-between items-center`}
    >
      <div className="flex items-center">
        {typeIcons[type] || typeIcons.info}
        <p className="ml-2">{message}</p>
      </div>
      <button
        onClick={() => onDismiss(id)}
        className="text-gray-600 hover:text-gray-800"
      >
        <XIcon className="h-4 w-4" />
      </button>
    </div>
  );
};
```

## Email Components

### EmailGenerator (`src/components/emails/EmailGenerator.jsx`)

Key component for generating company emails:

```jsx
const EmailGenerator = () => {
  const { resume } = useAppContext();
  const [companies, setCompanies] = useState([]);
  const [generatedEmails, setGeneratedEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [step, setStep] = useState("find-companies");
  const [editingEmail, setEditingEmail] = useState(null);
  const [editedSubject, setEditedSubject] = useState("");
  const [editedBody, setEditedBody] = useState("");
  const { showToast } = useToast();

  // Validate resume before operations
  const validateResume = () => {
    if (!resume) {
      throw new Error("Please upload your resume first");
    }
    if (!resume.id) {
      throw new Error(
        "Resume data is incomplete. Please try reuploading your resume"
      );
    }
    if (!resume.url) {
      throw new Error(
        "Resume file is not accessible. Please try reuploading your resume"
      );
    }
    if (
      !resume.skills?.length &&
      !resume.experience?.length &&
      !resume.projects?.length
    ) {
      throw new Error(
        "Resume parsing is incomplete. Please wait a moment and try again"
      );
    }
  };

  const findCompanies = async () => {
    // Implementation for finding matching companies
  };

  const handleCompaniesSelected = async (selectedCompanies) => {
    // Implementation for generating emails
  };

  const handleSendEmails = async () => {
    // Implementation for sending emails
  };

  const handleEditEmail = (email) => {
    // Implementation for editing email
  };

  const handleSaveEdit = () => {
    // Implementation for saving edited email
  };

  // Render component based on current step
  // ...
};
```

### AcademicEmailGenerator (`src/components/emails/AcademicEmailGenerator.jsx`)

```jsx
const AcademicEmailGenerator = () => {
  const { resume } = useAppContext();
  const [faculty, setFaculty] = useState([]);
  const [selectedFaculty, setSelectedFaculty] = useState([]);
  const [previewEmails, setPreviewEmails] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSearch = async () => {
    // Implementation for faculty search
  };

  const handleFacultySelect = (facultyId) => {
    // Implementation for faculty selection
  };

  const handlePreviewEmails = async () => {
    // Implementation for previewing emails
  };

  const handleUpdateEmail = async (recipient, newContent) => {
    // Implementation for updating email content
  };

  const handleRegenerateEmail = async (email) => {
    // Implementation for regenerating email
  };

  const handleSendEmails = async () => {
    // Implementation for sending emails
  };

  // Rendering faculty list and email previews
  // ...
};
```

### EmailPreview (`src/components/emails/EmailPreview.jsx`)

```jsx
const EmailPreview = ({
  emails,
  onSend,
  onClose,
  onUpdateEmail,
  onRegenerate,
}) => {
  const [activeEmailIndex, setActiveEmailIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editedSubject, setEditedSubject] = useState("");
  const [editedBody, setEditedBody] = useState("");

  useEffect(() => {
    if (emails.length > 0) {
      setEditedSubject(emails[activeEmailIndex].subject);
      setEditedBody(emails[activeEmailIndex].content);
    }
  }, [activeEmailIndex, emails]);

  const handleEditToggle = () => {
    // Implementation for toggling edit mode
  };

  const handleSave = () => {
    // Implementation for saving edits
  };

  const handleRegenerate = () => {
    // Implementation for regenerating email
  };

  // Rendering email preview with navigation and edit controls
  // ...
};
```

### CompanySelector (`src/components/emails/CompanySelector.jsx`)

```jsx
const CompanySelector = ({ companies, onCompaniesSelected }) => {
  const [selectedCompanies, setSelectedCompanies] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    technologies: [],
    role: "",
    minScore: 0,
  });

  const handleCompanyToggle = (company) => {
    // Implementation for toggling company selection
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value.toLowerCase());
  };

  const handleFilterChange = (filterType, value) => {
    // Implementation for updating filters
  };

  const filteredCompanies = useMemo(() => {
    // Implementation for filtering companies
    return companies.filter((company) => {
      // Filter by search term
      if (
        searchTerm &&
        !company.name.toLowerCase().includes(searchTerm) &&
        !company.role.toLowerCase().includes(searchTerm)
      ) {
        return false;
      }

      // Filter by technologies
      if (
        filters.technologies.length > 0 &&
        !filters.technologies.some((tech) =>
          company.technologiesUsed.some((t) =>
            t.toLowerCase().includes(tech.toLowerCase())
          )
        )
      ) {
        return false;
      }

      // Filter by role
      if (
        filters.role &&
        !company.role.toLowerCase().includes(filters.role.toLowerCase())
      ) {
        return false;
      }

      // Filter by score
      if (company.relevanceScore < filters.minScore) {
        return false;
      }

      return true;
    });
  }, [companies, searchTerm, filters]);

  // Rendering company list with filters, search, and selection controls
  // ...
};
```

## Resume Components

### ResumeUploader (`src/components/resume/ResumeUploader.jsx`)

```jsx
const ResumeUploader = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const { uploadResume, fetchResumes } = useAppContext();
  const { showToast } = useToast();
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.type !== "application/pdf") {
        showToast("Please upload a PDF file", "error");
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      showToast("Please select a file first", "error");
      return;
    }

    setUploading(true);
    try {
      const result = await uploadResume(file);
      showToast("Resume uploaded successfully!", "success");
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      fetchResumes(); // Refresh resume list
    } catch (error) {
      showToast(error.message || "Error uploading resume", "error");
    } finally {
      setUploading(false);
    }
  };

  // Rendering file input and upload controls
  // ...
};
```

### ResumePreview (`src/components/resume/ResumePreview.jsx`)

```jsx
const ResumePreview = ({ resume }) => {
  const [tab, setTab] = useState("skills");

  if (!resume) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-gray-500">
          No resume selected. Please upload a resume first.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Resume Preview</h2>
        <div className="flex items-center">
          <span
            className={`px-2 py-1 text-xs rounded ${
              resume.parseStatus === "completed"
                ? "bg-green-100 text-green-800"
                : resume.parseStatus === "failed"
                ? "bg-red-100 text-red-800"
                : "bg-yellow-100 text-yellow-800"
            }`}
          >
            {resume.parseStatus === "completed"
              ? "Parsed"
              : resume.parseStatus === "failed"
              ? "Parse Failed"
              : "Parsing..."}
          </span>
        </div>
      </div>

      {/* PDF Embed */}
      <div className="mb-6">
        <iframe
          src={resume.url}
          className="w-full h-96 border border-gray-300 rounded"
          title="Resume Preview"
        ></iframe>
      </div>

      {/* Content Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex">
          <button
            onClick={() => setTab("skills")}
            className={`mr-8 py-2 ${
              tab === "skills"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Skills ({resume.skills?.length || 0})
          </button>
          <button
            onClick={() => setTab("experience")}
            className={`mr-8 py-2 ${
              tab === "experience"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Experience ({resume.experience?.length || 0})
          </button>
          <button
            onClick={() => setTab("projects")}
            className={`py-2 ${
              tab === "projects"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Projects ({resume.projects?.length || 0})
          </button>
        </nav>
      </div>

      {/* Content Display */}
      <div className="mt-4">
        {tab === "skills" && (
          <div className="flex flex-wrap gap-2">
            {resume.skills?.map((skill, index) => (
              <span
                key={index}
                className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm"
              >
                {skill}
              </span>
            ))}
          </div>
        )}

        {tab === "experience" && (
          <div className="space-y-3">
            {resume.experience?.map((exp, index) => (
              <div key={index} className="bg-gray-50 p-3 rounded">
                <p>{exp}</p>
              </div>
            ))}
          </div>
        )}

        {tab === "projects" && (
          <div className="space-y-3">
            {resume.projects?.map((project, index) => (
              <div key={index} className="bg-gray-50 p-3 rounded">
                <p>{project}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Retry Parsing Button */}
      {resume.parseStatus === "failed" || resume.parseStatus === "partial" ? (
        <div className="mt-4">
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            onClick={() => handleRetryParse(resume.id)}
          >
            Retry Parsing
          </button>
        </div>
      ) : null}
    </div>
  );
};
```

## Pages

### DashboardPage (`src/pages/DashboardPage.jsx`)

```jsx
const DashboardPage = () => {
  const { user, resume, emails } = useAppContext();
  const [stats, setStats] = useState({
    totalEmails: 0,
    sentEmails: 0,
    draftEmails: 0,
    failedEmails: 0,
  });

  useEffect(() => {
    // Calculate email statistics
    if (emails.length > 0) {
      setStats({
        totalEmails: emails.length,
        sentEmails: emails.filter((e) => e.status === "sent").length,
        draftEmails: emails.filter((e) => e.status === "draft").length,
        failedEmails: emails.filter((e) => e.status === "failed").length,
      });
    }
  }, [emails]);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

        {/* Welcome Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-2">Welcome, {user?.name}!</h2>
          <p className="text-gray-600">
            {resume
              ? "Your resume is ready. Generate personalized emails for job applications or academic outreach."
              : "Get started by uploading your resume."}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <QuickActionCard
            title="Company Emails"
            description="Generate personalized emails to companies"
            icon={<BriefcaseIcon className="h-8 w-8 text-blue-500" />}
            action="/emails"
          />
          <QuickActionCard
            title="Academic Emails"
            description="Connect with faculty for research opportunities"
            icon={<AcademicCapIcon className="h-8 w-8 text-blue-500" />}
            action="/academic-emails"
          />
          <QuickActionCard
            title="Upload Resume"
            description="Upload a new resume or update existing one"
            icon={<DocumentIcon className="h-8 w-8 text-blue-500" />}
            action="/resume"
          />
        </div>

        {/* Email Statistics */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Email Analytics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Total Emails"
              value={stats.totalEmails}
              color="blue"
            />
            <StatCard label="Sent" value={stats.sentEmails} color="green" />
            <StatCard label="Drafts" value={stats.draftEmails} color="yellow" />
            <StatCard label="Failed" value={stats.failedEmails} color="red" />
          </div>
        </div>

        {/* Resume Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Resume</h2>
          {resume ? <ResumeCard resume={resume} /> : <ResumeUploader />}
        </div>
      </div>
    </Layout>
  );
};
```

### EmailsPage (`src/pages/EmailsPage.jsx`)

```jsx
const EmailsPage = () => {
  const { emails, fetchEmails } = useAppContext();
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const { showToast } = useToast();

  useEffect(() => {
    const loadEmails = async () => {
      setLoading(true);
      try {
        await fetchEmails();
      } catch (error) {
        showToast(error.message || "Failed to load emails", "error");
      } finally {
        setLoading(false);
      }
    };

    loadEmails();
  }, [fetchEmails, showToast]);

  const filteredEmails = useMemo(() => {
    return emails
      .filter((email) => {
        if (filter === "all") return true;
        return email.status === filter;
      })
      .filter((email) => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
          email.company.toLowerCase().includes(term) ||
          email.subject.toLowerCase().includes(term) ||
          email.recipient.toLowerCase().includes(term)
        );
      });
  }, [emails, filter, searchTerm]);

  // Rendering email list with filters and search
  // ...
};
```

## Performance Considerations

### Code Splitting

The application uses React Router's route-based code splitting to improve initial load time:

```jsx
import { lazy, Suspense } from "react";

const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const EmailsPage = lazy(() => import("./pages/EmailsPage"));
const AcademicEmailsPage = lazy(() => import("./pages/AcademicEmailsPage"));

function App() {
  return (
    <Router>
      <AppProvider>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            {/* More routes */}
          </Routes>
        </Suspense>
      </AppProvider>
    </Router>
  );
}
```

### Memoization

Components use `useMemo` and `useCallback` hooks to optimize rendering performance:

```jsx
// Memoized filtering
const filteredCompanies = useMemo(() => {
  return companies.filter((company) => {
    // Filtering logic
    // ...
  });
}, [companies, searchTerm, filters]);

// Memoized callback
const handleCompanyToggle = useCallback((company) => {
  setSelectedCompanies((prev) => {
    if (prev.some((c) => c.id === company.id)) {
      return prev.filter((c) => c.id !== company.id);
    } else {
      return [...prev, company];
    }
  });
}, []);
```

### Virtualized Lists

For large lists of companies or emails, the application uses virtualized lists to render only visible items:

```jsx
import { FixedSizeList as List } from "react-window";

const VirtualizedEmailList = ({ emails }) => {
  const Row = ({ index, style }) => {
    const email = emails[index];
    return (
      <div style={style}>
        <EmailListItem email={email} />
      </div>
    );
  };

  return (
    <List height={500} width="100%" itemCount={emails.length} itemSize={80}>
      {Row}
    </List>
  );
};
```

### Form Optimization

Forms use controlled components with debounced inputs for improved performance:

```jsx
const DebouncedSearchInput = ({ onSearch }) => {
  const [value, setValue] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => {
      onSearch(value);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [value, onSearch]);

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      className="border p-2 rounded w-full"
      placeholder="Search..."
    />
  );
};
```

## Error Handling

### Global Error Boundary

```jsx
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught by error boundary:", error, errorInfo);
    this.setState({ error, errorInfo });

    // Optional: Send error to analytics service
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 bg-red-50 rounded-lg text-center">
          <h2 className="text-xl font-bold text-red-800 mb-4">
            Something went wrong
          </h2>
          <p className="text-red-600 mb-4">
            We're sorry, an error occurred while rendering this component.
          </p>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded"
            onClick={() => window.location.reload()}
          >
            Reload Page
          </button>
          {process.env.NODE_ENV === "development" && (
            <details className="mt-4 text-left">
              <summary className="cursor-pointer text-red-800">
                Error Details
              </summary>
              <pre className="bg-red-100 p-4 mt-2 rounded overflow-auto text-sm">
                {this.state.error?.toString()}
                <br />
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
```

### API Error Handling

```jsx
const apiErrorHandler = (error, showToast) => {
  if (error.response) {
    // Request made and server responded with non-2xx status
    const message = error.response.data.message || "An error occurred";
    showToast(message, "error");

    // Handle specific status codes
    switch (error.response.status) {
      case 401:
        // Handle unauthorized (e.g., redirect to login)
        break;
      case 403:
        // Handle forbidden
        break;
      case 404:
        // Handle not found
        break;
      default:
      // Handle other status codes
    }
  } else if (error.request) {
    // Request made but no response received
    showToast("Network error - please check your connection", "error");
  } else {
    // Something else went wrong
    showToast(error.message || "An unexpected error occurred", "error");
  }

  return error;
};
```
