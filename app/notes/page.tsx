'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { VideoThumbnail } from '@/components/VideoThumbnail';
import SimplePdfDownload from '@/components/SimplePdfDownload';
import ProcessingStatusBar, { ProcessingStep } from '@/components/ProcessingStatusBar';
import FloatingChatbot from '@/components/chatbot/FloatingChatbot';
import { ChatbotVideoContext } from '@/lib/types/enhanced-video-analysis';

interface VideoWithNotes {
  videoId: string; // Database UUID
  youtubeVideoId: string; // YouTube video ID for API calls
  title: string;
  youtubeUrl: string;
  thumbnailUrl?: string;
  duration?: number; // Video duration in seconds
  noteFormats: {
    noteId: string;
    templateId: string;
    content: string;
    createdAt: string;
    updatedAt: string;
  }[];
}

interface FormatContent {
  noteId: string;
  templateId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  verbosityVersions?: {
    brief?: string;
    standard?: string;
    comprehensive?: string;
  };
}

export default function NotesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [videos, setVideos] = useState<VideoWithNotes[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<VideoWithNotes | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<string>('');
  const [selectedFormatContent, setSelectedFormatContent] = useState<FormatContent | null>(null);
  const [currentVerbosity, setCurrentVerbosity] = useState<'brief' | 'standard' | 'comprehensive'>('standard');
  const [chatbotContext, setChatbotContext] = useState<ChatbotVideoContext | null>(null);
  const [loadingChatbotContext, setLoadingChatbotContext] = useState(false);
  const [generatedVerbosityVersions, setGeneratedVerbosityVersions] = useState<Record<string, {
    brief?: string;
    standard?: string;
    comprehensive?: string;
  }>>({});
  
  // Function to determine processing status based on available data
  const getVideoProcessingSteps = (video: VideoWithNotes, hasAnalysis: boolean): ProcessingStep[] => {
    return [
      {
        key: 'analysis', 
        label: 'Enhanced Video Analysis Available',
        status: hasAnalysis ? 'complete' : 'pending',
        description: hasAnalysis 
          ? 'Enhanced analysis complete! More features available.' 
          : 'Enhanced analysis not available for this video.'
      }
    ];
  };

  // Helper function to deduplicate formats by templateId, keeping the most recent one
  const getUniqueFormats = (noteFormats: FormatContent[]) => {
    const formatMap = new Map<string, FormatContent>();
    
    // Group by templateId, keeping the most recent note for each template
    noteFormats.forEach(format => {
      const existing = formatMap.get(format.templateId);
      if (!existing || new Date(format.createdAt) > new Date(existing.createdAt)) {
        formatMap.set(format.templateId, format);
      }
    });
    
    return Array.from(formatMap.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    } else if (status === 'authenticated' && session?.user?.id) {
      fetchVideos();
    }
  }, [status, session, router]);

  // Auto-select first format when video changes
  useEffect(() => {
    if (selectedVideo && selectedVideo.noteFormats.length > 0) {
      const uniqueFormats = getUniqueFormats(selectedVideo.noteFormats);
      if (uniqueFormats.length > 0) {
        setSelectedFormat(uniqueFormats[0].templateId);
        setSelectedFormatContent(uniqueFormats[0]);
        
        // DEBUG: Log verbosity versions for debugging
        console.log('🔍 DEBUG: Selected format content:', uniqueFormats[0]);
        console.log('🔍 DEBUG: Verbosity versions available:', uniqueFormats[0].verbosityVersions);
      }
    } else {
      setSelectedFormat('');
      setSelectedFormatContent(null);
    }
  }, [selectedVideo]);

  // Reset verbosity to standard when format changes
  useEffect(() => {
    setCurrentVerbosity('standard');
  }, [selectedFormat]);

  // Clear generated versions when video changes
  useEffect(() => {
    setGeneratedVerbosityVersions({});
    setCurrentVerbosity('standard');
  }, [selectedVideo]);

  // Load comprehensive analysis for chatbot context when video is selected
  useEffect(() => {
    const loadChatbotContext = async () => {
      if (!selectedVideo?.youtubeVideoId) {
        setChatbotContext(null);
        return;
      }

      try {
        setLoadingChatbotContext(true);
        console.log(`🤖 Loading chatbot context for video: ${selectedVideo.youtubeVideoId}`);

        const response = await fetch(`/api/videos/comprehensive-analysis?videoId=${selectedVideo.youtubeVideoId}`);
        const data = await response.json();

        if (data.success && data.analysis) {
          // Transform database analysis into ChatbotVideoContext format
          const chatbotCtx: ChatbotVideoContext = {
            videoId: selectedVideo.youtubeVideoId,
            title: selectedVideo.title,
            youtubeUrl: selectedVideo.youtubeUrl || '',
            duration: selectedVideo.duration || 0,
            currentlyViewingFormat: selectedFormat,
            currentVerbosityLevel: currentVerbosity,
            userSubscriptionTier: 'free', // TODO: Get from session/subscription
            analysis: {
              fullTranscript: data.analysis.fullTranscript || {
                segments: [],
                totalDuration: 0,
                language: 'en',
                averageConfidence: 0,
                wordCount: 0
              },
              visualAnalysis: data.analysis.visualAnalysis || {
                keyFrames: [],
                hasSlides: data.analysis.hasSlides || false,
                hasCharts: data.analysis.hasCharts || false,
                hasDiagrams: false,
                visualComplexity: 'low',
                screenTextRatio: 0
              },
              contentStructure: data.analysis.contentStructure || {
                chapters: [],
                mainTopics: [],
                flowType: 'linear',
                hasIntroduction: false,
                hasConclusion: false,
                transitionPoints: []
              },
              conceptMap: data.analysis.conceptMap || {
                concepts: [],
                relationships: [],
                hierarchyLevels: []
              },
              primarySubject: data.analysis.primarySubject || 'General',
              secondarySubjects: data.analysis.secondarySubjects || [],
              contentTags: data.analysis.contentTags || [],
              difficultyLevel: data.analysis.difficultyLevel || 'intermediate',
              suggestedQuestions: data.analysis.suggestedQuestions || [],
              keyTimestamps: data.analysis.keyTimestamps || [],
              allTemplateOutputs: data.analysis.allTemplateOutputs || {},
              analysisVersion: data.analysis.analysisVersion || '1.0',
              processingTime: data.analysis.processingTime || 0,
              totalTokensUsed: data.analysis.totalTokensUsed || 0,
              analysisCostInCents: data.analysis.analysisCostInCents || 0,
              transcriptConfidence: parseFloat(data.analysis.transcriptConfidence || '0'),
              analysisCompleteness: 1.0,
              createdAt: new Date(data.analysis.createdAt || Date.now()),
              updatedAt: new Date(data.analysis.updatedAt || Date.now())
            }
          };

          setChatbotContext(chatbotCtx);
          console.log(`✅ Chatbot context loaded: ${chatbotCtx.analysis.conceptMap.concepts.length} concepts available`);
        } else {
          console.log(`⚠️ No comprehensive analysis found for video: ${selectedVideo.youtubeVideoId}`);
          setChatbotContext(null);
        }
      } catch (error) {
        console.error('Failed to load chatbot context:', error);
        setChatbotContext(null);
      } finally {
        setLoadingChatbotContext(false);
      }
    };

    loadChatbotContext();
  }, [selectedVideo?.youtubeVideoId, selectedFormat, currentVerbosity]);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/notes/list');
      const data = await response.json();

      if (data.success) {
        setVideos(data.videos || []);
      } else {
        setError(data.error || 'Failed to fetch notes');
      }
    } catch (error) {
      setError('Failed to fetch notes');
      console.error('Error fetching notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteNote = async (noteId: string, templateId: string) => {
    if (!confirm('Are you sure you want to delete this note format?')) return;

    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (data.success) {
        // Update videos state by removing the deleted note format
        setVideos(prevVideos => 
          prevVideos.map(video => ({
            ...video,
            noteFormats: video.noteFormats.filter(format => format.noteId !== noteId)
          })).filter(video => video.noteFormats.length > 0) // Remove videos with no formats
        );
        
        // Reset selection if current format was deleted
        if (selectedVideo && selectedFormat === templateId) {
          const updatedVideo = videos.find(v => v.videoId === selectedVideo.videoId);
          if (updatedVideo) {
            const remainingFormats = updatedVideo.noteFormats.filter(f => f.noteId !== noteId);
            if (remainingFormats.length === 0) {
              setSelectedVideo(null);
              setSelectedFormat('');
              setSelectedFormatContent(null);
            } else {
              const updatedVideoData = {
                ...updatedVideo,
                noteFormats: remainingFormats
              };
              setSelectedVideo(updatedVideoData);
              
              const uniqueFormats = getUniqueFormats(remainingFormats);
              if (uniqueFormats.length > 0) {
                setSelectedFormat(uniqueFormats[0].templateId);
                setSelectedFormatContent(uniqueFormats[0]);
              } else {
                setSelectedFormat('');
                setSelectedFormatContent(null);
              }
            }
          }
        }
      } else {
        setError(data.error || 'Failed to delete note');
      }
    } catch (error) {
      setError('Failed to delete note');
      console.error('Error deleting note:', error);
    }
  };

  const formatTemplateName = (templateId: string) => {
    return templateId
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getSelectedFormatContent = () => {
    return selectedFormatContent;
  };

  // Get current verbosity content for the selected format
  const getCurrentVerbosityContent = (): string => {
    const formatContent = getSelectedFormatContent();
    if (!formatContent) return '';

    const formatKey = `${selectedVideo?.videoId}-${selectedFormat}`;
    const generated = generatedVerbosityVersions[formatKey];
    
    // Check generated versions first, then database versions, then original content
    if (generated && generated[currentVerbosity]) {
      return generated[currentVerbosity]!;
    }
    
    if (formatContent.verbosityVersions && formatContent.verbosityVersions[currentVerbosity]) {
      return formatContent.verbosityVersions[currentVerbosity]!;
    }

    // For standard verbosity, always return original content if no specific version exists
    if (currentVerbosity === 'standard') {
      return formatContent.content;
    }

    // For brief/comprehensive, fallback to original content if no version exists
    return formatContent.content;
  };

  // Check if verbosity versions are available for the selected format
  const hasVerbosityVersions = (): boolean => {
    const formatContent = getSelectedFormatContent();
    // Always show verbosity controls if we have content - generate on-demand if needed
    return !!(formatContent?.content);
  };

  // Handle verbosity level changes using pre-stored versions
  const handleVerbosityChange = (newVerbosity: 'brief' | 'standard' | 'comprehensive') => {
    if (!selectedVideo || !selectedFormat || !selectedFormatContent) {
      console.error('Missing required data for verbosity change');
      return;
    }

    // Check if we have the verbosity version in database or generated versions
    const formatKey = `${selectedVideo.videoId}-${selectedFormat}`;
    const generated = generatedVerbosityVersions[formatKey];
    const hasInDatabase = selectedFormatContent.verbosityVersions?.[newVerbosity];
    const hasGenerated = generated?.[newVerbosity];
    
    // DEBUG: Log current state for debugging
    console.log('🔍 DEBUG: Verbosity change debugging:');
    console.log('  - New verbosity:', newVerbosity);
    console.log('  - Selected format content:', selectedFormatContent);
    console.log('  - Database verbosity versions:', selectedFormatContent.verbosityVersions);
    console.log('  - Generated versions:', generated);
    console.log('  - Has in database:', hasInDatabase);
    console.log('  - Has generated:', hasGenerated);
    
    // All verbosity versions should be pre-stored, so just switch immediately
    if (hasInDatabase || hasGenerated || newVerbosity === 'standard') {
      console.log(`✅ Switching to ${newVerbosity} verbosity (using pre-stored version)`);
      setCurrentVerbosity(newVerbosity);
      return;
    }

    // If for some reason the version doesn't exist, fallback to standard content
    console.warn(`⚠️ ${newVerbosity} version not found for ${selectedFormat}, falling back to original content`);
    setCurrentVerbosity(newVerbosity);
  };

  const loadChatbotContext = async (videoId: string) => {
    try {
      console.log('🤖 Loading chatbot context for video:', videoId);
      const response = await fetch(`/api/videos/comprehensive-analysis?videoId=${videoId}`);
      const data = await response.json();
      
      console.log('📊 Comprehensive analysis response:', data);
      
      if (data.success && data.analysis) {
        // Find the video details using YouTube video ID
        const video = videos.find(v => v.youtubeVideoId === videoId);
        if (!video) {
          console.warn('❌ Video not found in local videos list:', videoId);
          return;
        }
        
        const context: ChatbotVideoContext = {
          videoId, // This is now the YouTube video ID
          title: video.title,
          youtubeUrl: video.youtubeUrl,
          duration: 0, // Would be fetched from video metadata
          currentlyViewingFormat: selectedFormat,
          currentVerbosityLevel: currentVerbosity,
          userSubscriptionTier: 'free', // Would come from user session
          analysis: data.analysis
        };
        
        console.log('✅ Chatbot context loaded successfully with', 
          data.analysis.conceptMap?.concepts?.length || 0, 'concepts');
        setChatbotContext(context);
      } else {
        console.warn('❌ No comprehensive analysis found for video:', videoId, 'Response:', data);
        setChatbotContext(null);
      }
    } catch (error) {
      console.error('💥 Failed to load chatbot context:', error);
      setChatbotContext(null);
    }
  };

  const handleVideoSelect = (video: VideoWithNotes) => {
    setSelectedVideo(video);
    // Load chatbot context for the selected video using YouTube video ID
    loadChatbotContext(video.youtubeVideoId);
    // Auto-select first format is handled by useEffect
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)]">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-[var(--text-primary)] text-lg">Loading...</div>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">      
      <div className="container mx-auto max-w-7xl px-4 pt-24 pb-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-[var(--text-primary)]">My Notes</h1>
          <button
            onClick={() => router.push('/')}
            className="bg-[var(--card-bg)] backdrop-blur-md border border-[var(--card-border)] rounded-xl px-6 py-3 text-[var(--text-primary)] font-semibold hover:bg-[var(--accent-pink-soft)] hover:border-[var(--accent-pink)] transition-all duration-300 hover:transform hover:translate-y-[-1px] shadow-[var(--card-shadow)]"
          >
            Create New Note
          </button>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 mb-6">
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-[var(--text-primary)] text-lg">Loading your videos...</div>
          </div>
        ) : error && error.includes('not configured') ? (
          <div className="text-center py-12">
            <div className="bg-[var(--card-bg)] backdrop-blur-md border border-[var(--card-border)] rounded-2xl p-8 max-w-md mx-auto shadow-[var(--card-shadow)]">
              <div className="text-yellow-500 text-lg mb-4 font-semibold">Database not configured</div>
              <p className="text-[var(--text-secondary)] mb-6">To save and view notes, please set up your database environment variables.</p>
              <button
                onClick={() => router.push('/')}
                className="bg-[var(--card-bg)] backdrop-blur-md border border-[var(--card-border)] rounded-xl px-6 py-3 text-[var(--text-primary)] font-semibold hover:bg-[var(--accent-pink-soft)] hover:border-[var(--accent-pink)] transition-all duration-300 hover:transform hover:translate-y-[-1px] shadow-[var(--card-shadow)]"
              >
                Continue Without Notes
              </button>
            </div>
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-[var(--card-bg)] backdrop-blur-md border border-[var(--card-border)] rounded-2xl p-8 max-w-md mx-auto shadow-[var(--card-shadow)]">
              <div className="text-[var(--text-secondary)] text-lg mb-4">No notes yet</div>
              <button
                onClick={() => router.push('/')}
                className="bg-[var(--card-bg)] backdrop-blur-md border border-[var(--card-border)] rounded-xl px-6 py-3 text-[var(--text-primary)] font-semibold hover:bg-[var(--accent-pink-soft)] hover:border-[var(--accent-pink)] transition-all duration-300 hover:transform hover:translate-y-[-1px] shadow-[var(--card-shadow)]"
              >
                Create Your First Note
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Videos List */}
            <div className="lg:col-span-1">
              <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">Videos ({videos.length})</h2>
              <div className="space-y-3">
                {videos.map((video) => (
                  <div
                    key={video.videoId || 'no-video'}
                    className={`bg-[var(--card-bg)] backdrop-blur-md border border-[var(--card-border)] rounded-xl p-4 cursor-pointer transition-all duration-300 hover:transform hover:translate-y-[-1px] shadow-[var(--card-shadow)] ${
                      selectedVideo?.videoId === video.videoId 
                        ? 'ring-2 ring-[var(--accent-pink)] bg-[var(--accent-pink-soft)] border-[var(--accent-pink)]' 
                        : 'hover:bg-[var(--accent-pink-soft)] hover:border-[var(--accent-pink)]'
                    }`}
                    onClick={() => handleVideoSelect(video)}
                  >
                    <div className="flex items-start gap-3">
                      {/* Add thumbnail */}
                      <VideoThumbnail
                        youtubeUrl={video.youtubeUrl}
                        backupThumbnailUrl={video.thumbnailUrl}
                        className="w-16 h-9 flex-shrink-0"
                        alt={`Thumbnail for ${video.title}`}
                      />
                      
                      {/* Video info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-[var(--text-primary)] font-medium truncate">
                          {video.title || 'Untitled Video'}
                        </h3>
                        <p className="text-[var(--text-secondary)] text-sm mt-1">
                          {new Date(video.noteFormats[0]?.createdAt || Date.now()).toLocaleDateString()}
                        </p>
                        <p className="text-[var(--accent-pink)] text-xs mt-1 font-medium">
                          {getUniqueFormats(video.noteFormats).length} format{getUniqueFormats(video.noteFormats).length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Video Content */}
            <div className="lg:col-span-2">
              {selectedVideo ? (
                <div className="bg-[var(--card-bg)] backdrop-blur-md border border-[var(--card-border)] rounded-2xl p-6 shadow-[var(--card-shadow)]">
                  {/* Video Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
                        {selectedVideo.title || 'Untitled Video'}
                      </h2>
                    </div>
                    {selectedVideo.youtubeUrl && (
                      <a
                        href={selectedVideo.youtubeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[var(--accent-pink)] hover:text-[var(--accent-pink)] font-medium transition-colors hover:underline"
                      >
                        Watch Video →
                      </a>
                    )}
                  </div>

                  {/* Format Buttons */}
                  <div className="flex flex-wrap gap-2 mb-6 pb-4 border-b border-[var(--card-border)]">
                    {getUniqueFormats(selectedVideo.noteFormats).length > 0 ? getUniqueFormats(selectedVideo.noteFormats).map((format) => (
                      <div key={format.templateId} className="relative group">
                        <button
                          onClick={() => {
                            setSelectedFormat(format.templateId);
                            setSelectedFormatContent(format);
                          }}
                          className={`px-4 py-2 pr-8 rounded-lg font-medium transition-all duration-300 ${
                            selectedFormat === format.templateId
                              ? 'bg-[var(--accent-pink)] text-white shadow-lg'
                              : 'bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--text-primary)] hover:bg-[var(--accent-pink-soft)] hover:border-[var(--accent-pink)]'
                          }`}
                        >
                          {formatTemplateName(format.templateId)}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNote(format.noteId, format.templateId);
                          }}
                          className="absolute right-1 top-1/2 transform -translate-y-1/2 text-red-500 hover:text-red-600 transition-colors p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100"
                          title="Delete this format"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    )) : (
                      <div className="text-[var(--text-secondary)] text-sm">
                        No formats available for this video.
                      </div>
                    )}
                  </div>

                  {/* Selected Format Content */}
                  {selectedFormat && getSelectedFormatContent() ? (
                    <div>
                      <div className="mb-4">
                        <p className="text-[var(--text-secondary)] text-sm">
                          {formatTemplateName(selectedFormat)} • {new Date(getSelectedFormatContent()!.createdAt).toLocaleDateString()}
                        </p>
                      </div>

                      {/* Verbosity Controls */}
                      {hasVerbosityVersions() && (
                        <div className="mb-6 p-4 bg-[var(--bg-primary)] rounded-xl border border-[var(--card-border)]">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium text-[var(--text-primary)]">Adjust Detail Level</span>
                            <span className="text-xs text-[var(--text-secondary)]">Current: {currentVerbosity}</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => handleVerbosityChange('brief')}
                              disabled={currentVerbosity === 'brief'}
                              className="px-3 py-1.5 bg-red-500/20 border border-red-500/30 rounded-lg text-xs text-red-400 hover:bg-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                            >
                              Brief
                            </button>
                            <button
                              onClick={() => handleVerbosityChange('standard')}
                              disabled={currentVerbosity === 'standard'}
                              className="px-3 py-1.5 bg-yellow-500/20 border border-yellow-500/30 rounded-lg text-xs text-yellow-400 hover:bg-yellow-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                            >
                              Standard ⭐
                            </button>
                            <button
                              onClick={() => handleVerbosityChange('comprehensive')}
                              disabled={currentVerbosity === 'comprehensive'}
                              className="px-3 py-1.5 bg-green-500/20 border border-green-500/30 rounded-lg text-xs text-green-400 hover:bg-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                            >
                              Comprehensive
                            </button>
                          </div>
                        </div>
                      )}
                      
                      <div className="prose prose-lg max-w-none text-[var(--text-primary)]">
                        <style jsx>{`
                          :global(.prose h1, .prose h2, .prose h3, .prose h4, .prose h5, .prose h6) {
                            color: var(--text-primary);
                            margin-bottom: 0.5rem;
                            margin-top: 1.5rem;
                          }
                          :global(.prose h1:first-child, .prose h2:first-child, .prose h3:first-child) {
                            margin-top: 0;
                          }
                          :global(.prose p) {
                            color: var(--text-primary);
                            margin-bottom: 1rem;
                            line-height: 1.6;
                          }
                          :global(.prose ul, .prose ol) {
                            color: var(--text-primary);
                            margin-bottom: 1rem;
                          }
                          :global(.prose li) {
                            color: var(--text-primary);
                            margin-bottom: 0.25rem;
                          }
                          :global(.prose strong) {
                            color: var(--text-primary);
                            font-weight: 600;
                          }
                          :global(.prose em) {
                            color: var(--text-secondary);
                          }
                          :global(.prose code) {
                            background-color: var(--accent-pink-soft);
                            color: var(--text-primary);
                            padding: 0.125rem 0.25rem;
                            border-radius: 0.25rem;
                            font-size: 0.875em;
                          }
                          :global(.prose pre) {
                            background-color: var(--accent-pink-soft);
                            color: var(--text-primary);
                            padding: 1rem;
                            border-radius: 0.5rem;
                            overflow-x: auto;
                          }
                          :global(.prose blockquote) {
                            border-left: 3px solid var(--accent-pink);
                            background-color: var(--accent-pink-soft);
                            padding: 1rem;
                            margin: 1rem 0;
                            border-radius: 0 0.5rem 0.5rem 0;
                          }
                          :global(.prose blockquote p) {
                            margin: 0;
                          }
                          :global(.prose table) {
                            border-collapse: collapse;
                            width: 100%;
                            margin: 1rem 0;
                          }
                          :global(.prose th, .prose td) {
                            border: 1px solid var(--card-border);
                            padding: 0.5rem;
                            text-align: left;
                          }
                          :global(.prose th) {
                            background-color: var(--accent-pink-soft);
                            font-weight: 600;
                          }
                        `}</style>
                        {/* Processing Status and PDF Download */}
                        <div className="mb-6 pb-4 border-b border-[var(--card-border)]">
                          <div className="flex flex-col lg:flex-row gap-6 items-start">
                            {/* Processing Status Bar */}
                            <div className="lg:flex-1">
                              <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
                                Features Available
                              </h4>
                              <ProcessingStatusBar 
                                steps={getVideoProcessingSteps(selectedVideo, !!chatbotContext)}
                                onFeatureClick={(step) => {
                                  if (step.key === 'chatbot' && step.status === 'complete') {
                                    // Could scroll to chatbot or highlight it
                                    console.log('Chatbot feature clicked');
                                  }
                                }}
                              />
                            </div>
                            
                            {/* PDF Download */}
                            <div className="lg:w-64 flex flex-col justify-start">
                              <SimplePdfDownload
                                content={getCurrentVerbosityContent()}
                                title={selectedVideo.title + ' - ' + formatTemplateName(selectedFormat) + ' (' + currentVerbosity + ')'}
                                template={formatTemplateName(selectedFormat)}
                                className="flex justify-center"
                              />
                            </div>
                          </div>
                        </div>
                        
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
                            {getCurrentVerbosityContent()}
                          </ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center text-[var(--text-secondary)]">
                        <p className="text-lg">Select a format to view content</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-[var(--card-bg)] backdrop-blur-md border border-[var(--card-border)] rounded-2xl p-6 flex items-center justify-center shadow-[var(--card-shadow)]">
                  <div className="text-center text-[var(--text-secondary)]">
                    <p className="text-lg">Select a video to view its content</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Context-Aware Floating Chatbot - Always visible for testing */}
        <FloatingChatbot
          videoContext={chatbotContext || undefined}
          currentNote={selectedFormatContent?.content}
          currentFormat={selectedFormat}
        />
        
        {/* TEST: Always visible chatbot for debugging */}
        <div className="fixed bottom-6 left-6 z-50">
          <button
            onClick={() => console.log('TEST: Chatbot button clicked!')}
            className="bg-red-500 hover:bg-red-600 text-white rounded-full p-4 shadow-lg transition-all duration-200 hover:scale-105"
            style={{ zIndex: 9999 }}
          >
            💬 TEST
          </button>
        </div>
      </div>
    </div>
  );
}
