#!/usr/bin/env tsx

import { db } from '../lib/db/connection';
import { users } from '../lib/db/schema';

async function debugUserSubscription() {
  try {
    console.log('🔍 Fetching all users with their subscription data...\n');
    
    const allUsers = await db.select({
      id: users.id,
      email: users.email,
      subscriptionTier: users.subscriptionTier,
      subscriptionStatus: users.subscriptionStatus,
      paymentProvider: users.paymentProvider,
      polarCustomerId: users.polarCustomerId,
      polarSubscriptionId: users.polarSubscriptionId,
      adminOverrideTier: users.adminOverrideTier,
      adminOverrideExpires: users.adminOverrideExpires,
      subscriptionCurrentPeriodStart: users.subscriptionCurrentPeriodStart,
      subscriptionCurrentPeriodEnd: users.subscriptionCurrentPeriodEnd,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    }).from(users);

    console.log(`Found ${allUsers.length} total users\n`);

    // Show all users with non-free subscriptions or admin overrides
    const interestingUsers = allUsers.filter((user: any) => 
      user.subscriptionTier !== 'free' || 
      user.adminOverrideTier || 
      user.polarSubscriptionId ||
      user.paymentProvider === 'polar'
    );

    console.log('🎯 Users with subscriptions or special status:');
    console.log('='.repeat(60));

    for (const user of interestingUsers) {
      console.log(`📧 ${user.email || 'No email'}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Tier: ${user.subscriptionTier} (Status: ${user.subscriptionStatus})`);
      console.log(`   Payment Provider: ${user.paymentProvider || 'none'}`);
      
      if (user.polarCustomerId || user.polarSubscriptionId) {
        console.log(`   Polar Customer ID: ${user.polarCustomerId || 'none'}`);
        console.log(`   Polar Subscription ID: ${user.polarSubscriptionId || 'none'}`);
      }
      
      if (user.adminOverrideTier) {
        const hasActiveOverride = user.adminOverrideTier && 
          (!user.adminOverrideExpires || user.adminOverrideExpires > new Date());
        console.log(`   Admin Override: ${user.adminOverrideTier} (expires: ${user.adminOverrideExpires || 'never'}) ${hasActiveOverride ? '[ACTIVE]' : '[EXPIRED]'}`);
      }
      
      if (user.subscriptionCurrentPeriodStart) {
        console.log(`   Period: ${user.subscriptionCurrentPeriodStart} → ${user.subscriptionCurrentPeriodEnd}`);
      }
      
      console.log(`   Updated: ${user.updatedAt}`);
      console.log('');
    }

    console.log('\n🔍 Key Issues to Look For:');
    console.log('- Users with paymentProvider="polar" but no polarSubscriptionId');
    console.log('- Users with subscriptionTier="free" but active Polar subscriptions');  
    console.log('- Recent updatedAt timestamps that should reflect webhook updates');
    console.log('- Admin overrides that might still be active');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

debugUserSubscription();