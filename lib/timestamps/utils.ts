/**
 * YouTube Timestamp Utilities
 * 
 * Provides functionality to extract, format, and integrate timestamps
 * from YouTube transcripts into generated notes
 */

export interface TimestampSegment {
  startTime: number;
  endTime: number;
  text: string;
  topic?: string;
  importance?: 'high' | 'medium' | 'low';
  keyPhrase?: string;
}

export interface KeyMoment {
  timestamp: number;
  title: string;
  description: string;
  importance: 'high' | 'medium' | 'low';
  youtubeUrl: string;
}

/**
 * Format seconds into YouTube timestamp format (MM:SS or HH:MM:SS)
 */
export function formatTimestamp(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Create clickable YouTube timestamp URL
 */
export function createTimestampUrl(videoUrl: string, timestamp: number): string {
  const baseUrl = videoUrl.includes('?') ? videoUrl.split('?')[0] : videoUrl;
  const videoId = extractVideoIdFromUrl(videoUrl);
  
  if (videoId) {
    // Use standard YouTube URL with timestamp
    return `https://www.youtube.com/watch?v=${videoId}&t=${Math.floor(timestamp)}s`;
  }
  
  // Fallback to original URL with timestamp parameter
  const separator = videoUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${separator}t=${Math.floor(timestamp)}s`;
}

/**
 * Extract video ID from various YouTube URL formats
 */
function extractVideoIdFromUrl(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  
  return null;
}

/**
 * Generate timestamp markdown link
 */
export function createTimestampLink(videoUrl: string, timestamp: number, text?: string): string {
  const timestampUrl = createTimestampUrl(videoUrl, timestamp);
  const displayText = text || formatTimestamp(timestamp);
  return `[${displayText}](${timestampUrl})`;
}

/**
 * Find section boundaries in transcript segments based on topic changes
 */
export function findSectionBoundaries(segments: TimestampSegment[], minSectionLength: number = 30): number[] {
  const boundaries: number[] = [0]; // Always start with first segment
  
  for (let i = 1; i < segments.length - 1; i++) {
    const current = segments[i];
    const next = segments[i + 1];
    
    // Check if we've reached minimum section length
    const lastBoundary = boundaries[boundaries.length - 1];
    if (current.startTime - segments[lastBoundary].startTime < minSectionLength) {
      continue;
    }
    
    // Look for topic changes, important moments, or significant pauses
    const isTopicChange = current.topic && next.topic && current.topic !== next.topic;
    const isHighImportance = current.importance === 'high';
    const hasLongPause = next.startTime - current.endTime > 2; // 2+ second pause
    
    if (isTopicChange || isHighImportance || hasLongPause) {
      boundaries.push(i);
    }
  }
  
  return boundaries;
}

/**
 * Extract key moments from transcript segments using AI-identified importance
 */
export function extractKeyMoments(
  segments: TimestampSegment[], 
  videoUrl: string,
  maxMoments: number = 10
): KeyMoment[] {
  // Filter segments by importance and create key moments
  const importantSegments = segments
    .filter(segment => segment.importance === 'high' || segment.keyPhrase)
    .slice(0, maxMoments);
  
  return importantSegments.map(segment => ({
    timestamp: segment.startTime,
    title: segment.keyPhrase || segment.topic || `Key Point at ${formatTimestamp(segment.startTime)}`,
    description: segment.text.length > 100 
      ? segment.text.substring(0, 100) + '...'
      : segment.text,
    importance: segment.importance || 'medium',
    youtubeUrl: createTimestampUrl(videoUrl, segment.startTime)
  }));
}

/**
 * Generate prompt instructions for Gemini to identify timestamps
 */
export function generateTimestampAnalysisPrompt(): string {
  return `
TIMESTAMP ANALYSIS INSTRUCTIONS:

When analyzing the transcript, identify key moments and section boundaries. For each important segment, note:

1. **Topic Changes**: When the speaker transitions to a new major topic or concept
2. **Key Points**: Important insights, conclusions, or actionable information  
3. **Learning Moments**: Explanations, examples, or demonstrations
4. **Section Boundaries**: Natural breaks in content flow

Mark segments with importance levels:
- **HIGH**: Critical information, main points, actionable insights
- **MEDIUM**: Supporting details, examples, context
- **LOW**: Transitional content, casual remarks

Include this information in your analysis so timestamps can be automatically extracted.
`;
}

/**
 * Parse Gemini response to extract timestamp information
 */
export function parseTimestampData(aiResponse: string, transcriptSegments: any[]): TimestampSegment[] {
  // This function would parse Gemini's response to identify which segments are important
  // For now, we'll use a simple heuristic based on transcript segments
  
  return transcriptSegments.map((segment, index) => ({
    startTime: segment.startTime,
    endTime: segment.endTime,
    text: segment.text,
    topic: `Section ${Math.floor(index / 10) + 1}`, // Simple topic grouping
    importance: segment.text.length > 100 ? 'high' : 'medium', // Length heuristic
    keyPhrase: segment.text.match(/\b(important|key|main|first|second|step|how to|tutorial)\b/i) 
      ? segment.text.split('.')[0] 
      : undefined
  }));
}