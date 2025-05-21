# Anveshak  API Documentation

This document provides detailed documentation for all API endpoints in the Anveshak  application, including request parameters, response formats, and examples.

## Table of Contents

1. [Authentication API](#authentication-api)
2. [Resume API](#resume-api)
3. [Email Generation API](#email-generation-api)
4. [Academic Email API](#academic-email-api)
5. [User API](#user-api)
6. [Error Responses](#error-responses)

## Authentication API

Authentication endpoints handle user registration, login, and account management.

### POST /api/auth/register

Register a new user account.

**Request Parameters:**

```json
{
  "name": "string (required) - User's full name",
  "email": "string (required) - Valid email address",
  "password": "string (required) - Password (min 8 characters)"
}
```

**Response (200 OK):**

```json
{
  "token": "string - JWT authentication token",
  "user": {
    "id": "string - User ID",
    "name": "string - User's name",
    "email": "string - User's email",
    "createdAt": "string - ISO timestamp"
  }
}
```

**Error Responses:**

- 400 Bad Request: Missing required fields or invalid data
- 409 Conflict: Email already registered

### POST /api/auth/login

Log in an existing user.

**Request Parameters:**

```json
{
  "email": "string (required) - User's email address",
  "password": "string (required) - User's password"
}
```

**Response (200 OK):**

```json
{
  "token": "string - JWT authentication token",
  "user": {
    "id": "string - User ID",
    "name": "string - User's name",
    "email": "string - User's email",
    "createdAt": "string - ISO timestamp"
  }
}
```

**Error Responses:**

- 400 Bad Request: Missing required fields
- 401 Unauthorized: Invalid credentials

### POST /api/auth/verify

Verify a user's email address using verification token.

**Request Parameters:**

```json
{
  "token": "string (required) - Verification token from email"
}
```

**Response (200 OK):**

```json
{
  "message": "Email successfully verified"
}
```

**Error Responses:**

- 400 Bad Request: Invalid or expired token

### POST /api/auth/reset-password-request

Request a password reset link.

**Request Parameters:**

```json
{
  "email": "string (required) - User's registered email address"
}
```

**Response (200 OK):**

```json
{
  "message": "Password reset link sent to your email"
}
```

**Error Responses:**

- 400 Bad Request: Email not provided
- 404 Not Found: Email not registered

### POST /api/auth/reset-password

Reset password using reset token.

**Request Parameters:**

```json
{
  "token": "string (required) - Reset token from email",
  "password": "string (required) - New password (min 8 characters)"
}
```

**Response (200 OK):**

```json
{
  "message": "Password successfully reset"
}
```

**Error Responses:**

- 400 Bad Request: Invalid token or password requirements not met

## Resume API

Resume endpoints handle uploading, parsing, and managing resume files.

### POST /api/resumes/upload

Upload and parse a new resume.

**Request Parameters:**

- `FormData` with:
  - `file`: PDF resume file (required)
  - `parseMode`: string (optional) - Parsing mode ["auto", "simplified", "ai"] (default: "auto")

**Response (200 OK):**

```json
{
  "message": "Resume uploaded and parsed successfully",
  "resume": {
    "id": "string - Resume ID",
    "url": "string - Authenticated URL to view the resume",
    "parseStatus": "string - Status of parsing (completed, pending, failed, partial)",
    "skills": ["string[] - Extracted skills"],
    "experience": ["string[] - Extracted experience entries"],
    "projects": ["string[] - Extracted projects"],
    "education": ["string[] - Extracted education details"],
    "createdAt": "string - ISO timestamp"
  }
}
```

**Error Responses:**

- 400 Bad Request: No file provided or invalid file format
- 500 Internal Server Error: Parsing or upload failure

### GET /api/resumes

Get all resumes for the authenticated user.

**Response (200 OK):**

```json
{
  "resumes": [
    {
      "id": "string - Resume ID",
      "fileName": "string - Original file name",
      "url": "string - Authenticated URL to view the resume",
      "parseStatus": "string - Status of parsing",
      "skills": ["string[] - Extracted skills"],
      "createdAt": "string - ISO timestamp",
      "updatedAt": "string - ISO timestamp"
    }
  ]
}
```

### GET /api/resumes/:id

Get a specific resume by ID.

**Path Parameters:**

- `id`: Resume ID (required)

**Response (200 OK):**

```json
{
  "resume": {
    "id": "string - Resume ID",
    "fileName": "string - Original file name",
    "url": "string - Authenticated URL to view the resume",
    "parseStatus": "string - Status of parsing",
    "skills": ["string[] - Extracted skills"],
    "experience": ["string[] - Extracted experience entries"],
    "projects": ["string[] - Extracted projects"],
    "education": ["string[] - Extracted education details"],
    "createdAt": "string - ISO timestamp",
    "updatedAt": "string - ISO timestamp"
  }
}
```

**Error Responses:**

- 404 Not Found: Resume not found

### PUT /api/resumes/:id

Update resume data (skills, experience, projects).

**Path Parameters:**

- `id`: Resume ID (required)

**Request Parameters:**

```json
{
  "skills": ["string[] (optional) - Updated skills array"],
  "experience": ["string[] (optional) - Updated experience array"],
  "projects": ["string[] (optional) - Updated projects array"]
}
```

**Response (200 OK):**

```json
{
  "message": "Resume updated successfully",
  "id": "string - Resume ID",
  "skills": ["string[] - Updated skills"],
  "experience": ["string[] - Updated experience"],
  "projects": ["string[] - Updated projects"],
  "url": "string - Authenticated URL to view the resume"
}
```

**Error Responses:**

- 404 Not Found: Resume not found

### POST /api/resumes/:id/retry-parse

Retry parsing a resume that had errors or incomplete results.

**Path Parameters:**

- `id`: Resume ID (required)

**Request Parameters:**

```json
{
  "forceAI": "boolean (optional) - Force using AI parser (default: false)"
}
```

**Response (200 OK):**

```json
{
  "message": "Resume parsing retry successful",
  "resume": {
    "id": "string - Resume ID",
    "skills": ["string[] - Extracted skills"],
    "experience": ["string[] - Extracted experience"],
    "projects": ["string[] - Extracted projects"],
    "parseStatus": "string - Updated parsing status",
    "url": "string - Authenticated URL to view the resume"
  },
  "warning": "string (optional) - Any parsing warnings"
}
```

**Error Responses:**

- 404 Not Found: Resume not found
- 500 Internal Server Error: Parsing failure

### DELETE /api/resumes/:id

Delete a resume.

**Path Parameters:**

- `id`: Resume ID (required)

**Response (200 OK):**

```json
{
  "message": "Resume deleted successfully"
}
```

**Error Responses:**

- 404 Not Found: Resume not found

## Email Generation API

Email generation endpoints handle finding companies, generating emails, and email management.

### POST /api/emails/generate

Multi-step endpoint for email generation workflow. The `action` parameter determines functionality.

**Request Parameters:**

```json
{
  "resumeId": "string (required) - ID of the resume to use",
  "action": "string (required) - One of: find-companies, generate-emails, send-emails",
  "companies": "array (conditional) - Required for generate-emails action",
  "emailIds": "array (conditional) - Required for send-emails action"
}
```

#### When action="find-companies"

Finds companies matching the resume skills.

**Response (200 OK):**

```json
{
  "companies": [
    {
      "name": "string - Company name",
      "email": "string - Contact email",
      "role": "string - Suggested role",
      "industry": "string - Company industry",
      "size": "string - Company size",
      "technologiesUsed": ["string[] - Tech stack"],
      "research": {
        "overview": "string - Company overview",
        "achievements": ["string[] - Company achievements"],
        "culture": "string - Company culture",
        "techStack": {
          "frontend": ["string[] - Frontend technologies"],
          "backend": ["string[] - Backend technologies"],
          "devops": ["string[] - DevOps technologies"],
          "other": ["string[] - Other technologies"]
        }
      },
      "matchReason": "string - Why this company matches the user's profile"
    }
  ]
}
```

#### When action="generate-emails"

Generates personalized emails for selected companies.

**Response (200 OK):**

```json
{
  "emails": [
    {
      "_id": "string - Email ID",
      "company": "string - Company name",
      "recipient": "string - Recipient email",
      "role": "string - Role being applied for",
      "subject": "string - Generated subject line",
      "body": "string - Generated email body",
      "status": "string - Email status (draft)",
      "companyResearch": {
        "overview": "string - Company overview",
        "achievements": ["string[] - Company achievements"],
        "culture": "string - Company culture"
      }
    }
  ]
}
```

#### When action="send-emails"

Sends generated email drafts.

**Response (200 OK):**

```json
{
  "success": true,
  "sentCount": "number - Number of emails successfully sent",
  "failedCount": "number - Number of emails that failed to send",
  "emails": [
    {
      "_id": "string - Email ID",
      "company": "string - Company name",
      "status": "string - Updated status (sent/failed)",
      "sentAt": "string - ISO timestamp (if sent)"
    }
  ]
}
```

**Error Responses:**

- 400 Bad Request: Missing required parameters
- 404 Not Found: Resume not found or no matching companies
- 500 Internal Server Error: Email generation or sending failure

### GET /api/emails

Get all emails for the authenticated user.

**Query Parameters:**

- `status`: Filter by status (optional) - "draft", "sent", or "failed"

**Response (200 OK):**

```json
{
  "emails": [
    {
      "_id": "string - Email ID",
      "company": "string - Company name",
      "recipient": "string - Recipient email",
      "role": "string - Role being applied for",
      "subject": "string - Email subject line",
      "status": "string - Email status",
      "sentAt": "string - ISO timestamp (if sent)",
      "createdAt": "string - ISO timestamp"
    }
  ]
}
```

### GET /api/emails/:id

Get details of a specific email.

**Path Parameters:**

- `id`: Email ID (required)

**Response (200 OK):**

```json
{
  "email": {
    "_id": "string - Email ID",
    "company": "string - Company name",
    "recipient": "string - Recipient email",
    "role": "string - Role being applied for",
    "subject": "string - Email subject line",
    "body": "string - Email body",
    "status": "string - Email status",
    "sentAt": "string - ISO timestamp (if sent)",
    "companyResearch": {
      "overview": "string - Company overview",
      "achievements": ["string[] - Company achievements"],
      "culture": "string - Company culture",
      "techStack": {
        "frontend": ["string[] - Frontend technologies"],
        "backend": ["string[] - Backend technologies"],
        "devops": ["string[] - DevOps technologies"],
        "other": ["string[] - Other technologies"]
      }
    },
    "createdAt": "string - ISO timestamp"
  }
}
```

**Error Responses:**

- 404 Not Found: Email not found

### POST /api/emails/generate-preview-emails

Generate preview emails for selected companies without saving.

**Request Parameters:**

```json
{
  "resumeId": "string (required) - ID of the resume to use",
  "selectedCompanies": "array (required) - Companies to generate emails for"
}
```

**Response (200 OK):**

```json
{
  "previewEmails": [
    {
      "company": "string - Company name",
      "recipientEmail": "string - Recipient email",
      "subject": "string - Generated subject line",
      "body": "string - Generated email body"
    }
  ]
}
```

## Academic Email API

Academic email endpoints handle faculty search, email generation for academic outreach.

### POST /api/academic/search

Search for faculty members matching research interests.

**Request Parameters:**

```json
{
  "domains": ["string[] (required) - Research domains/keywords"]
}
```

**Response (200 OK):**

```json
{
  "facultyList": [
    {
      "_id": "string - Faculty ID",
      "name": "string - Faculty name",
      "email": "string - Faculty email",
      "department": "string - Department",
      "title": "string - Academic title",
      "institution": {
        "_id": "string - Institution ID",
        "name": "string - Institution name",
        "type": "string - Institution type",
        "location": "string - Location",
        "website": "string - Website URL"
      },
      "researchInterests": ["string[] - Research interests"],
      "publications": ["string[] - Recent publications"],
      "projects": ["string[] - Research projects"],
      "website": "string - Personal website",
      "relevanceScore": "number - Match relevance score"
    }
  ]
}
```

**Error Responses:**

- 400 Bad Request: Invalid domains provided
- 404 Not Found: No matching faculty found

### POST /api/academic/generate-preview-emails

Generate personalized academic email previews.

**Request Parameters:**

```json
{
  "resumeId": "string (required) - ID of the resume to use",
  "selectedFaculty": ["array (required) - Array of faculty member IDs"]
}
```

**Response (200 OK):**

```json
{
  "emails": [
    {
      "preview": true,
      "subject": "string - Generated subject line",
      "content": "string - Generated email body",
      "faculty": {
        "id": "string - Faculty ID",
        "name": "string - Faculty name",
        "email": "string - Faculty email",
        "department": "string - Department",
        "institution": "string - Institution name",
        "researchInterests": ["string[] - Research interests"]
      }
    }
  ],
  "summary": {
    "total": "number - Total faculty selected",
    "generated": "number - Successfully generated emails",
    "failed": "number - Failed generations"
  }
}
```

**Error Responses:**

- 400 Bad Request: Missing required parameters
- 404 Not Found: Resume not found
- 500 Internal Server Error: Email generation failure

### POST /api/academic/send-faculty-emails

Send emails to selected faculty members.

**Request Parameters:**

```json
{
  "resumeId": "string (required) - ID of the resume to use",
  "selectedFaculty": ["array (required) - Array of faculty objects"]
}
```

**Response (200 OK):**

```json
{
  "results": [
    {
      "success": "boolean - Whether email was sent successfully",
      "emailId": "string - Email ID (if successful)",
      "recipient": "string - Recipient email",
      "facultyName": "string - Faculty name",
      "error": "string - Error message (if failed)"
    }
  ],
  "summary": {
    "total": "number - Total attempted",
    "success": "number - Successfully sent",
    "failed": "number - Failed to send"
  }
}
```

**Error Responses:**

- 400 Bad Request: Missing required parameters
- 404 Not Found: Resume not found
- 500 Internal Server Error: Email sending failure

### POST /api/academic/regenerate-email

Regenerate a specific faculty email with improved content.

**Request Parameters:**

```json
{
  "resumeId": "string (required) - ID of the resume to use",
  "facultyId": "string (required) - ID of the faculty member"
}
```

**Response (200 OK):**

```json
{
  "subject": "string - Regenerated subject line",
  "content": "string - Regenerated email body",
  "faculty": {
    "id": "string - Faculty ID",
    "name": "string - Faculty name",
    "email": "string - Faculty email",
    "department": "string - Department",
    "institution": "string - Institution name",
    "researchInterests": ["string[] - Research interests"]
  }
}
```

**Error Responses:**

- 400 Bad Request: Missing required parameters
- 404 Not Found: Faculty or resume not found
- 500 Internal Server Error: Email generation failure

## User API

User endpoints handle user profile management.

### GET /api/users/me

Get the authenticated user's profile.

**Response (200 OK):**

```json
{
  "user": {
    "id": "string - User ID",
    "name": "string - User's name",
    "email": "string - User's email",
    "createdAt": "string - ISO timestamp",
    "emailVerified": "boolean - Whether email is verified"
  }
}
```

**Error Responses:**

- 401 Unauthorized: Invalid or missing authentication token

### PUT /api/users/me

Update the authenticated user's profile.

**Request Parameters:**

```json
{
  "name": "string (optional) - Updated name",
  "email": "string (optional) - Updated email",
  "currentPassword": "string (conditional) - Required if changing password",
  "newPassword": "string (optional) - New password"
}
```

**Response (200 OK):**

```json
{
  "message": "Profile updated successfully",
  "user": {
    "id": "string - User ID",
    "name": "string - Updated name",
    "email": "string - Updated email",
    "updatedAt": "string - ISO timestamp"
  }
}
```

**Error Responses:**

- 400 Bad Request: Invalid update data
- 401 Unauthorized: Invalid current password

## Error Responses

Common error response formats across all endpoints:

### 400 Bad Request

```json
{
  "message": "string - Description of the validation error"
}
```

### 401 Unauthorized

```json
{
  "message": "Authentication required"
}
```

### 403 Forbidden

```json
{
  "message": "You don't have permission to access this resource"
}
```

### 404 Not Found

```json
{
  "message": "string - Description of what was not found"
}
```

### 409 Conflict

```json
{
  "message": "string - Description of the conflict"
}
```

### 422 Unprocessable Entity

```json
{
  "message": "string - Description of the issue",
  "errors": {
    "field1": "string - Error message for this field",
    "field2": "string - Error message for this field"
  }
}
```

### 429 Too Many Requests

```json
{
  "message": "Rate limit exceeded. Please try again later.",
  "retryAfter": "number - Seconds to wait before retrying"
}
```

### 500 Internal Server Error

```json
{
  "message": "An unexpected error occurred",
  "error": "string - Error details (in development mode only)"
}
```
