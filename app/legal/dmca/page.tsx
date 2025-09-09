import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'DMCA Policy - Kyoto Scribe',
  description: 'Digital Millennium Copyright Act (DMCA) policy and procedures for Kyoto Scribe.',
}

export default function DMCAPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-900">
      <div className="container max-w-4xl mx-auto px-5 py-20">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 md:p-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
              DMCA Policy
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-300">
              Digital Millennium Copyright Act Policy and Procedures
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
                Kyoto Scribe respects the intellectual property rights of others and expects our users to do the same. 
                We comply with the Digital Millennium Copyright Act (DMCA) and will respond to valid copyright 
                infringement claims in accordance with the law.
              </p>
              <p className="text-slate-600 dark:text-slate-300">
                This policy outlines our procedures for handling copyright infringement claims and our commitment 
                to protecting intellectual property rights.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
                How Kyoto Scribe Works
              </h2>
              <p className="text-slate-600 dark:text-slate-300 mb-4">
                Kyoto Scribe is an AI-powered service that processes publicly available YouTube videos to generate 
                educational content such as notes, summaries, and study guides. Our service:
              </p>
              <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-2 mb-4">
                <li>Only processes videos that are publicly available on YouTube</li>
                <li>Does not store or redistribute the original video content</li>
                <li>Generates original educational content based on video transcripts</li>
                <li>Respects YouTube's Terms of Service and API policies</li>
                <li>Does not modify or alter the original video content</li>
              </ul>
              <p className="text-slate-600 dark:text-slate-300">
                We believe our service falls under fair use provisions for educational purposes, but we take 
                copyright concerns seriously and will investigate all valid claims.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
                Reporting Copyright Infringement
              </h2>
              <p className="text-slate-600 dark:text-slate-300 mb-4">
                If you believe that your copyrighted work has been used in a way that constitutes copyright 
                infringement, please provide us with the following information:
              </p>
              
              <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-6 mb-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
                  Required Information for DMCA Notice
                </h3>
                <ol className="list-decimal list-inside text-slate-600 dark:text-slate-300 space-y-2">
                  <li>
                    <strong>Identification of the copyrighted work:</strong> A description of the copyrighted work 
                    that you claim has been infringed, including the URL or other specific location where the 
                    material is located.
                  </li>
                  <li>
                    <strong>Identification of the infringing material:</strong> A description of where the allegedly 
                    infringing material is located on our service, including the specific URL or other identifying 
                    information.
                  </li>
                  <li>
                    <strong>Your contact information:</strong> Your name, address, telephone number, and email address.
                  </li>
                  <li>
                    <strong>Good faith statement:</strong> A statement that you have a good faith belief that the 
                    use of the material is not authorized by the copyright owner, its agent, or the law.
                  </li>
                  <li>
                    <strong>Accuracy statement:</strong> A statement that the information in your notice is accurate 
                    and that you are the copyright owner or authorized to act on behalf of the copyright owner.
                  </li>
                  <li>
                    <strong>Signature:</strong> Your physical or electronic signature.
                  </li>
                </ol>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 mb-4">
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
                  Submit DMCA Notice
                </h3>
                <p className="text-blue-800 dark:text-blue-200 mb-3">
                  Please send your DMCA notice to our designated agent:
                </p>
                <div className="text-blue-800 dark:text-blue-200">
                  <p><strong>Email:</strong> dmca@kyotoscribe.com</p>
                  <p><strong>Subject:</strong> DMCA Copyright Infringement Notice</p>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
                Our Response Process
              </h2>
              <p className="text-slate-600 dark:text-slate-300 mb-4">
                Upon receipt of a valid DMCA notice, we will:
              </p>
              <ol className="list-decimal list-inside text-slate-600 dark:text-slate-300 space-y-2 mb-4">
                <li>Acknowledge receipt of your notice within 24 hours</li>
                <li>Review the claim and investigate the alleged infringement</li>
                <li>Take appropriate action, which may include:
                  <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                    <li>Removing or disabling access to the allegedly infringing material</li>
                    <li>Notifying the user who submitted the material</li>
                    <li>Providing the user with a copy of the DMCA notice</li>
                  </ul>
                </li>
                <li>Respond to you with our findings and actions taken</li>
              </ol>
              <p className="text-slate-600 dark:text-slate-300">
                We typically respond to valid DMCA notices within 48-72 hours of receipt.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
                Counter-Notification Process
              </h2>
              <p className="text-slate-600 dark:text-slate-300 mb-4">
                If you believe that your material was removed or disabled by mistake or misidentification, 
                you may file a counter-notification. Your counter-notification must include:
              </p>
              <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-2 mb-4">
                <li>Identification of the material that was removed or disabled</li>
                <li>A statement under penalty of perjury that you have a good faith belief the material was removed by mistake</li>
                <li>Your name, address, and telephone number</li>
                <li>A statement that you consent to the jurisdiction of the federal court in your district</li>
                <li>Your physical or electronic signature</li>
              </ul>
              <p className="text-slate-600 dark:text-slate-300">
                Send counter-notifications to: <strong>dmca@kyotoscribe.com</strong>
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
                Repeat Infringers
              </h2>
              <p className="text-slate-600 dark:text-slate-300 mb-4">
                In accordance with the DMCA, we maintain a policy of terminating, in appropriate circumstances, 
                the accounts of users who are repeat infringers. We may also limit access to our service or 
                terminate the accounts of users who repeatedly submit content that violates copyright laws.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
                False Claims
              </h2>
              <p className="text-slate-600 dark:text-slate-300 mb-4">
                Please note that under Section 512(f) of the DMCA, any person who knowingly materially 
                misrepresents that material or activity is infringing may be subject to liability for damages, 
                including costs and attorneys' fees.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
                Contact Information
              </h2>
              <p className="text-slate-600 dark:text-slate-300 mb-4">
                For questions about this DMCA policy or to submit a copyright infringement notice, 
                please contact us:
              </p>
              <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-6">
                <p className="text-slate-600 dark:text-slate-300">
                  <strong>Email:</strong> dmca@kyotoscribe.com<br/>
                  <strong>Subject:</strong> DMCA Copyright Infringement Notice<br/>
                  <strong>Response Time:</strong> 24-72 hours
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
                Changes to This Policy
              </h2>
              <p className="text-slate-600 dark:text-slate-300">
                We may update this DMCA policy from time to time. When we do, we'll update the 
                "Last updated" date at the top of this page. We encourage you to review this policy 
                periodically to stay informed about our copyright protection procedures.
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
