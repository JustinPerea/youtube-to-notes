'use client';

import { useState, useEffect } from 'react';
import { HowItWorks } from './HowItWorks';
import { FeaturesGrid } from './FeaturesGrid';
import { PricingTiers, PricingToggle } from '../pricing/PricingTiers';

// Pricing Section Component
function PricingSection() {
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');

  return (
    <div className="py-8">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold mb-4 bg-gradient-to-br from-[var(--text-primary)] to-[var(--accent-pink)] bg-clip-text text-transparent">
          Unlimited Learning at Unbeatable Prices
        </h2>
        <p className="text-lg text-[var(--text-secondary)] max-w-[700px] mx-auto leading-relaxed mb-8">
          Turn ANY YouTube video into study notes - unlimited, forever.
        </p>
      </div>

      <PricingToggle billing={billing} onBillingChange={setBilling} />
      <PricingTiers billing={billing} />
    </div>
  );
}

interface TabbedNavigationProps {
  className?: string;
}

type TabId = 'features' | 'formats' | 'how-it-works' | 'pricing' | 'about';

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
      'formats': '#formats',
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
        '#formats': 'formats',
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
      id: 'formats',
      label: 'Formats',
      content: (
        <div className="py-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-br from-[var(--text-primary)] to-[var(--accent-pink)] bg-clip-text text-transparent">
              Note Formats
            </h2>
            <p className="text-lg text-[var(--text-secondary)] max-w-[600px] mx-auto leading-relaxed">
              Choose from multiple AI-generated formats tailored to your learning needs
            </p>
          </div>
          
          <div className="formats-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* Basic Summary */}
            <div className="format-card bg-[var(--card-bg)] backdrop-blur-[20px] border border-[var(--card-border)] rounded-2xl p-6 transition-all duration-300 hover:transform hover:translate-y-[-4px] hover:shadow-[0_12px_32px_rgba(0,0,0,0.08)]">
              <div className="format-header mb-4">
                <div className="format-icon w-12 h-12 bg-gradient-to-br from-[var(--accent-pink)] to-[#FF8FB3] rounded-xl flex items-center justify-center text-2xl mb-3 mx-auto">
                  📝
                </div>
                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2 text-center">Basic Summary</h3>
              </div>
              <div className="format-content">
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-4">
                  Perfect for quick overviews and key takeaways. Gets straight to the point with the most important information from your video.
                </p>
                <div className="format-features">
                  <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-2">Includes:</h4>
                  <ul className="text-xs text-[var(--text-secondary)] space-y-1">
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      <span>Key points and main ideas</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      <span>Concise overview</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      <span>Quick reading format</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Study Notes */}
            <div className="format-card bg-[var(--card-bg)] backdrop-blur-[20px] border border-[var(--card-border)] rounded-2xl p-6 transition-all duration-300 hover:transform hover:translate-y-[-4px] hover:shadow-[0_12px_32px_rgba(0,0,0,0.08)]">
              <div className="format-header mb-4">
                <div className="format-icon w-12 h-12 bg-gradient-to-br from-[var(--accent-pink)] to-[#FF8FB3] rounded-xl flex items-center justify-center text-2xl mb-3 mx-auto">
                  📚
                </div>
                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2 text-center">Study Notes</h3>
              </div>
              <div className="format-content">
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-4">
                  Comprehensive notes structured for effective learning and retention. Perfect for exam preparation and in-depth understanding.
                </p>
                <div className="format-features">
                  <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-2">Includes:</h4>
                  <ul className="text-xs text-[var(--text-secondary)] space-y-1">
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      <span>Detailed explanations</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      <span>Key concepts and definitions</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      <span>Organized sections</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      <span>Learning objectives</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Presentation Slides */}
            <div className="format-card bg-[var(--card-bg)] backdrop-blur-[20px] border border-[var(--card-border)] rounded-2xl p-6 transition-all duration-300 hover:transform hover:translate-y-[-4px] hover:shadow-[0_12px_32px_rgba(0,0,0,0.08)] relative">
              <div className="beta-badge absolute top-3 right-3 bg-gradient-to-r from-orange-400 to-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                BETA
              </div>
              <div className="format-header mb-4">
                <div className="format-icon w-12 h-12 bg-gradient-to-br from-[var(--accent-pink)] to-[#FF8FB3] rounded-xl flex items-center justify-center text-2xl mb-3 mx-auto">
                  🎯
                </div>
                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2 text-center">Presentation Slides</h3>
              </div>
              <div className="format-content">
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-4">
                  Slide-ready content perfect for presentations and teaching. Currently in beta version and being actively improved.
                </p>
                <div className="format-features">
                  <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-2">Includes:</h4>
                  <ul className="text-xs text-[var(--text-secondary)] space-y-1">
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      <span>Bullet-point format</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      <span>Key talking points</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      <span>Structured slides</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-orange-500">⚠</span>
                      <span className="text-orange-600 font-medium">Beta - Being improved</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Tutorial Notes - Coming Soon */}
            <div className="format-card bg-[var(--card-bg)] backdrop-blur-[20px] border border-[var(--card-border)] rounded-2xl p-6 transition-all duration-300 hover:transform hover:translate-y-[-4px] hover:shadow-[0_12px_32px_rgba(0,0,0,0.08)] relative opacity-75">
              <div className="coming-soon-banner absolute -top-2 -right-2 bg-gradient-to-r from-[var(--accent-pink)] to-[#FF8FB3] text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg transform rotate-12">
                COMING SOON
              </div>
              <div className="format-header mb-4">
                <div className="format-icon w-12 h-12 bg-gray-300 rounded-xl flex items-center justify-center text-2xl mb-3 mx-auto">
                  🎓
                </div>
                <h3 className="text-xl font-bold text-[var(--text-muted)] mb-2 text-center">Tutorial Notes</h3>
              </div>
              <div className="format-content">
                <p className="text-[var(--text-muted)] text-sm leading-relaxed mb-4">
                  Step-by-step tutorial format perfect for how-to videos and instructional content.
                </p>
                <div className="format-features">
                  <h4 className="text-sm font-semibold text-[var(--text-muted)] mb-2">Will Include:</h4>
                  <ul className="text-xs text-[var(--text-muted)] space-y-1">
                    <li className="flex items-center gap-2">
                      <span className="text-gray-400">○</span>
                      <span>Step-by-step instructions</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-gray-400">○</span>
                      <span>Prerequisites and tools</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-gray-400">○</span>
                      <span>Troubleshooting tips</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Mind Map - Coming Soon */}
            <div className="format-card bg-[var(--card-bg)] backdrop-blur-[20px] border border-[var(--card-border)] rounded-2xl p-6 transition-all duration-300 hover:transform hover:translate-y-[-4px] hover:shadow-[0_12px_32px_rgba(0,0,0,0.08)] relative opacity-75">
              <div className="coming-soon-banner absolute -top-2 -right-2 bg-gradient-to-r from-[var(--accent-pink)] to-[#FF8FB3] text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg transform rotate-12">
                COMING SOON
              </div>
              <div className="format-header mb-4">
                <div className="format-icon w-12 h-12 bg-gray-300 rounded-xl flex items-center justify-center text-2xl mb-3 mx-auto">
                  🧠
                </div>
                <h3 className="text-xl font-bold text-[var(--text-muted)] mb-2 text-center">Mind Map</h3>
              </div>
              <div className="format-content">
                <p className="text-[var(--text-muted)] text-sm leading-relaxed mb-4">
                  Visual mind map format showing connections between concepts and ideas.
                </p>
                <div className="format-features">
                  <h4 className="text-sm font-semibold text-[var(--text-muted)] mb-2">Will Include:</h4>
                  <ul className="text-xs text-[var(--text-muted)] space-y-1">
                    <li className="flex items-center gap-2">
                      <span className="text-gray-400">○</span>
                      <span>Central topic branching</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-gray-400">○</span>
                      <span>Connected concepts</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-gray-400">○</span>
                      <span>Visual organization</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Study Guide - Coming Soon */}
            <div className="format-card bg-[var(--card-bg)] backdrop-blur-[20px] border border-[var(--card-border)] rounded-2xl p-6 transition-all duration-300 hover:transform hover:translate-y-[-4px] hover:shadow-[0_12px_32px_rgba(0,0,0,0.08)] relative opacity-75">
              <div className="coming-soon-banner absolute -top-2 -right-2 bg-gradient-to-r from-[var(--accent-pink)] to-[#FF8FB3] text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg transform rotate-12">
                COMING SOON
              </div>
              <div className="format-header mb-4">
                <div className="format-icon w-12 h-12 bg-gray-300 rounded-xl flex items-center justify-center text-2xl mb-3 mx-auto">
                  📖
                </div>
                <h3 className="text-xl font-bold text-[var(--text-muted)] mb-2 text-center">Study Guide</h3>
              </div>
              <div className="format-content">
                <p className="text-[var(--text-muted)] text-sm leading-relaxed mb-4">
                  Comprehensive study guide with practice questions and review materials.
                </p>
                <div className="format-features">
                  <h4 className="text-sm font-semibold text-[var(--text-muted)] mb-2">Will Include:</h4>
                  <ul className="text-xs text-[var(--text-muted)] space-y-1">
                    <li className="flex items-center gap-2">
                      <span className="text-gray-400">○</span>
                      <span>Review questions</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-gray-400">○</span>
                      <span>Key terms glossary</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-gray-400">○</span>
                      <span>Practice exercises</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
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
      content: <PricingSection />
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