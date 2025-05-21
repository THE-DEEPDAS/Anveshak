# Database Schema Documentation

This document details the MongoDB database schema used by Anveshak , including all collections, their relationships, field types, and purpose.

## Overview

Anveshak  uses MongoDB as its primary database. The schema is designed around the following core collections:

- **Users** - User accounts and authentication information
- **Resumes** - Resume documents and parsed content
- **Emails** - Generated or sent emails
- **Companies** - Company information for job applications
- **Faculty** - Academic faculty member information
- **Institutions** - Academic institutions

## Schema Relationships

```
┌───────────┐           ┌───────────┐           ┌───────────┐
│   User    │──────────▶│  Resume   │◀──────────│   Email   │
└───────────┘     1:N   └───────────┘     N:1   └───────────┘


┌───────────┐           ┌───────────┐
│  Faculty  │◀──────────│Institution│
└───────────┘     N:1   └───────────┘
```

## Collection Schemas

### User Collection

Stores user account information and authentication details.

| Field                    | Type     | Description                               |
| ------------------------ | -------- | ----------------------------------------- |
| \_id                     | ObjectId | Unique identifier                         |
| name                     | String   | User's full name                          |
| email                    | String   | Unique email address (required, indexed)  |
| password                 | String   | Hashed password                           |
| isVerified               | Boolean  | Whether the user has verified their email |
| verificationToken        | String   | Token for email verification              |
| verificationTokenExpiry  | Date     | Expiration date for verification token    |
| resetPasswordToken       | String   | Token for password reset                  |
| resetPasswordTokenExpiry | Date     | Expiration date for reset token           |
| createdAt                | Date     | Account creation timestamp                |
| updatedAt                | Date     | Last update timestamp                     |

**Indexes:**

- `email`: unique index for email lookup

**Methods:**

- `comparePassword(candidatePassword)`: Compares the provided password against the stored hash
- `isVerificationTokenExpired()`: Checks if the verification token has expired
- `isPasswordResetTokenExpired()`: Checks if the password reset token has expired

### Resume Collection

Stores uploaded resumes and their parsed content.

| Field              | Type                 | Description                                 |
| ------------------ | -------------------- | ------------------------------------------- |
| \_id               | ObjectId             | Unique identifier                           |
| user               | ObjectId (ref: User) | Reference to User who owns the resume       |
| education          | Array                | Array of education entries                  |
| ↳ name             | String               | Name of the education (e.g., "BS in CS")    |
| ↳ institution      | String               | Institution name                            |
| ↳ degree           | String               | Degree type                                 |
| ↳ field            | String               | Field of study                              |
| ↳ startDate        | String               | Start date                                  |
| ↳ endDate          | String               | End date                                    |
| ↳ gpa              | String               | GPA                                         |
| filename           | String               | Stored filename                             |
| originalFilename   | String               | Original uploaded filename                  |
| cloudinaryPublicId | String               | Cloudinary ID (unique, indexed)             |
| cloudinaryUrl      | String               | URL to the stored file                      |
| text               | String               | Raw extracted text from resume              |
| skills             | Array[String]        | Extracted skills                            |
| experience         | Array[String]        | Extracted work experience                   |
| projects           | Array[String]        | Extracted projects                          |
| parseHistory       | Array                | History of parsing results                  |
| ↳ skills           | Array[String]        | Skills from this parsing                    |
| ↳ experience       | Array[String]        | Experience from this parsing                |
| ↳ projects         | Array[String]        | Projects from this parsing                  |
| ↳ parseMethod      | String               | Method used for parsing                     |
| ↳ warning          | String               | Warnings from this parsing                  |
| ↳ parsedAt         | Date                 | When this parsing was done                  |
| currentVersion     | Number               | Current version number of parsing           |
| parseMethod        | Enum String          | Method used for current parsing             |
| lastParseAttempt   | Date                 | When the last parsing was attempted         |
| parseStatus        | Enum String          | Status of parsing: pending/completed/failed |
| parseError         | Object               | Details about parsing errors                |
| ↳ message          | String               | Error message                               |
| ↳ timestamp        | Date                 | When the error occurred                     |
| ↳ stack            | String               | Error stack trace                           |
| warning            | String               | Current parsing warnings                    |
| lastModifiedBy     | Enum String          | Who last modified: system/user/ai           |
| createdAt          | Date                 | When resume was created                     |
| updatedAt          | Date                 | When resume was last updated                |

**Indexes:**

- `user`: index for efficient user lookup
- `cloudinaryPublicId`: unique index

**Methods:**

- `updateParseResults(parseResults)`: Updates with new parsing results and adds to history
- `markParseFailed(error)`: Marks parsing as failed with error details
- `updateManually(userData)`: Updates resume data manually from user input

### Email Collection

Stores generated and sent emails.

| Field           | Type                   | Description                        |
| --------------- | ---------------------- | ---------------------------------- |
| \_id            | ObjectId               | Unique identifier                  |
| user            | ObjectId (ref: User)   | User who owns this email           |
| resume          | ObjectId (ref: Resume) | Resume used to generate this email |
| company         | String                 | Company or institution name        |
| recipient       | String                 | Email recipient address            |
| role            | String                 | Job role or position               |
| subject         | String                 | Email subject line                 |
| body            | String                 | Email body content                 |
| status          | Enum String            | Status: draft/sent/failed          |
| sentAt          | Date                   | When the email was sent            |
| companyResearch | Object                 | Research data about the company    |
| ↳ overview      | String                 | Company overview                   |
| ↳ achievements  | Array[String]          | Company achievements               |
| ↳ culture       | String                 | Company culture                    |
| ↳ projects      | Array[String]          | Company projects                   |
| ↳ techStack     | Object                 | Technology stack information       |
| ↳ ↳ frontend    | Array[String]          | Frontend technologies              |
| ↳ ↳ backend     | Array[String]          | Backend technologies               |
| ↳ ↳ devops      | Array[String]          | DevOps technologies                |
| ↳ ↳ other       | Array[String]          | Other technologies                 |
| matchReason     | String                 | Why this company/faculty matched   |
| createdAt       | Date                   | When the email was created         |
| updatedAt       | Date                   | When the email was last updated    |

### Company Collection

Stores company information.

| Field              | Type               | Description                        |
| ------------------ | ------------------ | ---------------------------------- |
| \_id               | ObjectId           | Unique identifier                  |
| name               | String             | Company name (indexed)             |
| email              | String             | Contact email                      |
| role               | String             | Role for applications              |
| description        | String             | Company description                |
| website            | String             | Company website URL (indexed)      |
| linkedIn           | String             | LinkedIn profile URL               |
| domains            | Array[String]      | Associated domains                 |
| industry           | Array[String]      | Industries the company operates in |
| technologiesUsed   | Array[Object]      | Technologies used by the company   |
| ↳ name             | String             | Technology name                    |
| ↳ category         | Enum String        | Category of technology             |
| ↳ expertise        | Enum String        | Level of expertise                 |
| companyResearch    | Object             | Researched data about the company  |
| openRoles          | Array[Object]      | Open job positions                 |
| ↳ title            | String             | Job title                          |
| ↳ department       | String             | Department                         |
| ↳ skills           | Array[Object]      | Required skills                    |
| ↳ ↳ name           | String             | Skill name                         |
| ↳ ↳ required       | Boolean            | Whether the skill is required      |
| ↳ ↳ priority       | Enum String        | Priority level of the skill        |
| ↳ experience       | Object             | Experience requirements            |
| ↳ location         | Object             | Job location                       |
| ↳ active           | Boolean            | Whether the role is active         |
| size               | Enum String        | Company size range                 |
| funding            | Object             | Funding information                |
| location           | Object             | Headquarters and office locations  |
| contact            | Object             | Contact information                |
| products           | Array[Object]      | Company products                   |
| researchAreas      | Array[Object]      | Research areas                     |
| companyType        | Enum String        | Type of company                    |
| workCulture        | Array[Enum String] | Work culture attributes            |
| benefits           | Array[Enum String] | Employee benefits                  |
| dataSources        | Array[Object]      | Sources of company data            |
| verificationStatus | Object             | Verification information           |
| createdAt          | Date               | Creation timestamp                 |
| updatedAt          | Date               | Last update timestamp              |

**Indexes:**

- `name`: text index
- `website`: index
- `technologiesUsed.name`: index for technology matching
- Multiple compound indexes for specialized searches

**Methods:**

- `hasTechnology(techName)`: Checks if company uses a specific technology
- `getActiveJobs()`: Returns all active job openings
- `getSkillMatchPercentage(candidateSkills)`: Calculates skill match percentage

### Faculty Collection

Stores academic faculty information.

| Field             | Type                        | Description               |
| ----------------- | --------------------------- | ------------------------- |
| \_id              | ObjectId                    | Unique identifier         |
| name              | String                      | Faculty member's name     |
| email             | String                      | Email address (unique)    |
| institution       | ObjectId (ref: Institution) | Reference to institution  |
| department        | String                      | Academic department       |
| researchInterests | Array[String]               | Research interest areas   |
| portfolio         | String                      | Portfolio website URL     |
| projects          | Array[String]               | Current research projects |
| createdAt         | Date                        | Creation timestamp        |
| updatedAt         | Date                        | Last update timestamp     |

### Institution Collection

Stores academic institution information.

| Field       | Type          | Description                       |
| ----------- | ------------- | --------------------------------- |
| \_id        | ObjectId      | Unique identifier                 |
| name        | String        | Institution name (unique)         |
| type        | Enum String   | Institution type (IIT, NIT, etc.) |
| location    | String        | Geographic location               |
| departments | Array[String] | Academic departments              |
| website     | String        | Institution website               |
| createdAt   | Date          | Creation timestamp                |
| updatedAt   | Date          | Last update timestamp             |

## Schema Validation and Constraints

The MongoDB schemas include several validation constraints:

1. **Email Format Validation**: For users, companies, and faculty
2. **Required Fields**: Critical fields are marked as required
3. **Enum Constraints**: Many fields use enums to limit possible values
4. **Unique Constraints**: Applied to fields like email and cloudinaryPublicId
5. **Composite Indexes**: For optimizing common query patterns

## Data Relationships

1. **User to Resume**: One-to-many (one user can have multiple resumes)
2. **Resume to Email**: One-to-many (one resume can generate multiple emails)
3. **Faculty to Institution**: Many-to-one (multiple faculty belong to one institution)

## Indexing Strategy

The database uses strategic indexes to optimize common query patterns:

1. **Text indexes** for full-text search on companies and resumes
2. **Compound indexes** for filtered searches (e.g., technology + company name)
3. **Single field indexes** on frequently queried fields like user ID and email

## Database Maintenance

Regular database maintenance should include:

1. **Index optimization**: Review and update indexes based on query patterns
2. **Data archiving**: Archive old emails and resume versions
3. **Validation**: Ensure data conforms to schema requirements
