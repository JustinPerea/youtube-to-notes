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

interface BillingPortalResponse {
  url: string;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [billingLoading, setBillingLoading] = useState(false);

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

  // Handle billing portal redirect
  const handleManageBilling = async () => {
    if (!session?.user) return;

    try {
      setBillingLoading(true);
      const response = await fetch('/api/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to create billing portal session');
      }

      const data: BillingPortalResponse = await response.json();
      
      // Redirect to Stripe billing portal
      window.location.href = data.url;
    } catch (err) {
      console.error('Error creating billing portal session:', err);
      setError('Failed to open billing portal');
      setBillingLoading(false);
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
            />

            {/* Account Settings Card */}
            <AccountSettingsCard />
          </div>
        </div>
        
        {/* Footer */}
        <Footer />
      </div>
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
  loading 
}: { 
  subscription?: any; 
  onManageBilling: () => void; 
  billingLoading: boolean;
  loading: boolean;
}) {
  const getPlanPrice = (tier?: string) => {
    switch (tier) {
      case 'pro': return '$19.99/month';
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
                </p>
                {subscription?.status && (
                  <p className="text-[var(--text-secondary)] mt-1">
                    Status: <span className="capitalize font-medium">{subscription.status}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Manage Billing Button */}
          <div className="billing-actions">
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
            
            <p className="text-sm text-[var(--text-secondary)] mt-4">
              Manage your subscription, update payment methods, download invoices, and cancel your subscription through our secure billing portal.
            </p>
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
function AccountSettingsCard() {
  const [deleteConfirm, setDeleteConfirm] = useState(false);

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
              
              {!deleteConfirm ? (
                <button
                  onClick={() => setDeleteConfirm(true)}
                  className="delete-account-btn bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                >
                  Delete Account
                </button>
              ) : (
                <div className="delete-confirm space-y-3">
                  <p className="text-sm font-medium text-red-800">
                    Are you sure you want to delete your account?
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        // Handle account deletion logic here
                        alert('Account deletion functionality will be implemented soon.');
                        setDeleteConfirm(false);
                      }}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                    >
                      Yes, Delete My Account
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(false)}
                      className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-400 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
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