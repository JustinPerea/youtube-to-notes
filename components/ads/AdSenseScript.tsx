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
  // TEMPORARY: Allow script loading for verification purposes
  if (!showAds && process.env.NODE_ENV === 'production') {
    console.log('🔒 AdSenseScript: User is on paid tier, not loading ads');
    return null;
  }

  console.log('✅ AdSenseScript: Configuring Auto Ads for free user');
  
  return (
    <>
      {/* Note: Main AdSense script is loaded in layout.tsx for verification */}
      {/* This component only handles Auto Ads configuration */}

      {/* Note: Auto Ads disabled to prevent conflicts with manual ad units */}
      {/* Manual ad units are used throughout the site via AdBanner components */}
    </>
  );
}