'use client';

export function Footer() {
  return (
    <footer className="footer bg-[var(--card-bg)] backdrop-blur-[20px] border-t border-[var(--card-border)] pt-15 pb-10 mt-25">
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
          <a href="#" className="footer-link block text-[var(--text-secondary)] text-sm mb-3 transition-colors duration-300 hover:text-[var(--accent-pink)]">
            Features
          </a>
          <a href="#" className="footer-link block text-[var(--text-secondary)] text-sm mb-3 transition-colors duration-300 hover:text-[var(--accent-pink)]">
            Pricing
          </a>
          <a href="#" className="footer-link block text-[var(--text-secondary)] text-sm mb-3 transition-colors duration-300 hover:text-[var(--accent-pink)]">
            API
          </a>
          <a href="#" className="footer-link block text-[var(--text-secondary)] text-sm mb-3 transition-colors duration-300 hover:text-[var(--accent-pink)]">
            Integrations
          </a>
        </div>
        
        <div className="footer-column">
          <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-4 uppercase tracking-wide">
            Company
          </h4>
          <a href="#" className="footer-link block text-[var(--text-secondary)] text-sm mb-3 transition-colors duration-300 hover:text-[var(--accent-pink)]">
            About
          </a>
          <a href="#" className="footer-link block text-[var(--text-secondary)] text-sm mb-3 transition-colors duration-300 hover:text-[var(--accent-pink)]">
            Blog
          </a>
          <a href="#" className="footer-link block text-[var(--text-secondary)] text-sm mb-3 transition-colors duration-300 hover:text-[var(--accent-pink)]">
            Careers
          </a>
          <a href="#" className="footer-link block text-[var(--text-secondary)] text-sm mb-3 transition-colors duration-300 hover:text-[var(--accent-pink)]">
            Contact
          </a>
        </div>
        
        <div className="footer-column">
          <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-4 uppercase tracking-wide">
            Legal
          </h4>
          <a href="#" className="footer-link block text-[var(--text-secondary)] text-sm mb-3 transition-colors duration-300 hover:text-[var(--accent-pink)]">
            Privacy
          </a>
          <a href="#" className="footer-link block text-[var(--text-secondary)] text-sm mb-3 transition-colors duration-300 hover:text-[var(--accent-pink)]">
            Terms
          </a>
          <a href="#" className="footer-link block text-[var(--text-secondary)] text-sm mb-3 transition-colors duration-300 hover:text-[var(--accent-pink)]">
            Security
          </a>
          <a href="#" className="footer-link block text-[var(--text-secondary)] text-sm mb-3 transition-colors duration-300 hover:text-[var(--accent-pink)]">
            GDPR
          </a>
        </div>
      </div>
    </footer>
  );
}