'use client';

import type { Metadata } from 'next'
import { useState } from 'react';
import { OrbBackground } from '../../components/ui/OrbBackground';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import { Footer } from '../../components/Footer';
import { PricingTiers, PricingToggle } from '../../components/pricing/PricingTiers';

// Note: Since this is a client component, we can't export metadata directly
// The metadata will be handled differently for client components

export default function Pricing() {
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');

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
              Simple, Transparent Pricing
            </h1>
            <p className="hero-subtitle text-[22px] text-[var(--text-secondary)] mb-12 max-w-[700px] mx-auto leading-relaxed">
              Turn ANY YouTube video into study notes - unlimited, forever. Choose the plan that works best for your learning journey.
            </p>
          </section>

          {/* Pricing Section */}
          <section className="pricing-section py-10">
            <PricingToggle billing={billing} onBillingChange={setBilling} />
            <PricingTiers billing={billing} />
          </section>

          {/* FAQ Section */}
          <section className="faq-section py-20">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4 bg-gradient-to-br from-[var(--text-primary)] to-[var(--accent-pink)] bg-clip-text text-transparent">
                Common Questions
              </h2>
              <p className="text-lg text-[var(--text-secondary)] max-w-[600px] mx-auto leading-relaxed">
                What you need to know about our pricing and plans
              </p>
            </div>

            <div className="faq-grid grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div className="faq-item bg-[var(--card-bg)] backdrop-blur-[20px] border border-[var(--card-border)] rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">What's included in the Free plan?</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  The Free plan includes 5 videos per month with Basic Summary format, PDF export with watermark, 
                  100MB storage, and community support. Perfect for trying out our service.
                </p>
              </div>

              <div className="faq-item bg-[var(--card-bg)] backdrop-blur-[20px] border border-[var(--card-border)] rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Can I upgrade or downgrade anytime?</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, 
                  and we'll prorate your billing accordingly.
                </p>
              </div>

              <div className="faq-item bg-[var(--card-bg)] backdrop-blur-[20px] border border-[var(--card-border)] rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">What does "unlimited videos" mean?</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  With Student and Pro plans, you can process as many YouTube videos as you want each month. 
                  No caps, no restrictions - perfect for heavy learners and professionals.
                </p>
              </div>

              <div className="faq-item bg-[var(--card-bg)] backdrop-blur-[20px] border border-[var(--card-border)] rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">How does the AI chat feature work?</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  Our AI chat (Pro plan) lets you ask questions about your processed videos and notes. 
                  It's like having a study buddy that knows everything about your learning materials.
                </p>
              </div>

              <div className="faq-item bg-[var(--card-bg)] backdrop-blur-[20px] border border-[var(--card-border)] rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Is there a student discount?</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  Our Student plan is already designed with students in mind at an affordable price. 
                  We may introduce additional student verification discounts in the future.
                </p>
              </div>

              <div className="faq-item bg-[var(--card-bg)] backdrop-blur-[20px] border border-[var(--card-border)] rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">What payment methods do you accept?</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  We accept all major credit cards, debit cards, and digital payment methods through Stripe. 
                  Your payment information is always secure and encrypted.
                </p>
              </div>
            </div>
          </section>

          {/* Value Proposition */}
          <section className="value-section py-20">
            <div className="bg-gradient-to-br from-[var(--card-bg)] to-[var(--accent-pink-soft)] backdrop-blur-[20px] border border-[var(--card-border)] rounded-3xl p-12 text-center relative overflow-hidden">
              <div className="absolute -top-1/2 -right-1/2 w-[200%] h-[200%] bg-gradient-radial from-[var(--accent-pink-soft)] to-transparent opacity-30"></div>
              
              <div className="relative z-10">
                <h2 className="text-4xl font-bold mb-6 bg-gradient-to-br from-[var(--text-primary)] to-[var(--accent-pink)] bg-clip-text text-transparent">
                  Why Choose Kyoto Scribe?
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                  <div className="value-item">
                    <div className="value-icon text-4xl mb-4">💰</div>
                    <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Best Value</h3>
                    <p className="text-sm text-[var(--text-secondary)]">
                      Much cheaper than hiring tutors or buying multiple learning tools
                    </p>
                  </div>
                  
                  <div className="value-item">
                    <div className="value-icon text-4xl mb-4">🚀</div>
                    <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Time Saver</h3>
                    <p className="text-sm text-[var(--text-secondary)]">
                      Process hours of video content in minutes, not hours
                    </p>
                  </div>
                  
                  <div className="value-item">
                    <div className="value-icon text-4xl mb-4">🎯</div>
                    <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Always Improving</h3>
                    <p className="text-sm text-[var(--text-secondary)]">
                      Regular updates and new features based on user feedback
                    </p>
                  </div>
                </div>
                
                <p className="text-lg text-[var(--text-secondary)] mb-8 max-w-2xl mx-auto">
                  Start your learning journey with Kyoto Scribe and transform the way you 
                  consume educational content. Every video becomes an opportunity to learn more effectively.
                </p>
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