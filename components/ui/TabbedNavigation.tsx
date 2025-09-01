'use client';

import { useState, useEffect } from 'react';
import { HowItWorks } from './HowItWorks';
import { FeaturesGrid } from './FeaturesGrid';

interface TabbedNavigationProps {
  className?: string;
}

type TabId = 'features' | 'how-it-works' | 'pricing' | 'about';

interface Tab {
  id: TabId;
  label: string;
  content: React.ReactNode;
}

export function TabbedNavigation({ className = '' }: TabbedNavigationProps) {
  const [activeTab, setActiveTab] = useState<TabId>('features');

  // Function to handle tab change and update URL
  const handleTabChange = (tabId: TabId) => {
    setActiveTab(tabId);
    
    // Map tab IDs to hash fragments
    const hashMap: Record<TabId, string> = {
      'features': '#features',
      'how-it-works': '#how',
      'pricing': '#pricing',
      'about': '#about'
    };
    
    // Update URL hash without scrolling
    const newHash = hashMap[tabId];
    if (newHash && typeof window !== 'undefined') {
      window.history.replaceState(null, '', newHash);
    }
  };

  // Effect to handle URL hash changes and initial load
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      
      // Map hash fragments to tab IDs
      const tabMap: Record<string, TabId> = {
        '#features': 'features',
        '#how': 'how-it-works',
        '#pricing': 'pricing',
        '#about': 'about'
      };
      
      if (tabMap[hash]) {
        setActiveTab(tabMap[hash]);
      }
    };

    // Handle initial load
    handleHashChange();
    
    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
    
    // Cleanup
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const tabs: Tab[] = [
    {
      id: 'features',
      label: 'Features',
      content: (
        <div className="py-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-br from-[var(--text-primary)] to-[var(--accent-pink)] bg-clip-text text-transparent">
              Why Choose Kyoto Scribe?
            </h2>
            <p className="text-lg text-[var(--text-secondary)] max-w-[600px] mx-auto leading-relaxed">
              Powerful AI-driven features designed to transform your learning experience
            </p>
          </div>
          <FeaturesGrid />
        </div>
      )
    },
    {
      id: 'how-it-works',
      label: 'How Kyoto Works',
      content: <HowItWorks />
    },
    {
      id: 'pricing',
      label: 'Simple, Transparent Pricing',
      content: (
        <div className="py-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-br from-[var(--text-primary)] to-[var(--accent-pink)] bg-clip-text text-transparent">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg text-[var(--text-secondary)] max-w-[600px] mx-auto leading-relaxed">
              Choose the plan that works best for your learning journey
            </p>
          </div>
          
          <div className="pricing-disclaimer text-center mb-8">
            <p className="text-sm text-[var(--text-secondary)] font-medium bg-[var(--card-bg)] backdrop-blur-[20px] border border-[var(--card-border)] rounded-lg px-4 py-2 inline-block">
              ⚠️ Subject to change after beta launch
            </p>
          </div>
          
          <div className="pricing-cards grid grid-cols-1 md:grid-cols-2 gap-8 max-w-[800px] mx-auto">
            {/* Free Plan */}
            <div className="pricing-card bg-[var(--card-bg)] backdrop-blur-[20px] border border-[var(--card-border)] rounded-2xl p-8 text-center transition-all duration-300 relative overflow-hidden group hover:transform hover:translate-y-[-4px] hover:shadow-[0_12px_32px_rgba(0,0,0,0.08)]">
              <div className="absolute -top-1/2 -right-1/2 w-[200%] h-[200%] bg-gradient-radial from-[var(--accent-pink-soft)] to-transparent opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              
              <div className="plan-header mb-8 relative z-10">
                <div className="plan-icon w-16 h-16 bg-[var(--accent-pink-soft)] rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">
                  🆓
                </div>
                <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Free</h3>
                <div className="price text-4xl font-bold text-[var(--text-primary)] mb-2">
                  $0<span className="text-lg font-medium text-[var(--text-secondary)]">/month</span>
                </div>
                <p className="text-sm text-[var(--text-secondary)]">Perfect for getting started</p>
              </div>
              
              <div className="plan-features mb-8 relative z-10">
                <ul className="space-y-3 text-left">
                  <li className="flex items-center gap-3">
                    <span className="text-green-500">✓</span>
                    <span className="text-sm text-[var(--text-secondary)]">5 videos per month</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="text-green-500">✓</span>
                    <span className="text-sm text-[var(--text-secondary)]">Basic templates</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="text-green-500">✓</span>
                    <span className="text-sm text-[var(--text-secondary)]">PDF export</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="text-green-500">✓</span>
                    <span className="text-sm text-[var(--text-secondary)]">Cloud storage</span>
                  </li>
                </ul>
              </div>
              
              <button className="cta-btn w-full px-6 py-3 bg-[var(--card-border)] text-[var(--text-primary)] border border-[var(--card-border)] rounded-[50px] font-semibold transition-all duration-300 relative z-10 hover:bg-[var(--accent-pink-soft)] hover:border-[var(--accent-pink)]">
                Get Started Free
              </button>
            </div>

            {/* Pro Plan */}
            <div className="pricing-card bg-gradient-to-br from-[var(--accent-pink)] to-[#FF8FB3] rounded-2xl p-8 text-center transition-all duration-300 relative overflow-hidden group hover:transform hover:translate-y-[-4px] hover:shadow-[0_12px_32px_rgba(255,107,157,0.25)] shadow-[0_8px_24px_rgba(255,107,157,0.15)]">
              <div className="absolute top-0 right-6 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-b-lg text-xs font-semibold text-white">
                POPULAR
              </div>
              
              <div className="plan-header mb-8">
                <div className="plan-icon w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">
                  ⭐
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Pro</h3>
                <div className="price text-4xl font-bold text-white mb-2">
                  $9<span className="text-lg font-medium text-white/80">/month</span>
                </div>
                <p className="text-sm text-white/80">For serious learners</p>
              </div>
              
              <div className="plan-features mb-8">
                <ul className="space-y-3 text-left">
                  <li className="flex items-center gap-3">
                    <span className="text-white">✓</span>
                    <span className="text-sm text-white/90">Unlimited videos</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="text-white">✓</span>
                    <span className="text-sm text-white/90">All premium templates</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="text-white">✓</span>
                    <span className="text-sm text-white/90">AI chat with videos (Coming Soon)</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="text-white">✓</span>
                    <span className="text-sm text-white/90">Advanced exports</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="text-white">✓</span>
                    <span className="text-sm text-white/90">Priority processing</span>
                  </li>
                </ul>
              </div>
              
              <button className="cta-btn w-full px-6 py-3 bg-white text-[var(--accent-pink)] border-none rounded-[50px] font-semibold transition-all duration-300 hover:transform hover:translate-y-[-2px] hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)]">
                Upgrade to Pro
              </button>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'about',
      label: 'Meet Your AI Study Buddy',
      content: (
        <div className="py-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-br from-[var(--text-primary)] to-[var(--accent-pink)] bg-clip-text text-transparent">
              Meet Your AI Study Buddy
            </h2>
            <p className="text-lg text-[var(--text-secondary)] max-w-[600px] mx-auto leading-relaxed">
              Kyoto Scribe combines the power of advanced AI technology with the friendly spirit of a Shiba Inu companion
            </p>
          </div>
          
          <div className="about-content grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* About Text */}
            <div className="about-text">
              <div className="story-section mb-8">
                <h3 className="text-2xl font-semibold mb-4 text-[var(--text-primary)]">Our Story</h3>
                <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
                  Born from the need to make learning more efficient and enjoyable, Kyoto Scribe was created by developers who understand the struggle of processing hours of educational content.
                </p>
                <p className="text-[var(--text-secondary)] leading-relaxed">
                  Just like a loyal Shiba Inu companion, Kyoto is always ready to help, never judges your learning pace, and makes even the most complex topics approachable with a friendly wag of the tail.
                </p>
              </div>
              
              <div className="mission-section mb-8">
                <h3 className="text-2xl font-semibold mb-4 text-[var(--text-primary)]">Our Mission</h3>
                <p className="text-[var(--text-secondary)] leading-relaxed">
                  To democratize learning by making educational content more accessible, digestible, and actionable. We believe everyone deserves a study buddy that's available 24/7, infinitely patient, and incredibly smart.
                </p>
              </div>
            </div>
            
            {/* About Visual */}
            <div className="about-visual text-center">
              <div className="shiba-character bg-gradient-to-br from-[var(--card-bg)] to-[var(--accent-pink-soft)] backdrop-blur-[20px] border border-[var(--card-border)] rounded-3xl p-12 mb-6 relative overflow-hidden group hover:transform hover:translate-y-[-4px] transition-all duration-300">
                <div className="absolute -top-1/2 -right-1/2 w-[200%] h-[200%] bg-gradient-radial from-[var(--accent-pink-soft)] to-transparent opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
                
                <div className="shiba-icon text-8xl mb-6 relative z-10 animate-bounce">
                  🐕
                </div>
                <h4 className="text-2xl font-bold text-[var(--text-primary)] mb-3 relative z-10">
                  Hi, I'm Kyoto!
                </h4>
                <p className="text-[var(--text-secondary)] relative z-10">
                  Your friendly AI companion ready to turn any YouTube video into beautiful, organized notes. 
                  I'm patient, thorough, and always excited to help you learn! Woof! 🎾
                </p>
              </div>
              
              <div className="benefits grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="benefit bg-[var(--card-bg)] backdrop-blur-[20px] border border-[var(--card-border)] rounded-xl p-4">
                  <div className="benefit-icon text-2xl mb-2">⚡</div>
                  <div className="benefit-label text-sm font-semibold text-[var(--text-primary)] mb-1">Lightning Fast</div>
                  <div className="benefit-desc text-xs text-[var(--text-secondary)]">Quick processing</div>
                </div>
                <div className="benefit bg-[var(--card-bg)] backdrop-blur-[20px] border border-[var(--card-border)] rounded-xl p-4">
                  <div className="benefit-icon text-2xl mb-2">🎯</div>
                  <div className="benefit-label text-sm font-semibold text-[var(--text-primary)] mb-1">Accurate</div>
                  <div className="benefit-desc text-xs text-[var(--text-secondary)]">Precise extraction</div>
                </div>
                <div className="benefit bg-[var(--card-bg)] backdrop-blur-[20px] border border-[var(--card-border)] rounded-xl p-4">
                  <div className="benefit-icon text-2xl mb-2">📚</div>
                  <div className="benefit-label text-sm font-semibold text-[var(--text-primary)] mb-1">Comprehensive</div>
                  <div className="benefit-desc text-xs text-[var(--text-secondary)]">Detailed notes</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className={`tabbed-navigation ${className}`}>
      {/* Tab Navigation */}
      <div className="tab-nav bg-[var(--card-bg)] backdrop-blur-[20px] border border-[var(--card-border)] rounded-2xl p-2 mb-12 max-w-4xl mx-auto">
        <div className="flex flex-wrap justify-center gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`tab-button px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 relative overflow-hidden ${
                activeTab === tab.id
                  ? 'bg-gradient-to-br from-[var(--accent-pink)] to-[#FF8FB3] text-white shadow-[0_4px_12px_rgba(255,107,157,0.25)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--accent-pink-soft)]'
              }`}
            >
              {activeTab === tab.id && (
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-pink)] to-[#FF8FB3] opacity-10"></div>
              )}
              <span className="relative z-10">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {tabs.find(tab => tab.id === activeTab)?.content}
      </div>
    </div>
  );
}