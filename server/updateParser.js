/**
 * This script enhances the functionality of the simplifiedResumeParser.js file
 * by adding forced extraction capability and improving section detection.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function updateSimplifiedResumeParser() {
  try {
    const parserPath = path.join(__dirname, 'services', 'simplifiedResumeParser.js');
    
    console.log(`Reading simplified resume parser from: ${parserPath}`);
    
    // Read the parser file
    const parserContent = await fs.readFile(parserPath, 'utf8');
    
    // Update the file with forced extraction capability
    const updatedContent = parserContent
      // Update the function signature to accept options
      .replace(
        /export async function parseResumeText\(pdfBuffer\)/,
        'export async function parseResumeText(pdfBuffer, options = {})'
      )
      // Add forcedExtraction option
      .replace(
        /console\.log\("Starting simplified resume parsing"\);(\r?\n)\s+let rawText = "";/,
        'console.log("Starting simplified resume parsing");\n    let rawText = "";\n    const forcedExtraction = options.forcedExtraction || false;'
      )
      // Update the extraction method to use forcedExtraction
      .replace(
        /if \(Object\.keys\(sectionContent\)\.length === 0\) \{/,
        'if (Object.keys(sectionContent).length === 0 || forcedExtraction) {'
      )
      // Add fallback for when no sections are found even with looser matching
      .replace(
        /return sectionContent;\s+\}/,
        `return sectionContent;
  }
  
  // If we still have no sections and forced extraction is enabled, create dummy sections
  if (Object.keys(sectionContent).length === 0 && forcedExtraction) {
    console.log("Creating dummy sections for forced extraction");
    
    // Create dummy sections by analyzing the text
    const textLower = text.toLowerCase();
    
    // Look for skill-related keywords
    if (textLower.includes('skill') || 
        textLower.includes('technolog') || 
        textLower.includes('proficien') || 
        textLower.includes('language') ||
        textLower.includes('tools') ||
        textLower.includes('framework')) {
      sectionContent["SKILLS"] = text.split('\\n').filter(line => line.trim().length > 0);
    }
    
    // Look for experience-related keywords
    if (textLower.includes('experience') || 
        textLower.includes('work') || 
        textLower.includes('employ') || 
        textLower.includes('career') ||
        textLower.includes('job') ||
        textLower.includes('company')) {
      sectionContent["EXPERIENCE"] = text.split('\\n').filter(line => line.trim().length > 0);
    }
    
    // Look for project-related keywords
    if (textLower.includes('project') || 
        textLower.includes('develop') || 
        textLower.includes('built') || 
        textLower.includes('implement') ||
        textLower.includes('creat') ||
        textLower.includes('application')) {
      sectionContent["PROJECTS"] = text.split('\\n').filter(line => line.trim().length > 0);
    }
    
    // If still no sections, treat the entire text as all sections
    if (Object.keys(sectionContent).length === 0) {
      console.log("Using entire text as all sections");
      const lines = text.split('\\n').filter(line => line.trim().length > 0);
      sectionContent["SKILLS"] = lines;
      sectionContent["EXPERIENCE"] = lines;
      sectionContent["PROJECTS"] = lines;
    }
  }
  
  return sectionContent;
}`
      )
      // Enhance skills extraction
      .replace(
        /const skillsSection = sections\["SKILLS"\] \|\| \[\];/,
        'const skillsSection = sections["SKILLS"] || [];\n  \n  // In forced extraction mode, look beyond skill sections\n  const forceExtraction = options && options.forcedExtraction;\n  if (forceExtraction && skillsSection.length === 0) {\n    // Common skill keywords to look for anywhere in the text\n    const skillKeywords = [\n      "python", "javascript", "java", "c++", "c#", "react", "angular", "vue", "html", "css", \n      "node", "express", "django", "flask", "spring", "laravel", "rails", ".net", "rust", "go",\n      "typescript", "php", "swift", "kotlin", "scala", "ruby", "perl", "r", "matlab", "sql",\n      "mongodb", "postgresql", "mysql", "redis", "aws", "azure", "gcp", "docker", "kubernetes",\n      "git", "github", "gitlab", "bitbucket", "jenkins", "terraform", "ansible", "ci/cd",\n      "agile", "scrum", "jira", "confluence", "visual studio", "intellij", "eclipse", "android",\n      "ios", "mobile", "responsive", "api", "rest", "graphql", "oauth", "jwt", "ai", "ml",\n      "machine learning", "data science", "tensorflow", "pytorch", "pandas", "numpy", "jupyter",\n      "tableau", "power bi", "analytics", "big data", "hadoop", "spark", "kafka", "redux",\n      "mobx", "sass", "less", "webpack", "babel", "vite", "svelte", "tailwind", "bootstrap"\n    ];\n    \n    // Get content from all available sections\n    let allContent = [];\n    Object.values(sections).forEach(sectionContent => {\n      allContent.push(...sectionContent);\n    });\n    \n    return extractSkillsFromText(allContent.join("\\n"), skillKeywords);\n  }'
      )
      // Add function to extract skills from any text
      .replace(
        /export default \{/,
        `/**
 * Extract skills from any text using keyword matching
 * @param {string} text - Any text that might contain skills
 * @param {Array} keywords - List of skill keywords to look for
 * @returns {Array} - Array of identified skills
 */
function extractSkillsFromText(text, keywords) {
  const skills = new Set();
  const textLower = text.toLowerCase();
  
  // Look for each keyword in the text
  keywords.forEach(keyword => {
    try {
      // Escape special characters for regex
      const escapedKeyword = keyword.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&');
      const regex = new RegExp('\\\\b' + escapedKeyword + '\\\\b', 'i');
      
      if (regex.test(textLower)) {
        // Found the skill, add it with proper capitalization
        if (keyword === keyword.toLowerCase()) {
          // For normal words, capitalize first letter
          skills.add(keyword.charAt(0).toUpperCase() + keyword.slice(1));
        } else {
          // For mixed case (like TypeScript), keep as is
          skills.add(keyword);
        }
      }
    } catch (e) {
      // Fallback for regex errors
      if (textLower.includes(keyword.toLowerCase())) {
        skills.add(keyword.charAt(0).toUpperCase() + keyword.slice(1));
      }
    }
  });
  
  // Also look for phrases like "Experience with X" or "Knowledge of Y"
  const skillPhrases = [
    /experience (?:with|in|using) ([\\w\\s,]+)/gi,
    /knowledge of ([\\w\\s,]+)/gi,
    /proficient (?:with|in) ([\\w\\s,]+)/gi,
    /skilled (?:with|in) ([\\w\\s,]+)/gi,
    /expertise (?:with|in) ([\\w\\s,]+)/gi
  ];
  
  skillPhrases.forEach(phrase => {
    let match;
    while ((match = phrase.exec(text)) !== null) {
      if (match[1]) {
        // Split by common delimiters and clean up
        const phraseSkills = match[1]
          .split(/[,;&]/)
          .map(s => s.trim())
          .filter(s => s.length > 2 && s.length < 30);
        
        phraseSkills.forEach(skill => skills.add(skill));
      }
    }
  });
  
  return [...skills];
}

export default {`
      );
    
    // Write the updated file
    await fs.writeFile(parserPath, updatedContent);
    
    console.log('Successfully updated simplifiedResumeParser.js with forced extraction capability');
    
  } catch (error) {
    console.error('Error updating simplified resume parser:', error);
  }
}

// Run the update function
updateSimplifiedResumeParser();
