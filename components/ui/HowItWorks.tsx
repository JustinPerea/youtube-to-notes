'use client';

import React from 'react';

export function HowItWorks() {
  const steps = [
    {
      number: '📺',
      title: 'Paste Video URL',
      description: 'Simply copy and paste any YouTube video link into our platform'
    },
    {
      number: '🎯',
      title: 'Choose Format',
      description: 'Select how detailed you want your notes to be based on your needs'
    },
    {
      number: '✨',
      title: 'Get Smart Notes',
      description: 'Our AI analyzes the video and generates perfect notes in seconds'
    }
  ];

  return (
    <section className="how-it-works my-25">
      <div className="section-header text-center mb-15">
        <h2 className="section-title text-5xl font-bold mb-4 text-[var(--text-primary)]">
          How Kyoto Works
        </h2>
        <p className="section-subtitle text-lg text-[var(--text-secondary)]">
          Three simple steps to transform any video into organized notes
        </p>
      </div>
      
      <div className="steps grid grid-cols-1 md:grid-cols-3 gap-8 relative">
        {/* Connection line for desktop */}
        <div className="hidden md:block absolute top-15 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-[var(--card-border)] via-[var(--accent-pink-soft)] to-[var(--card-border)] z-0"></div>
        
        {steps.map((step, index) => (
          <div key={index} className="step text-center relative z-10">
            <div className="step-number w-30 h-30 bg-[var(--card-bg)] border-2 border-[var(--card-border)] rounded-full flex items-center justify-center text-5xl mx-auto mb-6 relative transition-all duration-300 backdrop-blur-[20px] hover:transform hover:scale-110 hover:border-[var(--accent-pink)] hover:shadow-[0_8px_24px_rgba(255,107,157,0.2)]">
              {step.number}
            </div>
            <h3 className="step-title text-xl font-semibold mb-3 text-[var(--text-primary)]">
              {step.title}
            </h3>
            <p className="step-description text-sm text-[var(--text-secondary)] max-w-[250px] mx-auto leading-relaxed">
              {step.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}