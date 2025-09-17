import type { Metadata } from 'next'
import { OrbBackground } from '../../components/ui/OrbBackground';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import { Footer } from '../../components/Footer';

export const metadata: Metadata = {
  title: 'Note Formats - Kyoto Scribe 🐕 | AI-Generated Learning Materials',
  description: 'Choose from 5 AI-generated formats: Basic Summary, Study Notes, Presentation Slides, Tutorial Guide with clickable timestamps, and Research Paper Format.',
  keywords: 'note formats, AI study notes, presentation slides, basic summary, tutorial guide, research paper, clickable timestamps, step by step instructions',
}

export default function Formats() {
  return (
    <div className="min-h-screen">
      {/* Animated Orbs Background */}
      <OrbBackground />
      
      {/* Content Wrapper */}
      <div className="content-wrapper relative z-10">
        {/* Theme Toggle */}
        <ThemeToggle />
        
        {/* Main Container */}
        <div className="container max-w-[1200px] mx-auto pt-20 pb-10 px-5">
          {/* Page Header */}
          <section className="page-header text-center py-20">
            <h1 className="hero-title text-6xl font-extrabold leading-tight mb-6 bg-gradient-to-br from-[var(--text-primary)] to-[var(--accent-pink)] bg-clip-text text-transparent">
              Note Formats
            </h1>
            <p className="hero-subtitle text-[22px] text-[var(--text-secondary)] mb-12 max-w-[700px] mx-auto leading-relaxed">
              Choose from multiple AI-generated formats tailored to your learning needs and study preferences
            </p>
          </section>

          {/* Formats Grid */}
          <section className="formats-section py-10">
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

              {/* Tutorial Guide - Available Now */}
              <div className="format-card bg-[var(--card-bg)] backdrop-blur-[20px] border border-[var(--card-border)] rounded-2xl p-6 transition-all duration-300 hover:transform hover:translate-y-[-4px] hover:shadow-[0_12px_32px_rgba(0,0,0,0.08)] relative">
                <div className="new-badge absolute top-3 right-3 bg-gradient-to-r from-green-400 to-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  NEW
                </div>
                <div className="format-header mb-4">
                  <div className="format-icon w-12 h-12 bg-gradient-to-br from-[var(--accent-pink)] to-[#FF8FB3] rounded-xl flex items-center justify-center text-2xl mb-3 mx-auto">
                    🔧
                  </div>
                  <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2 text-center">Tutorial Guide</h3>
                </div>
                <div className="format-content">
                  <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-4">
                    Advanced step-by-step instructions with clickable YouTube timestamps, domain detection, and verbosity controls.
                  </p>
                  <div className="format-features">
                    <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-2">Includes:</h4>
                    <ul className="text-xs text-[var(--text-secondary)] space-y-1">
                      <li className="flex items-center gap-2">
                        <span className="text-green-500">✓</span>
                        <span>Clickable YouTube timestamps</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-500">✓</span>
                        <span>Domain detection (Programming/DIY/Fitness)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-500">✓</span>
                        <span>Verbosity controls (Concise/Standard/Comprehensive)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-500">✓</span>
                        <span>Prerequisites and troubleshooting</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Research Paper Format */}
              <div className="format-card bg-[var(--card-bg)] backdrop-blur-[20px] border border-[var(--card-border)] rounded-2xl p-6 transition-all duration-300 hover:transform hover:translate-y-[-4px] hover:shadow-[0_12px_32px_rgba(0,0,0,0.08)] relative">
                <div className="new-badge absolute top-3 right-3 bg-gradient-to-r from-green-400 to-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  NEW
                </div>
                <div className="format-header mb-4">
                  <div className="format-icon w-12 h-12 bg-gradient-to-br from-[var(--accent-pink)] to-[#FF8FB3] rounded-xl flex items-center justify-center text-2xl mb-3 mx-auto">
                    📄
                  </div>
                  <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2 text-center">Research Paper Format</h3>
                </div>
                <div className="format-content">
                  <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-4">
                    Academic-style analysis with scholarly structure, methodology, findings, and conclusions.
                  </p>
                  <div className="format-features">
                    <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-2">Includes:</h4>
                    <ul className="text-xs text-[var(--text-secondary)] space-y-1">
                      <li className="flex items-center gap-2">
                        <span className="text-green-500">✓</span>
                        <span>Abstract and introduction</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-500">✓</span>
                        <span>Methodology and findings</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-500">✓</span>
                        <span>Discussion and conclusions</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-500">✓</span>
                        <span>Academic writing style</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

            </div>
          </section>

          {/* Format Selection Guide */}
          <section className="format-guide py-20">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4 bg-gradient-to-br from-[var(--text-primary)] to-[var(--accent-pink)] bg-clip-text text-transparent">
                Which Format Should You Choose?
              </h2>
              <p className="text-lg text-[var(--text-secondary)] max-w-[600px] mx-auto leading-relaxed">
                Not sure which format is right for you? Here's a quick guide to help you decide
              </p>
            </div>

            <div className="guide-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="guide-item bg-[var(--card-bg)] backdrop-blur-[20px] border border-[var(--card-border)] rounded-2xl p-6 text-center">
                <div className="guide-icon text-3xl mb-4">⚡</div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Quick Review</h3>
                <p className="text-sm text-[var(--text-secondary)] mb-4">
                  Need a fast overview before a meeting or to refresh your memory?
                </p>
                <div className="recommended bg-[var(--accent-pink-soft)] text-[var(--accent-pink)] px-3 py-1 rounded-full text-xs font-semibold">
                  Use Basic Summary
                </div>
              </div>

              <div className="guide-item bg-[var(--card-bg)] backdrop-blur-[20px] border border-[var(--card-border)] rounded-2xl p-6 text-center">
                <div className="guide-icon text-3xl mb-4">📖</div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Deep Learning</h3>
                <p className="text-sm text-[var(--text-secondary)] mb-4">
                  Studying for exams or need comprehensive understanding?
                </p>
                <div className="recommended bg-[var(--accent-pink-soft)] text-[var(--accent-pink)] px-3 py-1 rounded-full text-xs font-semibold">
                  Use Study Notes
                </div>
              </div>

              <div className="guide-item bg-[var(--card-bg)] backdrop-blur-[20px] border border-[var(--card-border)] rounded-2xl p-6 text-center">
                <div className="guide-icon text-3xl mb-4">🎤</div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Presentations</h3>
                <p className="text-sm text-[var(--text-secondary)] mb-4">
                  Need to present the content to others or create teaching materials?
                </p>
                <div className="recommended bg-[var(--accent-pink-soft)] text-[var(--accent-pink)] px-3 py-1 rounded-full text-xs font-semibold">
                  Use Presentation Slides
                </div>
              </div>

              <div className="guide-item bg-[var(--card-bg)] backdrop-blur-[20px] border border-[var(--card-border)] rounded-2xl p-6 text-center">
                <div className="guide-icon text-3xl mb-4">🔧</div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">How-To Videos</h3>
                <p className="text-sm text-[var(--text-secondary)] mb-4">
                  Following tutorials or learning step-by-step processes?
                </p>
                <div className="recommended bg-[var(--accent-pink-soft)] text-[var(--accent-pink)] px-3 py-1 rounded-full text-xs font-semibold">
                  Use Tutorial Guide
                </div>
              </div>
            </div>
          </section>
        </div>
        
        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
}