'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession, signIn, signOut } from 'next-auth/react';
import UserProfile from './UserProfile';
import { ThemeToggle } from './ui/ThemeToggle';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Safe session handling to prevent destructuring errors
  let session: any = null;
  let status: string = 'loading';
  
  try {
    const sessionData = useSession();
    session = sessionData?.data || null;
    status = sessionData?.status || 'loading';
  } catch (error) {
    console.warn('Session error in Header:', error);
    session = null;
    status = 'unauthenticated';
  }


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
            <div className="logo-container w-9 h-9 rounded-[10px] shadow-[0_2px_8px_rgba(255,107,157,0.2)]">
              <img
                src="/images/logos/main-logo.png"
                alt="Kyoto Scribe Logo"
                className="w-full h-full object-cover rounded-[10px]"
              />
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
            {!session && (
              <>
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
              </>
            )}
            <Link href="/about" className="nav-link text-[var(--text-secondary)] text-sm font-medium transition-colors duration-300 hover:text-[var(--accent-pink)]">
              About
            </Link>
            <Link href="/blog" className="nav-link text-[var(--text-secondary)] text-sm font-medium transition-colors duration-300 hover:text-[var(--accent-pink)]">
              Blog
            </Link>
            {session ? (
              <UserProfile />
            ) : (
              <button 
                onClick={() => signIn('google')}
                className="sign-in-btn px-6 py-2 bg-[var(--accent-pink)] text-white border-none rounded-[50px] font-semibold cursor-pointer transition-all duration-300 hover:transform hover:translate-y-[-2px] hover:shadow-[0_4px_12px_rgba(255,107,157,0.3)] shadow-[0_2px_8px_rgba(255,107,157,0.2)]"
              >
                Get Started
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
              {!session && (
                <>
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
                </>
              )}
              <Link 
                href="/about" 
                className="text-[var(--text-secondary)] hover:text-[var(--accent-pink)] transition-colors font-medium"
                onClick={closeMobileMenu}
              >
                About
              </Link>
              <Link 
                href="/blog" 
                className="text-[var(--text-secondary)] hover:text-[var(--accent-pink)] transition-colors font-medium"
                onClick={closeMobileMenu}
              >
                Blog
              </Link>
              {session ? (
                <div className="space-y-3">
                  {/* User Info Section */}
                  <div className="flex items-center gap-3 p-3 bg-[var(--card-bg)] rounded-lg border border-[var(--card-border)]">
                    {session.user?.image ? (
                      <img
                        src={session.user.image}
                        alt={session.user.name || 'User'}
                        className="w-10 h-10 rounded-full border-2 border-[var(--accent-pink-soft)]"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-[var(--accent-pink)] rounded-full flex items-center justify-center text-white font-semibold">
                        {session.user?.name?.charAt(0) || 'U'}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-[var(--text-primary)] font-medium text-sm truncate">
                        {session.user?.name || 'User'}
                      </p>
                      <p className="text-[var(--text-secondary)] text-xs truncate">
                        {session.user?.email}
                      </p>
                    </div>
                  </div>

                  {/* Mobile Menu Items */}
                  <div className="space-y-2">
                    <Link
                      href="/profile"
                      onClick={closeMobileMenu}
                      className="flex items-center gap-3 p-3 text-[var(--text-secondary)] hover:text-[var(--accent-pink)] hover:bg-[var(--accent-pink-soft)] transition-all duration-200 rounded-lg"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Profile & Settings
                    </Link>

                    <Link
                      href="/process"
                      onClick={closeMobileMenu}
                      className="flex items-center gap-3 p-3 text-[var(--text-secondary)] hover:text-[var(--accent-pink)] hover:bg-[var(--accent-pink-soft)] transition-all duration-200 rounded-lg"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Process Video
                    </Link>

                    <Link
                      href="/notes"
                      onClick={closeMobileMenu}
                      className="flex items-center gap-3 p-3 text-[var(--text-secondary)] hover:text-[var(--accent-pink)] hover:bg-[var(--accent-pink-soft)] transition-all duration-200 rounded-lg"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      My Notes
                    </Link>

                    <div className="border-t border-[var(--card-border)] my-2"></div>

                    {/* Theme Toggle */}
                    <div className="flex items-center justify-between p-3">
                      <span className="text-[var(--text-secondary)] text-sm">Theme</span>
                      <div className="scale-75">
                        <ThemeToggle />
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        signOut();
                        closeMobileMenu();
                      }}
                      className="flex items-center gap-3 p-3 text-[var(--text-secondary)] hover:text-red-500 hover:bg-red-50 transition-all duration-200 rounded-lg w-full text-left"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign Out
                    </button>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={() => {
                    signIn('google');
                    closeMobileMenu();
                  }}
                  className="bg-[var(--accent-pink)] text-white border-none rounded-xl px-4 py-2 font-semibold transition-all duration-300"
                >
                  Get Started
                </button>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
