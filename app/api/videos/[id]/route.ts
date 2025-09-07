import { NextRequest, NextResponse } from 'next/server';
import { getApiSessionWithDatabase } from '@/lib/auth-utils';
import { db } from '@/lib/db/drizzle';
import { videos, notes, videoAnalysis, processingResults, processingQueue, userUsageHistory } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { decrementStorageUsage } from '@/lib/subscription/service';
import { calculateMinimumContentSizeMB, estimateVideoMetadataSizeMB } from '@/lib/utils/storage';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🗑️ Starting video deletion process...');
    
    // Use new hybrid authentication approach
    const session = await getApiSessionWithDatabase(request);
    if (!session?.user?.id) {
      console.error('❌ Authentication failed - no valid session');
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const videoId = params.id; // This should be the database UUID
    console.log(`🎬 Attempting to delete video: ${videoId} for user: ${session.user.id}`);

    // First, verify the video exists and belongs to the user
    const existingVideo = await db
      .select()
      .from(videos)
      .where(and(
        eq(videos.id, videoId),
        eq(videos.userId, session.user.id)
      ))
      .limit(1);

    if (existingVideo.length === 0) {
      console.error('❌ Video not found or does not belong to user');
      return NextResponse.json(
        { error: 'Video not found or access denied' },
        { status: 404 }
      );
    }

    const video = existingVideo[0];
    console.log(`🎯 Found video to delete: "${video.title}" (${video.youtubeUrl})`);

    // Delete all related data in the correct order due to foreign key constraints
    console.log('🧹 Cleaning up related data...');

    const deletionResults = {
      notes: 0,
      analysis: 0,
      processingResults: 0,
      queueEntries: 0,
      usageHistory: 0
    };

    // 📊 STORAGE TRACKING: Calculate storage to be freed before deletion
    let totalStorageFreedMB = 0;

    // 1. Calculate storage used by notes before deleting
    try {
      const notesToDelete = await db
        .select({
          id: notes.id,
          title: notes.title,
          content: notes.content,
          verbosityVersions: notes.verbosityVersions,
        })
        .from(notes)
        .where(eq(notes.videoId, videoId));

      for (const note of notesToDelete) {
        const noteSize = calculateMinimumContentSizeMB({
          title: note.title,
          content: note.content,
          verbosityVersions: note.verbosityVersions || undefined,
        });
        totalStorageFreedMB += noteSize;
      }
      
      console.log(`📊 Notes to delete: ${notesToDelete.length}, total size: ${totalStorageFreedMB}MB`);
    } catch (error) {
      console.warn(`⚠️ Could not calculate notes storage:`, error);
    }

    // 2. Add video metadata storage estimate
    try {
      const videoMetadataSize = estimateVideoMetadataSizeMB({
        title: video.title || undefined,
        description: video.description || undefined,
        thumbnailUrl: video.thumbnailUrl || undefined,
        channelName: video.channelName || undefined,
      });
      totalStorageFreedMB += videoMetadataSize;
      
      console.log(`📊 Video metadata size: ${videoMetadataSize}MB, total freed: ${totalStorageFreedMB}MB`);
    } catch (error) {
      console.warn(`⚠️ Could not calculate video metadata storage:`, error);
    }

    // 3. Delete notes associated with this video
    try {
      const deletedNotes = await db
        .delete(notes)
        .where(eq(notes.videoId, videoId))
        .returning({ id: notes.id });
      deletionResults.notes = deletedNotes.length;
      console.log(`📝 Deleted ${deletedNotes.length} notes`);
    } catch (error) {
      console.warn(`⚠️ Could not delete notes (table may not exist):`, error);
    }

    // 2. Delete video analysis
    try {
      const deletedAnalysis = await db
        .delete(videoAnalysis)
        .where(eq(videoAnalysis.videoId, videoId))
        .returning({ id: videoAnalysis.id });
      deletionResults.analysis = deletedAnalysis.length;
      console.log(`📊 Deleted ${deletedAnalysis.length} analysis records`);
    } catch (error) {
      console.warn(`⚠️ Could not delete video analysis (table may not exist):`, error);
    }

    // 3. Delete processing results
    try {
      const deletedResults = await db
        .delete(processingResults)
        .where(eq(processingResults.videoId, videoId))
        .returning({ id: processingResults.id });
      deletionResults.processingResults = deletedResults.length;
      console.log(`⚙️ Deleted ${deletedResults.length} processing results`);
    } catch (error) {
      console.warn(`⚠️ Could not delete processing results (table may not exist):`, error);
    }

    // 4. Delete processing queue entries (may not exist in current DB)
    try {
      const deletedQueue = await db
        .delete(processingQueue)
        .where(eq(processingQueue.videoId, videoId))
        .returning({ id: processingQueue.id });
      deletionResults.queueEntries = deletedQueue.length;
      console.log(`🔄 Deleted ${deletedQueue.length} queue entries`);
    } catch (error: any) {
      if (error.code === '42P01') {
        console.log('ℹ️ Processing queue table does not exist - skipping');
      } else {
        console.warn(`⚠️ Could not delete queue entries:`, error);
      }
    }

    // 5. Delete usage history entries (may not exist in current DB)
    try {
      const deletedUsage = await db
        .delete(userUsageHistory)
        .where(eq(userUsageHistory.videoId, videoId))
        .returning({ id: userUsageHistory.id });
      deletionResults.usageHistory = deletedUsage.length;
      console.log(`📈 Deleted ${deletedUsage.length} usage history entries`);
    } catch (error: any) {
      if (error.code === '42P01') {
        console.log('ℹ️ Usage history table does not exist - skipping');
      } else {
        console.warn(`⚠️ Could not delete usage history:`, error);
      }
    }

    // 6. Finally, delete the video itself
    const deletedVideo = await db
      .delete(videos)
      .where(and(
        eq(videos.id, videoId),
        eq(videos.userId, session.user.id)
      ))
      .returning({ 
        id: videos.id, 
        title: videos.title,
        youtubeUrl: videos.youtubeUrl 
      });

    if (deletedVideo.length === 0) {
      console.error('❌ Failed to delete video - may have been deleted by another request');
      return NextResponse.json(
        { error: 'Failed to delete video' },
        { status: 500 }
      );
    }

    console.log(`✅ Successfully deleted video: "${deletedVideo[0].title}"`);
    console.log(`📊 Total cleanup: ${deletionResults.notes} notes, ${deletionResults.analysis} analysis, ${deletionResults.processingResults} results, ${deletionResults.queueEntries} queue, ${deletionResults.usageHistory} usage entries`);

    // 📊 STORAGE TRACKING: Update user's storage usage after successful deletion
    if (totalStorageFreedMB > 0) {
      try {
        await decrementStorageUsage(session.user.id, totalStorageFreedMB);
        console.log(`📊 Storage tracking: Freed ${totalStorageFreedMB}MB for user ${session.user.id}`);
      } catch (storageError) {
        // Log storage tracking error but don't fail the request since deletion was successful
        console.error('⚠️ Storage tracking failed (deletion was successful):', storageError);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Video and all related data deleted successfully',
      deleted: {
        video: deletedVideo[0],
        relatedRecords: deletionResults,
        storageFreedMB: totalStorageFreedMB
      }
    });

  } catch (error) {
    console.error('❌ Error deleting video:', error);
    
    // Enhanced error logging
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