'use client';

import React from 'react';

interface ProcessingMode {
  id: 'auto' | 'hybrid' | 'transcript-only' | 'video-only';
  name: string;
  description: string;
  icon: string;
  qualityLevel: 'premium' | 'high' | 'standard' | 'basic';
  estimatedTime: string;
  costLevel: 'premium' | 'standard' | 'low';
  dataSourcesUsed: string[];
  features: string[];
  recommendedFor: string[];
}

interface ProcessingModeSelectorProps {
  selectedMode: 'auto' | 'hybrid' | 'transcript-only' | 'video-only';
  onModeChange: (mode: 'auto' | 'hybrid' | 'transcript-only' | 'video-only') => void;
  recommendedMode?: 'auto' | 'hybrid' | 'transcript-only' | 'video-only';
  videoMetadata?: {
    hasCaption: boolean;
    duration: number;
    contentRichness: 'minimal' | 'basic' | 'detailed' | 'comprehensive';
    visualComplexity?: 'low' | 'medium' | 'high';
  };
}

const processingModes: ProcessingMode[] = [
  {
    id: 'auto',
    name: 'Auto (Recommended)',
    description: 'AI intelligently selects the best processing method based on your video',
    icon: '🤖',
    qualityLevel: 'high',
    estimatedTime: '2-15 seconds',
    costLevel: 'standard',
    dataSourcesUsed: ['Smart Selection'],
    features: [
      'Intelligent method selection',
      'Optimized for quality/speed balance',
      'Fallback protection',
      'Cost-efficient processing'
    ],
    recommendedFor: ['Most videos', 'First-time users', 'Mixed content types']
  },
  {
    id: 'hybrid',
    name: 'Hybrid Premium',
    description: 'Maximum quality combining transcript, video analysis, and metadata',
    icon: '⭐',
    qualityLevel: 'premium',
    estimatedTime: '15-45 seconds',
    costLevel: 'premium',
    dataSourcesUsed: ['YouTube Captions', 'Gemini Video Analysis', 'Rich Metadata'],
    features: [
      'Multi-modal analysis',
      'Highest quality output',
      'Visual context integration',
      'Advanced content adaptation'
    ],
    recommendedFor: ['Complex videos', 'Educational content', 'Premium quality needs']
  },
  {
    id: 'transcript-only',
    name: 'Transcript Focus',
    description: 'Fast, accurate processing using dialogue and speech content',
    icon: '📝',
    qualityLevel: 'high',
    estimatedTime: '3-8 seconds',
    costLevel: 'low',
    dataSourcesUsed: ['YouTube Captions', 'Speech Recognition'],
    features: [
      'Fastest processing',
      'Excellent for dialogue-heavy content',
      'Most cost-effective',
      'High accuracy for speech'
    ],
    recommendedFor: ['Lectures', 'Podcasts', 'Interviews', 'Budget-conscious users']
  },
  {
    id: 'video-only',
    name: 'Visual Analysis',
    description: 'Focus on visual elements, charts, demonstrations, and on-screen content',
    icon: '📹',
    qualityLevel: 'standard',
    estimatedTime: '20-60 seconds',
    costLevel: 'standard',
    dataSourcesUsed: ['Gemini Video Analysis', 'Visual Recognition'],
    features: [
      'Visual content extraction',
      'Chart and diagram analysis',
      'On-screen text recognition',
      'Best for visual-heavy content'
    ],
    recommendedFor: ['Tutorials', 'Demonstrations', 'Presentations', 'Visual content']
  }
];

export function ProcessingModeSelector({
  selectedMode,
  onModeChange,
  recommendedMode = 'auto',
  videoMetadata
}: ProcessingModeSelectorProps) {
  
  const getQualityColor = (level: string) => {
    switch (level) {
      case 'premium': return 'text-purple-400 bg-purple-500/20 border-purple-500/30';
      case 'high': return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
      case 'standard': return 'text-green-400 bg-green-500/20 border-green-500/30';
      default: return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
    }
  };

  const getCostColor = (level: string) => {
    switch (level) {
      case 'premium': return 'text-red-400';
      case 'standard': return 'text-yellow-400';
      default: return 'text-green-400';
    }
  };

  const isRecommended = (modeId: string) => {
    return modeId === recommendedMode;
  };

  const getRecommendationReason = () => {
    if (!videoMetadata) return null;
    
    const { hasCaption, duration, contentRichness } = videoMetadata;
    
    if (contentRichness === 'comprehensive' && hasCaption) {
      return "This video has rich content and captions - hybrid processing will provide the best quality";
    } else if (hasCaption && duration < 600) {
      return "With good captions and moderate length, transcript-only processing will be fast and accurate";
    } else if (!hasCaption) {
      return "No captions available - video analysis will extract visual content effectively";
    }
    
    return "Auto mode will intelligently select the best processing method for this video";
  };

  return (
    <div className="processing-mode-selector mb-8">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
          Choose Processing Method
        </h3>
        <p className="text-[var(--text-secondary)] text-sm">
          Select how you'd like to process your video content
        </p>
        {getRecommendationReason() && (
          <div className="mt-3 p-3 bg-[var(--accent-pink)]/10 border border-[var(--accent-pink)]/20 rounded-lg">
            <div className="flex items-start space-x-2">
              <span className="text-[var(--accent-pink)] text-sm">💡</span>
              <p className="text-[var(--accent-pink)] text-sm font-medium">
                {getRecommendationReason()}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {processingModes.map((mode) => (
          <div
            key={mode.id}
            className={`relative cursor-pointer transition-all duration-300 rounded-xl border-2 p-5 ${
              selectedMode === mode.id
                ? 'border-[var(--accent-pink)] bg-[var(--accent-pink)]/5 transform scale-[1.02]'
                : 'border-[var(--card-border)] bg-[var(--card-bg)] hover:border-[var(--accent-pink)]/50 hover:bg-[var(--accent-pink)]/5'
            }`}
            onClick={() => onModeChange(mode.id)}
          >
            {/* Recommended Badge */}
            {isRecommended(mode.id) && (
              <div className="absolute -top-2 -right-2 bg-[var(--accent-pink)] text-white text-xs px-2 py-1 rounded-full font-medium">
                Recommended
              </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{mode.icon}</span>
                <div>
                  <h4 className="text-base font-semibold text-[var(--text-primary)]">
                    {mode.name}
                  </h4>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getQualityColor(mode.qualityLevel)}`}>
                      {mode.qualityLevel.toUpperCase()}
                    </span>
                    <span className={`text-xs font-medium ${getCostColor(mode.costLevel)}`}>
                      {mode.costLevel === 'low' ? '$' : mode.costLevel === 'standard' ? '$$' : '$$$'}
                    </span>
                  </div>
                </div>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                selectedMode === mode.id
                  ? 'border-[var(--accent-pink)] bg-[var(--accent-pink)]'
                  : 'border-[var(--card-border)]'
              }`}>
                {selectedMode === mode.id && (
                  <div className="w-2 h-2 rounded-full bg-white"></div>
                )}
              </div>
            </div>

            {/* Description */}
            <p className="text-sm text-[var(--text-secondary)] mb-4 leading-relaxed">
              {mode.description}
            </p>

            {/* Processing Info */}
            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[var(--text-secondary)]">Processing Time:</span>
                <span className="text-[var(--text-primary)] font-medium">{mode.estimatedTime}</span>
              </div>
              
              <div className="space-y-2">
                <span className="text-xs text-[var(--text-secondary)]">Data Sources:</span>
                <div className="flex flex-wrap gap-1">
                  {mode.dataSourcesUsed.map((source, index) => (
                    <span
                      key={index}
                      className="px-2 py-0.5 bg-[var(--bg-primary)] rounded text-xs text-[var(--text-secondary)] border border-[var(--card-border)]"
                    >
                      {source}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="space-y-2">
              <span className="text-xs text-[var(--text-secondary)] font-medium">Key Features:</span>
              <ul className="space-y-1">
                {mode.features.slice(0, 3).map((feature, index) => (
                  <li key={index} className="flex items-center space-x-2 text-xs">
                    <span className="w-1 h-1 rounded-full bg-[var(--accent-pink)]"></span>
                    <span className="text-[var(--text-secondary)]">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Best For */}
            <div className="mt-4 pt-3 border-t border-[var(--card-border)]">
              <div className="flex items-center space-x-2">
                <span className="text-xs text-[var(--text-secondary)]">Best for:</span>
                <div className="flex flex-wrap gap-1">
                  {mode.recommendedFor.slice(0, 2).map((use, index) => (
                    <span
                      key={index}
                      className="px-1.5 py-0.5 bg-[var(--accent-pink)]/10 text-[var(--accent-pink)] rounded text-xs"
                    >
                      {use}
                    </span>
                  ))}
                  {mode.recommendedFor.length > 2 && (
                    <span className="text-xs text-[var(--text-secondary)]">
                      +{mode.recommendedFor.length - 2} more
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Processing Mode Comparison */}
      <div className="mt-6 p-4 bg-[var(--bg-primary)] rounded-xl border border-[var(--card-border)]">
        <h4 className="text-sm font-medium text-[var(--text-primary)] mb-3">Processing Mode Comparison</h4>
        <div className="grid grid-cols-4 gap-4 text-xs">
          <div className="text-[var(--text-secondary)]">Mode</div>
          <div className="text-[var(--text-secondary)]">Quality</div>
          <div className="text-[var(--text-secondary)]">Speed</div>
          <div className="text-[var(--text-secondary)]">Cost</div>
          
          {['Auto', 'Hybrid', 'Transcript', 'Video'].map((mode, index) => (
            <React.Fragment key={mode}>
              <div className="text-[var(--text-primary)] font-medium">{mode}</div>
              <div className="flex">
                {Array.from({ length: 5 }, (_, i) => (
                  <span
                    key={i}
                    className={`w-2 h-2 rounded-full mr-1 ${
                      i < [4, 5, 4, 3][index] ? 'bg-[var(--accent-pink)]' : 'bg-[var(--card-border)]'
                    }`}
                  />
                ))}
              </div>
              <div className="flex">
                {Array.from({ length: 5 }, (_, i) => (
                  <span
                    key={i}
                    className={`w-2 h-2 rounded-full mr-1 ${
                      i < [4, 2, 5, 3][index] ? 'bg-green-500' : 'bg-[var(--card-border)]'
                    }`}
                  />
                ))}
              </div>
              <div className="flex">
                {Array.from({ length: 3 }, (_, i) => (
                  <span
                    key={i}
                    className={`w-2 h-2 rounded-full mr-1 ${
                      i < [2, 3, 1, 2][index] ? 'bg-yellow-500' : 'bg-[var(--card-border)]'
                    }`}
                  />
                ))}
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}