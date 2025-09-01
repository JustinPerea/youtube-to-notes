'use client';
import React, { useState } from 'react';
import { extractVideoIdFromUrl, getYouTubeThumbnail } from '@/lib/utils/youtube';

interface VideoThumbnailProps {
  youtubeUrl: string;
  backupThumbnailUrl?: string;
  className?: string;
  alt?: string;
}

export function VideoThumbnail({ 
  youtubeUrl, 
  backupThumbnailUrl, 
  className = "", 
  alt = "Video thumbnail" 
}: VideoThumbnailProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  
  const videoId = extractVideoIdFromUrl(youtubeUrl);
  const primaryThumbnail = videoId ? getYouTubeThumbnail(videoId, 'maxres') : null;
  const fallbackThumbnail = videoId ? getYouTubeThumbnail(videoId, 'hq') : null;
  
  const thumbnailSrc = primaryThumbnail || backupThumbnailUrl;
  
  if (!thumbnailSrc) {
    return (
      <div className={`flex items-center justify-center bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg ${className}`}>
        <span className="text-2xl opacity-60">🐕</span>
      </div>
    );
  }
  
  return (
    <div className={`relative ${className}`}>
      {/* Loading placeholder */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg">
          <span className="text-2xl opacity-60">🐕</span>
        </div>
      )}
      
      {/* Thumbnail image */}
      <img
        src={thumbnailSrc}
        alt={alt}
        className={`w-full h-full object-cover rounded-lg border border-[var(--card-border)] ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200`}
        onLoad={() => setIsLoading(false)}
        onError={(e) => {
          if (fallbackThumbnail && e.currentTarget.src !== fallbackThumbnail) {
            e.currentTarget.src = fallbackThumbnail;
          } else if (backupThumbnailUrl && e.currentTarget.src !== backupThumbnailUrl) {
            e.currentTarget.src = backupThumbnailUrl;
          } else {
            setHasError(true);
            setIsLoading(false);
          }
        }}
      />
      
      {/* Error fallback */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg">
          <span className="text-2xl opacity-60">🐕</span>
        </div>
      )}
    </div>
  );
}