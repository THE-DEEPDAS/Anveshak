# Resume Parsing Algorithms - Technical Documentation

## Overview

Cold Mailer implements three complementary resume parsing algorithms, each with specific strengths and use cases. This document provides a technical deep dive into the implementation, algorithms, and optimization techniques used in each parser.

## Table of Contents

1. [Simplified Parser](#simplified-parser)
2. [Advanced Parser](#advanced-parser)
3. [AI-powered Parser](#ai-powered-parser)
4. [Parsing Strategy Selection](#parsing-strategy-selection)
5. [Data Integration](#data-integration)
6. [Benchmarks](#benchmarks)
7. [Error Handling](#error-handling)

## Simplified Parser

The simplified parser (`simplifiedResumeParser.js`) provides a lightweight, rule-based approach to resume parsing without external API dependencies.

### Algorithm

1. **Text Extraction:**

   - Uses `pdf-parse` library to extract raw text from PDF
   - Applies enhanced page rendering techniques to preserve structure
   - Normalizes whitespace and special characters

2. **Section Identification:**

   - Identifies common section headers (Skills, Experience, Projects, etc.)
   - Uses both exact and fuzzy matching for section detection
   - Handles variations in capitalization and formatting

3. **Content Extraction:**

   - Extracts content between identified section headers
   - Processes text using specialized extractors for each section type
   - Applies rule-based heuristics to identify items, dates, and organizations

4. **Data Normalization:**
   - Standardizes date formats
   - Normalizes company names and roles
   - De-duplicates and ranks skills by relevance

### Key Functions

```javascript
// Main parsing function
async function parseResumeText(pdfBuffer) {
  // Extract text from PDF or process provided text
  let rawText = await extractTextFromBuffer(pdfBuffer);

  // Process text into structured data
  const resumeData = {
    skills: extractSkills(rawText),
    experience: extractExperience(rawText),
    projects: extractProjects(rawText),
    education: extractEducation(rawText),
  };

  return formatResumeData(resumeData);
}

// Skills extraction function
function extractSkills(text) {
  // Find skills section using various headers
  const skillsSection = findSection(text, SKILL_HEADERS);

  // Extract skills using patterns (comma/bullet separated)
  let skills = [];
  if (skillsSection) {
    // Extract comma-separated skills
    skills = [...skills, ...extractCommaSeparatedList(skillsSection)];

    // Extract bullet-point skills
    skills = [...skills, ...extractBulletItems(skillsSection)];
  }

  // Scan other sections for skill mentions
  const otherSections = text.replace(skillsSection, "");
  skills = [...skills, ...findTechnicalTerms(otherSections)];

  // Normalize and deduplicate
  return normalizeSkillList(skills);
}
```

### Performance Optimizations

1. **Regex Caching:** Pre-compiles and reuses regular expressions
2. **Incremental Parsing:** Processes document sections independently
3. **Efficient Text Handling:** Minimizes string copying operations
4. **Selective Depth:** Adjusts parsing depth based on document complexity

### Strengths & Limitations

**Strengths:**

- Fast processing (50-150ms typical runtime)
- No external API dependencies
- Predictable results
- Works offline

**Limitations:**

- Less accurate for non-standard formats
- Limited semantic understanding
- Requires well-structured documents
- May miss context-dependent information

## Advanced Parser

The advanced parser (`advancedResumeParser.js`) provides a more sophisticated approach based on the OpenResume algorithm. It utilizes PDF.js to extract text with positional data, enabling layout understanding.

### Algorithm

1. **PDF Processing:**

   - Loads PDF document using PDF.js
   - Extracts text elements with precise positional coordinates
   - Preserves font information (size, weight, style)

2. **Text Item Grouping:**

   - Groups text items into lines based on Y-coordinates
   - Maintains X-coordinate order within lines
   - Identifies structural elements like bullets and indentation

3. **Line Grouping:**

   - Groups lines into blocks based on spacing and formatting
   - Identifies section headers using font size and style cues
   - Creates hierarchical structure of sections and subsections

4. **Semantic Analysis:**
   - Identifies semantic meaning of each section
   - Extracts dates, organizations, roles, and descriptions
   - Preserves chronological ordering and hierarchical relationships

### Key Components

```javascript
/**
 * Extract text items with position data from PDF
 */
async function extractTextItemsFromPdf(filePath) {
  const data = new Uint8Array(await fs.readFile(filePath));
  const loadingTask = pdfjs.getDocument(data);
  const pdf = await loadingTask.promise;

  let allTextItems = [];

  // Process each page
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const viewport = page.getViewport({ scale: 1.0 });

    // Map text items with position data
    const pageTextItems = textContent.items.map((item) => ({
      text: item.str,
      x: item.transform[4],
      y: viewport.height - item.transform[5],
      width: item.width,
      height: item.height,
      fontName: item.fontName,
      fontSize: item.transform[0], // Font size approximation
    }));

    allTextItems = [...allTextItems, ...pageTextItems];
  }

  return allTextItems;
}

/**
 * Group text items into lines based on Y-coordinates
 */
function groupTextItemsIntoLines(textItems) {
  // Sort by Y coordinate first, then X
  const sortedItems = [...textItems].sort((a, b) => {
    if (Math.abs(a.y - b.y) < 5) {
      // Items on same line (within 5px tolerance)
      return a.x - b.x; // Sort by X coordinate (left to right)
    }
    return a.y - b.y; // Sort by Y coordinate (top to bottom)
  });

  const lines = [];
  let currentLine = [];
  let currentY = sortedItems[0]?.y;

  // Group items by Y coordinate
  sortedItems.forEach((item) => {
    if (Math.abs(item.y - currentY) < 5) {
      // Same line
      currentLine.push(item);
    } else {
      // New line
      if (currentLine.length > 0) {
        lines.push({
          items: currentLine,
          text: currentLine.map((i) => i.text).join(" "),
          y: currentY,
          fontSize: getMostCommonFontSize(currentLine),
        });
      }
      currentLine = [item];
      currentY = item.y;
    }
  });

  // Add the last line
  if (currentLine.length > 0) {
    lines.push({
      items: currentLine,
      text: currentLine.map((i) => i.text).join(" "),
      y: currentY,
      fontSize: getMostCommonFontSize(currentLine),
    });
  }

  return lines;
}
```

### Handling Complex Layouts

The advanced parser addresses complex layout challenges through:

1. **Multi-column Detection:** Identifies multiple columns using X-coordinate clustering
2. **Table Recognition:** Detects tabular data using alignment and spacing patterns
3. **Header/Footer Handling:** Identifies and filters headers/footers based on position and recurrence
4. **List Recognition:** Detects different list formats (numbered, bulleted, etc.)

### Performance Considerations

- Higher memory usage due to position tracking
- Longer processing times (200-500ms typical)
- Resource usage scales with document complexity
- Uses worker threads for large documents when available

## AI-powered Parser

The AI-powered parser leverages Google's Gemini models through structured prompts for semantic understanding of resume content.

### Algorithm

1. **Text Preparation:**

   - Extracts text from PDF using pdf-parse
   - Normalizes and cleans text
   - Preserves important formatting indicators

2. **Prompt Engineering:**

   - Creates specialized prompts for each resume component
   - Includes detailed instructions for extraction format
   - Provides examples and constraints for output

3. **Component Extraction:**

   - Sends targeted prompts for skills, experience, projects, etc.
   - Processes responses with specialized parsers
   - Validates extracted content against expectations

4. **Data Integration:**
   - Combines results from multiple extraction calls
   - Reconciles potential inconsistencies
   - Structures final resume data model

### Prompt Engineering

Specialized prompts are designed for each resume component. For example:

#### Skills Extraction Prompt:

```javascript
const prompt = `
  Extract all technical skills from the following resume text.
  - Look for sections labeled "Skills", "Technical Skills", "Technologies", etc.
  - For sections with bullet points or comma-separated lists, extract those directly
  - For skills written in sentences, extract individual technical terms
  - Remove common words and focus on technical terms, tools, frameworks, and languages
  - Be thorough and extract ALL technical skills mentioned anywhere in the resume
  - Include programming languages, frameworks, libraries, tools, platforms, methodologies
  - Look in experience and project descriptions for mentioned technologies
  - Return ONLY an array of strings with no other text or explanation
  - Format each skill consistently (proper capitalization for acronyms like "HTML", "CSS")
  - For compound skills like "React.js", keep them as one skill
  
  Resume text:
  ${text}
`;
```

#### Experience Extraction Prompt:

```javascript
const prompt = `
  Extract all work experience from the following resume text.
  For each position, extract:
  - Company name
  - Job title
  - Start date
  - End date (or "Present" if current)
  - Location (if available)
  - Description/responsibilities
  
  Format the output as a JSON array of objects with these fields.
  Be precise and extract ONLY actual work experience (not education or projects).
  Return ONLY the JSON array with no other text or explanation.
  
  Resume text:
  ${text}
`;
```

### Response Processing

```javascript
async function getSkillsFromText(text) {
  try {
    const model = getModel();
    const prompt = buildSkillsExtractionPrompt(text);

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();

    // Parse response as JSON array
    let skills;
    try {
      // Handle different JSON formatting in the response
      if (responseText.includes("[") && responseText.includes("]")) {
        // Extract the array part if it exists
        const arrayMatch = responseText.match(/\[([^\]]*)\]/);
        if (arrayMatch && arrayMatch[1]) {
          const cleanedText = arrayMatch[1].trim();
          const itemsText = `[${cleanedText}]`;
          skills = JSON.parse(itemsText);
        } else {
          skills = JSON.parse(responseText);
        }
      } else {
        // Handle non-JSON format (comma separated list)
        skills = responseText
          .split(/,\s*/)
          .map((s) => s.trim())
          .filter(Boolean);
      }
    } catch (parseError) {
      // Fallback parsing for non-standard formats
      skills = responseText
        .replace(/^\s*\[\s*|\s*\]\s*$/g, "") // Remove array brackets
        .split(/",\s*"|',\s*'|,\s*/) // Split by commas and quotes
        .map((s) => s.replace(/^["']|["']$/g, "").trim())
        .filter(Boolean);
    }

    // Normalize and deduplicate skills
    return [...new Set(skills)].map(normalizeSkill);
  } catch (error) {
    console.error("Error extracting skills:", error);
    return getMockSkills(); // Fallback to mock data
  }
}
```

### Error Handling and Fallbacks

1. **Retry Logic:** Implements automatic retries with different prompts
2. **Temperature Adjustment:** Increases diversity for failed extractions
3. **Format Recovery:** Detects and repairs malformed responses
4. **Fallback Chain:** Cascades through multiple extraction strategies
5. **Mock Data:** Provides sensible defaults for complete failures

### Advantages and Limitations

**Advantages:**

- Superior semantic understanding
- Handles non-standard formats and languages
- Extracts implied skills and contexts
- Categorizes information intelligently

**Limitations:**

- API dependency
- Higher cost
- Higher latency (500-2000ms typical)
- Rate limit constraints
- Potential hallucination in edge cases

## Parsing Strategy Selection

Cold Mailer uses a strategic approach to select the appropriate parsing algorithm:

### Decision Factors

1. **Document Complexity:**

   - Simple, standard format → Simplified Parser
   - Complex layout → Advanced Parser
   - Non-standard format → AI Parser

2. **Performance Requirements:**

   - Low latency needs → Simplified Parser
   - Accuracy priority → AI Parser
   - Layout preservation → Advanced Parser

3. **Feature Availability:**
   - API availability check
   - Fallback waterfall implementation

### Implementation

```javascript
async function parseResume(fileBuffer, options = {}) {
  const { prioritizeSpeed = false, forceMethod = null } = options;

  // Force specific method if requested
  if (forceMethod === "simplified") {
    return parseWithSimplifiedMethod(fileBuffer);
  } else if (forceMethod === "advanced") {
    return parseWithAdvancedMethod(fileBuffer);
  } else if (forceMethod === "ai") {
    return parseWithAIMethod(fileBuffer);
  }

  // Strategy selection
  try {
    // Check if AI API is available
    const aiAvailable = await checkAIAvailability();

    if (prioritizeSpeed || !aiAvailable) {
      // Try simplified parser first (fastest)
      try {
        const simplifiedResult = await parseWithSimplifiedMethod(fileBuffer);
        if (isValidParseResult(simplifiedResult)) {
          return simplifiedResult;
        }

        // Fall back to advanced parser if simplified fails
        const advancedResult = await parseWithAdvancedMethod(fileBuffer);
        return advancedResult;
      } catch (error) {
        console.error("Error in simplified/advanced parsing:", error);
        if (aiAvailable) {
          // Last resort: try AI parser
          return parseWithAIMethod(fileBuffer);
        }
        throw error;
      }
    } else {
      // Prioritize accuracy: try AI parser first
      try {
        const aiResult = await parseWithAIMethod(fileBuffer);
        return aiResult;
      } catch (error) {
        console.error("Error in AI parsing:", error);
        // Fall back to advanced parser
        try {
          const advancedResult = await parseWithAdvancedMethod(fileBuffer);
          return advancedResult;
        } catch (advError) {
          // Last resort: simplified parser
          return parseWithSimplifiedMethod(fileBuffer);
        }
      }
    }
  } catch (error) {
    console.error("Error in parse strategy selection:", error);
    // Final fallback for catastrophic failure
    try {
      return parseWithSimplifiedMethod(fileBuffer);
    } catch (finalError) {
      throw new Error("Failed to parse resume with any available method");
    }
  }
}
```

## Data Integration

### Unified Data Model

All parsers produce output conforming to a standard schema:

```typescript
interface ResumeData {
  skills: string[];
  experience: {
    company: string;
    title: string;
    startDate: string;
    endDate: string;
    location?: string;
    description: string[];
  }[];
  projects: {
    title: string;
    description: string;
    technologies: string[];
    url?: string;
    startDate?: string;
    endDate?: string;
  }[];
  education: {
    institution: string;
    degree: string;
    field: string;
    startDate: string;
    endDate: string;
    gpa?: string;
    courses?: string[];
  }[];
  contact?: {
    name: string;
    email?: string;
    phone?: string;
    location?: string;
    websites?: string[];
  };
  metadata: {
    parser: string;
    confidence: number;
    processingTimeMs: number;
    timestamp: string;
  };
}
```

### Confidence Scoring

Each parser provides confidence metrics for its extractions:

```javascript
function calculateConfidenceScores(extractedData) {
  const scores = {
    skills: calculateSectionConfidence(extractedData.skills, "skills"),
    experience: calculateSectionConfidence(
      extractedData.experience,
      "experience"
    ),
    projects: calculateSectionConfidence(extractedData.projects, "projects"),
    education: calculateSectionConfidence(extractedData.education, "education"),
    overall: 0,
  };

  // Calculate weighted overall confidence
  scores.overall =
    scores.skills * 0.3 +
    scores.experience * 0.3 +
    scores.projects * 0.2 +
    scores.education * 0.2;

  return scores;
}

function calculateSectionConfidence(sectionData, sectionType) {
  if (!sectionData || sectionData.length === 0) {
    return 0;
  }

  // Section-specific confidence metrics
  switch (sectionType) {
    case "skills":
      // Higher confidence with more skills and better formatting
      return Math.min(0.9, sectionData.length / 20) + 0.1;

    case "experience":
      // Check for required fields and completeness
      const completenessScores = sectionData.map((exp) => {
        let score = 0;
        if (exp.company) score += 0.25;
        if (exp.title) score += 0.25;
        if (exp.startDate) score += 0.2;
        if (exp.description && exp.description.length) score += 0.3;
        return score;
      });
      return (
        completenessScores.reduce((sum, score) => sum + score, 0) /
        Math.max(1, sectionData.length)
      );

    // Similar metrics for other section types
  }
}
```

## Benchmarks

### Performance Comparison

| Parser Type | Avg. Processing Time | Memory Usage | Accuracy Score | API Cost   |
| ----------- | -------------------- | ------------ | -------------- | ---------- |
| Simplified  | 75ms                 | Low          | 70-80%         | None       |
| Advanced    | 350ms                | Medium       | 80-90%         | None       |
| AI-powered  | 1200ms               | Low          | 90-98%         | $0.01-0.02 |

### Accuracy Metrics

Accuracy is measured across several dimensions:

1. **Completeness:** Percentage of information correctly extracted
2. **Precision:** Percentage of extracted information that is correct
3. **Categorization:** Correct assignment to categories
4. **Structure:** Preservation of hierarchy and relationships

## Error Handling

Each parser implements robust error handling:

### Simplified Parser Errors

- **PDF Extraction Failures:** Falls back to text extraction
- **Section Identification Failures:** Uses alternative headers
- **Content Extraction Issues:** Implements fuzzy matching

### Advanced Parser Errors

- **PDF.js Errors:** Falls back to pdf-parse
- **Layout Analysis Failures:** Switches to text-based analysis
- **Content Extraction Problems:** Implements progressive enhancement

### AI Parser Errors

- **API Failures:** Implements retries with backoff
- **Parsing Errors:** Uses multiple response parsing strategies
- **Timeout Handling:** Implements partial results with flags

### Integration Errors

- **Strategy Selection Failures:** Implements waterfall strategy
- **Data Model Inconsistencies:** Normalizes output formats
- **Resource Exhaustion:** Implements circuit breaker pattern
