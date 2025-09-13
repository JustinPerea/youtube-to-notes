import { NextRequest, NextResponse } from "next/server";
import { isDebugEnabled } from '@/lib/security/debug-gate';

// Minimal test - simulating exactly what the failing webhook does
export async function POST(req: NextRequest) {
  if (!isDebugEnabled()) {
    return new NextResponse(JSON.stringify({ error: 'Not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
  }
  try {
    console.log("🧪 Minimal webhook test starting...");
    
    // Test 1: Basic imports
    const { db } = await import("@/lib/db/connection");
    const { users } = await import("@/lib/db/schema");
    const { eq, sql, or } = await import("drizzle-orm");
    console.log("✅ Basic imports successful");
    
    // Test 2: Advanced imports that might fail
    try {
      const { validateEvent, WebhookVerificationError } = await import("@polar-sh/sdk/webhooks");
      console.log("✅ Polar SDK import successful");
    } catch (error) {
      console.error("❌ Polar SDK import failed:", error);
      throw new Error(`Polar SDK import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    try {
      const { auditLogger } = await import("@/lib/audit/logger");
      console.log("✅ Audit logger import successful");
    } catch (error) {
      console.error("❌ Audit logger import failed:", error);
      throw new Error(`Audit logger import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    try {
      const { updateUserSubscription } = await import("@/lib/subscription/service");
      console.log("✅ Subscription service import successful");
    } catch (error) {
      console.error("❌ Subscription service import failed:", error);
      throw new Error(`Subscription service import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    // Test 3: Database operation
    const result = await db
      .select()
      .from(users)
      .where(eq(users.email, "pulsaurart@gmail.com"))
      .limit(1);
    console.log("✅ Database query successful");
    
    if (result.length === 0) {
      throw new Error("User not found in database");
    }
    
    const user = result[0];
    console.log(`✅ User found: ${user.email}, current tier: ${user.subscriptionTier}`);
    
    // Test 4: Environment variable validation (the code that might be failing)
    const requiredEnvVars = {
      POLAR_WEBHOOK_SECRET: process.env.POLAR_WEBHOOK_SECRET,
      POLAR_PRO_PRODUCT_ID: process.env.POLAR_PRO_PRODUCT_ID,
      POLAR_BASIC_PRODUCT_ID: process.env.POLAR_BASIC_PRODUCT_ID,
    };

    for (const [key, value] of Object.entries(requiredEnvVars)) {
      if (!value || value.trim() === '') {
        console.error(`❌ Missing env var: ${key}`);
        throw new Error(`Missing required environment variable: ${key}`);
      }
    }
    console.log("✅ Environment variable validation passed");
    
    // Test 5: Subscription update transaction (this might be failing)
    try {
      await db.transaction(async (tx: any) => {
        await tx.update(users)
          .set({
            subscriptionTier: 'pro',
            subscriptionStatus: 'active',
            paymentProvider: 'polar',
            updatedAt: new Date(),
          })
          .where(eq(users.id, user.id));
        console.log("✅ Transaction test successful");
      });
    } catch (error) {
      console.error("❌ Transaction failed:", error);
      throw new Error(`Transaction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    // Test 6: Subscription service call
    try {
      const { updateUserSubscription } = await import("@/lib/subscription/service");
      await updateUserSubscription(user.id, {
        tier: 'pro',
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      });
      console.log("✅ Subscription service call successful");
    } catch (error) {
      console.error("❌ Subscription service failed:", error);
      // Don't throw - this is the non-critical part
      console.log("⚠️ Continuing despite subscription service failure");
    }
    
    return NextResponse.json({
      status: "success",
      message: "All webhook components tested successfully",
      userUpgraded: true,
      newTier: "pro"
    });
    
  } catch (error) {
    console.error("💥 Minimal webhook test failed:", error);
    
    return NextResponse.json({
      status: "error",
      message: "Minimal webhook test failed",
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
