import type { Metadata } from 'next'
import { OrbBackground } from '../../components/ui/OrbBackground';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import { Footer } from '../../components/Footer';

export const metadata: Metadata = {
  title: 'About - Kyoto Scribe 🐕 | Meet Your AI Study Buddy',
  description: 'Learn about Kyoto Scribe, your friendly AI companion that transforms YouTube videos into beautiful notes. Discover our story, mission, and the team behind the magic.',
  keywords: 'about kyoto scribe, AI study buddy, video processing, educational technology, learning companion, shiba inu mascot',
}

export default function About() {
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
              Meet Your AI Study Buddy
            </h1>
            <p className="hero-subtitle text-[22px] text-[var(--text-secondary)] mb-12 max-w-[700px] mx-auto leading-relaxed">
              Kyoto Scribe combines the power of advanced AI technology with the friendly spirit of a Shiba Inu companion
            </p>
          </section>

          {/* Main About Content */}
          <section className="about-content-section py-10">
            <div className="about-content grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* About Text */}
              <div className="about-text">
                <div className="story-section mb-8">
                  <h2 className="text-4xl font-semibold mb-6 text-[var(--text-primary)]">Our Story</h2>
                  <p className="text-[var(--text-secondary)] leading-relaxed mb-4 text-lg">
                    Born from the personal need to make learning more efficient and enjoyable, Kyoto Scribe was created by a solo developer who understands the struggle of processing hours of educational content, working alongside Claude Code to bring this vision to life.
                  </p>
                  <p className="text-[var(--text-secondary)] leading-relaxed text-lg">
                    Just like a loyal Shiba Inu companion, Kyoto is always ready to help, never judges your learning pace, and makes even the most complex topics approachable with a friendly wag of the tail.
                  </p>
                </div>
                
                <div className="mission-section mb-8">
                  <h3 className="text-2xl font-semibold mb-4 text-[var(--text-primary)]">Our Mission</h3>
                  <p className="text-[var(--text-secondary)] leading-relaxed text-lg">
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
                  <p className="text-[var(--text-secondary)] relative z-10 text-lg">
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
          </section>

          {/* Values Section */}
          <section className="values-section py-20">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4 bg-gradient-to-br from-[var(--text-primary)] to-[var(--accent-pink)] bg-clip-text text-transparent">
                Our Values
              </h2>
              <p className="text-lg text-[var(--text-secondary)] max-w-[600px] mx-auto leading-relaxed">
                The principles that guide everything we do at Kyoto Scribe
              </p>
            </div>

            <div className="values-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="value-item bg-[var(--card-bg)] backdrop-blur-[20px] border border-[var(--card-border)] rounded-2xl p-6 text-center transition-all duration-300 hover:transform hover:translate-y-[-4px]">
                <div className="value-icon text-4xl mb-4">🔒</div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Privacy First</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  Your learning data is yours alone. We implement strong security practices to protect your information.
                </p>
              </div>

              <div className="value-item bg-[var(--card-bg)] backdrop-blur-[20px] border border-[var(--card-border)] rounded-2xl p-6 text-center transition-all duration-300 hover:transform hover:translate-y-[-4px]">
                <div className="value-icon text-4xl mb-4">🌟</div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Quality</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  We're committed to delivering accurate, well-structured notes that truly help you learn.
                </p>
              </div>

              <div className="value-item bg-[var(--card-bg)] backdrop-blur-[20px] border border-[var(--card-border)] rounded-2xl p-6 text-center transition-all duration-300 hover:transform hover:translate-y-[-4px]">
                <div className="value-icon text-4xl mb-4">🤝</div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Accessibility</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  Learning should be available to everyone, regardless of background or ability.
                </p>
              </div>

              <div className="value-item bg-[var(--card-bg)] backdrop-blur-[20px] border border-[var(--card-border)] rounded-2xl p-6 text-center transition-all duration-300 hover:transform hover:translate-y-[-4px]">
                <div className="value-icon text-4xl mb-4">🚀</div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Innovation</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  We continuously improve our AI and add new features based on user needs and feedback.
                </p>
              </div>
            </div>
          </section>

          {/* Technology Section */}
          <section className="technology-section py-20">
            <div className="bg-gradient-to-br from-[var(--card-bg)] to-[var(--accent-pink-soft)] backdrop-blur-[20px] border border-[var(--card-border)] rounded-3xl p-12 relative overflow-hidden">
              <div className="absolute -top-1/2 -right-1/2 w-[200%] h-[200%] bg-gradient-radial from-[var(--accent-pink-soft)] to-transparent opacity-20"></div>
              
              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="tech-info">
                  <h2 className="text-4xl font-bold mb-6 bg-gradient-to-br from-[var(--text-primary)] to-[var(--accent-pink)] bg-clip-text text-transparent">
                    Powered by Advanced AI
                  </h2>
                  <p className="text-lg text-[var(--text-secondary)] leading-relaxed mb-6">
                    Kyoto Scribe leverages Google's Gemini 2.5 Flash, one of the most advanced AI models available, 
                    to understand and process video content with remarkable accuracy and insight.
                  </p>
                  
                  <div className="tech-features space-y-4">
                    <div className="tech-feature flex items-center gap-3">
                      <div className="feature-icon w-8 h-8 bg-gradient-to-br from-[var(--accent-pink)] to-[#FF8FB3] rounded-lg flex items-center justify-center text-sm">
                        🧠
                      </div>
                      <div>
                        <h4 className="font-semibold text-[var(--text-primary)]">Intelligent Content Analysis</h4>
                        <p className="text-sm text-[var(--text-secondary)]">Understands context, identifies key concepts, and maintains accuracy</p>
                      </div>
                    </div>
                    
                    <div className="tech-feature flex items-center gap-3">
                      <div className="feature-icon w-8 h-8 bg-gradient-to-br from-[var(--accent-pink)] to-[#FF8FB3] rounded-lg flex items-center justify-center text-sm">
                        📊
                      </div>
                      <div>
                        <h4 className="font-semibold text-[var(--text-primary)]">Smart Formatting</h4>
                        <p className="text-sm text-[var(--text-secondary)]">Automatically organizes information into digestible, logical structures</p>
                      </div>
                    </div>
                    
                    <div className="tech-feature flex items-center gap-3">
                      <div className="feature-icon w-8 h-8 bg-gradient-to-br from-[var(--accent-pink)] to-[#FF8FB3] rounded-lg flex items-center justify-center text-sm">
                        🔄
                      </div>
                      <div>
                        <h4 className="font-semibold text-[var(--text-primary)]">Continuous Learning</h4>
                        <p className="text-sm text-[var(--text-secondary)]">Our AI improves with every video processed and user interaction</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="tech-visual text-center">
                  <div className="ai-showcase">
                    <div className="ai-icon text-6xl mb-6 animate-pulse">
                      🤖
                    </div>
                    <div className="processing-demo bg-[var(--card-bg)] backdrop-blur-[20px] border border-[var(--card-border)] rounded-2xl p-6">
                      <h4 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Processing Pipeline</h4>
                      <div className="pipeline-steps space-y-3 text-left">
                        <div className="step flex items-center gap-3 text-sm">
                          <div className="step-number w-6 h-6 bg-[var(--accent-pink)] text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
                          <span className="text-[var(--text-secondary)]">Video Analysis & Transcription</span>
                        </div>
                        <div className="step flex items-center gap-3 text-sm">
                          <div className="step-number w-6 h-6 bg-[var(--accent-pink)] text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
                          <span className="text-[var(--text-secondary)]">Content Understanding & Extraction</span>
                        </div>
                        <div className="step flex items-center gap-3 text-sm">
                          <div className="step-number w-6 h-6 bg-[var(--accent-pink)] text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
                          <span className="text-[var(--text-secondary)]">Intelligent Formatting & Structure</span>
                        </div>
                        <div className="step flex items-center gap-3 text-sm">
                          <div className="step-number w-6 h-6 bg-[var(--accent-pink)] text-white rounded-full flex items-center justify-center text-xs font-bold">4</div>
                          <span className="text-[var(--text-secondary)]">Beautiful Notes Delivery</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Team Section */}
          <section className="team-section py-20 text-center">
            <div className="mb-12">
              <h2 className="text-4xl font-bold mb-4 bg-gradient-to-br from-[var(--text-primary)] to-[var(--accent-pink)] bg-clip-text text-transparent">
                Built with ❤️ for Learners
              </h2>
              <p className="text-lg text-[var(--text-secondary)] max-w-[600px] mx-auto leading-relaxed">
                Kyoto Scribe is a passion project built with love by one developer and their AI companion, Claude Code, working together to make learning more accessible and enjoyable for everyone.
              </p>
            </div>

            <div className="contact-info bg-[var(--card-bg)] backdrop-blur-[20px] border border-[var(--card-border)] rounded-2xl p-8 max-w-2xl mx-auto">
              <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-4">Get in Touch</h3>
              <p className="text-[var(--text-secondary)] mb-6">
                Have questions, feedback, or just want to say hi to Kyoto? We'd love to hear from you!
              </p>
              <div className="contact-options space-y-3">
                <div className="contact-item">
                  <span className="text-[var(--text-primary)] font-medium">Support & Feedback: </span>
                  <span className="text-[var(--text-secondary)]">Available through our roadmap and community forums</span>
                </div>
                <div className="contact-item">
                  <span className="text-[var(--text-primary)] font-medium">Feature Requests: </span>
                  <span className="text-[var(--text-secondary)]">Visit our roadmap page to see what's coming and suggest new ideas</span>
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