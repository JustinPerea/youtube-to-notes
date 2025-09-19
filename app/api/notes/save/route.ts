import { NextRequest, NextResponse } from 'next/server';
import { getApiSessionWithDatabase } from '@/lib/auth-utils';
import { NotesService } from '@/lib/services/notes';
import { apiRateLimiter, getClientIdentifier, applyRateLimit } from '@/lib/rate-limit';
import { validateNoteData } from '@/lib/validation';
import { checkUsageLimit, incrementStorageUsage } from '@/lib/subscription/service';
import { calculateMinimumContentSizeMB } from '@/lib/utils/storage';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const clientId = getClientIdentifier(request);
    const rateLimitResult = await applyRateLimit(request, apiRateLimiter, clientId);
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded. Please try again later.',
          retryAfter: rateLimitResult.retryAfter 
        }, 
        { 
          status: 429,
          headers: {
            'Retry-After': rateLimitResult.retryAfter?.toString() || '900',
            'X-RateLimit-Limit': '100',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(Date.now() + (rateLimitResult.retryAfter || 900) * 1000).toISOString()
          }
        }
      );
    }

    // Use new hybrid authentication approach
    const session = await getApiSessionWithDatabase(request);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }

    // 🔐 SECURITY: Check storage limits before saving note
    const limitCheck = await checkUsageLimit(session.user.id, 'use_storage');
    if (!limitCheck.allowed) {
      return NextResponse.json({
        error: 'Storage limit reached',
        details: limitCheck.reason,
        limit: limitCheck.limit,
        current: limitCheck.current,
      }, { status: 429 });
    }

    // Parse and validate request body
    const body = await request.json();
    
    // Validate note data
    const validationResult = validateNoteData(body);
    if (!validationResult.isValid) {
      return NextResponse.json(
        { error: validationResult.error || 'Invalid note data.' },
        { status: 400 }
      );
    }

    const sanitizedData = validationResult.sanitizedData;
    
    // Validate required fields
    if (!sanitizedData.content) {
      return NextResponse.json(
        { error: 'Content is required.' },
        { status: 400 }
      );
    }

    // Generate a title from the content if not provided
    let title = sanitizedData.title;
    if (!title && sanitizedData.content) {
      // Extract first line or first 50 characters as title
      const firstLine = sanitizedData.content.split('\n')[0].trim();
      title = firstLine.length > 50 ? firstLine.substring(0, 50) + '...' : firstLine;
    }

    // Save the note using the UUID from session
    const result = await NotesService.saveNote({
      userId: session.user.id, // This is now the UUID from database
      videoId: sanitizedData.videoId,
      youtubeUrl: sanitizedData.youtubeUrl, // Include YouTube URL for video record creation
      title: title || 'Untitled Note',
      content: sanitizedData.content,
      templateId: sanitizedData.templateId,
      tags: sanitizedData.tags || [],
      verbosityVersions: sanitizedData.verbosityVersions, // Include verbosity data
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to save note' },
        { status: 400 }
      );
    }

    // 📊 STORAGE TRACKING: Calculate and update storage usage after successful save
    try {
      const contentSizeMB = calculateMinimumContentSizeMB({
        title: title || 'Untitled Note',
        content: sanitizedData.content,
        verbosityVersions: sanitizedData.verbosityVersions,
      });

      // Update user's storage usage atomically
      await incrementStorageUsage(session.user.id, contentSizeMB);
      
      console.log(`📊 Storage tracking: Added ${contentSizeMB}MB for user ${session.user.id}`);
    } catch (storageError) {
      // Log storage tracking error but don't fail the request since note was saved successfully
      console.error('⚠️ Storage tracking failed (note was saved successfully):', storageError);
    }

    return NextResponse.json({
      success: true,
      noteId: result.noteId,
      message: 'Note saved successfully',
    });
  } catch (error) {
    console.error('Error in save note API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Use new hybrid authentication approach
    const session = await getApiSessionWithDatabase(request);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const videoId = searchParams.get('videoId');
    const searchQuery = searchParams.get('search');
    const tags = searchParams.get('tags')?.split(',').filter(Boolean);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get notes
    const result = await NotesService.getNotes({
      userId: session.user.id,
      videoId: videoId || undefined,
      searchQuery: searchQuery || undefined,
      tags: tags || undefined,
      limit,
      offset,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to get notes' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      notes: result.notes,
      total: result.total,
    });
  } catch (error) {
    console.error('Error in get notes API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
