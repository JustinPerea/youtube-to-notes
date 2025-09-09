'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface CookiePreferences {
  essential: boolean
  analytics: boolean
  advertising: boolean
  preferences: boolean
}

const COOKIE_CONSENT_KEY = 'kyoto-scribe-cookie-consent'
const COOKIE_PREFERENCES_KEY = 'kyoto-scribe-cookie-preferences'

export function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false)
  const [showPreferences, setShowPreferences] = useState(false)
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true, // Always true, can't be disabled
    analytics: false,
    advertising: false,
    preferences: false
  })

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY)
    const savedPreferences = localStorage.getItem(COOKIE_PREFERENCES_KEY)
    
    if (!consent) {
      setShowBanner(true)
    }
    
    if (savedPreferences) {
      try {
        const parsed = JSON.parse(savedPreferences)
        setPreferences(parsed)
      } catch (error) {
        console.error('Error parsing cookie preferences:', error)
      }
    }
  }, [])

  const savePreferences = (newPreferences: CookiePreferences) => {
    setPreferences(newPreferences)
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(newPreferences))
    localStorage.setItem(COOKIE_CONSENT_KEY, 'true')
    setShowBanner(false)
    setShowPreferences(false)
    
    // Apply cookie preferences
    applyCookiePreferences(newPreferences)
  }

  const acceptAll = () => {
    const allAccepted: CookiePreferences = {
      essential: true,
      analytics: true,
      advertising: true,
      preferences: true
    }
    savePreferences(allAccepted)
  }

  const rejectNonEssential = () => {
    const essentialOnly: CookiePreferences = {
      essential: true,
      analytics: false,
      advertising: false,
      preferences: false
    }
    savePreferences(essentialOnly)
  }

  const applyCookiePreferences = (prefs: CookiePreferences) => {
    // This function would integrate with your analytics and advertising services
    // For now, we'll just log the preferences
    console.log('Cookie preferences applied:', prefs)
    
    // In a real implementation, you would:
    // - Enable/disable Google Analytics based on prefs.analytics
    // - Enable/disable AdSense based on prefs.advertising
    // - Set user preferences based on prefs.preferences
  }

  if (!showBanner) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 shadow-lg">
      <div className="container max-w-6xl mx-auto px-4 py-4">
        {!showPreferences ? (
          // Main cookie banner
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
            <div className="flex-1">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  🍪
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                    We use cookies to enhance your experience
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">
                    We use cookies to provide you with a better experience, analyze site usage, 
                    and show you relevant advertisements. Essential cookies are required for the site to function.
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <Link 
                      href="/privacy/cookies" 
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Learn more about cookies
                    </Link>
                    <span className="text-slate-400">•</span>
                    <button
                      onClick={() => setShowPreferences(true)}
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Customize preferences
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 lg:flex-shrink-0">
              <button
                onClick={rejectNonEssential}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
              >
                Reject Non-Essential
              </button>
              <button
                onClick={acceptAll}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                Accept All
              </button>
            </div>
          </div>
        ) : (
          // Cookie preferences panel
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Cookie Preferences
              </h3>
              <button
                onClick={() => setShowPreferences(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Essential Cookies */}
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                <div>
                  <h4 className="font-medium text-slate-900 dark:text-white">Essential Cookies</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Required for the website to function properly
                  </p>
                </div>
                <div className="flex items-center">
                  <span className="text-sm text-slate-500 dark:text-slate-400 mr-2">Always Active</span>
                  <div className="w-10 h-6 bg-blue-600 rounded-full flex items-center justify-end px-1">
                    <div className="w-4 h-4 bg-white rounded-full"></div>
                  </div>
                </div>
              </div>

              {/* Analytics Cookies */}
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                <div>
                  <h4 className="font-medium text-slate-900 dark:text-white">Analytics Cookies</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Help us understand how visitors interact with our website
                  </p>
                </div>
                <button
                  onClick={() => setPreferences(prev => ({ ...prev, analytics: !prev.analytics }))}
                  className={`w-10 h-6 rounded-full flex items-center transition-colors ${
                    preferences.analytics ? 'bg-blue-600 justify-end' : 'bg-slate-300 dark:bg-slate-600 justify-start'
                  }`}
                >
                  <div className="w-4 h-4 bg-white rounded-full mx-1"></div>
                </button>
              </div>

              {/* Advertising Cookies */}
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                <div>
                  <h4 className="font-medium text-slate-900 dark:text-white">Advertising Cookies</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Used to show you relevant advertisements and measure ad effectiveness
                  </p>
                </div>
                <button
                  onClick={() => setPreferences(prev => ({ ...prev, advertising: !prev.advertising }))}
                  className={`w-10 h-6 rounded-full flex items-center transition-colors ${
                    preferences.advertising ? 'bg-blue-600 justify-end' : 'bg-slate-300 dark:bg-slate-600 justify-start'
                  }`}
                >
                  <div className="w-4 h-4 bg-white rounded-full mx-1"></div>
                </button>
              </div>

              {/* Preference Cookies */}
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                <div>
                  <h4 className="font-medium text-slate-900 dark:text-white">Preference Cookies</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Remember your choices and preferences (theme, language, etc.)
                  </p>
                </div>
                <button
                  onClick={() => setPreferences(prev => ({ ...prev, preferences: !prev.preferences }))}
                  className={`w-10 h-6 rounded-full flex items-center transition-colors ${
                    preferences.preferences ? 'bg-blue-600 justify-end' : 'bg-slate-300 dark:bg-slate-600 justify-start'
                  }`}
                >
                  <div className="w-4 h-4 bg-white rounded-full mx-1"></div>
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setShowPreferences(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => savePreferences(preferences)}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                Save Preferences
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
