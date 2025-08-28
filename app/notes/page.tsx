'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Header } from '../../components/Header';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface UserNote {
  id: string;
  videoId: string;
  youtubeUrl: string;
  title?: string;
  thumbnailUrl?: string;
  templateId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export default function NotesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [notes, setNotes] = useState<UserNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNote, setSelectedNote] = useState<UserNote | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    } else if (status === 'authenticated' && session?.user?.id) {
      fetchNotes();
    }
  }, [status, session, router]);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/notes/list');
      const data = await response.json();

      if (data.success) {
        setNotes(data.notes);
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

  const deleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (data.success) {
        setNotes(notes.filter(note => note.id !== noteId));
        if (selectedNote?.id === noteId) {
          setSelectedNote(null);
        }
      } else {
        setError(data.error || 'Failed to delete note');
      }
    } catch (error) {
      setError('Failed to delete note');
      console.error('Error deleting note:', error);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <Header />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-white">Loading...</div>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Header />
      
      <div className="container mx-auto max-w-7xl px-4 pt-20 pb-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-white">My Notes</h1>
          <button
            onClick={() => router.push('/')}
            className="glass-button px-6 py-3 text-white font-semibold hover:bg-white/10 transition-colors"
          >
            Create New Note
          </button>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6">
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-white">Loading your notes...</div>
          </div>
        ) : error && error.includes('not configured') ? (
          <div className="text-center py-12">
            <div className="text-yellow-400 text-lg mb-4">Database not configured</div>
            <p className="text-gray-400 mb-4">To save and view notes, please set up your database environment variables.</p>
            <button
              onClick={() => router.push('/')}
              className="glass-button px-6 py-3 text-white font-semibold hover:bg-white/10 transition-colors"
            >
              Continue Without Notes
            </button>
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-4">No notes yet</div>
            <button
              onClick={() => router.push('/')}
              className="glass-button px-6 py-3 text-white font-semibold hover:bg-white/10 transition-colors"
            >
              Create Your First Note
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Notes List */}
            <div className="lg:col-span-1">
              <h2 className="text-xl font-semibold text-white mb-4">Notes ({notes.length})</h2>
              <div className="space-y-3">
                {notes.map((note) => (
                  <div
                    key={note.id}
                    className={`glass-dark p-4 rounded-lg cursor-pointer transition-all duration-200 ${
                      selectedNote?.id === note.id ? 'ring-2 ring-purple-400' : 'hover:bg-white/5'
                    }`}
                    onClick={() => setSelectedNote(note)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-medium truncate">
                          {note.title || 'Untitled Video'}
                        </h3>
                        <p className="text-gray-400 text-sm mt-1">
                          {new Date(note.createdAt).toLocaleDateString()}
                        </p>
                        <p className="text-purple-300 text-xs mt-1 capitalize">
                          {note.templateId.replace('-', ' ')}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNote(note.id);
                        }}
                        className="ml-2 text-red-400 hover:text-red-300 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Note Content */}
            <div className="lg:col-span-2">
              {selectedNote ? (
                <div className="glass-dark p-6 rounded-lg">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-2">
                        {selectedNote.title || 'Untitled Video'}
                      </h2>
                      <p className="text-gray-400">
                        {new Date(selectedNote.createdAt).toLocaleDateString()} • {selectedNote.templateId.replace('-', ' ')}
                      </p>
                    </div>
                    <a
                      href={selectedNote.youtubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-400 hover:text-purple-300 transition-colors"
                    >
                      Watch Video →
                    </a>
                  </div>
                  
                  <div className="prose prose-invert max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{selectedNote.content}</ReactMarkdown>
                  </div>
                </div>
              ) : (
                <div className="glass-dark p-6 rounded-lg flex items-center justify-center">
                  <div className="text-center text-gray-400">
                    <p>Select a note to view its content</p>
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
