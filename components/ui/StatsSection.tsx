'use client';

import React from 'react';

export function StatsSection() {
  const stats = [
    { number: '10K+', label: 'Videos Processed' },
    { number: '95%', label: 'Accuracy Rate' },
    { number: '30s', label: 'Average Processing' },
    { number: '4.9★', label: 'User Rating' }
  ];

  return (
    <div className="stats bg-[var(--card-bg)] backdrop-blur-[20px] border border-[var(--card-border)] rounded-[20px] p-12 my-20 grid grid-cols-2 md:grid-cols-4 gap-10 text-center shadow-[var(--card-shadow)]">
      {stats.map((stat, index) => (
        <div key={index}>
          <div className="stat-number text-4xl font-extrabold bg-gradient-to-br from-[var(--accent-pink)] to-[#FF8FB3] bg-clip-text text-transparent mb-2">
            {stat.number}
          </div>
          <div className="stat-label text-sm text-[var(--text-secondary)] font-medium">
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  );
}