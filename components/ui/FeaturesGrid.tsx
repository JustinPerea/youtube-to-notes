'use client';

import React from 'react';

export function FeaturesGrid() {
  const features = [
    {
      icon: '⚡',
      title: 'Lightning Fast',
      description: 'Get comprehensive notes from YouTube videos with advanced AI processing'
    },
    {
      icon: '🎯',
      title: 'Multiple Formats',
      description: 'Choose from summaries, detailed notes, presentation slides, and many more formats coming soon to match your learning style'
    },
    {
      icon: '📄',
      title: 'PDF Export',
      description: 'Download your notes as beautifully formatted PDFs for offline access'
    },
    {
      icon: '🔒',
      title: 'Secure & Private',
      description: 'Your notes are encrypted and only accessible to you'
    },
    {
      icon: '☁️',
      title: 'Cloud Storage',
      description: 'Access your notes from anywhere with automatic cloud sync'
    },
    {
      icon: '🤖',
      title: 'AI Chat (Coming Soon)',
      description: 'Ask questions about your videos with our intelligent chatbot - feature in development'
    }
  ];

  return (
    <div className="features grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 my-20">
      {features.map((feature, index) => (
        <div
          key={index}
          className="feature-card bg-[var(--card-bg)] backdrop-blur-[20px] border border-[var(--card-border)] rounded-2xl p-8 text-center transition-all duration-300 relative overflow-hidden group hover:transform hover:translate-y-[-4px] hover:shadow-[0_12px_32px_rgba(0,0,0,0.08)]"
        >
          {/* Hover effect background */}
          <div className="absolute -top-1/2 -right-1/2 w-[200%] h-[200%] bg-gradient-radial from-[var(--accent-pink-soft)] to-transparent opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
          
          <div className="feature-icon w-16 h-16 bg-[var(--accent-pink-soft)] rounded-2xl flex items-center justify-center text-3xl mx-auto mb-5 relative z-10">
            {feature.icon}
          </div>
          <h3 className="feature-title text-xl font-semibold mb-3 text-[var(--text-primary)] relative z-10">
            {feature.title}
          </h3>
          <p className="feature-description text-sm text-[var(--text-secondary)] leading-relaxed relative z-10">
            {feature.description}
          </p>
        </div>
      ))}
    </div>
  );
}