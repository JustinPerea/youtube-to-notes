import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import AuthProvider from '../components/AuthProvider'
import { ThemeProvider } from '../components/ui/ThemeProvider'

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
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className={inter.className}>
        <ThemeProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
