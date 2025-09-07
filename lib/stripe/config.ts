// Stripe configuration and pricing setup
// This will be activated once business email and Stripe account are created

export interface StripePriceConfig {
  priceId: string;
  productId: string;
  tier: 'basic' | 'pro';
  amount: number;
  currency: 'usd';
  interval: 'month' | 'year';
  features: string[];
}

// Placeholder price IDs - will be replaced with actual Stripe price IDs
export const STRIPE_PRICES: Record<string, StripePriceConfig> = {
  // Basic Tier
  basic_monthly: {
    priceId: 'price_1S2uKwE61emw6urZuJa7iMo9',
    productId: 'prod_Sys4vA6ytiMkQr',
    tier: 'basic',
    amount: 399, // $3.99 in cents
    currency: 'usd',
    interval: 'month',
    features: [
      'Unlimited videos',
      'Study notes generation',
      'Presentation slides',
      'AI chat Q&A (10 questions/month)',
      'Educational templates',
      '5GB storage'
    ]
  },
  basic_yearly: {
    priceId: 'price_1S2uLKE61emw6urZCl9Ne0mu',
    productId: 'prod_Sys4vA6ytiMkQr',
    tier: 'basic',
    amount: 3999, // $39.99/year in cents
    currency: 'usd',
    interval: 'year',
    features: [
      'Unlimited videos',
      'Study notes generation',
      'Presentation slides',
      'AI chat Q&A (10 questions/month)',
      'Educational templates',
      '5GB storage'
    ]
  },

  // Pro Tier
  pro_monthly: {
    priceId: 'price_1S2uLYE61emw6urZoOGcTGfW',
    productId: 'prod_Sys4frgA3yQ4nM',
    tier: 'pro',
    amount: 999, // $9.99 in cents
    currency: 'usd',
    interval: 'month',
    features: [
      'Unlimited videos',
      'Everything in Basic',
      'Unlimited AI chat Q&A',
      'All note formats + Quick reference',
      'Advanced export formats (DOCX, PPTX)',
      '50GB storage',
      'Priority support'
    ]
  },
  pro_yearly: {
    priceId: 'price_1S2uLrE61emw6urZ20oHhP5r',
    productId: 'prod_Sys4frgA3yQ4nM',
    tier: 'pro',
    amount: 9999, // $99.99/year in cents
    currency: 'usd',
    interval: 'year',
    features: [
      'Unlimited videos',
      'Everything in Basic',
      'Unlimited AI chat Q&A',
      'All note formats + Quick reference',
      'Advanced export formats (DOCX, PPTX)',
      '50GB storage',
      'Priority support'
    ]
  }
};

// Educational discount configuration
export const EDUCATIONAL_DISCOUNT = {
  percentOff: 20,
  couponId: 'educational_verification_20_placeholder',
  verificationRequired: true,
  providers: ['SheerID', 'UNiDAYS'] // Third-party verification services
};

// Usage limits for each tier
export const USAGE_LIMITS = {
  free: {
    videosPerMonth: 5, // Actually means "notes per month" for free tier
    storageGB: 0.1, // 100MB
    formats: ['basic_summary', 'study_notes', 'presentation_slides', 'pdf_export'],
    watermark: true
  },
  basic: {
    videosPerMonth: -1, // unlimited
    storageGB: 5,
    formats: ['basic_summary', 'study_notes', 'presentation_slides', 'pdf_export', 'markdown', 'html'],
    watermark: false
  },
  pro: {
    videosPerMonth: -1, // unlimited
    storageGB: 50,
    formats: ['all'],
    watermark: false
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
export function getStripePriceId(tier: 'basic' | 'pro', billing: 'monthly' | 'yearly'): string {
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