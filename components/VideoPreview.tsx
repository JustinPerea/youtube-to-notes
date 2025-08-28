'use client';

import React from 'react';
import { YouTubeVideoInfo } from '../lib/utils/youtube';

interface VideoPreviewProps {
  videoInfo: YouTubeVideoInfo;
  onClear: () => void;
}

export const VideoPreview: React.FC<VideoPreviewProps> = ({ videoInfo, onClear }) => {
  const [imageError, setImageError] = React.useState(false);
  const [fallbackIndex, setFallbackIndex] = React.useState(0);
  
  const thumbnailVariants = [
    `https://img.youtube.com/vi/${videoInfo.videoId}/maxresdefault.jpg`,
    `https://img.youtube.com/vi/${videoInfo.videoId}/hqdefault.jpg`,
    `https://img.youtube.com/vi/${videoInfo.videoId}/mqdefault.jpg`,
    `https://img.youtube.com/vi/${videoInfo.videoId}/sddefault.jpg`,
    `https://img.youtube.com/vi/${videoInfo.videoId}/default.jpg`
  ];

  const handleImageError = () => {
    if (fallbackIndex < thumbnailVariants.length - 1) {
      setFallbackIndex(prev => prev + 1);
      setImageError(false);
    } else {
      setImageError(true);
    }
  };

  const currentImage = thumbnailVariants[fallbackIndex];

  return (
    <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 animate-fadeInUp">
      <div className="flex items-start gap-4">
        {/* Thumbnail */}
        <div className="flex-shrink-0">
          <div className="relative">
            {!imageError ? (
              <img
                src={currentImage}
                alt="Video thumbnail"
                className="w-32 h-20 object-cover rounded-lg shadow-lg"
                onError={handleImageError}
              />
            ) : (
              <div className="w-32 h-20 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg flex items-center justify-center">
                <span className="text-4xl">🎥</span>
              </div>
            )}
            {/* Play button overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 bg-black/70 rounded-full flex items-center justify-center">
                <div className="w-0 h-0 border-l-4 border-l-white border-t-2 border-t-transparent border-b-2 border-b-transparent ml-1"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Video Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-lg font-semibold text-white truncate">
              YouTube Video Ready
            </h3>
            <button
              onClick={onClear}
              className="text-gray-400 hover:text-white transition-colors p-1"
              title="Clear video"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-green-400">✅</span>
              <span className="text-sm text-gray-300">Valid YouTube video detected</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-blue-400">🎯</span>
              <span className="text-sm text-gray-300">Ready to convert to notes</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-purple-400">🆔</span>
              <span className="text-xs text-gray-400 font-mono bg-white/5 px-2 py-1 rounded">
                Video ID: {videoInfo.videoId}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Ready State Indicator */}
      <div className="mt-4 pt-4 border-t border-white/10">
        <div className="flex items-center justify-center gap-2 text-green-400">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium">Ready to process</span>
        </div>
      </div>
    </div>
  );
};
