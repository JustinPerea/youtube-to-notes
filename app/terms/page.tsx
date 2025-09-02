import { Footer } from '../../components/Footer';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import { OrbBackground } from '../../components/ui/OrbBackground';

export default function TermsOfService() {
  return (
    <main className="min-h-screen">
      {/* Animated Orbs Background */}
      <OrbBackground />
      
      {/* Content Wrapper */}
      <div className="content-wrapper relative z-10">
        {/* Theme Toggle */}
        <ThemeToggle />
        
        {/* Main Container */}
        <div className="container max-w-4xl mx-auto pt-[100px] pb-10 px-5">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-br from-[var(--text-primary)] to-[var(--accent-pink)] bg-clip-text text-transparent">
              Terms of Service
            </h1>
            <p className="text-lg text-[var(--text-secondary)]">
              Your agreement for using Kyoto Scribe
            </p>
            <p className="text-sm text-[var(--text-muted)] mt-2">
              Effective Date: September 1, 2025 | Last Updated: September 1, 2025
            </p>
          </div>

          {/* Content */}
          <div className="prose prose-lg max-w-none">
            <div className="bg-[var(--card-bg)] backdrop-blur-[20px] border border-[var(--card-border)] rounded-2xl p-8 mb-8">
              
              {/* AI Bot Disclosure */}
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8 rounded">
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center mr-3 mt-1 text-white text-xs font-bold">AI</div>
                  <div>
                    <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                      AI System Disclosure
                    </h3>
                    <p className="text-yellow-700 text-sm">
                      <strong>California SB 1001 Compliance:</strong> You are interacting with an AI-powered educational system, 
                      not a human tutor. This service uses artificial intelligence to generate study materials that may contain errors.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-8 text-[var(--text-secondary)]">
                
                {/* Acceptance */}
                <section>
                  <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">1. Acceptance of Terms</h2>
                  <p className="leading-relaxed mb-4">
                    By accessing or using Kyoto Scribe ("Service"), you agree to be bound by these Terms of Service ("Terms"). 
                    If you disagree with any part of these terms, you may not access the Service.
                  </p>
                  <p className="leading-relaxed">
                    These terms apply to all visitors, users, and others who access or use the Service.
                  </p>
                </section>

                {/* Service Description */}
                <section>
                  <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">2. Service Description</h2>
                  <p className="leading-relaxed mb-4">
                    Kyoto Scribe is an AI-powered educational platform that:
                  </p>
                  <ul className="list-disc pl-6 mb-4 space-y-2">
                    <li>Transforms YouTube videos into structured study notes using Google Gemini AI</li>
                    <li>Provides various note formats (summaries, study guides, presentation slides)</li>
                    <li>Offers both free and premium service tiers</li>
                    <li>Serves as a supplemental learning tool for educational content</li>
                  </ul>
                  
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h4 className="font-semibold text-red-800 mb-2">Important Limitations</h4>
                    <ul className="text-red-700 text-sm space-y-1">
                      <li>• AI-generated content may contain errors and should be verified</li>
                      <li>• This is NOT a replacement for professional education or tutoring</li>
                      <li>• Generated notes are for supplemental learning purposes only</li>
                      <li>• We do not guarantee 100% accuracy of AI outputs</li>
                    </ul>
                  </div>
                </section>

                {/* User Accounts */}
                <section>
                  <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">3. User Accounts</h2>
                  <p className="leading-relaxed mb-4">
                    <strong>Account Requirements:</strong>
                  </p>
                  <ul className="list-disc pl-6 mb-4 space-y-2">
                    <li>You must be at least 13 years old to use this Service</li>
                    <li>You must provide accurate registration information</li>
                    <li>You are responsible for maintaining account security</li>
                    <li>One person may not maintain more than one account</li>
                  </ul>
                  
                  <p className="leading-relaxed">
                    <strong>Account Security:</strong> You are responsible for all activities under your account. 
                    Notify us immediately of any unauthorized access.
                  </p>
                </section>

                {/* Service Tiers */}
                <section>
                  <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">4. Service Tiers</h2>
                  
                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Free Tier</h3>
                      <ul className="text-sm space-y-1">
                        <li>• Limited monthly usage</li>
                        <li>• Basic note formats</li>
                        <li>• Community support</li>
                        <li>• Usage data may help improve AI</li>
                      </ul>
                    </div>
                    
                    <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                      <h3 className="text-lg font-semibold text-blue-800 mb-2">Premium Tier</h3>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• Unlimited monthly usage</li>
                        <li>• Advanced note formats</li>
                        <li>• Priority support</li>
                        <li>• Enhanced data protection</li>
                      </ul>
                    </div>
                  </div>
                  
                  <p className="text-sm text-[var(--text-muted)]">
                    Pricing and features subject to change. Current subscribers will be notified 30 days before any changes.
                  </p>
                </section>

                {/* Acceptable Use */}
                <section>
                  <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">5. Acceptable Use Policy</h2>
                  
                  <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-3">Permitted Uses</h3>
                  <ul className="list-disc pl-6 mb-4 space-y-2">
                    <li>Generate study notes from publicly accessible YouTube videos</li>
                    <li>Create educational materials for personal learning</li>
                    <li>Use AI features for legitimate educational purposes</li>
                    <li>Share generated content for non-commercial educational use</li>
                  </ul>

                  <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-3">Prohibited Uses</h3>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Process private, restricted, or copyrighted content without permission</li>
                    <li>Use for academic dishonesty, cheating, or plagiarism</li>
                    <li>Attempt to reverse engineer or copy our AI technology</li>
                    <li>Circumvent usage limitations or safety measures</li>
                    <li>Use generated content for commercial purposes without permission</li>
                    <li>Violate YouTube's Terms of Service or any applicable laws</li>
                    <li>Harass, abuse, or harm other users</li>
                  </ul>
                </section>

                {/* Intellectual Property */}
                <section>
                  <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">6. Intellectual Property</h2>
                  
                  <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-3">Your Content</h3>
                  <p className="leading-relaxed mb-4">
                    You retain ownership of notes and annotations you create. You grant us a license to process and 
                    store your content for service provision only.
                  </p>

                  <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-3">AI-Generated Content</h3>
                  <p className="leading-relaxed mb-4">
                    Study notes generated by our AI are provided for your personal educational use. You may use, modify, 
                    and share this content for non-commercial educational purposes. Commercial use requires written permission.
                  </p>

                  <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-3">YouTube Content</h3>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>We access YouTube videos only through official YouTube API</li>
                    <li>We do not download, store, or redistribute video content</li>
                    <li>All rights in original videos remain with their creators</li>
                    <li>You must respect YouTube's Terms of Service</li>
                  </ul>
                </section>

                {/* Privacy */}
                <section>
                  <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">7. Privacy and Data Protection</h2>
                  <p className="leading-relaxed mb-4">
                    Your privacy is important to us. Our collection, use, and protection of your personal information 
                    is governed by our{' '}
                    <a href="/privacy" className="text-blue-600 hover:underline font-medium">Privacy Policy</a>.
                  </p>
                  <p className="leading-relaxed">
                    Key points: We don't sell your data, we use industry-standard security measures, and you have 
                    rights to access, correct, and delete your information.
                  </p>
                </section>

                {/* Disclaimers */}
                <section>
                  <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">8. Disclaimers and Limitations</h2>
                  
                  <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-3">Service Warranty</h3>
                  <p className="leading-relaxed mb-4">
                    THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. We don't guarantee uninterrupted, 
                    error-free, or completely accurate service.
                  </p>

                  <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-3">AI Content Disclaimer</h3>
                  <div className="bg-gray-50 p-4 rounded border mb-4">
                    <p className="font-semibold text-gray-800 mb-2">
                      AI-Generated Content May Be Inaccurate
                    </p>
                    <p className="text-sm text-gray-700">
                      Our AI system may produce content that is incorrect, incomplete, biased, or inappropriate. 
                      Users must verify all information and use critical thinking. We are not responsible for 
                      decisions made based on AI-generated content.
                    </p>
                  </div>

                  <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-3">Limitation of Liability</h3>
                  <p className="leading-relaxed">
                    To the maximum extent permitted by law, we are not liable for indirect, consequential, or punitive damages. 
                    Our total liability is limited to the amount you paid for the service in the past 12 months.
                  </p>
                </section>

                {/* Termination */}
                <section>
                  <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">9. Termination</h2>
                  
                  <p className="leading-relaxed mb-4">
                    <strong>You may terminate:</strong> Your account at any time through account settings.
                  </p>
                  
                  <p className="leading-relaxed mb-4">
                    <strong>We may terminate or suspend:</strong> Accounts that violate these terms, engage in 
                    fraudulent activity, or pose security risks.
                  </p>
                  
                  <p className="leading-relaxed">
                    <strong>Upon termination:</strong> Your access ends immediately, but you may export your data 
                    for 30 days. Certain provisions survive termination.
                  </p>
                </section>

                {/* Changes */}
                <section>
                  <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">10. Changes to Terms</h2>
                  <p className="leading-relaxed">
                    We may update these Terms from time to time. We will notify users of material changes via email 
                    or prominent notice on our platform. Continued use after changes constitutes acceptance of the updated Terms.
                  </p>
                </section>

                {/* Governing Law */}
                <section>
                  <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">11. Governing Law</h2>
                  <p className="leading-relaxed">
                    These Terms are governed by the laws of the jurisdiction where our business is established, 
                    without regard to conflict of law provisions. Any disputes will be resolved in the appropriate 
                    courts of that jurisdiction.
                  </p>
                </section>

                {/* Contact */}
                <section>
                  <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">12. Contact Information</h2>
                  <div className="bg-gray-50 p-6 rounded-lg border">
                    <p className="leading-relaxed mb-4">
                      If you have questions about these Terms of Service, please contact us:
                    </p>
                    <ul className="space-y-2">
                      <li><strong>Email:</strong> <a href="mailto:support@kyotoscribe.com" className="text-blue-600 hover:underline">support@kyotoscribe.com</a></li>
                      <li><strong>General:</strong> <a href="mailto:contact@kyotoscribe.com" className="text-blue-600 hover:underline">contact@kyotoscribe.com</a></li>
                      <li><strong>Website:</strong> <a href="/" className="text-blue-600 hover:underline">kyotoscribe.com</a></li>
                    </ul>
                    <p className="mt-4 text-sm text-gray-600">
                      We will respond to your inquiry within 5 business days.
                    </p>
                  </div>
                </section>

              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <Footer />
      </div>
    </main>
  );
}