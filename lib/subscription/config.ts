/**
 * Subscription Configuration - Matches UI Screenshot Exactly
 * This is the single source of truth for all subscription limits and features
 */

export type SubscriptionTier = 'free' | 'basic' | 'pro';

export interface TierLimits {
  // Video Processing
  videosPerMonth: number; // -1 = unlimited
  
  // AI Chat
  aiQuestionsPerMonth: number; // -1 = unlimited, 0 = disabled
  
  // Storage
  storageGB: number;
  
  // Formats and Features
  availableFormats: string[];
  exportFormats: string[];
  watermarkOnExports: boolean;
  
  // Processing
  processingSpeed: 'standard' | 'priority'; // 2x faster for pro
  
  // Support
  supportLevel: 'community' | 'email' | 'priority';
  
  // Pricing
  priceMonthly: number; // in cents, 0 for free
}

export const SUBSCRIPTION_LIMITS: Record<SubscriptionTier, TierLimits> = {
  free: {
    videosPerMonth: 5,
    aiQuestionsPerMonth: 0, // No AI chat
    storageGB: 0.1, // 100MB
    availableFormats: ['basic_summary'],
    exportFormats: ['pdf_with_watermark'],
    watermarkOnExports: true,
    processingSpeed: 'standard',
    supportLevel: 'community',
    priceMonthly: 0,
  },
  
  basic: {
    videosPerMonth: 100, // 100 notes per month
    aiQuestionsPerMonth: 10,
    storageGB: 5,
    availableFormats: ['basic_summary', 'study_notes', 'presentation_slides'],
    exportFormats: ['pdf', 'markdown', 'html'],
    watermarkOnExports: false,
    processingSpeed: 'standard',
    supportLevel: 'email',
    priceMonthly: 399, // $3.99
  },
  
  pro: {
    videosPerMonth: -1, // Unlimited
    aiQuestionsPerMonth: -1, // Unlimited
    storageGB: 50,
    availableFormats: ['basic_summary', 'study_notes', 'presentation_slides', 'tutorial_guide', 'quick_reference'],
    exportFormats: ['pdf', 'markdown', 'html', 'docx', 'pptx'], // Word & PowerPoint
    watermarkOnExports: false,
    processingSpeed: 'priority', // 2x faster
    supportLevel: 'priority',
    priceMonthly: 999, // $9.99
  },
};

// Feature availability checker
export function hasFeatureAccess(tier: SubscriptionTier, feature: string): boolean {
  const limits = SUBSCRIPTION_LIMITS[tier];
  
  switch (feature) {
    case 'ai_chat':
      return limits.aiQuestionsPerMonth !== 0;
    case 'unlimited_ai_chat':
      return limits.aiQuestionsPerMonth === -1;
    case 'unlimited_notes':
      return limits.videosPerMonth === -1;
    case 'priority_processing':
      return limits.processingSpeed === 'priority';
    case 'advanced_exports':
      return limits.exportFormats.includes('docx');
    case 'no_watermark':
      return !limits.watermarkOnExports;
    default:
      return false;
  }
}

// Usage limit checker
export function checkLimit(tier: SubscriptionTier, usage: number, limitType: 'videos' | 'ai_questions' | 'storage'): {
  allowed: boolean;
  limit: number;
  usage: number;
  remaining: number;
  isUnlimited: boolean;
} {
  const limits = SUBSCRIPTION_LIMITS[tier];
  let limit: number;
  
  switch (limitType) {
    case 'videos':
      limit = limits.videosPerMonth;
      break;
    case 'ai_questions':
      limit = limits.aiQuestionsPerMonth;
      break;
    case 'storage':
      limit = limits.storageGB * 1024; // Convert to MB
      break;
    default:
      return { allowed: false, limit: 0, usage, remaining: 0, isUnlimited: false };
  }
  
  const isUnlimited = limit === -1;
  const allowed = isUnlimited || usage < limit;
  const remaining = isUnlimited ? -1 : Math.max(0, limit - usage);
  
  return {
    allowed,
    limit,
    usage,
    remaining,
    isUnlimited,
  };
}

// Display information for UI
export function getTierDisplayInfo(tier: SubscriptionTier) {
  const limits = SUBSCRIPTION_LIMITS[tier];
  
  return {
    name: tier.charAt(0).toUpperCase() + tier.slice(1),
    price: limits.priceMonthly,
    priceDisplay: limits.priceMonthly === 0 ? '$0' : `$${(limits.priceMonthly / 100).toFixed(2)}`,
    features: generateFeatureList(tier),
    color: tier === 'free' ? 'gray' : tier === 'basic' ? 'blue' : 'pink',
    popular: tier === 'pro',
  };
}

function generateFeatureList(tier: SubscriptionTier): string[] {
  const limits = SUBSCRIPTION_LIMITS[tier];
  const features: string[] = [];
  
  // Videos
  if (limits.videosPerMonth === -1) {
    features.push('Unlimited notes');
  } else {
    features.push(`${limits.videosPerMonth} notes per month`);
  }
  
  // AI Chat
  if (limits.aiQuestionsPerMonth === -1) {
    features.push('Unlimited AI chat');
  } else if (limits.aiQuestionsPerMonth > 0) {
    features.push(`${limits.aiQuestionsPerMonth} AI chat questions/month`);
  }
  
  // Storage
  if (limits.storageGB >= 1) {
    features.push(`${limits.storageGB}GB storage`);
  } else {
    features.push(`${limits.storageGB * 1024}MB storage`);
  }
  
  // Formats
  if (tier === 'free') {
    features.push('Basic Summary format only');
  } else {
    features.push('All note formats');
  }
  
  // Exports
  if (limits.watermarkOnExports) {
    features.push('PDF export with watermark');
  } else if (limits.exportFormats.includes('docx')) {
    features.push('All formats + advanced exports (Word, PowerPoint)');
  } else {
    features.push('PDF, HTML, Markdown exports');
  }
  
  // Processing
  if (limits.processingSpeed === 'priority') {
    features.push('Priority processing (2x faster)');
  }
  
  // Support
  features.push(`${limits.supportLevel} support`);
  
  return features;
}