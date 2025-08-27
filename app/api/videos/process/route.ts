import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { TEMPLATES } from '../../../../lib/templates';

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
          mimeType: 'text/plain',
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
          mimeType: 'text/plain',
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
          mimeType: 'text/plain',
          fileUri: videoUrl
        }
      }
    ]);
    
    return await result.response.text();
  }
}

  // Initialize Gemini AI (simplified for testing)
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

// Enhanced content type detection with research-backed metrics
interface ContentAnalysis {
  type: 'educational' | 'entertainment' | 'tutorial' | 'lecture' | 'documentary' | 'music' | 'news' | 'technical';
  topics: string[];
  complexity: 'beginner' | 'intermediate' | 'advanced';
  format: 'sequential' | 'theoretical' | 'practical' | 'analytical';
  confidence?: number;
  // Research-backed additional metrics
  speechDensity?: 'low' | 'medium' | 'high'; // words per minute analysis
  temporalPattern?: 'minimal_cuts' | 'moderate_cuts' | 'rapid_cuts'; // scene change frequency
  engagementType?: 'educational' | 'entertainment' | 'mixed'; // audience interaction patterns
}

// Content-adaptive study strategies
const STUDY_STRATEGIES = {
  educational: {
    tips: [
      'Take notes during the video and pause to reflect on key concepts',
      'Create flashcards for important terms and definitions',
      'Summarize each main point in your own words',
      'Connect new information to prior knowledge',
      'Use the Feynman technique: explain concepts as if teaching someone else'
    ],
    learningStyles: {
      visual: 'Create mind maps or diagrams of the concepts',
      auditory: 'Read your notes aloud and discuss with others',
      kinesthetic: 'Create physical models or act out concepts'
    },
    memoryTechniques: [
      'Use the chunking method to group related concepts',
      'Create acronyms for lists of items',
      'Apply spaced repetition for long-term retention',
      'Use memory palaces for complex information'
    ]
  },
  entertainment: {
    tips: [
      'Focus on cultural context and social significance',
      'Analyze creative elements and artistic choices',
      'Consider the historical and social impact',
      'Explore themes and messages beyond surface content',
      'Examine character development and plot structure'
    ],
    learningStyles: {
      visual: 'Analyze visual elements, colors, and composition',
      auditory: 'Focus on music, sound effects, and dialogue patterns',
      kinesthetic: 'Recreate scenes or movements to understand context'
    },
    memoryTechniques: [
      'Use storytelling techniques to remember key moments',
      'Create emotional connections to memorable content',
      'Associate content with personal experiences',
      'Use character mapping and plot timelines'
    ]
  },
  tutorial: {
    tips: [
      'Practice each step before moving to the next',
      'Take screenshots or notes of important steps',
      'Try to replicate the process on your own',
      'Identify potential problems and solutions',
      'Create your own variations of the demonstrated process'
    ],
    learningStyles: {
      visual: 'Create step-by-step visual guides',
      auditory: 'Narrate the process as you follow along',
      kinesthetic: 'Perform the actions while watching'
    },
    memoryTechniques: [
      'Use procedural memory by practicing repeatedly',
      'Break complex procedures into smaller steps',
      'Create checklists for multi-step processes',
      'Use the "teach-back" method to reinforce learning'
    ]
  },
  technical: {
    tips: [
      'Focus on understanding underlying principles',
      'Note technical specifications and requirements',
      'Identify practical applications of concepts',
      'Connect technical details to real-world scenarios',
      'Research related technologies and alternatives'
    ],
    learningStyles: {
      visual: 'Create technical diagrams and flowcharts',
      auditory: 'Explain technical concepts to others',
      kinesthetic: 'Build or manipulate technical systems'
    },
    memoryTechniques: [
      'Use technical acronyms and jargon systematically',
      'Create technical concept maps',
      'Apply problem-solving frameworks',
      'Use the "debugging" approach to understand complex systems'
    ]
  },
  documentary: {
    tips: [
      'Focus on factual accuracy and evidence presented',
      'Analyze the narrative structure and storytelling techniques',
      'Consider multiple perspectives on the subject matter',
      'Research additional sources to verify claims',
      'Evaluate bias and objectivity in the presentation'
    ],
    learningStyles: {
      visual: 'Analyze visual evidence and data visualization',
      auditory: 'Focus on expert interviews and narration',
      kinesthetic: 'Create timelines or maps of events discussed'
    },
    memoryTechniques: [
      'Use chronological ordering of events',
      'Create fact sheets for key information',
      'Apply the "5 W\'s" method (Who, What, When, Where, Why)',
      'Use comparison charts for different viewpoints'
    ]
  },
  lecture: {
    tips: [
      'Focus on the main argument or thesis presented',
      'Identify supporting evidence and examples',
      'Note the logical flow of ideas and concepts',
      'Pay attention to key definitions and terminology',
      'Connect lecture content to broader academic context'
    ],
    learningStyles: {
      visual: 'Create hierarchical outlines of concepts',
      auditory: 'Summarize key points in your own words',
      kinesthetic: 'Create concept maps or flow diagrams'
    },
    memoryTechniques: [
      'Use the Cornell note-taking method',
      'Create mnemonics for key concepts',
      'Apply the "explain to a child" technique',
      'Use spaced repetition for long-term retention'
    ]
  },
  news: {
    tips: [
      'Evaluate the credibility of sources cited',
      'Analyze bias and perspective in reporting',
      'Compare coverage across different outlets',
      'Consider the broader context and historical background',
      'Identify the "angle" or perspective of the story'
    ],
    learningStyles: {
      visual: 'Create fact-checking checklists',
      auditory: 'Summarize the main points in your own words',
      kinesthetic: 'Create timelines of events mentioned'
    },
    memoryTechniques: [
      'Use the "inverted pyramid" structure for key facts',
      'Create source credibility matrices',
      'Apply the "multiple source" verification method',
      'Use critical thinking frameworks for media analysis'
    ]
  },
  music: {
    tips: [
      'Analyze musical elements: melody, harmony, rhythm, lyrics',
      'Consider cultural and historical context',
      'Examine production techniques and artistic choices',
      'Explore emotional and thematic content',
      'Connect to broader cultural movements or trends'
    ],
    learningStyles: {
      visual: 'Analyze music videos and visual elements',
      auditory: 'Focus on musical structure and patterns',
      kinesthetic: 'Move to the rhythm or create responses'
    },
    memoryTechniques: [
      'Use musical mnemonics and patterns',
      'Create lyrical analysis frameworks',
      'Associate melodies with concepts or emotions',
      'Use cultural context mapping'
    ]
  }
};

// Function to analyze content and detect type using Gemini's native video understanding
async function analyzeContent(videoUrl: string): Promise<ContentAnalysis> {
  let model = getModel(false); // Try primary model first
  
  const analysisPrompt = `Analyze this YouTube video and provide a comprehensive content analysis. Return ONLY a JSON object with these exact fields:

{
  "type": "educational" | "entertainment" | "tutorial" | "lecture" | "documentary" | "music" | "news" | "technical",
  "topics": ["topic1", "topic2", "topic3"],
  "complexity": "beginner" | "intermediate" | "advanced", 
  "format": "sequential" | "theoretical" | "practical" | "analytical",
  "confidence": 0.1-1.0,
  "speechDensity": "low" | "medium" | "high",
  "temporalPattern": "minimal_cuts" | "moderate_cuts" | "rapid_cuts",
  "engagementType": "educational" | "entertainment" | "mixed"
}

Analysis criteria:
- Content structure and presentation style
- Speech patterns and pacing (words per minute estimation)
- Visual editing patterns and scene changes
- Subject matter complexity and target audience
- Teaching or communication format

Speech density indicators:
- Low: 80-120 wpm (tutorials, demonstrations)
- Medium: 120-150 wpm (lectures, educational)
- High: 150-200+ wpm (entertainment, commentary)

Temporal patterns:
- Minimal cuts: Few scene changes (educational, lectures)
- Moderate cuts: Balanced pacing (documentaries, tutorials)
- Rapid cuts: Frequent changes (entertainment, music videos)

Be precise and return only the JSON object.`;

  try {
    let result;
    
    try {
      result = await model.generateContent([
        analysisPrompt,
        {
          fileData: {
            mimeType: 'text/plain',
            fileUri: videoUrl
          }
        }
      ]);
    } catch (error: any) {
      // If quota exceeded, try alternative model
      if (error.status === 429) {
        console.log('Primary model quota exceeded, trying alternative model...');
        try {
          model = getModel(true);
          result = await model.generateContent([
            analysisPrompt,
            {
              fileData: {
                mimeType: 'text/plain',
                fileUri: videoUrl
              }
            }
          ]);
        } catch (fallbackError: any) {
          console.log('Alternative model also failed:', fallbackError.message);
          throw error; // Throw original error for better debugging
        }
      } else {
        throw error;
      }
    }

    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const analysis = JSON.parse(jsonMatch[0]);
      
      // Validate the analysis structure
      if (analysis.type && analysis.complexity && analysis.format) {
        return analysis;
      }
    }
    
    // Fallback analysis based on Gemini's text response
    return {
      type: 'entertainment',
      topics: [],
      complexity: 'beginner',
      format: 'sequential',
      confidence: 0.5,
      speechDensity: 'high',
      temporalPattern: 'rapid_cuts',
      engagementType: 'entertainment'
    };
  } catch (error) {
    console.error('Content analysis error:', error);
    // Default fallback
    return {
      type: 'entertainment',
      topics: [],
      complexity: 'beginner',
      format: 'sequential',
      confidence: 0.3,
      speechDensity: 'high',
      temporalPattern: 'rapid_cuts',
      engagementType: 'entertainment'
    };
  }
}

// Templates are now imported from lib/templates

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { videoUrl, template } = body;

    // Basic validation
    if (!videoUrl || !template) {
      return NextResponse.json(
        { error: 'Missing videoUrl or template parameter' },
        { status: 400 }
      );
    }

    if (!videoUrl.includes('youtube.com') && !videoUrl.includes('youtu.be')) {
      return NextResponse.json(
        { error: 'Invalid YouTube URL' },
        { status: 400 }
      );
    }

    // Get template configuration
    const templateConfig = TEMPLATES.find(t => t.id === template);
    if (!templateConfig) {
      return NextResponse.json(
        { error: 'Invalid template type' },
        { status: 400 }
      );
    }



    // For study notes, analyze content type and use research-backed strategies
    let enhancedPrompt = templateConfig.prompt;
    
    // Chunked processing for high-token templates
    const useChunkedProcessing = template === 'study-notes' || template === 'presentation-slides';
    
    // Skip complex processing for basic summary to keep it simple and fast
    if (template === 'basic-summary') {
      // Use template prompt directly - no enhancements needed
      enhancedPrompt = templateConfig.prompt;
    } else if (template === 'study-notes') {
      try {
        // Analyze content type using Gemini's native video understanding
        const contentAnalysis = await analyzeContent(videoUrl);
        console.log('Content analysis result:', contentAnalysis);
        
        // Get appropriate strategies based on detected content type
        const strategies = STUDY_STRATEGIES[contentAnalysis.type as keyof typeof STUDY_STRATEGIES] || STUDY_STRATEGIES.educational;
        
        // Enhance prompt with research-backed content-specific strategies
        enhancedPrompt = enhancedPrompt
          .replace(
            '[Study methods tailored to this content type]',
            strategies.tips.map(tip => `- ${tip}`).join('\n')
          );
        
        // Add comprehensive content analysis insights based on research
        const analysisInsights = `**Content Analysis Insights:**
- **Type**: ${contentAnalysis.type} content
- **Complexity**: ${contentAnalysis.complexity} level
- **Format**: ${contentAnalysis.format} presentation
${contentAnalysis.speechDensity ? `- **Speech Density**: ${contentAnalysis.speechDensity} (${contentAnalysis.speechDensity === 'low' ? '80-120 wpm' : contentAnalysis.speechDensity === 'medium' ? '120-150 wpm' : '150-200+ wpm'})` : ''}
${contentAnalysis.temporalPattern ? `- **Visual Pattern**: ${contentAnalysis.temporalPattern} (${contentAnalysis.temporalPattern === 'minimal_cuts' ? 'few scene changes' : contentAnalysis.temporalPattern === 'moderate_cuts' ? 'balanced pacing' : 'frequent cuts'})` : ''}
- **Confidence**: ${Math.round((contentAnalysis.confidence || 0.5) * 100)}%
- **Optimal Review Frequency**: Based on content type and complexity`;
        
        enhancedPrompt = enhancedPrompt
          .replace(
            '**Study Notes** *(Research-Optimized Cornell Structure)*',
            `**Study Notes** *(Research-Optimized Cornell Structure)*\n\n${analysisInsights}`
          );
        
        // Adapt template based on research findings
        if (contentAnalysis.type === 'tutorial') {
          // Add sequential structure for tutorials
          enhancedPrompt = enhancedPrompt.replace(
            '**Core Concepts** *(3-5 main points at 150 words each)*',
            '**Sequential Steps** *(Numbered instructions with sub-steps)*'
          );
        } else if (contentAnalysis.type === 'documentary') {
          // Add thematic organization for documentaries
          enhancedPrompt = enhancedPrompt.replace(
            '**Core Concepts** *(3-5 main points at 150 words each)*',
            '**Thematic Analysis** *(Organized by themes rather than chronology)*'
          );
        } else if (contentAnalysis.type === 'entertainment') {
          // Add highlights focus for entertainment
          enhancedPrompt = enhancedPrompt.replace(
            '**Core Concepts** *(3-5 main points at 150 words each)*',
            '**Key Highlights** *(Memorable moments and memorable content)*'
          );
        }
          
      } catch (error) {
        console.error('Content analysis failed, using default strategies:', error);
        // Fallback to educational strategies with error note
        enhancedPrompt = enhancedPrompt
          .replace(
            '[Study methods tailored to this content type]',
            STUDY_STRATEGIES.educational.tips.map(tip => `- ${tip}`).join('\n')
          )
          .replace(
            '**Study Notes** *(Research-Optimized Cornell Structure)*',
            `**Study Notes** *(Research-Optimized Cornell Structure)*\n\n*Note: Content analysis unavailable - using default educational strategies*`
          );
      }
    }

    // Chunked processing for high-token templates
    if (useChunkedProcessing) {
      console.log('Using chunked processing for', template);
      const chunkedContent = await processVideoInChunks(videoUrl, enhancedPrompt, template);
      
      return NextResponse.json({
        success: true,
        content: chunkedContent,
        template: template,
        title: templateConfig.name,
        videoUrl: videoUrl
      });
    }

    // Create the prompt for Gemini - use template prompt directly
    const prompt = enhancedPrompt;

    // Process with Gemini 2.5 Flash
    let model = getModel(false);
    let result;
    
    try {
      result = await model.generateContent([
        prompt,
        {
          fileData: {
            mimeType: 'text/plain',
            fileUri: videoUrl
          }
        }
      ]);
    } catch (error: any) {
      // If quota exceeded or token limit exceeded, try alternative model
      if (error.status === 429 || (error.status === 400 && error.message.includes('token count'))) {
        console.log('Primary model issue, trying alternative model...');
        try {
          model = getModel(true);
          result = await model.generateContent([
            prompt,
            {
              fileData: {
                mimeType: 'text/plain',
                fileUri: videoUrl
              }
            }
          ]);
        } catch (fallbackError: any) {
          console.log('Alternative model also failed:', fallbackError.message);
          throw error; // Throw original error for better debugging
        }
      } else {
        throw error;
      }
    }

    const response = await result.response;
    const text = response.text();

    // Validate that we got actual content, not the raw template
    if (!text || text.trim().length === 0) {
      throw new Error('Invalid response: Empty or missing content');
    }
    
    // Check if we received the raw template instead of processed content
    // Only throw error if it's clearly the raw template with placeholders
    const hasPlaceholders = text.includes('Replace all placeholder text in brackets') && 
                           text.includes('STRICT INSTRUCTION:') && 
                           text.includes('Create the following format EXACTLY');
    
    if (hasPlaceholders) {
      throw new Error('Invalid response: Received template prompt instead of processed content');
    }

    // Return the processed content
    return NextResponse.json({
      success: true,
      content: text,
      template: template,
      title: templateConfig.name,
      videoUrl: videoUrl
    });

  } catch (error) {
    console.error('Video processing error:', error);
    
    // Handle specific API quota errors
    if (error instanceof Error && error.message.includes('429 Too Many Requests')) {
      return NextResponse.json(
        { 
          error: 'API quota exceeded',
          details: 'You have exceeded your daily or per-minute API limits. Please: 1) Wait 1 hour before retrying, 2) Check your Google Cloud Console billing status, 3) Consider upgrading your quota limits.',
          retryAfter: '1 hour',
          quotaType: 'daily/per-minute limits'
        },
        { status: 429 }
      );
    }
    
    // Handle invalid content errors
    if (error instanceof Error && error.message.includes('Invalid response')) {
      return NextResponse.json(
        { 
          error: 'Content processing failed',
          details: 'The video content could not be processed properly. Please try a different video or template.',
          retry: true
        },
        { status: 422 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to process video',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
