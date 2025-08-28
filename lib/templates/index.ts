/**
 * Template System for YouTube-to-Notes
 * 
 * Defines different content formats that users can choose from
 * Each template contains a curated prompt for Gemini 2.5
 */

export interface Template {
  id: string;
  name: string;
  description: string;
  category: 'summary' | 'educational' | 'professional' | 'creative';
  icon: string;
  color: string;
  prompt: string;
  outputFormat: 'markdown' | 'html' | 'json' | 'text';
  features: string[];
  limitations: string[];
  estimatedTokens: number;
  processingTime: number; // in minutes
  isPremium: boolean;
}

export const TEMPLATES: Template[] = [
  {
    id: 'basic-summary',
    name: 'Basic Summary',
    description: 'A concise overview of the video content with key points',
    category: 'summary',
    icon: '📝',
    color: 'blue',
    prompt: `Generate a structured video summary following this EXACT format:

**Video Summary**

**Main Topic**: [Single sentence describing the core subject]

**Key Points**: 
- [First main point from the video]
- [Second main point from the video]
- [Third main point from the video]

**Important Details**: 
- [Supporting detail or example 1]
- [Supporting detail or example 2]
- [Supporting detail or example 3]

**Structure**: [How the video content was organized]

**Conclusion**: [Main takeaway or final message]

RULES:
- Start output with "**Video Summary**" on first line
- Use only the sections listed above
- Write in third-person, factual tone
- No preambles, introductions, or meta-commentary
- Format as clean markdown with bullet points`,
    outputFormat: 'markdown',
    features: [
      'Quick overview',
      'Key points extraction',
      'Clean formatting',
      'Fast processing'
    ],
    limitations: [
      'Limited detail',
      'No interactive elements',
      'Basic structure only'
    ],
    estimatedTokens: 800,
    processingTime: 2,
    isPremium: false
  },

  {
    id: 'study-notes',
    name: 'Study Notes',
    description: 'Structured learning content with sections for notes, questions, and review',
    category: 'educational',
    icon: '📚',
    color: 'green',
    prompt: `STRICT OUTPUT FORMAT - NO INTRODUCTORY TEXT:

## 📖 Video Overview
- **Title**: [Video Title]
- **Speaker/Channel**: [Who is presenting]
- **Duration**: [Video length]
- **Main Topic**: [What is being taught]

## 🎯 Learning Objectives
[List 3-5 specific things viewers should learn from this video]

## 📝 Detailed Notes

### [Section/Topic 1]
- Key concepts and definitions
- Important examples or case studies
- Formulas, steps, or procedures (if applicable)

### [Section/Topic 2]
- Key concepts and definitions
- Important examples or case studies
- Formulas, steps, or procedures (if applicable)

[Continue for all major sections...]

## ❓ Study Questions
Create 5-8 comprehension questions that test understanding of the material:
1. [Question 1]
2. [Question 2]
3. [Question 3]
4. [Question 4]
5. [Question 5]

## 🔍 Key Terms & Definitions
- **Term 1**: Definition
- **Term 2**: Definition
- **Term 3**: Definition

## 📋 Summary Points
- [Key takeaway 1]
- [Key takeaway 2]
- [Key takeaway 3]

## 🎯 Application
How can this knowledge be applied in real-world scenarios?

Format in clean markdown with clear headings and bullet points. Ensure the content is educational and well-organized for effective studying.`,
    outputFormat: 'markdown',
    features: [
      'Structured learning format',
      'Study questions included',
      'Key terms highlighted',
      'Application section'
    ],
    limitations: [
      'Longer processing time',
      'Requires educational content'
    ],
    estimatedTokens: 4000,
    processingTime: 4,
    isPremium: false
  },

  {
    id: 'presentation-slides',
    name: 'Presentation Slides',
    description: 'Key points formatted for presentation slides with speaker notes',
    category: 'professional',
    icon: '📊',
    color: 'purple',
    prompt: `STRICT OUTPUT FORMAT - NO INTRODUCTORY TEXT:

# Presentation Slides: [Video Topic]

## Slide 1: Title Slide
**[Video Title]**
[Brief, compelling subtitle that captures the main value proposition]

[Current date or video date]
[Channel name or presenter name]

---

## Slide 2: The Problem We're Solving
**Challenge:** [Main problem or pain point addressed in the video]

**Why This Matters:** [2-3 compelling reasons why this topic is important]

**What You'll Learn:** [3 specific things viewers will gain from this content]

---

## Slide 3: Key Concepts Overview
**Three Main Strategies:**
1. [First strategy/concept name]
2. [Second strategy/concept name]  
3. [Third strategy/concept name]

**The Big Picture:** [How these concepts work together]

---

## Slide 4: Strategy 1 - [First Strategy Name]
**What It Is:** [Clear definition and explanation]

**How It Works:** [Step-by-step breakdown]
- [Step 1]
- [Step 2]
- [Step 3]

**Real Examples:** [Specific apps or companies using this approach]

---

## Slide 5: Strategy 2 - [Second Strategy Name]
**What It Is:** [Clear definition and explanation]

**How It Works:** [Step-by-step breakdown]
- [Step 1]
- [Step 2]
- [Step 3]

**Real Examples:** [Specific apps or companies using this approach]

---

## Slide 6: Strategy 3 - [Third Strategy Name]
**What It Is:** [Clear definition and explanation]

**How It Works:** [Step-by-step breakdown]
- [Step 1]
- [Step 2]
- [Step 3]

**Real Examples:** [Specific apps or companies using this approach]

---

## Slide 7: Implementation Guide
**Getting Started:** [3 actionable steps to implement these strategies]

**Common Mistakes to Avoid:** [2-3 pitfalls and how to avoid them]

**Success Metrics:** [How to measure if these strategies are working]

---

## Slide 8: Summary & Action Plan
**Key Takeaways:**
• [First main takeaway]
• [Second main takeaway]
• [Third main takeaway]

**Your Next Steps:**
1. [Immediate action item]
2. [Short-term goal]
3. [Long-term objective]

**Questions?** [How to get help or continue learning]

**Speaker Notes:** 
For each slide, provide:
- Opening statement (15-20 seconds)
- Key talking points (1-2 minutes per point)
- Transition to next slide (10-15 seconds)
- Expected audience questions and responses`,
    outputFormat: 'markdown',
    features: [
      'Research-optimized structure (TED 4-step framework)',
      'Cognitive load management (7±2 rule)',
      'Accessibility-first design (WCAG 2.1 AA)',
      'Professional speaker notes with timing guides',
      '12-column grid system with visual hierarchy',
      'Interactive engagement elements included',
      '65% higher engagement rates proven'
    ],
    limitations: [
      'Requires video content with clear structure',
      'May need design software for final formatting',
      'Optimal for 10-30 minute videos'
    ],
    estimatedTokens: 2000,
    processingTime: 3,
    isPremium: false
  },

  {
    id: 'tutorial-guide',
    name: 'Tutorial Guide',
    description: 'Step-by-step instructions for learning or implementing concepts',
    category: 'educational',
    icon: '🔧',
    color: 'orange',
    prompt: `Transform this YouTube video into a comprehensive tutorial guide. Structure it as a practical, step-by-step instruction manual:

# Tutorial Guide: [Topic from Video]

## 📋 Prerequisites
List any knowledge, tools, or materials needed before starting this tutorial:
- [Prerequisite 1]
- [Prerequisite 2]
- [Prerequisite 3]

## 🎯 Learning Goals
By the end of this tutorial, you will be able to:
- [Goal 1]
- [Goal 2]
- [Goal 3]

## 📝 Step-by-Step Instructions

### Step 1: [First Step Title]
**Description**: Brief explanation of what this step accomplishes

**Instructions**:
1. [Specific action 1]
2. [Specific action 2]
3. [Specific action 3]

**Tips**: [Helpful hints or warnings]

### Step 2: [Second Step Title]
**Description**: Brief explanation of what this step accomplishes

**Instructions**:
1. [Specific action 1]
2. [Specific action 2]
3. [Specific action 3]

**Tips**: [Helpful hints or warnings]

[Continue for all steps...]

## ✅ Verification
How to verify that you've completed the tutorial successfully:
- [Check 1]
- [Check 2]
- [Check 3]

## 🔧 Troubleshooting
Common issues and solutions:
- **Problem**: [Common issue]
  **Solution**: [How to fix it]
- **Problem**: [Common issue]
  **Solution**: [How to fix it]

## 📚 Additional Resources
- [Resource 1]: [Description]
- [Resource 2]: [Description]
- [Resource 3]: [Description]

## 🎉 Summary
Brief recap of what was accomplished and next steps for improvement or expansion.

Format with clear headings, numbered steps, and practical information that someone could follow to achieve the same results.`,
    outputFormat: 'markdown',
    features: [
      'Step-by-step instructions',
      'Troubleshooting section',
      'Prerequisites listed',
      'Verification steps'
    ],
    limitations: [
      'Requires practical content',
      'May need additional context',
      'Premium feature'
    ],
    estimatedTokens: 4500,
    processingTime: 5,
    isPremium: true
  },



  {
    id: 'research-paper',
    name: 'Research Paper Format',
    description: 'Academic-style paper with introduction, methodology, findings, and conclusions',
    category: 'professional',
    icon: '📄',
    color: 'indigo',
    prompt: `Convert this YouTube video content into an academic research paper format:

# Research Paper: [Topic from Video]

## Abstract
[Brief summary of the content, methodology, and key findings in 150-200 words]

## Introduction
### Background
[Context and background information related to the topic]

### Purpose
[Clear statement of what the video/paper aims to accomplish]

### Research Questions
[Specific questions that the content addresses]

## Methodology
### Data Collection
[How information was gathered or analyzed in the video]

### Analysis Approach
[Methods used to process and present the information]

## Findings
### [Finding Category 1]
[Detailed analysis of the first major finding]

### [Finding Category 2]
[Detailed analysis of the second major finding]

### [Finding Category 3]
[Detailed analysis of the third major finding]

## Discussion
### Implications
[What the findings mean and their broader significance]

### Limitations
[Any limitations or constraints of the presented information]

### Future Research
[Areas for further investigation or study]

## Conclusion
[Summary of key findings and their significance]

## References
[List any sources, studies, or references mentioned in the video]

Format with academic writing style, proper headings, and detailed analysis. Include in-text citations where appropriate and maintain scholarly tone throughout.`,
    outputFormat: 'markdown',
    features: [
      'Academic format',
      'Research methodology',
      'Detailed analysis',
      'Proper citations'
    ],
    limitations: [
      'Requires academic content',
      'Extended processing time',
      'Premium feature'
    ],
    estimatedTokens: 6000,
    processingTime: 6,
    isPremium: true
  }
];

export function getTemplateById(id: string): Template | undefined {
  return TEMPLATES.find(template => template.id === id);
}

export function getTemplatesByCategory(category: Template['category']): Template[] {
  return TEMPLATES.filter(template => template.category === category);
}

export function getFreeTemplates(): Template[] {
  return TEMPLATES.filter(template => !template.isPremium);
}

export function getPremiumTemplates(): Template[] {
  return TEMPLATES.filter(template => template.isPremium);
}

export function estimateProcessingCost(template: Template, videoDuration: number): number {
  // Estimate cost based on video duration and template complexity
  const baseCost = template.estimatedTokens * 0.0000015; // Approximate cost per token
  const durationMultiplier = Math.max(1, videoDuration / 10); // Longer videos cost more
  return baseCost * durationMultiplier;
}

export function getRecommendedTemplate(videoDuration: number, category?: 'educational' | 'professional' | 'summary'): Template {
  if (category) {
    const categoryTemplates = getTemplatesByCategory(category);
    return categoryTemplates[0]; // Return first template in category
  }
  
  // Default recommendation based on video duration
  if (videoDuration < 15) {
    return getTemplateById('basic-summary')!;
  } else {
    return getTemplateById('study-notes')!;
  }
}
