import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cookie Policy - Kyoto Scribe',
  description: 'Learn about how Kyoto Scribe uses cookies to improve your experience and comply with privacy regulations.',
}

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-900">
      <div className="container max-w-4xl mx-auto px-5 py-20">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 md:p-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
              Cookie Policy
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-300">
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
                What Are Cookies?
              </h2>
              <p className="text-slate-600 dark:text-slate-300 mb-4">
                Cookies are small text files that are stored on your device when you visit our website. 
                They help us provide you with a better experience by remembering your preferences and 
                understanding how you use our site.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
                How We Use Cookies
              </h2>
              <p className="text-slate-600 dark:text-slate-300 mb-4">
                Kyoto Scribe uses cookies for several purposes:
              </p>
              <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-2">
                <li>To keep you signed in to your account</li>
                <li>To remember your preferences and settings</li>
                <li>To analyze how our website is used</li>
                <li>To show you relevant advertisements</li>
                <li>To improve our website's performance and security</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
                Types of Cookies We Use
              </h2>
              
              <div className="space-y-6">
                <div className="border-l-4 border-blue-500 pl-4">
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                    Essential Cookies
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300 mb-2">
                    These cookies are necessary for the website to function properly. They cannot be disabled.
                  </p>
                  <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 text-sm">
                    <li>Authentication cookies (NextAuth.js)</li>
                    <li>Session management cookies</li>
                    <li>Security and fraud prevention cookies</li>
                  </ul>
                </div>

                <div className="border-l-4 border-green-500 pl-4">
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                    Analytics Cookies
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300 mb-2">
                    These cookies help us understand how visitors interact with our website.
                  </p>
                  <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 text-sm">
                    <li>Google Analytics cookies</li>
                    <li>Page view tracking</li>
                    <li>User behavior analysis</li>
                  </ul>
                </div>

                <div className="border-l-4 border-purple-500 pl-4">
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                    Advertising Cookies
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300 mb-2">
                    These cookies are used to show you relevant advertisements and measure ad effectiveness.
                  </p>
                  <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 text-sm">
                    <li>Google AdSense cookies</li>
                    <li>Ad personalization cookies</li>
                    <li>Ad performance measurement</li>
                  </ul>
                </div>

                <div className="border-l-4 border-orange-500 pl-4">
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                    Preference Cookies
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300 mb-2">
                    These cookies remember your choices and preferences.
                  </p>
                  <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 text-sm">
                    <li>Theme preferences (dark/light mode)</li>
                    <li>Language preferences</li>
                    <li>User interface settings</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
                Third-Party Cookies
              </h2>
              <p className="text-slate-600 dark:text-slate-300 mb-4">
                We use third-party services that may set their own cookies:
              </p>
              <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-2">
                <li><strong>Google AdSense:</strong> For displaying advertisements and measuring ad performance</li>
                <li><strong>Google Analytics:</strong> For website analytics and user behavior tracking</li>
                <li><strong>NextAuth.js:</strong> For secure user authentication</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
                Managing Your Cookie Preferences
              </h2>
              <p className="text-slate-600 dark:text-slate-300 mb-4">
                You can control and manage cookies in several ways:
              </p>
              
              <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-6 mb-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
                  Cookie Banner
                </h3>
                <p className="text-slate-600 dark:text-slate-300 mb-3">
                  When you first visit our site, you'll see a cookie banner where you can:
                </p>
                <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-1">
                  <li>Accept all cookies</li>
                  <li>Reject non-essential cookies</li>
                  <li>Customize your cookie preferences</li>
                </ul>
              </div>

              <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-6 mb-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
                  Browser Settings
                </h3>
                <p className="text-slate-600 dark:text-slate-300 mb-3">
                  You can also manage cookies through your browser settings:
                </p>
                <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-1">
                  <li><strong>Chrome:</strong> Settings → Privacy and security → Cookies and other site data</li>
                  <li><strong>Firefox:</strong> Options → Privacy & Security → Cookies and Site Data</li>
                  <li><strong>Safari:</strong> Preferences → Privacy → Manage Website Data</li>
                  <li><strong>Edge:</strong> Settings → Cookies and site permissions</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
                Impact of Disabling Cookies
              </h2>
              <p className="text-slate-600 dark:text-slate-300 mb-4">
                If you disable cookies, some features of our website may not work properly:
              </p>
              <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-2">
                <li>You may need to sign in repeatedly</li>
                <li>Your preferences and settings won't be saved</li>
                <li>Some personalized content may not be available</li>
                <li>We may not be able to provide optimal user experience</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
                Updates to This Policy
              </h2>
              <p className="text-slate-600 dark:text-slate-300">
                We may update this Cookie Policy from time to time. When we do, we'll update the 
                "Last updated" date at the top of this page. We encourage you to review this policy 
                periodically to stay informed about how we use cookies.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
                Contact Us
              </h2>
              <p className="text-slate-600 dark:text-slate-300">
                If you have any questions about our use of cookies or this Cookie Policy, 
                please contact us at{' '}
                <a 
                  href="mailto:support@shibabrothers.com" 
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  support@shibabrothers.com
                </a>
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
