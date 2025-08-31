'use client';
import React from 'react';

interface VideoInfo {
  videoId: string | null;
  title: string;
  channel: string;
  thumbnail: string;
  duration: string;
  isValid: boolean;
}

interface VideoPreviewProps {
  videoInfo: VideoInfo;
  onClear: () => void;
}

export function VideoPreview({ videoInfo, onClear }: VideoPreviewProps) {
  const thumbnailUrl = videoInfo.videoId ? `https://img.youtube.com/vi/${videoInfo.videoId}/maxresdefault.jpg` : '';

  return (
    <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Video Ready to Convert</h3>
        <button
          onClick={onClear}
          className="text-gray-400 hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>
      
      <div className="flex gap-4">
        <div className="flex-shrink-0 relative">
          {/* Shiba placeholder during loading */}
          <div className="absolute inset-0 w-32 h-20 bg-white/5 rounded-lg flex items-center justify-center">
            <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
              <span className="text-2xl opacity-60 filter grayscale">🐕</span>
            </div>
          </div>
          <img
            src={thumbnailUrl}
            alt={videoInfo.title}
            className="w-32 h-20 object-cover rounded-lg relative z-10"
            onLoad={(e) => {
              // Hide Shiba placeholder when thumbnail loads
              const placeholder = e.currentTarget.previousElementSibling as HTMLElement;
              if (placeholder) placeholder.style.display = 'none';
            }}
            onError={(e) => {
              // Fallback to lower quality thumbnail if maxresdefault fails
              if (videoInfo.videoId) {
                e.currentTarget.src = `https://img.youtube.com/vi/${videoInfo.videoId}/hqdefault.jpg`;
              }
            }}
          />
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="text-white font-medium text-sm mb-1 truncate">
            {videoInfo.title}
          </h4>
          <p className="text-gray-400 text-xs mb-2">
            {videoInfo.channel}
          </p>
          <div className="flex items-center gap-4 text-xs text-gray-300">
            <span>Duration: {videoInfo.duration}</span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              Ready to process
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
