'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';

export default function UserProfile() {
  // Safe session handling to prevent destructuring errors
  let session: any = null;
  let status: string = 'loading';
  
  try {
    const sessionData = useSession();
    session = sessionData?.data || null;
    status = sessionData?.status || 'loading';
  } catch (error) {
    console.warn('Session error in UserProfile:', error);
    session = null;
    status = 'unauthenticated';
  }
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  if (status === 'loading') {
    return (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-gray-600 rounded-full animate-pulse"></div>
        <div className="w-20 h-4 bg-gray-600 rounded animate-pulse"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const handleSignOut = () => {
    setIsDropdownOpen(false);
    signOut({ callbackUrl: '/' });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* User Profile Button */}
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center gap-2 p-2 rounded-lg hover:bg-[var(--card-bg)] hover:backdrop-blur-[20px] transition-all duration-300 border border-transparent hover:border-[var(--card-border)]"
      >
        {session.user?.image ? (
          <Image
            src={session.user.image}
            alt={session.user.name || 'User'}
            width={32}
            height={32}
            className="rounded-full border-2 border-[var(--accent-pink-soft)]"
          />
        ) : (
          <div className="w-8 h-8 bg-[var(--accent-pink)] rounded-full flex items-center justify-center text-white font-semibold text-sm">
            {session.user?.name?.charAt(0) || 'U'}
          </div>
        )}
        <span className="text-[var(--text-primary)] text-sm font-medium hidden sm:block max-w-[120px] truncate">
          {session.user?.name}
        </span>
        <svg 
          className={`w-4 h-4 text-[var(--text-secondary)] transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-[var(--card-bg)] backdrop-blur-[20px] border border-[var(--card-border)] rounded-2xl shadow-[var(--card-shadow)] py-2 z-[1000]">
          {/* User Info */}
          <div className="px-4 py-3 border-b border-[var(--card-border)]">
            <div className="flex items-center gap-3">
              {session.user?.image ? (
                <Image
                  src={session.user.image}
                  alt={session.user.name || 'User'}
                  width={40}
                  height={40}
                  className="rounded-full"
                />
              ) : (
                <div className="w-10 h-10 bg-[var(--accent-pink)] rounded-full flex items-center justify-center text-white font-semibold">
                  {session.user?.name?.charAt(0) || 'U'}
                </div>
              )}
              <div>
                <p className="text-[var(--text-primary)] font-medium text-sm truncate max-w-[160px]">
                  {session.user?.name || 'User'}
                </p>
                <p className="text-[var(--text-secondary)] text-xs truncate max-w-[160px]">
                  {session.user?.email}
                </p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            <Link
              href="/profile"
              onClick={() => setIsDropdownOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-[var(--text-secondary)] hover:text-[var(--accent-pink)] hover:bg-[var(--accent-pink-soft)] transition-all duration-200 text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Profile & Settings
            </Link>

            <Link
              href="/process"
              onClick={() => setIsDropdownOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-[var(--text-secondary)] hover:text-[var(--accent-pink)] hover:bg-[var(--accent-pink-soft)] transition-all duration-200 text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Process Video
            </Link>

            <Link
              href="/notes"
              onClick={() => setIsDropdownOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-[var(--text-secondary)] hover:text-[var(--accent-pink)] hover:bg-[var(--accent-pink-soft)] transition-all duration-200 text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              My Notes
            </Link>

            <div className="border-t border-[var(--card-border)] my-2"></div>

            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 px-4 py-2 text-[var(--text-secondary)] hover:text-red-500 hover:bg-red-50 transition-all duration-200 text-sm w-full text-left"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
