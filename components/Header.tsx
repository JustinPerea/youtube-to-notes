'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession, signIn, signOut } from 'next-auth/react';
import UserProfile from './UserProfile';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { data: session, status } = useSession();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-panel-dark backdrop-blur-lg border-b border-white/20 shadow-lg">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-400 rounded-lg flex items-center justify-center text-lg">
              🐕
            </div>
            <span className="text-high-contrast font-bold text-xl">Kyoto Scribe</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-gray-100 hover:text-high-contrast transition-colors font-medium">
              Home
            </Link>
            {session && (
              <Link href="/notes" className="text-gray-100 hover:text-high-contrast transition-colors font-medium">
                My Notes
              </Link>
            )}
            <Link href="/roadmap" className="text-gray-100 hover:text-high-contrast transition-colors font-medium">
              Roadmap
            </Link>
            <a href="#features" className="text-gray-100 hover:text-high-contrast transition-colors font-medium">
              Features
            </a>
            <a href="#pricing" className="text-gray-100 hover:text-high-contrast transition-colors font-medium">
              Pricing
            </a>
            <a href="#about" className="text-gray-100 hover:text-high-contrast transition-colors font-medium">
              About
            </a>
            {session ? (
              <UserProfile />
            ) : (
              <button 
                onClick={() => signIn('google')}
                className="glass-button px-4 py-2 text-high-contrast font-semibold hover:bg-white/10 transition-colors"
              >
                Sign In
              </button>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-high-contrast"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden glass-panel-dark mt-4 p-4 rounded-lg">
            <nav className="flex flex-col space-y-4">
              <Link href="/" className="text-gray-100 hover:text-high-contrast transition-colors font-medium">
                Home
              </Link>
              {session && (
                <Link href="/notes" className="text-gray-100 hover:text-high-contrast transition-colors font-medium">
                  My Notes
                </Link>
              )}
              <Link href="/roadmap" className="text-gray-100 hover:text-high-contrast transition-colors font-medium">
                Roadmap
              </Link>
              <a href="#features" className="text-gray-100 hover:text-high-contrast transition-colors font-medium">
                Features
              </a>
              <a href="#pricing" className="text-gray-100 hover:text-high-contrast transition-colors font-medium">
                Pricing
              </a>
              <a href="#about" className="text-gray-100 hover:text-high-contrast transition-colors font-medium">
                About
              </a>
              {session ? (
                <div className="flex items-center gap-3">
                  <span className="text-high-contrast text-sm font-medium">{session.user?.name}</span>
                  <button 
                    onClick={() => signOut()}
                    className="bg-gradient-to-r from-purple-500/80 to-pink-500/80 backdrop-blur-lg border border-white/20 rounded-xl px-4 py-2 text-white font-semibold transition-all duration-300"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => signIn('google')}
                  className="bg-gradient-to-r from-purple-500/80 to-pink-500/80 backdrop-blur-lg border border-white/20 rounded-xl px-4 py-2 text-white font-semibold transition-all duration-300"
                >
                  Sign In
                </button>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
