/**
 * Gemini API Client for YouTube-to-Notes
 * 
 * Handles video processing and content generation using Google's Gemini 2.5 Flash API
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { Template } from '@/lib/templates';

export interface VideoProcessingRequest {
  youtubeUrl: string;
  template: Template;
  customPrompt?: string;
  userId: string;
}

export interface VideoProcessingResponse {
  id: string;
  status: 'processing' | 'completed' | 'failed';
  result?: string;
  error?: string;
  processingTime?: number;
  tokenUsage?: number;
  cost?: number;
  metadata?: {
    videoTitle?: string;
    videoDuration?: number;
    channelName?: string;
    language?: string;
  };
}

export interface ProcessingQueueItem {
  id: string;
  request: VideoProcessingRequest;
  createdAt: Date;
  priority: 'low' | 'medium' | 'high';
  retryCount: number;
}

export class GeminiClient {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private processingQueue: ProcessingQueueItem[] = [];
  private isProcessing: boolean = false;

  constructor() {
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    
    if (!apiKey) {
      throw new Error('GOOGLE_GEMINI_API_KEY environment variable is required');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    
    // Use Gemini 2.5 Flash for video processing
    this.model = this.genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      },
    });
  }

  async processVideo(request: VideoProcessingRequest): Promise<VideoProcessingResponse> {
    const processingId = `proc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`🎬 Starting video processing: ${processingId}`);
    console.log(`📺 URL: ${request.youtubeUrl}`);
    console.log(`📋 Template: ${request.template.name}`);

    try {
      const startTime = Date.now();

      // Validate YouTube URL
      await this.validateYouTubeUrl(request.youtubeUrl);

      // Extract video metadata
      const metadata = await this.extractVideoMetadata(request.youtubeUrl);

      // Build the prompt for Gemini
      const prompt = this.buildPrompt(request, metadata);

      // Process with Gemini
      const result = await this.generateContent(prompt, request.youtubeUrl);

      const processingTime = Date.now() - startTime;

      // Calculate cost
      const cost = this.calculateCost(result.tokenUsage || 0);

      console.log(`✅ Video processing completed: ${processingId}`);
      console.log(`⏱️ Processing time: ${processingTime}ms`);
      console.log(`💰 Estimated cost: $${cost.toFixed(4)}`);

      return {
        id: processingId,
        status: 'completed',
        result: result.text,
        processingTime,
        tokenUsage: result.tokenUsage,
        cost,
        metadata
      };

    } catch (error) {
      console.error(`❌ Video processing failed: ${processingId}`, error);
      
      return {
        id: processingId,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        metadata: {}
      };
    }
  }

  private async validateYouTubeUrl(url: string): Promise<void> {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
    
    if (!youtubeRegex.test(url)) {
      throw new Error('Invalid YouTube URL format');
    }

    // Additional validation could include checking if video exists
    // For now, we'll rely on Gemini's API to handle invalid URLs
  }

  private async extractVideoMetadata(url: string): Promise<any> {
    // This would typically extract metadata from YouTube API
    // For now, we'll return basic info
    return {
      videoTitle: 'Video Title (to be extracted)',
      videoDuration: 0,
      channelName: 'Channel Name (to be extracted)',
      language: 'en'
    };
  }

  private buildPrompt(request: VideoProcessingRequest, metadata: any): string {
    const { template, customPrompt } = request;
    
    let prompt = template.prompt;
    
    // Add custom prompt if provided
    if (customPrompt) {
      prompt = `${prompt}\n\nAdditional requirements: ${customPrompt}`;
    }

    // Add metadata context
    prompt = `${prompt}\n\nVideo Context:\n- Title: ${metadata.videoTitle}\n- Channel: ${metadata.channelName}\n- Duration: ${metadata.videoDuration} minutes\n- Language: ${metadata.language}`;

    return prompt;
  }

  private async generateContent(prompt: string, videoUrl: string): Promise<{ text: string; tokenUsage: number }> {
    try {
      const videoPart = {
        inlineData: {
          mimeType: "video/mp4",
          data: videoUrl // In a real implementation, this would be the video data
        }
      };

      const textPart = {
        text: prompt
      };

      const result = await this.model.generateContent([videoPart, textPart]);
      const response = await result.response;
      const text = response.text();

      // Extract token usage from response
      const tokenUsage = response.usageMetadata?.totalTokenCount || 0;

      return { text, tokenUsage };

    } catch (error) {
      console.error('Gemini API error:', error);
      
      // Handle specific Gemini errors
      if (error instanceof Error) {
        if (error.message.includes('quota')) {
          throw new Error('API quota exceeded. Please try again later.');
        } else if (error.message.includes('invalid')) {
          throw new Error('Invalid video format or URL. Please check the YouTube link.');
        } else if (error.message.includes('size')) {
          throw new Error('Video file is too large. Please try a shorter video.');
        }
      }
      
      throw new Error('Failed to process video. Please try again.');
    }
  }

  private calculateCost(tokenCount: number): number {
    // Gemini 2.0 Flash pricing (approximate)
    const inputCostPer1kTokens = 0.00015; // $0.00015 per 1K input tokens
    const outputCostPer1kTokens = 0.0006; // $0.0006 per 1K output tokens
    
    // Estimate 70% input, 30% output tokens
    const inputTokens = Math.floor(tokenCount * 0.7);
    const outputTokens = tokenCount - inputTokens;
    
    const inputCost = (inputTokens / 1000) * inputCostPer1kTokens;
    const outputCost = (outputTokens / 1000) * outputCostPer1kTokens;
    
    return inputCost + outputCost;
  }

  // Queue management for long-running processes
  async queueVideoProcessing(request: VideoProcessingRequest, priority: 'low' | 'medium' | 'high' = 'medium'): Promise<string> {
    const queueItem: ProcessingQueueItem = {
      id: `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      request,
      createdAt: new Date(),
      priority,
      retryCount: 0
    };

    this.processingQueue.push(queueItem);
    
    // Sort queue by priority and creation time
    this.processingQueue.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      
      if (priorityDiff !== 0) return priorityDiff;
      return a.createdAt.getTime() - b.createdAt.getTime();
    });

    console.log(`📋 Added to processing queue: ${queueItem.id} (priority: ${priority})`);
    
    // Start processing if not already running
    if (!this.isProcessing) {
      this.processQueue();
    }

    return queueItem.id;
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.processingQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.processingQueue.length > 0) {
      const item = this.processingQueue.shift();
      
      if (!item) continue;

      try {
        console.log(`🔄 Processing queue item: ${item.id}`);
        await this.processVideo(item.request);
        
      } catch (error) {
        console.error(`❌ Queue processing failed for ${item.id}:`, error);
        
        // Retry logic
        if (item.retryCount < 3) {
          item.retryCount++;
          console.log(`🔄 Retrying ${item.id} (attempt ${item.retryCount}/3)`);
          this.processingQueue.push(item);
        } else {
          console.error(`💥 Max retries exceeded for ${item.id}`);
        }
      }

      // Add delay between processing to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    this.isProcessing = false;
    console.log(`✅ Processing queue completed`);
  }

  // Utility methods
  getQueueStatus(): { length: number; isProcessing: boolean } {
    return {
      length: this.processingQueue.length,
      isProcessing: this.isProcessing
    };
  }

  getQueueItems(): ProcessingQueueItem[] {
    return [...this.processingQueue];
  }

  clearQueue(): void {
    this.processingQueue = [];
    console.log(`🧹 Processing queue cleared`);
  }

  // Health check method
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; message: string }> {
    try {
      // Test with a simple text generation
      const result = await this.model.generateContent('Hello');
      await result.response;
      
      return {
        status: 'healthy',
        message: 'Gemini API is responding correctly'
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `API check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}

// Singleton instance
export const geminiClient = new GeminiClient();
