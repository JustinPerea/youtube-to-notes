'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export interface UserSubscription {
  tier: 'free' | 'basic' | 'pro';
  status: 'active' | 'canceled' | 'past_due' | 'incomplete';
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
}

export interface UsageData {
  videosProcessed: number;
  aiQuestionsAsked: number;
  storageUsedMb: number;
  videoLimit: number;
  aiQuestionLimit: number;
  storageLimitMb: number;
  canProcessVideo: boolean;
  canUseAI: boolean;
  canUseStorage: boolean;
}

interface SubscriptionResponse {
  subscription: UserSubscription;
  usage: UsageData;
}

/**
 * Hook to fetch and manage user subscription data
 * Returns subscription tier, usage limits, and current usage
 */
export function useSubscription() {
  // Safe session handling to prevent destructuring errors
  let session: any = null;
  let status: string = 'loading';
  
  try {
    const sessionData = useSession();
    session = sessionData?.data || null;
    status = sessionData?.status || 'loading';
  } catch (error) {
    console.warn('Session error in useSubscription:', error);
    session = null;
    status = 'unauthenticated';
  }
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    async function fetchSubscription() {
      // Prevent running during build/SSR or before client hydration
      if (typeof window === 'undefined' || !isClient) {
        setLoading(false);
        setSubscription({ tier: 'free', status: 'active' });
        setUsage(null);
        return;
      }
      
      if (status === 'loading') return;
      
      if (!session?.user?.id) {
        // User not authenticated - assume free tier
        setSubscription({ tier: 'free', status: 'active' });
        setUsage(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/usage');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch subscription: ${response.statusText}`);
        }

        const data: SubscriptionResponse = await response.json();
        
        setSubscription(data.subscription);
        setUsage(data.usage);
      } catch (err) {
        console.error('Error fetching subscription:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch subscription');
        
        // Fallback to free tier on error
        setSubscription({ tier: 'free', status: 'active' });
        setUsage(null);
      } finally {
        setLoading(false);
      }
    }

    fetchSubscription();
  }, [session?.user?.id, status, isClient]);

  return {
    subscription,
    usage,
    loading,
    error,
    // Convenience accessors
    tier: subscription?.tier || 'free',
    isAuthenticated: !!session?.user?.id,
    isFree: !subscription || subscription.tier === 'free',
    isBasic: subscription?.tier === 'basic',
    isPro: subscription?.tier === 'pro',
    // Refresh function for after subscription changes
    refresh: () => {
      if (session?.user?.id) {
        setLoading(true);
        // Re-trigger the effect by updating a dependency
        window.location.reload();
      }
    }
  };
}

/**
 * Lightweight hook specifically for ad display logic
 * Returns only whether ads should show for the current user
 */
export function useShowAds() {
  const { tier, loading } = useSubscription();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  return {
    shouldShowAds: isClient && !loading && (tier === 'free'),
    loading: !isClient || loading
  };
}