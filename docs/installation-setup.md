# Installation and Environment Setup Instructions

This document provides comprehensive instructions for setting up the Cold Mailer application development and production environments.

## System Requirements

- **Node.js**: v16.x or later (v18.x recommended)
- **MongoDB**: v5.0 or later
- **npm**: v8.x or later
- **Git**: For version control
- **OS**: Windows, macOS, or Linux

## Quick Start

```powershell
# Clone the repository
git clone https://github.com/your-username/cold-mailer.git
cd cold-mailer

# Install all dependencies (both client and server)
npm run install-all

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run dev
```

## Detailed Setup Instructions

### 1. Clone the Repository

```powershell
git clone https://github.com/your-username/cold-mailer.git
cd cold-mailer
```

### 2. Install Dependencies

The project uses a monorepo structure with separate package.json files for the client (root) and server.

```powershell
# Install both client and server dependencies
npm run install-all

# Or install them separately
npm install
cd server
npm install
cd ..
```

### 3. Configure Environment Variables

1. Copy the example environment file:

```powershell
cp .env.example .env
```

2. Edit the `.env` file with your specific configuration:

```
# MongoDB
MONGODB_URI=mongodb://localhost:27017/cold-email-platform

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Email (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_SECURE=false

# Google AI/Gemini
GEMINI_API_KEY=your_gemini_api_key

# JWT
JWT_SECRET=your_jwt_secret_key

# Server
PORT=5000
NODE_ENV=development
```

#### Required External Services

1. **MongoDB Database**

   - For local development: Install MongoDB locally
   - For production: Use MongoDB Atlas or another cloud provider
   - Create a database named `cold-email-platform`

2. **Cloudinary Account**

   - Sign up at [cloudinary.com](https://cloudinary.com/)
   - Create a new project/cloud
   - Retrieve your cloud name, API key, and API secret

3. **Google Generative AI API Key**

   - Visit [Google AI Studio](https://aistudio.google.com/)
   - Create an API key for the Gemini model
   - Copy the API key to your .env file

4. **Email Provider**
   - For Gmail: Create an app password in your Google account settings
   - For other providers: Use appropriate SMTP settings

### 4. Initialize the Database

The application includes scripts to initialize the database with sample data:

```powershell
# Initialize academic database with faculty and institutions
cd server
npm run init-academic-db

# Initialize company database (if available)
npm run init-company-db
cd ..
```

### 5. Start Development Server

```powershell
# Start both frontend and backend concurrently
npm run dev

# Start separately if needed
cd server
npm run dev
# In another terminal
cd ..
npm run dev
```

The development servers will start at:

- Frontend: http://localhost:5173
- Backend: http://localhost:5000

### 6. Building for Production

```powershell
# Build the frontend
npm run build

# Start production server
npm run start
```

## Folder Structure Overview

```
/cold-mailer
├── /docs                # Documentation files
├── /public              # Static assets
├── /server              # Backend server code
│   ├── /config          # Server configuration
│   ├── /middleware      # Express middleware
│   ├── /models          # MongoDB schema models
│   ├── /routes          # API routes
│   ├── /scripts         # Database scripts
│   ├── /services        # Business logic
│   └── index.js         # Server entry point
├── /src                 # Frontend React code
│   ├── /components      # React components
│   ├── /config          # Frontend configuration
│   ├── /context         # React context providers
│   ├── /pages           # Page components
│   └── /services        # API service modules
└── package.json         # Project configuration
```

## Database Setup

### Local MongoDB

1. Install MongoDB Community Edition from the [official website](https://www.mongodb.com/try/download/community)
2. Start the MongoDB service:

```powershell
# Windows (run as administrator)
net start mongodb

# Or using MongoDB Compass
# Download and install MongoDB Compass for GUI management
```

### Cloud MongoDB (MongoDB Atlas)

1. Create an account on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster (free tier available)
3. Configure network access to allow connections from your IP
4. Create a database user
5. Get your connection string and add it to your `.env` file:

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/cold-email-platform
```

## Cloudinary Setup

1. Create an account on [Cloudinary](https://cloudinary.com/)
2. From your dashboard, copy:
   - Cloud name
   - API key
   - API secret
3. Update your `.env` file with these values

## Troubleshooting Common Issues

### MongoDB Connection Issues

If you encounter MongoDB connection problems:

1. Verify MongoDB is running:

```powershell
# Check if MongoDB service is running
Get-Service -Name MongoDB
```

2. Check your connection string format
3. Ensure network access is correctly configured (for Atlas)

### Gemini API Issues

If the AI features aren't working:

1. Verify your API key is correct
2. Check API usage quota
3. Verify your region has access to the Gemini API

### PDF Parsing Issues

If resume parsing isn't working:

1. Ensure PDF files are text-based, not scanned images
2. Check Cloudinary configuration for file uploads
3. Test with sample resumes from the test directory

## Running Tests

```powershell
# Run all tests
cd server
npm run runAllTests

# Run specific test
node testSimplifiedParser.js
```

## Development Workflow

1. Start the development servers:

```powershell
npm run dev
```

2. Access the application:

   - Frontend: http://localhost:5173
   - API: http://localhost:5000/api

3. Create a test user account
4. Upload a resume to test the parsing functionality
5. Test email generation features

## Deployment

### Deployment Options

1. **Render.com**

   - Connect your GitHub repository
   - Configure build settings
   - Set environment variables

2. **Heroku**

   - Install Heroku CLI
   - Create a new application
   - Set environment variables
   - Deploy using Git

3. **Vercel (Frontend) + Railway (Backend)**
   - Deploy the frontend on Vercel
   - Deploy the backend on Railway
   - Configure environment variables on both platforms

### Preparing for Production

1. Update environment variables for production
2. Set `NODE_ENV=production`
3. Use a production MongoDB database
4. Configure proper CORS settings for production domains

## Additional Resources

- [MongoDB Documentation](https://docs.mongodb.com/)
- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Google Generative AI Documentation](https://ai.google.dev/tutorials/web_quickstart)
- [React Documentation](https://react.dev/)
- [Express.js Documentation](https://expressjs.com/)
