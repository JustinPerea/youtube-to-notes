'use client';
import React, { useEffect, useState } from 'react';
import { getYouTubeThumbnail } from '@/lib/utils/youtube';

interface VideoInfo {
  videoId: string | null;
  thumbnail: string;
  isValid: boolean;
}

interface YouTubeMetadata {
  title: string;
  channelTitle: string;
  description: string;
  duration: string;
  durationSeconds: number;
  viewCount: number;
  likeCount: number;
  publishedAt: string;
  tags: string[];
  caption: boolean;
  contentRichness: 'minimal' | 'basic' | 'detailed' | 'comprehensive';
  engagementRate: number;
}

// Simplified UI - removed processing recommendations

interface VideoPreviewProps {
  videoInfo: VideoInfo;
  onClear: () => void;
  onRecommendationChange?: (recommendation: any) => void; // Legacy - not used in simplified UI
}

export function VideoPreview({ videoInfo, onClear, onRecommendationChange }: VideoPreviewProps) {
  const [metadata, setMetadata] = useState<YouTubeMetadata | null>(null);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const [metadataError, setMetadataError] = useState<string | null>(null);
  // Simplified UI - removed recommendation state

  const thumbnailUrl = videoInfo.videoId 
    ? getYouTubeThumbnail(videoInfo.videoId, 'maxres')
    : '';

  // Fetch YouTube metadata when component mounts
  useEffect(() => {
    if (!videoInfo.videoId) return;

    const fetchMetadata = async () => {
      setIsLoadingMetadata(true);
      setMetadataError(null);

      try {
        console.log('🔍 Fetching YouTube metadata for video ID:', videoInfo.videoId);
        
        const response = await fetch(`/api/youtube/metadata?url=https://www.youtube.com/watch?v=${videoInfo.videoId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch metadata');
        }

        if (data.success && data.metadata) {
          setMetadata(data.metadata);
          console.log('✅ YouTube metadata loaded:', data.metadata.title);
        } else {
          throw new Error('No metadata returned');
        }

      } catch (error: any) {
        console.error('❌ Error fetching YouTube metadata:', error);
        setMetadataError(error.message || 'Failed to load video details');
      } finally {
        setIsLoadingMetadata(false);
      }
    };

    fetchMetadata();
  }, [videoInfo.videoId]);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const getContentRichnessColor = (richness: string) => {
    switch (richness) {
      case 'comprehensive': return 'text-green-400';
      case 'detailed': return 'text-blue-400';
      case 'basic': return 'text-yellow-400';
      default: return 'text-red-400';
    }
  };

  // Simplified UI - removed complex recommendation logic

  // Simplified UI - no recommendation updates needed

  // Simplified UI - removed color helper functions

  return (
    <div 
      className="backdrop-blur-xl border rounded-xl p-6 transition-all duration-300 hover:shadow-lg"
      style={{
        backgroundColor: 'var(--card-bg)',
        borderColor: 'var(--card-border)',
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 
          className="text-lg font-semibold"
          style={{ color: 'var(--text-primary)' }}
        >
          YouTube Video Preview
        </h3>
        <button
          onClick={onClear}
          className="transition-colors p-1 hover:opacity-80"
          style={{ color: 'var(--text-secondary)' }}
          aria-label="Clear video"
        >
          ✕
        </button>
      </div>

      <div className="flex gap-4">
        {/* Thumbnail Section */}
        <div className="flex-shrink-0 relative">
          {/* Loading placeholder */}
          <div 
            className="absolute inset-0 w-40 h-24 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: 'var(--card-bg)', opacity: 0.5 }}
          >
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-sm"
              style={{ 
                backgroundColor: 'var(--card-bg)',
                borderColor: 'var(--card-border)',
                borderWidth: '1px',
                borderStyle: 'solid'
              }}
            >
              <span className="text-2xl opacity-80">🎥</span>
            </div>
          </div>
          <img
            src={thumbnailUrl}
            alt="Video thumbnail"
            className="w-40 h-24 object-cover rounded-lg relative z-10"
            style={{ borderColor: 'var(--card-border)', borderWidth: '1px', borderStyle: 'solid' }}
            onLoad={(e) => {
              const placeholder = e.currentTarget.previousElementSibling as HTMLElement;
              if (placeholder) placeholder.style.display = 'none';
            }}
            onError={(e) => {
              if (videoInfo.videoId) {
                e.currentTarget.src = getYouTubeThumbnail(videoInfo.videoId, 'hq');
              }
            }}
          />
        </div>

        {/* Metadata Section */}
        <div className="flex-1 space-y-3">
          {isLoadingMetadata ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-400"></div>
              <span className="text-sm text-gray-400">Loading video details...</span>
            </div>
          ) : metadataError ? (
            <div className="text-sm text-red-400">
              ⚠️ {metadataError}
            </div>
          ) : metadata ? (
            <>
              {/* Title */}
              <h4 
                className="font-semibold text-sm leading-tight"
                style={{ 
                  color: 'var(--text-primary)',
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical'
                }}
                title={metadata.title}
              >
                {metadata.title}
              </h4>

              {/* Channel */}
              <div className="flex items-center space-x-2 text-xs">
                <span className="opacity-60">📺</span>
                <span style={{ color: 'var(--text-secondary)' }}>
                  {metadata.channelTitle}
                </span>
              </div>

              {/* Stats Row 1 */}
              <div className="flex items-center space-x-4 text-xs">
                <div className="flex items-center space-x-1">
                  <span className="opacity-60">⏱️</span>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {formatDuration(metadata.durationSeconds)}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="opacity-60">👁️</span>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {formatNumber(metadata.viewCount)}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="opacity-60">👍</span>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {formatNumber(metadata.likeCount)}
                  </span>
                </div>
              </div>

              {/* Stats Row 2 */}
              <div className="flex items-center space-x-4 text-xs">
                <div className="flex items-center space-x-1">
                  <span className="opacity-60">💬</span>
                  <span style={{ color: metadata.caption ? 'var(--accent-pink)' : 'var(--text-secondary)' }}>
                    {metadata.caption ? 'Has Captions' : 'No Captions'}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="opacity-60">📊</span>
                  <span className={`capitalize ${getContentRichnessColor(metadata.contentRichness)}`}>
                    {metadata.contentRichness === 'comprehensive' ? 'Rich Content' : 
                     metadata.contentRichness === 'detailed' ? 'Good Content' : 
                     metadata.contentRichness === 'basic' ? 'Basic Content' : 'Minimal Content'}
                  </span>
                </div>
              </div>

              {/* Tags (if any) */}
              {metadata.tags && metadata.tags.length > 0 && (
                <div className="text-xs">
                  <span className="opacity-60">🏷️ </span>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {metadata.tags.slice(0, 3).join(', ')}
                    {metadata.tags.length > 3 && ` +${metadata.tags.length - 3} more`}
                  </span>
                </div>
              )}

              {/* Premium AI Processing Badge */}
              <div className="flex items-center space-x-2 text-xs pt-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span style={{ color: 'var(--accent-pink)' }}>
                  YouTube Data API ✓
                </span>
              </div>
              
              {/* Simple Premium Processing Badge */}
              <div className="mt-3 flex justify-center">
                <div className="px-3 py-2 bg-purple-500/20 border border-purple-500/30 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <span className="text-purple-400">⭐</span>
                    <span className="text-xs font-medium text-purple-400">
                      Ready for Premium AI Processing
                    </span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span style={{ color: 'var(--text-primary)' }}>
                Ready to process
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
