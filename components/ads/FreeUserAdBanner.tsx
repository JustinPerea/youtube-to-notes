'use client';

import { ResponsiveAd } from './AdBanner';
import { useShowAds } from '../../hooks/useSubscription';

interface FreeUserAdBannerProps {
  /**
   * Where this ad is placed for analytics
   */
  placement: 'home_hero' | 'process_input' | 'notes_list' | 'results_completion' | 'sidebar';
  /**
   * Custom styling
   */
  className?: string;
  /**
   * Show upgrade prompt alongside ad
   */
  showUpgradePrompt?: boolean;
}

/**
 * FreeUserAdBanner Component
 * A contextual ad banner specifically designed for free users
 * Includes upgrade prompts and strategic placement
 */
export function FreeUserAdBanner({ 
  placement, 
  className = '',
  showUpgradePrompt = false 
}: FreeUserAdBannerProps) {
  // Get subscription status for ad display logic
  const { shouldShowAds: showAds, loading: subscriptionLoading } = useShowAds();

  // Show loading state while fetching subscription
  if (subscriptionLoading) {
    return null;
  }

  // Don't show if user shouldn't see ads (Pro/Basic users)
  if (!showAds) {
    return null;
  }

  const placementMessages = {
    home_hero: {
      title: 'Transform Your Learning Experience',
      subtitle: 'Generate unlimited notes with our Pro plan',
    },
    process_input: {
      title: 'Processing Your Video...',
      subtitle: 'Upgrade for priority processing and no ads',
    },
    notes_list: {
      title: 'Your Notes Collection',
      subtitle: 'Unlock unlimited storage with Basic or Pro',
    },
    results_completion: {
      title: 'Notes Generated Successfully!',
      subtitle: 'Remove ads and get premium features',
    },
    sidebar: {
      title: 'Enhance Your Workflow',
      subtitle: 'Ad-free experience available',
    },
  };

  const message = placementMessages[placement];

  return (
    <div className={`free-user-ad-banner ${className}`}>
      {/* Upgrade Prompt (Optional) */}
      {showUpgradePrompt && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-blue-900 dark:text-blue-100 text-sm">
                {message.title}
              </h4>
              <p className="text-blue-700 dark:text-blue-200 text-xs mt-1">
                {message.subtitle}
              </p>
            </div>
            <button
              onClick={() => window.location.href = '/pricing'}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Upgrade
            </button>
          </div>
        </div>
      )}

      {/* Ad Container */}
      <div className="ad-container">
        <ResponsiveAd className="w-full" />
      </div>

      {/* Free User Notice */}
      <div className="text-center mt-2 mb-4">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Support free features by viewing ads • 
          <button
            onClick={() => window.location.href = '/pricing'}
            className="text-blue-600 dark:text-blue-400 hover:underline ml-1"
          >
            Remove ads with Basic
          </button>
        </p>
      </div>
    </div>
  );
}

/**
 * Strategic ad components for specific use cases
 */

export function HomePageAd() {
  return (
    <FreeUserAdBanner 
      placement="home_hero" 
      className="my-8 max-w-4xl mx-auto"
      showUpgradePrompt={false}
    />
  );
}

export function ProcessPageAd() {
  return (
    <FreeUserAdBanner 
      placement="process_input" 
      className="my-6"
      showUpgradePrompt={true}
    />
  );
}

export function NotesPageAd() {
  return (
    <FreeUserAdBanner 
      placement="notes_list" 
      className="my-6"
      showUpgradePrompt={true}
    />
  );
}

export function ResultsCompletionAd() {
  return (
    <FreeUserAdBanner 
      placement="results_completion" 
      className="mt-8 mb-4"
      showUpgradePrompt={true}
    />
  );
}

export function SidebarAd() {
  return (
    <FreeUserAdBanner 
      placement="sidebar" 
      className="sticky top-4"
      showUpgradePrompt={false}
    />
  );
}