'use client';

import React, { useState, useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { OrbBackground } from '../../components/ui/OrbBackground';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import { Footer } from '../../components/Footer';

interface UsageData {
  userId: string;
  month: string;
  subscription: {
    id: string;
    userId: string;
    tier: 'free' | 'basic' | 'pro';
    status: 'active' | 'canceled' | 'past_due' | 'incomplete';
    currentPeriodEnd?: Date;
    cancelAtPeriodEnd?: boolean;
    adminOverride?: {
      tier: 'free' | 'basic' | 'pro';
      expires?: Date;
    };
  };
  videosProcessed: number;
  aiQuestionsAsked: number;
  storageUsedMb: number;
  videoLimit: number;
  aiQuestionLimit: number;
  storageLimitMb: number;
  canProcessVideo: boolean;
  canUseAI: boolean;
  canUseStorage: boolean;
  resetDate: Date;
}

interface BillingManagementResponse {
  type: 'upgrade' | 'manage' | 'limited';
  url?: string;
  message?: string;
  options?: Array<{
    title: string;
    description: string;
    action: string;
    url?: string;
    warning?: string;
  }>;
  subscriptionDetails?: {
    tier: string;
    status: string;
    provider: string;
    currentPeriodStart?: Date;
    currentPeriodEnd?: Date;
    polarSubscriptionId?: string;
    polarCustomerId?: string;
    actualPrice?: string;
    discountApplied?: boolean;
    currency?: string;
    billingInterval?: string;
  };
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [billingLoading, setBillingLoading] = useState(false);
  const [showBillingOptions, setShowBillingOptions] = useState(false);
  const [billingOptions, setBillingOptions] = useState<BillingManagementResponse | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fetch user usage data
  useEffect(() => {
    const fetchUsageData = async () => {
      if (!session?.user?.id) return;

      try {
        setLoading(true);
        const response = await fetch('/api/usage', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch usage data');
        }

        const data = await response.json();
        setUsageData(data);
      } catch (err) {
        console.error('Error fetching usage data:', err);
        setError('Failed to load usage data');
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.id) {
      fetchUsageData();
    } else if (status !== 'loading') {
      setLoading(false);
    }
  }, [session, status]);

  // Handle billing management options
  const handleManageBilling = async () => {
    if (!session?.user) return;

    try {
      setBillingLoading(true);
      const response = await fetch('/api/polar/billing-portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to get billing management options');
      }

      const data: BillingManagementResponse = await response.json();
      
      if (data.type === 'upgrade' && data.url) {
        // Direct redirect for free users
        window.location.href = data.url;
      } else {
        // Show billing options modal for paid users
        setBillingOptions(data);
        setShowBillingOptions(true);
      }
    } catch (err) {
      console.error('Error getting billing management options:', err);
      setError('Failed to open billing management');
    } finally {
      setBillingLoading(false);
    }
  };

  // Handle billing option selection
  const handleBillingOption = async (option: any) => {
    if (option.action === 'polar_portal') {
      // Redirect to Polar customer portal for subscription management
      if (option.url) {
        const confirmMessage = 'You will be redirected to Polar\'s secure customer portal where you can:\n\n' +
          '• Cancel your subscription\n' +
          '• Update payment methods\n' +
          '• View billing history\n' +
          '• Modify subscription settings\n\n' +
          'Continue to Polar?';

        if (confirm(confirmMessage)) {
          window.open(option.url, '_blank');
        }
      } else {
        alert('Unable to open Polar portal. Please contact support@shibabrothers.com for assistance.');
      }
    } else if (option.url) {
      if (option.action === 'support') {
        window.location.href = option.url;
      } else {
        window.open(option.url, '_blank');
      }
    }
    setShowBillingOptions(false);
  };

  // Handle account deletion
  const handleDeleteAccount = async (confirmationText: string, reason?: string) => {
    if (!session?.user) return;

    try {
      setDeleteLoading(true);
      const response = await fetch('/api/account/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          confirmationText,
          reason
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete account');
      }

      // Show success message
      alert(`Account deletion successful!\n\n${data.message}\n\nYou have until ${new Date(data.details.gracePeriodEnd).toLocaleDateString()} to contact support if you change your mind.`);
      
      // Sign out user
      window.location.href = '/auth/signin?message=account-deleted';

    } catch (err) {
      console.error('Error deleting account:', err);
      setError(`Failed to delete account: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setDeleteLoading(false);
      setShowDeleteModal(false);
    }
  };

  // Redirect to sign-in if not authenticated
  if (status === 'loading') {
    return <LoadingScreen />;
  }

  if (!session) {
    signIn();
    return <LoadingScreen />;
  }

  const user = session.user;
  const subscription = usageData?.subscription;

  return (
    <div className="min-h-screen">
      {/* Animated Orbs Background */}
      <OrbBackground />
      
      {/* Content Wrapper */}
      <div className="content-wrapper relative z-10">
        {/* Theme Toggle */}
        <ThemeToggle />
        
        {/* Main Container */}
        <div className="container max-w-[1000px] mx-auto pt-20 pb-10 px-5">
          {/* Page Header */}
          <section className="page-header text-center py-10">
            <h1 className="hero-title text-5xl font-extrabold leading-tight mb-4 bg-gradient-to-br from-[var(--text-primary)] to-[var(--accent-pink)] bg-clip-text text-transparent">
              Your Profile
            </h1>
            <p className="hero-subtitle text-lg text-[var(--text-secondary)] mb-8 max-w-[600px] mx-auto leading-relaxed">
              Manage your account, subscription, and preferences
            </p>
          </section>

          {error && (
            <div className="error-banner bg-red-100 border border-red-300 text-red-700 px-6 py-4 rounded-2xl mb-8">
              <p className="font-medium">Error: {error}</p>
            </div>
          )}

          {/* Profile Content */}
          <div className="profile-content grid gap-8">
            
            {/* Profile Header Card */}
            <ProfileHeaderCard 
              user={user} 
              subscription={subscription}
              loading={loading}
            />

            {/* Subscription Overview Card */}
            <SubscriptionOverviewCard 
              usageData={usageData}
              loading={loading}
            />

            {/* Billing Management Card */}
            <BillingManagementCard 
              subscription={subscription}
              onManageBilling={handleManageBilling}
              billingLoading={billingLoading}
              loading={loading}
              billingOptions={billingOptions}
            />

            {/* Account Settings Card */}
            <AccountSettingsCard 
              onDeleteAccount={() => setShowDeleteModal(true)}
              deleteLoading={deleteLoading}
            />
          </div>
        </div>
        
        {/* Footer */}
        <Footer />
      </div>

      {/* Billing Options Modal */}
      {showBillingOptions && billingOptions && (
        <BillingOptionsModal
          options={billingOptions}
          onClose={() => setShowBillingOptions(false)}
          onSelect={handleBillingOption}
        />
      )}

      {/* Account Deletion Modal */}
      {showDeleteModal && (
        <AccountDeletionModal
          user={usageData}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteAccount}
          loading={deleteLoading}
        />
      )}
    </div>
  );
}

// Profile Header Card Component
function ProfileHeaderCard({ 
  user, 
  subscription, 
  loading 
}: { 
  user: any; 
  subscription?: any; 
  loading: boolean;
}) {
  const getTierBadgeColor = (tier?: string) => {
    switch (tier) {
      case 'pro': return 'bg-gradient-to-r from-[var(--accent-pink)] to-purple-500 text-white';
      case 'basic': return 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white';
      default: return 'bg-gray-100 text-gray-700 border border-gray-300';
    }
  };

  const getTierLabel = (tier?: string) => {
    switch (tier) {
      case 'pro': return 'Pro';
      case 'basic': return 'Student';
      default: return 'Free';
    }
  };

  return (
    <div className="profile-header-card bg-[var(--card-bg)] backdrop-blur-[20px] border border-[var(--card-border)] rounded-3xl p-8 shadow-[var(--card-shadow)]">
      <div className="flex items-start gap-6 flex-col sm:flex-row">
        {/* Avatar */}
        <div className="profile-avatar flex-shrink-0">
          <img
            src={user.image || '/default-avatar.png'}
            alt={user.name || 'User Avatar'}
            className="w-24 h-24 rounded-full border-4 border-white shadow-lg object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&size=96&background=FF6B9D&color=ffffff&font-size=0.4`;
            }}
          />
        </div>

        {/* User Info */}
        <div className="profile-info flex-grow">
          <div className="flex items-start gap-4 flex-col sm:flex-row sm:items-center">
            <div className="user-details">
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
                {user.name || 'Anonymous User'}
              </h2>
              <p className="text-[var(--text-secondary)] text-lg mb-4">
                {user.email}
              </p>
            </div>

            {/* Subscription Badge */}
            <div className="subscription-badge flex-shrink-0">
              {loading ? (
                <div className="animate-pulse bg-gray-200 rounded-full px-4 py-2 w-20 h-8"></div>
              ) : (
                <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${getTierBadgeColor(subscription?.tier)}`}>
                  {getTierLabel(subscription?.tier)}
                  {subscription?.adminOverride && (
                    <span className="ml-2 text-xs opacity-75">(Override)</span>
                  )}
                </span>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="quick-stats grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
            <div className="stat-item text-center sm:text-left">
              <p className="text-sm text-[var(--text-secondary)] mb-1">Videos Processed</p>
              <p className="text-xl font-semibold text-[var(--text-primary)]">
                {loading ? '...' : (subscription ? `${subscription.videosProcessed || 0}` : '0')}
              </p>
            </div>
            <div className="stat-item text-center sm:text-left">
              <p className="text-sm text-[var(--text-secondary)] mb-1">AI Questions</p>
              <p className="text-xl font-semibold text-[var(--text-primary)]">
                {loading ? '...' : (subscription ? `${subscription.aiQuestionsAsked || 0}` : '0')}
              </p>
            </div>
            <div className="stat-item text-center sm:text-left">
              <p className="text-sm text-[var(--text-secondary)] mb-1">Storage Used</p>
              <p className="text-xl font-semibold text-[var(--text-primary)]">
                {loading ? '...' : (subscription ? `${Math.round((subscription.storageUsedMb || 0) / 1024 * 10) / 10}GB` : '0GB')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Subscription Overview Card Component
function SubscriptionOverviewCard({ 
  usageData, 
  loading 
}: { 
  usageData: UsageData | null; 
  loading: boolean;
}) {
  const formatLimit = (limit: number) => {
    return limit === -1 ? 'Unlimited' : limit.toString();
  };

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'N/A';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getUsagePercentage = (current: number, limit: number) => {
    if (limit === -1) return 0; // Unlimited
    return Math.min((current / limit) * 100, 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-orange-500';
    return 'bg-[var(--accent-pink)]';
  };

  return (
    <div className="subscription-overview-card bg-[var(--card-bg)] backdrop-blur-[20px] border border-[var(--card-border)] rounded-3xl p-8 shadow-[var(--card-shadow)]">
      <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-6">
        Subscription Overview
      </h3>

      {loading ? (
        <div className="loading-skeleton space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-6 bg-gray-200 rounded w-full mb-1"></div>
              <div className="h-2 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : usageData ? (
        <>
          {/* Current Plan Status */}
          <div className="plan-status mb-8 p-6 bg-gradient-to-r from-[var(--accent-pink-soft)] to-[var(--accent-lavender)] rounded-2xl">
            <div className="flex justify-between items-start flex-col sm:flex-row gap-4">
              <div>
                <h4 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                  Current Plan: {usageData.subscription.tier.charAt(0).toUpperCase() + usageData.subscription.tier.slice(1)}
                </h4>
                <p className="text-[var(--text-secondary)]">
                  Status: <span className="capitalize font-medium">{usageData.subscription.status}</span>
                </p>
                {usageData.subscription.currentPeriodEnd && (
                  <p className="text-[var(--text-secondary)] mt-1">
                    {usageData.subscription.cancelAtPeriodEnd ? 'Expires' : 'Renews'}: {formatDate(usageData.subscription.currentPeriodEnd)}
                  </p>
                )}
              </div>
              
              {usageData.subscription.tier !== 'free' && (
                <div className="text-right">
                  <p className="text-sm text-[var(--text-secondary)]">Monthly Reset</p>
                  <p className="font-semibold text-[var(--text-primary)]">
                    {formatDate(usageData.resetDate)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Usage Statistics */}
          <div className="usage-stats grid gap-6">
            
            {/* Videos */}
            <div className="usage-item">
              <div className="flex justify-between items-center mb-3">
                <h5 className="font-semibold text-[var(--text-primary)]">Videos Processed</h5>
                <span className="text-sm text-[var(--text-secondary)]">
                  {usageData.videosProcessed} / {formatLimit(usageData.videoLimit)}
                </span>
              </div>
              {usageData.videoLimit !== -1 && (
                <div className="progress-bar bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div 
                    className={`progress-fill h-full rounded-full transition-all duration-500 ${getUsageColor(getUsagePercentage(usageData.videosProcessed, usageData.videoLimit))}`}
                    style={{ width: `${getUsagePercentage(usageData.videosProcessed, usageData.videoLimit)}%` }}
                  ></div>
                </div>
              )}
              {usageData.videoLimit === -1 && (
                <p className="text-sm text-green-600 font-medium">✓ Unlimited videos available</p>
              )}
            </div>

            {/* AI Questions */}
            <div className="usage-item">
              <div className="flex justify-between items-center mb-3">
                <h5 className="font-semibold text-[var(--text-primary)]">AI Questions</h5>
                <span className="text-sm text-[var(--text-secondary)]">
                  {usageData.aiQuestionsAsked} / {formatLimit(usageData.aiQuestionLimit)}
                </span>
              </div>
              {usageData.aiQuestionLimit === 0 && (
                <p className="text-sm text-gray-500">AI chat not available in your current plan</p>
              )}
              {usageData.aiQuestionLimit > 0 && usageData.aiQuestionLimit !== -1 && (
                <div className="progress-bar bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div 
                    className={`progress-fill h-full rounded-full transition-all duration-500 ${getUsageColor(getUsagePercentage(usageData.aiQuestionsAsked, usageData.aiQuestionLimit))}`}
                    style={{ width: `${getUsagePercentage(usageData.aiQuestionsAsked, usageData.aiQuestionLimit)}%` }}
                  ></div>
                </div>
              )}
              {usageData.aiQuestionLimit === -1 && (
                <p className="text-sm text-green-600 font-medium">✓ Unlimited AI questions available</p>
              )}
            </div>

            {/* Storage */}
            <div className="usage-item">
              <div className="flex justify-between items-center mb-3">
                <h5 className="font-semibold text-[var(--text-primary)]">Storage Used</h5>
                <span className="text-sm text-[var(--text-secondary)]">
                  {Math.round((usageData.storageUsedMb / 1024) * 10) / 10}GB / {Math.round((usageData.storageLimitMb / 1024) * 10) / 10}GB
                </span>
              </div>
              <div className="progress-bar bg-gray-200 rounded-full h-3 overflow-hidden">
                <div 
                  className={`progress-fill h-full rounded-full transition-all duration-500 ${getUsageColor(getUsagePercentage(usageData.storageUsedMb, usageData.storageLimitMb))}`}
                  style={{ width: `${getUsagePercentage(usageData.storageUsedMb, usageData.storageLimitMb)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-8">
          <p className="text-[var(--text-secondary)]">Unable to load subscription data</p>
        </div>
      )}
    </div>
  );
}

// Billing Management Card Component
function BillingManagementCard({ 
  subscription, 
  onManageBilling, 
  billingLoading, 
  loading,
  billingOptions
}: { 
  subscription?: any; 
  onManageBilling: () => void; 
  billingLoading: boolean;
  loading: boolean;
  billingOptions?: BillingManagementResponse | null;
}) {
  const [cancelLoading, setCancelLoading] = React.useState(false);
  const getPlanPrice = (tier?: string) => {
    // Try to get actual price from billing options first
    if (billingOptions?.subscriptionDetails?.actualPrice) {
      return billingOptions.subscriptionDetails.actualPrice;
    }
    
    // Fallback to hardcoded prices
    switch (tier) {
      case 'pro': return '$9.99/month';
      case 'basic': return '$9.99/month';
      default: return 'Free';
    }
  };

  return (
    <div className="billing-management-card bg-[var(--card-bg)] backdrop-blur-[20px] border border-[var(--card-border)] rounded-3xl p-8 shadow-[var(--card-shadow)]">
      <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-6">
        Billing Management
      </h3>

      {loading ? (
        <div className="loading-skeleton space-y-4">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-10 bg-gray-200 rounded w-40"></div>
          </div>
        </div>
      ) : (
        <div className="billing-content">
          <div className="current-plan mb-6 p-6 bg-gradient-to-r from-[var(--accent-pink-soft)] to-[var(--accent-coral)] rounded-2xl">
            <div className="flex justify-between items-center flex-col sm:flex-row gap-4">
              <div>
                <h4 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                  {subscription?.tier ? `${subscription.tier.charAt(0).toUpperCase() + subscription.tier.slice(1)} Plan` : 'Free Plan'}
                </h4>
                <p className="text-[var(--text-secondary)]">
                  Current Rate: <span className="font-medium">{getPlanPrice(subscription?.tier)}</span>
                  {billingOptions?.subscriptionDetails?.discountApplied && (
                    <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                      Discount Applied
                    </span>
                  )}
                </p>
                {subscription?.status && (
                  <p className="text-[var(--text-secondary)] mt-1">
                    Status: <span className="capitalize font-medium">{subscription.status}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Manage / Cancel Actions */}
          <div className="billing-actions flex flex-col sm:flex-row gap-3">
            <button
              onClick={onManageBilling}
              disabled={billingLoading}
              className="manage-billing-btn bg-[var(--accent-pink)] text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 hover:bg-[var(--accent-pink)] hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {billingLoading ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                  Opening Billing Portal...
                </span>
              ) : (
                'Manage Billing & Subscriptions'
              )}
            </button>
            {subscription?.tier && subscription.tier !== 'free' && (
              <button
                onClick={async () => {
                  if (cancelLoading) return;
                  const confirmText = 'This will cancel your subscription at the end of the current billing period. You will retain access until then. Continue?';
                  if (!window.confirm(confirmText)) return;
                  try {
                    setCancelLoading(true);
                    const res = await fetch('/api/polar/cancel-subscription', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                    });
                    const json = await res.json().catch(() => ({}));
                    if (!res.ok || !json.success) {
                      alert(`Failed to schedule cancellation${json?.details ? `: ${json.details}` : ''}`);
                      return;
                    }
                    alert('Cancellation scheduled. Your plan remains active until the current period ends.');
                    window.location.reload();
                  } catch (e: any) {
                    alert(`Failed to cancel: ${e?.message || 'Unknown error'}`);
                  } finally {
                    setCancelLoading(false);
                  }
                }}
                disabled={cancelLoading || subscription?.cancelAtPeriodEnd}
                className="cancel-at-period-end-btn bg-white text-[var(--text-primary)] border border-[var(--card-border)] px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                title={subscription?.cancelAtPeriodEnd ? 'Cancellation already scheduled' : 'Cancel at period end'}
              >
                {subscription?.cancelAtPeriodEnd
                  ? 'Cancellation Scheduled'
                  : cancelLoading
                    ? 'Scheduling…'
                    : 'Cancel at Period End'}
              </button>
            )}
            
            <div className="mt-2 text-sm text-[var(--text-secondary)]">
              <p>Manage your subscription, update payment methods, and download invoices in the billing portal.</p>
              {subscription?.tier && subscription.tier !== 'free' && (
                <p className="mt-1">Use “Cancel at Period End” to stop renewals while retaining access until your period ends.</p>
              )}
            </div>
          </div>

          {/* Upgrade/Downgrade Info */}
          {subscription?.tier === 'free' && (
            <div className="upgrade-prompt mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <h5 className="font-semibold text-blue-900 mb-2">Ready to upgrade?</h5>
              <p className="text-blue-700 text-sm mb-3">
                Get unlimited videos, AI chat, and advanced export formats with our paid plans.
              </p>
              <a 
                href="/pricing" 
                className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                View Pricing Plans
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Account Settings Card Component  
function AccountSettingsCard({ 
  onDeleteAccount, 
  deleteLoading 
}: { 
  onDeleteAccount: () => void; 
  deleteLoading: boolean; 
}) {

  return (
    <div className="account-settings-card bg-[var(--card-bg)] backdrop-blur-[20px] border border-[var(--card-border)] rounded-3xl p-8 shadow-[var(--card-shadow)]">
      <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-6">
        Account Settings
      </h3>

      <div className="settings-sections space-y-8">
        
        {/* Theme Preferences */}
        <div className="setting-section">
          <h4 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
            Appearance
          </h4>
          <div className="setting-item p-4 bg-[var(--accent-pink-soft)] rounded-xl">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium text-[var(--text-primary)]">Theme Preference</p>
                <p className="text-sm text-[var(--text-secondary)]">Use the theme toggle in the top right to switch between light and dark modes</p>
              </div>
              <div className="theme-indicator w-12 h-6 bg-gray-300 rounded-full relative">
                <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="setting-section">
          <h4 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
            Notifications
          </h4>
          <div className="space-y-3">
            <div className="setting-item p-4 bg-gray-50 rounded-xl opacity-60">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-[var(--text-primary)]">Email Notifications</p>
                  <p className="text-sm text-[var(--text-secondary)]">Receive updates about your account and usage</p>
                </div>
                <div className="toggle-placeholder text-sm text-gray-500 px-3 py-1 bg-gray-200 rounded">
                  Coming Soon
                </div>
              </div>
            </div>
            
            <div className="setting-item p-4 bg-gray-50 rounded-xl opacity-60">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-[var(--text-primary)]">Processing Alerts</p>
                  <p className="text-sm text-[var(--text-secondary)]">Get notified when video processing is complete</p>
                </div>
                <div className="toggle-placeholder text-sm text-gray-500 px-3 py-1 bg-gray-200 rounded">
                  Coming Soon
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="setting-section">
          <h4 className="text-lg font-semibold text-red-600 mb-4">
            Danger Zone
          </h4>
          <div className="setting-item p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="space-y-4">
              <div>
                <p className="font-medium text-red-800 mb-2">Delete Account</p>
                <p className="text-sm text-red-700 mb-4">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
              </div>
              
              <button
                onClick={onDeleteAccount}
                disabled={deleteLoading}
                className="delete-account-btn bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleteLoading ? 'Deleting Account...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Billing Options Modal Component
function BillingOptionsModal({ 
  options, 
  onClose, 
  onSelect 
}: { 
  options: BillingManagementResponse; 
  onClose: () => void; 
  onSelect: (option: any) => void;
}) {
  return (
    <div className="billing-modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="billing-modal-content bg-white rounded-2xl max-w-md w-full max-h-[80vh] overflow-y-auto shadow-2xl">
        {/* Modal Header */}
        <div className="modal-header border-b border-gray-200 p-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-gray-900">
              {options.type === 'manage' ? 'Manage Subscription' : 'Billing Management'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {options.message && (
            <p className="text-gray-600 mt-2">{options.message}</p>
          )}
        </div>

        {/* Modal Body */}
        <div className="modal-body p-6">
          {/* Subscription Details */}
          {options.subscriptionDetails && (
            <div className="subscription-details mb-6 p-4 bg-gray-50 rounded-xl">
              <h4 className="font-semibold text-gray-900 mb-3">Current Subscription</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Plan:</span>
                  <span className="font-medium text-gray-900 capitalize">
                    {options.subscriptionDetails.tier}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="font-medium text-gray-900 capitalize">
                    {options.subscriptionDetails.status}
                  </span>
                </div>
                {options.subscriptionDetails.currentPeriodEnd && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Next billing:</span>
                    <span className="font-medium text-gray-900">
                      {new Date(options.subscriptionDetails.currentPeriodEnd).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {options.subscriptionDetails.actualPrice && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Current rate:</span>
                    <span className="font-medium text-gray-900">
                      {options.subscriptionDetails.actualPrice}
                      {options.subscriptionDetails.discountApplied && (
                        <span className="ml-2 px-1.5 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
                          Discounted
                        </span>
                      )}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Provider:</span>
                  <span className="font-medium text-gray-900 capitalize">
                    {options.subscriptionDetails.provider}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Billing Options */}
          {options.options && options.options.length > 0 && (
            <div className="billing-options space-y-3">
              <h4 className="font-semibold text-gray-900 mb-3">Available Actions</h4>
              {options.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => onSelect(option)}
                  className={`billing-option-btn w-full text-left p-4 rounded-xl border-2 transition-all duration-200 hover:scale-[1.02] ${
                    option.action === 'cancel' 
                      ? 'border-red-200 bg-red-50 hover:border-red-300 hover:bg-red-100'
                      : 'border-gray-200 bg-gray-50 hover:border-[var(--accent-pink)] hover:bg-[var(--accent-pink-soft)]'
                  }`}
                >
                  <div className="option-content">
                    <h5 className={`font-semibold mb-1 ${
                      option.action === 'cancel' ? 'text-red-800' : 'text-gray-900'
                    }`}>
                      {option.title}
                    </h5>
                    <p className={`text-sm ${
                      option.action === 'cancel' ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {option.description}
                    </p>
                    {option.warning && (
                      <p className="text-xs text-orange-600 mt-2 font-medium">
                        ⚠️ {option.warning}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="modal-footer border-t border-gray-200 p-6">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Account Deletion Modal Component
function AccountDeletionModal({ 
  user, 
  onClose, 
  onConfirm, 
  loading 
}: { 
  user: UsageData | null; 
  onClose: () => void; 
  onConfirm: (confirmationText: string, reason?: string) => void;
  loading: boolean;
}) {
  const [confirmationText, setConfirmationText] = useState('');
  const [reason, setReason] = useState('');
  const [step, setStep] = useState(1);

  const handleConfirm = () => {
    if (confirmationText === 'DELETE') {
      onConfirm(confirmationText, reason || undefined);
    }
  };

  const isPaidUser = user?.subscription?.tier && user.subscription.tier !== 'free';

  return (
    <div className="deletion-modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="deletion-modal-content bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Modal Header */}
        <div className="modal-header border-b border-gray-200 p-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-red-600">
              ⚠️ Delete Account
            </h3>
            <button
              onClick={onClose}
              disabled={loading}
              className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="modal-body p-6">
          {step === 1 && (
            <div className="warning-step space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <h4 className="font-semibold text-red-800 mb-2">This action cannot be undone!</h4>
                <p className="text-red-700 text-sm">
                  Deleting your account will permanently remove all your data, including:
                </p>
                <ul className="text-red-700 text-sm mt-2 ml-4 list-disc">
                  <li>All processed videos and generated content</li>
                  <li>Your saved notes and templates</li>
                  <li>Account settings and preferences</li>
                  <li>Usage history and analytics</li>
                </ul>
              </div>

              {isPaidUser && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                  <h4 className="font-semibold text-orange-800 mb-2">Subscription Information</h4>
                  <p className="text-orange-700 text-sm">
                    You currently have a <strong>{user?.subscription?.tier}</strong> subscription.
                  </p>
                  <ul className="text-orange-700 text-sm mt-2 ml-4 list-disc">
                    <li><strong>No refund</strong> will be issued for the current billing period</li>
                    <li>Your subscription will be <strong>cancelled at the end of the current period</strong></li>
                    <li>You can continue using premium features until: <strong>{user?.subscription?.currentPeriodEnd ? new Date(user.subscription.currentPeriodEnd).toLocaleDateString() : 'end of period'}</strong></li>
                  </ul>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h4 className="font-semibold text-blue-800 mb-2">30-Day Recovery Period</h4>
                <p className="text-blue-700 text-sm">
                  After deletion, you'll have <strong>30 days</strong> to contact support if you change your mind. After this period, all data will be permanently removed.
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setStep(2)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  I Understand, Continue
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="confirmation-step space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type "DELETE" to confirm:
                  </label>
                  <input
                    type="text"
                    value={confirmationText}
                    onChange={(e) => setConfirmationText(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="Type DELETE here"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for leaving (optional):
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                    placeholder="Help us improve by telling us why you're leaving..."
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  onClick={() => setStep(1)}
                  disabled={loading}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
                >
                  Back
                </button>
                <div className="space-x-3">
                  <button
                    onClick={onClose}
                    disabled={loading}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={loading || confirmationText !== 'DELETE'}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                        Deleting Account...
                      </span>
                    ) : (
                      'Delete My Account'
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Loading Screen Component
function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <OrbBackground />
      <div className="loading-container relative z-10 text-center">
        <div className="animate-spin w-12 h-12 border-4 border-[var(--accent-pink)] border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-[var(--text-secondary)] text-lg">Loading your profile...</p>
      </div>
    </div>
  );
}
