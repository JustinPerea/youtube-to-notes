'use client';
import React from 'react';

interface VideoInfo {
  videoId: string;
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
  const thumbnailUrl = `https://img.youtube.com/vi/${videoInfo.videoId}/maxresdefault.jpg`;

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
        <div className="flex-shrink-0">
          <img
            src={thumbnailUrl}
            alt={videoInfo.title}
            className="w-32 h-20 object-cover rounded-lg"
            onError={(e) => {
              // Fallback to lower quality thumbnail if maxresdefault fails
              e.currentTarget.src = `https://img.youtube.com/vi/${videoInfo.videoId}/hqdefault.jpg`;
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
