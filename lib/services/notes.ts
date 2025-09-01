/**
 * Notes Service
 * 
 * Handles saving and retrieving user notes using the database
 * Now uses UUID-based system with proper OAuth mapping
 */

import { db } from '../db/connection';
import { notes, users, videos } from '../db/schema';
import { eq, desc, and, or, ilike, arrayContains } from 'drizzle-orm';

// Utility function to extract YouTube video ID from URL
function extractVideoIdFromUrl(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([^&\n?#]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }
  
  return null;
}

// Utility function to fetch basic YouTube metadata (title and thumbnail)
async function fetchYouTubeMetadata(videoId: string): Promise<{
  title?: string;
  thumbnailUrl?: string;
  channelName?: string;
  duration?: number;
} | null> {
  try {
    // Use YouTube oEmbed API for basic metadata (no API key required)
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    
    const response = await fetch(oembedUrl);
    if (response.ok) {
      const data = await response.json();
      return {
        title: data.title || `YouTube Video ${videoId}`,
        thumbnailUrl: data.thumbnail_url || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        channelName: data.author_name,
      };
    }
    
    // Fallback if oEmbed fails
    return {
      title: `YouTube Video ${videoId}`,
      thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
    };
  } catch (error) {
    console.error('Error fetching YouTube metadata:', error);
    // Return fallback data
    return {
      title: `YouTube Video ${videoId}`,
      thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
    };
  }
}

export interface SaveNoteRequest {
  userId: string; // This will be a UUID from the session
  videoId?: string;
  youtubeUrl?: string; // YouTube URL to create/link video record
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

export interface VideoWithNotes {
  videoId: string;
  title: string;
  youtubeUrl: string;
  thumbnailUrl?: string;
  noteFormats: {
    noteId: string;
    templateId: string;
    content: string;
    createdAt: string;
    updatedAt: string;
  }[];
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

      // Handle video record creation/linking
      let finalVideoId = data.videoId;

      // If youtubeUrl is provided, create or find existing video record
      if (data.youtubeUrl) {
        // Validate YouTube URL format
        const videoId = extractVideoIdFromUrl(data.youtubeUrl);
        if (!videoId) {
          return {
            success: false,
            error: 'Invalid YouTube URL format'
          };
        }

        // Try to find existing video by URL for this user
        const existingVideo = await db
          .select()
          .from(videos)
          .where(
            and(
              eq(videos.youtubeUrl, data.youtubeUrl),
              eq(videos.userId, data.userId)
            )
          )
          .limit(1);

        if (existingVideo.length > 0) {
          // Use existing video record
          finalVideoId = existingVideo[0].id;
        } else {
          // Create new video record
          try {
            const videoMetadata = await fetchYouTubeMetadata(videoId);
            
            const [newVideo] = await db
              .insert(videos)
              .values({
                userId: data.userId,
                youtubeUrl: data.youtubeUrl,
                videoId: videoId,
                title: videoMetadata?.title || data.title,
                thumbnailUrl: videoMetadata?.thumbnailUrl,
                channelName: videoMetadata?.channelName,
                duration: videoMetadata?.duration,
                status: 'completed' // Mark as completed since we're not processing
              })
              .returning({ id: videos.id });

            finalVideoId = newVideo.id;
          } catch (error) {
            console.error('Error creating video record:', error);
            return {
              success: false,
              error: 'Failed to create video record'
            };
          }
        }
      }
      
      // If videoId provided (legacy), verify it exists and belongs to user
      else if (data.videoId) {
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
        finalVideoId = data.videoId;
      }

      // Insert the note
      const result = await db
        .insert(notes)
        .values({
          userId: data.userId,
          videoId: finalVideoId || null,
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
   * Get notes grouped by video for a user with optional filters
   */
  static async getVideoGroupedNotes(params: GetNotesRequest): Promise<{ 
    success: boolean; 
    videos?: VideoWithNotes[]; 
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

      // Get notes with video data, ordered by most recent note creation
      const notesWithVideos = await db
        .select({
          noteId: notes.id,
          noteTitle: notes.title,
          noteContent: notes.content,
          noteTemplateId: notes.templateId,
          noteCreatedAt: notes.createdAt,
          noteUpdatedAt: notes.updatedAt,
          videoId: notes.videoId,
          videoTitle: videos.title,
          videoYoutubeUrl: videos.youtubeUrl,
          videoThumbnailUrl: videos.thumbnailUrl,
        })
        .from(notes)
        .leftJoin(videos, eq(notes.videoId, videos.id))
        .where(and(...conditions))
        .orderBy(desc(notes.createdAt));

      // Group notes by video
      const videoMap = new Map<string, VideoWithNotes>();

      for (const row of notesWithVideos) {
        const videoKey = row.videoId || 'no-video'; // Handle notes without video
        
        if (!videoMap.has(videoKey)) {
          // Create new video entry
          videoMap.set(videoKey, {
            videoId: row.videoId || '',
            title: row.videoTitle || row.noteTitle, // Use note title if no video
            youtubeUrl: row.videoYoutubeUrl || '',
            thumbnailUrl: row.videoThumbnailUrl || undefined,
            noteFormats: []
          });
        }

        // Add note to video
        const video = videoMap.get(videoKey)!;
        video.noteFormats.push({
          noteId: row.noteId,
          templateId: row.noteTemplateId || '',
          content: row.noteContent,
          createdAt: row.noteCreatedAt.toISOString(),
          updatedAt: row.noteUpdatedAt.toISOString(),
        });
      }

      // Convert map to array and sort by most recent note
      const videosList = Array.from(videoMap.values())
        .map(video => ({
          ...video,
          noteFormats: video.noteFormats.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
        }))
        .sort((a, b) => {
          const aLatest = new Date(a.noteFormats[0]?.createdAt || 0).getTime();
          const bLatest = new Date(b.noteFormats[0]?.createdAt || 0).getTime();
          return bLatest - aLatest;
        });

      // Apply pagination
      const limit = params.limit || 20;
      const offset = params.offset || 0;
      const paginatedVideos = videosList.slice(offset, offset + limit);

      return { 
        success: true, 
        videos: paginatedVideos, 
        total: videosList.length
      };
    } catch (error) {
      console.error('Error getting video-grouped notes:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get video-grouped notes' 
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
