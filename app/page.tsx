'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { VideoUpload } from '../components/VideoUpload';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { OrbBackground } from '../components/ui/OrbBackground';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { FormatCards } from '../components/ui/FormatCards';
import { StatsSection } from '../components/ui/StatsSection';
import { FeaturesGrid } from '../components/ui/FeaturesGrid';
import { HowItWorks } from '../components/ui/HowItWorks';
import { extractVideoInfo, isValidYouTubeUrl } from '../lib/utils/youtube';
import { VideoPreview } from '../components/VideoPreview';
import { VideoUploadProcessor } from '../components/VideoUploadProcessor';
import UserProfile from '../components/UserProfile';

export default function Home() {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('basic-summary');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoInfo, setVideoInfo] = useState<ReturnType<typeof extractVideoInfo> | null>(null);
  const [showProcessor, setShowProcessor] = useState(false);
  const { data: session, status } = useSession();

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setVideoUrl(url);
    
    if (url.trim()) {
      const info = extractVideoInfo(url.trim());
      setVideoInfo(info.isValid ? info : null);
    } else {
      setVideoInfo(null);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && videoInfo?.isValid) {
      // Scroll to the video upload section
      document.getElementById('video-upload')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleGenerateNotes = () => {
    if (videoInfo?.isValid && selectedTemplate) {
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
        <Header />
        
        {/* Main Container */}
        <div className="container max-w-[1200px] mx-auto pt-[100px] pb-10 px-5">
          {/* Hero Section */}
          <section className="hero text-center py-20">
            <div className="hero-badge inline-block px-4 py-1.5 bg-[var(--accent-pink-soft)] text-[var(--accent-pink)] rounded-[50px] text-xs font-semibold uppercase tracking-wide mb-5">
              AI-Powered by Gemini
            </div>
            <h1 className="hero-title text-6xl font-extrabold leading-tight mb-6 bg-gradient-to-br from-[var(--text-primary)] to-[var(--accent-pink)] bg-clip-text text-transparent">
              Transform YouTube Videos<br />Into Smart Notes
            </h1>
            <p className="hero-subtitle text-[22px] text-[var(--text-secondary)] mb-12 max-w-[600px] mx-auto leading-relaxed">
              Let Kyoto, your AI study buddy, watch videos and create comprehensive notes while you focus on what matters most
            </p>
            
            {/* URL Input */}
            <div className="url-section max-w-[700px] mx-auto mb-10">
              <div className="url-input-wrapper bg-[var(--card-bg)] backdrop-blur-[20px] border-2 border-[var(--card-border)] rounded-2xl p-2 transition-all duration-300 relative hover:border-[var(--accent-pink)] hover:shadow-[0_4px_20px_rgba(255,107,157,0.15)] hover:transform hover:translate-y-[-2px] focus-within:border-[var(--accent-pink)] focus-within:shadow-[0_4px_20px_rgba(255,107,157,0.15)] focus-within:transform focus-within:translate-y-[-2px]">
                <input
                  type="text"
                  value={videoUrl}
                  onChange={handleUrlChange}
                  onKeyPress={handleKeyPress}
                  placeholder="Paste any YouTube URL here and press Enter..."
                  className="url-input w-full px-6 py-5 bg-transparent border-none text-[var(--text-primary)] text-base outline-none font-medium placeholder:text-[var(--text-muted)]"
                />
              </div>
            </div>
            
            {/* Video Preview */}
            {videoInfo && videoInfo.isValid && (
              <div className="mb-10">
                <VideoPreview 
                  videoInfo={videoInfo} 
                  onClear={() => {
                    setVideoUrl('');
                    setVideoInfo(null);
                  }} 
                />
              </div>
            )}
            
            {/* Format Selection Cards */}
            {videoInfo && videoInfo.isValid && (
              <FormatCards 
                selectedTemplate={selectedTemplate}
                onTemplateChange={setSelectedTemplate}
              />
            )}
            
            {/* Generate Button */}
            {videoInfo && videoInfo.isValid && (
              <div className="generate-btn-wrapper text-center mb-15">
                <button
                  onClick={handleGenerateNotes}
                  className="generate-btn px-14 py-5 bg-gradient-to-br from-[var(--accent-pink)] to-[#FF5A8C] text-white border-none rounded-[50px] text-lg font-semibold cursor-pointer transition-all duration-300 shadow-[0_4px_20px_rgba(255,107,157,0.25)] relative overflow-hidden hover:transform hover:translate-y-[-3px] hover:shadow-[0_6px_30px_rgba(255,107,157,0.35)] group"
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
          
          {/* Stats Section */}
          <StatsSection />
          
          {/* Features Grid */}
          <div id="features">
            <FeaturesGrid />
          </div>
          
          {/* How It Works */}
          <div id="how">
            <HowItWorks />
          </div>
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