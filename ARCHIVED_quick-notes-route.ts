/**
 * ARCHIVED: Quick Notes Route
 * 
 * This file was removed to simplify the processing pipeline.
 * It provided immediate user feedback (30-60s) but created complexity:
 * - Dual processing paths (quick vs comprehensive)
 * - Throwaway content that gets replaced
 * - Complex state management
 * - User confusion with changing content
 * 
 * Original location: app/api/videos/quick-notes/route.ts
 * Archived on: 2025-01-09
 * Reason: Simplify pipeline to single comprehensive processing
 */

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { TEMPLATES } from '@/lib/templates';
import { getApiSessionWithDatabase } from '@/lib/auth-utils';
import { extractVideoId } from '@/lib/utils/youtube';
import { getUserSubscription } from '@/lib/services/subscription';

// Quick notes generation - minimal processing for immediate results
export const dynamic = 'force-dynamic';
export const maxDuration = 120; // 2 minutes max

// Fast model selection
async function getQuickModel(userId: string): Promise<string> {
  try {
    const subscription = await getUserSubscription(userId);
    const tier = subscription?.tier || 'free';
    
    // Always use fastest model for quick notes
    return 'gemini-1.5-flash';
  } catch (error) {
    return 'gemini-1.5-flash';
  }
}

export async function POST(request: NextRequest) {
  try {
    const { videoUrl, selectedTemplate } = await request.json();
    
    if (!videoUrl) {
      return NextResponse.json({ error: 'Video URL is required' }, { status: 400 });
    }

    const videoId = extractVideoId(videoUrl);
    if (!videoId) {
      return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 });
    }

    // Get session for model selection
    const session = await getApiSessionWithDatabase(request);
    const userId = session?.user?.id || 'anonymous';
    
    console.log('🚀 Quick notes generation starting for:', videoId);
    
    // Get template
    const template = TEMPLATES.find(t => t.id === selectedTemplate) || TEMPLATES[0];
    
    // Use fastest model
    const modelName = await getQuickModel(userId);
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: modelName });

    // Simple, fast prompt - just basic content extraction
    const quickPrompt = `Generate quick notes from this YouTube video: ${videoUrl}

${template.prompt}

IMPORTANT INSTRUCTIONS:
- Keep this FAST and SIMPLE
- Focus on key points only
- Don't try to analyze visual elements 
- Generate standard verbosity level
- Format as clean markdown
- Maximum 2000 words

Respond with just the formatted notes - no explanations or meta-commentary.`;

    console.log('📝 Generating quick notes with:', modelName);
    
    const startTime = Date.now();
    const result = await model.generateContent([
      quickPrompt,
      {
        fileData: {
          mimeType: "video/mp4", 
          fileUri: videoUrl
        }
      }
    ]);

    const content = await result.response.text();
    const processingTime = Date.now() - startTime;
    
    console.log(`✅ Quick notes generated in ${processingTime}ms`);
    console.log(`📊 Content length: ${content.length} characters`);

    // Return minimal response for immediate display
    return NextResponse.json({
      content: content,
      title: `Notes from Video`,
      template: selectedTemplate,
      processingMethod: 'quick',
      processingTime,
      dataSourcesUsed: ['Video Analysis (Quick)'],
      allVerbosityLevels: {
        brief: content.substring(0, Math.floor(content.length * 0.3)),
        standard: content,
        comprehensive: content // Same as standard for quick mode
      }
    });

  } catch (error: any) {
    console.error('❌ Quick notes generation failed:', error);
    
    // Return a helpful error but don't block the user
    return NextResponse.json({
      error: error.message || 'Quick notes generation failed',
      suggestion: 'The full processing will continue in the background'
    }, { status: 500 });
  }
}