#!/usr/bin/env tsx

import { db } from '../lib/db/connection';
import { users } from '../lib/db/schema';
import { eq, ne } from 'drizzle-orm';

async function checkUserSubscriptions() {
  try {
    console.log('👥 User Subscription Summary');
    console.log('='.repeat(50));
    
    // Get all users with their subscription info
    const allUsers = await db
      .select({
        id: users.id,
        email: users.email,
        subscriptionTier: users.subscriptionTier,
        subscriptionStatus: users.subscriptionStatus,
        paymentProvider: users.paymentProvider,
        polarCustomerId: users.polarCustomerId,
        polarSubscriptionId: users.polarSubscriptionId,
        adminOverrideTier: users.adminOverrideTier,
        adminOverrideExpires: users.adminOverrideExpires,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(users.createdAt);

    // Count by tier
    const tierCounts = {
      free: 0,
      basic: 0,
      pro: 0,
      admin_override: 0,
    };

    console.log('\n📊 All Users:');
    console.log('-'.repeat(80));
    
    for (const user of allUsers) {
      const hasActiveAdminOverride = user.adminOverrideTier && 
        (!user.adminOverrideExpires || user.adminOverrideExpires > new Date());
      
      const effectiveTier = hasActiveAdminOverride ? user.adminOverrideTier : user.subscriptionTier;
      
      // Count
      if (hasActiveAdminOverride) {
        tierCounts.admin_override++;
      } else {
        tierCounts[effectiveTier as keyof typeof tierCounts]++;
      }
      
      // Display
      const tierDisplay = hasActiveAdminOverride 
        ? `${user.adminOverrideTier} (ADMIN OVERRIDE)` 
        : user.subscriptionTier;
      
      console.log(`${user.email?.padEnd(30)} | ${tierDisplay?.padEnd(20)} | ${user.subscriptionStatus || 'unknown'}`);
      
      if (user.paymentProvider === 'polar' && user.polarSubscriptionId) {
        console.log(`${''.padEnd(30)}   └─ Polar: ${user.polarSubscriptionId.substring(0, 20)}...`);
      }
    }

    console.log('\n📈 Summary:');
    console.log(`Free:            ${tierCounts.free} users`);
    console.log(`Basic:           ${tierCounts.basic} users`);  
    console.log(`Pro:             ${tierCounts.pro} users`);
    console.log(`Admin Override:  ${tierCounts.admin_override} users`);
    console.log(`Total:           ${allUsers.length} users`);

    // Show paid users only
    const paidUsers = allUsers.filter((user: any) => 
      user.subscriptionTier !== 'free' || 
      user.adminOverrideTier ||
      user.polarSubscriptionId
    );
    
    if (paidUsers.length > 0) {
      console.log('\n💰 Paid/Special Users Details:');
      console.log('-'.repeat(80));
      
      for (const user of paidUsers) {
        console.log(`📧 ${user.email}`);
        console.log(`   Tier: ${user.subscriptionTier} | Status: ${user.subscriptionStatus}`);
        console.log(`   Provider: ${user.paymentProvider || 'none'}`);
        console.log(`   Created: ${user.createdAt?.toLocaleDateString()}`);
        
        if (user.adminOverrideTier) {
          console.log(`   🔧 Admin Override: ${user.adminOverrideTier} (expires: ${user.adminOverrideExpires || 'never'})`);
        }
        
        if (user.polarSubscriptionId) {
          console.log(`   🌟 Polar Sub ID: ${user.polarSubscriptionId}`);
        }
        
        console.log('');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

checkUserSubscriptions();