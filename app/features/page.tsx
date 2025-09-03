import type { Metadata } from 'next'
import { OrbBackground } from '../../components/ui/OrbBackground';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import { Footer } from '../../components/Footer';
import { FeaturesGrid } from '../../components/ui/FeaturesGrid';

export const metadata: Metadata = {
  title: 'Features - Kyoto Scribe 🐕 | AI-Powered Video Note Generation',
  description: 'Discover powerful AI-driven features designed to transform your learning experience. Lightning fast processing, multiple formats, PDF export, and more.',
  keywords: 'AI features, video processing, note generation, PDF export, cloud storage, secure notes, learning tools',
}

export default function Features() {
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
              Why Choose Kyoto Scribe?
            </h1>
            <p className="hero-subtitle text-[22px] text-[var(--text-secondary)] mb-12 max-w-[700px] mx-auto leading-relaxed">
              Powerful AI-driven features designed to transform your learning experience and make studying more efficient than ever before
            </p>
          </section>

          {/* Features Content */}
          <section className="features-section py-10">
            <FeaturesGrid />
          </section>

          {/* Additional Features Info */}
          <section className="additional-info py-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="info-text">
                <h2 className="text-4xl font-bold mb-6 bg-gradient-to-br from-[var(--text-primary)] to-[var(--accent-pink)] bg-clip-text text-transparent">
                  Built for Modern Learners
                </h2>
                <div className="space-y-6">
                  <div className="feature-highlight">
                    <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-3">Advanced AI Processing</h3>
                    <p className="text-[var(--text-secondary)] leading-relaxed">
                      AI technology processes video content with remarkable accuracy, extracting key information, 
                      identifying main concepts, and organizing them into digestible formats that enhance your learning experience.
                    </p>
                  </div>
                  <div className="feature-highlight">
                    <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-3">Flexible Export Options</h3>
                    <p className="text-[var(--text-secondary)] leading-relaxed">
                      Take your notes wherever you go with multiple export formats. Whether you prefer PDF for printing, 
                      cloud storage for accessibility, or direct integration with your existing tools, we've got you covered.
                    </p>
                  </div>
                  <div className="feature-highlight">
                    <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-3">Privacy-First Approach</h3>
                    <p className="text-[var(--text-secondary)] leading-relaxed">
                      Your learning data is yours alone. We use secure practices and encryption 
                      to keep your notes, preferences, and personal information private and protected.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="info-visual">
                <div className="feature-showcase bg-gradient-to-br from-[var(--card-bg)] to-[var(--accent-pink-soft)] backdrop-blur-[20px] border border-[var(--card-border)] rounded-3xl p-8 relative overflow-hidden group">
                  <div className="absolute -top-1/2 -right-1/2 w-[200%] h-[200%] bg-gradient-radial from-[var(--accent-pink-soft)] to-transparent opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
                  
                  <div className="showcase-content relative z-10 text-center">
                    <div className="feature-icon text-6xl mb-6 animate-pulse">
                      🐕
                    </div>
                    <h4 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
                      Your AI Study Companion
                    </h4>
                    <p className="text-[var(--text-secondary)] mb-6 leading-relaxed">
                      Kyoto Scribe is designed to be your faithful study buddy - always ready to help you 
                      transform any YouTube video into organized, beautiful notes that make learning a joy.
                    </p>
                    <div className="features-preview grid grid-cols-2 gap-4">
                      <div className="feature bg-[var(--card-bg)] backdrop-blur-[20px] border border-[var(--card-border)] rounded-xl p-4">
                        <div className="feature-icon text-2xl mb-2">⚡</div>
                        <div className="feature-label text-sm font-semibold text-[var(--text-primary)]">Fast Processing</div>
                      </div>
                      <div className="feature bg-[var(--card-bg)] backdrop-blur-[20px] border border-[var(--card-border)] rounded-xl p-4">
                        <div className="feature-icon text-2xl mb-2">🎯</div>
                        <div className="feature-label text-sm font-semibold text-[var(--text-primary)]">Smart Formatting</div>
                      </div>
                    </div>
                  </div>
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