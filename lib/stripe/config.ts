// Stripe configuration and pricing setup
// This will be activated once business email and Stripe account are created

export interface StripePriceConfig {
  priceId: string;
  productId: string;
  tier: 'student' | 'pro' | 'creator';
  amount: number;
  currency: 'usd';
  interval: 'month' | 'year';
  features: string[];
}

// Placeholder price IDs - will be replaced with actual Stripe price IDs
export const STRIPE_PRICES: Record<string, StripePriceConfig> = {
  // Student Tier
  student_monthly: {
    priceId: 'price_1S2uKwE61emw6urZuJa7iMo9',
    productId: 'prod_Sys4vA6ytiMkQr',
    tier: 'student',
    amount: 999, // $9.99 in cents
    currency: 'usd',
    interval: 'month',
    features: [
      '25 videos per month',
      'Study notes generation',
      'Presentation slides',
      'AI chat Q&A (10 questions/month)',
      'Educational templates',
      '1GB storage'
    ]
  },
  student_yearly: {
    priceId: 'price_1S2uLKE61emw6urZCl9Ne0mu',
    productId: 'prod_Sys4vA6ytiMkQr',
    tier: 'student',
    amount: 9999, // $99.99/year in cents
    currency: 'usd',
    interval: 'year',
    features: [
      '25 videos per month',
      'Study notes generation',
      'Presentation slides',
      'AI chat Q&A (10 questions/month)',
      'Educational templates',
      '1GB storage'
    ]
  },

  // Pro Tier
  pro_monthly: {
    priceId: 'price_1S2uLYE61emw6urZoOGcTGfW',
    productId: 'prod_Sys4frgA3yQ4nM',
    tier: 'pro',
    amount: 1999, // $19.99 in cents
    currency: 'usd',
    interval: 'month',
    features: [
      '100 videos per month',
      'Everything in Student',
      'Unlimited AI chat Q&A',
      'All note formats + Mind maps',
      'Advanced export formats',
      '10GB storage',
      'Priority support'
    ]
  },
  pro_yearly: {
    priceId: 'price_1S2uLrE61emw6urZ20oHhP5r',
    productId: 'prod_Sys4frgA3yQ4nM',
    tier: 'pro',
    amount: 19999, // $199.99/year in cents
    currency: 'usd',
    interval: 'year',
    features: [
      '100 videos per month',
      'Everything in Student',
      'Unlimited AI chat Q&A',
      'All note formats + Mind maps',
      'Advanced export formats',
      '10GB storage',
      'Priority support'
    ]
  },

  // Creator Tier
  creator_monthly: {
    priceId: 'price_1S2uM4E61emw6urZjCGcU3oc',
    productId: 'prod_Sys4P0sB1FTLZE',
    tier: 'creator',
    amount: 4999, // $49.99 in cents
    currency: 'usd',
    interval: 'month',
    features: [
      'Unlimited videos',
      'Everything in Pro',
      'White-label options',
      'API access',
      'Custom branding',
      'Revenue sharing opportunities',
      'Unlimited storage',
      'Dedicated support'
    ]
  },
  creator_yearly: {
    priceId: 'price_1S2uMVE61emw6urZ3wloIrMQ',
    productId: 'prod_Sys4P0sB1FTLZE',
    tier: 'creator',
    amount: 49999, // $499.99/year in cents
    currency: 'usd',
    interval: 'year',
    features: [
      'Unlimited videos',
      'Everything in Pro',
      'White-label options',
      'API access',
      'Custom branding',
      'Revenue sharing opportunities',
      'Unlimited storage',
      'Dedicated support'
    ]
  }
};

// Student verification discount configuration
export const STUDENT_DISCOUNT = {
  percentOff: 50,
  couponId: 'student_verification_50_placeholder',
  verificationRequired: true,
  providers: ['SheerID', 'UNiDAYS'] // Third-party verification services
};

// Usage limits for each tier
export const USAGE_LIMITS = {
  free: {
    videosPerMonth: 5,
    aiQuestionsPerMonth: 0,
    storageGB: 0.1, // 100MB
    formats: ['basic_summary', 'pdf_export'],
    watermark: true
  },
  student: {
    videosPerMonth: 25,
    aiQuestionsPerMonth: 10,
    storageGB: 1,
    formats: ['basic_summary', 'study_notes', 'presentation_slides', 'pdf_export'],
    watermark: false
  },
  pro: {
    videosPerMonth: 100,
    aiQuestionsPerMonth: -1, // unlimited
    storageGB: 10,
    formats: ['all'],
    watermark: false
  },
  creator: {
    videosPerMonth: -1, // unlimited
    aiQuestionsPerMonth: -1, // unlimited
    storageGB: -1, // unlimited
    formats: ['all'],
    watermark: false,
    apiAccess: true,
    whiteLabel: true
  }
};

// Environment variables that will be needed
export const STRIPE_CONFIG = {
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  secretKey: process.env.STRIPE_SECRET_KEY,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  successUrl: `${process.env.NEXTAUTH_URL}/subscription/success`,
  cancelUrl: `${process.env.NEXTAUTH_URL}/pricing`,
};

// Helper function to get price ID based on tier and billing
export function getStripePriceId(tier: 'student' | 'pro' | 'creator', billing: 'monthly' | 'yearly'): string {
  const key = `${tier}_${billing}`;
  return STRIPE_PRICES[key]?.priceId || '';
}

// Helper function to check if Stripe is configured
export function isStripeConfigured(): boolean {
  return !!(
    STRIPE_CONFIG.publishableKey && 
    STRIPE_CONFIG.secretKey && 
    !STRIPE_CONFIG.publishableKey.includes('placeholder')
  );
}