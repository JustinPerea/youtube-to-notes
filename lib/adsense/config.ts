/**
 * Google AdSense Configuration
 * Handles ad display logic and configuration for free tier users
 */

export interface AdSenseConfig {
  publisherId: string;
  enabled: boolean;
  testMode: boolean;
}

// AdSense configuration
export const ADSENSE_CONFIG: AdSenseConfig = {
  publisherId: process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID || '',
  enabled: process.env.NEXT_PUBLIC_ADSENSE_ENABLED === 'true',
  testMode: process.env.NODE_ENV === 'development',
};

// Ad unit configurations for different placements
export const AD_UNITS = {
  // Banner ads (728x90) - Top of pages
  banner: {
    width: 728,
    height: 90,
    slot: process.env.NEXT_PUBLIC_ADSENSE_BANNER_SLOT || '1234567890',
  },
  
  // Rectangle ads (300x250) - Sidebar or content breaks
  rectangle: {
    width: 300,
    height: 250,
    slot: process.env.NEXT_PUBLIC_ADSENSE_RECTANGLE_SLOT || '1234567891',
  },
  
  // Responsive ads - Adapt to container
  responsive: {
    width: '100%',
    height: 'auto',
    slot: process.env.NEXT_PUBLIC_ADSENSE_RESPONSIVE_SLOT || '1234567892',
  },
  
  // Mobile banner (320x50) - Mobile devices
  mobileBanner: {
    width: 320,
    height: 50,
    slot: process.env.NEXT_PUBLIC_ADSENSE_MOBILE_SLOT || '1234567893',
  },
} as const;

// Check if AdSense is properly configured
export function isAdSenseConfigured(): boolean {
  return !!(
    ADSENSE_CONFIG.publisherId && 
    ADSENSE_CONFIG.enabled &&
    !ADSENSE_CONFIG.publisherId.includes('placeholder')
  );
}

// Get ad unit by type with fallback
export function getAdUnit(type: keyof typeof AD_UNITS) {
  return AD_UNITS[type];
}

// Check if user should see ads (free tier only)
export function shouldShowAds(userTier: string | null | undefined): boolean {
  // In development mode, always show placeholders for free users to test layout
  if (ADSENSE_CONFIG.testMode) {
    return !userTier || userTier === 'free';
  }
  
  // In production, only show if properly configured
  if (!isAdSenseConfigured()) return false;
  return !userTier || userTier === 'free';
}