'use client';

export function Footer() {
  // Helper function to handle navigation to tabbed sections
  const handleTabNavigation = (hash: string) => {
    // Update the URL hash
    window.location.hash = hash;
    
    // Scroll to the tabbed navigation component (not tabbed-section)
    if (typeof document !== 'undefined' && document.body) {
      const tabbedSection = document.querySelector('.tabbed-navigation');
      if (tabbedSection) {
        tabbedSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };
  return (
    <footer className="footer bg-[var(--card-bg)] backdrop-blur-[20px] border-t border-[var(--card-border)] pt-20 pb-10 mt-16">
      <div className="footer-content max-w-[1200px] mx-auto px-5 grid grid-cols-1 md:grid-cols-4 gap-15">
        <div>
          <div className="footer-brand flex items-start gap-3 mb-4">
            <div className="shiba-icon w-9 h-9 bg-gradient-to-br from-[var(--accent-pink)] to-[#FF8FB3] rounded-[10px] flex items-center justify-center text-xl shadow-[0_2px_8px_rgba(255,107,157,0.2)]">
              🐕
            </div>
            <div className="footer-logo text-xl font-bold text-[var(--text-primary)]">
              Kyoto Scribe
            </div>
          </div>
          <p className="footer-description text-[var(--text-secondary)] leading-relaxed text-sm">
            Transform any YouTube video into comprehensive notes with the power of AI.
            Named after our founder's loyal Shiba Inu who loves to learn alongside you.
          </p>
        </div>
        
        <div className="footer-column">
          <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-4 uppercase tracking-wide">
            Product
          </h4>
          <button 
            onClick={() => handleTabNavigation('#features')}
            className="footer-link block text-[var(--text-secondary)] text-sm mb-3 transition-colors duration-300 hover:text-[var(--accent-pink)] bg-transparent border-none cursor-pointer text-left"
          >
            Features
          </button>
          <button 
            onClick={() => handleTabNavigation('#pricing')}
            className="footer-link block text-[var(--text-secondary)] text-sm mb-3 transition-colors duration-300 hover:text-[var(--accent-pink)] bg-transparent border-none cursor-pointer text-left"
          >
            Pricing
          </button>
        </div>
        
        <div className="footer-column">
          <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-4 uppercase tracking-wide">
            Company
          </h4>
          <button 
            onClick={() => handleTabNavigation('#about')}
            className="footer-link block text-[var(--text-secondary)] text-sm mb-3 transition-colors duration-300 hover:text-[var(--accent-pink)] bg-transparent border-none cursor-pointer text-left"
          >
            About
          </button>
          <a href="/roadmap" className="footer-link block text-[var(--text-secondary)] text-sm mb-3 transition-colors duration-300 hover:text-[var(--accent-pink)]">
            Roadmap
          </a>
        </div>
        
        <div className="footer-column">
          <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-4 uppercase tracking-wide">
            Legal
          </h4>
          <a href="/privacy" className="footer-link block text-[var(--text-secondary)] text-sm mb-3 transition-colors duration-300 hover:text-[var(--accent-pink)]">
            Privacy Policy
          </a>
          <a href="/terms" className="footer-link block text-[var(--text-secondary)] text-sm mb-3 transition-colors duration-300 hover:text-[var(--accent-pink)]">
            Terms of Service
          </a>
          <a href="/privacy/cookies" className="footer-link block text-[var(--text-secondary)] text-sm mb-3 transition-colors duration-300 hover:text-[var(--accent-pink)]">
            Cookie Policy
          </a>
        </div>
      </div>
    </footer>
  );
}