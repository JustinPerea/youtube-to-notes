/**
 * Notes Service
 * 
 * Handles saving and retrieving user notes using the database
 * Now uses UUID-based system with proper OAuth mapping
 */

import { db } from '../db/connection';
import { notes, users, videos } from '../db/schema';
import { eq, desc, and, or, ilike, arrayContains } from 'drizzle-orm';

export interface SaveNoteRequest {
  userId: string; // This will be a UUID from the session
  videoId?: string;
  title: string;
  content: string;
  templateId?: string;
  tags?: string[];
}

export interface UpdateNoteRequest {
  noteId: string;
  userId: string;
  title?: string;
  content?: string;
  templateId?: string;
  tags?: string[];
}

export interface GetNotesRequest {
  userId: string;
  videoId?: string;
  searchQuery?: string;
  tags?: string[];
  limit?: number;
  offset?: number;
}

export class NotesService {
  /**
   * Save a new note
   */
  static async saveNote(data: SaveNoteRequest): Promise<{ 
    success: boolean; 
    noteId?: string; 
    error?: string 
  }> {
    if (!db) {
      return { success: false, error: 'Database not configured. Please set up environment variables.' };
    }

    try {
      // Validate UUID format
      if (!data.userId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        return { 
          success: false, 
          error: 'Invalid user ID format. Expected UUID.' 
        };
      }

      // Verify user exists
      const userExists = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.id, data.userId))
        .limit(1);

      if (userExists.length === 0) {
        return { 
          success: false, 
          error: 'User not found. Please sign in again.' 
        };
      }

      // If videoId provided, verify it exists and belongs to user
      if (data.videoId) {
        const videoExists = await db
          .select({ id: videos.id })
          .from(videos)
          .where(
            and(
              eq(videos.id, data.videoId),
              eq(videos.userId, data.userId)
            )
          )
          .limit(1);

        if (videoExists.length === 0) {
          return { 
            success: false, 
            error: 'Video not found or access denied.' 
          };
        }
      }

      // Insert the note
      const result = await db
        .insert(notes)
        .values({
          userId: data.userId,
          videoId: data.videoId || null,
          title: data.title,
          content: data.content,
          templateId: data.templateId || null,
          tags: data.tags || [],
        })
        .returning({ id: notes.id });

      return { 
        success: true, 
        noteId: result[0].id 
      };
    } catch (error) {
      console.error('Error saving note:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to save note' 
      };
    }
  }

  /**
   * Update an existing note
   */
  static async updateNote(data: UpdateNoteRequest): Promise<{ 
    success: boolean; 
    error?: string 
  }> {
    if (!db) {
      return { success: false, error: 'Database not configured. Please set up environment variables.' };
    }

    try {
      // Verify note exists and belongs to user
      const noteExists = await db
        .select({ id: notes.id })
        .from(notes)
        .where(
          and(
            eq(notes.id, data.noteId),
            eq(notes.userId, data.userId)
          )
        )
        .limit(1);

      if (noteExists.length === 0) {
        return { 
          success: false, 
          error: 'Note not found or access denied.' 
        };
      }

      // Build update object
      const updateData: any = { updatedAt: new Date() };
      if (data.title !== undefined) updateData.title = data.title;
      if (data.content !== undefined) updateData.content = data.content;
      if (data.templateId !== undefined) updateData.templateId = data.templateId;
      if (data.tags !== undefined) updateData.tags = data.tags;

      // Update the note
      await db
        .update(notes)
        .set(updateData)
        .where(eq(notes.id, data.noteId));

      return { success: true };
    } catch (error) {
      console.error('Error updating note:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update note' 
      };
    }
  }

  /**
   * Get notes for a user with optional filters
   */
  static async getNotes(params: GetNotesRequest): Promise<{ 
    success: boolean; 
    notes?: any[]; 
    total?: number; 
    error?: string 
  }> {
    if (!db) {
      return { success: false, error: 'Database not configured. Please set up environment variables.' };
    }

    try {
      const conditions = [eq(notes.userId, params.userId)];

      // Add optional filters
      if (params.videoId) {
        conditions.push(eq(notes.videoId, params.videoId));
      }

      if (params.searchQuery) {
        conditions.push(
          or(
            ilike(notes.title, `%${params.searchQuery}%`),
            ilike(notes.content, `%${params.searchQuery}%`)
          )!
        );
      }

      if (params.tags && params.tags.length > 0) {
        conditions.push(arrayContains(notes.tags, params.tags));
      }

      // Get total count
      const totalResult = await db
        .select({ count: notes.id })
        .from(notes)
        .where(and(...conditions));

      const total = totalResult.length;

      // Get paginated results
      const notesResult = await db
        .select({
          id: notes.id,
          title: notes.title,
          content: notes.content,
          tags: notes.tags,
          templateId: notes.templateId,
          videoId: notes.videoId,
          createdAt: notes.createdAt,
          updatedAt: notes.updatedAt,
        })
        .from(notes)
        .where(and(...conditions))
        .orderBy(desc(notes.createdAt))
        .limit(params.limit || 20)
        .offset(params.offset || 0);

      return { 
        success: true, 
        notes: notesResult, 
        total 
      };
    } catch (error) {
      console.error('Error getting notes:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get notes' 
      };
    }
  }

  /**
   * Delete a note
   */
  static async deleteNote(noteId: string, userId: string): Promise<{ 
    success: boolean; 
    error?: string 
  }> {
    if (!db) {
      return { success: false, error: 'Database not configured. Please set up environment variables.' };
    }

    try {
      // Verify note exists and belongs to user
      const noteExists = await db
        .select({ id: notes.id })
        .from(notes)
        .where(
          and(
            eq(notes.id, noteId),
            eq(notes.userId, userId)
          )
        )
        .limit(1);

      if (noteExists.length === 0) {
        return { 
          success: false, 
          error: 'Note not found or access denied.' 
        };
      }

      // Delete the note
      await db
        .delete(notes)
        .where(eq(notes.id, noteId));

      return { success: true };
    } catch (error) {
      console.error('Error deleting note:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to delete note' 
      };
    }
  }

  /**
   * Get a single note by ID
   */
  static async getNote(noteId: string, userId: string): Promise<{ 
    success: boolean; 
    note?: any; 
    error?: string 
  }> {
    if (!db) {
      return { success: false, error: 'Database not configured. Please set up environment variables.' };
    }

    try {
      const result = await db
        .select({
          id: notes.id,
          title: notes.title,
          content: notes.content,
          tags: notes.tags,
          templateId: notes.templateId,
          videoId: notes.videoId,
          createdAt: notes.createdAt,
          updatedAt: notes.updatedAt,
        })
        .from(notes)
        .where(
          and(
            eq(notes.id, noteId),
            eq(notes.userId, userId)
          )
        )
        .limit(1);

      if (result.length === 0) {
        return { 
          success: false, 
          error: 'Note not found or access denied.' 
        };
      }

      return { 
        success: true, 
        note: result[0] 
      };
    } catch (error) {
      console.error('Error getting note:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get note' 
      };
    }
  }
}
