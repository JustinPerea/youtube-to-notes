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
  const thumbnailUrl = videoInfo.videoId 
    ? `https://img.youtube.com/vi/${videoInfo.videoId}/maxresdefault.jpg` 
    : '';

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
          Video Ready to Convert
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
        <div className="flex-shrink-0 relative">
          {/* Shiba placeholder during loading */}
          <div 
            className="absolute inset-0 w-32 h-20 rounded-lg flex items-center justify-center"
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
              <span className="text-2xl opacity-80">🐕</span>
            </div>
          </div>
          <img
            src={thumbnailUrl}
            alt={videoInfo.title}
            className="w-32 h-20 object-cover rounded-lg relative z-10"
            style={{ borderColor: 'var(--card-border)', borderWidth: '1px', borderStyle: 'solid' }}
            onLoad={(e) => {
              const placeholder = e.currentTarget.previousElementSibling as HTMLElement;
              if (placeholder) placeholder.style.display = 'none';
            }}
            onError={(e) => {
              if (videoInfo.videoId) {
                e.currentTarget.src = `https://img.youtube.com/vi/${videoInfo.videoId}/hqdefault.jpg`;
              }
            }}
          />
        </div>

        <div className="flex-1 min-w-0">
          <h4 
            className="font-medium text-sm mb-1 truncate"
            style={{ color: 'var(--text-primary)' }}
          >
            {videoInfo.title}
          </h4>
          <p 
            className="text-xs mb-2"
            style={{ color: 'var(--text-secondary)' }}
          >
            {videoInfo.channel}
          </p>
          <div 
            className="flex items-center gap-4 text-xs"
            style={{ color: 'var(--text-secondary)' }}
          >
            <span>Duration: {videoInfo.duration}</span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Ready to process
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
