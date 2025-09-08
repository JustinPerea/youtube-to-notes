'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { VideoUpload } from '../../components/VideoUpload';
import { Footer } from '../../components/Footer';
import { OrbBackground } from '../../components/ui/OrbBackground';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import { FormatCards } from '../../components/ui/FormatCards';
import { extractVideoInfo, isValidYouTubeUrl, validateAndExtractVideoInfo, URLValidationResult, YouTubeVideoInfo } from '../../lib/utils/youtube';
import { VideoPreview } from '../../components/VideoPreview';
import { VideoUploadProcessor } from '../../components/VideoUploadProcessor';
import UserProfile from '../../components/UserProfile';
import FloatingChatbot from '../../components/chatbot/FloatingChatbot';
import { ChatbotVideoContext } from '../../lib/types/enhanced-video-analysis';

export default function ProcessPage() {
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>(['basic-summary']);
  const [videoUrl, setVideoUrl] = useState('');
  const [videoInfo, setVideoInfo] = useState<ReturnType<typeof extractVideoInfo> | null>(null);
  const [showProcessor, setShowProcessor] = useState(false);
  const [validation, setValidation] = useState<URLValidationResult>({ isValid: true });
  const [isValidating, setIsValidating] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [videoContext, setVideoContext] = useState<ChatbotVideoContext | null>(null);
  const [processedNotes, setProcessedNotes] = useState<string>('');
  // Simplified: Always use hybrid processing for best results
  const processingMode = 'hybrid';
  const { data: session, status } = useSession();

  // Convert YouTubeVideoInfo to expected VideoInfo format
  const convertVideoInfo = (info: YouTubeVideoInfo | null): ReturnType<typeof extractVideoInfo> | null => {
    if (!info) return null;
    return {
      videoId: info.videoId,
      thumbnail: info.thumbnailUrl,
      isValid: info.isValid
    };
  };

  // Debounced validation function
  const debouncedValidation = useCallback((url: string) => {
    const timeoutId = setTimeout(() => {
      if (!hasInteracted) return;
      
      setIsValidating(true);
      const result = validateAndExtractVideoInfo(url);
      
      setValidation(result.validation);
      // Convert to expected format
      setVideoInfo(convertVideoInfo(result.videoInfo));
      setIsValidating(false);
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [hasInteracted]);

  // Effect for debounced validation
  useEffect(() => {
    const cleanup = debouncedValidation(videoUrl);
    return cleanup;
  }, [videoUrl, debouncedValidation]);

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setVideoUrl(url);
    
    // Mark that user has interacted with the input
    if (!hasInteracted) {
      setHasInteracted(true);
    }
    
    // Clear previous validation state when user starts typing
    if (hasInteracted) {
      setValidation({ isValid: true });
      setVideoInfo(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && validation.isValid && videoInfo?.isValid) {
      // Scroll to the format selection cards
      e.preventDefault();
      const formatCards = document.querySelector('.format-cards');
      formatCards?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleGenerateNotes = () => {
    if (validation.isValid && videoInfo?.isValid && selectedTemplates.length > 0) {
      setShowProcessor(true);
    }
  };

  const handleVideoContextUpdate = (context: ChatbotVideoContext) => {
    console.log('🤖 Received video context for chatbot:', context.title);
    setVideoContext(context);
  };

  const handleProcessedNotesUpdate = (notes: string) => {
    console.log('📝 Received processed notes for chatbot:', notes.length, 'characters');
    setProcessedNotes(notes);
  };

  const handleSignIn = () => {
    signIn('google', { callbackUrl: '/process' });
  };

  // Check if user is authenticated
  const isAuthenticated = status === 'authenticated' && session?.user;

  return (
    <div className="min-h-screen">
      {/* Animated Orbs Background */}
      <OrbBackground />
      
      {/* Content Wrapper */}
      <div className="content-wrapper relative z-10">
        {/* Theme Toggle */}
        <ThemeToggle />
        
        {/* Main Container */}
        <div className="container max-w-[1200px] mx-auto pt-20 pb-10 px-5">
          {/* Page Header */}
          <section className="hero text-center py-20">
            <h1 className="hero-title text-6xl font-extrabold leading-tight mb-6 bg-gradient-to-br from-[var(--text-primary)] to-[var(--accent-pink)] bg-clip-text text-transparent">
              Process Your Video
            </h1>
            <p className="hero-subtitle text-[22px] text-[var(--text-secondary)] mb-12 max-w-[600px] mx-auto leading-relaxed">
              Transform your YouTube video into comprehensive AI-powered notes
            </p>

            {/* Sign In Button for Non-Authenticated Users */}
            {!isAuthenticated && status !== 'loading' && (
              <div className="sign-in-section mb-12">
                <button
                  onClick={handleSignIn}
                  className="sign-in-btn px-12 py-4 bg-gradient-to-br from-[var(--accent-pink)] to-[#FF5A8C] text-white border-none rounded-[50px] text-lg font-semibold transition-all duration-300 shadow-[0_4px_20px_rgba(255,107,157,0.25)] relative overflow-hidden group hover:transform hover:translate-y-[-3px] hover:shadow-[0_6px_30px_rgba(255,107,157,0.35)]"
                >
                  {/* Ripple effect on hover */}
                  <div className="absolute top-1/2 left-1/2 w-0 h-0 rounded-full bg-white/30 transform -translate-x-1/2 -translate-y-1/2 transition-all duration-600 group-hover:w-[300px] group-hover:h-[300px]"></div>
                  <span className="relative z-10 flex items-center gap-2">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Continue with Google
                  </span>
                </button>
                <p className="text-sm text-[var(--text-muted)] mt-3">
                  Get started for free with 5 videos per month
                </p>
              </div>
            )}
          </section>

          {/* Video Processing Section */}
          <section className="video-processing-section py-20">
            {/* URL Input */}
            <div className="url-section max-w-[700px] mx-auto mb-10">
              <div className={`url-input-wrapper bg-[var(--card-bg)] backdrop-blur-[20px] border-2 rounded-2xl p-2 transition-all duration-300 relative ${
                !isAuthenticated 
                  ? 'border-[var(--card-border)] opacity-60'
                  : hasInteracted && !validation.isValid && !isValidating
                  ? 'border-red-500 shadow-[0_4px_20px_rgba(239,68,68,0.15)]'
                  : hasInteracted && validation.isValid && videoInfo && !isValidating
                  ? 'border-green-500 shadow-[0_4px_20px_rgba(34,197,94,0.15)]'
                  : 'border-[var(--card-border)] hover:border-[var(--accent-pink)] hover:shadow-[0_4px_20px_rgba(255,107,157,0.15)] hover:transform hover:translate-y-[-2px] focus-within:border-[var(--accent-pink)] focus-within:shadow-[0_4px_20px_rgba(255,107,157,0.15)] focus-within:transform focus-within:translate-y-[-2px]'
              }`}>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={videoUrl}
                    onChange={handleUrlChange}
                    onKeyDown={handleKeyDown}
                    disabled={!isAuthenticated}
                    placeholder={
                      !isAuthenticated 
                        ? "Sign into your account to use" 
                        : "Paste any YouTube URL here and press Enter..."
                    }
                    className={`url-input flex-1 px-6 py-5 bg-transparent border-none text-base outline-none font-medium ${
                      !isAuthenticated 
                        ? 'text-[var(--text-muted)] placeholder:text-[var(--text-muted)] cursor-not-allowed'
                        : 'text-[var(--text-primary)] placeholder:text-[var(--text-muted)]'
                    }`}
                    aria-describedby={hasInteracted && !validation.isValid ? 'url-error' : undefined}
                    aria-invalid={hasInteracted && !validation.isValid ? 'true' : 'false'}
                  />
                  
                  {/* Validation Status Icons */}
                  {isValidating && (
                    <div className="flex items-center justify-center w-8 h-8 mr-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-[var(--accent-pink)] border-t-transparent"></div>
                    </div>
                  )}
                  
                  {hasInteracted && !isValidating && validation.isValid && videoInfo && (
                    <div className="flex items-center justify-center w-8 h-8 mr-2">
                      <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                  
                  {hasInteracted && !isValidating && !validation.isValid && (
                    <div className="flex items-center justify-center w-8 h-8 mr-2">
                      <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Error Message */}
              {hasInteracted && !isValidating && !validation.isValid && validation.errorMessage && (
                <div id="url-error" className="mt-3 px-4" role="alert" aria-live="polite">
                  <p className="text-red-500 text-sm font-medium mb-2">
                    {validation.errorMessage}
                  </p>
                  {validation.suggestions && validation.suggestions.length > 0 && (
                    <div className="text-xs text-[var(--text-secondary)]">
                      <p className="mb-1">Try these formats:</p>
                      <ul className="space-y-1">
                        {validation.suggestions.map((suggestion, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <span className="text-[var(--text-muted)]">•</span>
                            <code className="bg-[var(--card-bg)] px-2 py-1 rounded text-[var(--text-primary)] font-mono text-xs">
                              {suggestion}
                            </code>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Video Preview - Only show for authenticated users */}
            {isAuthenticated && validation.isValid && videoInfo && videoInfo.isValid && (
              <div className="max-w-[700px] mx-auto mb-10">
                <VideoPreview 
                  videoInfo={videoInfo} 
                  onClear={() => {
                    setVideoUrl('');
                    setVideoInfo(null);
                    setValidation({ isValid: true });
                    setHasInteracted(false);
                  }}
                  onRecommendationChange={(rec) => {
                    // Note: Processing mode is now fixed to hybrid, but we keep this for compatibility
                    console.log(`Video recommendation: ${rec.mode} (using hybrid regardless)`);
                  }}
                />
              </div>
            )}
            
            {/* Format Selection Cards - Only show for authenticated users */}
            {isAuthenticated && validation.isValid && videoInfo && videoInfo.isValid && (
              <FormatCards 
                selectedTemplates={selectedTemplates}
                onTemplateToggle={(template) => {
                  setSelectedTemplates(prev => 
                    prev.includes(template)
                      ? prev.filter(t => t !== template)
                      : [...prev, template]
                  );
                }}
              />
            )}

            {/* Processing Mode Selection removed - now defaults to hybrid processing for optimal results */}
            
            {/* Generate Button - Only show for authenticated users */}
            {isAuthenticated && validation.isValid && videoInfo && videoInfo.isValid && (
              <div className="generate-btn-wrapper text-center mb-15">
                <button
                  onClick={handleGenerateNotes}
                  disabled={!validation.isValid || !videoInfo?.isValid}
                  className={`generate-btn px-14 py-5 bg-gradient-to-br from-[var(--accent-pink)] to-[#FF5A8C] text-white border-none rounded-[50px] text-lg font-semibold transition-all duration-300 shadow-[0_4px_20px_rgba(255,107,157,0.25)] relative overflow-hidden group ${
                    validation.isValid && videoInfo?.isValid
                      ? 'cursor-pointer hover:transform hover:translate-y-[-3px] hover:shadow-[0_6px_30px_rgba(255,107,157,0.35)]'
                      : 'cursor-not-allowed opacity-50'
                  }`}
                >
                  {/* Ripple effect on hover */}
                  <div className="absolute top-1/2 left-1/2 w-0 h-0 rounded-full bg-white/30 transform -translate-x-1/2 -translate-y-1/2 transition-all duration-600 group-hover:w-[300px] group-hover:h-[300px]"></div>
                  <span className="relative z-10">Convert to Notes{selectedTemplates.length > 1 ? ` (${selectedTemplates.length} selected)` : ''} ✨</span>
                </button>
              </div>
            )}
          </section>
          
          {/* Video Upload Section - Hidden but accessible for functionality */}
          <div id="video-upload" className="hidden">
            <VideoUpload 
              selectedTemplate={selectedTemplates[0] || 'basic-summary'} 
              onTemplateChange={(template) => setSelectedTemplates([template])}
            />
          </div>
        </div>
        
        {/* Footer */}
        <Footer />
      </div>
      
      {/* Video Upload Processor Modal - Only show for authenticated users */}
      {isAuthenticated && showProcessor && videoInfo?.isValid && (
        <VideoUploadProcessor
          videoUrl={videoUrl}
          selectedTemplates={selectedTemplates}
          processingMode={processingMode}
          onProcessingComplete={() => {}}
          onClose={() => setShowProcessor(false)}
          onVideoContextUpdate={handleVideoContextUpdate}
          onProcessedNotesUpdate={handleProcessedNotesUpdate}
        />
      )}
      
      {/* Video-Context Chatbot or General Help Chatbot */}
      {isAuthenticated && (
        <FloatingChatbot 
          videoContext={videoContext || undefined}
          currentNote={processedNotes || `Welcome to YouTube-to-Notes! 

**How to Use This Platform:**

1. **Paste YouTube URL**: Enter any YouTube video URL in the input field above
2. **Select Format**: Choose from Basic Summary, Study Notes, Tutorial Guide, Presentation Slides, or Quick Reference  
3. **Click Generate with AI**: Our AI will process the video using ${status === 'authenticated' ? 'your subscription tier\'s' : 'the'} optimized models
4. **Access Your Notes**: After processing, visit the Notes page to view, chat with, and export your content

**What You Can Do:**
• Process videos into structured notes and summaries
• Switch between different verbosity levels (Brief, Standard, Comprehensive)  
• Export to PDF or presentation format
• Chat with your processed content for deeper insights

**Next Steps:**
After processing a video, go to the **Notes page** to access the full chatbot that can answer specific questions about your generated content with full context awareness.`}
          currentFormat={videoContext ? selectedTemplates.join(', ') : "Getting Started Guide"}
        />
      )}
    </div>
  );
}