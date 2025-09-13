import { NextRequest, NextResponse } from 'next/server';
import { fetchVideoMetadata } from '@/lib/services/youtube-api';
import { memoryCache, CacheKeys, CacheTTL } from '@/lib/cache/memory-cache';

// Force this route to be dynamic to prevent static generation
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // Extract URL parameter from request URL to avoid searchParams during build
    const url = new URL(request.url);
    const videoUrl = url.searchParams.get('url');

    if (!videoUrl) {
      return NextResponse.json(
        { error: 'Video URL is required' },
        { status: 400 }
      );
    }

    // Extract video ID for cache key
    const videoIdMatch = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    const videoId = videoIdMatch?.[1];
    
    if (!videoId) {
      return NextResponse.json(
        { error: 'Invalid YouTube URL format' },
        { status: 400 }
      );
    }

    const cacheKey = CacheKeys.YOUTUBE_METADATA(videoId);
    
    // Check cache first
    const cachedMetadata = memoryCache.get(cacheKey);
    if (cachedMetadata) {
      console.log('🔍 Using cached YouTube metadata for:', videoUrl);
      return NextResponse.json({
        success: true,
        metadata: cachedMetadata,
        cached: true
      });
    }

    console.log('🔍 Fetching YouTube metadata for:', videoUrl);
    const startTime = Date.now();
    
    const metadata = await fetchVideoMetadata(videoUrl);

    if (!metadata) {
      return NextResponse.json(
        { error: 'Failed to fetch video metadata or video not found' },
        { status: 404 }
      );
    }

    const fetchTime = Date.now() - startTime;
    
    // Cache the successful response
    memoryCache.set(cacheKey, metadata, CacheTTL.YOUTUBE_METADATA);
    
    console.log(`✅ YouTube metadata fetched successfully (${fetchTime}ms):`, metadata.title);

    return NextResponse.json({
      success: true,
      metadata,
      cached: false,
      fetchTime
    });

  } catch (error: any) {
    console.error('❌ YouTube metadata API error:', error);
    
    return NextResponse.json(
      { 
        error: error.message || 'Failed to fetch YouTube metadata',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// Allow HEAD for link prefetchers and clients that probe endpoints
export async function HEAD() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Allow': 'GET, HEAD, OPTIONS',
    },
  });
}

// Respond to OPTIONS explicitly if hit directly (middleware also handles CORS)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Allow': 'GET, HEAD, OPTIONS',
    },
  });
}
