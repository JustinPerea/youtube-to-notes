import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { TEMPLATES } from '@/lib/templates';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

function getModel(useAlternative: boolean = false) {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);
  return genAI.getGenerativeModel({ 
    model: useAlternative ? 'gemini-1.5-flash' : 'gemini-2.0-flash-exp',
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 4000,
    }
  });
}

function generateVerbosityAdjustmentPrompt(template: any, currentContent: string, newVerbosity: string) {
  const verbosityInstructions = {
    brief: 'Condense the content to 50-75 words per concept. Remove examples, detailed explanations, and keep only essential information. Use bullet points and concise language.',
    standard: 'Balance the content to 100-150 words per concept. Include some examples and key details, but remove excessive elaboration.',
    comprehensive: 'Expand the content to 200-300 words per concept. Add examples, contextual background, detailed explanations, and supporting information.'
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
## 🎯 Learning Objectives
## 📝 Detailed Notes
### [Section/Topic 1]
### [Section/Topic 2]
## ❓ Study Questions
## 🔍 Key Terms & Definitions
## 📋 Summary Points
## 🎯 Application`;

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

  return `You are adjusting the verbosity level of existing notes while STRICTLY maintaining the template structure.

CURRENT CONTENT:
${currentContent}

TARGET VERBOSITY: ${newVerbosity.toUpperCase()}
${verbosityInstructions[newVerbosity as keyof typeof verbosityInstructions]}

TEMPLATE: ${template.name} (ID: ${template.id})

${getTemplateStructure(template.id)}

CRITICAL REQUIREMENTS:
- MUST follow the exact structure shown above for ${template.name}
- MUST preserve all section headers exactly as specified
- MUST maintain the same formatting (headings, bullet points, etc.)
- Adjust ONLY the content length/detail within each section
- Keep the same professional, non-conversational tone
- NO introductory text or meta-commentary
- Start with the exact first line shown in the structure

Return ONLY the adjusted content following the template structure exactly.`;
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
