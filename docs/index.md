# Anveshak  Documentation

Welcome to the Anveshak  documentation. This comprehensive set of documents provides detailed information about the system's architecture, features, APIs, and usage instructions.

## Documentation Index

### User Documentation

- [**User Guide**](./user-guide.md) - Complete guide for end users on how to use the Anveshak  application
- [**Installation and Setup**](./installation-setup.md) - Instructions for installing and configuring the application

### Technical Documentation

- [**API Documentation**](./api-documentation.md) - Complete API reference for all endpoints
- [**Database Schema**](./database-schema.md) - Detailed database schema documentation
- [**Frontend Components**](./frontend-components.md) - Reference for React component architecture

### Algorithm Documentation

- [**Resume Parsing Algorithms**](./resume-parsing-algorithms.md) - Technical deep dive into the resume parsing methods
- [**Comprehensive Documentation**](./comprehensive-documentation.md) - High-level system design documentation

### Feature Documentation

- [**Academic Email Generation**](./user-guide.md#academic-email-generation) - Guide to the academic email generation feature
- [**Company Email Generation**](./user-guide.md#company-research-and-matching) - Guide to the company email generation feature

### Development Guides

- [**Auth Flow Changes**](./auth-flow-changes.md) - Details about authentication flow implementation
- [**JSON Parser Fix**](./json-parser-fix.md) - Information on JSON parsing fixes
- [**New Features**](./new-features.md) - Documentation for new features

## System Architecture Overview

Anveshak  is built using a modern MERN stack (MongoDB, Express.js, React, Node.js) architecture with the following key components:

1. **Frontend Layer**

   - React-based single-page application (SPA)
   - Context-based state management
   - Responsive UI components

2. **Backend Layer**

   - Express.js REST API server
   - Modular service architecture
   - JWT-based authentication

3. **Data Layer**

   - MongoDB document database
   - Mongoose schema validation
   - Optimized indexing strategy

4. **AI/ML Layer**

   - Google Generative AI (Gemini) integration
   - Resume parsing algorithms
   - Email generation algorithms

5. **External Integrations**
   - Cloudinary for file storage
   - Nodemailer for email delivery
   - Web scraping for company research

## Getting Started

1. Begin with the [Installation and Setup](./installation-setup.md) guide to set up your development environment
2. Review the [Database Schema](./database-schema.md) to understand the data structure
3. Explore the [API Documentation](./api-documentation.md) to understand available endpoints
4. Consult the [Frontend Components](./frontend-components.md) documentation for UI architecture

## Contributing

Before contributing to Anveshak , please review:

1. The code structure in the installation guide
2. API documentation to understand existing endpoints
3. Frontend component architecture
4. Database schema

## Future Roadmap

See the [Future Plan](./Future%20Plan.md) document for upcoming features and enhancements, including:

- Enhanced academic institution search capabilities
- Additional resume parsing algorithms
- SMTP credentials management for enhanced email security
- Improved AI models for email generation
