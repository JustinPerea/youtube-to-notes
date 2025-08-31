'use client';

import React from 'react';
import { useTheme } from './ThemeProvider';

export function ThemeToggle() {
  // Add try-catch to handle cases where ThemeProvider is not available yet
  try {
    const { theme, setTheme } = useTheme();

    return (
      <div className="theme-toggle fixed top-20 right-5 z-[1000] bg-[var(--card-bg)] backdrop-blur-[20px] border border-[var(--card-border)] rounded-[50px] p-1.5 flex gap-1 shadow-[var(--card-shadow)]">
        <button
          onClick={() => setTheme('light')}
          className={`theme-btn px-4 py-2 border-none bg-transparent text-[var(--text-secondary)] rounded-[50px] cursor-pointer transition-all duration-300 text-sm flex items-center gap-1.5 ${
            theme === 'light' ? 'bg-[var(--accent-pink)] text-white active' : ''
          }`}
        >
          <span>☀️</span>
          <span>Light</span>
        </button>
        <button
          onClick={() => setTheme('dark')}
          className={`theme-btn px-4 py-2 border-none bg-transparent text-[var(--text-secondary)] rounded-[50px] cursor-pointer transition-all duration-300 text-sm flex items-center gap-1.5 ${
            theme === 'dark' ? 'bg-[var(--accent-pink)] text-white active' : ''
          }`}
        >
          <span>🌙</span>
          <span>Dark</span>
        </button>
      </div>
    );
  } catch (error) {
    // If ThemeProvider is not available, don't render the toggle
    return null;
  }
}

