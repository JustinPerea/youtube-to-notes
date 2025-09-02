import { Footer } from '../../components/Footer';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import { OrbBackground } from '../../components/ui/OrbBackground';

export default function PrivacyPolicy() {
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
              Privacy Policy
            </h1>
            <p className="text-lg text-[var(--text-secondary)]">
              How we collect, use, and protect your information
            </p>
            <p className="text-sm text-[var(--text-muted)] mt-2">
              Effective Date: September 1, 2025 | Last Updated: September 1, 2025
            </p>
          </div>

          {/* Content */}
          <div className="prose prose-lg max-w-none">
            <div className="bg-[var(--card-bg)] backdrop-blur-[20px] border border-[var(--card-border)] rounded-2xl p-8 mb-8">
              
              {/* AI Disclosure Banner */}
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-8 rounded">
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mr-3 mt-1 text-white text-xs font-bold">AI</div>
                  <div>
                    <h3 className="text-lg font-semibold text-blue-800 mb-2">
                      AI Transparency Notice
                    </h3>
                    <p className="text-blue-700 text-sm">
                      This platform uses artificial intelligence (Google Gemini AI) to generate study notes from YouTube videos. 
                      All AI-generated content is clearly marked and may contain errors that should be verified independently.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-8 text-[var(--text-secondary)]">
                
                {/* Introduction */}
                <section>
                  <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">1. Introduction</h2>
                  <p className="leading-relaxed mb-4">
                    Kyoto Scribe ("we," "us," or "our") operates an AI-powered educational platform that transforms YouTube videos 
                    into study notes. This Privacy Policy explains how we collect, use, and protect your information.
                  </p>
                  <p className="leading-relaxed">
                    We are committed to protecting your privacy and being transparent about our data practices, especially 
                    regarding our use of artificial intelligence.
                  </p>
                </section>

                {/* Information We Collect */}
                <section>
                  <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">2. Information We Collect</h2>
                  
                  <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-3">Information You Provide</h3>
                  <ul className="list-disc pl-6 mb-4 space-y-2">
                    <li><strong>Account Information:</strong> Name and email address (via Google OAuth)</li>
                    <li><strong>Content Data:</strong> YouTube video URLs you submit for AI processing</li>
                    <li><strong>Generated Notes:</strong> AI-created study materials you save or download</li>
                    <li><strong>User Settings:</strong> Your preferences and customizations</li>
                  </ul>

                  <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-3">Information Collected Automatically</h3>
                  <ul className="list-disc pl-6 mb-4 space-y-2">
                    <li><strong>Usage Data:</strong> How you interact with our platform and AI features</li>
                    <li><strong>Technical Data:</strong> Browser type, device information, IP address</li>
                    <li><strong>AI Processing Data:</strong> Interactions with our AI system for improvement</li>
                  </ul>
                </section>

                {/* How We Use Your Information */}
                <section>
                  <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">3. How We Use Your Information</h2>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><strong>Service Provision:</strong> Generate AI-powered study notes from your YouTube videos</li>
                    <li><strong>Account Management:</strong> Maintain your account and authenticate access</li>
                    <li><strong>Service Improvement:</strong> Enhance our AI capabilities and user experience</li>
                    <li><strong>Communication:</strong> Send important service updates and notifications</li>
                    <li><strong>Legal Compliance:</strong> Meet our regulatory obligations</li>
                  </ul>
                </section>

                {/* AI Processing */}
                <section>
                  <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">4. AI Processing & Third-Party Services</h2>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                    <h4 className="font-semibold text-yellow-800 mb-2">Google Gemini AI</h4>
                    <p className="text-yellow-700 text-sm">
                      We use Google's Gemini AI to process YouTube videos and generate study notes. Your content may be 
                      processed by Google's systems according to their privacy policies and terms of service.
                    </p>
                  </div>
                  
                  <p className="leading-relaxed mb-4">
                    <strong>Other Third-Party Services:</strong>
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><strong>Google OAuth:</strong> For secure account authentication</li>
                    <li><strong>YouTube API:</strong> To access video metadata and thumbnails</li>
                    <li><strong>Supabase:</strong> For secure data storage and database management</li>
                    <li><strong>Vercel:</strong> For hosting and content delivery</li>
                  </ul>
                </section>

                {/* Data Sharing */}
                <section>
                  <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">5. Data Sharing</h2>
                  <p className="leading-relaxed mb-4">
                    <strong>We do not sell your personal information.</strong> We only share data with:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><strong>Service Providers:</strong> Companies that help us operate our platform (Google, Supabase, Vercel)</li>
                    <li><strong>Legal Requirements:</strong> When required by law or to protect rights and safety</li>
                    <li><strong>Business Transfers:</strong> In case of merger, acquisition, or sale (users will be notified)</li>
                  </ul>
                </section>

                {/* Your Rights */}
                <section>
                  <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">6. Your Rights</h2>
                  <p className="leading-relaxed mb-4">You have the right to:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><strong>Access:</strong> Request a copy of your personal data</li>
                    <li><strong>Correct:</strong> Update inaccurate information</li>
                    <li><strong>Delete:</strong> Request deletion of your account and data</li>
                    <li><strong>Export:</strong> Download your data in a portable format</li>
                    <li><strong>Opt-Out:</strong> Limit certain data processing activities</li>
                  </ul>
                  <p className="mt-4 text-sm bg-gray-50 p-3 rounded border">
                    <strong>To exercise your rights:</strong> Contact us at{' '}
                    <a href="mailto:privacy@kyotoscribe.com" className="text-blue-600 hover:underline">
                      privacy@kyotoscribe.com
                    </a>{' '}
                    or through your account settings.
                  </p>
                </section>

                {/* Data Security */}
                <section>
                  <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">7. Data Security</h2>
                  <p className="leading-relaxed mb-4">
                    We implement industry-standard security measures to protect your information:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Encryption of data in transit and at rest</li>
                    <li>Secure authentication through Google OAuth</li>
                    <li>Regular security updates and monitoring</li>
                    <li>Limited access to personal data on a need-to-know basis</li>
                  </ul>
                </section>

                {/* Children's Privacy */}
                <section>
                  <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">8. Children's Privacy</h2>
                  <p className="leading-relaxed">
                    Our service is intended for users 13 years and older. We do not knowingly collect personal information 
                    from children under 13. If you believe we have collected such information, please contact us immediately.
                  </p>
                </section>

                {/* International Users */}
                <section>
                  <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">9. International Users</h2>
                  <p className="leading-relaxed mb-4">
                    Our services are operated from the United States. If you are located outside the US, your information 
                    may be transferred to and processed in the US, which may have different data protection laws than your country.
                  </p>
                  <p className="leading-relaxed">
                    <strong>EU/UK Users:</strong> We comply with GDPR requirements and your data protection rights as outlined above.
                  </p>
                </section>

                {/* Updates */}
                <section>
                  <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">10. Updates to This Policy</h2>
                  <p className="leading-relaxed">
                    We may update this Privacy Policy from time to time. We will notify you of any material changes by 
                    posting the new policy on this page and updating the "Last Updated" date. Your continued use of our 
                    service after changes constitutes acceptance of the updated policy.
                  </p>
                </section>

                {/* Contact */}
                <section>
                  <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">11. Contact Us</h2>
                  <div className="bg-gray-50 p-6 rounded-lg border">
                    <p className="leading-relaxed mb-4">
                      If you have questions about this Privacy Policy or our data practices, please contact us:
                    </p>
                    <ul className="space-y-2">
                      <li><strong>Email:</strong> <a href="mailto:support@kyotoscribe.com" className="text-blue-600 hover:underline">support@kyotoscribe.com</a></li>
                      <li><strong>General:</strong> <a href="mailto:contact@kyotoscribe.com" className="text-blue-600 hover:underline">contact@kyotoscribe.com</a></li>
                      <li><strong>Website:</strong> <a href="/" className="text-blue-600 hover:underline">kyotoscribe.com</a></li>
                    </ul>
                    <p className="mt-4 text-sm text-gray-600">
                      We will respond to your inquiry within 30 days.
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