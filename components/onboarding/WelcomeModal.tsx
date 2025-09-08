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

  const handleSubmit = async () => {
    if (!agreements.tosAccepted || !agreements.privacyAccepted || !agreements.ageVerified) {
      return; // Required fields not checked
    }

    setIsSubmitting(true);
    try {
      await onComplete(agreements);
    } catch (error) {
      console.error('Error completing onboarding:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = agreements.tosAccepted && agreements.privacyAccepted && agreements.ageVerified;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-[var(--accent-pink)]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-[var(--accent-pink)]" />
          </div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
            Welcome to KyotoScribe! 🎉
          </h2>
          <p className="text-[var(--text-secondary)]">
            Hi {session?.user?.name?.split(' ')[0] || 'there'}! Let's get you set up with a few quick agreements.
          </p>
        </div>

        {/* Agreements */}
        <div className="space-y-4 mb-6">
          {/* Age Verification */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="relative mt-1">
              <input
                type="checkbox"
                checked={agreements.ageVerified}
                onChange={(e) => setAgreements(prev => ({ ...prev, ageVerified: e.target.checked }))}
                className="sr-only"
              />
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                agreements.ageVerified 
                  ? 'bg-[var(--accent-pink)] border-[var(--accent-pink)]' 
                  : 'border-gray-300 group-hover:border-[var(--accent-pink)]'
              }`}>
                {agreements.ageVerified && <Check className="w-3 h-3 text-white" />}
              </div>
            </div>
            <div className="flex-1">
              <span className="text-sm font-medium text-[var(--text-primary)] flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Age Verification <span className="text-red-500">*</span>
              </span>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                I confirm that I am 13 years of age or older.
              </p>
            </div>
          </label>

          {/* Terms of Service */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="relative mt-1">
              <input
                type="checkbox"
                checked={agreements.tosAccepted}
                onChange={(e) => setAgreements(prev => ({ ...prev, tosAccepted: e.target.checked }))}
                className="sr-only"
              />
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                agreements.tosAccepted 
                  ? 'bg-[var(--accent-pink)] border-[var(--accent-pink)]' 
                  : 'border-gray-300 group-hover:border-[var(--accent-pink)]'
              }`}>
                {agreements.tosAccepted && <Check className="w-3 h-3 text-white" />}
              </div>
            </div>
            <div className="flex-1">
              <span className="text-sm font-medium text-[var(--text-primary)] flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Terms of Service <span className="text-red-500">*</span>
              </span>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                I agree to the{' '}
                <a href="/terms" target="_blank" className="text-[var(--accent-pink)] hover:underline">
                  Terms of Service
                </a>
              </p>
            </div>
          </label>

          {/* Privacy Policy */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="relative mt-1">
              <input
                type="checkbox"
                checked={agreements.privacyAccepted}
                onChange={(e) => setAgreements(prev => ({ ...prev, privacyAccepted: e.target.checked }))}
                className="sr-only"
              />
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                agreements.privacyAccepted 
                  ? 'bg-[var(--accent-pink)] border-[var(--accent-pink)]' 
                  : 'border-gray-300 group-hover:border-[var(--accent-pink)]'
              }`}>
                {agreements.privacyAccepted && <Check className="w-3 h-3 text-white" />}
              </div>
            </div>
            <div className="flex-1">
              <span className="text-sm font-medium text-[var(--text-primary)] flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Privacy Policy <span className="text-red-500">*</span>
              </span>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                I agree to the{' '}
                <a href="/privacy" target="_blank" className="text-[var(--accent-pink)] hover:underline">
                  Privacy Policy
                </a>
              </p>
            </div>
          </label>

          {/* Marketing Consent (Optional) */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="relative mt-1">
              <input
                type="checkbox"
                checked={agreements.marketingConsent}
                onChange={(e) => setAgreements(prev => ({ ...prev, marketingConsent: e.target.checked }))}
                className="sr-only"
              />
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                agreements.marketingConsent 
                  ? 'bg-[var(--accent-pink)] border-[var(--accent-pink)]' 
                  : 'border-gray-300 group-hover:border-[var(--accent-pink)]'
              }`}>
                {agreements.marketingConsent && <Check className="w-3 h-3 text-white" />}
              </div>
            </div>
            <div className="flex-1">
              <span className="text-sm font-medium text-[var(--text-primary)] flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Marketing Updates
              </span>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                I'd like to receive helpful tips and product updates via email. (Optional)
              </p>
            </div>
          </label>
        </div>

        {/* Footer */}
        <div className="flex flex-col gap-3">
          <button
            onClick={handleSubmit}
            disabled={!canProceed || isSubmitting}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-300 ${
              canProceed && !isSubmitting
                ? 'bg-gradient-to-r from-[var(--accent-pink)] to-[#FF8FB3] text-white hover:shadow-lg'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? 'Setting up your account...' : 'Get Started! 🚀'}
          </button>
          
          {onSkip && (
            <button
              onClick={onSkip}
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm underline"
            >
              Skip for now
            </button>
          )}
        </div>

        <p className="text-xs text-[var(--text-secondary)] text-center mt-4">
          <span className="text-red-500">*</span> Required fields
        </p>
      </div>
    </div>
  );
}