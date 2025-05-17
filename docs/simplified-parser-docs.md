# Simplified Resume Parser Documentation

The Cold Mailer application now includes a simplified yet effective resume parsing algorithm that focuses on extracting skills, experience, and projects from PDF resumes without requiring additional dependencies like pdf.js.

## Overview

The simplified resume parser follows this extraction process:

1. Extract text from PDF using the existing pdf-parse library
2. Process the text to identify key sections (Skills, Experience, Projects)
3. Extract structured data from each section using specialized algorithms
4. Format the extracted data for application use

## Key Features

- **No Additional Dependencies**: Works with the existing pdf-parse library
- **Section Identification**: Intelligently identifies key resume sections
- **Bullet Point Handling**: Properly extracts and formats bullet points
- **Format Flexibility**: Handles various resume formats and structures
- **Fallback Mechanisms**: Uses multiple strategies to extract data if standard approaches fail

## Usage

The parser is automatically used in the resume parsing workflow:

```javascript
// This is automatically handled in the resumeParser.js file
const parsedData = await parseSimplified(pdfBuffer);
const formattedData = formatResumeData(parsedData);

// Results will include:
{
  skills: ["Skill 1", "Skill 2", ...],
  experience: ["Company: Job Title | Description", ...],
  projects: ["Project Name: Description", ...]
}
```

## Testing

You can test the parser with sample resumes using the included test script:

```
node testSimplifiedParser.js path/to/resume.pdf
```

Or you can test with a plain text file:

```
node testSimplifiedParser.js path/to/resume.txt
```

## Implementation Details

### Section Detection

The parser uses a combination of exact heading matching and context analysis to identify resume sections:

- Skills section: Looks for "SKILLS", "TECHNICAL SKILLS", "PROGRAMMING LANGUAGES", etc.
- Experience section: Looks for "EXPERIENCE", "WORK EXPERIENCE", "EMPLOYMENT", etc.
- Projects section: Looks for "PROJECTS", "PROJECT EXPERIENCE", "PERSONAL PROJECTS", etc.

### Data Extraction

1. **Skills Extraction**:

   - Handles bullet points and category headers
   - Processes skill lists with commas, pipes, or semicolons
   - Identifies standalone skills and categorized skills

2. **Experience Extraction**:

   - Identifies company names and positions
   - Extracts date patterns and locations
   - Processes bullet points describing responsibilities
   - Handles both structured and unstructured formats

3. **Project Extraction**:
   - Identifies project titles and technologies
   - Extracts date ranges and links (GitHub, Website)
   - Processes bullet points describing project details
   - Handles both chronological and categorized project listings

## Error Handling

The parser includes robust error handling:

- Falls back to traditional parsing methods if simplified parsing fails
- Attempts to process text directly if PDF parsing fails
- Preserves previous resume data if parsing is unsuccessful

## Maintenance

When modifying the parser, consider these aspects:

- Section header variations might need updates for different resume formats
- Bullet point formats may vary across different word processors
- Date patterns should be kept updated for various international formats

## Performance

The simplified parser is designed to be fast and memory-efficient, making it suitable for processing multiple resumes in batch operations.
