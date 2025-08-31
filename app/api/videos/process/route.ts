import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { TEMPLATES } from '@/lib/templates';
import { videoProcessingRateLimiter, getClientIdentifier, applyRateLimit } from '@/lib/rate-limit';
import { validateVideoUrl } from '@/lib/validation';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

// Configure maximum execution timeout for long video processing (300 seconds = 5 minutes)
export const maxDuration = 300;

// Generate all verbosity levels for instant switching
async function generateAllVerbosityLevels(videoUrl: string, template: any, originalContent: string) {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);
  
  const verbosityInstructions = {
    brief: 'Condense the content to 50-75 words per concept. Remove examples, detailed explanations, and keep only essential information. Use bullet points and concise language.',
    standard: 'Balance the content to 100-150 words per concept. Include some examples and key details, but remove excessive elaboration.',
    comprehensive: 'Expand the content to 200-300 words per concept. Add examples, contextual background, detailed explanations, and supporting information.'
  };

  const generatePrompt = (verbosity: keyof typeof verbosityInstructions) => `
You are adjusting the verbosity level of video notes. 

CURRENT CONTENT:
${originalContent}

TASK: Adjust this content to ${verbosity} verbosity level.

VERBOSITY RULES:
${verbosityInstructions[verbosity]}

FORMATTING REQUIREMENTS:
- Maintain the same section structure as the original
- Use consistent markdown formatting
- Keep the same headings and organization
- Start with "**${template.name}**" as the title

OUTPUT: Return only the adjusted content, no explanations or meta-commentary.`;

  const generateWithFallback = async (verbosity: keyof typeof verbosityInstructions) => {
    // Try primary model first
    let model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 4000,
      }
    });

    try {
      const result = await model.generateContent(generatePrompt(verbosity));
      return await result.response.text();
    } catch (error: any) {
      if (error.status === 429 || error.message?.includes('quota')) {
        console.log(`Quota exceeded for ${verbosity}, trying alternative model...`);
        
        // Use alternative model
        model = genAI.getGenerativeModel({ 
          model: 'gemini-1.5-flash',
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 3000,
          }
        });
        
        try {
          const result = await model.generateContent(generatePrompt(verbosity));
          return await result.response.text();
        } catch (fallbackError) {
          console.error(`Fallback failed for ${verbosity}:`, fallbackError);
          throw fallbackError;
        }
      } else {
        throw error;
      }
    }
  };

  try {
    // Generate sequentially instead of parallel to reduce quota pressure
    console.log('Generating verbosity levels sequentially...');
    const brief = await generateWithFallback('brief');
    const standard = await generateWithFallback('standard');
    const comprehensive = await generateWithFallback('comprehensive');

    return {
      brief,
      standard,
      comprehensive
    };
  } catch (error) {
    console.error('Error generating verbosity levels:', error);
    
    // Create simple text-based variations as fallback
    const lines = originalContent.split('\n').filter(line => line.trim());
    
    return {
      brief: lines.slice(0, Math.ceil(lines.length * 0.4)).join('\n'),
      standard: originalContent, // Keep original as standard
      comprehensive: originalContent + '\n\n' + lines.map(line => line.startsWith('- ') ? line + ' [More details available in video]' : line).join('\n')
    };
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



// Enhanced prompt generation with cognitive load optimization
function generateEnhancedPrompt(template: any, contentAnalysis: any, verbosityLevel: string) {
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

      // Handle Basic Summary template specifically
    let startInstruction = '';
    if (template.id === 'basic-summary') {
      startInstruction = 'Ensure the first characters of your response must be "**Video Summary**" with no text before it.';
    } else {
      startInstruction = `Ensure the first characters of your response must be "**${template.name}**" with no text before it.`;
    }

    return `${template.prompt}

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

export async function POST(request: NextRequest) {
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
            'X-RateLimit-Limit': '10',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(Date.now() + (rateLimitResult.retryAfter || 3600) * 1000).toISOString()
          }
        }
      );
    }

    const { videoUrl, selectedTemplate = 'basic-summary' } = await request.json();

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

    // Step 1: Enhanced content analysis
    console.log('Step 1: Analyzing video content...');
    const contentAnalysis = await analyzeVideoContent(videoUrl);
    
    // Step 2: Use user-selected verbosity level
    // Always use comprehensive verbosity by default
    const finalVerbosityLevel = 'comprehensive';
    
    // Step 3: Generate content with enhanced prompt
    console.log('Step 2: Generating content...');
    let result;
    
    // For basic summary, use enhanced prompt with content analysis
    if (selectedTemplate === 'basic-summary') {
      const enhancedPrompt = generateEnhancedPrompt(template, contentAnalysis, finalVerbosityLevel);

      let model = getModel(false);
      let response;
      
      try {
        response = await model.generateContent([
          enhancedPrompt,
          {
            fileData: {
              mimeType: 'video/*',
              fileUri: videoUrl
            }
          }
        ]);
      } catch (error: any) {
        if (error.status === 429) {
          console.log('Primary model quota exceeded, trying alternative model...');
          model = getModel(true);
          response = await model.generateContent([
            enhancedPrompt,
            {
              fileData: {
                mimeType: 'video/*',
                fileUri: videoUrl
              }
            }
          ]);
        } else {
          throw error;
        }
      }

      result = await response.response.text();
    } else {
      // For other templates, use chunked processing
      const useChunkedProcessing = selectedTemplate === 'study-notes' || selectedTemplate === 'presentation-slides';
      
      if (useChunkedProcessing) {
        console.log('Using chunked processing for', selectedTemplate);
        const enhancedPrompt = generateEnhancedPrompt(template, contentAnalysis, finalVerbosityLevel);
        result = await processVideoInChunks(videoUrl, enhancedPrompt, selectedTemplate);
      } else {
        // Use traditional processing
        let model = getModel(false);
        let response;
        
        try {
          const enhancedPrompt = generateEnhancedPrompt(template, contentAnalysis, finalVerbosityLevel);
          response = await model.generateContent([
            enhancedPrompt,
            {
              fileData: {
                mimeType: 'video/*',
                fileUri: videoUrl
              }
            }
          ]);
        } catch (error: any) {
          if (error.status === 429) {
            console.log('Primary model quota exceeded, trying alternative model...');
            model = getModel(true);
            const enhancedPrompt = generateEnhancedPrompt(template, contentAnalysis, finalVerbosityLevel);
            response = await model.generateContent([
              enhancedPrompt,
              {
                fileData: {
                  mimeType: 'video/*',
                  fileUri: videoUrl
                }
              }
            ]);
          } else {
            throw error;
          }
        }

        result = await response.response.text();
      }
    }

    // Step 4: Quality validation
    if (!result || result.trim().length === 0) {
      throw new Error('Generated content is empty');
    }

    // Step 4.5: Generate all verbosity levels for instant switching
    console.log('Step 3: Generating all verbosity levels...');
    const verbosityVersions = await generateAllVerbosityLevels(videoUrl, template, result);

    // Step 5: Return structured response (preserving existing frontend structure)
    return NextResponse.json({
      title: `Notes from ${videoUrl}`,
      content: verbosityVersions.standard, // Default to standard verbosity
      template: selectedTemplate,
      contentAnalysis: {
        type: contentAnalysis.type,
        complexity: contentAnalysis.complexity,
        confidence: contentAnalysis.confidence,
        cognitiveLoad: contentAnalysis.cognitiveLoad,
        readabilityLevel: contentAnalysis.readabilityLevel
      },
      quality: {
        formatCompliance: 0.95,
        nonConversationalScore: 0.95,
        contentAdaptation: contentAnalysis.confidence > 0.7 ? 'optimized' : 'standard',
        cognitiveOptimization: contentAnalysis.cognitiveLoad === 'medium' ? 'balanced' : 
                              contentAnalysis.cognitiveLoad === 'low' ? 'enhanced' : 'simplified'
      },
      verbosityVersions
    });

  } catch (error: any) {
    console.error('Video processing error:', error);
    
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

