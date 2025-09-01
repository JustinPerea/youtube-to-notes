'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import PresentationSlides from './PresentationSlides';
import SimplePdfDownload from './SimplePdfDownload';
import { useSession } from 'next-auth/react';

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
  verbosityVersions?: {
    brief: string;
    standard: string;
    comprehensive: string;
  };
}

interface VideoUploadProcessorProps {
  videoUrl: string;
  selectedTemplate: string;
  onProcessingComplete?: () => void;
  onClose?: () => void;
}

export function VideoUploadProcessor({ 
  videoUrl, 
  selectedTemplate, 
  onProcessingComplete,
  onClose 
}: VideoUploadProcessorProps) {
  const { data: session } = useSession();
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showMarkdown, setShowMarkdown] = useState(true);
  const [currentVerbosity, setCurrentVerbosity] = useState<'brief' | 'standard' | 'comprehensive'>('standard');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [saveNoteMessage, setSaveNoteMessage] = useState<string | null>(null);

  React.useEffect(() => {
    if (videoUrl && selectedTemplate) {
      handleProcess();
    }
  }, [videoUrl, selectedTemplate]);

  const handleProcess = async () => {
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
      setCurrentVerbosity('standard');
      onProcessingComplete?.();
    } catch (err: any) {
      setError(err.message || 'An error occurred while processing the video');
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const saveNote = async () => {
    if (!session?.user?.id || !result) return;

    setIsSavingNote(true);
    setSaveNoteMessage(null);

    try {
      const response = await fetch('/api/notes/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: result.title,
          content: result.content,
          templateId: selectedTemplate,
          tags: ['youtube', 'ai-generated'],
          youtubeUrl: videoUrl, // Add the YouTube URL to link note to video
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSaveNoteMessage('Note saved successfully!');
        setTimeout(() => setSaveNoteMessage(null), 3000);
      } else {
        setSaveNoteMessage(data.error || 'Failed to save note');
      }
    } catch (error) {
      setSaveNoteMessage('Failed to save note');
      console.error('Error saving note:', error);
    } finally {
      setIsSavingNote(false);
    }
  };

  const adjustVerbosity = (newVerbosity: 'brief' | 'standard' | 'comprehensive') => {
    if (!result || !result.verbosityVersions) return;
    
    setCurrentVerbosity(newVerbosity);
    
    setResult({
      ...result,
      content: result.verbosityVersions[newVerbosity]
    });
  };

  if (isProcessing) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-[var(--card-bg)] backdrop-blur-[20px] border border-[var(--card-border)] rounded-2xl p-8 max-w-md mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent-pink)] mx-auto mb-4"></div>
            <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">Processing Video</h3>
            <p className="text-[var(--text-secondary)]">AI is analyzing your video...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-[var(--card-bg)] backdrop-blur-[20px] border border-[var(--card-border)] rounded-2xl p-8 max-w-md mx-4">
          <div className="text-center">
            <div className="text-4xl mb-4">❌</div>
            <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">Processing Failed</h3>
            <p className="text-[var(--text-secondary)] mb-4">{error}</p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-[var(--accent-pink)] text-white rounded-xl font-semibold hover:bg-[var(--accent-pink)]/90 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!result) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center overflow-y-auto">
      <div className="bg-[var(--card-bg)] backdrop-blur-[20px] border border-[var(--card-border)] rounded-2xl p-6 max-w-4xl mx-4 my-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-semibold text-[var(--text-primary)]">{result.title}</h3>
          <button
            onClick={onClose}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors text-2xl"
          >
            ✕
          </button>
        </div>
        
        {result.template === 'presentation-slides' ? (
          <PresentationSlides 
            content={result.content}
            videoUrl={videoUrl}
          />
        ) : (
          <>
            <div className="bg-[var(--bg-primary)] rounded-xl p-6 max-h-96 overflow-y-auto mb-4">
              {showMarkdown ? (
                <div className="text-sm text-[var(--text-primary)] prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({children}) => <h1 className="text-xl font-bold text-[var(--text-primary)] mb-4">{children}</h1>,
                      h2: ({children}) => <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3">{children}</h2>,
                      h3: ({children}) => <h3 className="text-base font-semibold text-[var(--text-primary)] mb-2">{children}</h3>,
                      p: ({children}) => <p className="mb-3 text-[var(--text-primary)]">{children}</p>,
                      ul: ({children}) => <ul className="list-disc list-inside mb-3 space-y-1">{children}</ul>,
                      ol: ({children}) => <ol className="list-decimal list-inside mb-3 space-y-1">{children}</ol>,
                      li: ({children}) => <li className="ml-4">{children}</li>,
                      strong: ({children}) => <strong className="font-semibold text-[var(--text-primary)]">{children}</strong>,
                      em: ({children}) => <em className="italic">{children}</em>,
                      code: ({children}) => <code className="bg-[var(--card-border)] px-1 py-0.5 rounded text-xs">{children}</code>,
                      pre: ({children}) => <pre className="bg-[var(--card-border)] p-3 rounded-lg overflow-x-auto mb-3">{children}</pre>,
                    }}
                  >
                    {typeof result.content === 'string' ? result.content : String(result.content || '')}
                  </ReactMarkdown>
                </div>
              ) : (
                <pre className="text-sm text-[var(--text-primary)] whitespace-pre-wrap font-mono">
                  {result.content}
                </pre>
              )}
            </div>

            {/* Verbosity Controls */}
            {result.verbosityVersions && (
              <div className="mb-4 p-4 bg-[var(--bg-primary)] rounded-xl border border-[var(--card-border)]">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-[var(--text-primary)]">Adjust Detail Level</span>
                  <span className="text-xs text-[var(--text-secondary)]">Current: {currentVerbosity}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => adjustVerbosity('brief')}
                    disabled={currentVerbosity === 'brief'}
                    className="px-3 py-1.5 bg-red-500/20 border border-red-500/30 rounded-lg text-xs text-red-400 hover:bg-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    Brief
                  </button>
                  <button
                    onClick={() => adjustVerbosity('standard')}
                    disabled={currentVerbosity === 'standard'}
                    className="px-3 py-1.5 bg-yellow-500/20 border border-yellow-500/30 rounded-lg text-xs text-yellow-400 hover:bg-yellow-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    Standard ⭐
                  </button>
                  <button
                    onClick={() => adjustVerbosity('comprehensive')}
                    disabled={currentVerbosity === 'comprehensive'}
                    className="px-3 py-1.5 bg-green-500/20 border border-green-500/30 rounded-lg text-xs text-green-400 hover:bg-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    Comprehensive
                  </button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowMarkdown(!showMarkdown)}
                  className="text-[var(--accent-pink)] hover:text-[var(--accent-pink)]/80 transition-colors"
                >
                  {showMarkdown ? 'Show Raw' : 'Show Preview'}
                </button>
                <button
                  onClick={() => copyToClipboard(result.content)}
                  className="text-[var(--accent-pink)] hover:text-[var(--accent-pink)]/80 transition-colors"
                >
                  Copy to Clipboard
                </button>
              </div>
              
              <SimplePdfDownload
                content={typeof result.content === 'string' ? result.content : String(result.content || '')}
                title={result.title}
                template={result.template}
              />
            </div>

            {/* Save Note */}
            {session?.user?.id && (
              <div className="mt-6 flex flex-col items-center space-y-2">
                <button
                  onClick={saveNote}
                  disabled={isSavingNote}
                  className="inline-flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 text-white font-medium rounded-lg transition-colors duration-200"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {isSavingNote ? 'Saving...' : 'Save Note'}
                </button>
                {saveNoteMessage && (
                  <div className={`text-sm ${saveNoteMessage.includes('successfully') ? 'text-green-400' : 'text-red-400'}`}>
                    {saveNoteMessage}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}