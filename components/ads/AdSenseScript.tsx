'use client';

import Script from 'next/script';
import { ADSENSE_CONFIG } from '../../lib/adsense/config';

/**
 * AdSense Script Component
 * Loads the Google AdSense script once per application
 */
export function AdSenseScript() {
  // Don't load script if AdSense is not configured or disabled
  if (!ADSENSE_CONFIG.enabled || !ADSENSE_CONFIG.publisherId) {
    return null;
  }

  return (
    <Script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-${ADSENSE_CONFIG.publisherId}`}
      crossOrigin="anonymous"
      strategy="afterInteractive"
      onLoad={() => {
        console.log('🟢 AdSense script loaded successfully');
      }}
      onError={(error) => {
        console.error('❌ AdSense script failed to load:', error);
      }}
    />
  );
}