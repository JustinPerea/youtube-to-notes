import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy - Shiba Scribe',
  description: 'Privacy Policy for Shiba Scribe AI video processing service',
};

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Privacy Policy
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Last updated: September 2025
            </p>
          </div>

          <div className="prose prose-gray dark:prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">1. Introduction</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                At Shiba Scribe, we respect your privacy and are committed to protecting your personal data. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our AI-powered video processing service. Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">2. Information We Collect</h2>
              <div className="text-gray-700 dark:text-gray-300 leading-relaxed space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Personal Information</h3>
                  <p>When you create an account or use our Service, we may collect:</p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Name and email address (via OAuth providers like Google)</li>
                    <li>Profile picture and basic profile information</li>
                    <li>Payment information (processed securely through third-party providers)</li>
                    <li>Communication preferences and marketing consent</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Usage Information</h3>
                  <p>We automatically collect certain information when you use our Service:</p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Video URLs and metadata that you submit for processing</li>
                    <li>Generated content and processing results</li>
                    <li>Usage patterns, preferences, and interaction data</li>
                    <li>Device information, IP address, and browser type</li>
                    <li>Log files and analytics data</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Cookies and Tracking Technologies</h3>
                  <p>We use cookies and similar tracking technologies to:</p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Maintain your session and authentication status</li>
                    <li>Remember your preferences and settings</li>
                    <li>Analyze usage patterns and improve our Service</li>
                    <li>Provide personalized content and recommendations</li>
                  </ul>
                  <p className="mt-3">
                    For detailed information about our use of cookies, please see our{' '}
                    <a href="/privacy/cookies" className="text-blue-600 dark:text-blue-400 hover:underline">
                      Cookie Policy
                    </a>.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">3. How We Use Your Information</h2>
              <div className="text-gray-700 dark:text-gray-300 leading-relaxed space-y-3">
                <p>We use the collected information for the following purposes:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Service Provision:</strong> To provide, maintain, and improve our AI video processing service</li>
                  <li><strong>Content Generation:</strong> To process your video inputs and generate requested content formats</li>
                  <li><strong>Account Management:</strong> To create and manage your user account and subscription</li>
                  <li><strong>Communication:</strong> To send you service updates, security alerts, and support messages</li>
                  <li><strong>Marketing:</strong> To send promotional materials and updates (only with your consent)</li>
                  <li><strong>Analytics:</strong> To analyze usage patterns and improve our service quality</li>
                  <li><strong>Legal Compliance:</strong> To comply with applicable laws and regulations</li>
                  <li><strong>Security:</strong> To detect, prevent, and address technical issues and security threats</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">4. Information Sharing and Disclosure</h2>
              <div className="text-gray-700 dark:text-gray-300 leading-relaxed space-y-4">
                <p>We do not sell, trade, or rent your personal information to third parties. We may share your information in the following circumstances:</p>
                
                <div>
                  <h3 className="font-semibold mb-2">Service Providers</h3>
                  <p>We work with trusted third-party service providers who assist us in operating our Service:</p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Google AI/Gemini for video content processing</li>
                    <li>Authentication providers (Google OAuth)</li>
                    <li>Payment processors (Stripe, Polar.sh)</li>
                    <li>Cloud hosting and storage providers (Supabase, Vercel)</li>
                    <li>Analytics and monitoring services</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Legal Requirements</h3>
                  <p>We may disclose your information if required to do so by law or in response to valid legal requests, such as:</p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Court orders or government investigations</li>
                    <li>Protection of our rights, property, or safety</li>
                    <li>Prevention of fraud or illegal activities</li>
                    <li>Compliance with regulatory requirements</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Business Transfers</h3>
                  <p>In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction, with appropriate notice provided to you.</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">5. Data Security</h2>
              <div className="text-gray-700 dark:text-gray-300 leading-relaxed space-y-3">
                <p>We implement comprehensive security measures to protect your personal information:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Encryption:</strong> All data transmission is encrypted using industry-standard protocols</li>
                  <li><strong>Access Controls:</strong> Strict access controls and authentication requirements for our systems</li>
                  <li><strong>Regular Audits:</strong> Regular security assessments and vulnerability testing</li>
                  <li><strong>Data Minimization:</strong> We collect and retain only the data necessary for our Service</li>
                  <li><strong>Secure Storage:</strong> Personal data is stored in secure, access-controlled environments</li>
                  <li><strong>Incident Response:</strong> Procedures in place for detecting and responding to security incidents</li>
                </ul>
                <p>However, no method of transmission over the internet or electronic storage is 100% secure. While we strive to protect your personal information, we cannot guarantee its absolute security.</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">6. Your Rights and Choices</h2>
              <div className="text-gray-700 dark:text-gray-300 leading-relaxed space-y-3">
                <p>You have the following rights regarding your personal information:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Access:</strong> Request access to your personal data that we hold</li>
                  <li><strong>Rectification:</strong> Request correction of inaccurate or incomplete data</li>
                  <li><strong>Erasure:</strong> Request deletion of your personal data (subject to certain limitations)</li>
                  <li><strong>Portability:</strong> Request a copy of your data in a structured, machine-readable format</li>
                  <li><strong>Restriction:</strong> Request limitation of processing of your personal data</li>
                  <li><strong>Objection:</strong> Object to processing of your personal data for marketing purposes</li>
                  <li><strong>Withdrawal of Consent:</strong> Withdraw consent for data processing where applicable</li>
                </ul>
                <p>To exercise these rights, please contact us through the support channels available in our application.</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">7. Data Retention</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                We retain your personal information for as long as necessary to provide our Service and fulfill the purposes outlined in this Privacy Policy. When you delete your account, we will delete your personal information within a reasonable timeframe, except where we are required to retain certain data for legal, regulatory, or legitimate business purposes. Generated content and processing results may be retained for a longer period to improve our AI models and service quality, but will be anonymized and disassociated from your personal identity.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">8. International Data Transfers</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                Our Service may involve the transfer of your information to countries other than your country of residence. These countries may have different data protection laws than your jurisdiction. When we transfer your information internationally, we ensure appropriate safeguards are in place to protect your data in accordance with applicable privacy laws including those of Delaware, United States.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">9. Children's Privacy</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                Our Service is not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. Users must be at least 13 years of age to use our Service. If we become aware that we have collected personal information from a child under 13 without parental consent, we will take steps to delete that information promptly.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">10. Changes to This Privacy Policy</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                We may update this Privacy Policy from time to time to reflect changes in our practices or applicable laws. We will notify you of any material changes by posting the updated Privacy Policy on our Service and updating the "Last updated" date. Your continued use of the Service after such changes constitutes acceptance of the updated Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">11. Third-Party Links and Services</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                Our Service may contain links to third-party websites or integrate with third-party services. This Privacy Policy does not apply to these external sites or services. We encourage you to review the privacy policies of any third-party services you access through our platform.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">12. Contact Information</h2>
              <div className="text-gray-700 dark:text-gray-300 leading-relaxed space-y-3">
                <p>
                  If you have any questions about this Privacy Policy, your personal data, or your rights, please contact us through:
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Support channels available in the application</li>
                  <li>Email support (available through our website)</li>
                  <li>In-app help and support features</li>
                </ul>
                <p>
                  We will respond to your privacy-related inquiries within a reasonable timeframe and in accordance with applicable privacy laws.
                </p>
              </div>
            </section>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mt-8">
              <p className="text-sm text-gray-600 dark:text-gray-300 text-center">
                This Privacy Policy is effective as of September 2025 and applies to all users of the Shiba Scribe service.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}