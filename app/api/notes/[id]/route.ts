import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { NotesService } from '@/lib/services/notes';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get user session using standard auth() method
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const noteId = params.id;

    // Delete the note
    const result = await NotesService.deleteNote(noteId, session.user.id);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting note:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
