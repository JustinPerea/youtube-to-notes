'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Check, Crown, Zap, ArrowRight, Home, Video } from 'lucide-react';
import Link from 'next/link';

export default function SubscriptionSuccessPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [isLoading, setIsLoading] = useState(true);
  const [subscriptionData, setSubscriptionData] = useState<any>(null);

  useEffect(() => {
    // Simulate fetching subscription data (you can implement this later with Stripe API)
    const fetchSubscriptionData = async () => {
      try {
        // For now, we'll just set loading to false after a short delay
        // In a real implementation, you'd call your API to get subscription details
        setTimeout(() => {
          setIsLoading(false);
          // Mock subscription data - replace with actual API call
          setSubscriptionData({
            tier: 'pro', // This would come from the session
            billing: 'monthly',
            amount: 19.99
          });
        }, 2000);
      } catch (error) {
        console.error('Error fetching subscription data:', error);
        setIsLoading(false);
      }
    };

    if (sessionId) {
      fetchSubscriptionData();
    } else {
      setIsLoading(false);
    }
  }, [sessionId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="max-w-md w-full text-center">
          <div className="animate-spin w-12 h-12 border-4 border-[var(--accent-pink)] border-t-transparent rounded-full mx-auto mb-4"></div>
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
              Welcome to Premium!
            </h1>
            <p className="text-xl text-[var(--text-secondary)] mb-8">
              Your subscription has been successfully activated
            </p>
          </div>

          {/* Subscription Details */}
          {subscriptionData && (
            <div className="bg-white/80 backdrop-blur-sm border border-[var(--card-border)] rounded-2xl p-6 mb-8">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Crown className="w-6 h-6 text-[var(--accent-pink)]" />
                <h3 className="text-2xl font-bold text-[var(--text-primary)] capitalize">
                  {subscriptionData.tier} Plan
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
                    Unlimited video processing
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-sm text-[var(--text-secondary)]">
                    Unlimited AI chat
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-sm text-[var(--text-secondary)]">
                    All export formats
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-sm text-[var(--text-secondary)]">
                    Priority support
                  </span>
                </div>
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
              Your premium features are now active. Start by processing your first unlimited video!
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/"
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
              href="/api/stripe/portal"
              className="text-[var(--accent-pink)] hover:underline text-sm font-medium"
            >
              Access Customer Portal
            </Link>
          </div>

          {/* Session ID (for debugging - remove in production) */}
          {sessionId && process.env.NODE_ENV === 'development' && (
            <div className="mt-8 p-4 bg-gray-100 rounded-lg">
              <p className="text-xs text-gray-600">
                Debug - Session ID: {sessionId}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}