import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { TEMPLATES } from '@/lib/templates';
import { validateVideoUrl } from '@/lib/validation';
import { getApiSession } from '@/lib/auth-utils';
import { checkUsageLimit, incrementUsage } from '@/lib/subscription/service';

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
  template: any, 
  estimatedDuration: number,
  userId: string
): Promise<ReadableStream> {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);
  
  // Determine chunk strategy based on video length
  let chunkStrategy;
  if (estimatedDuration <= DURATION_THRESHOLDS.MEDIUM) {
    chunkStrategy = { chunks: 1, model: 'gemini-2.0-flash-exp', maxTokens: 32768 };
  } else if (estimatedDuration <= DURATION_THRESHOLDS.LONG) {
    chunkStrategy = { chunks: 2, model: 'gemini-1.5-flash', maxTokens: 8192 };
  } else {
    chunkStrategy = { chunks: 4, model: 'gemini-1.5-flash', maxTokens: 4096 };
  }

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
          // Single chunk processing for shorter videos
          await processSingleChunk(controller, model, videoUrl, template);
        } else {
          // Multi-chunk processing for long videos
          await processMultipleChunks(controller, model, videoUrl, template, chunkStrategy.chunks);
        }

        // 📊 SECURITY: Track successful note generation for subscription limits
        if (userId !== 'anonymous') {
          try {
            await incrementUsage(userId, 'generate_note');
            console.log('✅ Usage tracked successfully for async processing:', userId);
          } catch (error) {
            console.error('Failed to track async processing usage:', error);
            // Don't fail the request if usage tracking fails
          }
        }

        controller.enqueue(new TextEncoder().encode(
          `data: ${JSON.stringify({ type: 'complete', progress: 100 })}\n\n`
        ));
        
        controller.close();
      } catch (error: any) {
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
  template: any
) {
  controller.enqueue(new TextEncoder().encode(
    `data: ${JSON.stringify({ type: 'status', message: 'Analyzing video content...', progress: 30 })}\n\n`
  ));

  const result = await model.generateContent([
    template.prompt,
    {
      fileData: {
        mimeType: 'video/*',
        fileUri: videoUrl
      }
    }
  ]);

  controller.enqueue(new TextEncoder().encode(
    `data: ${JSON.stringify({ type: 'status', message: 'Generating content...', progress: 70 })}\n\n`
  ));

  const content = await result.response.text();
  
  controller.enqueue(new TextEncoder().encode(
    `data: ${JSON.stringify({ 
      type: 'result', 
      content,
      template: template.id,
      progress: 90
    })}\n\n`
  ));
}

async function processMultipleChunks(
  controller: ReadableStreamDefaultController,
  model: any,
  videoUrl: string,
  template: any,
  chunkCount: number
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
    const chunkPrompt = createChunkPrompt(template, i, chunkCount);
    
    try {
      const result = await model.generateContent([
        chunkPrompt,
        {
          fileData: {
            mimeType: 'video/*',
            fileUri: videoUrl
          }
        }
      ]);

      const chunkContent = await result.response.text();
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

  const combinedContent = await combineChunks(chunks, template);
  
  controller.enqueue(new TextEncoder().encode(
    `data: ${JSON.stringify({ 
      type: 'result', 
      content: combinedContent,
      template: template.id,
      chunks: chunks.length,
      progress: 95
    })}\n\n`
  ));
}

function createChunkPrompt(template: any, chunkIndex: number, totalChunks: number): string {
  const chunkInstructions = {
    0: `Focus on the introduction and first major section. ${template.prompt}`,
    1: `Focus on the middle content and main concepts. ${template.prompt}`,
    2: `Focus on the later content and key conclusions. ${template.prompt}`,
    3: `Focus on the final sections and summary points. ${template.prompt}`
  };

  const instruction = chunkInstructions[chunkIndex as keyof typeof chunkInstructions] || 
    `Focus on section ${chunkIndex + 1} of ${totalChunks}. ${template.prompt}`;

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

    // 🔐 SECURITY: Check authentication and subscription limits
    const session = await getApiSession(request);
    const userId = session?.userId || 'anonymous';
    
    // Check if user can generate notes (subscription limits)
    if (userId !== 'anonymous') {
      const limitCheck = await checkUsageLimit(userId, 'generate_note');
      if (!limitCheck.allowed) {
        return NextResponse.json({
          error: 'Note generation limit reached',
          details: limitCheck.reason,
          limit: limitCheck.limit,
          current: limitCheck.current,
          resetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString()
        }, { status: 429 });
      }
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