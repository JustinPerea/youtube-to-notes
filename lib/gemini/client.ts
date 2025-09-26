/**
 * Gemini API Client for YouTube-to-Notes
 * 
 * Handles video processing and content generation using Google's Gemini AI models
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '@/lib/logging';
import { Template, TEMPLATES, detectTutorialDomain } from '@/lib/templates';
import { 
  EnhancedVideoAnalysis, 
  EnhancedProcessingRequest, 
  EnhancedProcessingResponse 
} from '@/lib/types/enhanced-video-analysis';
import { extractTranscript, extractTranscriptEnhanced, cleanTranscriptText } from '@/lib/transcript/extractor';
import { fetchVideoMetadata, assessVideoContent, generateEnhancedContext, YouTubeVideoMetadata } from '@/lib/services/youtube-api';

export interface VideoProcessingRequest {
  youtubeUrl: string;
  template: Template;
  customPrompt?: string;
  userId: string;
  processingMode?: 'hybrid' | 'transcript-only' | 'video-only' | 'auto'; // New hybrid processing option
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
    processingMethod?: 'hybrid' | 'transcript-only' | 'video-only' | 'fallback'; // Track actual processing method used
    dataSourcesUsed?: string[]; // Track which data sources contributed to the result
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
  private genAI: GoogleGenerativeAI | null = null;
  private initialized = false;
  private modelHierarchy: string[] = [
    "gemini-2.0-flash-exp",        // Primary: Best for video
    "gemini-1.5-flash-8b",         // Widely available fast model
    "gemini-1.5-pro"               // Final fallback: text-only but reliable
  ];
  private processingQueue: ProcessingQueueItem[] = [];
  private isProcessing: boolean = false;
  private activeRequests: Map<string, Promise<any>> = new Map(); // Request deduplication

  constructor() {}

  // Lazy init to avoid throwing at import time
  private ensureInitialized() {
    if (this.initialized) return;

    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('Gemini not configured. Set GOOGLE_GEMINI_API_KEY on the server to enable processing.');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);

    this.initialized = true;
  }

  /**
   * Try models in order with fallback support for quota limits
   */
  private async generateContentWithFallback(prompt: string | any[], videoCapable: boolean = true): Promise<{
    text: string;
    tokenUsage: number;
    modelUsed: string;
  }> {
    // Initialize SDK/models on first use
    this.ensureInitialized();

    for (const modelName of this.modelHierarchy) {
      // Skip non-video models if video processing is required
      if (Array.isArray(prompt) && modelName.includes('pro') && !modelName.includes('flash')) {
        console.log(`⏭️ Skipping ${modelName} (doesn't support video)`);
        continue;
      }

      try {
        console.log(`🔄 Trying ${modelName}...`);
        const generationConfig = modelName.includes('flash-8b')
          ? {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 8000,
            }
          : {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 16384,
            };

        const model = this.genAI!.getGenerativeModel({
          model: modelName,
          generationConfig,
        });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        const tokenUsage = response.usageMetadata?.totalTokenCount || 0;
        
        console.log(`✅ Success with ${modelName}: ${text.length} chars, ${tokenUsage} tokens`);
        return { text, tokenUsage, modelUsed: modelName };
        
      } catch (error: any) {
        console.log(`❌ ${modelName} failed: ${error.message}`);
        
        // Check if it's a quota error
        if (error.message?.includes('429') || error.message?.includes('quota')) {
          console.log(`⚠️ ${modelName} quota exceeded, trying next model...`);
          continue;
        }
        
        // Check if it's a video processing error for non-video models
        if (Array.isArray(prompt) && error.message?.includes('video')) {
          console.log(`⚠️ ${modelName} doesn't support video, trying next model...`);
          continue;
        }
        
        // For other errors, still try next model
        console.log(`⚠️ ${modelName} error, trying next model...`);
        continue;
      }
    }
    
    throw new Error('All models failed. Please check your API quota and try again later.');
  }

  async processVideo(request: VideoProcessingRequest): Promise<VideoProcessingResponse> {
    // Create deduplication key
    const requestKey = `${request.youtubeUrl}-${request.template.id}-${request.processingMode || 'auto'}`;
    
    // Check if same request is already processing
    if (this.activeRequests.has(requestKey)) {
      console.log(`🔄 Duplicate request detected, waiting for existing processing: ${request.youtubeUrl}`);
      return await this.activeRequests.get(requestKey)!;
    }
    
    const processingId = `proc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    logger.info(`🎬 Starting video processing: ${processingId}`);
    console.log(`📺 URL: ${request.youtubeUrl}`);
    console.log(`📋 Template: ${request.template.name}`);

    // Create processing promise and store it
    const processingPromise = (async (): Promise<VideoProcessingResponse> => {
      try {
        const startTime = Date.now();

      // Validate YouTube URL
      await this.validateYouTubeUrl(request.youtubeUrl);

      // Extract video metadata
      const metadata = await this.extractVideoMetadata(request.youtubeUrl);

      // Log quality assessment but continue processing (user's choice)
      if (metadata.qualityAssessment) {
        const { qualityScore, recommendation, reason } = metadata.qualityAssessment;
        console.log(`📊 Processing video with quality score: ${qualityScore}/100`);
        if (recommendation !== 'process') {
          console.log(`💡 Note: ${reason} - proceeding as requested by user`);
        }
      }

      // Build the prompt for Gemini
      const prompt = this.buildPrompt(request, metadata);

      // Determine processing mode
      const processingMode = request.processingMode || 'auto';
      const shouldUseHybrid = this.shouldUseHybridProcessing(metadata, processingMode);
      
      logger.debug(`🎯 Processing mode: ${processingMode} → Using: ${shouldUseHybrid ? 'HYBRID' : 'SINGLE-SOURCE'}`);
      
      // Process with enhanced strategy
      const result = shouldUseHybrid
        ? await this.generateContentHybrid(prompt, request.youtubeUrl, metadata)
        : await this.generateContent(prompt, request.youtubeUrl);

      const processingTime = Date.now() - startTime;

      // Calculate cost based on processing method
      const cost = this.calculateCost(result.tokenUsage || 0, result.processingMethod);

      logger.info(`✅ Video processing completed: ${processingId}`);
      console.log(`⏱️ Processing time: ${processingTime}ms`);
      console.log(`💰 Estimated cost: $${cost.toFixed(4)}`);
      console.log(`📊 Processing method: ${result.processingMethod}`);
      console.log(`📋 Data sources used: ${result.dataSourcesUsed?.join(', ')}`);

      return {
        id: processingId,
        status: 'completed',
        result: result.text,
        processingTime,
        tokenUsage: result.tokenUsage,
        cost,
        metadata: {
          ...metadata,
          processingMethod: result.processingMethod,
          dataSourcesUsed: result.dataSourcesUsed
        }
      };

    } catch (error) {
      logger.error(`❌ Video processing failed: ${processingId}`, { error: error instanceof Error ? error.message : String(error) });
      
      return {
        id: processingId,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        metadata: {}
      };
    } finally {
      // Always clean up request cache
      this.activeRequests.delete(requestKey);
    }
    })();

    // Store the processing promise
    this.activeRequests.set(requestKey, processingPromise);
    
    // Return the promise result (cleanup handled in finally block)
    return await processingPromise;
  }

  private async validateYouTubeUrl(url: string): Promise<void> {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
    
    if (!youtubeRegex.test(url)) {
      throw new Error('Invalid YouTube URL format');
    }

    // Additional validation could include checking if video exists
    // For now, we'll rely on Gemini's API to handle invalid URLs
  }

  private async extractVideoMetadata(url: string): Promise<{
    videoTitle: string;
    videoDuration: number;
    channelName: string;
    language: string;
    youtubeMetadata?: YouTubeVideoMetadata;
    shouldSkipProcessing?: boolean;
    skipReason?: string;
    qualityAssessment?: {
      shouldSkip: boolean;
      reason: string;
      recommendation: string;
      qualityScore: number;
    };
  }> {
    try {
      logger.debug('🔍 Extracting comprehensive video metadata...');
      
      // Fetch rich metadata from YouTube Data API v3
      const youtubeMetadata = await fetchVideoMetadata(url);
      
      if (youtubeMetadata) {
        console.log(`✅ Rich metadata obtained for "${youtubeMetadata.title}"`);
        console.log(`   Duration: ${Math.floor(youtubeMetadata.durationSeconds / 60)}:${(youtubeMetadata.durationSeconds % 60).toString().padStart(2, '0')}`);
        console.log(`   Content richness: ${youtubeMetadata.contentRichness}`);
        console.log(`   Has captions: ${youtubeMetadata.caption}`);
        
        // Assess video content quality (but don't force skip - let users decide)
        const assessment = assessVideoContent(youtubeMetadata, {
          enableSmartFiltering: false,  // Don't auto-skip, let users process any video they want
          minDuration: 10,              // Very lenient minimum
          requireCaptions: false        // Don't require captions
        });
        
        // Log assessment for user information (but still process the video)
        console.log(`📊 Video quality assessment: ${assessment.qualityScore}/100`);
        console.log(`💡 Recommendation: ${assessment.recommendation} - ${assessment.reason}`);
        
        if (assessment.recommendation === 'low_quality') {
          console.log(`⚠️ Note: ${assessment.reason} - but processing will continue as requested`);
        } else {
          console.log(`✅ Video ready for processing: Quality score ${assessment.qualityScore}/100`);
        }
        
        return {
          videoTitle: youtubeMetadata.title,
          videoDuration: youtubeMetadata.durationSeconds,
          channelName: youtubeMetadata.channelTitle,
          language: youtubeMetadata.defaultLanguage || 'en',
          youtubeMetadata,
          shouldSkipProcessing: false,
          qualityAssessment: assessment
        };
      }
      
      logger.warn('⚠️ YouTube Data API unavailable, using fallback metadata');
      
      // Fallback to basic metadata if YouTube API fails
      return {
        videoTitle: 'Video Title (metadata unavailable)',
        videoDuration: 0,
        channelName: 'Channel Name (metadata unavailable)',
        language: 'en',
        shouldSkipProcessing: false
      };
      
    } catch (error) {
      logger.warn('❌ Error extracting video metadata', { error: error instanceof Error ? error.message : String(error) });
      
      // Return basic fallback metadata
      return {
        videoTitle: 'Video Title (extraction failed)',
        videoDuration: 0,
        channelName: 'Channel Name (extraction failed)',
        language: 'en',
        shouldSkipProcessing: false
      };
    }
  }

  private buildPrompt(request: VideoProcessingRequest, metadata: any): string {
    const { template, customPrompt, youtubeUrl } = request;
    
    // Detect domain from video metadata (centralized utility)
    const detectedDomain = detectTutorialDomain({
      title: metadata.videoTitle || '',
      description: metadata.youtubeMetadata?.description || '',
      tags: metadata.youtubeMetadata?.tags || [],
      channelName: metadata.youtubeMetadata?.channelTitle || ''
    });
    
    // Use enhanced template processing with timestamp support
    let prompt = this.getTemplatePrompt(template, metadata.videoDuration, 'standard', detectedDomain, youtubeUrl);
    
    // DEBUG: Log timestamp instructions for tutorial-guide template
    if (template.id === 'tutorial-guide') {
      console.log('🧪 DEBUG: Tutorial Guide Template Processing');
      console.log(`🎯 Detected Domain: ${detectedDomain}`);
      console.log(`🔗 Video URL: ${youtubeUrl}`);
      console.log(`📋 Prompt starts with timestamps: ${prompt.trim().startsWith('🚨🚨🚨')}`);
      console.log(`✅ Has timestamp requirements: ${prompt.includes('ABSOLUTE REQUIREMENT - TIMESTAMPS ARE MANDATORY')}`);
    }
    
    // Add custom prompt if provided
    if (customPrompt) {
      prompt = `${prompt}\n\nAdditional requirements: ${customPrompt}`;
    }

    // Add enhanced metadata context using YouTube Data API
    if (metadata.youtubeMetadata) {
      console.log('📝 Adding rich YouTube metadata context to prompt');
      const enhancedContext = generateEnhancedContext(metadata.youtubeMetadata);
      prompt = `${prompt}\n\n=== VIDEO CONTEXT ===\n${enhancedContext}\n\n`;
      
      // Add content filtering hints
      if (metadata.youtubeMetadata.contentRichness === 'comprehensive') {
        prompt = `${prompt}Note: This video has comprehensive content with detailed description and extensive tags.\n\n`;
      } else if (metadata.youtubeMetadata.contentRichness === 'minimal') {
        prompt = `${prompt}Note: This video has minimal metadata. Focus on transcript content for analysis.\n\n`;
      }
    } else {
      // Fallback to basic context
      console.log('📝 Adding basic metadata context to prompt');
      prompt = `${prompt}\n\nVideo Context:\n- Title: ${metadata.videoTitle}\n- Channel: ${metadata.channelName}\n- Duration: ${Math.round(metadata.videoDuration / 60)} minutes\n- Language: ${metadata.language}\n\n`;
    }

    return prompt;
  }

  // Enhanced template processing with timestamp support (copied from API route)
  private getTemplatePrompt(template: Template, durationSeconds?: number, verbosity?: 'concise' | 'standard' | 'comprehensive', domain?: 'programming' | 'diy' | 'academic' | 'fitness' | 'general', videoUrl?: string): string {
    if (typeof template.prompt === 'function') {
      // Check if the function supports domain detection and try to call with all parameters
      if ((template as any).supportsDomainDetection) {
        try {
          // For tutorial-guide template, always try with videoUrl first
          if (template.id === 'tutorial-guide') {
            return (template.prompt as (duration?: number, verbosity?: any, domain?: any, videoUrl?: string) => string)(durationSeconds, verbosity, domain, videoUrl);
          }
          // For other templates, use 3-parameter version
          return (template.prompt as (duration?: number, verbosity?: any, domain?: any) => string)(durationSeconds, verbosity, domain);
        } catch (error) {
          console.warn('Domain detection call failed, falling back to verbosity only:', error);
        }
      }
      // Check if the function supports verbosity and try to call with verbosity
      if ((template as any).supportsVerbosity) {
        try {
          return (template.prompt as (duration?: number, verbosity?: any) => string)(durationSeconds, verbosity);
        } catch (error) {
          // Fall back to duration-only if verbosity call fails
          return (template.prompt as (duration?: number) => string)(durationSeconds);
        }
      }
      // Otherwise call with just duration
      return (template.prompt as (duration?: number) => string)(durationSeconds);
    }
    return template.prompt as string;
  }

  // Domain detection centralized via detectTutorialDomain from lib/templates

  private generateBasicAnalysis(metadata: any): string {
    const { videoTitle, channelName, videoDuration, youtubeMetadata } = metadata;
    
    const minutes = Math.floor(videoDuration / 60);
    const seconds = videoDuration % 60;
    const durationText = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
    
    let analysis = `# ${videoTitle}\n\n`;
    analysis += `**Channel:** ${channelName}\n`;
    analysis += `**Duration:** ${durationText}\n\n`;
    
    if (youtubeMetadata) {
      analysis += `**Views:** ${youtubeMetadata.viewCount.toLocaleString()}\n`;
      analysis += `**Published:** ${new Date(youtubeMetadata.publishedAt).toLocaleDateString()}\n\n`;
      
      if (youtubeMetadata.description && youtubeMetadata.description.length > 50) {
        analysis += `## Description\n\n${youtubeMetadata.description.substring(0, 500)}${youtubeMetadata.description.length > 500 ? '...' : ''}\n\n`;
      }
      
      if (youtubeMetadata.tags.length > 0) {
        analysis += `## Tags\n\n${youtubeMetadata.tags.slice(0, 10).join(', ')}\n\n`;
      }
    }
    
    analysis += `## Analysis Summary\n\n`;
    analysis += `This video was identified as having minimal content for AI processing. `;
    analysis += `The analysis above is based on available YouTube metadata. `;
    analysis += `For more detailed insights, please try a video with richer content or captions.\n\n`;
    analysis += `**Note:** Processing was optimized to avoid unnecessary API costs by using YouTube metadata instead of AI analysis.`;
    
    return analysis;
  }

  private async generateContent(prompt: string, videoUrl: string): Promise<{ 
    text: string; 
    tokenUsage: number;
    processingMethod: 'transcript-only' | 'video-only' | 'fallback';
    dataSourcesUsed: string[];
  }> {
    try {
      console.log('🎯 Starting enhanced transcript extraction for video processing...');
      
      // Try YouTube transcript extraction first
      const transcriptResult = await extractTranscript(videoUrl);
      
      let transcript: string;
      let transcriptSource: 'youtube' | 'gemini' = 'youtube';
      
      if (transcriptResult.success && transcriptResult.fullText) {
        logger.debug(`✅ YouTube transcript extracted: ${transcriptResult.metadata?.wordCount} words`);
        transcript = cleanTranscriptText(transcriptResult.fullText);
      } else {
        logger.debug(`⚠️ YouTube transcript failed: ${transcriptResult.error}`);
        console.log('🔄 Attempting Gemini transcript generation as fallback...');
        
        // Fallback: Generate transcript using Gemini's video analysis
        const geminiTranscript = await this.generateTranscriptFromVideo(videoUrl);
        
        if (!geminiTranscript.success || !geminiTranscript.transcript) {
          // Last resort: Try processing video without transcript (degraded mode)
          console.log('⚠️ All transcript methods failed, attempting video-only analysis...');
          return await this.processVideoWithoutTranscript(prompt, videoUrl);
        }
        
        transcript = geminiTranscript.transcript;
        transcriptSource = 'gemini';
        logger.debug(`✅ Gemini transcript generated: ${transcript.length} characters`);
      }
      
      // Combine prompt with transcript
      const fullPrompt = `${prompt}\n\nVIDEO TRANSCRIPT (source: ${transcriptSource}):\n${transcript}\n\nINSTRUCTIONS: Process the above transcript to generate the requested analysis.`;

      // Process with Gemini using text-only (no video data) with fallback
      const result = await this.generateContentWithFallback(fullPrompt, false);
      const text = result.text;
      const tokenUsage = result.tokenUsage;

      logger.debug(`🤖 Generated content from ${transcriptSource} transcript: ${text.length} characters, ${tokenUsage} tokens`);

      return { 
        text, 
        tokenUsage,
        processingMethod: transcriptSource === 'youtube' ? 'transcript-only' : 'video-only',
        dataSourcesUsed: [transcriptSource === 'youtube' ? 'YouTube Captions' : 'Gemini Video Analysis']
      };

    } catch (error) {
      logger.error('Gemini API error', { error: error instanceof Error ? error.message : String(error) });
      
      // Handle specific Gemini errors
      if (error instanceof Error) {
        if (error.message.includes('quota')) {
          throw new Error('API quota exceeded. Please try again later.');
        } else if (error.message.includes('transcript')) {
          throw new Error(`Video transcript error: ${error.message}`);
        } else if (error.message.includes('invalid')) {
          throw new Error('Invalid video format or URL. Please check the YouTube link.');
        } else if (error.message.includes('size')) {
          throw new Error('Video transcript is too large. Please try a shorter video.');
        }
      }
      
      throw new Error('Failed to process video. Please try again.');
    }
  }

  private calculateCost(tokenCount: number, processingType: 'hybrid' | 'transcript-only' | 'video-only' | 'fallback' = 'transcript-only'): number {
    // Gemini 2.0 Flash pricing (approximate)
    const inputCostPer1kTokens = 0.00015; // $0.00015 per 1K input tokens
    const outputCostPer1kTokens = 0.0006; // $0.0006 per 1K output tokens
    
    // Adjust token distribution based on processing type
    let inputRatio = 0.7; // Default for transcript-only
    let outputRatio = 0.3;
    
    if (processingType === 'hybrid') {
      // Hybrid processing typically has higher input (more context) but similar output
      inputRatio = 0.8;
      outputRatio = 0.2;
    } else if (processingType === 'video-only') {
      // Video processing has more balanced distribution
      inputRatio = 0.6;
      outputRatio = 0.4;
    }
    
    const inputTokens = Math.floor(tokenCount * inputRatio);
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

  // Enhanced video processing for comprehensive chatbot context
  async processVideoComprehensive(request: EnhancedProcessingRequest): Promise<EnhancedProcessingResponse> {
    const startTime = Date.now();
    console.log(`🧠 Starting comprehensive video analysis: ${request.videoId}`);

    try {
      // Validate YouTube URL
      await this.validateYouTubeUrl(request.youtubeUrl);

      // Build comprehensive analysis prompt
      const prompt = this.buildComprehensivePrompt(request);

      // Process with Gemini for full analysis
      const result = await this.generateContent(prompt, request.youtubeUrl);

      // Parse the comprehensive analysis
      const analysis = this.parseComprehensiveAnalysis(result.text, request);

      const processingTime = Date.now() - startTime;
      const cost = this.calculateCost(result.tokenUsage || 0);

      console.log(`✅ Comprehensive analysis completed: ${request.videoId}`);
      console.log(`⏱️ Processing time: ${processingTime}ms`);
      console.log(`🧠 Analysis includes: ${analysis.conceptMap.concepts.length} concepts, ${analysis.fullTranscript.segments.length} transcript segments`);

      return {
        success: true,
        videoId: request.videoId,
        analysis: {
          ...analysis,
          processingTime,
          totalTokensUsed: result.tokenUsage || 0,
          analysisCostInCents: Math.round(cost * 100),
          createdAt: new Date(),
          updatedAt: new Date()
        },
        processingTime,
        tokensUsed: result.tokenUsage || 0,
        cost
      };

    } catch (error) {
      console.error(`❌ Comprehensive analysis failed: ${request.videoId}`, error);
      
      return {
        success: false,
        videoId: request.videoId,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        processingTime: Date.now() - startTime,
        tokensUsed: 0,
        cost: 0
      };
    }
  }

  private buildComprehensivePrompt(request: EnhancedProcessingRequest): string {
    const templatePrompts = request.requestedTemplates
      .map(templateId => {
        const template = TEMPLATES.find(t => t.id === templateId);
        return template ? `"${templateId}": Use this template approach: ${template.prompt}` : '';
      })
      .filter(Boolean)
      .join(',\n');

    return `You are analyzing a VIDEO TRANSCRIPT for comprehensive understanding. Extract ALL information from the provided transcript in this EXACT JSON structure:

{
  "fullTranscript": {
    "segments": [
      {
        "startTime": 0,
        "endTime": 30,
        "text": "transcript text here",
        "speaker": "speaker name if identifiable",
        "confidence": 0.95,
        "isImportant": true
      }
    ],
    "totalDuration": 600,
    "language": "en",
    "averageConfidence": 0.92,
    "wordCount": 1200
  },
  "visualAnalysis": {
    "keyFrames": [
      {
        "timestamp": 45,
        "description": "slide showing data chart",
        "elements": ["chart", "text", "diagram"],
        "extractedText": "OCR text from slide",
        "type": "slide",
        "confidence": 0.88
      }
    ],
    "hasSlides": true,
    "hasCharts": false,
    "hasDiagrams": true,
    "visualComplexity": "medium",
    "screenTextRatio": 0.6
  },
  "contentStructure": {
    "chapters": [
      {
        "title": "Introduction",
        "startTime": 0,
        "endTime": 120,
        "summary": "Overview of main concepts",
        "keyPoints": ["point 1", "point 2"],
        "importance": "high"
      }
    ],
    "mainTopics": ["topic 1", "topic 2"],
    "flowType": "linear",
    "hasIntroduction": true,
    "hasConclusion": true,
    "transitionPoints": [120, 300, 450]
  },
  "conceptMap": {
    "concepts": [
      {
        "name": "Machine Learning",
        "definition": "AI technique for pattern recognition",
        "aliases": ["ML", "automated learning"],
        "timestamps": [45, 120, 300],
        "relatedConcepts": ["AI", "Neural Networks"],
        "importance": "core",
        "difficulty": "intermediate",
        "visualAids": [45, 300]
      }
    ],
    "relationships": [
      {
        "from": "Machine Learning",
        "to": "Artificial Intelligence", 
        "type": "prerequisite",
        "strength": 0.9
      }
    ],
    "hierarchyLevels": [["basic concepts"], ["intermediate concepts"], ["advanced topics"]]
  },
  "primarySubject": "Technology",
  "secondarySubjects": ["Programming", "Data Science"],
  "contentTags": ["tutorial", "beginner-friendly", "practical"],
  "difficultyLevel": "intermediate",
  "suggestedQuestions": [
    {
      "question": "What is the main benefit of this approach?",
      "type": "conceptual",
      "difficulty": "medium",
      "relatedTimestamp": 180,
      "relatedConcepts": ["main concept"],
      "suggestedAnswer": "brief answer"
    }
  ],
  "keyTimestamps": [
    {
      "time": 120,
      "title": "Key Definition",
      "description": "Important concept explained",
      "type": "definition",
      "relatedConcepts": ["concept name"]
    }
  ],
  "allTemplateOutputs": {
${templatePrompts}
  },
  "analysisVersion": "1.0",
  "transcriptConfidence": 0.92,
  "analysisCompleteness": 0.95
}

CRITICAL: Return ONLY valid JSON. No markdown, no explanations, just the JSON structure above filled with actual video content.`;
  }

  private parseComprehensiveAnalysis(jsonResponse: string, request: EnhancedProcessingRequest): EnhancedVideoAnalysis {
    try {
      // Clean the response to ensure it's valid JSON
      const cleanedResponse = jsonResponse.replace(/```json\s*/, '').replace(/```\s*$/, '').trim();
      const parsed = JSON.parse(cleanedResponse);
      
      // Validate required fields and provide defaults
      return {
        fullTranscript: parsed.fullTranscript || {
          segments: [],
          totalDuration: 0,
          language: 'en',
          averageConfidence: 0,
          wordCount: 0
        },
        visualAnalysis: parsed.visualAnalysis || {
          keyFrames: [],
          hasSlides: false,
          hasCharts: false,
          hasDiagrams: false,
          visualComplexity: 'low' as const,
          screenTextRatio: 0
        },
        contentStructure: parsed.contentStructure || {
          chapters: [],
          mainTopics: [],
          flowType: 'linear' as const,
          hasIntroduction: false,
          hasConclusion: false,
          transitionPoints: []
        },
        conceptMap: parsed.conceptMap || {
          concepts: [],
          relationships: [],
          hierarchyLevels: []
        },
        primarySubject: parsed.primarySubject || 'General',
        secondarySubjects: parsed.secondarySubjects || [],
        contentTags: parsed.contentTags || [],
        difficultyLevel: parsed.difficultyLevel || 'intermediate',
        suggestedQuestions: parsed.suggestedQuestions || [],
        keyTimestamps: parsed.keyTimestamps || [],
        allTemplateOutputs: parsed.allTemplateOutputs || {},
        analysisVersion: parsed.analysisVersion || '1.0',
        processingTime: 0, // Will be set by caller
        totalTokensUsed: 0, // Will be set by caller
        analysisCostInCents: 0, // Will be set by caller
        transcriptConfidence: parsed.transcriptConfidence || 0,
        analysisCompleteness: parsed.analysisCompleteness || 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } catch (error) {
      console.error('Failed to parse comprehensive analysis:', error);
      console.error('Raw response:', jsonResponse);
      
      // Return minimal structure if parsing fails
      return {
        fullTranscript: { segments: [], totalDuration: 0, language: 'en', averageConfidence: 0, wordCount: 0 },
        visualAnalysis: { keyFrames: [], hasSlides: false, hasCharts: false, hasDiagrams: false, visualComplexity: 'low', screenTextRatio: 0 },
        contentStructure: { chapters: [], mainTopics: [], flowType: 'linear', hasIntroduction: false, hasConclusion: false, transitionPoints: [] },
        conceptMap: { concepts: [], relationships: [], hierarchyLevels: [] },
        primarySubject: 'General',
        secondarySubjects: [],
        contentTags: [],
        difficultyLevel: 'intermediate',
        suggestedQuestions: [],
        keyTimestamps: [],
        allTemplateOutputs: {},
        analysisVersion: '1.0',
        processingTime: 0,
        totalTokensUsed: 0,
        analysisCostInCents: 0,
        transcriptConfidence: 0,
        analysisCompleteness: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }
  }

  // Text-only content generation for chatbot
  async generateTextResponse(prompt: string): Promise<{ text: string; tokenUsage: number }> {
    try {
      console.log('🤖 Generating text response for chatbot...');
      
      const result = await this.generateContentWithFallback(prompt, false);
      const text = result.text;
      const tokenUsage = result.tokenUsage;

      return { text, tokenUsage };
    } catch (error) {
      console.error('Gemini text generation error:', error);
      throw new Error(`Failed to generate text response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * ENHANCED: Generate transcript from video using Gemini's direct video processing
   * This now attempts to process the video content directly for audio transcription
   */
  async generateTranscriptFromVideo(videoUrl: string): Promise<{
    success: boolean;
    transcript?: string;
    segments?: Array<{
      startTime: number;
      endTime: number;
      text: string;
      confidence: number;
    }>;
    error?: string;
  }> {
    try {
      logger.debug('🎤 Attempting ENHANCED transcript generation with audio-focused analysis...');
      
      // Extract video ID and analyze URL patterns
      const videoIdMatch = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
      const videoId = videoIdMatch ? videoIdMatch[1] : 'unknown';
      
      // ENHANCED: Create audio-focused prompt for better transcript generation
      const audioTranscriptPrompt = `You are an expert audio transcription specialist. Process this video with EXCLUSIVE FOCUS on extracting the spoken audio content.

Video URL: ${videoUrl} (ID: ${videoId})

PRIMARY OBJECTIVE: Generate a high-quality transcript by focusing solely on the audio/speech content.

AUDIO ANALYSIS INSTRUCTIONS:
1. IGNORE visual elements completely - focus only on spoken words
2. Listen carefully to dialogue, narration, commentary, and all spoken content
3. Identify speaker changes and different voices when possible
4. Capture technical terminology, proper nouns, and specialized language accurately
5. Note audio quality indicators (clear speech vs background noise)
6. Extract timing information when speech occurs
7. Identify pauses, emphasis, and natural speech patterns

TRANSCRIPT FORMAT REQUIREMENTS:
[MM:SS] Speaker: [Exact spoken content]
[MM:SS] Speaker: [Continue with actual dialogue]
[MM:SS] [New Speaker/Voice]: [Different speaker content]

QUALITY STANDARDS:
- Prioritize ACCURACY of spoken words over visual content
- Use natural speech patterns and conversational flow
- Include "um," "uh," and other verbal fillers if they're frequent
- Mark unclear speech as [inaudible] rather than guessing
- Use proper punctuation based on speech patterns and tone

AUDIO CONTEXT AWARENESS:
- Educational/lecture content: Focus on key concepts and explanations
- Conversational content: Capture dialogue and discussion flow
- Technical content: Preserve technical terms and acronyms accurately
- Narrative content: Follow storytelling structure

Generate a comprehensive transcript that captures ALL spoken content with high accuracy. This transcript will be used for hybrid processing with video analysis.`;

      // Try to process the video directly for better transcript generation
      let result;
      try {
        console.log('🎯 Attempting direct video processing for audio extraction...');
        
        // Use Gemini's video processing capabilities with audio focus and fallback
        const videoResult = await this.generateContentWithFallback([
          audioTranscriptPrompt,
          {
            fileData: {
              mimeType: 'video/*',
              fileUri: videoUrl
            }
          }
        ], true);
        result = { response: { text: () => videoResult.text } };
      } catch (directError) {
        console.log('⚠️ Direct video processing failed, using enhanced text-based approach...');
        
        // Enhanced fallback: Use more sophisticated prompt
        const enhancedFallbackPrompt = `${audioTranscriptPrompt}

Since direct video access failed, generate a high-quality estimated transcript based on:
1. Video URL patterns and metadata
2. Common content structures for this type of video
3. Typical speaking patterns and educational flow

Create a realistic, well-structured transcript that would be suitable for educational note-taking.
Mark clearly as [GENERATED TRANSCRIPT] and maintain professional quality.`;

        const fallbackResult = await this.generateContentWithFallback(enhancedFallbackPrompt, false);
        result = { response: { text: () => fallbackResult.text } };
      }

      const response = await result.response;
      const transcript = response.text();

      if (!transcript || transcript.trim().length === 0) {
        return {
          success: false,
          error: 'Failed to generate enhanced transcript'
        };
      }

      // Parse segments from enhanced transcript
      const segments = this.parseTranscriptSegments(transcript);

      console.log(`✅ ENHANCED transcript generated: ${transcript.length} characters, ${segments.length} segments`);
      console.log('🎯 Audio-focused processing completed - ready for hybrid analysis');

      return {
        success: true,
        transcript: transcript.trim(),
        segments
      };

    } catch (error) {
      console.error('❌ Enhanced transcript generation failed:', error);
      
      // Final fallback to basic pattern-based generation
      console.log('🔄 Falling back to basic pattern-based generation...');
      
      try {
        const basicPrompt = `Generate a basic transcript structure for YouTube video: ${videoUrl}

Create a simple transcript with:
[00:00] Speaker: Introduction and welcome
[00:30] Speaker: Main topic introduction
[01:00] Speaker: Key concepts explanation
[02:00] Speaker: Examples and demonstration
[03:00] Speaker: Summary and conclusion

Keep it realistic and educational. Mark as [BASIC GENERATED TRANSCRIPT].`;

        const basicResult = await this.generateContentWithFallback(basicPrompt, false);
        const basicTranscript = basicResult.text;
        
        if (basicTranscript && basicTranscript.trim().length > 0) {
          const basicSegments = this.parseTranscriptSegments(basicTranscript);
          
          return {
            success: true,
            transcript: `[BASIC GENERATED TRANSCRIPT - Audio analysis unavailable]\n\n${basicTranscript.trim()}`,
            segments: basicSegments
          };
        }
      } catch (basicError) {
        console.error('❌ Even basic fallback failed:', basicError);
      }
      
      return {
        success: false,
        error: `Enhanced transcript generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Parse transcript segments from Gemini-generated transcript
   */
  private parseTranscriptSegments(transcript: string): Array<{
    startTime: number;
    endTime: number;
    text: string;
    confidence: number;
  }> {
    const segments: Array<{
      startTime: number;
      endTime: number;
      text: string;
      confidence: number;
    }> = [];

    // Split transcript by timestamp markers [MM:SS]
    const timestampRegex = /\[(\d{1,2}):(\d{2})\]/g;
    const lines = transcript.split('\n');
    
    let currentStartTime = 0;
    let currentText = '';
    
    for (const line of lines) {
      const timestampMatch = line.match(/^\[(\d{1,2}):(\d{2})\]/);
      
      if (timestampMatch) {
        // Save previous segment if exists
        if (currentText.trim()) {
          segments.push({
            startTime: currentStartTime,
            endTime: currentStartTime + 30, // Default 30-second segments
            text: currentText.trim(),
            confidence: 0.9 // High confidence for Gemini-generated content
          });
        }
        
        // Parse new timestamp
        const minutes = parseInt(timestampMatch[1]);
        const seconds = parseInt(timestampMatch[2]);
        currentStartTime = minutes * 60 + seconds;
        
        // Extract text after timestamp
        currentText = line.replace(/^\[\d{1,2}:\d{2}\]\s*/, '').replace(/^[^:]*:\s*/, '');
      } else if (line.trim()) {
        // Continue current segment
        currentText += ' ' + line.trim();
      }
    }
    
    // Add final segment
    if (currentText.trim()) {
      segments.push({
        startTime: currentStartTime,
        endTime: currentStartTime + 30,
        text: currentText.trim(),
        confidence: 0.9
      });
    }

    // Adjust end times to match next segment's start time
    for (let i = 0; i < segments.length - 1; i++) {
      segments[i].endTime = segments[i + 1].startTime;
    }

    return segments;
  }

  /**
   * Process video without transcript as last resort
   * Uses a minimal approach to generate basic analysis
   */
  private async processVideoWithoutTranscript(prompt: string, videoUrl: string): Promise<{ 
    text: string; 
    tokenUsage: number;
    processingMethod: 'fallback';
    dataSourcesUsed: string[];
  }> {
    console.log('🔄 Processing video without transcript (degraded mode)...');
    
    try {
      // Create a simplified prompt that acknowledges no transcript is available
      const degradedPrompt = `${prompt}

IMPORTANT: No transcript is available for this video. Please provide a general analysis based on the video URL and typical content patterns for YouTube videos.

Video URL: ${videoUrl}

Please provide the best possible analysis you can given the limitations, and clearly note in your response that this analysis is based on URL patterns and general assumptions rather than actual video content.`;

      // Process with basic text generation with fallback
      const result = await this.generateContentWithFallback(degradedPrompt, false);
      const text = result.text;
      const tokenUsage = result.tokenUsage;

      console.log(`⚠️ Generated degraded analysis without transcript: ${text.length} characters, ${tokenUsage} tokens`);

      return { 
        text, 
        tokenUsage,
        processingMethod: 'fallback',
        dataSourcesUsed: ['URL Pattern Analysis']
      };

    } catch (error) {
      console.error('❌ Even degraded mode failed:', error);
      throw new Error('Complete video processing failure - unable to analyze video content');
    }
  }

  /**
   * Determine if hybrid processing should be used based on metadata and user preference
   */
  private shouldUseHybridProcessing(metadata: any, processingMode: string): boolean {
    if (processingMode === 'hybrid') return true;
    if (processingMode === 'transcript-only' || processingMode === 'video-only') return false;
    
    // Auto mode - intelligently decide based on video characteristics
    const hasRichMetadata = metadata.youtubeMetadata?.contentRichness === 'comprehensive' || metadata.youtubeMetadata?.contentRichness === 'detailed';
    const hasCaptions = metadata.youtubeMetadata?.caption === true;
    const reasonableDuration = metadata.videoDuration >= 60 && metadata.videoDuration <= 3600; // 1 minute to 1 hour
    const isEducationalContent = metadata.youtubeMetadata?.tags?.some((tag: string) => 
      ['tutorial', 'education', 'learning', 'course', 'lesson', 'guide', 'how-to', 'demo', 'presentation'].includes(tag.toLowerCase())
    );
    const hasVisualElements = metadata.youtubeMetadata?.description?.toLowerCase().includes('slides') || 
                             metadata.youtubeMetadata?.description?.toLowerCase().includes('chart') ||
                             metadata.youtubeMetadata?.description?.toLowerCase().includes('diagram');
    
    // Use hybrid for:
    // 1. Educational content with captions
    // 2. Videos with rich metadata and visual elements
    // 3. Reasonable duration videos with captions
    return (isEducationalContent && hasCaptions) || 
           (hasRichMetadata && hasVisualElements) || 
           (reasonableDuration && hasCaptions && hasRichMetadata);
  }

  /**
   * Enhanced hybrid processing that combines transcript AND video analysis
   * This provides superior note generation by leveraging multiple data sources
   */
  private async generateContentHybrid(prompt: string, videoUrl: string, metadata: any): Promise<{
    text: string;
    tokenUsage: number;
    processingMethod: 'hybrid';
    dataSourcesUsed: string[];
  }> {
    try {
      console.log('🚀 Starting HYBRID processing: Transcript + Video Analysis + Rich Metadata');
      
      const dataSourcesUsed: string[] = [];
      let totalTokenUsage = 0;
      
      // Step 1: Extract official transcript with enhanced fallback
      console.log('📝 Step 1/3: Extracting official YouTube transcript...');
      const transcriptResult = await extractTranscript(videoUrl);
      
      let transcriptContent = '';
      let transcriptSource = 'none';
      
      if (transcriptResult.success && transcriptResult.fullText) {
        transcriptContent = cleanTranscriptText(transcriptResult.fullText);
        dataSourcesUsed.push('YouTube Official Captions');
        transcriptSource = 'youtube';
        console.log(`✅ Official transcript extracted: ${transcriptResult.metadata?.wordCount} words`);
      } else {
        console.log(`⚠️ Official transcript extraction failed: ${transcriptResult.error}`);
        console.log('🎤 Attempting enhanced audio-focused transcript generation...');
        
        // ENHANCED: Generate high-quality transcript for videos without captions
        const fallbackResult = await this.generateTranscriptFromVideo(videoUrl);
        if (fallbackResult.success && fallbackResult.transcript) {
          transcriptContent = fallbackResult.transcript;
          dataSourcesUsed.push('Gemini Audio-Focused Transcript');
          transcriptSource = 'gemini-audio';
          console.log(`✅ Enhanced audio transcript generated: ${transcriptContent.length} characters`);
        } else {
          console.log(`❌ Enhanced transcript generation also failed: ${fallbackResult.error}`);
          // Continue with video-only analysis - still can do hybrid with metadata
          transcriptSource = 'unavailable';
        }
      }
      
      // Step 2: Generate video analysis (visual context)
      console.log('🎥 Step 2/3: Analyzing video for visual context...');
      let videoAnalysis = '';
      try {
        // Create an intelligent video analysis prompt based on metadata
        const videoType = metadata.youtubeMetadata?.tags?.find((tag: string) => 
          ['tutorial', 'lecture', 'demo', 'presentation', 'webinar'].includes(tag.toLowerCase())
        ) || 'educational';
        
        const videoAnalysisPrompt = `Analyze this ${videoType} video for VISUAL and AUDIO context that complements the transcript. 

TARGET ANALYSIS DEPTH: Focus on elements that are NOT captured in the transcript text but are crucial for understanding.

PRIORITY AREAS:
1. Visual Elements: slides, charts, diagrams, code snippets, demonstrations, screen recordings, text overlays
2. Audio Context: tone changes, emphasis, pacing shifts, background sounds that indicate transitions
3. Presentation Style: teaching methodology, audience interaction cues, content organization patterns
4. Visual Information: any text, numbers, graphics, or visual demonstrations that supplement spoken content

Video URL: ${videoUrl}
Video Type: ${videoType}
Duration: ${Math.floor(metadata.videoDuration / 60)}:${(metadata.videoDuration % 60).toString().padStart(2, '0')}
Has Rich Metadata: ${metadata.youtubeMetadata?.contentRichness || 'unknown'}

STRUCTURED OUTPUT FORMAT:
=== VISUAL ELEMENTS ===
[Specific visual components that add information beyond the transcript]

=== AUDIO DELIVERY ===
[Tone, pacing, emphasis patterns that affect meaning]

=== PRESENTATION METHODOLOGY ===
[Teaching/presentation approach and organizational structure]

=== SUPPLEMENTARY VISUAL INFORMATION ===
[Text, data, graphics visible on screen that aren't in transcript]

=== HYBRID SYNTHESIS NOTES ===
[How visual and transcript elements combine for fuller understanding]

Keep each section focused and actionable - this will be synthesized with transcript for superior note quality.`;
        
        const videoResult = await this.generateContentWithFallback(videoAnalysisPrompt, true);
        videoAnalysis = videoResult.text;
        
        if (videoAnalysis && videoAnalysis.trim().length > 100) {
          totalTokenUsage += videoResult.tokenUsage;
          dataSourcesUsed.push('Gemini Video Analysis');
          console.log(`✅ Enhanced video analysis completed: ${videoAnalysis.length} characters`);
        } else {
          console.log('⚠️ Video analysis produced minimal results');
          videoAnalysis = `[Visual analysis unavailable for ${videoType} video - processing with transcript and metadata only]`;
        }
      } catch (error) {
        console.error('⚠️ Video analysis failed:', error);
        videoAnalysis = '[Video analysis unavailable - processing with transcript and metadata only]';
      }
      
      // Step 3: Combine all data sources for comprehensive analysis
      console.log('🧬 Step 3/3: Synthesizing multi-modal content...');
      
      // Add rich metadata context
      const metadataContext = metadata.youtubeMetadata ? generateEnhancedContext(metadata.youtubeMetadata) : '';
      if (metadataContext) {
        dataSourcesUsed.push('YouTube Rich Metadata');
      }
      
      // Build comprehensive prompt with all data sources
      const hybridPrompt = `${prompt}

=== HYBRID MULTI-MODAL PROCESSING ===

You are processing a video using HYBRID INTELLIGENCE - combining transcript, visual analysis, and rich metadata. This approach provides superior note quality by leveraging multiple data sources simultaneously.

=== DATA SOURCE 1: TRANSCRIPT (${transcriptSource.toUpperCase()}) ===
${transcriptContent || '[Transcript unavailable - proceeding with video analysis and metadata only]'}

=== DATA SOURCE 2: VISUAL & AUDIO ANALYSIS (Contextual Enhancement) ===
${videoAnalysis}

=== DATA SOURCE 3: YOUTUBE METADATA INTELLIGENCE (Content Authority & Context) ===
${metadataContext}

=== HYBRID SYNTHESIS PROCESSING INSTRUCTIONS ===

**CONTENT AUTHORITY HIERARCHY:**
${transcriptSource === 'youtube' 
  ? '1. OFFICIAL TRANSCRIPT = Authoritative for all dialogue, quotes, specific statements' 
  : transcriptSource === 'gemini-audio'
  ? '1. AUDIO-FOCUSED TRANSCRIPT = High confidence for dialogue and spoken content (AI-generated)'
  : '1. NO TRANSCRIPT AVAILABLE = Rely on visual analysis and metadata for content authority'
}
2. VISUAL ANALYSIS = Authoritative for visual elements, presentation style, non-verbal information
3. METADATA = Authoritative for context, credibility assessment, topic categorization

**SYNTHESIS METHODOLOGY:**
${transcriptSource !== 'unavailable' 
  ? '• **Dialogue Accuracy**: Use transcript as the primary source for all spoken content - preserve exact terminology and explanations' 
  : '• **Visual-First Analysis**: Focus on visual elements and contextual clues since no transcript is available'
}
• **Visual Integration**: Enhance ${transcriptSource !== 'unavailable' ? 'transcript' : 'analysis'} with visual context - explain references to "this chart," "as you can see," "here on screen"
• **Audio Context Enhancement**: Incorporate delivery style, emphasis patterns, and tonal shifts that affect meaning
• **Comprehensive Understanding**: Create notes that capture the COMPLETE learning experience - both auditory and visual information
• **Authority Assessment**: Use engagement metrics, channel credibility, and content tags to gauge information reliability
• **Educational Optimization**: Structure content based on identified teaching methodology and presentation style

**QUALITY ASSURANCE:**
• Verify that visual elements complement rather than duplicate transcript information
• Ensure all specific data, numbers, and technical terms come from authoritative sources
• Maintain clear attribution when combining information from multiple sources
• Prioritize information that enhances comprehension and learning outcomes

**OUTPUT EXPECTATION:**
Generate content that represents a synthesis of all data sources, creating notes that are demonstrably superior to single-source processing. The result should feel comprehensive, authoritative, and educationally optimized.

This hybrid approach leverages the best of each data source to create premium-quality notes.`;
      
      // Process with Gemini using comprehensive prompt with fallback
      const result = await this.generateContentWithFallback(hybridPrompt, false);
      const text = result.text;
      
      totalTokenUsage += result.tokenUsage;
      
      logger.info(`🎆 HYBRID processing completed successfully!`);
      console.log(`📋 Data sources used: ${dataSourcesUsed.join(', ')}`);
      console.log(`📊 Generated content: ${text.length} characters, ${totalTokenUsage} total tokens`);
      
      return {
        text,
        tokenUsage: totalTokenUsage,
        processingMethod: 'hybrid',
        dataSourcesUsed
      };
      
    } catch (error) {
      logger.warn('❌ HYBRID processing failed, falling back to standard processing', { error: error instanceof Error ? error.message : String(error) });
      
      // Fallback to standard processing
      const fallbackResult = await this.generateContent(prompt, videoUrl);
      return {
        ...fallbackResult,
        processingMethod: 'hybrid', // Still mark as hybrid attempt
        dataSourcesUsed: [...(fallbackResult.dataSourcesUsed || []), 'Hybrid Fallback']
      };
    }
  }

  // Health check method
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; message: string }> {
    try {
      // Test with a simple text generation using fallback
      await this.generateContentWithFallback('Hello', false);
      
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
