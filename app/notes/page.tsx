'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface VideoWithNotes {
  videoId: string;
  title: string;
  youtubeUrl: string;
  thumbnailUrl?: string;
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
      }
    } else {
      setSelectedFormat('');
      setSelectedFormatContent(null);
    }
  }, [selectedVideo]);

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

  const handleVideoSelect = (video: VideoWithNotes) => {
    setSelectedVideo(video);
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
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-[var(--text-primary)] font-medium truncate">
                          {video.title || 'Untitled Video'}
                        </h3>
                        <p className="text-[var(--text-secondary)] text-sm mt-1">
                          {new Date(video.noteFormats[0]?.createdAt || Date.now()).toLocaleDateString()}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="bg-[var(--accent-pink)] text-white text-xs px-2 py-1 rounded-full font-medium">
                            {getUniqueFormats(video.noteFormats).length} format{getUniqueFormats(video.noteFormats).length !== 1 ? 's' : ''}
                          </span>
                        </div>
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
                      <button
                        key={format.templateId}
                        onClick={() => {
                          setSelectedFormat(format.templateId);
                          setSelectedFormatContent(format);
                        }}
                        className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                          selectedFormat === format.templateId
                            ? 'bg-[var(--accent-pink)] text-white shadow-lg'
                            : 'bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--text-primary)] hover:bg-[var(--accent-pink-soft)] hover:border-[var(--accent-pink)]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {formatTemplateName(format.templateId)}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNote(format.noteId, format.templateId);
                            }}
                            className="ml-1 text-red-500 hover:text-red-600 transition-colors p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20"
                            title="Delete this format"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </button>
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
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{getSelectedFormatContent()!.content}</ReactMarkdown>
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
      </div>
    </div>
  );
}
