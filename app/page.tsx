'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { VideoUpload } from '../components/VideoUpload';
import { Footer } from '../components/Footer';
import { OrbBackground } from '../components/ui/OrbBackground';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { FormatCards } from '../components/ui/FormatCards';
import { FeaturesGrid } from '../components/ui/FeaturesGrid';
import { HowItWorks } from '../components/ui/HowItWorks';
import { extractVideoInfo, isValidYouTubeUrl, validateAndExtractVideoInfo, URLValidationResult, YouTubeVideoInfo } from '../lib/utils/youtube';
import { VideoPreview } from '../components/VideoPreview';
import { VideoUploadProcessor } from '../components/VideoUploadProcessor';
import UserProfile from '../components/UserProfile';

export default function Home() {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('basic-summary');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoInfo, setVideoInfo] = useState<ReturnType<typeof extractVideoInfo> | null>(null);
  const [showProcessor, setShowProcessor] = useState(false);
  const [validation, setValidation] = useState<URLValidationResult>({ isValid: true });
  const [isValidating, setIsValidating] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
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

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && validation.isValid && videoInfo?.isValid) {
      // Scroll to the video upload section
      document.getElementById('video-upload')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleGenerateNotes = () => {
    if (validation.isValid && videoInfo?.isValid && selectedTemplate) {
      setShowProcessor(true);
    }
  };

  const scrollToVideoUpload = () => {
    document.getElementById('video-upload')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <main className="min-h-screen">
      {/* Animated Orbs Background */}
      <OrbBackground />
      
      {/* Content Wrapper */}
      <div className="content-wrapper relative z-10">
        {/* Theme Toggle */}
        <ThemeToggle />
        {/* Header */}
        {/* Main Container */}
        <div className="container max-w-[1200px] mx-auto pt-[100px] pb-10 px-5">
          {/* Hero Section */}
          <section className="hero text-center py-20">
            <h1 className="hero-title text-6xl font-extrabold leading-tight mb-6 bg-gradient-to-br from-[var(--text-primary)] to-[var(--accent-pink)] bg-clip-text text-transparent">
              Transform YouTube Videos<br />Into Smart Notes
            </h1>
            <p className="hero-subtitle text-[22px] text-[var(--text-secondary)] mb-12 max-w-[600px] mx-auto leading-relaxed">
              Get comprehensive notes from YouTube videos
            </p>
            
            {/* URL Input */}
            <div className="url-section max-w-[700px] mx-auto mb-10">
              <div className={`url-input-wrapper bg-[var(--card-bg)] backdrop-blur-[20px] border-2 rounded-2xl p-2 transition-all duration-300 relative ${
                hasInteracted && !validation.isValid && !isValidating
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
                    onKeyPress={handleKeyPress}
                    placeholder="Paste any YouTube URL here and press Enter..."
                    className="url-input flex-1 px-6 py-5 bg-transparent border-none text-[var(--text-primary)] text-base outline-none font-medium placeholder:text-[var(--text-muted)]"
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
            
            {/* Video Preview */}
            {validation.isValid && videoInfo && videoInfo.isValid && (
              <div className="max-w-[700px] mx-auto mb-10">
                <VideoPreview 
                  videoInfo={videoInfo} 
                  onClear={() => {
                    setVideoUrl('');
                    setVideoInfo(null);
                    setValidation({ isValid: true });
                    setHasInteracted(false);
                  }} 
                />
              </div>
            )}
            
            {/* Format Selection Cards */}
            {validation.isValid && videoInfo && videoInfo.isValid && (
              <FormatCards 
                selectedTemplate={selectedTemplate}
                onTemplateChange={setSelectedTemplate}
              />
            )}
            
            {/* Generate Button */}
            {validation.isValid && videoInfo && videoInfo.isValid && (
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
                  <span className="relative z-10">Generate Notes with AI ✨</span>
                </button>
              </div>
            )}
          </section>
          
          {/* Video Upload Section - Hidden but accessible for functionality */}
          <div id="video-upload" className="hidden">
            <VideoUpload 
              selectedTemplate={selectedTemplate} 
              onTemplateChange={setSelectedTemplate}
            />
          </div>
          {/* Features Section */}
          <section id="features" className="features-section py-20">
            <div className="text-center mb-16">
              <h2 className="text-5xl font-bold mb-6 bg-gradient-to-br from-[var(--text-primary)] to-[var(--accent-pink)] bg-clip-text text-transparent">
                Why Choose Kyoto Scribe?
              </h2>
              <p className="text-xl text-[var(--text-secondary)] max-w-[600px] mx-auto leading-relaxed">
                Powerful AI-driven features designed to transform your learning experience
              </p>
            </div>
            <FeaturesGrid />
          </section>
          
          {/* How It Works */}
          <div id="how">
            <HowItWorks />
          </div>

          {/* Pricing Section */}
          <section id="pricing" className="pricing-section py-20">
            <div className="text-center mb-16">
              <h2 className="text-5xl font-bold mb-6 bg-gradient-to-br from-[var(--text-primary)] to-[var(--accent-pink)] bg-clip-text text-transparent">
                Simple, Transparent Pricing
              </h2>
              <p className="text-xl text-[var(--text-secondary)] max-w-[600px] mx-auto leading-relaxed">
                Choose the plan that works best for your learning journey
              </p>
            </div>
            
            <div className="pricing-disclaimer text-center mb-8">
              <p className="text-sm text-[var(--text-secondary)] font-medium bg-[var(--card-bg)] backdrop-blur-[20px] border border-[var(--card-border)] rounded-lg px-4 py-2 inline-block">
                ⚠️ Subject to change after beta launch
              </p>
            </div>
            
            <div className="pricing-cards grid grid-cols-1 md:grid-cols-2 gap-8 max-w-[800px] mx-auto">
              {/* Free Plan */}
              <div className="pricing-card bg-[var(--card-bg)] backdrop-blur-[20px] border border-[var(--card-border)] rounded-2xl p-8 text-center transition-all duration-300 relative overflow-hidden group hover:transform hover:translate-y-[-4px] hover:shadow-[0_12px_32px_rgba(0,0,0,0.08)]">
                <div className="absolute -top-1/2 -right-1/2 w-[200%] h-[200%] bg-gradient-radial from-[var(--accent-pink-soft)] to-transparent opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                
                <div className="plan-header mb-8 relative z-10">
                  <div className="plan-icon w-16 h-16 bg-[var(--accent-pink-soft)] rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">
                    🆓
                  </div>
                  <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Free</h3>
                  <div className="price text-4xl font-bold text-[var(--text-primary)] mb-2">
                    $0<span className="text-lg font-medium text-[var(--text-secondary)]">/month</span>
                  </div>
                  <p className="text-sm text-[var(--text-secondary)]">Perfect for getting started</p>
                </div>
                
                <div className="plan-features mb-8 relative z-10">
                  <ul className="space-y-3 text-left">
                    <li className="flex items-center gap-3">
                      <span className="text-green-500">✓</span>
                      <span className="text-sm text-[var(--text-secondary)]">5 videos per month</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="text-green-500">✓</span>
                      <span className="text-sm text-[var(--text-secondary)]">Basic templates</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="text-green-500">✓</span>
                      <span className="text-sm text-[var(--text-secondary)]">PDF export</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="text-green-500">✓</span>
                      <span className="text-sm text-[var(--text-secondary)]">Cloud storage</span>
                    </li>
                  </ul>
                </div>
                
                <button className="cta-btn w-full px-6 py-3 bg-[var(--card-border)] text-[var(--text-primary)] border border-[var(--card-border)] rounded-[50px] font-semibold transition-all duration-300 relative z-10 hover:bg-[var(--accent-pink-soft)] hover:border-[var(--accent-pink)]">
                  Get Started Free
                </button>
              </div>

              {/* Pro Plan */}
              <div className="pricing-card bg-gradient-to-br from-[var(--accent-pink)] to-[#FF8FB3] rounded-2xl p-8 text-center transition-all duration-300 relative overflow-hidden group hover:transform hover:translate-y-[-4px] hover:shadow-[0_12px_32px_rgba(255,107,157,0.25)] shadow-[0_8px_24px_rgba(255,107,157,0.15)]">
                <div className="absolute top-0 right-6 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-b-lg text-xs font-semibold text-white">
                  POPULAR
                </div>
                
                <div className="plan-header mb-8">
                  <div className="plan-icon w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">
                    ⭐
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Pro</h3>
                  <div className="price text-4xl font-bold text-white mb-2">
                    $9<span className="text-lg font-medium text-white/80">/month</span>
                  </div>
                  <p className="text-sm text-white/80">For serious learners</p>
                </div>
                
                <div className="plan-features mb-8">
                  <ul className="space-y-3 text-left">
                    <li className="flex items-center gap-3">
                      <span className="text-white">✓</span>
                      <span className="text-sm text-white/90">Unlimited videos</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="text-white">✓</span>
                      <span className="text-sm text-white/90">All premium templates</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="text-white">✓</span>
                      <span className="text-sm text-white/90">AI chat with videos (Coming Soon)</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="text-white">✓</span>
                      <span className="text-sm text-white/90">Advanced exports</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="text-white">✓</span>
                      <span className="text-sm text-white/90">Priority processing</span>
                    </li>
                  </ul>
                </div>
                
                <button className="cta-btn w-full px-6 py-3 bg-white text-[var(--accent-pink)] border-none rounded-[50px] font-semibold transition-all duration-300 hover:transform hover:translate-y-[-2px] hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)]">
                  Upgrade to Pro
                </button>
              </div>
            </div>
          </section>

          {/* About Section */}
          <section id="about" className="about-section py-20">
            <div className="text-center mb-16">
              <h2 className="text-5xl font-bold mb-6 bg-gradient-to-br from-[var(--text-primary)] to-[var(--accent-pink)] bg-clip-text text-transparent">
                Meet Your AI Study Buddy
              </h2>
              <p className="text-xl text-[var(--text-secondary)] max-w-[600px] mx-auto leading-relaxed">
                Kyoto Scribe combines the power of advanced AI technology with the friendly spirit of a Shiba Inu companion
              </p>
            </div>
            
            <div className="about-content grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* About Text */}
              <div className="about-text">
                <div className="story-section mb-8">
                  <h3 className="text-2xl font-semibold mb-4 text-[var(--text-primary)]">Our Story</h3>
                  <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
                    Born from the need to make learning more efficient and enjoyable, Kyoto Scribe was created by developers who understand the struggle of processing hours of educational content.
                  </p>
                  <p className="text-[var(--text-secondary)] leading-relaxed">
                    Just like a loyal Shiba Inu companion, Kyoto is always ready to help, never judges your learning pace, and makes even the most complex topics approachable with a friendly wag of the tail.
                  </p>
                </div>
                
                <div className="mission-section mb-8">
                  <h3 className="text-2xl font-semibold mb-4 text-[var(--text-primary)]">Our Mission</h3>
                  <p className="text-[var(--text-secondary)] leading-relaxed">
                    To democratize learning by making educational content more accessible, digestible, and actionable. We believe everyone deserves a study buddy that's available 24/7, infinitely patient, and incredibly smart.
                  </p>
                </div>
                
              </div>
              
              {/* About Visual */}
              <div className="about-visual text-center">
                <div className="shiba-character bg-gradient-to-br from-[var(--card-bg)] to-[var(--accent-pink-soft)] backdrop-blur-[20px] border border-[var(--card-border)] rounded-3xl p-12 mb-6 relative overflow-hidden group hover:transform hover:translate-y-[-4px] transition-all duration-300">
                  <div className="absolute -top-1/2 -right-1/2 w-[200%] h-[200%] bg-gradient-radial from-[var(--accent-pink-soft)] to-transparent opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
                  
                  <div className="shiba-icon text-8xl mb-6 relative z-10 animate-bounce">
                    🐕
                  </div>
                  <h4 className="text-2xl font-bold text-[var(--text-primary)] mb-3 relative z-10">
                    Hi, I'm Kyoto!
                  </h4>
                  <p className="text-[var(--text-secondary)] relative z-10">
                    Your friendly AI companion ready to turn any YouTube video into beautiful, organized notes. 
                    I'm patient, thorough, and always excited to help you learn! Woof! 🎾
                  </p>
                </div>
                
                <div className="benefits grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div className="benefit bg-[var(--card-bg)] backdrop-blur-[20px] border border-[var(--card-border)] rounded-xl p-4">
                    <div className="benefit-icon text-2xl mb-2">⚡</div>
                    <div className="benefit-label text-sm font-semibold text-[var(--text-primary)] mb-1">Lightning Fast</div>
                    <div className="benefit-desc text-xs text-[var(--text-secondary)]">Quick processing</div>
                  </div>
                  <div className="benefit bg-[var(--card-bg)] backdrop-blur-[20px] border border-[var(--card-border)] rounded-xl p-4">
                    <div className="benefit-icon text-2xl mb-2">🎯</div>
                    <div className="benefit-label text-sm font-semibold text-[var(--text-primary)] mb-1">Accurate</div>
                    <div className="benefit-desc text-xs text-[var(--text-secondary)]">Precise extraction</div>
                  </div>
                  <div className="benefit bg-[var(--card-bg)] backdrop-blur-[20px] border border-[var(--card-border)] rounded-xl p-4">
                    <div className="benefit-icon text-2xl mb-2">📚</div>
                    <div className="benefit-label text-sm font-semibold text-[var(--text-primary)] mb-1">Comprehensive</div>
                    <div className="benefit-desc text-xs text-[var(--text-secondary)]">Detailed notes</div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
        
        {/* Footer */}
        <Footer />
      </div>
      
      {/* Video Upload Processor Modal */}
      {showProcessor && videoInfo?.isValid && (
        <VideoUploadProcessor
          videoUrl={videoUrl}
          selectedTemplate={selectedTemplate}
          onProcessingComplete={() => {}}
          onClose={() => setShowProcessor(false)}
        />
      )}
    </main>
  );
}