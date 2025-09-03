'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession, signIn, signOut } from 'next-auth/react';
import UserProfile from './UserProfile';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { data: session, status } = useSession();


  // Helper function to close mobile menu
  const closeMobileMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <header className="navbar fixed top-0 left-0 right-0 z-[999] bg-[var(--navbar-bg)] backdrop-blur-[20px] border-b border-[var(--card-border)] transition-all duration-300">
      <div className="nav-container max-w-[1200px] mx-auto px-5">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="nav-logo flex items-center gap-3">
            <div className="shiba-icon w-9 h-9 bg-gradient-to-br from-[var(--accent-pink)] to-[#FF8FB3] rounded-[10px] flex items-center justify-center text-xl shadow-[0_2px_8px_rgba(255,107,157,0.2)]">
              🐕
            </div>
            <span className="text-xl font-bold text-[var(--text-primary)]">Kyoto Scribe</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="nav-links hidden md:flex items-center gap-8">
            <Link href="/" className="nav-link text-[var(--text-secondary)] text-sm font-medium transition-colors duration-300 hover:text-[var(--accent-pink)]">
              Home
            </Link>
            {session && (
              <Link href="/notes" className="nav-link text-[var(--text-secondary)] text-sm font-medium transition-colors duration-300 hover:text-[var(--accent-pink)]">
                My Notes
              </Link>
            )}
            <Link href="/roadmap" className="nav-link text-[var(--text-secondary)] text-sm font-medium transition-colors duration-300 hover:text-[var(--accent-pink)]">
              Roadmap
            </Link>
            <Link href="/features" className="nav-link text-[var(--text-secondary)] text-sm font-medium transition-colors duration-300 hover:text-[var(--accent-pink)]">
              Features
            </Link>
            <Link href="/formats" className="nav-link text-[var(--text-secondary)] text-sm font-medium transition-colors duration-300 hover:text-[var(--accent-pink)]">
              Formats
            </Link>
            <Link href="/pricing" className="nav-link text-[var(--text-secondary)] text-sm font-medium transition-colors duration-300 hover:text-[var(--accent-pink)]">
              Pricing
            </Link>
            <Link href="/about" className="nav-link text-[var(--text-secondary)] text-sm font-medium transition-colors duration-300 hover:text-[var(--accent-pink)]">
              About
            </Link>
            {session ? (
              <UserProfile />
            ) : (
              <button 
                onClick={() => signIn('google')}
                className="sign-in-btn px-6 py-2 bg-[var(--accent-pink)] text-white border-none rounded-[50px] font-semibold cursor-pointer transition-all duration-300 hover:transform hover:translate-y-[-2px] hover:shadow-[0_4px_12px_rgba(255,107,157,0.3)] shadow-[0_2px_8px_rgba(255,107,157,0.2)]"
              >
                Sign In
              </button>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-[var(--text-primary)]"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden bg-[var(--card-bg)] backdrop-blur-[20px] border border-[var(--card-border)] mt-4 p-4 rounded-lg">
            <nav className="flex flex-col space-y-4">
              <Link 
                href="/" 
                className="text-[var(--text-secondary)] hover:text-[var(--accent-pink)] transition-colors font-medium"
                onClick={closeMobileMenu}
              >
                Home
              </Link>
              {session && (
                <Link 
                  href="/notes" 
                  className="text-[var(--text-secondary)] hover:text-[var(--accent-pink)] transition-colors font-medium"
                  onClick={closeMobileMenu}
                >
                  My Notes
                </Link>
              )}
              <Link 
                href="/roadmap" 
                className="text-[var(--text-secondary)] hover:text-[var(--accent-pink)] transition-colors font-medium"
                onClick={closeMobileMenu}
              >
                Roadmap
              </Link>
              <Link 
                href="/features" 
                className="text-[var(--text-secondary)] hover:text-[var(--accent-pink)] transition-colors font-medium"
                onClick={closeMobileMenu}
              >
                Features
              </Link>
              <Link 
                href="/formats" 
                className="text-[var(--text-secondary)] hover:text-[var(--accent-pink)] transition-colors font-medium"
                onClick={closeMobileMenu}
              >
                Formats
              </Link>
              <Link 
                href="/pricing" 
                className="text-[var(--text-secondary)] hover:text-[var(--accent-pink)] transition-colors font-medium"
                onClick={closeMobileMenu}
              >
                Pricing
              </Link>
              <Link 
                href="/about" 
                className="text-[var(--text-secondary)] hover:text-[var(--accent-pink)] transition-colors font-medium"
                onClick={closeMobileMenu}
              >
                About
              </Link>
              {session ? (
                <div className="flex items-center gap-3">
                  <span className="text-[var(--text-primary)] text-sm font-medium">{session.user?.name}</span>
                  <button 
                    onClick={() => {
                      signOut();
                      closeMobileMenu();
                    }}
                    className="bg-[var(--accent-pink)] text-white border-none rounded-xl px-4 py-2 font-semibold transition-all duration-300"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => {
                    signIn('google');
                    closeMobileMenu();
                  }}
                  className="bg-[var(--accent-pink)] text-white border-none rounded-xl px-4 py-2 font-semibold transition-all duration-300"
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
