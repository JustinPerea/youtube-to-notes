/**
 * Storage Utilities
 * 
 * Handles content size calculation and storage tracking for user content
 */

/**
 * Calculate content size in megabytes
 * Takes into account verbosity versions and all text content
 */
export function calculateContentSizeMB(data: {
  title?: string;
  content: string;
  verbosityVersions?: {
    brief?: string;
    standard?: string;
    comprehensive?: string;
  };
}): number {
  let totalSize = 0;
  
  // Add title size
  if (data.title) {
    totalSize += Buffer.byteLength(data.title, 'utf8');
  }
  
  // Add main content size
  totalSize += Buffer.byteLength(data.content, 'utf8');
  
  // Add verbosity versions if they exist
  if (data.verbosityVersions) {
    if (data.verbosityVersions.brief) {
      totalSize += Buffer.byteLength(data.verbosityVersions.brief, 'utf8');
    }
    if (data.verbosityVersions.standard) {
      totalSize += Buffer.byteLength(data.verbosityVersions.standard, 'utf8');
    }
    if (data.verbosityVersions.comprehensive) {
      totalSize += Buffer.byteLength(data.verbosityVersions.comprehensive, 'utf8');
    }
  }
  
  // Convert bytes to megabytes and round to 2 decimal places
  const sizeMB = totalSize / (1024 * 1024);
  return Math.round(sizeMB * 100) / 100; // Round to 2 decimal places
}

/**
 * Calculate minimum storage size (at least 0.01 MB for any content)
 * This prevents zero-byte entries that could cause issues with tracking
 */
export function calculateMinimumContentSizeMB(data: {
  title?: string;
  content: string;
  verbosityVersions?: {
    brief?: string;
    standard?: string;
    comprehensive?: string;
  };
}): number {
  const calculatedSize = calculateContentSizeMB(data);
  // Ensure minimum 0.01 MB (10KB) for any saved content
  return Math.max(calculatedSize, 0.01);
}

/**
 * Estimate content size for video-related data (thumbnails, metadata, etc.)
 * Used when deleting videos to approximate storage freed up
 */
export function estimateVideoMetadataSizeMB(videoData: {
  title?: string;
  description?: string;
  thumbnailUrl?: string;
  channelName?: string;
}): number {
  let totalSize = 0;
  
  if (videoData.title) {
    totalSize += Buffer.byteLength(videoData.title, 'utf8');
  }
  if (videoData.description) {
    totalSize += Buffer.byteLength(videoData.description, 'utf8');
  }
  if (videoData.thumbnailUrl) {
    totalSize += Buffer.byteLength(videoData.thumbnailUrl, 'utf8');
  }
  if (videoData.channelName) {
    totalSize += Buffer.byteLength(videoData.channelName, 'utf8');
  }
  
  // Add estimated thumbnail storage (assume average 50KB for cached thumbnail)
  totalSize += 50 * 1024; // 50KB in bytes
  
  // Convert to MB
  const sizeMB = totalSize / (1024 * 1024);
  return Math.round(sizeMB * 100) / 100;
}

/**
 * Format storage size for display
 */
export function formatStorageSize(sizeMB: number): string {
  if (sizeMB < 1) {
    const sizeKB = Math.round(sizeMB * 1024);
    return `${sizeKB} KB`;
  } else if (sizeMB < 1024) {
    return `${sizeMB.toFixed(1)} MB`;
  } else {
    const sizeGB = sizeMB / 1024;
    return `${sizeGB.toFixed(2)} GB`;
  }
}

/**
 * Check if content size would exceed storage limit
 */
export function wouldExceedStorageLimit(
  currentUsageMB: number,
  newContentSizeMB: number,
  storageLimitMB: number
): boolean {
  return (currentUsageMB + newContentSizeMB) > storageLimitMB;
}

/**
 * Calculate storage usage percentage
 */
export function calculateStorageUsagePercentage(
  usedMB: number,
  limitMB: number
): number {
  if (limitMB <= 0) return 0;
  const percentage = (usedMB / limitMB) * 100;
  return Math.min(Math.round(percentage), 100); // Cap at 100%
}

/**
 * Get storage warning level based on usage percentage
 */
export function getStorageWarningLevel(usagePercentage: number): 'safe' | 'warning' | 'critical' {
  if (usagePercentage >= 95) return 'critical';
  if (usagePercentage >= 80) return 'warning';
  return 'safe';
}