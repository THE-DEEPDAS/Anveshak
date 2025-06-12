# Anveshak  - Comprehensive Documentation

## Table of Contents

1. [Introduction](#introduction)
2. [Architecture Overview](#architecture-overview)
3. [Core Technologies](#core-technologies)
4. [Natural Language Processing and AI Algorithms](#natural-language-processing-and-ai-algorithms)
   - [Resume Parsing Algorithms](#resume-parsing-algorithms)
   - [Email Generation Algorithms](#email-generation-algorithms)
   - [Company Research and Matching](#company-research-and-matching)
   - [Academic Faculty Matching](#academic-faculty-matching)
5. [System Features](#system-features)
   - [Resume Analysis](#resume-analysis)
   - [Company Research and Matching](#company-research-and-matching-1)
   - [Email Generation](#email-generation)
   - [Academic Email Generation](#academic-email-generation)
   - [Email Management](#email-management)
6. [API Reference](#api-reference)
7. [Error Handling and Resilience](#error-handling-and-resilience)
8. [Implementation Guides](#implementation-guides)
9. [Security Practices](#security-practices)
10. [Future Roadmap](#future-roadmap)

## Introduction

Anveshak  is a comprehensive platform designed to help job seekers generate personalized cold emails to potential employers and academic faculty. The system combines AI-powered resume parsing, company/faculty research, and personalized email generation to create highly tailored outreach communications.

The platform serves two primary use cases:

- **Job application emails** - Matching candidates with companies based on skills and generating personalized job inquiry emails
- **Academic collaboration emails** - Connecting students with faculty members for research opportunities based on matching interests

## Architecture Overview

Anveshak  is built using a modern MERN stack architecture:

- **Frontend**: React-based SPA with context-based state management
- **Backend**: Node.js + Express RESTful API server
- **Database**: MongoDB document database
- **AI Integration**: Google Generative AI (Gemini) for natural language processing tasks
- **Web Scraping**: Cheerio and Axios for company/faculty data enrichment

The application follows a microservice-inspired architecture with clear separation of concerns:

```
Server
├── routes/           # API routes and controllers
├── services/         # Core business logic and external service integration
├── models/           # Data models and schema definitions
├── middleware/       # Request processing middleware
├── config/           # Configuration settings
└── scripts/          # Database initialization and utility scripts
```

## Core Technologies

- **Node.js**: Server-side JavaScript runtime
- **Express**: Web application framework
- **MongoDB**: NoSQL database
- **Mongoose**: MongoDB object modeling
- **React**: Frontend UI library
- **Vite**: Frontend build tool
- **Google Generative AI (Gemini)**: LLM for natural language processing
- **PDF.js**: PDF text extraction
- **Cheerio**: HTML parsing for web scraping
- **Axios**: HTTP client for API requests
- **Cloudinary**: Media storage
- **Nodemailer**: Email sending service

## Natural Language Processing and AI Algorithms

### Resume Parsing Algorithms

Anveshak  implements three distinct resume parsing algorithms, each with its own strengths and use cases:

#### 1. Simplified Parser (simplifiedResumeParser.js)

A lightweight, rule-based parser optimized for extracting core information:

- Skills
- Experience
- Projects

**Algorithm Overview:**

1. Extract text from PDF using pdf-parse
2. Apply regex pattern matching to identify section headers
3. Extract content between known section headers
4. Clean and normalize extracted text
5. Apply heuristics to identify skills, experiences, and projects

**Key Features:**

- Low computational overhead
- No external API dependencies
- Fast processing time
- Domain-specific pattern matching for technical resumes

**Code Implementation:**

```javascript
async function parseResumeText(pdfBuffer) {
  // Extract text from PDF
  const rawText = await extractTextFromPdf(pdfBuffer);

  // Identify sections using headers
  const sections = identifySections(rawText);

  // Extract data from each section
  const skills = extractSkills(sections.skills);
  const experience = extractExperience(sections.experience);
  const projects = extractProjects(sections.projects);

  return {
    skills,
    experience,
    projects,
  };
}
```

**Algorithm Overview:**

1. Extract text items from PDF with position data using pdf.js
2. Group text items into lines based on Y-coordinates
3. Group lines into sections using font sizes and formatting patterns
4. Apply specialized parsing rules to each identified section

**Key Features:**

- Preserves formatting and structure
- Handles complex resume layouts
- Extracts rich metadata including dates, positions, achievements
- Better at identifying hierarchical information

**Advantages:**

- More accurate section detection
- Better at handling multi-column layouts
- Preserves chronological ordering
- Extracts detailed metadata

#### 3. AI-powered Parser (aiService.js)

Uses Google's Gemini models to extract and structure resume data through natural language understanding:

**Algorithm Overview:**

1. Send PDF text to Gemini API with structured extraction prompts
2. Process model responses to extract specific resume components
3. Structure and validate the extracted information

**Key Features:**

- Superior understanding of context and semantics
- Handles non-standard formats and language variations
- Categorizes skills by type automatically
- Identifies achievements and quantitative results

**Benefits:**

- Most accurate for diverse resume formats
- Best at understanding implied skills and qualifications
- Provides richer semantic categorization
- Handles international and varied resume styles

**Sample Prompt Structure:**

```javascript
const prompt = `
  Extract all technical skills from the following resume text.
  - Look for sections labeled "Skills", "Technical Skills", "Technologies", etc.
  - For sections with bullet points or comma-separated lists, extract those directly
  - For skills written in sentences, extract individual technical terms
  - Return ONLY an array of strings with no other text or explanation
  ${text}
`;
```

### Email Generation Algorithms

Anveshak  utilizes generative AI to produce personalized email content with several specialized algorithms:

#### 1. Company Research Email Generation

**Algorithm Overview:**

1. Process company information and candidate resume data
2. Create a structured context object with key matching points
3. Generate a prompt that emphasizes personalization and authentic connection
4. Apply generative model with specific parameters for formal correspondence
5. Parse and validate the generated response for structure and personalization

**Key Features:**

- Company-specific research integration
- Role-appropriate technical language
- Quantified achievements matching
- Multiple fallback methods for resilience

**Implementation Highlights:**

```javascript
export const generateEmailContent = async ({
  userName,
  userEmail,
  company,
  role,
  skills,
  experience,
  projects,
  companyResearch,
}) => {
  // Structure context for generation
  const context = {
    candidate: {
      name: userName,
      email: userEmail,
      skills,
      experience,
      projects,
    },
    company: { name: company, role, research: companyResearch },
  };

  // Generate focused prompt
  const prompt = buildPersonalizedPrompt(context);

  // Generate content with specific parameters
  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.7,
      topP: 0.8,
      topK: 40,
      maxOutputTokens: 1024,
    },
    safetySettings: [
      {
        category: "HARM_CATEGORY_DANGEROUS_CONTENT",
        threshold: "BLOCK_MEDIUM_AND_ABOVE",
      },
    ],
  });

  // Parse and structure the response
  return parseEmailResponse(result);
};
```

#### 2. Academic Research Email Generation

Specialized algorithm for generating personalized academic research collaboration emails:

**Algorithm Overview:**

1. Extract faculty research interests, publications, and academic background
2. Match candidate skills and experience to faculty research areas
3. Generate academically appropriate, research-focused email content
4. Apply multiple validation checks for scholarly tone and specificity
5. Format according to academic correspondence conventions

**Key Features:**

- Research-specific terminology
- Publication reference integration
- Academic institutional knowledge
- Formal scholarly communication style

### Company Research and Matching

Anveshak  implements a robust company matching system to connect candidates with relevant employers:

**Algorithm Overview:**

1. Extract key skills and experience from candidate resume
2. Execute multi-source company search:
   - Database search for exact and fuzzy skill matches
   - LLM-powered company suggestions based on skills and role
   - Web scraping for company technology stack verification
3. Score and rank companies based on matching criteria
4. Enrich company profiles with additional research

**Key Features:**

- Multiple data sources for company matching
- Weighted skill relevance scoring
- Technology stack compatibility analysis
- Industry-specific targeting

### Academic Faculty Matching

Specialized algorithm for matching candidates with academic faculty:

**Algorithm Overview:**

1. Extract academic interests and research experience from resume
2. Search faculty database using domain-specific matching criteria
3. Enrich results with web scraping from university websites
4. Score and rank faculty based on research interest overlap
5. Generate potential collaboration opportunities

**Key Features:**

- Research interest semantic matching
- Publication relevance analysis
- Institution type filtering
- Department and specialization targeting

## System Features

### Resume Analysis

Anveshak  provides comprehensive resume analysis features:

- **Automated Skill Extraction**: Identifies technical skills, technologies, and methodologies
- **Experience Analysis**: Extracts and categorizes work history, roles, and achievements
- **Project Portfolio Extraction**: Identifies personal and professional projects with technologies used
- **Education Background Analysis**: Extracts educational qualifications and relevant coursework
- **Achievement Quantification**: Identifies and highlights quantified achievements
- **Technology Categorization**: Classifies skills by type (languages, frameworks, tools)

**Usage:**

1. Upload PDF resume through the web interface or API
2. System automatically processes and analyzes the document
3. Review extracted information with confidence scores
4. Edit or enhance extracted data if needed
5. Proceed to company matching or email generation

### Company Research and Matching

Anveshak  identifies relevant companies based on candidate skills:

- **Skill-Based Matching**: Finds companies using technologies in candidate's skill set
- **Role-Based Targeting**: Focuses on companies with positions matching desired roles
- **Technology Stack Analysis**: Identifies companies using specific technologies
- **Company Research**: Gathers information about company products, culture, and achievements
- **Email Contact Discovery**: Finds appropriate contact emails for companies
- **Relevance Scoring**: Ranks companies by match quality for targeting

**Usage:**

1. System analyzes candidate's skills and desired roles
2. Matches are presented with relevance scores and research information
3. User can select target companies for email generation
4. System maintains company data for future matches

### Email Generation

Anveshak  generates personalized cold emails for job applications:

- **Company-Specific Personalization**: References company products, technologies, and culture
- **Skill Matching**: Highlights candidate skills relevant to the company
- **Achievement Emphasis**: Incorporates quantified achievements and relevant experience
- **Dynamic Templates**: Generates unique emails without repetitive patterns
- **Multiple Tone Options**: Professional, enthusiastic, or formal communication styles
- **Customizable Content**: Generated content can be edited before sending
- **Merge Fields**: Automatic insertion of personalized information

**Usage:**

1. Select target companies from match results
2. Generate personalized email drafts for each company
3. Review and edit generated content if desired
4. Send emails directly or copy to clipboard for external sending
5. Track email status and responses

### Academic Email Generation

Anveshak  generates personalized emails for academic research collaboration:

- **Research Interest Alignment**: Matches candidate interests with faculty research areas
- **Publication References**: Cites relevant faculty publications and research projects
- **Academic Tone**: Maintains appropriate scholarly communication style
- **Institution-Appropriate Content**: Adapts to university type and department culture
- **Research Collaboration Proposals**: Suggests specific collaboration opportunities
- **Academic Background Integration**: Highlights relevant coursework and research experience

**Usage:**

1. Search for faculty members by research interest or institution
2. Select target faculty members for outreach
3. Generate personalized academic emails highlighting research alignment
4. Send or export emails for external sending
5. Track academic outreach campaigns

### Email Management

Anveshak  provides comprehensive email campaign management:

- **Email History**: Tracks all generated and sent emails
- **Status Tracking**: Monitors email status (draft, sent, replied)
- **Email Analytics**: Provides open rates, response rates, and effectiveness metrics
- **Campaign Grouping**: Organizes emails by campaign, company type, or time period
- **Follow-Up Suggestions**: Recommends appropriate follow-up timing and content
- **Template Management**: Saves successful emails as templates for future use
- **Response Handling**: Assists with response management and follow-up

**Usage:**

1. Access email history from dashboard
2. Filter and sort by various criteria (date, status, company)
3. View detailed metrics and performance analytics
4. Set up follow-up reminders and templates
5. Archive or categorize email threads

## API Reference

### Public API Endpoints

#### Authentication API

**POST /api/auth/register**

- Register a new user
- Parameters:
  - `name` (string): User's full name
  - `email` (string): User's email address
  - `password` (string): User's password
- Response: User object with authentication token

**POST /api/auth/login**

- Log in an existing user
- Parameters:
  - `email` (string): User's email address
  - `password` (string): User's password
- Response: User object with authentication token

**POST /api/auth/verify**

- Verify user email
- Parameters:
  - `token` (string): Email verification token
- Response: Verification success status

**POST /api/auth/reset-password-request**

- Request a password reset
- Parameters:
  - `email` (string): User's email address
- Response: Request status

**POST /api/auth/reset-password**

- Reset user password
- Parameters:
  - `token` (string): Password reset token
  - `password` (string): New password
- Response: Reset status

#### Resume API

**POST /api/resumes/upload**

- Upload and parse a resume
- Authentication: Required
- Parameters:
  - `file` (file): PDF resume file
- Response: Parsed resume data

**GET /api/resumes/:id**

- Get resume data by ID
- Authentication: Required
- Response: Complete resume data

**PUT /api/resumes/:id**

- Update resume data
- Authentication: Required
- Parameters:
  - Resume data fields to update
- Response: Updated resume data

#### Email Generation API

**POST /api/emails/generate**

- Generate personalized emails
- Authentication: Required
- Parameters:
  - `resumeId` (string): Resume ID
  - `action` (string): Action type (find-companies, generate-emails)
  - `companies` (array, optional): Selected companies
- Response: Generated email content or company matches

**POST /api/academic/search-and-email**

- Search for academic faculty and generate emails
- Authentication: Required
- Parameters:
  - `domains` (array): Research interests
- Response: Faculty list

**POST /api/academic/generate-preview-emails**

- Generate preview emails for selected faculty
- Authentication: Required
- Parameters:
  - `resumeId` (string): Resume ID
  - `selectedFaculty` (array): Selected faculty members
- Response: Generated preview emails

### Protected API Endpoints

**GET /api/emails/user/:userId**

- Get all emails for a user
- Authentication: Required (Admin or Owner)
- Response: Email records for user

**POST /api/emails/send**

- Send emails from drafts
- Authentication: Required
- Parameters:
  - `emailIds` (array): Email IDs to send
- Response: Send status

**GET /api/users/me**

- Get current user profile
- Authentication: Required
- Response: User profile data

## Error Handling and Resilience

### JSON Parsing Enhancement

Anveshak  implements robust error handling for JSON parsing in AI responses:

**Key Features:**

- **Enhanced JSON Validation**: Comprehensive validation for JSON structure
- **Balanced Braces Check**: Ensures JSON has matching opening and closing braces
- **Advanced JSON Repair**: Fixes common issues in malformed JSON responses
- **Multi-layer Fallback Strategy**: Multiple fallback methods for parsing failures
- **Pattern Matching Extraction**: Uses regex to extract content when JSON parsing fails

**Implementation:**

```javascript
// First attempt standard parsing with repair
try {
  emailContent = JSON.parse(fixedJson);
} catch (innerParseError) {
  // Second attempt: extract JSON object bounds
  const jsonStartIndex = fixedJson.indexOf("{");
  const jsonEndIndex = fixedJson.lastIndexOf("}") + 1;

  if (jsonStartIndex !== -1 && jsonEndIndex > jsonStartIndex) {
    const extractedJson = fixedJson.substring(jsonStartIndex, jsonEndIndex);
    emailContent = JSON.parse(extractedJson);
  } else {
    // Third attempt: regex extraction for email components
    const subjectMatch = text.match(/"subject"\s*:\s*"([^"]+)"/);
    const bodyMatch = text.match(/"body"\s*:\s*"([\s\S]+?)(?:"\s*}|\s*"\s*$)/);

    if (subjectMatch && bodyMatch) {
      emailContent = {
        subject: subjectMatch[1].trim(),
        body: bodyMatch[1].trim(),
      };
    }
  }
}
```

### Safety Settings

The application implements proper safety settings for AI-generated content:

```javascript
safetySettings: [
  {
    category: "HARM_CATEGORY_DANGEROUS_CONTENT",
    threshold: "BLOCK_MEDIUM_AND_ABOVE",
  },
],
```

## Implementation Guides

### Setting Up the Environment

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   cd server && npm install
   ```
3. Create `.env` files in root and server directories with required values
4. Initialize the database:
   ```
   npm run init-db
   ```
5. Start the development servers:
   ```
   npm run dev
   ```

### Integrating with Google Generative AI

1. Obtain Gemini API key from Google AI Studio
2. Add key to environment variables
3. Configure safety settings and generation parameters
4. Implement error handling and fallback mechanisms

### Adding New Email Templates

1. Create template definition with variables
2. Implement prompt structure for generation
3. Define validation rules for generated content
4. Add UI components for template selection

## Security Practices

Anveshak  implements several security best practices:

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: Secure password storage with bcrypt
- **Input Validation**: Comprehensive validation of user inputs
- **Rate Limiting**: Protection against brute force and DoS attacks
- **CORS Configuration**: Controlled cross-origin resource sharing
- **Environment Variables**: Secure storage of sensitive information
- **Email Verification**: Required email verification for new accounts
- **Content Sanitization**: Input and output sanitization to prevent XSS

## Future Roadmap

Upcoming features and improvements:

- **Interview Preparation**: AI-powered interview question suggestions
- **Response Templates**: Smart response templates for common email replies
- **Multi-language Support**: Support for resumes and emails in multiple languages
- **Integration APIs**: External system integration through APIs
- **Advanced Analytics**: Enhanced email performance analytics
- **Mobile Application**: Native mobile app for on-the-go management
- **Networking Features**: Contact management and relationship tracking
