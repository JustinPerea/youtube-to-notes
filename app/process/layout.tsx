import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Process Video - Kyoto Scribe 🐕',
  description: 'Transform your YouTube video into comprehensive AI-powered notes, study guides, and more with Kyoto Scribe.',
}

export default function ProcessLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}