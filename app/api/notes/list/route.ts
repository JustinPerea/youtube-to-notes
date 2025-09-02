import { NextRequest, NextResponse } from 'next/server';
import { getApiSessionWithDatabase } from '@/lib/auth-utils';
import { NotesService } from '@/lib/services/notes';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

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
    const grouped = searchParams.get('grouped') !== 'false'; // Default to true (grouped)

    if (grouped) {
      // Get video-grouped notes (new behavior)
      const result = await NotesService.getVideoGroupedNotes({
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
        videos: result.videos || [],
        total: result.total || 0,
      });
    } else {
      // Get flat notes list (backward compatibility)
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
        notes: result.notes || [],
        total: result.total || 0,
      });
    }
  } catch (error) {
    console.error('Error in get notes API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
