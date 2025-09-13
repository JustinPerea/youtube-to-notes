/**

// Force this route to be dynamic to prevent static generation
export const dynamic = 'force-dynamic';
 * API route for comprehensive video analysis
 * Processes videos with enhanced analysis for chatbot context
 */

import { NextRequest, NextResponse } from 'next/server';
import { getApiSession } from '@/lib/auth-utils';
import { geminiClient } from '@/lib/gemini/client';
import { db } from '@/lib/db/drizzle';
import { videos, videoAnalysis } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { EnhancedProcessingRequest } from '@/lib/types/enhanced-video-analysis';
import { checkUsageLimit, incrementUsage } from '@/lib/subscription/service';

export async function POST(request: NextRequest) {
  try {
    console.log('🔑 Starting comprehensive analysis with authentication check...');
    
    // Check authentication
    const session = await getApiSession(request);
    console.log('AUTH STATUS:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      hasEmail: !!session?.user?.email,
      userEmail: session?.user?.email
    });
    
    if (!session?.user?.email) {
      console.error('❌ Authentication failed - no valid session or email');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // 🔐 SECURITY: Check subscription limits
    const userId = session.user.email; // Use email as userId for comprehensive analysis
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

    // Parse request body
    const body = await request.json();
    const { youtubeUrl, videoId, requestedTemplates = ['basic-summary', 'study-notes'] } = body;

    if (!youtubeUrl || !videoId) {
      return NextResponse.json(
        { error: 'YouTube URL and video ID are required' },
        { status: 400 }
      );
    }

    console.log(`🧠 Starting comprehensive analysis for video: ${videoId}`);
    console.log(`📊 Requested templates: ${requestedTemplates.join(', ')}`);

    // Create enhanced processing request
    const processingRequest: EnhancedProcessingRequest = {
      videoId,
      youtubeUrl,
      userId: session.user.email,
      requestedTemplates,
      generateFullAnalysis: true,
      priority: 'high'
    };

    console.log('🔄 Processing video with enhanced transcript capabilities...');
    console.log('📝 This process will:');
    console.log('   1. Try YouTube captions first (fast)');
    console.log('   2. Fall back to Gemini transcript generation if needed');
    console.log('   3. Provide degraded analysis as last resort');

    // Process video with comprehensive analysis
    const result = await geminiClient.processVideoComprehensive(processingRequest);

    if (!result.success || !result.analysis) {
      console.error(`❌ Comprehensive analysis failed for video: ${videoId}`);
      console.error('Error details:', result.error);
      
      // Provide more helpful error messages based on the type of failure
      let userFriendlyError = 'Video analysis failed';
      let statusCode = 500;
      
      if (result.error?.includes('transcript')) {
        userFriendlyError = 'Unable to extract or generate transcript for this video. The video may be private, have disabled captions, or be in an unsupported format.';
        statusCode = 422; // Unprocessable Entity
      } else if (result.error?.includes('quota')) {
        userFriendlyError = 'API quota exceeded. Please try again in a few minutes.';
        statusCode = 429; // Too Many Requests
      } else if (result.error?.includes('invalid')) {
        userFriendlyError = 'Invalid video URL or video is not accessible.';
        statusCode = 400; // Bad Request
      } else if (result.error?.includes('size')) {
        userFriendlyError = 'Video is too large to process. Please try a shorter video.';
        statusCode = 413; // Payload Too Large
      }
      
      return NextResponse.json(
        { 
          error: userFriendlyError,
          technicalError: result.error,
          videoId: result.videoId,
          suggestions: [
            'Verify the video is public and accessible',
            'Check if the video has captions or audio',
            'Try with a shorter video',
            'Ensure the YouTube URL is valid'
          ]
        },
        { status: statusCode }
      );
    }

    // Check if video exists in database (videoId is YouTube video ID, not UUID)
    const existingVideo = await db
      .select()
      .from(videos)
      .where(eq(videos.videoId, videoId))
      .limit(1);

    if (existingVideo.length === 0) {
      // Avoid noisy 404s in browser console; return success: false
      return NextResponse.json({
        success: false,
        reason: 'video_not_found',
        error: 'Video not found in database'
      });
    }

    // Store comprehensive analysis in database
    const videoDatabaseId = existingVideo[0].id; // This is the UUID
    const analysisData = {
      videoId: videoDatabaseId,
      fullTranscript: result.analysis.fullTranscript,
      transcriptConfidence: result.analysis.transcriptConfidence.toString(),
      visualAnalysis: result.analysis.visualAnalysis,
      hasSlides: result.analysis.visualAnalysis.hasSlides,
      hasCharts: result.analysis.visualAnalysis.hasCharts,
      contentStructure: result.analysis.contentStructure,
      identifiedConcepts: result.analysis.conceptMap,
      difficultyLevel: result.analysis.difficultyLevel,
      primarySubject: result.analysis.primarySubject,
      secondarySubjects: result.analysis.secondarySubjects,
      contentTags: result.analysis.contentTags,
      suggestedQuestions: result.analysis.suggestedQuestions,
      keyTimestamps: result.analysis.keyTimestamps,
      conceptMap: result.analysis.conceptMap,
      allTemplateOutputs: result.analysis.allTemplateOutputs,
      analysisVersion: result.analysis.analysisVersion,
      processingTime: result.analysis.processingTime,
      totalTokensUsed: result.analysis.totalTokensUsed,
      analysisCostInCents: result.analysis.analysisCostInCents,
    };

    // Check if analysis already exists
    const existingAnalysis = await db
      .select()
      .from(videoAnalysis)
      .where(eq(videoAnalysis.videoId, videoDatabaseId))
      .limit(1);

    if (existingAnalysis.length > 0) {
      // Update existing analysis
      await db
        .update(videoAnalysis)
        .set({
          ...analysisData,
          updatedAt: new Date()
        })
        .where(eq(videoAnalysis.videoId, videoDatabaseId));
    } else {
      // Insert new analysis
      await db
        .insert(videoAnalysis)
        .values(analysisData);
    }

    // Update video status to completed (using the correct database UUID)
    await db
      .update(videos)
      .set({
        status: 'completed',
        processingCompleted: new Date(),
        tokensUsed: result.analysis.totalTokensUsed,
        costEstimate: result.analysis.analysisCostInCents,
        updatedAt: new Date()
      })
      .where(eq(videos.id, videoDatabaseId)); // Use videoDatabaseId (UUID) not videoId (YouTube ID)

    console.log(`✅ Comprehensive analysis completed and stored for video: ${videoId}`);
    console.log(`📊 Analysis results: ${result.analysis.conceptMap.concepts.length} concepts, ${result.analysis.fullTranscript.segments.length} transcript segments`);
    console.log(`💰 Processing cost: ${result.analysis.analysisCostInCents} cents`);

    // 📊 SECURITY: Track successful note generation for subscription limits
    try {
      await incrementUsage(userId, 'generate_note');
      console.log('✅ Usage tracked successfully for comprehensive analysis:', userId);
    } catch (error) {
      console.error('Failed to track comprehensive analysis usage:', error);
      // Don't fail the request if usage tracking fails
    }

    return NextResponse.json({
      success: true,
      videoId,
      analysis: {
        conceptCount: result.analysis.conceptMap.concepts.length,
        transcriptSegments: result.analysis.fullTranscript.segments.length,
        hasVisualContent: result.analysis.visualAnalysis.hasSlides || result.analysis.visualAnalysis.hasCharts,
        templateOutputs: Object.keys(result.analysis.allTemplateOutputs),
        processingTime: result.analysis.processingTime,
        cost: result.analysis.analysisCostInCents,
        transcriptSource: result.analysis.fullTranscript.language || 'unknown', // This will be updated to show source
        transcriptConfidence: result.analysis.transcriptConfidence
      },
      message: `Analysis completed successfully with ${result.analysis.conceptMap.concepts.length} concepts identified`
    });

  } catch (error) {
    console.error('❌ Comprehensive analysis API error:', error);
    
    // Enhanced error logging for debugging
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve comprehensive analysis
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Getting comprehensive analysis with authentication check...');
    
    const session = await getApiSession(request);
    console.log('AUTH STATUS (GET):', {
      hasSession: !!session,
      hasUser: !!session?.user,
      hasEmail: !!session?.user?.email,
      userEmail: session?.user?.email
    });
    
    if (!session?.user?.email) {
      console.error('❌ Authentication failed for GET request');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get('videoId');

    if (!videoId) {
      return NextResponse.json(
        { error: 'Video ID is required' },
        { status: 400 }
      );
    }

    // First find the video by YouTube videoId to get the database UUID
    const existingVideo = await db
      .select()
      .from(videos)
      .where(eq(videos.videoId, videoId))
      .limit(1);

    if (existingVideo.length === 0) {
      return NextResponse.json(
        { error: 'Video not found in database' },
        { status: 404 }
      );
    }

    // Get comprehensive analysis from database using the database UUID
    const videoDatabaseId = existingVideo[0].id;
    const analysis = await db
      .select()
      .from(videoAnalysis)
      .where(eq(videoAnalysis.videoId, videoDatabaseId))
      .limit(1);

    if (analysis.length === 0) {
      // Avoid noisy 404s in browser console; return success: false
      return NextResponse.json({
        success: false,
        reason: 'analysis_not_found',
        error: 'Comprehensive analysis not found'
      });
    }

    return NextResponse.json({
      success: true,
      analysis: analysis[0]
    });

  } catch (error) {
    console.error('Get comprehensive analysis API error:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}
