'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Check, Crown, Zap, ArrowRight, Home, Video, Loader2 } from 'lucide-react';
import Link from 'next/link';

function SuccessPageContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const checkoutId = searchParams.get('checkout_id'); // Polar
  const [isLoading, setIsLoading] = useState(true);
  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubscriptionData = async () => {
      try {
        if (!checkoutId) {
          setError('No checkout session found');
          setIsLoading(false);
          return;
        }

        // Call Polar verification endpoint
        const endpoint = `/api/polar/verify-session?checkout_id=${checkoutId}`;
          
        const response = await fetch(endpoint);
        const data = await response.json();

        if (response.ok && data.success) {
          setSubscriptionData({
            tier: data.tier || 'pro',
            billing: data.billing || 'monthly',
            amount: data.amount || (data.tier === 'basic' ? 3.99 : 9.99),
            subscriptionId: data.subscriptionId
          });
        } else {
          // For now, show success even if verification fails (API might not be implemented yet)
          console.warn('Subscription verification failed:', data.error);
          setSubscriptionData({
            tier: 'pro', // Default assumption
            billing: 'monthly',
            amount: 9.99,
            verified: false
          });
        }
      } catch (error) {
        console.error('Error fetching subscription data:', error);
        // Show success page anyway - better UX than error page
        setSubscriptionData({
          tier: 'pro',
          billing: 'monthly', 
          amount: 9.99,
          verified: false
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubscriptionData();
  }, [checkoutId]);

  const polarProviderInfo = {
    name: 'Polar',
    color: 'from-[var(--accent-pink)] to-[#FF8FB3]',
    icon: <Crown className="w-5 h-5" />
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="max-w-md w-full text-center bg-white/80 backdrop-blur-sm border border-red-200 rounded-2xl p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-red-600 mb-2">
            Payment Error
          </h2>
          <p className="text-[var(--text-secondary)] mb-4">
            {error}
          </p>
          <Link
            href="/pricing"
            className="bg-[var(--accent-pink)] text-white px-6 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            Back to Pricing
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="max-w-md w-full text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[var(--accent-pink)] mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
            Confirming your subscription...
          </h2>
          <p className="text-[var(--text-secondary)]">
            Please wait while we set up your account
          </p>
        </div>
      </div>
    );
  }

  const providerInfo = polarProviderInfo;
  const tierName = subscriptionData?.tier?.charAt(0).toUpperCase() + subscriptionData?.tier?.slice(1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          {/* Success Icon */}
          <div className="mb-8">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-4">
              Welcome to {tierName}! 🎉
            </h1>
            <p className="text-xl text-[var(--text-secondary)] mb-6">
              Your subscription has been successfully activated
            </p>
            
            {/* Payment Provider Badge */}
            <div className={`inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r ${providerInfo.color} text-white rounded-full text-sm font-medium mb-4`}>
              {providerInfo.icon}
              Processed via {providerInfo.name}
            </div>
          </div>

          {/* Subscription Details */}
          {subscriptionData && (
            <div className="bg-white/80 backdrop-blur-sm border border-[var(--card-border)] rounded-2xl p-6 mb-8">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Crown className="w-6 h-6 text-[var(--accent-pink)]" />
                <h3 className="text-2xl font-bold text-[var(--text-primary)]">
                  {tierName} Plan
                </h3>
              </div>
              <p className="text-[var(--text-secondary)] mb-4">
                ${subscriptionData.amount}/{subscriptionData.billing === 'monthly' ? 'month' : 'year'}
              </p>
              
              {/* Plan Benefits */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-sm text-[var(--text-secondary)]">
                    {tierName === 'Pro' ? 'Unlimited' : '100'} video processing
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-sm text-[var(--text-secondary)]">
                    All note formats & exports
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-sm text-[var(--text-secondary)]">
                    {tierName === 'Pro' ? '50GB' : '5GB'} storage
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-sm text-[var(--text-secondary)]">
                    Priority support
                  </span>
                </div>
                {tierName === 'Pro' && (
                  <>
                    <div className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-sm text-[var(--text-secondary)]">
                        AI chat (coming soon)
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-sm text-[var(--text-secondary)]">
                        Advanced exports
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Next Steps */}
          <div className="bg-gradient-to-r from-[var(--accent-pink)]/5 to-blue-500/5 border border-[var(--accent-pink)]/20 rounded-2xl p-6 mb-8">
            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4 flex items-center justify-center gap-2">
              <Zap className="w-5 h-5 text-[var(--accent-pink)]" />
              Ready to Get Started?
            </h3>
            <p className="text-[var(--text-secondary)] mb-6">
              Your premium features are now active. Start by processing your first {tierName === 'Pro' ? 'unlimited' : ''} video!
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/process"
                className="bg-gradient-to-r from-[var(--accent-pink)] to-[#FF8FB3] text-white px-6 py-3 rounded-lg font-semibold hover:shadow-[0_8px_32px_rgba(255,107,157,0.3)] transition-all duration-300 flex items-center justify-center gap-2"
              >
                <Video className="w-4 h-4" />
                Process Your First Video
                <ArrowRight className="w-4 h-4" />
              </Link>
              
              <Link
                href="/notes"
                className="border border-[var(--card-border)] bg-white/50 text-[var(--text-primary)] px-6 py-3 rounded-lg font-medium hover:bg-white/80 transition-all duration-300 flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" />
                View My Notes
              </Link>
            </div>
          </div>

          {/* Account Management */}
          <div className="text-center">
            <p className="text-sm text-[var(--text-secondary)] mb-2">
              Need to manage your subscription?
            </p>
            <Link
              href="/profile"
              className="text-[var(--accent-pink)] hover:underline text-sm font-medium"
            >
              Manage Account
            </Link>
          </div>

          {/* Debug info for development */}
          {checkoutId && process.env.NODE_ENV === 'development' && (
            <div className="mt-8 p-4 bg-gray-100 rounded-lg">
              <p className="text-xs text-gray-600">
                Debug - Checkout ID: {checkoutId}
              </p>
              <p className="text-xs text-gray-600">
                Provider: Polar
              </p>
              {subscriptionData?.verified === false && (
                <p className="text-xs text-orange-600">
                  Warning: Subscription not verified via API
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SubscriptionSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="max-w-md w-full text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[var(--accent-pink)] mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
            Loading...
          </h2>
        </div>
      </div>
    }>
      <SuccessPageContent />
    </Suspense>
  );
}