'use client';

import React from 'react';

interface QualityMetrics {
  multiModalScore?: number;
  formatCompliance?: number;
  nonConversationalScore?: number;
  contentAdaptation?: string;
  cognitiveOptimization?: string;
}

interface ProcessingStats {
  totalProcessingTime?: number;
  transcriptExtractionTime?: number;
  videoAnalysisTime?: number;
  noteGenerationTime?: number;
  method?: string;
  tokenUsage?: string;
  apiCalls?: number;
}

interface QualityIndicatorProps {
  processingMethod: 'hybrid' | 'auto' | 'transcript-only' | 'video-only' | 'fallback';
  qualityMetrics?: QualityMetrics;
  processingStats?: ProcessingStats;
  dataSourcesUsed?: string[];
  showDetailed?: boolean;
}

export function QualityIndicator({
  processingMethod,
  qualityMetrics,
  processingStats,
  dataSourcesUsed = [],
  showDetailed = false
}: QualityIndicatorProps) {
  
  const getMethodInfo = (method: string) => {
    switch (method) {
      case 'hybrid':
        return {
          name: 'Hybrid Premium',
          icon: '⭐',
          color: 'purple',
          description: 'Multi-modal processing with maximum quality',
          qualityScore: 95
        };
      case 'auto':
        return {
          name: 'Auto Selected',
          icon: '🤖',
          color: 'blue',
          description: 'Intelligently optimized processing method',
          qualityScore: 85
        };
      case 'transcript-only':
        return {
          name: 'Transcript Focus',
          icon: '📝',
          color: 'green',
          description: 'High-quality dialogue and speech processing',
          qualityScore: 80
        };
      case 'video-only':
        return {
          name: 'Visual Analysis',
          icon: '📹',
          color: 'orange',
          description: 'Visual content and on-screen element extraction',
          qualityScore: 75
        };
      case 'fallback':
        return {
          name: 'Fallback Method',
          icon: '🔄',
          color: 'gray',
          description: 'Alternative processing due to constraints',
          qualityScore: 65
        };
      default:
        return {
          name: 'Unknown Method',
          icon: '❓',
          color: 'gray',
          description: 'Processing method not specified',
          qualityScore: 50
        };
    }
  };

  const methodInfo = getMethodInfo(processingMethod);
  
  const getColorClasses = (color: string) => {
    switch (color) {
      case 'purple':
        return {
          bg: 'bg-purple-500/20',
          border: 'border-purple-500/30',
          text: 'text-purple-400',
          accent: 'bg-purple-500'
        };
      case 'blue':
        return {
          bg: 'bg-blue-500/20',
          border: 'border-blue-500/30',
          text: 'text-blue-400',
          accent: 'bg-blue-500'
        };
      case 'green':
        return {
          bg: 'bg-green-500/20',
          border: 'border-green-500/30',
          text: 'text-green-400',
          accent: 'bg-green-500'
        };
      case 'orange':
        return {
          bg: 'bg-orange-500/20',
          border: 'border-orange-500/30',
          text: 'text-orange-400',
          accent: 'bg-orange-500'
        };
      default:
        return {
          bg: 'bg-gray-500/20',
          border: 'border-gray-500/30',
          text: 'text-gray-400',
          accent: 'bg-gray-500'
        };
    }
  };

  const colors = getColorClasses(methodInfo.color);
  const displayScore = qualityMetrics?.multiModalScore || methodInfo.qualityScore;

  const formatTime = (seconds: number) => {
    return seconds < 60 ? `${seconds.toFixed(1)}s` : `${(seconds / 60).toFixed(1)}m`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 75) return 'text-blue-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="quality-indicator space-y-4">
      {/* Primary Quality Card */}
      <div className={`p-4 rounded-xl border ${colors.bg} ${colors.border}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{methodInfo.icon}</span>
            <div>
              <h4 className={`font-semibold ${colors.text}`}>
                {methodInfo.name}
              </h4>
              <p className="text-xs text-[var(--text-secondary)]">
                {methodInfo.description}
              </p>
            </div>
          </div>
          
          {/* Quality Score */}
          <div className="text-right">
            <div className={`text-2xl font-bold ${getScoreColor(displayScore)}`}>
              {displayScore}
            </div>
            <div className="text-xs text-[var(--text-secondary)]">
              Quality Score
            </div>
          </div>
        </div>

        {/* Data Sources */}
        {dataSourcesUsed.length > 0 && (
          <div className="space-y-2">
            <span className="text-xs text-[var(--text-secondary)] font-medium">Data Sources Used:</span>
            <div className="flex flex-wrap gap-2">
              {dataSourcesUsed.map((source, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-[var(--bg-primary)] rounded text-xs text-[var(--text-secondary)] border border-[var(--card-border)]"
                >
                  {source}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Detailed Metrics */}
      {showDetailed && (
        <>
          {/* Quality Metrics */}
          {qualityMetrics && (
            <div className="p-4 bg-[var(--bg-primary)] rounded-xl border border-[var(--card-border)]">
              <h4 className="text-sm font-medium text-[var(--text-primary)] mb-3">Quality Metrics</h4>
              <div className="space-y-3">
                {qualityMetrics.multiModalScore && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[var(--text-secondary)]">Multi-Modal Integration:</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 h-2 bg-[var(--card-border)] rounded-full overflow-hidden">
                        <div
                          className={`h-full ${colors.accent} transition-all duration-500`}
                          style={{ width: `${qualityMetrics.multiModalScore}%` }}
                        />
                      </div>
                      <span className="text-xs text-[var(--text-primary)] font-medium">
                        {qualityMetrics.multiModalScore}/100
                      </span>
                    </div>
                  </div>
                )}

                {qualityMetrics.formatCompliance && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[var(--text-secondary)]">Format Compliance:</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 h-2 bg-[var(--card-border)] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 transition-all duration-500"
                          style={{ width: `${qualityMetrics.formatCompliance * 10}%` }}
                        />
                      </div>
                      <span className="text-xs text-[var(--text-primary)] font-medium">
                        {qualityMetrics.formatCompliance}/10
                      </span>
                    </div>
                  </div>
                )}

                {qualityMetrics.contentAdaptation && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[var(--text-secondary)]">Content Adaptation:</span>
                    <span className="text-xs text-[var(--text-primary)] font-medium capitalize">
                      {qualityMetrics.contentAdaptation.replace('-', ' ')}
                    </span>
                  </div>
                )}

                {qualityMetrics.cognitiveOptimization && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[var(--text-secondary)]">Cognitive Optimization:</span>
                    <span className="text-xs text-[var(--text-primary)] font-medium capitalize">
                      {qualityMetrics.cognitiveOptimization.replace('-', ' ')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Processing Statistics */}
          {processingStats && (
            <div className="p-4 bg-[var(--bg-primary)] rounded-xl border border-[var(--card-border)]">
              <h4 className="text-sm font-medium text-[var(--text-primary)] mb-3">Processing Statistics</h4>
              <div className="grid grid-cols-2 gap-4">
                {processingStats.totalProcessingTime && (
                  <div className="space-y-1">
                    <span className="text-xs text-[var(--text-secondary)]">Total Time:</span>
                    <div className="text-sm text-[var(--text-primary)] font-medium">
                      {formatTime(processingStats.totalProcessingTime)}
                    </div>
                  </div>
                )}

                {processingStats.apiCalls && (
                  <div className="space-y-1">
                    <span className="text-xs text-[var(--text-secondary)]">API Calls:</span>
                    <div className="text-sm text-[var(--text-primary)] font-medium">
                      {processingStats.apiCalls}
                    </div>
                  </div>
                )}

                {processingStats.transcriptExtractionTime && (
                  <div className="space-y-1">
                    <span className="text-xs text-[var(--text-secondary)]">Transcript Extraction:</span>
                    <div className="text-sm text-[var(--text-primary)] font-medium">
                      {formatTime(processingStats.transcriptExtractionTime)}
                    </div>
                  </div>
                )}

                {processingStats.videoAnalysisTime && (
                  <div className="space-y-1">
                    <span className="text-xs text-[var(--text-secondary)]">Video Analysis:</span>
                    <div className="text-sm text-[var(--text-primary)] font-medium">
                      {formatTime(processingStats.videoAnalysisTime)}
                    </div>
                  </div>
                )}

                {processingStats.noteGenerationTime && (
                  <div className="space-y-1">
                    <span className="text-xs text-[var(--text-secondary)]">Note Generation:</span>
                    <div className="text-sm text-[var(--text-primary)] font-medium">
                      {formatTime(processingStats.noteGenerationTime)}
                    </div>
                  </div>
                )}

                {processingStats.tokenUsage && (
                  <div className="space-y-1">
                    <span className="text-xs text-[var(--text-secondary)]">Token Usage:</span>
                    <div className="text-sm text-[var(--text-primary)] font-medium">
                      {processingStats.tokenUsage}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Processing Timeline (if detailed stats available) */}
      {showDetailed && processingStats && (
        processingStats.transcriptExtractionTime || processingStats.videoAnalysisTime || processingStats.noteGenerationTime
      ) && (
        <div className="p-4 bg-[var(--bg-primary)] rounded-xl border border-[var(--card-border)]">
          <h4 className="text-sm font-medium text-[var(--text-primary)] mb-3">Processing Timeline</h4>
          <div className="space-y-2">
            {processingStats.transcriptExtractionTime && (
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[var(--text-secondary)]">Transcript Extraction</span>
                    <span className="text-xs text-[var(--text-primary)] font-medium">
                      {formatTime(processingStats.transcriptExtractionTime)}
                    </span>
                  </div>
                  <div className="w-full h-1 bg-[var(--card-border)] rounded-full mt-1">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: '100%' }}></div>
                  </div>
                </div>
              </div>
            )}

            {processingStats.videoAnalysisTime && (
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[var(--text-secondary)]">Video Analysis</span>
                    <span className="text-xs text-[var(--text-primary)] font-medium">
                      {formatTime(processingStats.videoAnalysisTime)}
                    </span>
                  </div>
                  <div className="w-full h-1 bg-[var(--card-border)] rounded-full mt-1">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: '100%' }}></div>
                  </div>
                </div>
              </div>
            )}

            {processingStats.noteGenerationTime && (
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[var(--text-secondary)]">Note Generation</span>
                    <span className="text-xs text-[var(--text-primary)] font-medium">
                      {formatTime(processingStats.noteGenerationTime)}
                    </span>
                  </div>
                  <div className="w-full h-1 bg-[var(--card-border)] rounded-full mt-1">
                    <div className="h-full bg-purple-500 rounded-full" style={{ width: '100%' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}