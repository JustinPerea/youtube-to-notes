import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import AuthProvider from '../components/AuthProvider'

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
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-800">
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  )
}
