import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Security Policy - ShibaBrothers',
  description: 'Security measures and data protection policies for ShibaBrothers.',
}

export default function SecurityPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-900">
      <div className="container max-w-4xl mx-auto px-5 py-20">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 md:p-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
              Security Policy
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-300">
              Data Protection and Security Measures
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
                Our Commitment to Security
              </h2>
              <p className="text-slate-600 dark:text-slate-300 mb-4">
                At ShibaBrothers, we take the security of your data seriously. We implement industry-standard 
                security measures to protect your personal information, account data, and the content you 
                process through our service.
              </p>
              <p className="text-slate-600 dark:text-slate-300">
                This policy outlines our security practices, data protection measures, and your rights 
                regarding the security of your information.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
                Data Encryption
              </h2>
              <div className="space-y-4">
                <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 pl-4 py-3">
                  <h3 className="font-semibold text-green-900 dark:text-green-100">In Transit</h3>
                  <p className="text-green-800 dark:text-green-200 text-sm">
                    All data transmitted between your device and our servers is encrypted using TLS 1.3, 
                    the latest and most secure encryption protocol.
                  </p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 pl-4 py-3">
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100">At Rest</h3>
                  <p className="text-blue-800 dark:text-blue-200 text-sm">
                    All stored data is encrypted using AES-256 encryption, the same standard used by 
                    banks and government agencies.
                  </p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 border-l-4 border-purple-500 pl-4 py-3">
                  <h3 className="font-semibold text-purple-900 dark:text-purple-100">API Communications</h3>
                  <p className="text-purple-800 dark:text-purple-200 text-sm">
                    All communications with third-party services (Google Gemini API, YouTube API) 
                    are encrypted and authenticated.
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
                Authentication & Access Control
              </h2>
              <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-2 mb-4">
                <li><strong>OAuth Integration:</strong> We use secure OAuth providers (Google) for authentication, so we never store your passwords</li>
                <li><strong>Session Management:</strong> Secure session tokens with automatic expiration</li>
                <li><strong>Access Logging:</strong> All account access is logged and monitored</li>
                <li><strong>Role-Based Access:</strong> Different permission levels for different user types</li>
                <li><strong>Account Security:</strong> Your Google account security (including 2FA if enabled) protects your access</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
                Infrastructure Security
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
                    Hosting & Infrastructure
                  </h3>
                  <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-2">
                    <li>• Hosted on Vercel (enterprise-grade infrastructure)</li>
                    <li>• Global CDN with DDoS protection</li>
                    <li>• Automatic security updates</li>
                    <li>• 99.9% uptime SLA</li>
                    <li>• Regular security audits</li>
                  </ul>
                </div>
                <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
                    Database Security
                  </h3>
                  <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-2">
                    <li>• Supabase (PostgreSQL) with encryption</li>
                    <li>• Regular automated backups</li>
                    <li>• Access controls and monitoring</li>
                    <li>• Data retention policies</li>
                    <li>• Point-in-time recovery</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
                Data Processing Security
              </h2>
              <p className="text-slate-600 dark:text-slate-300 mb-4">
                When you use our AI processing features, we take extra care to protect your data:
              </p>
              <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-2 mb-4">
                <li><strong>No Video Storage:</strong> We don't store the original YouTube videos you process</li>
                <li><strong>Temporary Processing:</strong> Video transcripts are processed temporarily and then deleted</li>
                <li><strong>Secure API Calls:</strong> All AI processing happens through encrypted API calls to Google Gemini</li>
                <li><strong>Data Minimization:</strong> We only process the minimum data necessary for the service</li>
                <li><strong>User Control:</strong> You can delete your processed content at any time</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
                Security Monitoring & Incident Response
              </h2>
              <div className="space-y-4">
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 pl-4 py-3">
                  <h3 className="font-semibold text-yellow-900 dark:text-yellow-100">24/7 Monitoring</h3>
                  <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                    We continuously monitor our systems for security threats, unusual activity, 
                    and potential vulnerabilities.
                  </p>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 pl-4 py-3">
                  <h3 className="font-semibold text-red-900 dark:text-red-100">Incident Response</h3>
                  <p className="text-red-800 dark:text-red-200 text-sm">
                    In the event of a security incident, we have procedures in place to respond 
                    quickly and notify affected users within 72 hours.
                  </p>
                </div>
                <div className="bg-indigo-50 dark:bg-indigo-900/20 border-l-4 border-indigo-500 pl-4 py-3">
                  <h3 className="font-semibold text-indigo-900 dark:text-indigo-100">Vulnerability Reporting</h3>
                  <p className="text-indigo-800 dark:text-indigo-200 text-sm">
                    We encourage responsible disclosure of security vulnerabilities. 
                    Report issues to: support@shibabrothers.com
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
                Your Security Responsibilities
              </h2>
              <p className="text-slate-600 dark:text-slate-300 mb-4">
                While we work hard to protect your data, you also play an important role in security:
              </p>
              <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-2 mb-4">
                <li>Use strong, unique passwords for your accounts</li>
                <li>Enable two-factor authentication when available</li>
                <li>Keep your devices and browsers updated</li>
                <li>Be cautious of phishing attempts and suspicious emails</li>
                <li>Log out of your account when using shared devices</li>
                <li>Report any suspicious activity immediately</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
                Data Breach Notification
              </h2>
              <p className="text-slate-600 dark:text-slate-300 mb-4">
                In the unlikely event of a data breach that affects your personal information, we will:
              </p>
              <ol className="list-decimal list-inside text-slate-600 dark:text-slate-300 space-y-2 mb-4">
                <li>Notify you within 72 hours of discovering the breach</li>
                <li>Provide details about what information was affected</li>
                <li>Explain the steps we're taking to address the breach</li>
                <li>Offer guidance on steps you can take to protect yourself</li>
                <li>Provide ongoing updates as the situation develops</li>
              </ol>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
                Third-Party Security
              </h2>
              <p className="text-slate-600 dark:text-slate-300 mb-4">
                We work with trusted third-party services that meet high security standards:
              </p>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4 text-center">
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Google Gemini API</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Enterprise-grade AI processing with data protection guarantees
                  </p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4 text-center">
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Supabase</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    SOC 2 Type II compliant database with encryption at rest
                  </p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4 text-center">
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Vercel</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Enterprise hosting with DDoS protection and global CDN
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
                Contact Us
              </h2>
              <p className="text-slate-600 dark:text-slate-300 mb-4">
                If you have questions about our security practices or need to report a security issue:
              </p>
              <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-6">
                <p className="text-slate-600 dark:text-slate-300">
                  <strong>Security Team:</strong> support@shibabrothers.com<br/>
                  <strong>General Support:</strong> support@shibabrothers.com<br/>
                  <strong>Response Time:</strong> 24-48 hours for security issues
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
                Updates to This Policy
              </h2>
              <p className="text-slate-600 dark:text-slate-300">
                We may update this security policy from time to time to reflect changes in our practices 
                or applicable laws. When we do, we'll update the "Last updated" date at the top of this page. 
                We encourage you to review this policy periodically.
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
