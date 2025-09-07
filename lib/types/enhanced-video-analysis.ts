/**
 * Enhanced Video Analysis Types
 * TypeScript interfaces for comprehensive video processing and chatbot context
 */

// =============================================================================
// TRANSCRIPT ANALYSIS
// =============================================================================
export interface TranscriptSegment {
  startTime: number; // seconds
  endTime: number; // seconds
  text: string;
  speaker?: string;
  confidence: number; // 0-1
  isImportant?: boolean; // Flagged as key content
}

export interface FullTranscript {
  segments: TranscriptSegment[];
  totalDuration: number;
  language: string;
  averageConfidence: number;
  wordCount: number;
}

// =============================================================================
// VISUAL ANALYSIS
// =============================================================================
export interface VisualFrame {
  timestamp: number; // seconds
  description: string;
  elements: string[]; // detected visual elements
  extractedText?: string; // OCR from slides/diagrams
  type: 'slide' | 'diagram' | 'chart' | 'scene' | 'other';
  confidence: number;
}

export interface VisualAnalysis {
  keyFrames: VisualFrame[];
  hasSlides: boolean;
  hasCharts: boolean;
  hasDiagrams: boolean;
  visualComplexity: 'low' | 'medium' | 'high';
  screenTextRatio: number; // percentage of frames with text
}

// =============================================================================
// CONTENT STRUCTURE
// =============================================================================
export interface ContentChapter {
  title: string;
  startTime: number;
  endTime: number;
  summary: string;
  keyPoints: string[];
  importance: 'low' | 'medium' | 'high';
}

export interface ContentStructure {
  chapters: ContentChapter[];
  mainTopics: string[];
  flowType: 'linear' | 'branching' | 'cyclical';
  hasIntroduction: boolean;
  hasConclusion: boolean;
  transitionPoints: number[]; // timestamps of major transitions
}

// =============================================================================
// CONCEPT ANALYSIS
// =============================================================================
export interface Concept {
  name: string;
  definition: string;
  aliases: string[]; // alternative names/terms
  timestamps: number[]; // when mentioned in video
  relatedConcepts: string[];
  importance: 'core' | 'supporting' | 'peripheral';
  difficulty: 'basic' | 'intermediate' | 'advanced';
  visualAids?: number[]; // timestamps of visual explanations
}

export interface ConceptMap {
  concepts: Concept[];
  relationships: Array<{
    from: string;
    to: string;
    type: 'prerequisite' | 'related' | 'example' | 'opposite';
    strength: number; // 0-1
  }>;
  hierarchyLevels: string[][]; // concepts grouped by complexity/dependency
}

// =============================================================================
// STUDY AIDS
// =============================================================================
export interface StudyQuestion {
  question: string;
  type: 'factual' | 'conceptual' | 'analytical' | 'synthesis';
  difficulty: 'easy' | 'medium' | 'hard';
  relatedTimestamp?: number;
  relatedConcepts: string[];
  suggestedAnswer?: string;
}

export interface KeyTimestamp {
  time: number;
  title: string;
  description: string;
  type: 'definition' | 'example' | 'summary' | 'transition' | 'important';
  relatedConcepts: string[];
}

// =============================================================================
// COMPREHENSIVE ANALYSIS RESULT
// =============================================================================
export interface EnhancedVideoAnalysis {
  // Core Analysis
  fullTranscript: FullTranscript;
  visualAnalysis: VisualAnalysis;
  contentStructure: ContentStructure;
  conceptMap: ConceptMap;
  
  // Classification
  primarySubject: string;
  secondarySubjects: string[];
  contentTags: string[];
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
  
  // Study Aids
  suggestedQuestions: StudyQuestion[];
  keyTimestamps: KeyTimestamp[];
  
  // All Template Outputs (generated simultaneously)
  allTemplateOutputs: Record<string, {
    content: string;
    verbosityLevels?: {
      brief?: string;
      standard?: string;
      comprehensive?: string;
    };
  }>;
  
  // Processing Metadata
  analysisVersion: string;
  processingTime: number; // milliseconds
  totalTokensUsed: number;
  analysisCostInCents: number;
  
  // Quality Metrics
  transcriptConfidence: number;
  analysisCompleteness: number; // 0-1, how much was successfully analyzed
  
  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// CHATBOT CONTEXT INTERFACE
// =============================================================================
export interface ChatbotVideoContext {
  // Video Identification
  videoId: string;
  title: string;
  youtubeUrl: string;
  duration: number;
  
  // User Context
  currentlyViewingFormat?: string;
  currentVerbosityLevel?: 'brief' | 'standard' | 'comprehensive';
  userSubscriptionTier: 'free' | 'basic' | 'pro';
  
  // Comprehensive Analysis
  analysis: EnhancedVideoAnalysis;
  
  // Chat History (for context continuity)
  recentQuestions?: Array<{
    question: string;
    timestamp: Date;
    relatedConcepts: string[];
  }>;
}

// =============================================================================
// PROCESSING REQUEST/RESPONSE
// =============================================================================
export interface EnhancedProcessingRequest {
  videoId: string;
  youtubeUrl: string;
  userId: string;
  requestedTemplates: string[]; // Which templates to generate
  generateFullAnalysis: boolean; // Whether to do comprehensive analysis
  priority: 'low' | 'medium' | 'high';
}

export interface EnhancedProcessingResponse {
  success: boolean;
  videoId: string;
  analysis?: EnhancedVideoAnalysis;
  error?: string;
  processingTime: number;
  tokensUsed: number;
  cost: number;
}