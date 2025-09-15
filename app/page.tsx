'use client';

import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Footer } from '../components/Footer';
import { OrbBackground } from '../components/ui/OrbBackground';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { TabbedNavigation } from '../components/ui/TabbedNavigation';
import { HowItWorks } from '../components/ui/HowItWorks';
import { HomePageAd } from '../components/ads/FreeUserAdBanner';

export default function Home() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const handleGetStarted = () => {
    router.push('/process');
  };

  // Determine button text and styling based on authentication state
  const getButtonContent = () => {
    if (status === 'loading') {
      return "Loading...";
    }

    if (session?.user) {
      return "Generate Notes ✨";
    }

    return "Get Started Free ✨";
  };

  return (
    <div className="min-h-screen">
      {/* Animated Orbs Background */}
      <OrbBackground />
      
      {/* Content Wrapper */}
      <div className="content-wrapper relative z-10">
        {/* Theme Toggle */}
        <ThemeToggle />
        {/* Header */}
        {/* Main Container */}
        <div className="container max-w-[1200px] mx-auto pt-20 pb-10 px-5">
          {/* Hero Section */}
          <section className="hero text-center py-20">
            <h1 className="hero-title text-6xl font-extrabold leading-tight mb-6 bg-gradient-to-br from-[var(--text-primary)] to-[var(--accent-pink)] bg-clip-text text-transparent">
              Transform YouTube Videos<br />Into Smart Notes
            </h1>
            <p className="hero-subtitle text-[22px] text-[var(--text-secondary)] mb-12 max-w-[600px] mx-auto leading-relaxed">
              Get comprehensive notes from YouTube videos with AI-powered analysis in seconds
            </p>
            
            {/* Get Started Button */}
            <button
              onClick={handleGetStarted}
              className="get-started-btn px-14 py-5 bg-gradient-to-br from-[var(--accent-pink)] to-[#FF5A8C] text-white border-none rounded-[50px] text-xl font-bold transition-all duration-300 relative overflow-hidden group hover:transform hover:scale-105 mb-20 animate-pulse-glow"
              style={{
                boxShadow: '0 6px 25px rgba(255,107,157,0.3)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 8px 35px rgba(255,107,157,0.45)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 6px 25px rgba(255,107,157,0.3)';
              }}
            >
              {/* Shimmer effect */}
              <div className="absolute inset-0 -top-2 -bottom-2 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              {/* Ripple effect on hover */}
              <div className="absolute top-1/2 left-1/2 w-0 h-0 rounded-full bg-white/30 transform -translate-x-1/2 -translate-y-1/2 transition-all duration-600 group-hover:w-[300px] group-hover:h-[300px]"></div>
              <span className="relative z-10 drop-shadow-sm">{getButtonContent()}</span>
            </button>
          </section>

          {/* How It Works Section */}
          <HowItWorks />

          {/* Ad Banner for Free Users */}
          <HomePageAd />

          {/* Tabbed Navigation Section */}
          <section className="tabbed-section py-20 mb-32">
            <TabbedNavigation />
          </section>
        </div>
        
        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
}