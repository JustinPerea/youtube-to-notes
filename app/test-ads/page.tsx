'use client';

import { HomePageAd, ProcessPageAd, NotesPageAd, ResultsCompletionAd } from '../../components/ads/FreeUserAdBanner';

export default function TestAdsPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] p-8 space-y-8">
      <h1 className="text-3xl font-bold text-center mb-12">AdSense Integration Test</h1>
      
      <div className="max-w-4xl mx-auto space-y-8">
        <section>
          <h2 className="text-xl font-semibold mb-4">Home Page Ad</h2>
          <HomePageAd />
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Process Page Ad</h2>
          <ProcessPageAd />
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Notes Page Ad</h2>
          <NotesPageAd />
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Results Completion Ad</h2>
          <ResultsCompletionAd />
        </section>
      </div>

      <div className="text-center mt-12 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p className="text-sm text-blue-600 dark:text-blue-400">
          📢 This test page shows all ad placements. In development mode, you see placeholders.
          <br />
          Real ads will appear in production with proper AdSense configuration.
        </p>
      </div>
    </div>
  );
}