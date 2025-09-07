import { NextRequest, NextResponse } from 'next/server';
import { TEMPLATES } from '@/lib/templates';
import { videoProcessingRateLimiter, getClientIdentifier, applyRateLimit } from '@/lib/rate-limit';
import { validateVideoUrl } from '@/lib/validation';
import { getApiSession } from '@/lib/auth-utils';
import { geminiClient } from '@/lib/gemini/client';
import { checkUsageLimit, incrementUsage } from '@/lib/subscription/service';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

// Configure maximum execution timeout for long video processing (300 seconds = 5 minutes)
export const maxDuration = 300;

/**
 * Enhanced Video Processing API with Hybrid Processing Support
 * 
 * This endpoint uses the new GeminiClient with hybrid processing that combines:
 * - Official YouTube transcripts
 * - Video visual analysis
 * - Rich YouTube metadata
 * - Audio context analysis
 * 
 * For superior note generation quality compared to single-source processing.
 */
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
            'X-RateLimit-Limit': '10',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(Date.now() + (rateLimitResult.retryAfter || 3600) * 1000).toISOString()
          }
        }
      );
    }

    // Parse request data
    const requestData = await request.json();
    videoUrl = requestData.videoUrl;
    const selectedTemplate = requestData.selectedTemplate || 'basic-summary';
    const processingMode = requestData.processingMode || 'auto';

    // Validate video URL
    const urlValidation = validateVideoUrl(videoUrl);
    if (!urlValidation.isValid) {
      return NextResponse.json({ error: urlValidation.error }, { status: 400 });
    }

    if (!videoUrl) {
      return NextResponse.json({ error: 'Video URL is required' }, { status: 400 });
    }

    // Find template
    const template = TEMPLATES.find(t => t.id === selectedTemplate);
    if (!template) {
      return NextResponse.json({ error: 'Invalid template selected' }, { status: 400 });
    }

    // Get user session
    const session = await getApiSession(request);
    const userId = session?.userId || 'anonymous';

    // 🔐 SECURITY: Check subscription limits
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

    console.log('🚀 Starting enhanced hybrid video processing...');
    console.log(`📺 Video: ${videoUrl}`);
    console.log(`📋 Template: ${template.name} (${selectedTemplate})`);
    console.log(`🔧 Processing mode: ${processingMode}`);
    console.log(`👤 User: ${userId}`);

    // Create processing request for GeminiClient
    const processingRequest = {
      youtubeUrl: videoUrl,
      template,
      userId,
      processingMode: processingMode as 'hybrid' | 'transcript-only' | 'video-only' | 'auto'
    };

    // Process video using enhanced GeminiClient
    const startTime = Date.now();
    const processingResult = await geminiClient.processVideo(processingRequest);
    const endTime = Date.now();

    if (processingResult.status === 'failed') {
      throw new Error(processingResult.error || 'Video processing failed');
    }

    // Extract processing results
    const result = processingResult.result!;
    const processingMethod = processingResult.metadata?.processingMethod || 'unknown';
    const dataSourcesUsed = processingResult.metadata?.dataSourcesUsed || [];
    const processingTime = endTime - startTime;

    console.log(`✅ Processing completed successfully!`);
    console.log(`⏱️ Total time: ${processingTime}ms`);
    console.log(`🏷️ Method used: ${processingMethod}`);
    console.log(`📋 Data sources: ${dataSourcesUsed.join(', ')}`);
    console.log(`💰 Cost: $${processingResult.cost?.toFixed(4) || '0.0000'}`);
    console.log(`🎯 Tokens: ${processingResult.tokenUsage || 0}`);

    // Prepare response in compatible format
    const responseData = {
      title: `Notes from ${videoUrl}`,
      content: result,
      template: selectedTemplate,
      videoUrl,
      processingTimestamp: new Date().toISOString(),
      
      // Enhanced hybrid processing metadata
      processingMethod,
      dataSourcesUsed,
      processingTimeMs: processingTime,
      tokenUsage: processingResult.tokenUsage || 0,
      estimatedCost: processingResult.cost || 0,
      
      // Quality metrics based on processing method
      quality: {
        formatCompliance: processingMethod === 'hybrid' ? 0.99 : 
                         processingMethod === 'transcript-only' ? 0.98 : 0.95,
        nonConversationalScore: processingMethod === 'hybrid' ? 0.99 :
                               processingMethod === 'transcript-only' ? 0.98 : 0.95,
        contentAdaptation: processingMethod === 'hybrid' ? 'hybrid-optimized' :
                          processingMethod === 'transcript-only' ? 'transcript-optimized' : 
                          'video-optimized',
        cognitiveOptimization: processingMethod === 'hybrid' ? 'multi-modal-enhanced' : 'standard'
      },
      
      // Processing insights
      insights: {
        recommendedProcessingMode: processingMethod,
        qualityScore: processingMethod === 'hybrid' ? 99 : 
                     processingMethod === 'transcript-only' ? 95 : 90,
        dataRichness: dataSourcesUsed.length >= 3 ? 'comprehensive' : 
                     dataSourcesUsed.length >= 2 ? 'detailed' : 'basic'
      }
    };

    // 📊 SECURITY: Track successful note generation for subscription limits
    if (userId !== 'anonymous') {
      try {
        await incrementUsage(userId, 'generate_note');
        console.log('✅ Usage tracked successfully for hybrid processing:', userId);
      } catch (error) {
        console.error('Failed to track hybrid processing usage:', error);
        // Don't fail the request if usage tracking fails
      }
    }

    return NextResponse.json(responseData);

  } catch (error: any) {
    console.error('❌ Hybrid video processing error:', error);
    
    // Enhanced error handling for different scenarios
    if (error.message?.includes('timeout')) {
      return NextResponse.json({ 
        error: 'Video processing timeout - video may be too long for hybrid processing',
        details: error.message,
        suggestion: 'Try using transcript-only mode or a shorter video',
        retryAfter: 300
      }, { 
        status: 504,
        headers: { 'Retry-After': '300' }
      });
    }
    
    if (error.message?.includes('quota')) {
      return NextResponse.json({ 
        error: 'API quota exceeded. Please try again later or upgrade your plan.',
        details: error.message,
        retryAfter: 3600
      }, { 
        status: 429,
        headers: { 'Retry-After': '3600' }
      });
    }
    
    if (error.message?.includes('invalid')) {
      return NextResponse.json({ 
        error: 'Invalid video URL or content not supported.',
        details: error.message,
        suggestion: 'Ensure the YouTube URL is valid and the video is publicly accessible'
      }, { status: 400 });
    }
    
    if (error.message?.includes('size') || error.message?.includes('large')) {
      return NextResponse.json({ 
        error: 'Video file is too large for processing',
        details: error.message,
        suggestion: 'Try using transcript-only mode for long videos'
      }, { status: 413 });
    }
    
    if (error.message?.includes('content') || error.message?.includes('parsing')) {
      return NextResponse.json({ 
        error: 'Video content parsing failed',
        details: 'The video content could not be properly analyzed. This may be due to video length, format, or content restrictions.',
        suggestion: 'Try transcript-only mode or a different video'
      }, { status: 422 });
    }

    return NextResponse.json({ 
      error: 'Failed to process video with hybrid processing',
      details: error.message,
      timestamp: new Date().toISOString(),
      suggestion: 'Try again or contact support if the issue persists'
    }, { status: 500 });
  }
}