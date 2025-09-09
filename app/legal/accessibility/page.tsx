import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Accessibility Statement - Kyoto Scribe',
  description: 'Accessibility commitment and compliance information for Kyoto Scribe.',
}

export default function AccessibilityStatementPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-900">
      <div className="container max-w-4xl mx-auto px-5 py-20">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 md:p-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
              Accessibility Statement
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-300">
              Our Commitment to Digital Accessibility
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              Last updated: {new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>

          <div className="prose prose-lg max-w-none dark:prose-invert">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
                Our Commitment
              </h2>
              <p className="text-slate-600 dark:text-slate-300 mb-4">
                Kyoto Scribe is committed to ensuring digital accessibility for people with disabilities. 
                We are continually improving the user experience for everyone and applying the relevant 
                accessibility standards to make our website accessible to all users.
              </p>
              <p className="text-slate-600 dark:text-slate-300">
                We believe that learning and education should be accessible to everyone, regardless of 
                their abilities or the technologies they use to access our content.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
                Accessibility Standards
              </h2>
              <p className="text-slate-600 dark:text-slate-300 mb-4">
                We aim to conform to the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA standards. 
                These guidelines help make web content more accessible to people with disabilities and 
                user-friendly for everyone.
              </p>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 mb-4">
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
                  WCAG 2.1 Level AA Compliance
                </h3>
                <p className="text-blue-800 dark:text-blue-200 text-sm mb-3">
                  We strive to meet the following accessibility principles:
                </p>
                <ul className="text-blue-800 dark:text-blue-200 text-sm space-y-1">
                  <li>• <strong>Perceivable:</strong> Information and UI components are presentable in ways users can perceive</li>
                  <li>• <strong>Operable:</strong> UI components and navigation are operable by all users</li>
                  <li>• <strong>Understandable:</strong> Information and UI operation are understandable</li>
                  <li>• <strong>Robust:</strong> Content can be interpreted reliably by a wide variety of assistive technologies</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
                Accessibility Features
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 pl-4 py-3">
                    <h3 className="font-semibold text-green-900 dark:text-green-100">Keyboard Navigation</h3>
                    <p className="text-green-800 dark:text-green-200 text-sm">
                      All interactive elements can be accessed using only a keyboard
                    </p>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 pl-4 py-3">
                    <h3 className="font-semibold text-blue-900 dark:text-blue-100">Screen Reader Support</h3>
                    <p className="text-blue-800 dark:text-blue-200 text-sm">
                      Proper ARIA labels and semantic HTML for screen reader compatibility
                    </p>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 border-l-4 border-purple-500 pl-4 py-3">
                    <h3 className="font-semibold text-purple-900 dark:text-purple-100">Color Contrast</h3>
                    <p className="text-purple-800 dark:text-purple-200 text-sm">
                      High contrast ratios between text and background colors
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="bg-orange-50 dark:bg-orange-900/20 border-l-4 border-orange-500 pl-4 py-3">
                    <h3 className="font-semibold text-orange-900 dark:text-orange-100">Responsive Design</h3>
                    <p className="text-orange-800 dark:text-orange-200 text-sm">
                      Works on all devices and screen sizes
                    </p>
                  </div>
                  <div className="bg-indigo-50 dark:bg-indigo-900/20 border-l-4 border-indigo-500 pl-4 py-3">
                    <h3 className="font-semibold text-indigo-900 dark:text-indigo-100">Alternative Text</h3>
                    <p className="text-indigo-800 dark:text-indigo-200 text-sm">
                      Descriptive alt text for all images and visual elements
                    </p>
                  </div>
                  <div className="bg-pink-50 dark:bg-pink-900/20 border-l-4 border-pink-500 pl-4 py-3">
                    <h3 className="font-semibold text-pink-900 dark:text-pink-100">Focus Indicators</h3>
                    <p className="text-pink-800 dark:text-pink-200 text-sm">
                      Clear visual indicators for keyboard focus
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
                Assistive Technologies
              </h2>
              <p className="text-slate-600 dark:text-slate-300 mb-4">
                Our website is designed to work with a variety of assistive technologies:
              </p>
              <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-2 mb-4">
                <li><strong>Screen Readers:</strong> NVDA, JAWS, VoiceOver, TalkBack</li>
                <li><strong>Voice Control Software:</strong> Dragon NaturallySpeaking, Voice Control</li>
                <li><strong>Switch Navigation:</strong> Compatible with switch access devices</li>
                <li><strong>Magnification Software:</strong> ZoomText, Windows Magnifier, macOS Zoom</li>
                <li><strong>High Contrast Mode:</strong> Compatible with system high contrast settings</li>
                <li><strong>Keyboard-Only Navigation:</strong> Full functionality without mouse</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
                Known Limitations
              </h2>
              <p className="text-slate-600 dark:text-slate-300 mb-4">
                While we strive to make our website fully accessible, we acknowledge that there may be 
                some limitations. We are continuously working to improve accessibility:
              </p>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 pl-4 py-3 mb-4">
                <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">Areas Under Improvement</h3>
                <ul className="text-yellow-800 dark:text-yellow-200 text-sm space-y-1">
                  <li>• Some complex interactive elements may need additional ARIA labels</li>
                  <li>• Video content processing interface could benefit from more detailed instructions</li>
                  <li>• Some form validation messages could be more descriptive</li>
                </ul>
              </div>
              <p className="text-slate-600 dark:text-slate-300">
                We are actively working to address these limitations and improve the overall accessibility 
                of our platform.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
                Testing & Evaluation
              </h2>
              <p className="text-slate-600 dark:text-slate-300 mb-4">
                We regularly test our website for accessibility compliance using:
              </p>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
                    Automated Testing
                  </h3>
                  <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-2">
                    <li>• axe-core accessibility testing</li>
                    <li>• WAVE (Web Accessibility Evaluation Tool)</li>
                    <li>• Lighthouse accessibility audits</li>
                    <li>• Continuous integration testing</li>
                  </ul>
                </div>
                <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
                    Manual Testing
                  </h3>
                  <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-2">
                    <li>• Keyboard-only navigation testing</li>
                    <li>• Screen reader compatibility testing</li>
                    <li>• Color contrast verification</li>
                    <li>• User experience testing with assistive technologies</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
                Feedback & Support
              </h2>
              <p className="text-slate-600 dark:text-slate-300 mb-4">
                We welcome your feedback on the accessibility of our website. If you encounter any 
                accessibility barriers or have suggestions for improvement, please contact us:
              </p>
              <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-6 mb-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
                  Accessibility Support
                </h3>
                <p className="text-slate-600 dark:text-slate-300">
                  <strong>Email:</strong> support@shibabrothers.com<br/>
                  <strong>Subject:</strong> Accessibility Feedback<br/>
                  <strong>Response Time:</strong> 48-72 hours<br/>
                  <strong>Alternative Contact:</strong> support@shibabrothers.com
                </p>
              </div>
              <p className="text-slate-600 dark:text-slate-300">
                When contacting us about accessibility issues, please include:
              </p>
              <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-1 mt-2">
                <li>The specific page or feature you're having trouble with</li>
                <li>The assistive technology you're using (if applicable)</li>
                <li>Your browser and operating system</li>
                <li>A description of the accessibility barrier you encountered</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
                Alternative Access Methods
              </h2>
              <p className="text-slate-600 dark:text-slate-300 mb-4">
                If you're having difficulty accessing any part of our website, we offer alternative 
                ways to access our services:
              </p>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
                  Alternative Support Options
                </h3>
                <ul className="text-blue-800 dark:text-blue-200 text-sm space-y-2">
                  <li>• <strong>Email Support:</strong> Direct assistance via email for any accessibility needs</li>
                  <li>• <strong>Phone Support:</strong> Available for users who prefer voice communication</li>
                  <li>• <strong>Alternative Formats:</strong> We can provide content in alternative formats when requested</li>
                  <li>• <strong>Personal Assistance:</strong> One-on-one help with using our platform</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
                Legal Compliance
              </h2>
              <p className="text-slate-600 dark:text-slate-300 mb-4">
                We are committed to complying with applicable accessibility laws and regulations, including:
              </p>
              <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-2 mb-4">
                <li><strong>Americans with Disabilities Act (ADA):</strong> Ensuring equal access to our digital services</li>
                <li><strong>Section 508:</strong> Compliance with federal accessibility standards</li>
                <li><strong>WCAG 2.1 Level AA:</strong> Following international web accessibility guidelines</li>
                <li><strong>Local Accessibility Laws:</strong> Complying with applicable regional accessibility requirements</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
                Updates to This Statement
              </h2>
              <p className="text-slate-600 dark:text-slate-300">
                We will review and update this accessibility statement regularly to reflect our ongoing 
                commitment to accessibility. When we make significant changes, we'll update the 
                "Last updated" date at the top of this page.
              </p>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-700">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
              <a 
                href="/legal" 
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                ← Back to Legal
              </a>
              <a 
                href="/" 
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Return to Home
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
