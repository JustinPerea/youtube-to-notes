import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { NotesService } from '../../../../lib/services/notes';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.content) {
      return NextResponse.json(
        { error: 'Content is required.' },
        { status: 400 }
      );
    }

    // Generate a title from the content if not provided
    let title = body.title;
    if (!title && body.content) {
      // Extract first line or first 50 characters as title
      const firstLine = body.content.split('\n')[0].trim();
      title = firstLine.length > 50 ? firstLine.substring(0, 50) + '...' : firstLine;
    }

    // Save the note using the UUID from session
    const result = await NotesService.saveNote({
      userId: session.user.id, // This is now the UUID from database
      videoId: body.videoId,
      title: title || 'Untitled Note',
      content: body.content,
      templateId: body.templateId,
      tags: body.tags || [],
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to save note' },
        { status: 400 }
      );
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
    // Check authentication
    const session = await getServerSession(authOptions);
    
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
