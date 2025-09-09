'use client';

import Script from 'next/script';
import { ADSENSE_CONFIG } from '../../lib/adsense/config';
import { useShowAds } from '../../hooks/useSubscription';
import { useEffect, useState } from 'react';

/**
 * AdSense Script Component with Auto Ads Support
 * 
 * Loads Google AdSense script and enables Auto ads, but ONLY for free tier users.
 * Paid users (Basic/Pro) will not have the AdSense script loaded at all.
 * 
 * Features:
 * - Subscription-aware loading (respects user tier)
 * - Auto ads integration for optimal ad placement
 * - Manual ad units still work alongside auto ads
 * - Development mode support
 * - Build-safe rendering (prevents SSR issues)
 */
export function AdSenseScript() {
  const { shouldShowAds: showAds, loading } = useShowAds();
  const [isClient, setIsClient] = useState(false);

  // Prevent hydration mismatch by only rendering on client
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Debug logging
  useEffect(() => {
    if (isClient) {
      console.log('🔍 AdSenseScript Debug:', {
        enabled: ADSENSE_CONFIG.enabled,
        publisherId: ADSENSE_CONFIG.publisherId,
        showAds,
        loading,
        isClient
      });
    }
  }, [isClient, showAds, loading]);

  // Don't render anything during SSR or while checking subscription status
  if (!isClient || loading) {
    console.log('⏳ AdSenseScript: Waiting for client hydration or subscription check');
    return null;
  }

  // Don't load script if AdSense is not configured or disabled
  if (!ADSENSE_CONFIG.enabled || !ADSENSE_CONFIG.publisherId) {
    console.log('❌ AdSenseScript: Configuration issue - enabled:', ADSENSE_CONFIG.enabled, 'publisherId:', ADSENSE_CONFIG.publisherId);
    return null;
  }

  // 🔐 CRITICAL: Don't load AdSense script at all for paid users
  if (!showAds) {
    console.log('🔒 AdSenseScript: User is on paid tier, not loading ads');
    return null;
  }

  console.log('✅ AdSenseScript: Loading AdSense script for free user');
  
  return (
    <>
      {/* Main AdSense Script - Required for both manual and auto ads */}
      <Script
        id="adsense-main-script"
        async
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-${ADSENSE_CONFIG.publisherId}`}
        crossOrigin="anonymous"
        strategy="afterInteractive"
        onLoad={() => {
          console.log('🟢 AdSense script loaded successfully for free user');
        }}
        onError={(error) => {
          console.error('❌ AdSense script failed to load:', error);
        }}
      />

      {/* Auto Ads Configuration - Let Google choose optimal placements */}
      <Script
        id="adsense-auto-ads-config"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (adsbygoogle = window.adsbygoogle || []).push({
              google_ad_client: "ca-pub-${ADSENSE_CONFIG.publisherId}",
              enable_page_level_ads: true
            });
            console.log('🤖 Auto Ads enabled for free user');
          `,
        }}
      />
    </>
  );
}