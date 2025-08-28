'use client';

import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import PresentationSlides from './PresentationSlides';
import { VideoPreview } from './VideoPreview';
import SimplePdfDownload from './SimplePdfDownload';
import { extractVideoInfo, isValidYouTubeUrl } from '../lib/utils/youtube';

interface ProcessingResult {
  title: string;
  content: string;
  template: string;
  contentAnalysis?: {
    type: string;
    complexity: string;
    confidence: number;

    cognitiveLoad?: string;
    readabilityLevel?: string;
  };
  quality?: {
    formatCompliance: number;
    nonConversationalScore: number;
    contentAdaptation: string;
    cognitiveOptimization?: string;
  };
}

interface VideoUploadProps {
  selectedTemplate?: string;
}

export function VideoUpload({ selectedTemplate = 'basic-summary' }: VideoUploadProps) {
  const [videoUrl, setVideoUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showMarkdown, setShowMarkdown] = useState(true);
  const [videoInfo, setVideoInfo] = useState<ReturnType<typeof extractVideoInfo> | null>(null);
  const [currentVerbosity, setCurrentVerbosity] = useState<'brief' | 'standard' | 'comprehensive'>('comprehensive');
  const [isAdjustingVerbosity, setIsAdjustingVerbosity] = useState(false);

  useEffect(() => {
    if (videoUrl.trim()) {
      const info = extractVideoInfo(videoUrl.trim());
      setVideoInfo(info.isValid ? info : null);
    } else {
      setVideoInfo(null);
    }
  }, [videoUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoUrl.trim() || !videoInfo?.isValid) return;

    setIsProcessing(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/videos/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoUrl: videoUrl.trim(),
          selectedTemplate
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process video');
      }

      setResult(data);
      setCurrentVerbosity('comprehensive'); // Reset to comprehensive when new result is generated
    } catch (err: any) {
      setError(err.message || 'An error occurred while processing the video');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClearVideo = () => {
    setVideoUrl('');
    setVideoInfo(null);
    setResult(null);
    setError(null);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const adjustVerbosity = async (newVerbosity: 'brief' | 'standard' | 'comprehensive') => {
    if (!videoUrl.trim() || !result) return;
    
    setIsAdjustingVerbosity(true);
    setCurrentVerbosity(newVerbosity);
    
    try {
      const response = await fetch('/api/videos/adjust-verbosity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoUrl: videoUrl.trim(),
          selectedTemplate,
          currentContent: result.content,
          newVerbosity
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to adjust verbosity');
      }

      setResult({
        ...result,
        content: data.content
      });
    } catch (err: any) {
      setError(err.message || 'Failed to adjust verbosity level');
    } finally {
      setIsAdjustingVerbosity(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-white mb-6 text-center">
        Upload Your YouTube Video
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="videoUrl" className="sr-only">
            YouTube Video URL
          </label>
          <input
            type="url"
            id="videoUrl"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className="w-full px-4 py-3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
            required
          />
        </div>

        {videoUrl && !isValidYouTubeUrl(videoUrl) && (
          <p className="text-red-400 text-sm mt-1">Please enter a valid YouTube URL</p>
        )}



        {videoInfo && videoInfo.isValid && (
          <VideoPreview videoInfo={videoInfo} onClear={handleClearVideo} />
        )}

        {videoInfo && videoInfo.isValid && (
          <div className="text-center">
            <div className="space-y-4">
              <button
                type="submit"
                disabled={isProcessing}
                className="bg-gradient-to-r from-purple-500/80 to-pink-500/80 backdrop-blur-lg border border-white/20 rounded-xl px-8 py-4 text-white font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mx-auto transition-all duration-300 hover:from-purple-500 hover:to-pink-500 hover:shadow-2xl hover:-translate-y-0.5"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  'Convert to Notes'
                )}
              </button>
              {isProcessing && (
                <div className="text-center">
                  <div className="inline-flex items-center space-x-2 text-sm text-gray-400">
                    <div className="animate-pulse">⏳</div>
                    <span>Analyzing video content...</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </form>

      {!videoInfo && (
        <div className="mt-6 text-center text-sm text-gray-400">
          <p>Paste any YouTube video URL to get started</p>
          <p className="mt-1">Free tier: 3 videos per month</p>
        </div>
      )}

      {error && (
        <div className="mt-6 p-4 bg-red-500/20 backdrop-blur-lg border border-red-500/30 rounded-xl">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {result && result.content && (
        <>
          {result.template === 'presentation-slides' ? (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white">{result.title}</h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setResult(null)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <PresentationSlides 
                content={result.content}
                videoUrl={videoUrl}
              />
            </div>
          ) : (
            <div className="mt-6 bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white">{result.title}</h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setResult(null)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <div className="bg-black/20 rounded-xl p-4 max-h-96 overflow-y-auto">
                {showMarkdown ? (
                  <div className="text-sm text-gray-300 prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h1: ({children}) => <h1 className="text-xl font-bold text-white mb-4">{children}</h1>,
                        h2: ({children}) => <h2 className="text-lg font-semibold text-white mb-3">{children}</h2>,
                        h3: ({children}) => <h3 className="text-base font-semibold text-white mb-2">{children}</h3>,
                        p: ({children}) => <p className="mb-3">{children}</p>,
                        ul: ({children}) => <ul className="list-disc list-inside mb-3 space-y-1">{children}</ul>,
                        ol: ({children}) => <ol className="list-decimal list-inside mb-3 space-y-1">{children}</ol>,
                        li: ({children}) => <li className="ml-4">{children}</li>,
                        strong: ({children}) => <strong className="font-semibold text-white">{children}</strong>,
                        em: ({children}) => <em className="italic">{children}</em>,
                        code: ({children}) => <code className="bg-gray-800 px-1 py-0.5 rounded text-xs">{children}</code>,
                        pre: ({children}) => <pre className="bg-gray-800 p-3 rounded-lg overflow-x-auto mb-3">{children}</pre>,
                      }}
                    >
                      {typeof result.content === 'string' ? result.content : String(result.content || '')}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono">
                    {result.content}
                  </pre>
                )}
              </div>
              {/* Verbosity Adjustment Controls */}
              <div className="mt-4 p-4 bg-black/10 rounded-xl border border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-300">Adjust Detail Level</span>
                  <span className="text-xs text-gray-400">Current: {currentVerbosity}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => adjustVerbosity('brief')}
                    disabled={currentVerbosity === 'brief' || isAdjustingVerbosity}
                    className="px-3 py-1.5 bg-red-500/20 border border-red-500/30 rounded-lg text-xs text-red-300 hover:bg-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    {isAdjustingVerbosity && currentVerbosity === 'brief' ? 'Processing...' : 'Brief'}
                  </button>
                  <button
                    onClick={() => adjustVerbosity('standard')}
                    disabled={currentVerbosity === 'standard' || isAdjustingVerbosity}
                    className="px-3 py-1.5 bg-yellow-500/20 border border-yellow-500/30 rounded-lg text-xs text-yellow-300 hover:bg-yellow-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    {isAdjustingVerbosity && currentVerbosity === 'standard' ? 'Processing...' : 'Standard'}
                  </button>
                  <button
                    onClick={() => adjustVerbosity('comprehensive')}
                    disabled={currentVerbosity === 'comprehensive' || isAdjustingVerbosity}
                    className="px-3 py-1.5 bg-green-500/20 border border-green-500/30 rounded-lg text-xs text-green-300 hover:bg-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    {isAdjustingVerbosity && currentVerbosity === 'comprehensive' ? 'Processing...' : 'Comprehensive'}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Brief: 50-75 words | Standard: 100-150 words | Comprehensive: 200-300 words per concept
                </p>
              </div>

              <div className="mt-4 flex justify-between items-center text-sm text-gray-400">
                <span>Template: {result.template}</span>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setShowMarkdown(!showMarkdown)}
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    {showMarkdown ? 'Show Raw' : 'Show Preview'}
                  </button>
                  <button
                    onClick={() => copyToClipboard(result.content)}
                    className="text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    Copy to Clipboard
                  </button>
                </div>
              </div>
              
              {/* PDF Download */}
              <div className="mt-4 flex justify-center">
                <SimplePdfDownload
                  content={typeof result.content === 'string' ? result.content : String(result.content || '')}
                  title={result.title}
                  template={result.template}
                />
              </div>
            </div>
          )}
        </>
      )}

    </div>
  );
}
