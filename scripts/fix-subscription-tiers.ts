#!/usr/bin/env tsx
/**
 * Fix Subscription Tiers Script
 * 
 * This script helps identify and fix users who might have incorrect subscription tiers
 * due to the previous Polar webhook issues.
 * 
 * Usage:
 * npm run db:fix-tiers [--dry-run] [--user-id=USER_ID]
 */

import { db } from '../lib/db/connection';
import { users, userMonthlyUsage } from '../lib/db/schema';
import { eq, and, ne } from 'drizzle-orm';
import { updateUserSubscription, getUserSubscription } from '../lib/subscription/service';

interface FixOptions {
  dryRun: boolean;
  specificUserId?: string;
  verbose: boolean;
}

async function analyzeSubscriptionInconsistencies(options: FixOptions) {
  console.log('🔍 Analyzing subscription inconsistencies...\n');

  // Get all users with non-free subscriptions
  const usersWithSubscriptions = await db
    .select()
    .from(users)
    .where(
      options.specificUserId 
        ? eq(users.id, options.specificUserId)
        : ne(users.subscriptionTier, 'free')
    );

  console.log(`📊 Found ${usersWithSubscriptions.length} users with paid subscriptions\n`);

  const issues: Array<{
    userId: string;
    email: string;
    issue: string;
    currentTier: string;
    suggestedTier?: string;
    details: any;
  }> = [];

  for (const user of usersWithSubscriptions) {
    const userIssues: string[] = [];
    const details: any = {};

    // Check 1: Verify subscription service consistency
    try {
      const serviceSubscription = await getUserSubscription(user.id);
      if (serviceSubscription && serviceSubscription.tier !== user.subscriptionTier) {
        userIssues.push(`Database tier (${user.subscriptionTier}) differs from service tier (${serviceSubscription.tier})`);
        details.serviceTier = serviceSubscription.tier;
        details.databaseTier = user.subscriptionTier;
      }
    } catch (error) {
      userIssues.push(`Error fetching subscription from service: ${error}`);
    }

    // Check 2: Admin override logic
    const hasActiveAdminOverride = user.adminOverrideTier && 
      (!user.adminOverrideExpires || user.adminOverrideExpires > new Date());
    
    if (hasActiveAdminOverride) {
      details.adminOverride = {
        tier: user.adminOverrideTier,
        expires: user.adminOverrideExpires,
      };
    }

    // Check 3: Payment provider consistency
    if (user.paymentProvider === 'polar' && !user.polarSubscriptionId && user.subscriptionTier !== 'free') {
      userIssues.push('Polar provider but missing Polar subscription ID');
      details.missingPolarId = true;
    }

    if (user.paymentProvider === 'stripe' && !user.stripeSubscriptionId && user.subscriptionTier !== 'free') {
      userIssues.push('Stripe provider but missing Stripe subscription ID');
      details.missingStripeId = true;
    }

    // Check 4: Monthly usage consistency
    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthlyUsageRecord = await db
      .select()
      .from(userMonthlyUsage)
      .where(
        and(
          eq(userMonthlyUsage.userId, user.id),
          eq(userMonthlyUsage.monthYear, currentMonth)
        )
      )
      .limit(1);

    if (monthlyUsageRecord.length > 0) {
      const record = monthlyUsageRecord[0];
      if (record.subscriptionTier !== user.subscriptionTier) {
        userIssues.push(`Monthly usage tier (${record.subscriptionTier}) differs from user tier (${user.subscriptionTier})`);
        details.monthlyUsageTier = record.subscriptionTier;
      }
    } else {
      userIssues.push('Missing current month usage record');
      details.missingUsageRecord = true;
    }

    // Check 5: Subscription period validity
    if (user.subscriptionCurrentPeriodEnd && user.subscriptionCurrentPeriodEnd < new Date()) {
      userIssues.push('Subscription period has expired but tier is still paid');
      details.expiredPeriod = user.subscriptionCurrentPeriodEnd;
    }

    if (userIssues.length > 0) {
      issues.push({
        userId: user.id,
        email: user.email || 'no-email',
        issue: userIssues.join('; '),
        currentTier: user.subscriptionTier || 'unknown',
        details,
      });

      if (options.verbose) {
        console.log(`❌ User ${user.id.substring(0, 8)}... (${user.email})`);
        console.log(`   Current tier: ${user.subscriptionTier}`);
        console.log(`   Issues: ${userIssues.join(', ')}`);
        console.log(`   Details:`, JSON.stringify(details, null, 2));
        console.log('');
      }
    } else if (options.verbose) {
      console.log(`✅ User ${user.id.substring(0, 8)}... (${user.email}) - No issues`);
    }
  }

  return issues;
}

async function fixSubscriptionIssues(issues: any[], options: FixOptions) {
  console.log(`\n🔧 ${options.dryRun ? 'DRY RUN: Would fix' : 'Fixing'} ${issues.length} subscription issues...\n`);

  let fixedCount = 0;

  for (const issue of issues) {
    console.log(`${options.dryRun ? '[DRY RUN]' : ''} Fixing user ${issue.userId.substring(0, 8)}...`);
    console.log(`  Issue: ${issue.issue}`);

    if (!options.dryRun) {
      try {
        // Try to refresh the subscription through the service
        const subscription = await getUserSubscription(issue.userId);
        
        if (subscription) {
          // Force refresh by calling updateUserSubscription with current data
          await updateUserSubscription(issue.userId, {
            tier: subscription.tier,
            status: subscription.status,
            currentPeriodStart: subscription.currentPeriodStart,
            currentPeriodEnd: subscription.currentPeriodEnd,
          });
          
          console.log(`  ✅ Fixed: Refreshed subscription data for tier ${subscription.tier}`);
          fixedCount++;
        } else {
          console.log(`  ⚠️ Could not retrieve subscription - manual intervention required`);
        }
      } catch (error) {
        console.log(`  ❌ Error fixing user: ${error}`);
      }
    } else {
      console.log(`  Would refresh subscription data through service`);
    }

    console.log('');
  }

  return fixedCount;
}

async function main() {
  const args = process.argv.slice(2);
  
  const options: FixOptions = {
    dryRun: args.includes('--dry-run'),
    specificUserId: args.find(arg => arg.startsWith('--user-id='))?.split('=')[1],
    verbose: args.includes('--verbose') || args.includes('-v'),
  };

  console.log('🔧 Subscription Tier Fix Script');
  console.log('================================\n');
  
  if (options.dryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be made\n');
  }
  
  if (options.specificUserId) {
    console.log(`🎯 Targeting specific user: ${options.specificUserId}\n`);
  }

  try {
    // Analyze issues
    const issues = await analyzeSubscriptionInconsistencies(options);

    if (issues.length === 0) {
      console.log('🎉 No subscription inconsistencies found!');
      return;
    }

    console.log(`\n📋 Summary of Issues Found:`);
    console.log('==========================');
    
    const issueTypes = new Map<string, number>();
    issues.forEach(issue => {
      const mainIssue = issue.issue.split(';')[0];
      issueTypes.set(mainIssue, (issueTypes.get(mainIssue) || 0) + 1);
    });

    for (const [issueType, count] of issueTypes) {
      console.log(`• ${issueType}: ${count} users`);
    }

    console.log(`\nTotal users with issues: ${issues.length}`);

    // Fix issues (if not dry run)
    if (!options.dryRun) {
      const fixedCount = await fixSubscriptionIssues(issues, options);
      console.log(`\n✅ Successfully fixed ${fixedCount} out of ${issues.length} issues`);
    } else {
      console.log(`\n💡 Run without --dry-run to fix these issues`);
    }

  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}