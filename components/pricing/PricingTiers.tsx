'use client';

import { Check, Star, Crown, Infinity, Zap, Loader2 } from 'lucide-react';
import { useSession, signIn } from 'next-auth/react';
import { useState, useEffect, useCallback } from 'react';

export interface PricingTier {
  id: string;
  name: string;
  price: number;
  yearlyPrice?: number;
  description: string;
  videoLimit: string;
  features: string[];
  popularBadge?: boolean;
  ctaText: string;
  ctaVariant: 'outline' | 'default' | 'premium';
  unlimitedVideos?: boolean;
  unlimitedChat?: boolean;
}

const pricingTiers: PricingTier[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    description: 'Perfect for trying out our AI-powered note generation',
    videoLimit: '5 notes per month',
    features: [
      'All note formats (Basic Summary, Study Notes, Presentation Slides)',
      'PDF export with watermark', 
      '100MB storage',
      'Chatbot coming soon'
    ],
    ctaText: 'Get Started Free',
    ctaVariant: 'outline',
    unlimitedVideos: false,
    unlimitedChat: false
  },
  {
    id: 'basic',
    name: 'Basic',
    price: 3.99,
    yearlyPrice: 39,
    description: '100 notes monthly for serious learners',
    videoLimit: '100 notes per month',
    features: [
      '📝 100 NOTES PER MONTH - Perfect for regular users',
      'All note formats (Basic Summary, Study Notes, Presentation Slides)',
      'Chatbot coming soon',
      '5GB storage',
      'Standard processing speed',
      'Email support'
    ],
    ctaText: 'Get 100 Notes Monthly',
    ctaVariant: 'outline',
    unlimitedVideos: false,
    unlimitedChat: false
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 9.99,
    yearlyPrice: 99,
    description: 'Best cost - Unlimited videos with advanced features',
    videoLimit: 'UNLIMITED VIDEOS',
    popularBadge: true,
    features: [
      '🎯 UNLIMITED VIDEOS - Never worry about limits',
      'All formats + advanced exports (Word, PowerPoint)',
      'Chatbot coming soon',
      '50GB storage',
      'Priority processing (2x faster)',
      'Priority support'
    ],
    ctaText: 'Go Unlimited Pro',
    ctaVariant: 'default',
    unlimitedVideos: true,
    unlimitedChat: true
  }
];

interface PricingTiersProps {
  billing?: 'monthly' | 'yearly';
  onSelectPlan?: (tierId: string) => void;
}

interface CheckoutState {
  [key: string]: boolean;
}

export function PricingTiers({ billing = 'monthly', onSelectPlan }: PricingTiersProps) {
  const { data: session, status } = useSession();
  const [loadingStates, setLoadingStates] = useState<CheckoutState>({});
  const [error, setError] = useState<string | null>(null);
  const [resumingCheckout, setResumingCheckout] = useState<string | null>(null);

  const createCheckoutSession = useCallback(async (tier: string) => {
    try {
      setError(null);
      setLoadingStates(prev => ({ ...prev, [tier]: true }));

      // Use Polar for all checkouts
      const response = await fetch('/api/polar/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier,
          billing,
          studentDiscount: false, // Can be enhanced later for student verification
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          // User not authenticated - store checkout intent and redirect to sign in
          const checkoutIntent = {
            tier,
            billing,
            timestamp: Date.now()
          };
          
          // Store intent in sessionStorage so it persists during redirect
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('checkout_intent', JSON.stringify(checkoutIntent));
          }
          
          // Create callback URL that will return to current page
          const callbackUrl = `${window.location.origin}${window.location.pathname}?checkout_pending=true`;
          
          await signIn('google', { callbackUrl });
          return;
        } else if (response.status === 503) {
          // Stripe not configured
          setError(data.message || 'Payment system is being set up. Please check back soon!');
          return;
        } else {
          throw new Error(data.error || 'Failed to create checkout session');
        }
      }

      if (data.url) {
        // Clear any stored checkout intent since we're proceeding
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('checkout_intent');
        }
        // Redirect to Polar checkout
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err instanceof Error ? err.message : 'Failed to start checkout process');
    } finally {
      setLoadingStates(prev => ({ ...prev, [tier]: false }));
    }
  }, [billing]);

  // Check for stored checkout intent after authentication
  useEffect(() => {
    const handlePendingCheckout = async () => {
      // Only proceed if user just signed in and we have a session
      if (status === 'authenticated' && session?.user) {
        const urlParams = new URLSearchParams(window.location.search);
        const checkoutPending = urlParams.get('checkout_pending');
        
        if (checkoutPending) {
          // Check for stored checkout intent
          const storedIntent = sessionStorage.getItem('checkout_intent');
          if (storedIntent) {
            try {
              const intent = JSON.parse(storedIntent);
              
              // Check if intent is recent (within 10 minutes)
              const isRecentIntent = (Date.now() - intent.timestamp) < 10 * 60 * 1000;
              
              if (isRecentIntent && intent.tier) {
                // Clear the checkout_pending parameter from URL
                const newUrl = new URL(window.location.href);
                newUrl.searchParams.delete('checkout_pending');
                window.history.replaceState({}, '', newUrl.toString());
                
                // Show a brief message and then proceed with checkout
                console.log('Resuming checkout for:', intent.tier);
                setError(null); // Clear any existing errors
                setResumingCheckout(`Continuing your ${intent.tier} plan checkout...`);
                setLoadingStates(prev => ({ ...prev, [intent.tier]: true }));
                
                // Small delay to ensure session is fully established
                setTimeout(async () => {
                  await createCheckoutSession(intent.tier);
                  setResumingCheckout(null);
                }, 1000);
              } else {
                // Intent is too old, clear it
                sessionStorage.removeItem('checkout_intent');
                setError('Your checkout session has expired. Please try again.');
              }
            } catch (error) {
              console.error('Error parsing checkout intent:', error);
              sessionStorage.removeItem('checkout_intent');
            }
          }
        }
      }
    };

    handlePendingCheckout();
  }, [status, session, createCheckoutSession]); // React to changes in authentication status

  const handleSelectPlan = async (tierId: string) => {
    if (onSelectPlan) {
      onSelectPlan(tierId);
      return;
    }

    // Handle free tier - direct to video input
    if (tierId === 'free') {
      const videoInput = document.querySelector('.url-input');
      if (videoInput) {
        videoInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const inputElement = videoInput.querySelector('input');
        if (inputElement) {
          setTimeout(() => inputElement.focus(), 300);
        }
      } else {
        // Fallback: navigate to home page
        if (typeof window !== 'undefined') {
          window.location.href = '/';
        }
      }
      return;
    }

    // Handle paid plans - create checkout session
    await createCheckoutSession(tierId);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {/* Resuming Checkout Message */}
        {resumingCheckout && (
          <div className="col-span-full mb-6">
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg flex items-center gap-3">
              <Loader2 className="w-4 h-4 animate-spin" />
              <p className="text-sm font-medium">{resumingCheckout}</p>
            </div>
          </div>
        )}
      
      {/* Error Message */}
      {error && (
        <div className="col-span-full mb-6">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <p className="text-sm font-medium">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-800 text-sm underline mt-1"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {pricingTiers.map((tier) => {
        const displayPrice = billing === 'yearly' && tier.yearlyPrice 
          ? tier.yearlyPrice / 12 
          : tier.price;
        const yearlyDiscount = tier.yearlyPrice 
          ? Math.round(((tier.price * 12 - tier.yearlyPrice) / (tier.price * 12)) * 100)
          : 0;
        const isLoading = loadingStates[tier.id];

        return (
          <div
            key={tier.id}
            className={`relative rounded-2xl p-6 backdrop-blur-[20px] border transition-all duration-300 hover:scale-105 ${
              tier.popularBadge
                ? 'border-[var(--accent-pink)] bg-gradient-to-b from-[var(--accent-pink)]/5 to-transparent shadow-[0_8px_32px_rgba(255,107,157,0.15)]'
                : 'border-[var(--card-border)] bg-[var(--card-bg)]'
            }`}
          >
            {tier.popularBadge && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[var(--accent-pink)] to-[#FF8FB3] text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1 shadow-lg">
                <Star className="w-4 h-4" />
                Best Cost
              </div>
            )}

            {/* Competitive Advantage Badge for Paid Tiers */}
            {tier.unlimitedVideos && (
              <div className="absolute -top-2 -right-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg animate-pulse">
                <Infinity className="w-3 h-3" />
                NO LIMITS
              </div>
            )}

            <div className="mb-6">
              <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">
                {tier.name}
              </h3>
              <p className="text-sm text-[var(--text-secondary)] mb-4">
                {tier.description}
              </p>
              
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-3xl font-bold text-[var(--text-primary)]">
                  ${displayPrice.toFixed(displayPrice % 1 === 0 ? 0 : 2)}
                </span>
                {tier.price > 0 && (
                  <span className="text-sm text-[var(--text-secondary)]">
                    /{billing === 'monthly' ? 'month' : 'month'}
                  </span>
                )}
              </div>

              {billing === 'yearly' && yearlyDiscount > 0 && (
                <div className="text-xs text-green-600 font-medium mb-2">
                  Save {yearlyDiscount}% yearly (${tier.yearlyPrice}/year)
                </div>
              )}

              {/* Hero Video Limit Display */}
              <div className={`text-sm font-bold mb-4 flex items-center gap-2 ${
                tier.unlimitedVideos 
                  ? 'text-[var(--accent-pink)] bg-gradient-to-r from-[var(--accent-pink)]/10 to-transparent border border-[var(--accent-pink)]/20 rounded-lg px-3 py-2'
                  : 'text-[var(--text-secondary)]'
              }`}>
                {tier.unlimitedVideos && <Infinity className="w-4 h-4" />}
                {tier.videoLimit}
              </div>

              {/* Coming Soon Badge for Chatbot */}
              {tier.id !== 'free' && (
                <div className="text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-3 py-1 inline-flex items-center gap-1 mb-2">
                  <Zap className="w-3 h-3" />
                  CHATBOT COMING SOON
                </div>
              )}
            </div>

            <ul className="space-y-3 mb-8">
              {tier.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-3 text-sm">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-[var(--text-secondary)]">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleSelectPlan(tier.id)}
              disabled={isLoading}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                tier.ctaVariant === 'default'
                  ? 'bg-gradient-to-r from-[var(--accent-pink)] to-[#FF8FB3] text-white hover:shadow-[0_8px_32px_rgba(255,107,157,0.3)] hover:scale-105 font-bold disabled:hover:scale-100 disabled:hover:shadow-none'
                  : 'border border-[var(--card-border)] bg-transparent text-[var(--text-primary)] hover:bg-[var(--accent-pink)]/5 hover:border-[var(--accent-pink)] disabled:hover:bg-transparent disabled:hover:border-[var(--card-border)]'
              }`}
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLoading ? (
                tier.id === 'free' ? 'Starting...' : 'Creating checkout...'
              ) : (
                <>
                  {tier.ctaText}
                  {tier.id !== 'free' && status === 'unauthenticated' && (
                    <span className="text-xs opacity-75 ml-1">(Sign in required)</span>
                  )}
                </>
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}

export function PricingToggle({ 
  billing, 
  onBillingChange 
}: { 
  billing: 'monthly' | 'yearly';
  onBillingChange: (billing: 'monthly' | 'yearly') => void;
}) {
  return (
    <div className="flex items-center justify-center mb-12">
      <div className="bg-[var(--card-bg)] backdrop-blur-[20px] border border-[var(--card-border)] rounded-full p-1">
        <button
          onClick={() => onBillingChange('monthly')}
          className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
            billing === 'monthly'
              ? 'bg-[var(--accent-pink)] text-white shadow-[0_4px_16px_rgba(255,107,157,0.3)]'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          Monthly
        </button>
        <button
          onClick={() => onBillingChange('yearly')}
          className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 relative ${
            billing === 'yearly'
              ? 'bg-[var(--accent-pink)] text-white shadow-[0_4px_16px_rgba(255,107,157,0.3)]'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          Yearly
          <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
            Save 10%
          </span>
        </button>
      </div>
    </div>
  );
}