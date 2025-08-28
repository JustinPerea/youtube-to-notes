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
export function parseYouTubeUrl(url: string): YouTubeVideoInfo {
  const videoId = extractVideoId(url);
  
  if (!videoId) {
    return {
      videoId: '',
      thumbnailUrl: '',
      isValid: false
    };
  }

  return {
    videoId,
    thumbnailUrl: getThumbnailUrl(videoId),
    isValid: true
  };
}

/**
 * Validate YouTube URL format
 */
export function isValidYouTubeUrl(url: string): boolean {
  const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
  return youtubeRegex.test(url) && extractVideoId(url) !== null;
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
