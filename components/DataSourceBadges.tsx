'use client';

import React from 'react';

interface DataSource {
  name: string;
  status: 'active' | 'available' | 'unavailable' | 'processing';
  quality?: 'excellent' | 'good' | 'fair' | 'poor';
  details?: string;
}

interface DataSourceBadgesProps {
  dataSources: string[];
  availableSources?: DataSource[];
  processingMethod?: 'hybrid' | 'auto' | 'transcript-only' | 'video-only' | 'fallback';
  showDetails?: boolean;
}

export function DataSourceBadges({
  dataSources,
  availableSources,
  processingMethod,
  showDetails = false
}: DataSourceBadgesProps) {
  
  const getSourceInfo = (sourceName: string): DataSource => {
    // Check if we have detailed info for this source
    const detailedSource = availableSources?.find(source => 
      source.name.toLowerCase().includes(sourceName.toLowerCase()) ||
      sourceName.toLowerCase().includes(source.name.toLowerCase())
    );
    
    if (detailedSource) {
      return detailedSource;
    }

    // Default source information based on common source names
    if (sourceName.toLowerCase().includes('youtube')) {
      if (sourceName.toLowerCase().includes('caption')) {
        return {
          name: sourceName,
          status: 'active',
          quality: 'excellent',
          details: 'High-quality official captions'
        };
      } else if (sourceName.toLowerCase().includes('metadata')) {
        return {
          name: sourceName,
          status: 'active',
          quality: 'excellent',
          details: 'Rich video metadata and statistics'
        };
      }
    } else if (sourceName.toLowerCase().includes('gemini')) {
      return {
        name: sourceName,
        status: 'active',
        quality: 'excellent',
        details: 'Advanced AI video analysis'
      };
    } else if (sourceName.toLowerCase().includes('transcript')) {
      return {
        name: sourceName,
        status: 'active',
        quality: 'good',
        details: 'Speech-to-text conversion'
      };
    } else if (sourceName.toLowerCase().includes('visual') || sourceName.toLowerCase().includes('video')) {
      return {
        name: sourceName,
        status: 'active',
        quality: 'good',
        details: 'Visual content analysis'
      };
    }

    return {
      name: sourceName,
      status: 'active',
      quality: 'good'
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return {
          bg: 'bg-green-500/20',
          border: 'border-green-500/30',
          text: 'text-green-400',
          dot: 'bg-green-500'
        };
      case 'processing':
        return {
          bg: 'bg-blue-500/20',
          border: 'border-blue-500/30',
          text: 'text-blue-400',
          dot: 'bg-blue-500'
        };
      case 'available':
        return {
          bg: 'bg-yellow-500/20',
          border: 'border-yellow-500/30',
          text: 'text-yellow-400',
          dot: 'bg-yellow-500'
        };
      case 'unavailable':
        return {
          bg: 'bg-red-500/20',
          border: 'border-red-500/30',
          text: 'text-red-400',
          dot: 'bg-red-500'
        };
      default:
        return {
          bg: 'bg-gray-500/20',
          border: 'border-gray-500/30',
          text: 'text-gray-400',
          dot: 'bg-gray-500'
        };
    }
  };

  const getQualityIcon = (quality?: string) => {
    switch (quality) {
      case 'excellent':
        return '⭐';
      case 'good':
        return '✅';
      case 'fair':
        return '⚠️';
      case 'poor':
        return '❌';
      default:
        return '📊';
    }
  };

  const getSourceIcon = (sourceName: string) => {
    if (sourceName.toLowerCase().includes('youtube')) {
      if (sourceName.toLowerCase().includes('caption')) {
        return '💬';
      } else if (sourceName.toLowerCase().includes('metadata')) {
        return '📈';
      }
      return '📺';
    } else if (sourceName.toLowerCase().includes('gemini')) {
      return '🧠';
    } else if (sourceName.toLowerCase().includes('transcript')) {
      return '📝';
    } else if (sourceName.toLowerCase().includes('visual') || sourceName.toLowerCase().includes('video')) {
      return '👁️';
    } else if (sourceName.toLowerCase().includes('audio')) {
      return '🔊';
    }
    return '📊';
  };

  const processedSources = dataSources.map(getSourceInfo);

  if (dataSources.length === 0) {
    return null;
  }

  return (
    <div className="data-source-badges">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-[var(--text-primary)]">
          Data Sources
        </h4>
        {processingMethod && (
          <span className="text-xs text-[var(--text-secondary)]">
            {processingMethod.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} Processing
          </span>
        )}
      </div>

      <div className="space-y-3">
        {/* Active Sources */}
        <div className="flex flex-wrap gap-2">
          {processedSources.filter(source => source.status === 'active').map((source, index) => {
            const colors = getStatusColor(source.status);
            return (
              <div
                key={index}
                className={`inline-flex items-center space-x-2 px-3 py-2 rounded-lg border ${colors.bg} ${colors.border}`}
              >
                <span className="text-sm">{getSourceIcon(source.name)}</span>
                <span className={`text-xs font-medium ${colors.text}`}>
                  {source.name}
                </span>
                {source.quality && (
                  <span className="text-xs">
                    {getQualityIcon(source.quality)}
                  </span>
                )}
                <div className={`w-2 h-2 rounded-full ${colors.dot}`}></div>
              </div>
            );
          })}
        </div>

        {/* Processing Sources */}
        {processedSources.some(source => source.status === 'processing') && (
          <div className="flex flex-wrap gap-2">
            {processedSources.filter(source => source.status === 'processing').map((source, index) => {
              const colors = getStatusColor(source.status);
              return (
                <div
                  key={index}
                  className={`inline-flex items-center space-x-2 px-3 py-2 rounded-lg border ${colors.bg} ${colors.border}`}
                >
                  <span className="text-sm">{getSourceIcon(source.name)}</span>
                  <span className={`text-xs font-medium ${colors.text}`}>
                    {source.name}
                  </span>
                  <div className="flex items-center space-x-1">
                    <div className={`w-2 h-2 rounded-full ${colors.dot} animate-pulse`}></div>
                    <span className="text-xs text-[var(--text-secondary)]">Processing...</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Available but unused sources */}
        {availableSources && availableSources.some(source => source.status === 'available') && (
          <div className="pt-2 border-t border-[var(--card-border)]">
            <div className="text-xs text-[var(--text-secondary)] mb-2">Available Sources:</div>
            <div className="flex flex-wrap gap-1">
              {availableSources.filter(source => source.status === 'available').map((source, index) => {
                const colors = getStatusColor(source.status);
                return (
                  <div
                    key={index}
                    className={`inline-flex items-center space-x-1 px-2 py-1 rounded border ${colors.bg} ${colors.border}`}
                  >
                    <span className="text-xs">{getSourceIcon(source.name)}</span>
                    <span className={`text-xs ${colors.text}`}>
                      {source.name}
                    </span>
                    <div className={`w-1.5 h-1.5 rounded-full ${colors.dot}`}></div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Detailed Information */}
        {showDetails && (
          <div className="mt-4 space-y-2">
            {processedSources.filter(source => source.details).map((source, index) => (
              <div
                key={index}
                className="p-3 bg-[var(--bg-primary)] rounded-lg border border-[var(--card-border)]"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">{getSourceIcon(source.name)}</span>
                    <span className="text-xs font-medium text-[var(--text-primary)]">
                      {source.name}
                    </span>
                    {source.quality && (
                      <span className="text-xs">
                        {getQualityIcon(source.quality)}
                      </span>
                    )}
                  </div>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${getStatusColor(source.status).bg} ${getStatusColor(source.status).text}`}>
                    {source.status}
                  </span>
                </div>
                {source.details && (
                  <p className="text-xs text-[var(--text-secondary)]">
                    {source.details}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Summary */}
        <div className="mt-3 pt-3 border-t border-[var(--card-border)]">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[var(--text-secondary)]">
              {processedSources.filter(s => s.status === 'active').length} active sources
            </span>
            <div className="flex items-center space-x-1">
              {processedSources.some(s => s.quality === 'excellent') && (
                <span className="text-green-400">⭐ Premium Quality</span>
              )}
              {!processedSources.some(s => s.quality === 'excellent') && 
               processedSources.some(s => s.quality === 'good') && (
                <span className="text-blue-400">✅ High Quality</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}