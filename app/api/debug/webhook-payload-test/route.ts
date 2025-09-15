import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/connection";
import { users } from "@/lib/db/schema";
import { eq, sql, or } from "drizzle-orm";

// Test webhook payload processing with the exact data causing 500 errors
export async function GET(req: NextRequest) {
  // Disable this debug endpoint outside development unless explicitly enabled
  const isDevelopment = process.env.NODE_ENV === 'development';
  const debugEnabled = process.env.DEBUG_ENDPOINTS_ENABLED === 'true';
  if (!isDevelopment && !debugEnabled) {
    return NextResponse.json({
      status: 'skipped',
      message: 'Debug webhook payload test disabled outside development',
    });
  }

  try {
    console.log("🧪 Testing webhook payload processing...");
    
    // Check environment variables first
    const envVars = {
      POLAR_WEBHOOK_SECRET: process.env.POLAR_WEBHOOK_SECRET ? "✅ Set" : "❌ Missing",
      POLAR_PRO_PRODUCT_ID: process.env.POLAR_PRO_PRODUCT_ID ? "✅ Set" : "❌ Missing", 
      POLAR_BASIC_PRODUCT_ID: process.env.POLAR_BASIC_PRODUCT_ID ? "✅ Set" : "❌ Missing",
      DATABASE_URL: process.env.DATABASE_URL ? "✅ Set" : "❌ Missing",
    };
    
    console.log("🔍 Environment variables:", envVars);
    
    // Test the exact payload from Polar
    const testPayload = {
      customer: {
        email: "pulsaurart@gmail.com",
        id: "eac2809e-6312-47e0-bc84-a3f4bb079179"
      },
      user: {
        email: "pulsaurart@gmail.com", 
        id: "eac2809e-6312-47e0-bc84-a3f4bb079179"
      },
      product_id: "89b59bcb-00bd-4ec7-b258-105bcacae3ba",
      id: "04db74a2-01f2-4599-8ab7-a8484d5a644a",
      status: "active",
      current_period_start: "2025-09-09T10:52:09Z",
      current_period_end: "2025-10-09T10:52:09Z"
    };
    
    console.log("🔍 Testing user lookup with payload:", testPayload);
    
    // Test user lookup logic
    const conditions = [];
    const lookupInfo = {
      customerEmail: testPayload.customer?.email,
      userEmail: testPayload.user?.email
    };
    
    if (lookupInfo.customerEmail) {
      conditions.push(eq(users.email, lookupInfo.customerEmail));
    }
    if (lookupInfo.userEmail && lookupInfo.userEmail !== lookupInfo.customerEmail) {
      conditions.push(eq(users.email, lookupInfo.userEmail));
    }
    if (lookupInfo.customerEmail) {
      conditions.push(sql`LOWER(${users.email}) = LOWER(${lookupInfo.customerEmail})`);
    }
    
    console.log(`🔍 Built ${conditions.length} lookup conditions`);
    
    // Test database query
    const result = await db
      .select()
      .from(users)
      .where(or(...conditions))
      .limit(1);
      
    console.log("🔍 User lookup result:", result.length > 0 ? "✅ Found user" : "❌ User not found");
    
    if (result.length > 0) {
      const user = result[0];
      console.log(`👤 Found user: ${user.email} (ID: ${user.id}, Tier: ${user.subscriptionTier})`);
    }
    
    // Test product ID matching
    const proProductId = process.env.POLAR_PRO_PRODUCT_ID;
    const productId = testPayload.product_id;
    
    let tier = 'free';
    if (productId === proProductId) {
      tier = 'pro';
    } else {
      console.warn(`⚠️ Product ID mismatch: webhook=${productId}, env=${proProductId}`);
    }
    
    console.log(`🎯 Determined tier: ${tier}`);
    
    return NextResponse.json({
      status: "success",
      message: "Webhook payload test completed",
      results: {
        environmentVariables: envVars,
        userFound: result.length > 0,
        userEmail: result[0]?.email || "Not found",
        currentTier: result[0]?.subscriptionTier || "Unknown",
        determinedTier: tier,
        productIdMatch: productId === proProductId,
        webhookProductId: productId,
        envProductId: proProductId
      }
    });
    
  } catch (error) {
    console.error("💥 Webhook test failed:", error);
    
    return NextResponse.json({
      status: "error",
      message: "Webhook test failed",
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
