import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { TEMPLATES } from '@/lib/templates';
import type { Template } from '@/lib/templates';
import { validateVideoUrl } from '@/lib/validation';
import { getApiSessionWithDatabase } from '@/lib/auth-utils';
import { reserveUsage } from '@/lib/subscription/service';
import { convertTimestampsToLinks } from '@/lib/timestamps/utils';
import { NotesService } from '@/lib/services/notes';
import { geminiClient } from '@/lib/gemini/client';

// Async processing route for long videos with streaming response
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

// Video duration thresholds (in seconds)
const DURATION_THRESHOLDS = {
  SHORT: 600,    // 10 minutes
  MEDIUM: 1800,  // 30 minutes  
  LONG: 3600,    // 1 hour
  VERY_LONG: 7200 // 2 hours
};

// Chunk processing for long videos
async function processVideoInChunks(
  videoUrl: string,
  template: Template,
  estimatedDuration: number,
  userId: string
): Promise<ReadableStream> {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);
  
  // Determine chunk strategy based on video length
  let chunkStrategy;
  if (estimatedDuration <= DURATION_THRESHOLDS.MEDIUM) {
    chunkStrategy = { chunks: 1, model: 'gemini-2.0-flash-exp', maxTokens: 32768 };
  } else if (estimatedDuration <= DURATION_THRESHOLDS.LONG) {
    chunkStrategy = { chunks: 2, model: 'gemini-1.5-flash-8b', maxTokens: 8000 };
  } else {
    chunkStrategy = { chunks: 4, model: 'gemini-1.5-flash-8b', maxTokens: 4000 };
  }

  const needsRichVideo = template.id === 'tutorial-guide' || template.id === 'presentation-slides';
  const primaryModel = needsRichVideo ? 'gemini-2.0-flash-exp' : 'gemini-1.5-flash-8b';
  chunkStrategy.model = primaryModel;
  chunkStrategy.maxTokens = primaryModel.includes('flash-8b')
    ? Math.min(chunkStrategy.maxTokens, 8000)
    : 32768;

  const model = genAI.getGenerativeModel({ 
    model: chunkStrategy.model,
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: chunkStrategy.maxTokens,
    }
  });

  return new ReadableStream({
    async start(controller) {
      try {
        controller.enqueue(new TextEncoder().encode(
          `data: ${JSON.stringify({ 
            type: 'status', 
            message: `Processing ${estimatedDuration > 3600 ? 'long' : 'standard'} video in ${chunkStrategy.chunks} chunk(s)...`,
            progress: 10
          })}\n\n`
        ));

        if (chunkStrategy.chunks === 1) {
          await processSingleChunk(controller, model, videoUrl, template, estimatedDuration, userId);
        } else {
          await processMultipleChunks(controller, model, videoUrl, template, chunkStrategy.chunks, estimatedDuration, userId);
        }

        // Usage already tracked via atomic reservation system
        console.log('✅ Usage tracking completed via atomic reservation system');

        controller.enqueue(new TextEncoder().encode(
          `data: ${JSON.stringify({ type: 'complete', progress: 100 })}\n\n`
        ));
        
        controller.close();
      } catch (error: any) {
        console.error('❌ Streaming processing error', error);

        if (isCredentialError(error) || isQuotaError(error)) {
          if (isQuotaError(error)) {
            console.warn('⚠️ Gemini quota hit, falling back to synchronous processing path.');
          } else {
            console.warn('⚠️ Gemini credential restriction encountered, switching to synchronous fallback pipeline.');
          }
          await processWithSynchronousFallback({
            controller,
            videoUrl,
            template,
            userId,
          });
          return;
        }

        controller.enqueue(new TextEncoder().encode(
          `data: ${JSON.stringify({ 
            type: 'error', 
            message: error.message,
            details: 'Processing failed - this may be due to video length or content restrictions'
          })}\n\n`
        ));
        controller.close();
      }
    }
  });
}

async function processSingleChunk(
  controller: ReadableStreamDefaultController,
  model: any,
  videoUrl: string,
  template: Template,
  estimatedDuration: number,
  userId: string
) {
  controller.enqueue(new TextEncoder().encode(
    `data: ${JSON.stringify({ type: 'status', message: 'Analyzing video content...', progress: 30 })}\n\n`
  ));

  const prompt = buildTemplatePrompt(template, estimatedDuration, videoUrl);

  const generation = await model.generateContent([
    prompt,
    {
      fileData: {
        mimeType: 'video/*',
        fileUri: videoUrl
      }
    }
  ]);

  const response = await generation.response;
  const tokenUsage = response.usageMetadata?.totalTokenCount;
  const rawContent = await response.text();
  const verbosityLevels = await createVerbosityLevels(rawContent, videoUrl);
  const content = verbosityLevels.standard;

  const noteId = await autoSaveGeneratedNote({
    userId,
    videoUrl,
    templateId: template.id,
    verbosityLevels,
  });

  controller.enqueue(new TextEncoder().encode(
    `data: ${JSON.stringify({ type: 'status', message: 'Generating content...', progress: 70 })}\n\n`
  ));

  controller.enqueue(new TextEncoder().encode(
    `data: ${JSON.stringify({ 
      type: 'result',
      template: template.id,
      progress: 90,
      result: buildStreamResultPayload({
        content,
        templateId: template.id,
        videoUrl,
        tokenUsage,
        chunkInfo: { mode: 'single' },
        verbosityLevels,
        noteId,
      })
    })}\n\n`
  ));

  console.log(`✅ Streaming result generated (single chunk) for template ${template.id}`);
}

async function processMultipleChunks(
  controller: ReadableStreamDefaultController,
  model: any,
  videoUrl: string,
  template: Template,
  chunkCount: number,
  estimatedDuration: number,
  userId: string
) {
  const chunks = [];
  
  for (let i = 0; i < chunkCount; i++) {
    const progress = 20 + (i * 60 / chunkCount);
    controller.enqueue(new TextEncoder().encode(
      `data: ${JSON.stringify({ 
        type: 'status', 
        message: `Processing chunk ${i + 1} of ${chunkCount}...`, 
        progress 
      })}\n\n`
    ));

    // Create chunk-specific prompts
    const chunkPrompt = createChunkPrompt(template, i, chunkCount, estimatedDuration, videoUrl);
    
    try {
      const generation = await model.generateContent([
        chunkPrompt,
        {
          fileData: {
            mimeType: 'video/*',
            fileUri: videoUrl
          }
        }
      ]);

      const response = await generation.response;
      const chunkContent = await response.text();
      chunks.push({
        index: i,
        content: chunkContent,
        timestamp: Date.now()
      });

      // Add delay between chunks to avoid rate limiting
      if (i < chunkCount - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error: any) {
      console.error(`Chunk ${i + 1} processing failed:`, error);
      chunks.push({
        index: i,
        content: `[Chunk ${i + 1} processing failed: ${error.message}]`,
        timestamp: Date.now()
      });
    }
  }

  // Combine chunks
  controller.enqueue(new TextEncoder().encode(
    `data: ${JSON.stringify({ type: 'status', message: 'Combining results...', progress: 85 })}\n\n`
  ));

  const combinedRawContent = await combineChunks(chunks, template);
  const verbosityLevels = await createVerbosityLevels(combinedRawContent, videoUrl);
  const combinedContent = verbosityLevels.standard;

  const noteId = await autoSaveGeneratedNote({
    userId,
    videoUrl,
    templateId: template.id,
    verbosityLevels,
  });
  
  controller.enqueue(new TextEncoder().encode(
    `data: ${JSON.stringify({ 
      type: 'result',
      template: template.id,
      chunks: chunks.length,
      progress: 95,
      result: buildStreamResultPayload({
        content: combinedContent,
        templateId: template.id,
        videoUrl,
        chunkInfo: { mode: 'chunked', chunks: chunks.length },
        verbosityLevels,
        noteId,
      })
    })}\n\n`
  ));

  console.log(`✅ Streaming result generated (${chunks.length} chunks) for template ${template.id}`);
}

function createChunkPrompt(
  template: Template,
  chunkIndex: number,
  totalChunks: number,
  estimatedDuration: number,
  videoUrl?: string
): string {
  const basePrompt = buildTemplatePrompt(template, estimatedDuration, videoUrl);
  const chunkInstructions = {
    0: `Focus on the introduction and first major section. ${basePrompt}`,
    1: `Focus on the middle content and main concepts. ${basePrompt}`,
    2: `Focus on the later content and key conclusions. ${basePrompt}`,
    3: `Focus on the final sections and summary points. ${basePrompt}`
  };

  const instruction = chunkInstructions[chunkIndex as keyof typeof chunkInstructions] || 
    `Focus on section ${chunkIndex + 1} of ${totalChunks}. ${basePrompt}`;

  return `${instruction}

IMPORTANT: This is part ${chunkIndex + 1} of ${totalChunks} chunks. Focus on your assigned section but maintain context awareness. Ensure your response can be combined with other chunks into a cohesive whole.

Return content that starts with "**Part ${chunkIndex + 1}:**" to help with organization.`;
}

async function combineChunks(chunks: any[], template: any): Promise<string> {
  // Sort chunks by index to ensure proper order
  chunks.sort((a, b) => a.index - b.index);
  
  // Combine with appropriate formatting
  const header = `**${template.name}**\n\n`;
  const combinedParts = chunks
    .map(chunk => chunk.content)
    .join('\n\n---\n\n');
  
  return `${header}${combinedParts}

---

*Note: This content was processed in ${chunks.length} parts for optimal performance with long-form video content.*`;
}

function buildStreamResultPayload({
  content,
  templateId,
  videoUrl,
  tokenUsage,
  chunkInfo,
  verbosityLevels,
  processingMethod,
  dataSourcesUsed,
  noteId,
}: {
  content: string;
  templateId: string;
  videoUrl: string;
  tokenUsage?: number;
  chunkInfo?: {
    mode: 'single' | 'chunked' | 'fallback';
    chunks?: number;
  };
  verbosityLevels?: {
    brief: string;
    standard: string;
    comprehensive: string;
  };
  processingMethod?: string;
  dataSourcesUsed?: string[];
  noteId?: string;
}) {
  const allVerbosityLevels = verbosityLevels || {
    brief: content,
    standard: content,
    comprehensive: content,
  };

  return {
    title: `Notes from ${videoUrl}`,
    template: templateId,
    content,
    processingMethod: processingMethod || 'async-stream',
    dataSourcesUsed: dataSourcesUsed || ['Gemini Streaming'],
    tokensUsed: tokenUsage,
    allVerbosityLevels,
    selectedVerbosity: 'standard',
    noteId,
    metadata: {
      videoUrl,
      mode: chunkInfo?.mode,
      chunks: chunkInfo?.chunks,
    },
  };
}

function buildTemplatePrompt(
  template: Template,
  durationSeconds?: number,
  videoUrl?: string
): string {
  const defaultVerbosity: 'standard' = 'standard';
  const defaultDomain: 'general' = 'general';

  if (typeof template.prompt === 'function') {
    try {
      if ((template as any).supportsDomainDetection) {
        return (template.prompt as (duration?: number, verbosity?: any, domain?: any, videoUrl?: string) => string)(
          durationSeconds,
          defaultVerbosity,
          defaultDomain,
          videoUrl
        );
      }

      if ((template as any).supportsVerbosity) {
        return (template.prompt as (duration?: number, verbosity?: any) => string)(
          durationSeconds,
          defaultVerbosity
        );
      }

      return (template.prompt as (duration?: number) => string)(durationSeconds);
    } catch (error) {
      console.warn('buildTemplatePrompt: failed to generate dynamic prompt, falling back to string', error);
    }
  }

  return typeof template.prompt === 'string'
    ? template.prompt
    : 'Generate comprehensive notes for the provided video using the target template.';
}

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
    const brief = await generateWithFallback(genAI, generatePrompt('brief'));
    const standard = await generateWithFallback(genAI, generatePrompt('standard'));
    const comprehensive = await generateWithFallback(genAI, generatePrompt('comprehensive'));

    return { brief, standard, comprehensive };
  } catch (error) {
    console.error('Error generating text-based verbosity levels', error);
    return createHeuristicVerbosityLevels(originalContent);
  }
}

async function createVerbosityLevels(originalContent: string, videoUrl: string) {
  try {
    const levels = await generateVerbosityFromText(originalContent);
    return {
      brief: convertTimestampsToLinks(levels.brief, videoUrl),
      standard: convertTimestampsToLinks(levels.standard, videoUrl),
      comprehensive: convertTimestampsToLinks(levels.comprehensive, videoUrl),
    };
  } catch (error) {
    console.warn('Verbosity level generation failed, falling back to heuristic content', error);
    const fallbackLevels = createHeuristicVerbosityLevels(originalContent);
    return {
      brief: convertTimestampsToLinks(fallbackLevels.brief, videoUrl),
      standard: convertTimestampsToLinks(fallbackLevels.standard, videoUrl),
      comprehensive: convertTimestampsToLinks(fallbackLevels.comprehensive, videoUrl),
    };
  }
}

async function generateWithFallback(genAI: GoogleGenerativeAI, prompt: string): Promise<string> {
  const models = [
    'gemini-2.0-flash-exp',
    'gemini-1.5-flash-8b',
    'gemini-1.5-pro'
  ];

  for (const modelName of models) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: { temperature: 0.1, maxOutputTokens: 3000 },
      });

      const result = await model.generateContent(prompt);
      const text = await result.response.text();

      if (text && text.trim().length > 0) {
        return text;
      }
    } catch (error: any) {
      const message = String(error?.message || '');
      if (error?.status === 429 || message.includes('quota')) {
        console.warn(`Verbosity generation quota reached for ${modelName}, retrying with fallback model...`);
      } else {
        console.warn(`Verbosity generation failed on ${modelName}:`, message || error);
      }
    }
  }

  throw new Error('All verbosity generation models failed');
}

function createHeuristicVerbosityLevels(originalContent: string) {
  const lines = originalContent.split('\n');

  const briefLines: string[] = [];

  let capturedForHeading = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (/^#{2,3}\s/.test(trimmed)) {
      briefLines.push(trimmed);
      capturedForHeading = false;
      continue;
    }

    if (!capturedForHeading && (/^[-*]\s/.test(trimmed) || trimmed.length > 60)) {
      briefLines.push(line);
      capturedForHeading = true;
    }
  }

  const summarySection = ['## Key Takeaways', ...briefLines.slice(0, 20)];
  const deepDiveSection = [
    '\n## Deep Dive Enhancements',
    'Augment each primary step with implementation details, risks, and success metrics:',
    ...lines
      .filter(line => /^[-*]\s+/.test(line.trim()))
      .slice(0, 12)
      .map(line => `${line} — Add supporting data points, tooling choices, and follow-up questions.`),
  ];

  return {
    brief: summarySection.join('\n'),
    standard: originalContent,
    comprehensive: `${originalContent}\n\n${deepDiveSection.join('\n')}`,
  };
}

async function autoSaveGeneratedNote({
  userId,
  videoUrl,
  templateId,
  verbosityLevels,
}: {
  userId: string;
  videoUrl: string;
  templateId: string;
  verbosityLevels: { brief: string; standard: string; comprehensive: string };
}): Promise<string | undefined> {
  try {
    const saveResult = await NotesService.saveNote({
      userId,
      youtubeUrl: videoUrl,
      title: `Notes from ${videoUrl}`,
      content: verbosityLevels.standard,
      templateId,
      verbosityVersions: {
        brief: verbosityLevels.brief,
        standard: verbosityLevels.standard,
        comprehensive: verbosityLevels.comprehensive,
      },
    });

    if (!saveResult.success) {
      console.warn('Auto-save failed in streaming route', { error: saveResult.error, templateId, videoUrl });
      return undefined;
    }
    return saveResult.noteId;
  } catch (error) {
    console.error('Unexpected auto-save error in streaming route', error);
    return undefined;
  }
}

function isCredentialError(error: any): boolean {
  if (!error) return false;
  const message = typeof error.message === 'string' ? error.message : '';
  const status = typeof error.status === 'number' ? error.status : undefined;
  return status === 400 && message.includes('Requires valid user credentials');
}

function isQuotaError(error: any): boolean {
  if (!error) return false;
  const message = typeof error.message === 'string' ? error.message : '';
  const status = typeof error.status === 'number' ? error.status : undefined;
  return status === 429 || message.includes('Too Many Requests') || message.includes('quota');
}

async function processWithSynchronousFallback({
  controller,
  videoUrl,
  template,
  userId,
}: {
  controller: ReadableStreamDefaultController;
  videoUrl: string;
  template: Template;
  userId: string;
}) {
  controller.enqueue(new TextEncoder().encode(
    `data: ${JSON.stringify({
      type: 'status',
      message: 'Switching to reliability mode — generating transcript-backed notes...',
      progress: 35,
    })}\n\n`
  ));

  try {
    const processingResult = await geminiClient.processVideo({
      youtubeUrl: videoUrl,
      template,
      userId,
      processingMode: 'auto',
    });

    if (processingResult.status === 'failed' || !processingResult.result) {
      throw new Error(processingResult.error || 'Fallback processing failed');
    }

    const verbosityLevels = await createVerbosityLevels(processingResult.result, videoUrl);
    const noteContent = verbosityLevels.standard;
    const dataSourcesUsed = processingResult.metadata?.dataSourcesUsed || ['Gemini Hybrid'];
    const processingMethod = processingResult.metadata?.processingMethod || 'sync-fallback';

    const fallbackNoteId = await autoSaveGeneratedNote({
      userId,
      videoUrl,
      templateId: template.id,
      verbosityLevels,
    });

    controller.enqueue(new TextEncoder().encode(
      `data: ${JSON.stringify({
        type: 'status',
        message: 'Finalizing notes...',
        progress: 85,
      })}\n\n`
    ));

    controller.enqueue(new TextEncoder().encode(
      `data: ${JSON.stringify({
        type: 'result',
        template: template.id,
        progress: 95,
        result: buildStreamResultPayload({
          content: noteContent,
          templateId: template.id,
          videoUrl,
          tokenUsage: processingResult.tokenUsage,
        chunkInfo: { mode: 'fallback' },
        verbosityLevels,
        processingMethod,
        dataSourcesUsed,
        noteId: fallbackNoteId,
      }),
    })}\n\n`
  ));

    controller.enqueue(new TextEncoder().encode(
      `data: ${JSON.stringify({ type: 'complete', progress: 100 })}\n\n`
    ));

    controller.close();
  } catch (fallbackError: any) {
    console.error('❌ Fallback processing error', fallbackError);
    controller.enqueue(new TextEncoder().encode(
      `data: ${JSON.stringify({
        type: 'error',
        message: fallbackError.message || 'Fallback processing failed',
        details: 'The backup processing pipeline was unable to complete.',
      })}\n\n`
    ));
    controller.close();
  }
}

// Estimate video duration from URL (placeholder - would integrate with YouTube API)
async function estimateVideoDuration(videoUrl: string): Promise<number> {
  // This would typically use YouTube Data API to get actual duration
  // For now, return a conservative estimate based on URL patterns or assume long
  
  // Check if URL suggests a long video (playlist, livestream, etc.)
  if (videoUrl.includes('list=') || videoUrl.includes('live')) {
    return DURATION_THRESHOLDS.VERY_LONG;
  }
  
  // Default to medium length for unknown videos
  return DURATION_THRESHOLDS.MEDIUM;
}

export async function POST(request: NextRequest) {
  try {
    const { videoUrl, selectedTemplate = 'basic-summary', forceAsync = false } = await request.json();

    // 🔒 SECURITY: Require authentication - no anonymous processing
    const session = await getApiSessionWithDatabase(request);
    if (!session?.user?.id) {
      return NextResponse.json({
        error: 'Authentication required',
        details: 'You must be signed in to process videos'
      }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // 🔒 SECURITY: Reserve usage atomically to prevent race conditions
    const usageReservation = await reserveUsage(userId, 'generate_note', 1);
    if (!usageReservation.success) {
      return NextResponse.json({
        error: 'Note generation limit reached',
        details: usageReservation.reason,
        resetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString()
      }, { status: 429 });
    }

    // Validate video URL
    const urlValidation = validateVideoUrl(videoUrl);
    if (!urlValidation.isValid) {
      return NextResponse.json({ error: urlValidation.error }, { status: 400 });
    }

    const template = TEMPLATES.find(t => t.id === selectedTemplate);
    if (!template) {
      return NextResponse.json({ error: 'Invalid template selected' }, { status: 400 });
    }

    // Estimate video duration to determine processing strategy
    const estimatedDuration = await estimateVideoDuration(videoUrl);
    const isLongVideo = estimatedDuration > DURATION_THRESHOLDS.SHORT || forceAsync;

    console.log(`Processing ${isLongVideo ? 'long' : 'standard'} video (est. ${estimatedDuration}s) with template:`, selectedTemplate);

    if (!isLongVideo) {
      // For short videos, redirect to standard processing
      return NextResponse.json({ 
        redirect: '/api/videos/process',
        message: 'Video is suitable for standard processing'
      });
    }

    // Create streaming response for long videos
    const stream = await processVideoInChunks(videoUrl, template, estimatedDuration, userId);

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });

  } catch (error: any) {
    console.error('Async video processing error:', error);
    
    return NextResponse.json({ 
      error: 'Failed to process video asynchronously',
      details: error.message,
      suggestion: 'Try using the standard processing endpoint for shorter videos'
    }, { status: 500 });
  }
}
