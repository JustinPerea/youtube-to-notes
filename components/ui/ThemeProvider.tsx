'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Load theme from localStorage on mount
    const savedTheme = localStorage.getItem('theme') as Theme || 'light';
    setTheme(savedTheme);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      // Update document attributes and localStorage
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('theme', theme);
      
      // Update CSS variables
      if (theme === 'dark') {
        document.documentElement.style.setProperty('--bg-primary', '#0a0a0a');
        document.documentElement.style.setProperty('--card-bg', 'rgba(255, 255, 255, 0.05)');
        document.documentElement.style.setProperty('--card-border', 'rgba(255, 255, 255, 0.1)');
        document.documentElement.style.setProperty('--card-shadow', '0 2px 12px rgba(0, 0, 0, 0.3)');
        document.documentElement.style.setProperty('--text-primary', '#f5f5f5');
        document.documentElement.style.setProperty('--text-secondary', '#b0b0b0');
        document.documentElement.style.setProperty('--text-muted', '#808080');
        document.documentElement.style.setProperty('--accent-pink', '#FF8FB3');
        document.documentElement.style.setProperty('--accent-pink-soft', 'rgba(255, 143, 179, 0.1)');
        document.documentElement.style.setProperty('--accent-lavender', 'rgba(230, 230, 250, 0.1)');
        document.documentElement.style.setProperty('--accent-coral', 'rgba(255, 224, 224, 0.1)');
        document.documentElement.style.setProperty('--navbar-bg', 'rgba(10, 10, 10, 0.95)');
        // Dark mode orb colors
        document.documentElement.style.setProperty('--orb-1', 'rgba(255, 107, 157, 0.15)');
        document.documentElement.style.setProperty('--orb-2', 'rgba(147, 112, 219, 0.15)');
        document.documentElement.style.setProperty('--orb-3', 'rgba(78, 205, 196, 0.12)');
        document.documentElement.style.setProperty('--orb-4', 'rgba(255, 179, 71, 0.1)');
        document.documentElement.style.setProperty('--orb-5', 'rgba(162, 155, 254, 0.12)');
        document.documentElement.style.setProperty('--orb-opacity', '0.6');
      } else {
        document.documentElement.style.setProperty('--bg-primary', '#fafafa');
        document.documentElement.style.setProperty('--card-bg', 'rgba(255, 255, 255, 0.95)');
        document.documentElement.style.setProperty('--card-border', 'rgba(0, 0, 0, 0.06)');
        document.documentElement.style.setProperty('--card-shadow', '0 2px 12px rgba(0, 0, 0, 0.04)');
        document.documentElement.style.setProperty('--text-primary', '#1a1a1a');
        document.documentElement.style.setProperty('--text-secondary', '#4a4a4a');
        document.documentElement.style.setProperty('--text-muted', '#6a6a6a');
        document.documentElement.style.setProperty('--accent-pink', '#FF6B9D');
        document.documentElement.style.setProperty('--accent-pink-soft', '#FFE5ED');
        document.documentElement.style.setProperty('--accent-lavender', '#E6E6FA');
        document.documentElement.style.setProperty('--accent-coral', '#FFE0E0');
        document.documentElement.style.setProperty('--navbar-bg', 'rgba(255, 255, 255, 0.98)');
        // Light mode orb colors
        document.documentElement.style.setProperty('--orb-1', 'rgba(247, 202, 201, 0.3)');
        document.documentElement.style.setProperty('--orb-2', 'rgba(230, 230, 250, 0.3)');
        document.documentElement.style.setProperty('--orb-3', 'rgba(255, 182, 193, 0.25)');
        document.documentElement.style.setProperty('--orb-4', 'rgba(255, 218, 185, 0.2)');
        document.documentElement.style.setProperty('--orb-5', 'rgba(221, 160, 221, 0.2)');
        document.documentElement.style.setProperty('--orb-opacity', '0.4');
      }
    }
  }, [theme, mounted]);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    // Return a default theme context instead of throwing an error
    // Don't warn during SSR or initial hydration - this is expected behavior
    return {
      theme: 'light' as Theme,
      setTheme: (theme: Theme) => {
        // Silently handle calls when provider is not available
      },
      toggleTheme: () => {
        // Silently handle calls when provider is not available
      }
    };
  }
  return context;
}