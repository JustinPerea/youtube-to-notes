import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { headers } from 'next/headers'
import { ADSENSE_CONFIG } from '@/lib/adsense/config'
import AuthProvider from '../components/AuthProvider'
import { ThemeProvider } from '../components/ui/ThemeProvider'
import { Header } from '../components/Header'
import { OnboardingWrapper } from '../components/OnboardingWrapper'
import { AdSenseScript } from '../components/ads/AdSenseScript'
import { CookieBanner } from '../components/CookieBanner'

// Force dynamic rendering to prevent build issues
export const dynamic = 'force-dynamic'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Kyoto Scribe 🐕 - AI-Powered Video Content Transformation',
  description: 'Transform YouTube videos into beautiful notes, study guides, presentations, and tutorials using AI. Your friendly Shiba companion for learning.',
  keywords: 'YouTube, AI, notes, study guides, video processing, Gemini, education, Kyoto, Scribe, Shiba',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const nonce = headers().get('x-nonce') || undefined
  const ua = (headers().get('user-agent') || '').toLowerCase()
  const isGoogleAdSenseCrawler = ua.includes('google') && (ua.includes('adsense') || ua.includes('crawler') || ua.includes('bot'))
  const shouldIncludeAdsScript = isGoogleAdSenseCrawler || (ADSENSE_CONFIG.enabled && !!ADSENSE_CONFIG.publisherId)
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <meta name="google-adsense-account" content="ca-pub-4135776739187234" />
        {/* AdSense verification script - include only for crawler or when configured */}
        {shouldIncludeAdsScript && (
          <script
            async
            nonce={nonce}
            src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4135776739187234"
            crossOrigin="anonymous"
          />
        )}
      </head>
      <body className={inter.className}>
        <AdSenseScript />
        <ThemeProvider>
          <AuthProvider>
            <OnboardingWrapper>
              <Header />
              <main className="pt-16">
                {children}
              </main>
            </OnboardingWrapper>
          </AuthProvider>
        </ThemeProvider>
        <CookieBanner />
      </body>
    </html>
  )
}
