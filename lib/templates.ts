/**
 * Content Generation Templates for YouTube-to-Notes
 * 
 * These templates define how video content is processed and transformed
 * using Google's Gemini AI models. Each template includes specialized prompts
 * optimized for different output formats.
 */

export interface Template {
  id: string;
  name: string;
  description: string;
  prompt: string;
  category: string;
  estimatedTokens: number;
  outputFormat: 'markdown' | 'html' | 'json' | 'text';
  isActive: boolean;
}

export const TEMPLATES: Template[] = [
  {
    id: 'basic-summary',
    name: 'Basic Summary',
    description: 'Concise overview with key points and main takeaways',
    category: 'summary',
    estimatedTokens: 500,
    outputFormat: 'markdown',
    isActive: true,
    prompt: `Analyze this YouTube video and create a comprehensive summary with the following structure:

# Video Summary

## Overview
Provide a brief 2-3 sentence overview of the video's main topic and purpose.

## Key Points
- List the 5-7 most important points discussed in the video
- Use clear, concise bullet points
- Focus on actionable insights and main concepts

## Main Takeaways
- 3-5 key takeaways that viewers should remember
- Focus on practical applications or important insights
- Make each takeaway specific and actionable

## Topics Covered
- List the main topics and subtopics discussed
- Organize in logical order as presented in the video

## Conclusion
Summarize the video's main message and its significance in 2-3 sentences.

Keep the language clear and accessible. Focus on the most valuable content that viewers would want to reference later.`
  },

  {
    id: 'study-notes',
    name: 'Study Notes',
    description: 'Structured learning content with questions and key concepts',
    category: 'education',
    estimatedTokens: 800,
    outputFormat: 'markdown',
    isActive: true,
    prompt: `Transform this YouTube video into comprehensive study notes using the following structure:

# Study Notes: [Video Title]

## Learning Objectives
After studying these notes, you will be able to:
- [List 3-5 specific learning objectives based on the content]

## Key Concepts and Definitions
### Concept 1: [Name]
**Definition:** [Clear definition]
**Explanation:** [Detailed explanation with examples]
**Importance:** [Why this concept matters]

[Repeat for all major concepts discussed]

## Main Content Outline
### Section 1: [Title]
- **Key Points:**
  - [Point 1 with explanation]
  - [Point 2 with explanation]
- **Examples/Evidence:** [Any examples, case studies, or evidence provided]
- **Applications:** [How this applies in real situations]

[Repeat for each major section]

## Study Questions
### Review Questions
1. [Question testing understanding of key concept]
2. [Question requiring application of knowledge]
3. [Question connecting multiple concepts]

### Discussion Questions
1. [Open-ended question for deeper thinking]
2. [Question relating content to broader context]

## Quick Reference
- **Important Formulas/Rules:** [If applicable]
- **Key Dates/Numbers:** [If applicable]
- **Essential Terms:** [Glossary of important terms]

## Further Study
- Topics mentioned that deserve deeper exploration
- Related concepts to investigate
- Suggested follow-up materials

Focus on creating material that would be useful for exam preparation or concept mastery.`
  },

  {
    id: 'presentation-slides',
    name: 'Presentation Slides',
    description: 'Key points formatted for presentations with speaker notes',
    category: 'presentation',
    estimatedTokens: 600,
    outputFormat: 'markdown',
    isActive: true,
    prompt: `Convert this YouTube video content into a presentation format with slides and speaker notes:

# Presentation: [Video Title]

## Slide 1: Title Slide
**Title:** [Compelling presentation title based on video content]
**Subtitle:** [Brief description of what will be covered]
**Speaker Notes:** Brief introduction about the topic's relevance and what the audience will learn.

## Slide 2: Agenda/Overview
**Content:**
- [Main point 1]
- [Main point 2]
- [Main point 3]
- [Main point 4]

**Speaker Notes:** Set expectations and explain the flow of the presentation.

## Slide 3-N: Main Content Slides
### Slide 3: [Topic Title]
**Content:**
- [Key point - keep to 3-5 bullet points max]
- [Supporting detail]
- [Important insight]

**Speaker Notes:** [Detailed explanation, examples, stories, or additional context that you would speak about but not put on the slide]

[Repeat format for each major topic, creating 6-10 slides total]

## Final Slide: Key Takeaways
**Content:**
- [Most important takeaway #1]
- [Most important takeaway #2]
- [Most important takeaway #3]

**Speaker Notes:** Reinforce the main message and suggest next steps for the audience.

## Presentation Tips
- **Timing:** Estimate 2-3 minutes per slide
- **Visuals:** [Suggest where charts, images, or graphics would enhance the content]
- **Interaction:** [Suggest points where audience questions or discussion would be valuable]

Keep slide content minimal and impactful. Put detailed information in speaker notes.`
  },

  {
    id: 'tutorial-guide',
    name: 'Tutorial Guide',
    description: 'Step-by-step instructions for practical implementation',
    category: 'tutorial',
    estimatedTokens: 900,
    outputFormat: 'markdown',
    isActive: true,
    prompt: `Create a comprehensive tutorial guide based on this YouTube video:

# Tutorial Guide: [Video Title]

## What You'll Learn
- [Specific skill or knowledge outcome]
- [Tools or techniques covered]
- [Prerequisites or assumptions]

## Prerequisites
- **Required Knowledge:** [What someone needs to know beforehand]
- **Tools/Software Needed:** [List of required tools, software, or materials]
- **Estimated Time:** [How long this tutorial should take to complete]

## Step-by-Step Instructions

### Step 1: [Action Title]
**Objective:** [What this step accomplishes]

**Instructions:**
1. [Detailed instruction 1]
2. [Detailed instruction 2]
3. [Detailed instruction 3]

**Tips:**
- [Helpful tip or common mistake to avoid]
- [Alternative approach if applicable]

**Expected Result:** [What should happen when this step is completed correctly]

[Repeat for each major step - aim for 5-10 main steps]

## Troubleshooting
### Common Issues
**Problem:** [Common problem users might encounter]
**Solution:** [How to fix it]
**Prevention:** [How to avoid it next time]

[Repeat for other common issues]

## Advanced Tips
- [Pro tip for more experienced users]
- [Optimization or efficiency improvement]
- [Related techniques or extensions]

## Practice Exercises
1. [Basic practice exercise to reinforce learning]
2. [Intermediate exercise for deeper understanding]
3. [Advanced challenge for mastery]

## Resources and Next Steps
- **Additional Resources:** [Links, books, or materials for further learning]
- **Next Level:** [What to learn next to build on this knowledge]
- **Community:** [Where to find help or discuss this topic]

## Summary Checklist
- [ ] [Key milestone 1]
- [ ] [Key milestone 2]
- [ ] [Key milestone 3]
- [ ] [Final outcome achieved]

Focus on making instructions clear, actionable, and beginner-friendly while including advanced options.`
  },

  {
    id: 'research-paper',
    name: 'Research Paper Format',
    description: 'Academic-style documentation with citations and analysis',
    category: 'academic',
    estimatedTokens: 1000,
    outputFormat: 'markdown',
    isActive: true,
    prompt: `Transform this YouTube video into an academic research paper format:

# [Academic Title Based on Video Content]

## Abstract
**Objective:** [Research question or purpose of the study/presentation]
**Methods:** [Approach or methodology discussed in the video]
**Key Findings:** [Main discoveries, insights, or conclusions]
**Implications:** [Significance and practical applications]
**Keywords:** [5-7 relevant academic keywords]

## 1. Introduction
### 1.1 Background and Context
[Provide academic context for the topic, including relevant background information]

### 1.2 Research Question/Objective
[Clearly state what the video addresses or attempts to answer]

### 1.3 Scope and Significance
[Explain the importance and relevance of this topic]

## 2. Literature Review and Theoretical Framework
### 2.1 Existing Knowledge
[Summarize what is already known about this topic based on video content]

### 2.2 Theoretical Foundations
[Identify and explain key theories, models, or frameworks mentioned]

### 2.3 Knowledge Gaps
[Identify what this video addresses that wasn't previously covered]

## 3. Methodology/Approach
[Describe the approach, methodology, or framework used in the video]

## 4. Findings and Analysis
### 4.1 Key Findings
[Present main discoveries or insights in academic language]

### 4.2 Analysis and Interpretation
[Analyze the significance of these findings]

### 4.3 Evidence and Support
[Detail any data, examples, or evidence presented]

## 5. Discussion
### 5.1 Implications for Theory
[How do these findings contribute to theoretical understanding?]

### 5.2 Practical Applications
[What are the real-world applications?]

### 5.3 Limitations
[Acknowledge any limitations or constraints]

## 6. Conclusion
### 6.1 Summary of Key Points
[Concise summary of main arguments and findings]

### 6.2 Contributions to Knowledge
[What new understanding does this provide?]

### 6.3 Future Research Directions
[Suggest areas for further investigation]

## References and Further Reading
[List of related academic sources, papers, or materials mentioned or relevant to the topic]

Use formal academic language and structure throughout. Focus on critical analysis and scholarly presentation.`
  }
];

// Helper functions for template management
export function getTemplateById(id: string): Template | undefined {
  return TEMPLATES.find(template => template.id === id && template.isActive);
}

export function getTemplatesByCategory(category: string): Template[] {
  return TEMPLATES.filter(template => template.category === category && template.isActive);
}

export function getActiveTemplates(): Template[] {
  return TEMPLATES.filter(template => template.isActive);
}

export function getAllTemplates(): Template[] {
  return TEMPLATES;
}

// Estimate token usage for a template
export function estimateTokenUsage(templateId: string, contentLength: number): number {
  const template = getTemplateById(templateId);
  if (!template) return 0;
  
  // Base template tokens + estimated content processing tokens
  const baseTokens = template.estimatedTokens;
  const contentTokens = Math.ceil(contentLength / 4); // Rough estimate: 4 characters per token
  
  return baseTokens + contentTokens;
}

// Template validation
export function validateTemplate(template: Partial<Template>): string[] {
  const errors: string[] = [];
  
  if (!template.id) errors.push('Template ID is required');
  if (!template.name) errors.push('Template name is required');
  if (!template.prompt) errors.push('Template prompt is required');
  if (!template.category) errors.push('Template category is required');
  
  if (template.estimatedTokens && template.estimatedTokens < 0) {
    errors.push('Estimated tokens must be positive');
  }
  
  return errors;
}

export default TEMPLATES;

// Re-export domain detection utilities so imports from '@/lib/templates' work
export {
  detectTutorialDomain,
} from './templates/index';

export type {
  TutorialDomain,
  VideoMetadata,
  VerbosityLevel,
} from './templates/index';
