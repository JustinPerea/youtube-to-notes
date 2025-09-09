import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Data Processing Agreement - Kyoto Scribe',
  description: 'Data processing agreement and information about how we handle your data with third-party services.',
}

export default function DataProcessingAgreementPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-900">
      <div className="container max-w-4xl mx-auto px-5 py-20">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 md:p-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
              Data Processing Agreement
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-300">
              How We Process Your Data with Third-Party Services
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
                Overview
              </h2>
              <p className="text-slate-600 dark:text-slate-300 mb-4">
                This Data Processing Agreement (DPA) explains how Kyoto Scribe processes your personal data 
                when using third-party services to provide our AI-powered video processing features. 
                This is particularly important for users in the European Economic Area (EEA) and other 
                jurisdictions with strict data protection laws.
              </p>
              <p className="text-slate-600 dark:text-slate-300">
                By using our service, you consent to the data processing activities described in this agreement.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
                Data Controller and Processor
              </h2>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 mb-4">
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
                  Data Controller
                </h3>
                <p className="text-blue-800 dark:text-blue-200">
                  <strong>Kyoto Scribe</strong> acts as the data controller for your personal information. 
                  We determine the purposes and means of processing your data.
                </p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-3">
                  Data Processors
                </h3>
                <p className="text-green-800 dark:text-green-200">
                  We use trusted third-party services that act as data processors on our behalf. 
                  These processors are bound by strict data protection agreements.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
                Third-Party Data Processors
              </h2>
              <p className="text-slate-600 dark:text-slate-300 mb-4">
                We work with the following third-party services to provide our platform:
              </p>
              
              <div className="space-y-6">
                <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">
                    Google Gemini API
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Purpose</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        AI processing of video transcripts to generate notes, summaries, and educational content
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Data Processed</h4>
                      <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
                        <li>• Video transcripts (temporary)</li>
                        <li>• Processing requests</li>
                        <li>• Generated content</li>
                      </ul>
                    </div>
                  </div>
                  <div className="mt-4">
                    <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Data Protection</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      Google's Gemini API is designed with privacy in mind. Data is processed temporarily 
                      and not stored by Google for training purposes. Google is SOC 2 Type II compliant 
                      and follows strict data protection standards.
                    </p>
                  </div>
                </div>

                <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">
                    YouTube API
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Purpose</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        Accessing publicly available video metadata and transcripts
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Data Processed</h4>
                      <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
                        <li>• Video metadata (public)</li>
                        <li>• Video transcripts (public)</li>
                        <li>• Thumbnail images (public)</li>
                      </ul>
                    </div>
                  </div>
                  <div className="mt-4">
                    <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Data Protection</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      We only access publicly available information from YouTube. We do not access private 
                      videos or user account information. All data is processed in accordance with YouTube's 
                      Terms of Service and API policies.
                    </p>
                  </div>
                </div>

                <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">
                    Supabase (Database)
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Purpose</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        Storing user accounts, preferences, and generated content
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Data Processed</h4>
                      <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
                        <li>• User account information</li>
                        <li>• Generated notes and content</li>
                        <li>• User preferences and settings</li>
                        <li>• Processing history</li>
                      </ul>
                    </div>
                  </div>
                  <div className="mt-4">
                    <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Data Protection</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      Supabase is SOC 2 Type II compliant and provides enterprise-grade security. 
                      All data is encrypted at rest and in transit. We have a Data Processing Agreement 
                      with Supabase that ensures GDPR compliance.
                    </p>
                  </div>
                </div>

                <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">
                    Vercel (Hosting)
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Purpose</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        Hosting our website and application infrastructure
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Data Processed</h4>
                      <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
                        <li>• Website traffic data</li>
                        <li>• Performance metrics</li>
                        <li>• Error logs (anonymized)</li>
                      </ul>
                    </div>
                  </div>
                  <div className="mt-4">
                    <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Data Protection</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      Vercel provides enterprise-grade hosting with built-in security features. 
                      All data transmission is encrypted, and we have appropriate data processing 
                      agreements in place.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
                Data Processing Activities
              </h2>
              <p className="text-slate-600 dark:text-slate-300 mb-4">
                When you use our service, the following data processing activities occur:
              </p>
              
              <div className="space-y-4">
                <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-2">1. Video Processing</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    When you submit a YouTube URL, we temporarily access the video transcript and send it to 
                    Google's Gemini API for AI processing. The transcript is not stored permanently and is 
                    deleted after processing.
                  </p>
                </div>
                
                <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-2">2. Content Generation</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    The AI generates educational content based on the video transcript. This generated content 
                    is stored in our database so you can access it later.
                  </p>
                </div>
                
                <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-2">3. User Account Management</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Your account information, preferences, and generated content are stored securely in our 
                    database to provide you with a personalized experience.
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
                Legal Basis for Processing
              </h2>
              <p className="text-slate-600 dark:text-slate-300 mb-4">
                Under GDPR and other applicable data protection laws, we process your data based on the following legal grounds:
              </p>
              
              <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-2 mb-4">
                <li><strong>Consent:</strong> You have given clear consent for us to process your data for the specific purpose of providing our service</li>
                <li><strong>Contract Performance:</strong> Processing is necessary for the performance of our service contract with you</li>
                <li><strong>Legitimate Interest:</strong> We have a legitimate interest in improving our service and ensuring security</li>
                <li><strong>Legal Obligation:</strong> Some processing may be required to comply with legal obligations</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
                Data Retention
              </h2>
              <p className="text-slate-600 dark:text-slate-300 mb-4">
                We retain your data for the following periods:
              </p>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                  <span className="text-slate-900 dark:text-white font-medium">Account Information</span>
                  <span className="text-slate-600 dark:text-slate-300 text-sm">Until account deletion</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                  <span className="text-slate-900 dark:text-white font-medium">Generated Content</span>
                  <span className="text-slate-600 dark:text-slate-300 text-sm">Until you delete it or close your account</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                  <span className="text-slate-900 dark:text-white font-medium">Video Transcripts</span>
                  <span className="text-slate-600 dark:text-slate-300 text-sm">Temporary (deleted after processing)</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                  <span className="text-slate-900 dark:text-white font-medium">Usage Analytics</span>
                  <span className="text-slate-600 dark:text-slate-300 text-sm">24 months (anonymized)</span>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
                Your Rights
              </h2>
              <p className="text-slate-600 dark:text-slate-300 mb-4">
                Under applicable data protection laws, you have the following rights regarding your personal data:
              </p>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 pl-4 py-2">
                    <h3 className="font-semibold text-blue-900 dark:text-blue-100">Right to Access</h3>
                    <p className="text-blue-800 dark:text-blue-200 text-sm">Request a copy of your personal data</p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 pl-4 py-2">
                    <h3 className="font-semibold text-green-900 dark:text-green-100">Right to Rectification</h3>
                    <p className="text-green-800 dark:text-green-200 text-sm">Correct inaccurate personal data</p>
                  </div>
                  <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 pl-4 py-2">
                    <h3 className="font-semibold text-red-900 dark:text-red-100">Right to Erasure</h3>
                    <p className="text-red-800 dark:text-red-200 text-sm">Request deletion of your personal data</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="bg-purple-50 dark:bg-purple-900/20 border-l-4 border-purple-500 pl-4 py-2">
                    <h3 className="font-semibold text-purple-900 dark:text-purple-100">Right to Portability</h3>
                    <p className="text-purple-800 dark:text-purple-200 text-sm">Export your data in a portable format</p>
                  </div>
                  <div className="bg-orange-50 dark:bg-orange-900/20 border-l-4 border-orange-500 pl-4 py-2">
                    <h3 className="font-semibold text-orange-900 dark:text-orange-100">Right to Object</h3>
                    <p className="text-orange-800 dark:text-orange-200 text-sm">Object to certain processing activities</p>
                  </div>
                  <div className="bg-indigo-50 dark:bg-indigo-900/20 border-l-4 border-indigo-500 pl-4 py-2">
                    <h3 className="font-semibold text-indigo-900 dark:text-indigo-100">Right to Restrict</h3>
                    <p className="text-indigo-800 dark:text-indigo-200 text-sm">Limit how we process your data</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
                Data Transfers
              </h2>
              <p className="text-slate-600 dark:text-slate-300 mb-4">
                Some of our data processors may be located outside your country of residence. When we transfer 
                data internationally, we ensure appropriate safeguards are in place:
              </p>
              
              <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-2 mb-4">
                <li><strong>Adequacy Decisions:</strong> We transfer data to countries with adequate data protection laws</li>
                <li><strong>Standard Contractual Clauses:</strong> We use EU-approved standard contractual clauses for transfers</li>
                <li><strong>Certification Schemes:</strong> Our processors are certified under recognized data protection frameworks</li>
                <li><strong>Binding Corporate Rules:</strong> Some processors have binding corporate rules for data protection</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
                Contact Information
              </h2>
              <p className="text-slate-600 dark:text-slate-300 mb-4">
                If you have questions about this Data Processing Agreement or want to exercise your data protection rights:
              </p>
              
              <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-6">
                <p className="text-slate-600 dark:text-slate-300">
                  <strong>Data Protection Officer:</strong> privacy@kyotoscribe.com<br/>
                  <strong>General Support:</strong> support@kyotoscribe.com<br/>
                  <strong>Response Time:</strong> 30 days for data protection requests
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
                Updates to This Agreement
              </h2>
              <p className="text-slate-600 dark:text-slate-300">
                We may update this Data Processing Agreement from time to time to reflect changes in our 
                practices or applicable laws. When we make significant changes, we'll notify you and update 
                the "Last updated" date at the top of this page.
              </p>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-700">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
              <a 
                href="/privacy" 
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                ← Back to Privacy Policy
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
