'use client';

/**
 * Context-Aware Floating Chatbot
 * Intelligent chat interface with full video context access
 */

import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Brain, Video, FileText, Clock, Hash } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChatbotVideoContext } from '@/lib/types/enhanced-video-analysis';

interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  relatedConcepts?: string[];
  citations?: Array<{
    type: 'timestamp' | 'concept' | 'transcript';
    value: string;
    description: string;
  }>;
}

interface FloatingChatbotProps {
  videoContext?: ChatbotVideoContext;
  currentNote?: string;
  currentFormat?: string;
  onClose?: () => void;
  className?: string;
}

export default function FloatingChatbot({
  videoContext,
  currentNote,
  currentFormat,
  onClose,
  className
}: FloatingChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [contextInfo, setContextInfo] = useState<{
    conceptCount: number;
    transcriptDuration: string;
    hasVisualContent: boolean;
    templateCount: number;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Calculate context info when videoContext changes
  useEffect(() => {
    if (videoContext?.analysis) {
      const concepts = videoContext.analysis.conceptMap.concepts.length;
      const duration = formatDuration(videoContext.duration);
      const hasVisuals = videoContext.analysis.visualAnalysis.hasSlides || 
                        videoContext.analysis.visualAnalysis.hasCharts;
      const templates = Object.keys(videoContext.analysis.allTemplateOutputs).length;

      setContextInfo({
        conceptCount: concepts,
        transcriptDuration: duration,
        hasVisualContent: hasVisuals,
        templateCount: templates
      });

      // Add welcome message with context
      if (messages.length === 0) {
        const welcomeMessage: ChatMessage = {
          id: 'welcome',
          content: `Hi! I can chat with you about this entire video. I understand ${concepts} key concepts, have the full transcript, and can reference specific moments. Ask me anything!`,
          isUser: false,
          timestamp: new Date()
        };
        setMessages([welcomeMessage]);
      }
    } else {
      // Add welcome message for notes-only mode with context
      if (messages.length === 0) {
        // Determine what content we can help with
        let contextInfo = '';
        let videoTitle = '';
        
        // Extract video title from current note if available
        if (currentNote) {
          const firstLine = currentNote.split('\n')[0];
          if (firstLine.startsWith('**') && firstLine.endsWith('**')) {
            videoTitle = firstLine.replace(/\*\*/g, '');
          }
        }
        
        if (currentNote) {
          contextInfo = videoTitle 
            ? `I can help you with questions about your generated notes for "${videoTitle}". I can see your ${currentFormat || 'processed'} notes (${Math.round(currentNote.length / 5)} words).`
            : `I can help you with questions about your generated ${currentFormat || 'processed'} notes (${Math.round(currentNote.length / 5)} words).`;
        } else {
          contextInfo = 'I can help you with questions about your generated notes.';
        }
        
        const welcomeMessage: ChatMessage = {
          id: 'welcome-notes',
          content: `Hi! ${contextInfo}

Ask me about:
• Key concepts and main points
• Explanations of specific sections  
• Summaries and takeaways
• Questions about the content

For deeper video insights with timestamps and full context, try our comprehensive video analysis!`,
          isUser: false,
          timestamp: new Date()
        };
        setMessages([welcomeMessage]);
      }
    }
  }, [videoContext, messages.length, currentNote, currentFormat]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: inputValue,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Send message with full context to chatbot API
      const response = await fetch('/api/chatbot/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputValue,
          videoContext,
          currentNote,
          currentFormat,
          conversationHistory: messages.slice(-5) // Last 5 messages for context
        }),
      });

      const data = await response.json();

      if (data.success) {
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          content: data.response,
          isUser: false,
          timestamp: new Date(),
          relatedConcepts: data.relatedConcepts,
          citations: data.citations
        };

        setMessages(prev => [...prev, aiMessage]);
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (error) {
      console.error('Chatbot error:', error);
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I encountered an error. Please try again.',
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const suggestedQuestions = videoContext ? [
    "What are the main concepts in this video?",
    "Can you find specific moments where X is discussed?",
    "What happens around the 5-minute mark?",
    "Explain the key points in detail"
  ] : [
    "Can you explain this concept better?",
    "What are the main takeaways from these notes?",
    "Help me understand this section",
    "What should I focus on studying?"
  ];

  if (!isOpen) {
    return (
      <div className={cn("fixed bottom-6 right-6 z-50", className)}>
        <button
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-all duration-200 hover:scale-105"
        >
          <MessageCircle size={24} />
          {contextInfo && (
            <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
              {contextInfo.conceptCount}
            </div>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className={cn("fixed bottom-6 right-6 z-50", className)}>
      <div className="bg-white border border-gray-200 rounded-lg shadow-2xl w-96 h-[600px] flex flex-col overflow-hidden backdrop-blur-sm bg-white/95">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Brain size={20} />
            <div>
              <h3 className="font-semibold">
                {videoContext ? 'Chat with Video' : 'Ask about Notes'}
              </h3>
              {contextInfo && (
                <p className="text-xs text-blue-100">
                  {contextInfo.conceptCount} concepts • {contextInfo.transcriptDuration}
                </p>
              )}
              {!videoContext && (
                <p className="text-xs text-blue-100">
                  Questions based on your notes
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="hover:bg-white/20 rounded-full p-1 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Context Info Bar */}
        {videoContext && (
          <div className="bg-gray-50 border-b border-gray-200 p-2">
            <div className="flex items-center space-x-4 text-xs text-gray-600">
              <div className="flex items-center space-x-1">
                <Video size={12} />
                <span>{videoContext.title.slice(0, 30)}...</span>
              </div>
              {contextInfo?.hasVisualContent && (
                <div className="flex items-center space-x-1">
                  <FileText size={12} />
                  <span>Visual content</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex",
                message.isUser ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[80%] rounded-lg p-3 text-sm",
                  message.isUser
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-800"
                )}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>
                
                {/* Citations */}
                {message.citations && message.citations.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-200 space-y-1">
                    {message.citations.map((citation, idx) => (
                      <div key={idx} className="flex items-center space-x-1 text-xs text-gray-500">
                        {citation.type === 'timestamp' && <Clock size={10} />}
                        {citation.type === 'concept' && <Hash size={10} />}
                        {citation.type === 'transcript' && <FileText size={10} />}
                        <span>{citation.description}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Related Concepts */}
                {message.relatedConcepts && message.relatedConcepts.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {message.relatedConcepts.map((concept, idx) => (
                      <span
                        key={idx}
                        className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                      >
                        {concept}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg p-3 flex items-center space-x-2">
                <Loader2 size={16} className="animate-spin" />
                <span className="text-sm text-gray-600">Thinking...</span>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Questions (only show if no messages yet) */}
        {messages.length <= 1 && (
          <div className="px-4 pb-2">
            <p className="text-xs text-gray-500 mb-2">Try asking:</p>
            <div className="space-y-1">
              {suggestedQuestions.slice(0, 2).map((question, idx) => (
                <button
                  key={idx}
                  onClick={() => setInputValue(question)}
                  className="w-full text-left text-xs bg-gray-50 hover:bg-gray-100 rounded p-2 transition-colors"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex space-x-2">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={videoContext ? "Ask about this video..." : "Ask about your notes..."}
              className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 max-h-20"
              rows={1}
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg p-2 transition-colors"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}