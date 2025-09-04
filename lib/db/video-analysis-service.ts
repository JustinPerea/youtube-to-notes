/**
 * Video Analysis Database Service
 * Handles CRUD operations for comprehensive video analysis data
 */

import { db } from './drizzle';
import { videos, videoAnalysis } from './schema';
import { eq, and } from 'drizzle-orm';
import { EnhancedVideoAnalysis, ChatbotVideoContext } from '@/lib/types/enhanced-video-analysis';

export class VideoAnalysisService {
  
  /**
   * Store comprehensive video analysis in database
   */
  async storeAnalysis(videoId: string, analysis: EnhancedVideoAnalysis) {
    try {
      const analysisData = {
        videoId,
        fullTranscript: analysis.fullTranscript,
        transcriptConfidence: analysis.transcriptConfidence.toString(),
        visualAnalysis: analysis.visualAnalysis,
        hasSlides: analysis.visualAnalysis.hasSlides,
        hasCharts: analysis.visualAnalysis.hasCharts,
        contentStructure: analysis.contentStructure,
        identifiedConcepts: analysis.conceptMap,
        difficultyLevel: analysis.difficultyLevel,
        primarySubject: analysis.primarySubject,
        secondarySubjects: analysis.secondarySubjects,
        contentTags: analysis.contentTags,
        suggestedQuestions: analysis.suggestedQuestions,
        keyTimestamps: analysis.keyTimestamps,
        conceptMap: analysis.conceptMap,
        allTemplateOutputs: analysis.allTemplateOutputs,
        analysisVersion: analysis.analysisVersion,
        processingTime: analysis.processingTime,
        totalTokensUsed: analysis.totalTokensUsed,
        analysisCostInCents: analysis.analysisCostInCents,
      };

      // Check if analysis already exists
      const existing = await this.getAnalysis(videoId);
      
      if (existing) {
        // Update existing analysis
        await db
          .update(videoAnalysis)
          .set({
            ...analysisData,
            updatedAt: new Date()
          })
          .where(eq(videoAnalysis.videoId, videoId));
      } else {
        // Insert new analysis
        await db
          .insert(videoAnalysis)
          .values(analysisData);
      }

      return { success: true };
    } catch (error) {
      console.error('Error storing video analysis:', error);
      throw error;
    }
  }

  /**
   * Retrieve comprehensive video analysis
   */
  async getAnalysis(videoId: string): Promise<any | null> {
    try {
      const result = await db
        .select()
        .from(videoAnalysis)
        .where(eq(videoAnalysis.videoId, videoId))
        .limit(1);

      return result[0] || null;
    } catch (error) {
      console.error('Error retrieving video analysis:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive chatbot context for a video
   */
  async getChatbotContext(
    videoId: string, 
    userId: string,
    currentFormat?: string,
    verbosityLevel?: 'brief' | 'standard' | 'comprehensive'
  ): Promise<ChatbotVideoContext | null> {
    try {
      // Get video and analysis data
      const videoData = await db
        .select()
        .from(videos)
        .leftJoin(videoAnalysis, eq(videos.id, videoAnalysis.videoId))
        .where(and(
          eq(videos.id, videoId),
          eq(videos.userId, userId)
        ))
        .limit(1);

      if (!videoData[0]) {
        return null;
      }

      const video = videoData[0].videos;
      const analysis = videoData[0].video_analysis;

      if (!analysis) {
        throw new Error('Comprehensive analysis not found. Please process the video first.');
      }

      // Convert database analysis to structured format
      const enhancedAnalysis: EnhancedVideoAnalysis = {
        fullTranscript: analysis.fullTranscript as any,
        visualAnalysis: analysis.visualAnalysis as any,
        contentStructure: analysis.contentStructure as any,
        conceptMap: analysis.conceptMap as any,
        primarySubject: analysis.primarySubject || 'General',
        secondarySubjects: analysis.secondarySubjects || [],
        contentTags: analysis.contentTags || [],
        difficultyLevel: analysis.difficultyLevel || 'intermediate',
        suggestedQuestions: analysis.suggestedQuestions as any || [],
        keyTimestamps: analysis.keyTimestamps as any || [],
        allTemplateOutputs: analysis.allTemplateOutputs as any || {},
        analysisVersion: analysis.analysisVersion || '1.0',
        processingTime: analysis.processingTime || 0,
        totalTokensUsed: analysis.totalTokensUsed || 0,
        analysisCostInCents: analysis.analysisCostInCents || 0,
        transcriptConfidence: parseFloat(analysis.transcriptConfidence || '0'),
        analysisCompleteness: 0.95, // Default value
        createdAt: analysis.createdAt || new Date(),
        updatedAt: analysis.updatedAt || new Date()
      };

      const context: ChatbotVideoContext = {
        videoId: video.id,
        title: video.title || 'Untitled Video',
        youtubeUrl: video.youtubeUrl,
        duration: video.duration || 0,
        currentlyViewingFormat: currentFormat,
        currentVerbosityLevel: verbosityLevel,
        userSubscriptionTier: 'free', // Would be fetched from user data
        analysis: enhancedAnalysis
      };

      return context;
    } catch (error) {
      console.error('Error building chatbot context:', error);
      throw error;
    }
  }

  /**
   * Search concepts within video analysis
   */
  async searchConcepts(videoId: string, searchTerm: string): Promise<any[]> {
    try {
      const analysis = await this.getAnalysis(videoId);
      if (!analysis || !analysis.conceptMap) {
        return [];
      }

      const conceptMap = analysis.conceptMap as any;
      const concepts = conceptMap.concepts || [];
      
      return concepts.filter((concept: any) => 
        concept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        concept.definition.toLowerCase().includes(searchTerm.toLowerCase()) ||
        concept.aliases?.some((alias: string) => 
          alias.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    } catch (error) {
      console.error('Error searching concepts:', error);
      return [];
    }
  }

  /**
   * Get video segments by timestamp range
   */
  async getTranscriptSegments(
    videoId: string, 
    startTime?: number, 
    endTime?: number
  ): Promise<any[]> {
    try {
      const analysis = await this.getAnalysis(videoId);
      if (!analysis || !analysis.fullTranscript) {
        return [];
      }

      const transcript = analysis.fullTranscript as any;
      let segments = transcript.segments || [];

      if (startTime !== undefined || endTime !== undefined) {
        segments = segments.filter((segment: any) => {
          const segmentStart = segment.startTime;
          const segmentEnd = segment.endTime;
          
          if (startTime !== undefined && segmentEnd < startTime) return false;
          if (endTime !== undefined && segmentStart > endTime) return false;
          
          return true;
        });
      }

      return segments;
    } catch (error) {
      console.error('Error retrieving transcript segments:', error);
      return [];
    }
  }

  /**
   * Get suggested questions for video
   */
  async getSuggestedQuestions(videoId: string, difficulty?: string): Promise<any[]> {
    try {
      const analysis = await this.getAnalysis(videoId);
      if (!analysis) return [];

      let questions = analysis.suggestedQuestions as any[] || [];
      
      if (difficulty) {
        questions = questions.filter(q => q.difficulty === difficulty);
      }

      return questions;
    } catch (error) {
      console.error('Error retrieving suggested questions:', error);
      return [];
    }
  }
}

// Singleton instance
export const videoAnalysisService = new VideoAnalysisService();