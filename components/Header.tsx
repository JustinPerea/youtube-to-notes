'use client';

import { useState } from 'react';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/20 backdrop-blur-lg border-b border-white/10">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-400 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">YN</span>
            </div>
            <span className="text-white font-bold text-xl">YouTube to Notes</span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-gray-300 hover:text-white transition-colors">
              Features
            </a>
            <a href="#pricing" className="text-gray-300 hover:text-white transition-colors">
              Pricing
            </a>
            <a href="#about" className="text-gray-300 hover:text-white transition-colors">
              About
            </a>
            <button className="glass-button px-4 py-2 text-white font-semibold opacity-50 cursor-not-allowed relative" disabled>
              Sign In
              <span className="absolute -top-1 -right-1 bg-yellow-500 text-black text-xs px-1 py-0.5 rounded-full text-xs">SOON</span>
            </button>
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-white"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden glass-dark mt-4 p-4 rounded-lg">
            <nav className="flex flex-col space-y-4">
              <a href="#features" className="text-gray-300 hover:text-white transition-colors">
                Features
              </a>
              <a href="#pricing" className="text-gray-300 hover:text-white transition-colors">
                Pricing
              </a>
              <a href="#about" className="text-gray-300 hover:text-white transition-colors">
                About
              </a>
              <button className="bg-gradient-to-r from-purple-500/80 to-pink-500/80 backdrop-blur-lg border border-white/20 rounded-xl px-4 py-2 text-white font-semibold transition-all duration-300 opacity-50 cursor-not-allowed relative" disabled>
                Sign In
                <span className="absolute -top-1 -right-1 bg-yellow-500 text-black text-xs px-1 py-0.5 rounded-full text-xs">SOON</span>
              </button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
