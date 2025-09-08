'use client';

import { useOnboarding } from '@/hooks/useOnboarding';
import { WelcomeModal } from './onboarding/WelcomeModal';

interface OnboardingWrapperProps {
  children: React.ReactNode;
}

export function OnboardingWrapper({ children }: OnboardingWrapperProps) {
  const { 
    showWelcomeModal, 
    completeOnboarding, 
    skipOnboarding 
  } = useOnboarding();

  return (
    <>
      {children}
      <WelcomeModal
        isOpen={showWelcomeModal}
        onComplete={completeOnboarding}
        onSkip={skipOnboarding}
      />
    </>
  );
}