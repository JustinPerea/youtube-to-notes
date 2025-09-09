import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact Us - Kyoto Scribe',
  description: 'Get in touch with Kyoto Scribe for support, feedback, or business inquiries.',
}

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-900">
      <div className="container max-w-6xl mx-auto px-5 py-20">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
            Contact Us
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            We'd love to hear from you! Whether you have questions, feedback, or need support, 
            we're here to help.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Information */}
          <div className="space-y-8">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-6">
                Get in Touch
              </h2>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    📧
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-1">General Support</h3>
                    <p className="text-slate-600 dark:text-slate-300 text-sm mb-2">
                      For general questions, support, and feedback
                    </p>
                    <a 
                      href="mailto:support@kyotoscribe.com" 
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      support@kyotoscribe.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                    🛡️
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-1">Security Issues</h3>
                    <p className="text-slate-600 dark:text-slate-300 text-sm mb-2">
                      Report security vulnerabilities or concerns
                    </p>
                    <a 
                      href="mailto:security@kyotoscribe.com" 
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      security@kyotoscribe.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                    ⚖️
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-1">Legal & DMCA</h3>
                    <p className="text-slate-600 dark:text-slate-300 text-sm mb-2">
                      Copyright claims and legal matters
                    </p>
                    <a 
                      href="mailto:dmca@kyotoscribe.com" 
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      dmca@kyotoscribe.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
                    ♿
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-1">Accessibility</h3>
                    <p className="text-slate-600 dark:text-slate-300 text-sm mb-2">
                      Accessibility feedback and support
                    </p>
                    <a 
                      href="mailto:accessibility@kyotoscribe.com" 
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      accessibility@kyotoscribe.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-pink-100 dark:bg-pink-900 rounded-full flex items-center justify-center">
                    💼
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-1">Business Inquiries</h3>
                    <p className="text-slate-600 dark:text-slate-300 text-sm mb-2">
                      Partnerships, enterprise, and business opportunities
                    </p>
                    <a 
                      href="mailto:business@kyotoscribe.com" 
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      business@kyotoscribe.com
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Business Information */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-6">
                Business Information
              </h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-1">Company Name</h3>
                  <p className="text-slate-600 dark:text-slate-300">Kyoto Scribe</p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-1">Service Description</h3>
                  <p className="text-slate-600 dark:text-slate-300">
                    AI-powered video content transformation platform that converts YouTube videos 
                    into educational notes, summaries, and study materials.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-1">Founded</h3>
                  <p className="text-slate-600 dark:text-slate-300">2024</p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-1">Response Time</h3>
                  <p className="text-slate-600 dark:text-slate-300">
                    We typically respond to all inquiries within 24-48 hours during business days.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-6">
              Send us a Message
            </h2>
            
            <form className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    placeholder="your@email.com"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Subject *
                </label>
                <select
                  id="subject"
                  name="subject"
                  required
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="">Select a subject</option>
                  <option value="general">General Support</option>
                  <option value="technical">Technical Issue</option>
                  <option value="billing">Billing Question</option>
                  <option value="feature">Feature Request</option>
                  <option value="accessibility">Accessibility</option>
                  <option value="security">Security Issue</option>
                  <option value="business">Business Inquiry</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={6}
                  required
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white resize-vertical"
                  placeholder="Please describe your question or issue in detail..."
                ></textarea>
              </div>
              
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="privacy"
                  name="privacy"
                  required
                  className="mt-1 w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="privacy" className="text-sm text-slate-600 dark:text-slate-300">
                  I agree to the{' '}
                  <a href="/privacy" className="text-blue-600 dark:text-blue-400 hover:underline">
                    Privacy Policy
                  </a>{' '}
                  and consent to the processing of my personal data for the purpose of responding to this inquiry. *
                </label>
              </div>
              
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
              >
                Send Message
              </button>
            </form>
            
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Note:</strong> This contact form is currently for display purposes. 
                Please use the email addresses above for direct communication.
              </p>
            </div>
          </div>
        </div>

        {/* Additional Resources */}
        <div className="mt-16">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white text-center mb-8">
            Additional Resources
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <a 
              href="/privacy" 
              className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow text-center group"
            >
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                🔒
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Privacy Policy</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Learn how we protect and handle your personal data
              </p>
            </a>
            
            <a 
              href="/legal/security" 
              className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow text-center group"
            >
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                🛡️
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Security Policy</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Our security measures and data protection practices
              </p>
            </a>
            
            <a 
              href="/legal/accessibility" 
              className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow text-center group"
            >
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                ♿
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Accessibility</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Our commitment to digital accessibility
              </p>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
