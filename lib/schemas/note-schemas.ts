/**
 * Structured JSON Schemas for Video Note Generation
 * 
 * These schemas ensure 100% format compliance and eliminate conversational language
 * by enforcing strict output structures through Gemini's native JSON generation.
 */

export interface BasicSummarySchema {
  title: string;
  mainTopic: string;
  keyPoints: string[];
  importantDetails: string[];
  structure: string;
  keyInsights: string[];
  conclusion: string;
  additionalContext: string;
}

export interface StudyNotesSchema {
  overview: {
    title: string;
    speaker: string;
    duration: string;
    mainTopic: string;
  };
  learningObjectives: string[];
  detailedNotes: {
    section: string;
    concepts: string[];
    examples: string[];
    formulas?: string[];
  }[];
  studyQuestions: string[];
  keyTerms: Record<string, string>;
  summaryPoints: string[];
  application: string;
}

export interface PresentationSlidesSchema {
  slides: {
    slideNumber: number;
    title: string;
    content: string[];
    speakerNotes: string;
  }[];
}

export interface ContentAnalysisSchema {
  type: 'educational' | 'entertainment' | 'tutorial' | 'lecture' | 'documentary' | 'music' | 'news' | 'technical';
  topics: string[];
  complexity: 'beginner' | 'intermediate' | 'advanced';
  format: 'sequential' | 'theoretical' | 'practical' | 'analytical';
  confidence: number;
  speechDensity: 'low' | 'medium' | 'high';
  temporalPattern: 'minimal_cuts' | 'moderate_cuts' | 'rapid_cuts';
  engagementType: 'educational' | 'entertainment' | 'mixed';
}

export interface VerbosityLevel {
  brief: {
    wordsPerConcept: [50, 75];
    format: 'bullet_points';
    supportingDetails: [1, 2];
  };
  standard: {
    wordsPerConcept: [100, 150];
    format: 'mixed_paragraph_bullet';
    supportingDetails: [3, 4];
  };
  comprehensive: {
    wordsPerConcept: [200, 300];
    format: 'full_paragraphs';
    supportingDetails: [5, 7];
  };
}

// Template-specific schemas for different content types
export interface TutorialSchema extends BasicSummarySchema {
  prerequisites: string[];
  materials: string[];
  steps: {
    stepNumber: number;
    instruction: string;
    expectedOutcome: string;
    potentialIssues?: string[];
  }[];
  troubleshooting: {
    problem: string;
    solution: string;
  }[];
}

export interface LectureSchema extends BasicSummarySchema {
  courseContext: string;
  keyConcepts: {
    concept: string;
    definition: string;
    examples: string[];
  }[];
  supportingEvidence: string[];
  studyQuestions: string[];
  furtherReading: string[];
}

export interface DocumentarySchema extends BasicSummarySchema {
  timeline: {
    event: string;
    date?: string;
    significance: string;
  }[];
  keyFigures: {
    name: string;
    role: string;
    contribution: string;
  }[];
  statistics: {
    data: string;
    source: string;
    context: string;
  }[];
  perspectives: {
    viewpoint: string;
    argument: string;
    evidence: string[];
  }[];
}

// Quality assurance schema
export interface QualityMetrics {
  accuracy: number; // 0-1
  relevance: number; // 0-1
  completeness: number; // 0-1
  timestampPrecision: number; // 0-1
  educationalValue: number; // 0-1
  formatCompliance: number; // 0-1
  nonConversationalScore: number; // 0-1
}
