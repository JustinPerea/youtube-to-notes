import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import AuthProvider from '../components/AuthProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'YouTube to Notes - AI-Powered Video Content Transformation',
  description: 'Transform YouTube videos into notes, study guides, presentations, and tutorials using AI',
  keywords: 'YouTube, AI, notes, study guides, video processing, Gemini, education',
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
          <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  )
}
