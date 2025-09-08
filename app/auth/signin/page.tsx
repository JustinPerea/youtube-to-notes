'use client';

import { signIn, useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SignIn() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    // Check if user is already signed in
    if (session) {
      router.push('/');
    }
  }, [session, router]);

  const handleGoogleSignIn = () => {
    signIn('google', { callbackUrl: '/' });
  };

  if (status === 'loading') {
    return (
      <div 
        className="min-h-screen flex items-center justify-center relative"
        style={{
          background: `var(--bg-primary)`,
        }}
      >
        {/* Animated background orbs using theme system */}
        <div className="absolute inset-0">
          <div 
            className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl animate-pulse-slow"
            style={{ background: `var(--orb-1)` }}
          ></div>
          <div 
            className="absolute top-1/3 right-1/3 w-80 h-80 rounded-full blur-3xl animate-pulse-slow"
            style={{ background: `var(--orb-2)`, animationDelay: '1s' }}
          ></div>
          <div 
            className="absolute bottom-1/4 left-1/3 w-72 h-72 rounded-full blur-3xl animate-pulse-slow"
            style={{ background: `var(--orb-3)`, animationDelay: '2s' }}
          ></div>
        </div>
        <div 
          className="text-lg font-medium animate-pulse"
          style={{ color: `var(--text-primary)` }}
        >
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center relative px-4"
      style={{
        background: `var(--bg-primary)`,
      }}
    >
      {/* Animated background orbs using theme system */}
      <div className="absolute inset-0">
        <div 
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl animate-pulse-slow"
          style={{ background: `var(--orb-1)` }}
        ></div>
        <div 
          className="absolute top-1/3 right-1/3 w-80 h-80 rounded-full blur-3xl animate-pulse-slow"
          style={{ background: `var(--orb-2)`, animationDelay: '1s' }}
        ></div>
        <div 
          className="absolute bottom-1/4 left-1/3 w-72 h-72 rounded-full blur-3xl animate-pulse-slow"
          style={{ background: `var(--orb-3)`, animationDelay: '2s' }}
        ></div>
      </div>

      {/* Sign-in card with glass morphism */}
      <div className="glass-card max-w-md w-full relative z-10 p-8 animate-fade-in">
        <div className="text-center mb-8">
          <h1 
            className="text-3xl font-bold mb-2"
            style={{ color: `var(--text-primary)` }}
          >
            Welcome to Kyoto Scribe 🐕
          </h1>
          <p 
            className="text-base"
            style={{ color: `var(--text-secondary)` }}
          >
            Continue with Google to get started or sign in to your account
          </p>
        </div>

        <button
          onClick={handleGoogleSignIn}
          className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-medium transition-all duration-300 hover:scale-105 focus:scale-105"
          style={{
            background: 'white',
            color: '#1f2937',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#f9fafb';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'white';
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.1)';
          }}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        <div className="mt-6 text-center">
          <p 
            className="text-sm"
            style={{ color: `var(--text-muted)` }}
          >
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}
