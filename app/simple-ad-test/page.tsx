'use client';

import { useState } from 'react';
import { ResponsiveAd } from '../../components/ads/AdBanner';

// Simple hook that simulates different subscription tiers for testing
function useSimpleAdTest() {
  const [tier, setTier] = useState<'free' | 'basic' | 'pro'>('free');
  const [loading, setLoading] = useState(false);
  
  const shouldShowAds = !loading && (tier === 'free');
  
  return {
    tier,
    setTier,
    loading,
    shouldShowAds,
    setLoading
  };
}

// Test component that shows/hides ads based on tier
function TestAdComponent({ tier, shouldShowAds }: { tier: string; shouldShowAds: boolean }) {
  if (!shouldShowAds) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <p className="text-green-700 font-semibold">✅ No ads shown - {tier.toUpperCase()} user</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-blue-700 font-semibold">📢 Ads shown - {tier.toUpperCase()} user</p>
      </div>
      <ResponsiveAd className="w-full" />
    </div>
  );
}

export default function SimpleAdTestPage() {
  const { tier, setTier, loading, shouldShowAds, setLoading } = useSimpleAdTest();

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Simple Ad Hiding Test</h1>
        
        {/* Tier Selection */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-8 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Test Different Subscription Tiers</h2>
          
          <div className="flex gap-4 mb-6">
            <button 
              onClick={() => setTier('free')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                tier === 'free' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Free Tier
            </button>
            
            <button 
              onClick={() => setTier('basic')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                tier === 'basic' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Basic Tier
            </button>
            
            <button 
              onClick={() => setTier('pro')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                tier === 'pro' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Pro Tier
            </button>
          </div>

          <div className="text-sm text-gray-600">
            <p><strong>Current Status:</strong></p>
            <p>Subscription Tier: <span className="font-mono font-bold">{tier}</span></p>
            <p>Should Show Ads: <span className="font-mono font-bold">{shouldShowAds ? 'YES' : 'NO'}</span></p>
            <p>Loading: <span className="font-mono font-bold">{loading ? 'YES' : 'NO'}</span></p>
          </div>
        </div>

        {/* Ad Display Test */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Ad Display Test</h2>
          
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-4">
              Expected behavior: Only FREE users should see ads. BASIC and PRO users should not see ads.
            </p>
          </div>
          
          <TestAdComponent tier={tier} shouldShowAds={shouldShowAds} />
        </div>

        {/* Test Results Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mt-8 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Test Results Summary</h2>
          
          <div className="grid grid-cols-3 gap-4">
            <div className={`p-4 rounded-lg border ${
              tier === 'free' 
                ? 'border-blue-200 bg-blue-50' 
                : 'border-gray-200 bg-gray-50'
            }`}>
              <h3 className="font-semibold text-blue-700">FREE Users</h3>
              <p className="text-sm mt-2">Should see ads: ✅ YES</p>
              <p className="text-sm">Status: {tier === 'free' && shouldShowAds ? '✅ PASS' : tier === 'free' ? '❌ FAIL' : '⚪ Not tested'}</p>
            </div>
            
            <div className={`p-4 rounded-lg border ${
              tier === 'basic' 
                ? 'border-green-200 bg-green-50' 
                : 'border-gray-200 bg-gray-50'
            }`}>
              <h3 className="font-semibold text-green-700">BASIC Users</h3>
              <p className="text-sm mt-2">Should see ads: ❌ NO</p>
              <p className="text-sm">Status: {tier === 'basic' && !shouldShowAds ? '✅ PASS' : tier === 'basic' ? '❌ FAIL' : '⚪ Not tested'}</p>
            </div>
            
            <div className={`p-4 rounded-lg border ${
              tier === 'pro' 
                ? 'border-purple-200 bg-purple-50' 
                : 'border-gray-200 bg-gray-50'
            }`}>
              <h3 className="font-semibold text-purple-700">PRO Users</h3>
              <p className="text-sm mt-2">Should see ads: ❌ NO</p>
              <p className="text-sm">Status: {tier === 'pro' && !shouldShowAds ? '✅ PASS' : tier === 'pro' ? '❌ FAIL' : '⚪ Not tested'}</p>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mt-8">
          <h3 className="font-semibold text-yellow-800 mb-2">How to Test</h3>
          <ol className="text-sm text-yellow-700 space-y-1 list-decimal list-inside">
            <li>Click "Free Tier" - You should see ad placeholders (in development mode)</li>
            <li>Click "Basic Tier" - Ads should disappear and show green success message</li>
            <li>Click "Pro Tier" - Ads should disappear and show green success message</li>
            <li>Switch back to "Free Tier" - Ads should reappear</li>
          </ol>
        </div>
      </div>
    </div>
  );
}