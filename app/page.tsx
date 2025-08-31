'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { VideoUpload } from '../components/VideoUpload';
import { TemplateSelector } from '../components/TemplateSelector';
import { FeatureSection } from '../components/FeatureSection';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import UserProfile from '../components/UserProfile';

export default function Home() {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('basic-summary');
  const { data: session, status } = useSession();

  return (
    <main className="min-h-screen">
      {/* Header */}
      <Header />
      

      
      {/* Hero Section */}
      <section className="relative px-4 py-20 lg:py-32">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-6xl font-bold text-high-contrast mb-6 animate-fadeInUp">
              Transform YouTube Videos Into
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent block" style={{textShadow: 'none'}}>
                Smart Content
              </span>
            </h1>
            <p className="text-xl text-gray-100 max-w-3xl mx-auto mb-8 animate-fadeInUp" style={{animationDelay: '0.2s'}}>
              Use AI to convert any YouTube video into notes, study guides, presentations, and tutorials instantly.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fadeInUp" style={{animationDelay: '0.4s'}}>
              <button 
                onClick={() => document.getElementById('video-upload')?.scrollIntoView({ behavior: 'smooth' })}
                className="glass-button px-8 py-4 text-white font-semibold text-lg hover:shadow-lg hover:scale-105 transition-all duration-300"
              >
                Start Converting
              </button>
              <button 
                onClick={() => document.getElementById('video-upload')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-gradient-to-r from-purple-500/80 to-pink-500/80 backdrop-blur-lg border border-white/20 rounded-xl px-8 py-4 text-white font-semibold text-lg transition-all duration-300 hover:shadow-lg hover:scale-105"
              >
                Try it Now
              </button>
            </div>
          </div>
          
          {/* Video Upload Section */}
          <div id="video-upload" className="glass-panel rounded-2xl p-8 mb-8 animate-fadeInUp" style={{animationDelay: '0.6s'}}>
            <VideoUpload 
              selectedTemplate={selectedTemplate} 
              onTemplateChange={setSelectedTemplate}
            />
          </div>
          
          {/* Template Selection */}
          <div className="glass-panel rounded-2xl p-8 mb-16 animate-fadeInUp" style={{animationDelay: '0.8s'}}>
            <TemplateSelector 
              selectedTemplate={selectedTemplate}
              onTemplateChange={setSelectedTemplate}
            />
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <FeatureSection />
      
      {/* Footer */}
      <Footer />
    </main>
  );
}
