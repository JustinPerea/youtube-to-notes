/**
 * YouTube URL utilities for extracting video information
 * No API calls required - uses YouTube's public thumbnail URLs
 */

export interface YouTubeVideoInfo {
  videoId: string;
  title?: string;
  thumbnailUrl: string;
  isValid: boolean;
}

export interface URLValidationResult {
  isValid: boolean;
  errorType?: 'empty' | 'format' | 'not-youtube' | 'invalid-video-id';
  errorMessage?: string;
  suggestions?: string[];
}

/**
 * Extract video ID from various YouTube URL formats
 */
export function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

/**
 * Generate thumbnail URL for a YouTube video
 * Attempts different thumbnail qualities in order of preference
 */
export function getThumbnailUrl(videoId: string): string {
  const qualities = [
    'maxresdefault', // 1280x720
    'hqdefault',     // 480x360
    'mqdefault',     // 320x180
    'sddefault',     // 640x480
    'default'        // 120x90
  ];

  // Try maxresdefault first, fallback to others
  return `https://img.youtube.com/vi/${videoId}/${qualities[0]}.jpg`;
}

/**
 * Parse YouTube URL and extract video information
 */
export function parseYouTubeUrl(url: string): { videoId: string | null; isValid: boolean } {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return {
        videoId: match[1],
        isValid: true
      };
    }
  }

  return {
    videoId: null,
    isValid: false
  };
}

/**
 * Validate YouTube URL format
 */
export function isValidYouTubeUrl(url: string): boolean {
  return parseYouTubeUrl(url).isValid;
}

/**
 * Get different thumbnail sizes for the same video
 */
export function getThumbnailVariants(videoId: string) {
  return {
    maxres: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
    hq: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    mq: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
    sd: `https://img.youtube.com/vi/${videoId}/sddefault.jpg`,
    default: `https://img.youtube.com/vi/${videoId}/default.jpg`
  };
}

/**
 * Comprehensive YouTube URL validation with detailed error messages
 */
export function validateYouTubeUrl(url: string): URLValidationResult {
  // Check if URL is empty
  if (!url || url.trim() === '') {
    return {
      isValid: false,
      errorType: 'empty',
      errorMessage: 'Please enter a YouTube URL',
      suggestions: [
        'https://www.youtube.com/watch?v=VIDEO_ID',
        'https://youtu.be/VIDEO_ID'
      ]
    };
  }

  const trimmedUrl = url.trim();

  // Check if URL contains YouTube domain
  const isYouTubeDomain = /(?:youtube\.com|youtu\.be)/i.test(trimmedUrl);
  if (!isYouTubeDomain) {
    return {
      isValid: false,
      errorType: 'not-youtube',
      errorMessage: 'URL must be from YouTube (youtube.com or youtu.be)',
      suggestions: [
        'https://www.youtube.com/watch?v=VIDEO_ID',
        'https://youtu.be/VIDEO_ID'
      ]
    };
  }

  // Check if URL has valid format and extract video ID
  const { videoId, isValid } = parseYouTubeUrl(trimmedUrl);
  
  if (!isValid || !videoId) {
    return {
      isValid: false,
      errorType: 'format',
      errorMessage: 'Invalid YouTube URL format',
      suggestions: [
        'https://www.youtube.com/watch?v=VIDEO_ID',
        'https://youtu.be/VIDEO_ID',
        'Make sure the URL is complete and properly formatted'
      ]
    };
  }

  // Validate video ID format (YouTube video IDs are 11 characters, alphanumeric + _ -)
  if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    return {
      isValid: false,
      errorType: 'invalid-video-id',
      errorMessage: 'Invalid video ID format',
      suggestions: [
        'Check that the video ID is 11 characters long',
        'Ensure the URL is copied correctly from YouTube'
      ]
    };
  }

  return {
    isValid: true
  };
}

/**
 * Enhanced URL validation that returns both validation result and video info
 */
export function validateAndExtractVideoInfo(url: string): {
  validation: URLValidationResult;
  videoInfo: YouTubeVideoInfo | null;
} {
  const validation = validateYouTubeUrl(url);
  
  if (!validation.isValid) {
    return {
      validation,
      videoInfo: null
    };
  }

  const { videoId } = parseYouTubeUrl(url);
  const videoInfo: YouTubeVideoInfo = {
    videoId: videoId!,
    thumbnailUrl: getThumbnailUrl(videoId!),
    isValid: true
  };

  return {
    validation,
    videoInfo
  };
}

export function extractVideoInfo(url: string) {
  const { videoId, isValid } = parseYouTubeUrl(url);
  
  if (!isValid || !videoId) {
    return {
      videoId: null,
      thumbnail: '',
      isValid: false
    };
  }

  return {
    videoId,
    thumbnail: getThumbnailUrl(videoId),
    isValid: true
  };
}

/**
 * Alias for extractVideoId for consistency with plan
 * @param url - YouTube URL
 * @returns Video ID string or null if not found
 */
export function extractVideoIdFromUrl(url: string): string | null {
  return extractVideoId(url);
}

/**
 * Generate YouTube thumbnail URL with specific quality
 * @param videoId - YouTube video ID
 * @param quality - Thumbnail quality level
 * @returns YouTube thumbnail URL
 */
export function getYouTubeThumbnail(
  videoId: string, 
  quality: 'default' | 'hq' | 'maxres' = 'maxres'
): string {
  const qualityMap = {
    'default': 'default',
    'hq': 'hqdefault', 
    'maxres': 'maxresdefault'
  };
  
  return `https://img.youtube.com/vi/${videoId}/${qualityMap[quality]}.jpg`;
}

/**
 * Parse a YouTube link that contains a timestamp and return base URL + seconds.
 */
export function parseYouTubeTimestampLink(href: string): { videoUrl: string; seconds: number } | null {
  try {
    const url = new URL(href);
    const timestampParam = url.searchParams.get('t');
    if (!timestampParam) return null;

    const seconds = parseTimestampParam(timestampParam);
    if (Number.isNaN(seconds)) return null;

    url.searchParams.delete('t');
    return {
      videoUrl: url.toString(),
      seconds,
    };
  } catch {
    return null;
  }
}

function parseTimestampParam(value: string): number {
  if (!value) return NaN;

  if (/^\d+$/.test(value)) {
    return parseInt(value, 10);
  }

  const match = value.match(/(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?/i);
  if (!match) return NaN;

  const hours = match[1] ? parseInt(match[1], 10) : 0;
  const minutes = match[2] ? parseInt(match[2], 10) : 0;
  const seconds = match[3] ? parseInt(match[3], 10) : 0;

  return hours * 3600 + minutes * 60 + seconds;
}
