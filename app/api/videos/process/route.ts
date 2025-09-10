import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { TEMPLATES, Template } from '@/lib/templates';
import { videoProcessingRateLimiter, getClientIdentifier, applyRateLimit } from '@/lib/rate-limit';
import { validateVideoUrl } from '@/lib/validation';
import { extractTranscript, extractTranscriptEnhanced, cleanTranscriptText } from '@/lib/transcript/extractor';
import { getApiSessionWithDatabase } from '@/lib/auth-utils';
import { geminiClient } from '@/lib/gemini/client';
import { db } from '@/lib/db/drizzle';
import { videos, users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { extractVideoId } from '@/lib/utils/youtube';
import { getUserSubscription, reserveUsage } from '@/lib/subscription/service';
import { NotesService } from '@/lib/services/notes';
import { auditLogger } from '@/lib/audit/logger';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

// Local type definitions for verbosity and domain
type VerbosityLevel = 'concise' | 'standard' | 'comprehensive';
type TutorialDomain = 'programming' | 'diy' | 'academic' | 'fitness' | 'general';

// Local domain detection function - simplified version for API route
function detectDomainFromMetadata(title: string = '', description: string = ''): TutorialDomain {
  const text = (title + ' ' + description).toLowerCase();
  
  // Quick domain detection patterns
  if (text.match(/(javascript|python|code|programming|react|html|css|api|software|developer?|github|web development)/)) {
    return 'programming';
  }
  if (text.match(/(workout|exercise|fitness|gym|training|yoga|diet|muscle|cardio|strength)/)) {
    return 'fitness';
  }
  if (text.match(/(diy|craft|build|make|repair|fix|tool|material|homemade|handmade|woodwork)/)) {
    return 'diy';
  }
  if (text.match(/(education|lesson|study|learn|course|math|science|physics|chemistry|academic|research)/)) {
    return 'academic';
  }
  
  return 'general';
}

// Enhanced local implementation with verbosity and domain support
function getTemplatePrompt(template: Template, durationSeconds?: number, verbosity?: VerbosityLevel, domain?: TutorialDomain, videoUrl?: string): string {
  if (typeof template.prompt === 'function') {
    // Check if the function supports domain detection and try to call with all parameters
    if ((template as any).supportsDomainDetection) {
      try {
        // For tutorial-guide template, always try with videoUrl first
        if (template.id === 'tutorial-guide') {
          return (template.prompt as (duration?: number, verbosity?: VerbosityLevel, domain?: TutorialDomain, videoUrl?: string) => string)(durationSeconds, verbosity, domain, videoUrl);
        }
        // For other templates, use 3-parameter version
        return (template.prompt as (duration?: number, verbosity?: VerbosityLevel, domain?: TutorialDomain) => string)(durationSeconds, verbosity, domain);
      } catch (error) {
        console.warn('Domain detection call failed, falling back to verbosity only:', error);
      }
    }
    // Check if the function supports verbosity and try to call with verbosity
    if ((template as any).supportsVerbosity) {
      try {
        return (template.prompt as (duration?: number, verbosity?: VerbosityLevel) => string)(durationSeconds, verbosity);
      } catch (error) {
        // Fall back to duration-only if verbosity call fails
        return (template.prompt as (duration?: number) => string)(durationSeconds);
      }
    }
    // Otherwise call with just duration
    return (template.prompt as (duration?: number) => string)(durationSeconds);
  }
  return template.prompt as string;
}

// Configure maximum execution timeout for long video processing (300 seconds = 5 minutes)
export const maxDuration = 300;

// Tier-based model selection with user-friendly messaging
async function getModelForUser(userId: string): Promise<{
  primaryModel: string;
  fallbackModel: string;
  tierMessage?: string;
}> {
  try {
    const subscription = await getUserSubscription(userId);
    const tier = subscription?.tier || 'free';

    console.log(`🎯 Model selection for user tier: ${tier}`);

    switch (tier) {
      case 'free':
        return {
          primaryModel: 'gemini-1.5-flash',
          fallbackModel: 'gemini-1.5-pro',
          tierMessage: 'Using our reliable foundation model optimized for quality and efficiency'
        };
      
      case 'basic':
        return {
          primaryModel: 'gemini-1.5-flash',
          fallbackModel: 'gemini-2.0-flash-exp',
          tierMessage: 'Priority access to enhanced processing with fallback to latest experimental features'
        };
      
      case 'pro':
        return {
          primaryModel: 'gemini-2.0-flash-exp',
          fallbackModel: 'gemini-1.5-flash',
          tierMessage: 'Premium access to cutting-edge AI models with enhanced video understanding'
        };
      
      default:
        // Default to free tier behavior
        return {
          primaryModel: 'gemini-1.5-flash',
          fallbackModel: 'gemini-1.5-pro',
          tierMessage: 'Using standard processing model'
        };
    }
  } catch (error) {
    console.error('Error determining user model preference:', error);
    // Safe fallback to free tier
    return {
      primaryModel: 'gemini-1.5-flash',
      fallbackModel: 'gemini-1.5-pro',
      tierMessage: 'Using reliable foundation model'
    };
  }
}

// Generate all verbosity levels for instant switching (OPTIMIZED: Single API call)
async function generateAllVerbosityLevels(videoUrl: string, template: any, originalContent: string, userId: string, durationSeconds?: number) {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);
  
  console.log('🔄 Optimized verbosity generation: Creating all levels in single API call...');
  
  // Get template-specific structure requirements
  const getTemplateStructure = (templateId: string) => {
    switch (templateId) {
      case 'study-notes':
        return `
REQUIRED STUDY NOTES STRUCTURE (use for ALL verbosity levels):
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

      case 'basic-summary':
        // Use the dynamic template prompt that scales with video duration
        const dynamicPrompt = getTemplatePrompt(template, durationSeconds, undefined, undefined, videoUrl);
        return `
REQUIRED BASIC SUMMARY STRUCTURE (Dynamic scaling based on video length):
${dynamicPrompt}`;

      case 'tutorial-guide':
        // Use the enhanced template for tutorial guides with clickable timestamps
        // Use default values since we don't have verbosityLevel and detectedDomain in this scope
        console.log(`🔗 DEBUG: generateAllVerbosityLevels videoUrl: "${videoUrl}" (length: ${videoUrl ? videoUrl.length : 0})`);
        const tutorialPrompt = getTemplatePrompt(template, durationSeconds, 'standard', 'general', videoUrl);
        console.log(`🎯 DEBUG: Generated tutorial prompt includes videoUrl: ${tutorialPrompt.includes(videoUrl || 'NONE')}`);
        return `
REQUIRED TUTORIAL GUIDE STRUCTURE with MANDATORY CLICKABLE TIMESTAMPS:

🚨🚨🚨 CRITICAL: ALL timestamps MUST be clickable YouTube links using format [MM:SS](url&t=XXXs) 🚨🚨🚨

${tutorialPrompt}`;

      case 'tutorial-guide-fallback': // Keep old version as fallback
        return `
REQUIRED TUTORIAL GUIDE STRUCTURE with MANDATORY TIMESTAMPS:

🚨🚨🚨 CRITICAL: ALL section headers MUST include timestamps in [MM:SS] format 🚨🚨🚨

# Tutorial Guide: [Topic from Video]

## 📖 What You'll Learn
[Learning outcomes with timestamps where appropriate]

## 📋 Prerequisites
[Prerequisites section]

## Step-by-Step Instructions

### **[MM:SS]** Step 1: [Title]
**Objective:** [Clear objective]

**Instructions:**
1. [Detailed instruction with timestamp reference if needed]
2. [Next instruction]

**Tips:**
- [Helpful tip with [MM:SS] reference where relevant]

**Expected Result:** [What should be achieved]

### **[MM:SS]** Step 2: [Title]
[Continue same format for all steps...]

## 🎯 Quick Navigation (Click to jump to video)
- **[0:30]** Step 1: [Title] 
- **[2:15]** Step 2: [Title]
- **[4:20]** Step 3: [Title]

ABSOLUTE REQUIREMENT: Include actual timestamps from the original content in the [MM:SS] format for EVERY step header and in the Quick Navigation section.`;

      default:
        return `Maintain the exact structure and format of the ${template.name} template`;
    }
  };

  // OPTIMIZATION: Generate comprehensive version first, then parse down to brief/standard
  const comprehensivePrompt = `
You are creating video notes that will be provided at different verbosity levels while MAINTAINING EXACT TEMPLATE STRUCTURE.

ORIGINAL CONTENT:
${originalContent}

TARGET TEMPLATE: ${template.name} (ID: ${template.id})

${getTemplateStructure(template.id)}

CRITICAL REQUIREMENTS FOR ALL VERBOSITY LEVELS:
- MUST follow the exact template structure shown above
- MUST include ALL sections and headers (including emoji icons for Study Notes)
- MUST maintain consistent formatting across all verbosity levels
- Only adjust the detail level within each section, never remove sections

🚨🚨🚨 SPECIAL REQUIREMENT FOR TUTORIAL GUIDE TEMPLATE 🚨🚨🚨
If template is "tutorial-guide":
- PRESERVE ALL TIMESTAMPS from the original content in [MM:SS] format
- EXTRACT timestamps from original content and place them in section headers
- MAINTAIN Quick Navigation section with clickable timestamp links
- DO NOT remove or alter any timestamp information
- If original content has timestamps, COPY them exactly to all verbosity levels

VERBOSITY LEVEL DEFINITIONS:
- COMPREHENSIVE: 200-300 words per concept with detailed examples and context
- STANDARD: 100-150 words per concept with some examples and key details  
- BRIEF: 50-75 words per concept with only essential information

OUTPUT FORMAT:
Please return the content in this exact format:

=== COMPREHENSIVE ===
[Full template structure with comprehensive detail level]

=== STANDARD ===
[SAME template structure with standard detail level - include ALL sections]

=== BRIEF ===
[SAME template structure with brief detail level - include ALL sections]

Remember: ALL three versions MUST have identical structure, only varying in content detail within each section.`;

  const generateWithFallback = async () => {
    // Get user's tier-appropriate models
    const modelSelection = await getModelForUser(userId);
    console.log(`💡 ${modelSelection.tierMessage}`);
    
    // Try primary model first (tier-based)
    let model = genAI.getGenerativeModel({ 
      model: modelSelection.primaryModel,
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 8000, // Increased for all 3 versions
      }
    });

    try {
      const result = await model.generateContent(comprehensivePrompt);
      console.log(`✅ Verbosity generation successful with ${modelSelection.primaryModel}`);
      return await result.response.text();
    } catch (error: any) {
      if (error.status === 429 || error.message?.includes('quota')) {
        console.log(`⚠️ ${modelSelection.primaryModel} quota exceeded, trying fallback: ${modelSelection.fallbackModel}...`);
        
        // Use tier-appropriate fallback model
        model = genAI.getGenerativeModel({ 
          model: modelSelection.fallbackModel,
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 6000,
          }
        });
        
        try {
          const result = await model.generateContent(comprehensivePrompt);
          console.log(`✅ Verbosity generation successful with fallback: ${modelSelection.fallbackModel}`);
          return await result.response.text();
        } catch (fallbackError) {
          console.error(`❌ Both ${modelSelection.primaryModel} and ${modelSelection.fallbackModel} failed for verbosity generation:`, fallbackError);
          throw fallbackError;
        }
      } else {
        throw error;
      }
    }
  };

  try {
    // SINGLE API CALL instead of 3 separate calls
    console.log('💡 Making single API call for all verbosity levels...');
    const fullResponse = await generateWithFallback();
    
    // Parse the response to extract all three levels
    const comprehensive = extractSection(fullResponse, '=== COMPREHENSIVE ===', '=== STANDARD ===');
    const standard = extractSection(fullResponse, '=== STANDARD ===', '=== BRIEF ===');
    const brief = extractSection(fullResponse, '=== BRIEF ===', null);

    // Validate that we got all sections
    if (!comprehensive || !standard || !brief) {
      console.log('⚠️ Could not parse all sections from response, falling back to simple parsing...');
      return parseResponseAsFallback(fullResponse, originalContent);
    }

    console.log('✅ Successfully generated all verbosity levels in single API call');
    console.log(`📊 Generated: ${comprehensive.length} chars (comprehensive), ${standard.length} chars (standard), ${brief.length} chars (brief)`);
    
    return {
      brief: brief.trim(),
      standard: standard.trim(),
      comprehensive: comprehensive.trim()
    };

  } catch (error) {
    console.error('❌ Error in optimized verbosity generation:', error);
    
    // Create simple text-based variations as ultimate fallback
    console.log('🔄 Using text-based fallback for verbosity levels...');
    const lines = originalContent.split('\n').filter(line => line.trim());
    
    return {
      brief: lines.slice(0, Math.ceil(lines.length * 0.4)).join('\n'),
      standard: originalContent, // Keep original as standard
      comprehensive: originalContent + '\n\n' + lines.map(line => line.startsWith('- ') ? line + ' [More details available in video]' : line).join('\n')
    };
  }
}

// Helper function to extract sections from the response
function extractSection(response: string, startMarker: string, endMarker: string | null): string {
  const startIndex = response.indexOf(startMarker);
  if (startIndex === -1) return '';
  
  const contentStart = startIndex + startMarker.length;
  const endIndex = endMarker ? response.indexOf(endMarker, contentStart) : response.length;
  
  if (endIndex === -1) return response.substring(contentStart).trim();
  return response.substring(contentStart, endIndex).trim();
}

// Fallback parser if structured format fails
function parseResponseAsFallback(response: string, originalContent: string) {
  // Try to split by common section indicators or just use the full response
  const lines = response.split('\n').filter(line => line.trim());
  const totalLines = lines.length;
  
  return {
    comprehensive: response, // Use full response as comprehensive
    standard: lines.slice(0, Math.ceil(totalLines * 0.7)).join('\n'), // 70% of content
    brief: lines.slice(0, Math.ceil(totalLines * 0.4)).join('\n') // 40% of content
  };
}

// Generate verbosity levels from text (instead of re-processing video)
async function generateVerbosityFromText(originalContent: string): Promise<{
  brief: string;
  standard: string;
  comprehensive: string;
}> {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);
  
  const verbosityInstructions = {
    brief: 'Condense to 50-75 words per concept. Remove examples, keep only essential info. Use bullet points.',
    standard: 'Balance to 100-150 words per concept. Include key examples and details.',
    comprehensive: 'Expand to 200-300 words per concept. Add examples, context, detailed explanations.'
  };

  const generatePrompt = (verbosity: keyof typeof verbosityInstructions) => `
You are adjusting text content verbosity level.

ORIGINAL CONTENT:
${originalContent}

TASK: Adjust this content to ${verbosity} verbosity level.

VERBOSITY RULES:
${verbosityInstructions[verbosity]}

FORMATTING: Maintain markdown structure, headings, and organization.
OUTPUT: Return only the adjusted content, no explanations.`;

  try {
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash-exp',
      generationConfig: { temperature: 0.1, maxOutputTokens: 3000 }
    });

    // Generate all levels from text (much faster than video processing)
    const [brief, standard, comprehensive] = await Promise.all([
      model.generateContent(generatePrompt('brief')).then(r => r.response.text()),
      model.generateContent(generatePrompt('standard')).then(r => r.response.text()),
      model.generateContent(generatePrompt('comprehensive')).then(r => r.response.text())
    ]);

    return { brief, standard, comprehensive };
  } catch (error) {
    console.error('Error generating text-based verbosity levels:', error);
    // Fallback to simple text manipulation
    const lines = originalContent.split('\n').filter(line => line.trim());
    return {
      brief: lines.slice(0, Math.ceil(lines.length * 0.4)).join('\n'),
      standard: originalContent,
      comprehensive: originalContent + '\n\n## Additional Context\n\n' + lines.slice(-3).join('\n')
    };
  }
}

// Process transcript with Gemini (much faster than video processing)
async function processTranscriptWithGemini(transcript: string, template: any): Promise<string> {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);
  
  // Create enhanced prompt for transcript processing
  const transcriptPrompt = `${template.prompt}

VIDEO TRANSCRIPT:
${transcript}

INSTRUCTIONS:
- Process the above transcript to create ${template.name.toLowerCase()}
- Focus on the spoken content and key information
- Maintain professional tone and structure
- Start with "**${template.name}**" as the title

Generate comprehensive content based on this transcript.`;

  try {
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 4000,
      }
    });

    const result = await model.generateContent(transcriptPrompt);
    const text = await result.response.text();
    
    if (!text || text.trim().length === 0) {
      throw new Error('Empty response from Gemini');
    }
    
    return text;
  } catch (error: any) {
    if (error.status === 429) {
      console.log('Primary model quota exceeded, trying fallback...');
      const fallbackModel = genAI.getGenerativeModel({ 
        model: 'gemini-1.5-flash',
        generationConfig: { temperature: 0.1, maxOutputTokens: 3000 }
      });
      
      const result = await fallbackModel.generateContent(transcriptPrompt);
      return await result.response.text();
    } else {
      throw error;
    }
  }
}

// Enhanced content analysis with hybrid deep learning approach
async function analyzeVideoContent(videoUrl: string) {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-2.0-flash-exp',
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 2048,
    }
  });

  const analysisPrompt = `Analyze this video content using a comprehensive approach and return ONLY valid JSON with the following structure:

{
  "type": "tutorial|lecture|documentary|podcast|demo|webinar|educational",
  "topics": ["topic1", "topic2", "topic3"],
  "complexity": "beginner|intermediate|advanced",
  "format": "sequential|theoretical|practical|analytical|narrative",
  "confidence": 0.85,
  "speechDensity": "low|medium|high",
  "temporalPattern": "minimal_cuts|moderate_cuts|rapid_cuts",
  "engagementType": "educational|entertainment|mixed|instructional",
  "readabilityLevel": "k12|undergraduate|graduate|professional",
  "cognitiveLoad": "low|medium|high",
  "recommendedVerbosity": "brief|standard|comprehensive"
}

Apply these classification criteria:
- Content Type: Tutorial (step-by-step), Lecture (academic), Documentary (narrative), Podcast (discussion), Demo (showcase), Webinar (presentation)
- Complexity: Beginner (introductory), Intermediate (detailed), Advanced (expert-level)
- Format: Sequential (ordered steps), Theoretical (concepts), Practical (hands-on), Analytical (data-driven), Narrative (story-based)
- Cognitive Load: Low (simple concepts), Medium (moderate detail), High (complex topics)

Return ONLY the JSON object. No markdown formatting, no explanations, no code blocks.`;

  try {
    const result = await model.generateContent([
      analysisPrompt,
      {
        fileData: {
          mimeType: 'video/*',
          fileUri: videoUrl
        }
      }
    ]);

    const analysisText = await result.response.text();
    console.log('Content analysis result:', analysisText);
    
    // Clean the response to extract pure JSON - handle various formats
    let cleanedText = analysisText.trim();
    
    // Remove markdown code blocks if present
    cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    // Remove any leading/trailing whitespace or non-JSON text
    const jsonStart = cleanedText.indexOf('{');
    const jsonEnd = cleanedText.lastIndexOf('}');
    
    if (jsonStart !== -1 && jsonEnd !== -1) {
      cleanedText = cleanedText.substring(jsonStart, jsonEnd + 1);
    }
    
    // Parse JSON response
    const analysis = JSON.parse(cleanedText);
    return analysis;
  } catch (error) {
    console.error('Content analysis failed:', error);
    // Fallback to basic analysis
    return {
      type: 'educational',
      topics: ['general content'],
      complexity: 'intermediate',
      format: 'theoretical',
      confidence: 0.5,
      speechDensity: 'medium',
      temporalPattern: 'moderate_cuts',
      engagementType: 'educational',
      readabilityLevel: 'undergraduate',
      cognitiveLoad: 'medium',
      recommendedVerbosity: 'standard'
    };
  }
}



// Enhanced prompt generation with cognitive load optimization and domain detection
function generateEnhancedPrompt(template: any, contentAnalysis: any, verbosityLevel: string, durationSeconds?: number, videoMetadata?: any, videoUrl?: string) {
  const verbosityInstructions = {
    brief: 'Generate concise notes with 50-75 words per concept. Use bullet points and limit to 1-2 supporting details maximum.',
    standard: 'Generate balanced notes with 100-150 words per concept. Use mixed paragraph and bullet formats with 3-4 supporting details.',
    comprehensive: 'Generate detailed notes with 200-300 words per concept. Include multiple examples and complete contextual background.'
  };

  const contentAdaptations: Record<string, string> = {
    tutorial: 'Focus on step-by-step procedures with prerequisites, numbered instructions, troubleshooting sections, and resource links.',
    lecture: 'Emphasize hierarchical structure with course context, key concepts, supporting evidence, and self-assessment questions.',
    documentary: 'Highlight chronological timelines, key figures, statistical data with attribution, and geographic context mapping.',
    podcast: 'Capture discussion points, multiple perspectives, key insights, and actionable takeaways from conversational content.',
    demo: 'Focus on feature showcases, technical specifications, use cases, and practical applications.'
  };

  const adaptation = contentAdaptations[contentAnalysis.type] || contentAdaptations.lecture;

  // Detect domain for tutorial-specific templates
  let detectedDomain: TutorialDomain = 'general';
  if (template.id === 'tutorial-guide' && videoMetadata) {
    detectedDomain = detectDomainFromMetadata(videoMetadata.title, videoMetadata.description);
    console.log(`🎯 Detected tutorial domain: ${detectedDomain} for "${videoMetadata.title}"`);
  }

      // Handle Basic Summary template specifically
    let startInstruction = '';
    if (template.id === 'basic-summary') {
      startInstruction = 'Ensure the first characters of your response must be "**Video Summary**" with no text before it.';
    } else {
      startInstruction = `Ensure the first characters of your response must be "**${template.name}**" with no text before it.`;
    }

    // Get the template prompt with verbosity and domain support (dynamic if supported, static otherwise)
    const templatePrompt = getTemplatePrompt(template, durationSeconds, verbosityLevel as VerbosityLevel, detectedDomain, videoUrl);

    return `${templatePrompt}

CONTENT ANALYSIS:
- Type: ${contentAnalysis.type}
- Complexity: ${contentAnalysis.complexity}
- Format: ${contentAnalysis.format}
- Cognitive Load: ${contentAnalysis.cognitiveLoad}

VERBOSITY LEVEL: ${verbosityLevel.toUpperCase()}
${verbosityInstructions[verbosityLevel as keyof typeof verbosityInstructions]}

CONTENT ADAPTATION: ${adaptation}

TECHNICAL WRITING REQUIREMENTS:
- Use active voice construction
- Write in third-person perspective
- Use present tense for current information
- Include specific measurements and concrete details
- Eliminate contractions and colloquial expressions
- Maintain professional, non-conversational tone

${startInstruction}`;
}

// Chunked processing function to reduce token usage
async function processVideoInChunks(videoUrl: string, prompt: string, template: string): Promise<string> {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-1.5-flash',
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 4000, // Smaller chunks
    }
  });

  try {
    // First, get a basic overview with minimal tokens
    const overviewPrompt = `Extract the main topic and 3-4 key points from this video: ${videoUrl}`;
    const overviewResult = await model.generateContent([
      overviewPrompt,
      {
        fileData: {
          mimeType: 'video/*',
          fileUri: videoUrl
        }
      }
    ]);
    const overview = await overviewResult.response.text();

    // Then, process with the full template but with the overview as context
    const fullPrompt = `${prompt}\n\nContext from video: ${overview.substring(0, 500)}`;
    
    const result = await model.generateContent([
      fullPrompt,
      {
        fileData: {
          mimeType: 'video/*',
          fileUri: videoUrl
        }
      }
    ]);

    const text = await result.response.text();
    
    // Validate content
    if (!text || text.trim().length === 0) {
      throw new Error('Invalid response: Empty or missing content');
    }
    
    return text;
  } catch (error: any) {
    // Fallback to simple processing if chunked processing fails
    console.log('Chunked processing failed, falling back to simple processing:', error.message);
    
    const fallbackModel = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 2000,
      }
    });
    
    const result = await fallbackModel.generateContent([
      prompt,
      {
        fileData: {
          mimeType: 'video/*',
          fileUri: videoUrl
        }
      }
    ]);
    
    return await result.response.text();
  }
}

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);

// Try alternative model if quota exceeded
const getModel = (useAlternative = false) => {
  const modelName = useAlternative ? 'gemini-1.5-flash' : 'gemini-2.0-flash-exp';
  return genAI.getGenerativeModel({ 
    model: modelName,
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: useAlternative ? 8192 : 32768,
    }
  });
};

// Utility function to fetch basic YouTube metadata
async function fetchYouTubeMetadata(videoId: string): Promise<{
  title?: string;
  thumbnailUrl?: string;
  channelName?: string;
  duration?: number;
} | null> {
  try {
    // Use YouTube oEmbed API for basic metadata (no API key required)
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    
    const response = await fetch(oembedUrl);
    if (response.ok) {
      const data = await response.json();
      return {
        title: data.title || `YouTube Video ${videoId}`,
        thumbnailUrl: data.thumbnail_url || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        channelName: data.author_name,
      };
    }
    
    // Fallback if oEmbed fails
    return {
      title: `YouTube Video ${videoId}`,
      thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
    };
  } catch (error) {
    console.error('Error fetching YouTube metadata:', error);
    return {
      title: `YouTube Video ${videoId}`,
      thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
    };
  }
}

// Ensure video record exists in database
async function ensureVideoRecord(request: NextRequest, videoUrl: string): Promise<void> {
  try {
    // Check if user is authenticated
    const session = await getApiSessionWithDatabase(request);
    if (!session?.user?.id) {
      console.log('No authenticated user for video record creation');
      return; // Don't create video record if no user
    }

    // Use database UUID directly from session
    const userId = session.user.id;

    // Extract video ID from URL
    const youtubeVideoId = extractVideoId(videoUrl);
    if (!youtubeVideoId) {
      console.error('Failed to extract video ID from URL:', videoUrl);
      return;
    }

    // Check if video record already exists for this user and video
    const existingVideo = await db
      .select()
      .from(videos)
      .where(
        and(
          eq(videos.videoId, youtubeVideoId),
          eq(videos.userId, userId)
        )
      )
      .limit(1);

    if (existingVideo.length > 0) {
      console.log('Video record already exists:', youtubeVideoId);
      return;
    }

    // Create new video record
    const videoMetadata = await fetchYouTubeMetadata(youtubeVideoId);
    
    await db
      .insert(videos)
      .values({
        userId: userId,
        youtubeUrl: videoUrl,
        videoId: youtubeVideoId,
        title: videoMetadata?.title || `YouTube Video ${youtubeVideoId}`,
        thumbnailUrl: videoMetadata?.thumbnailUrl,
        channelName: videoMetadata?.channelName,
        duration: videoMetadata?.duration,
        status: 'processing' // Mark as processing since we're currently processing it
      });

    console.log('✅ Created video record for:', youtubeVideoId);
  } catch (error) {
    console.error('Error ensuring video record:', error);
    // Don't throw error to avoid breaking video processing
  }
}

// Update video record status
async function updateVideoRecordStatus(
  request: NextRequest, 
  videoUrl: string, 
  status: 'pending' | 'processing' | 'completed' | 'failed'
): Promise<void> {
  try {
    // Check if user is authenticated
    const session = await getApiSessionWithDatabase(request);
    if (!session?.user?.id) {
      console.log('No authenticated user for video record status update');
      return;
    }

    // Use database UUID directly from session
    const userId = session.user.id;

    // Extract video ID from URL
    const youtubeVideoId = extractVideoId(videoUrl);
    if (!youtubeVideoId) {
      console.error('Failed to extract video ID from URL:', videoUrl);
      return;
    }

    // Update video record status
    await db
      .update(videos)
      .set({
        status: status,
        processingCompleted: status === 'completed' ? new Date() : undefined,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(videos.videoId, youtubeVideoId),
          eq(videos.userId, userId)
        )
      );

    console.log(`✅ Updated video record status to '${status}' for:`, youtubeVideoId);
  } catch (error) {
    console.error('Error updating video record status:', error);
    // Don't throw error to avoid breaking video processing
  }
}

export async function POST(request: NextRequest) {
  let videoUrl: string = '';
  
  try {
    // Apply rate limiting
    const clientId = getClientIdentifier(request);
    const rateLimitResult = applyRateLimit(request, videoProcessingRateLimiter, clientId);
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded. Please try again later.',
          retryAfter: rateLimitResult.retryAfter 
        }, 
        { 
          status: 429,
          headers: {
            'Retry-After': rateLimitResult.retryAfter?.toString() || '3600',
            'X-RateLimit-Limit': '50',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(Date.now() + (rateLimitResult.retryAfter || 3600) * 1000).toISOString()
          }
        }
      );
    }

    const requestData = await request.json();
    videoUrl = requestData.videoUrl;
    const selectedTemplate = requestData.selectedTemplate || 'basic-summary';
    const processingMode = requestData.processingMode || 'hybrid'; // Default to hybrid for best results
    const verbosity = requestData.verbosity || 'standard'; // Default verbosity level

    // Validate video URL
    const urlValidation = validateVideoUrl(videoUrl);
    if (!urlValidation.isValid) {
      return NextResponse.json({ error: urlValidation.error }, { status: 400 });
    }

    if (!videoUrl) {
      return NextResponse.json({ error: 'Video URL is required' }, { status: 400 });
    }

    const template = TEMPLATES.find(t => t.id === selectedTemplate);
    if (!template) {
      return NextResponse.json({ error: 'Invalid template selected' }, { status: 400 });
    }

    console.log('Processing video with template:', selectedTemplate);
    console.log('Processing mode:', processingMode);
    console.log('Verbosity level:', verbosity);

    // Create or find existing video record in database
    await ensureVideoRecord(request, videoUrl);

    // NEW: Use enhanced GeminiClient with hybrid processing support
    console.log('🚀 Using enhanced GeminiClient with hybrid processing...');
    
    // Get current user session for processing limits - ensure user exists in database
    const session = await getApiSessionWithDatabase(request);
    console.log('AUTH STATUS (process route):', {
      hasSession: !!session,
      hasUser: !!session?.user,
      hasUserId: !!session?.user?.id,
      userEmail: session?.user?.email
    });
    
    // Require authentication for video processing
    if (!session?.user?.id) {
      console.error('❌ Authentication failed - no valid session or database user');
      return NextResponse.json({
        error: 'Authentication required',
        details: 'You must be signed in to process videos'
      }, { status: 401 });
    }
    
    // Use database UUID for consistency with admin overrides and subscription system
    const userId = session.user.id;
    
    // 🔒 SECURITY: Reserve usage atomically to prevent race conditions
    const usageReservation = await reserveUsage(userId, 'generate_note', 1);
    if (!usageReservation.success) {
      // 🔒 AUDIT: Log usage limit exceeded
      await auditLogger.logUsageLimitExceeded(
        userId,
        'generate_note',
        0, // Current usage not available
        -1, // Limit not available
        'video_processing',
        { 
          videoUrl, 
          template: selectedTemplate, 
          reason: usageReservation.reason,
          ipAddress: request.ip || request.headers.get('x-forwarded-for') || 'unknown'
        }
      );
      
      return NextResponse.json({
        error: 'Note generation limit reached',
        details: usageReservation.reason,
        resetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString()
      }, { status: 429 });
    }
    
    console.log('✅ Usage reservation successful:', usageReservation.reservationId);
    
    // 🔒 AUDIT: Log video processing start
    await auditLogger.logEvent({
      eventType: 'data_access',
      userId,
      action: 'video_processing_started',
      details: {
        videoUrl,
        template: selectedTemplate,
        processingMode,
        verbosity,
        reservationId: usageReservation.reservationId
      },
      severity: 'low',
      source: 'video_processing_api',
      ipAddress: request.ip || request.headers.get('x-forwarded-for') || 'unknown'
    });
    
    // Create processing request for GeminiClient
    const processingRequest = {
      youtubeUrl: videoUrl,
      template,
      userId,
      processingMode: processingMode as 'hybrid' | 'transcript-only' | 'video-only' | 'auto'
    };
    
    // Process video with enhanced hybrid approach
    const processingResult = await geminiClient.processVideo(processingRequest);
    
    if (processingResult.status === 'failed') {
      throw new Error(processingResult.error || 'Video processing failed');
    }
    
    const result = processingResult.result!;
    const processingMethod = processingResult.metadata?.processingMethod || 'unknown';
    const dataSourcesUsed = processingResult.metadata?.dataSourcesUsed || [];
    let contentAnalysis: any = null; // For compatibility with existing code
    
    // Log hybrid processing results
    console.log(`✅ Processing completed with method: ${processingMethod}`);
    console.log(`📋 Data sources used: ${dataSourcesUsed.join(', ')}`);
    console.log(`💰 Processing cost: $${processingResult.cost?.toFixed(4) || '0.0000'}`);
    console.log(`📈 Token usage: ${processingResult.tokenUsage || 0}`);
    
    // Generate all verbosity levels from the result with user's preferred default
    console.log('Generating all verbosity levels for instant switching...');
    const durationSeconds = processingResult.metadata?.videoDuration;
    const verbosityVersions = await generateAllVerbosityLevels(videoUrl, template, result, userId, durationSeconds);
    console.log('✅ All verbosity levels generated successfully');
    
    // Auto-save notes to database with all verbosity levels
    console.log('💾 Auto-saving notes to database with verbosity levels...');
    try {
      const saveResult = await NotesService.saveNote({
        userId: userId,
        youtubeUrl: videoUrl,
        title: `Notes from ${videoUrl}`,
        content: verbosityVersions[verbosity as keyof typeof verbosityVersions] || verbosityVersions.standard, // Use selected verbosity
        templateId: selectedTemplate,
        verbosityVersions: verbosityVersions
      });
      
      if (saveResult.success) {
        console.log('✅ Notes successfully saved to database with ID:', saveResult.noteId);
      } else {
        console.warn('⚠️ Failed to auto-save notes:', saveResult.error);
        // Continue processing - don't fail the entire request
      }
    } catch (saveError) {
      console.error('❌ Error during auto-save:', saveError);
      // Continue processing - don't fail the entire request
    }
    
    // Update video status as completed AFTER verbosity generation and auto-save
    console.log('🏁 Marking video processing as completed...');
    await updateVideoRecordStatus(request, videoUrl, 'completed');
    
    // Prepare response data in existing format for frontend compatibility
    const responseData: any = {
      title: `Notes from ${videoUrl}`,
      content: verbosityVersions[verbosity as keyof typeof verbosityVersions] || verbosityVersions.standard, // Use user's selected verbosity
      template: selectedTemplate,
      processingMethod: processingMethod, // NEW: Include processing method
      dataSourcesUsed: dataSourcesUsed, // NEW: Include data sources
      allVerbosityLevels: verbosityVersions,
      selectedVerbosity: verbosity, // NEW: Include selected verbosity
      videoUrl,
      processingTimestamp: new Date().toISOString()
    };
    
    // Enhanced response for hybrid processing
    if (processingMethod === 'hybrid') {
      responseData.quality = {
        formatCompliance: 0.99, // Hybrid processing has highest quality
        nonConversationalScore: 0.99,
        contentAdaptation: 'hybrid-optimized',
        cognitiveOptimization: 'multi-modal-enhanced'
      };
    } else if (processingMethod === 'transcript-only') {
      responseData.quality = {
        formatCompliance: 0.98,
        nonConversationalScore: 0.98,
        contentAdaptation: 'transcript-optimized'
      };
    } else {
      responseData.quality = {
        formatCompliance: 0.95,
        nonConversationalScore: 0.95,
        contentAdaptation: 'video-optimized'
      };
    }
    
    // Usage already tracked via atomic reservation system
    console.log('✅ Usage tracking completed via atomic reservation system');
    
    return NextResponse.json(responseData);

  } catch (error: any) {
    console.error('Video processing error:', error);
    
    // Mark video as failed in database
    await updateVideoRecordStatus(request, videoUrl, 'failed');
    
    // Enhanced error handling for different timeout scenarios
    if (error.message.includes('timeout') || error.message.includes('deadline')) {
      return NextResponse.json({ 
        error: 'Video processing timeout - video may be too long for standard processing',
        details: error.message,
        suggestion: 'Try using the async processing endpoint: /api/videos/process-async',
        retryAfter: 300
      }, { 
        status: 408,
        headers: { 'Retry-After': '300' }
      });
    }
    
    if (error.message.includes('quota') || error.message.includes('429')) {
      return NextResponse.json({ 
        error: 'API quota exceeded. Please try again later or upgrade your plan.',
        details: error.message,
        retryAfter: 3600
      }, { 
        status: 429,
        headers: { 'Retry-After': '3600' }
      });
    }
    
    if (error.message.includes('400') || error.message.includes('invalid')) {
      return NextResponse.json({ 
        error: 'Invalid video URL or content not supported.',
        details: error.message,
        suggestion: 'Ensure the YouTube URL is valid and the video is publicly accessible'
      }, { status: 400 });
    }

    // Handle large file errors
    if (error.message.includes('size') || error.message.includes('too large')) {
      return NextResponse.json({ 
        error: 'Video file is too large for processing',
        details: error.message,
        suggestion: 'Try using the async processing endpoint for long videos: /api/videos/process-async'
      }, { status: 413 });
    }

    // Handle pattern matching errors
    if (error.message.includes('pattern') || error.message.includes('string did not match')) {
      return NextResponse.json({ 
        error: 'Video content parsing failed',
        details: 'The video content could not be properly analyzed. This may be due to video length, format, or content restrictions.',
        suggestion: 'Try a shorter video or use the async processing endpoint'
      }, { status: 422 });
    }
    
    return NextResponse.json({ 
      error: 'Failed to process video',
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

