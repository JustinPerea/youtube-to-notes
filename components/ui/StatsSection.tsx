'use client';

import React from 'react';

export function StatsSection() {
  const benefits = [
    { icon: '⚡', title: 'Lightning Fast', description: 'Quick processing for any video length' },
    { icon: '🎯', title: 'Accurate', description: 'Precise content extraction and summarization' },
    { icon: '📚', title: 'Comprehensive', description: 'Detailed notes with key insights' },
    { icon: '🎨', title: 'Flexible', description: 'Multiple export formats available' }
  ];

  return (
    <div className="benefits bg-[var(--card-bg)] backdrop-blur-[20px] border border-[var(--card-border)] rounded-[20px] p-12 my-20 grid grid-cols-2 md:grid-cols-4 gap-10 text-center shadow-[var(--card-shadow)]">
      {benefits.map((benefit, index) => (
        <div key={index}>
          <div className="benefit-icon text-4xl mb-4">
            {benefit.icon}
          </div>
          <div className="benefit-title text-lg font-bold bg-gradient-to-br from-[var(--accent-pink)] to-[#FF8FB3] bg-clip-text text-transparent mb-2">
            {benefit.title}
          </div>
          <div className="benefit-description text-sm text-[var(--text-secondary)] font-medium">
            {benefit.description}
          </div>
        </div>
      ))}
    </div>
  );
}