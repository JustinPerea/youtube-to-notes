'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Check, X, Shield, FileText, Mail, Calendar } from 'lucide-react';

interface WelcomeModalProps {
  isOpen: boolean;
  onComplete: (agreements: UserAgreements) => void;
  onSkip?: () => void;
}

interface UserAgreements {
  tosAccepted: boolean;
  privacyAccepted: boolean;
  marketingConsent: boolean;
  ageVerified: boolean;
}

export function WelcomeModal({ isOpen, onComplete, onSkip }: WelcomeModalProps) {
  const { data: session } = useSession();
  const [agreements, setAgreements] = useState<UserAgreements>({
    tosAccepted: false,
    privacyAccepted: false,
    marketingConsent: false,
    ageVerified: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!agreements.tosAccepted || !agreements.privacyAccepted || !agreements.ageVerified) {
      return; // Required fields not checked
    }

    // Check if user is authenticated
    if (!session?.user) {
      setError('Please sign in to complete onboarding');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    
    try {
      console.log('Session:', session);
      console.log('Submitting onboarding data:', agreements);
      await onComplete(agreements);
      console.log('Onboarding completed successfully');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      setError(error instanceof Error ? error.message : 'Failed to complete onboarding. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = agreements.tosAccepted && agreements.privacyAccepted && agreements.ageVerified;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-3xl max-w-lg w-full p-8 shadow-2xl border border-gray-100 dark:border-gray-800">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <span className="text-3xl">🐕</span>
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-3">
            Welcome to Kyoto Scribe!
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            Hi {session?.user?.name?.split(' ')[0] || 'there'}! Let's get you set up with a few quick agreements.
          </p>
        </div>

        {/* Agreements */}
        <div className="space-y-5 mb-8">
          {/* Age Verification */}
          <label className="flex items-start gap-4 cursor-pointer group p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-pink-300 dark:hover:border-pink-500 transition-all duration-200 hover:shadow-md">
            <div className="relative mt-1">
              <input
                type="checkbox"
                checked={agreements.ageVerified}
                onChange={(e) => setAgreements(prev => ({ ...prev, ageVerified: e.target.checked }))}
                className="sr-only"
              />
              <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200 ${
                agreements.ageVerified 
                  ? 'bg-gradient-to-r from-pink-500 to-purple-500 border-pink-500 shadow-lg' 
                  : 'border-gray-300 dark:border-gray-600 group-hover:border-pink-400'
              }`}>
                {agreements.ageVerified && <Check className="w-4 h-4 text-white" />}
              </div>
            </div>
            <div className="flex-1">
              <span className="text-base font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-pink-500" />
                Age Verification <span className="text-red-500 text-lg">*</span>
              </span>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                I confirm that I am 13 years of age or older.
              </p>
            </div>
          </label>

          {/* Terms of Service */}
          <label className="flex items-start gap-4 cursor-pointer group p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-pink-300 dark:hover:border-pink-500 transition-all duration-200 hover:shadow-md">
            <div className="relative mt-1">
              <input
                type="checkbox"
                checked={agreements.tosAccepted}
                onChange={(e) => setAgreements(prev => ({ ...prev, tosAccepted: e.target.checked }))}
                className="sr-only"
              />
              <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200 ${
                agreements.tosAccepted 
                  ? 'bg-gradient-to-r from-pink-500 to-purple-500 border-pink-500 shadow-lg' 
                  : 'border-gray-300 dark:border-gray-600 group-hover:border-pink-400'
              }`}>
                {agreements.tosAccepted && <Check className="w-4 h-4 text-white" />}
              </div>
            </div>
            <div className="flex-1">
              <span className="text-base font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-pink-500" />
                Terms of Service <span className="text-red-500 text-lg">*</span>
              </span>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                I agree to the{' '}
                <a href="/terms" target="_blank" className="text-pink-500 hover:text-pink-600 font-medium hover:underline transition-colors">
                  Terms of Service
                </a>
              </p>
            </div>
          </label>

          {/* Privacy Policy */}
          <label className="flex items-start gap-4 cursor-pointer group p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-pink-300 dark:hover:border-pink-500 transition-all duration-200 hover:shadow-md">
            <div className="relative mt-1">
              <input
                type="checkbox"
                checked={agreements.privacyAccepted}
                onChange={(e) => setAgreements(prev => ({ ...prev, privacyAccepted: e.target.checked }))}
                className="sr-only"
              />
              <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200 ${
                agreements.privacyAccepted 
                  ? 'bg-gradient-to-r from-pink-500 to-purple-500 border-pink-500 shadow-lg' 
                  : 'border-gray-300 dark:border-gray-600 group-hover:border-pink-400'
              }`}>
                {agreements.privacyAccepted && <Check className="w-4 h-4 text-white" />}
              </div>
            </div>
            <div className="flex-1">
              <span className="text-base font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-pink-500" />
                Privacy Policy <span className="text-red-500 text-lg">*</span>
              </span>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                I agree to the{' '}
                <a href="/privacy" target="_blank" className="text-pink-500 hover:text-pink-600 font-medium hover:underline transition-colors">
                  Privacy Policy
                </a>
              </p>
            </div>
          </label>

          {/* Marketing Consent (Optional) */}
          <label className="flex items-start gap-4 cursor-pointer group p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-500 transition-all duration-200 hover:shadow-md">
            <div className="relative mt-1">
              <input
                type="checkbox"
                checked={agreements.marketingConsent}
                onChange={(e) => setAgreements(prev => ({ ...prev, marketingConsent: e.target.checked }))}
                className="sr-only"
              />
              <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200 ${
                agreements.marketingConsent 
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 border-green-500 shadow-lg' 
                  : 'border-gray-300 dark:border-gray-600 group-hover:border-green-400'
              }`}>
                {agreements.marketingConsent && <Check className="w-4 h-4 text-white" />}
              </div>
            </div>
            <div className="flex-1">
              <span className="text-base font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                <Mail className="w-5 h-5 text-green-500" />
                Marketing Updates
              </span>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                I'd like to receive helpful tips and product updates via email. (Optional)
              </p>
            </div>
          </label>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
            <p className="text-red-800 dark:text-red-200 text-sm font-medium">
              ⚠️ {error}
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="flex flex-col gap-4">
          <button
            onClick={handleSubmit}
            disabled={!canProceed || isSubmitting}
            className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-300 transform ${
              canProceed && !isSubmitting
                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]'
                : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Setting up your account...
              </span>
            ) : (
              'Get Started! 🚀'
            )}
          </button>
          
          {onSkip && (
            <button
              onClick={onSkip}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-sm font-medium transition-colors"
            >
              Skip for now
            </button>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center flex items-center justify-center gap-1">
            <span className="text-red-500 text-base">*</span>
            <span>Required fields</span>
          </p>
        </div>
      </div>
    </div>
  );
}