'use client';

import { useEffect, useRef, useState } from 'react';
import { shouldShowAds, getAdUnit, ADSENSE_CONFIG, AD_UNITS } from '../../lib/adsense/config';
import { useShowAds } from '../../hooks/useSubscription';

interface AdBannerProps {
  /**
   * Type of ad unit to display
   */
  adType: keyof typeof AD_UNITS;
  /**
   * Custom CSS classes
   */
  className?: string;
  /**
   * Additional styles
   */
  style?: React.CSSProperties;
  /**
   * Custom ad slot (overrides config)
   */
  customSlot?: string;
}

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

/**
 * AdBanner Component
 * Displays Google AdSense ads for free tier users only
 */
export function AdBanner({ adType, className = '', style, customSlot }: AdBannerProps) {
  const adRef = useRef<HTMLDivElement>(null);
  const [adLoaded, setAdLoaded] = useState(false);
  const [adError, setAdError] = useState(false);
  
  // Get subscription status for ad display logic
  const { shouldShowAds: showAds, loading: subscriptionLoading } = useShowAds();

  useEffect(() => {
    if (!showAds || adLoaded || adError) return;

    const loadAd = () => {
      try {
        if (typeof window !== 'undefined' && window.adsbygoogle && adRef.current) {
          // Check if this specific ad element already has an ad
          const adElement = adRef.current.querySelector('.adsbygoogle');
          if (adElement && !adElement.hasAttribute('data-adsbygoogle-status')) {
            window.adsbygoogle = window.adsbygoogle || [];
            window.adsbygoogle.push({});
            setAdLoaded(true);
            console.log(`🟢 AdSense ${adType} ad loaded`);
          } else if (adElement && adElement.hasAttribute('data-adsbygoogle-status')) {
            console.log(`ℹ️ AdSense ${adType} ad already loaded`);
            setAdLoaded(true);
          }
        }
      } catch (error) {
        console.error(`❌ Error loading ${adType} ad:`, error);
        setAdError(true);
      }
    };

    // Load ad after a small delay to ensure script is ready
    const timer = setTimeout(loadAd, 100);
    return () => clearTimeout(timer);
  }, [showAds, adLoaded, adError, adType]);

  // Show loading state while fetching subscription
  if (subscriptionLoading) {
    return null;
  }

  // Don't render anything if user shouldn't see ads (Pro/Basic users)
  if (!showAds) {
    return null;
  }

  const adUnit = getAdUnit(adType);
  const adSlot = customSlot || adUnit.slot;

  // Show error state during development
  if (ADSENSE_CONFIG.testMode && adError) {
    return (
      <div className={`ad-banner-error bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <p className="text-red-600 text-sm text-center">
          📢 Ad would appear here (AdSense Error - Dev Mode)
        </p>
        <p className="text-xs text-red-500 text-center mt-1">
          {adType} • {adUnit.width}x{adUnit.height}
        </p>
      </div>
    );
  }

  // Show placeholder during development (always in dev, regardless of config)
  if (ADSENSE_CONFIG.testMode) {
    return (
      <div 
        className={`ad-banner-placeholder bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-2 border-dashed border-blue-300 dark:border-blue-600 rounded-lg p-4 flex items-center justify-center ${className}`}
        style={{
          minHeight: typeof adUnit.height === 'number' ? `${adUnit.height}px` : '120px',
          ...style
        }}
      >
        <div className="text-center">
          <p className="text-blue-600 dark:text-blue-400 text-sm font-bold">
            📢 ADVERTISEMENT PLACEHOLDER
          </p>
          <p className="text-xs text-blue-500 dark:text-blue-300 mt-1">
            {adType.toUpperCase()} AD • {adUnit.width}x{adUnit.height}
          </p>
          <p className="text-xs text-blue-400 dark:text-blue-500 mt-2">
            🚀 Development Mode - Real ads will appear here in production
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Free users only • Paid users won't see ads
          </p>
        </div>
      </div>
    );
  }
  
  // Show placeholder if no publisher ID in production
  if (!ADSENSE_CONFIG.publisherId) {
    return (
      <div 
        className={`ad-banner-placeholder bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 flex items-center justify-center ${className}`}
        style={{
          minHeight: typeof adUnit.height === 'number' ? `${adUnit.height}px` : '90px',
          ...style
        }}
      >
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
            📢 Advertisement
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            Configure AdSense to show ads
          </p>
        </div>
      </div>
    );
  }

  // Actual AdSense ad
  return (
    <div className={`ad-banner ${className}`} style={style}>
      <ins
        className="adsbygoogle"
        style={{
          display: 'block',
          width: adUnit.width === '100%' ? '100%' : `${adUnit.width}px`,
          height: adUnit.height === 'auto' ? 'auto' : `${adUnit.height}px`,
        }}
        data-ad-client={`ca-pub-${ADSENSE_CONFIG.publisherId}`}
        data-ad-slot={adSlot}
        data-ad-format={adType === 'responsive' ? 'auto' : undefined}
        data-full-width-responsive={adType === 'responsive' ? 'true' : undefined}
      />
    </div>
  );
}

/**
 * Pre-configured ad components for common use cases
 */

export function BannerAd({ className, ...props }: Omit<AdBannerProps, 'adType'>) {
  return <AdBanner adType="banner" className={`mb-6 ${className || ''}`} {...props} />;
}

export function RectangleAd({ className, ...props }: Omit<AdBannerProps, 'adType'>) {
  return <AdBanner adType="rectangle" className={`mb-4 ${className || ''}`} {...props} />;
}

export function ResponsiveAd({ className, ...props }: Omit<AdBannerProps, 'adType'>) {
  return <AdBanner adType="responsive" className={`my-6 ${className || ''}`} {...props} />;
}

export function MobileBannerAd({ className, ...props }: Omit<AdBannerProps, 'adType'>) {
  return <AdBanner adType="mobileBanner" className={`mb-4 md:hidden ${className || ''}`} {...props} />;
}