import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { TEMPLATES } from '@/lib/templates';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

function getModel(useAlternative: boolean = false) {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);
  return genAI.getGenerativeModel({ 
    model: useAlternative ? 'gemini-2.0-flash-exp' : 'gemini-2.0-flash-latest',
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 4000,
    }
  });
}

function generateVerbosityAdjustmentPrompt(template: any, currentContent: string, newVerbosity: string) {
  const verbosityInstructions = {
    brief: 'Condense the content to 50-75 words per concept. Remove examples, detailed explanations, and keep only essential information. MUST maintain ALL template sections and structure.',
    standard: 'Balance the content to 100-150 words per concept. Include some examples and key details, but remove excessive elaboration. MUST maintain ALL template sections and structure.',
    comprehensive: 'Expand the content to 200-300 words per concept. Add examples, contextual background, detailed explanations, and supporting information. MUST maintain ALL template sections and structure.'
  };

  // Detect current content format to handle format conversion
  const detectCurrentFormat = (content: string) => {
    if (content.includes('📖 Video Overview') && content.includes('📝 Detailed Notes')) {
      return 'study-notes';
    }
    if (content.includes('**Video Summary**') && content.includes('**Main Topic**')) {
      return 'basic-summary';
    }
    if (content.includes('# Presentation Slides:') && content.includes('## Slide')) {
      return 'presentation-slides';
    }
    return 'unknown';
  };

  // Get template-specific structure requirements
  const getTemplateStructure = (templateId: string) => {
    switch (templateId) {
      case 'basic-summary':
        return `
REQUIRED STRUCTURE FOR BASIC SUMMARY:
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

**Conclusion**: [Main takeaway or final message]`;

      case 'study-notes':
        return `
REQUIRED STRUCTURE FOR STUDY NOTES:
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
How can this knowledge be applied in real-world scenarios?`;

      case 'presentation-slides':
        return `
REQUIRED STRUCTURE FOR PRESENTATION SLIDES:
# Presentation Slides: [Topic]
## Slide 1: Title Slide
## Slide 2: The Problem We're Solving
[Continue with 8 slides total]
**Speaker Notes:** [For each slide]`;

      default:
        return `Maintain the exact structure and format of the original template: ${template.name}`;
    }
  };

  const currentFormat = detectCurrentFormat(currentContent);
  const targetFormat = template.id;
  const needsFormatConversion = currentFormat !== targetFormat && currentFormat !== 'unknown';

  // Build prompt based on whether format conversion is needed
  const conversionInstruction = needsFormatConversion 
    ? `IMPORTANT: The current content is in "${currentFormat}" format, but you need to convert it to "${targetFormat}" format AND adjust verbosity.`
    : `IMPORTANT: The content is already in the correct format. Only adjust the verbosity level.`;

  return `You are ${needsFormatConversion ? 'converting content format AND adjusting verbosity' : 'adjusting the verbosity level'} for video notes.

CURRENT CONTENT (Format: ${currentFormat}):
${currentContent}

TARGET: ${template.name} format with ${newVerbosity.toUpperCase()} verbosity level
${verbosityInstructions[newVerbosity as keyof typeof verbosityInstructions]}

${conversionInstruction}

TARGET TEMPLATE STRUCTURE:
${getTemplateStructure(template.id)}

CRITICAL REQUIREMENTS:
- MUST follow the EXACT structure shown above for ${template.name}
- MUST preserve all section headers exactly as specified (including emoji icons if applicable)
- MUST include ALL sections from the target template structure
- MUST maintain the same formatting (headings, bullet points, etc.)
- Extract and reorganize information from current content to fit target structure
- Adjust content length/detail according to verbosity level
- Keep the same professional, non-conversational tone
- NO introductory text or meta-commentary
- Start with the exact first line shown in the target structure
- For Study Notes: MUST include all emoji headers (📖 🎯 📝 ❓ 🔍 📋 🎯)
- Even with brief verbosity, include ALL required sections with appropriate content

${needsFormatConversion ? 
`CONVERSION PROCESS:
1. Extract all relevant information from the current content
2. Reorganize it according to the target template structure
3. Adjust the detail level according to the verbosity setting
4. Ensure all required sections are populated with relevant content` :
`ADJUSTMENT PROCESS:
1. Keep the existing structure intact
2. Adjust only the content length/detail within each section
3. Maintain all headers and formatting exactly`}

Return ONLY the converted and adjusted content following the target template structure exactly.`;
}

export async function POST(request: NextRequest) {
  try {
    const { videoUrl, selectedTemplate, currentContent, newVerbosity } = await request.json();

    if (!videoUrl || !selectedTemplate || !currentContent || !newVerbosity) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const template = TEMPLATES.find(t => t.id === selectedTemplate);
    if (!template) {
      return NextResponse.json({ error: 'Invalid template selected' }, { status: 400 });
    }

    if (!['brief', 'standard', 'comprehensive'].includes(newVerbosity)) {
      return NextResponse.json({ error: 'Invalid verbosity level' }, { status: 400 });
    }

    console.log('Adjusting verbosity to:', newVerbosity);
    console.log('Template ID:', template.id);
    console.log('Current content format detection...');
    
    // Quick format detection for debugging
    const hasStudyNotesFormat = currentContent.includes('📖 Video Overview') && currentContent.includes('📝 Detailed Notes');
    const hasBasicSummaryFormat = currentContent.includes('**Video Summary**') && currentContent.includes('**Main Topic**');
    console.log('Content analysis:');
    console.log('- Has Study Notes format:', hasStudyNotesFormat);
    console.log('- Has Basic Summary format:', hasBasicSummaryFormat);
    console.log('- Content length:', currentContent.length);

    // Generate adjusted content
    let model = getModel(false);
    let response;
    
    try {
      const adjustmentPrompt = generateVerbosityAdjustmentPrompt(template, currentContent, newVerbosity);
      response = await model.generateContent([adjustmentPrompt]);
    } catch (error: any) {
      if (error.status === 429) {
        console.log('Primary model quota exceeded, trying alternative model...');
        model = getModel(true);
        const adjustmentPrompt = generateVerbosityAdjustmentPrompt(template, currentContent, newVerbosity);
        response = await model.generateContent([adjustmentPrompt]);
      } else {
        throw error;
      }
    }

    const adjustedContent = await response.response.text();

    // Validate the result
    if (!adjustedContent || adjustedContent.trim().length === 0) {
      throw new Error('Generated content is empty');
    }

    return NextResponse.json({
      content: adjustedContent,
      verbosityLevel: newVerbosity,
      template: selectedTemplate
    });

  } catch (error: any) {
    console.error('Verbosity adjustment error:', error);
    
    if (error.message.includes('quota') || error.message.includes('429')) {
      return NextResponse.json({ 
        error: 'API quota exceeded. Please try again later.',
        details: error.message 
      }, { status: 429 });
    }
    
    return NextResponse.json({ 
      error: 'Failed to adjust verbosity level',
      details: error.message 
    }, { status: 500 });
  }
}
