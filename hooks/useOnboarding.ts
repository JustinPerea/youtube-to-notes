import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface UserAgreements {
  tosAccepted: boolean;
  tosAcceptedAt?: string;
  tosAcceptedVersion?: string;
  privacyAccepted: boolean;
  privacyAcceptedAt?: string;
  privacyAcceptedVersion?: string;
  marketingConsent: boolean;
  marketingConsentAt?: string;
  ageVerified: boolean;
  onboardingCompleted: boolean;
  onboardingCompletedAt?: string;
}

interface OnboardingData {
  tosAccepted: boolean;
  privacyAccepted: boolean;
  marketingConsent: boolean;
  ageVerified: boolean;
}

export function useOnboarding() {
  const { data: session, status } = useSession();
  const [agreements, setAgreements] = useState<UserAgreements | null>(null);
  const [loading, setLoading] = useState(true);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  // Fetch user agreements status
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      fetchAgreements();
    } else if (status === 'unauthenticated') {
      setLoading(false);
    }
  }, [status, session]);

  const fetchAgreements = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user/agreements');
      
      if (response.ok) {
        const data = await response.json();
        setAgreements(data.agreements);
        
        // Show welcome modal if onboarding not completed
        if (!data.agreements.onboardingCompleted) {
          setShowWelcomeModal(true);
        }
      } else if (response.status === 404) {
        // User not found - might be first time sign up
        setShowWelcomeModal(true);
      }
    } catch (error) {
      console.error('Error fetching agreements:', error);
    } finally {
      setLoading(false);
    }
  };

  const completeOnboarding = async (onboardingData: OnboardingData) => {
    try {
      const response = await fetch('/api/user/agreements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(onboardingData),
      });

      if (response.ok) {
        setShowWelcomeModal(false);
        // Refresh agreements
        await fetchAgreements();
        return true;
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to complete onboarding');
      }
    } catch (error) {
      console.error('Error completing onboarding:', error);
      throw error;
    }
  };

  const skipOnboarding = () => {
    setShowWelcomeModal(false);
    // Note: User can still access the app but will be prompted again later
  };

  const needsOnboarding = () => {
    if (!agreements) return false;
    return !agreements.onboardingCompleted || 
           !agreements.tosAccepted || 
           !agreements.privacyAccepted || 
           !agreements.ageVerified;
  };

  const hasRequiredAgreements = () => {
    if (!agreements) return false;
    return agreements.tosAccepted && 
           agreements.privacyAccepted && 
           agreements.ageVerified;
  };

  return {
    agreements,
    loading,
    showWelcomeModal,
    needsOnboarding: needsOnboarding(),
    hasRequiredAgreements: hasRequiredAgreements(),
    completeOnboarding,
    skipOnboarding,
    refreshAgreements: fetchAgreements
  };
}