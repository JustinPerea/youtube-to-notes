# 🧪 Subscription Testing Guide

This guide explains how to test all subscription tiers and features **without spending any money**.

## 🚀 Quick Start

1. **Add the subscription tester to your dashboard**
2. **Run the database migration**
3. **Test different subscription tiers**
4. **Verify limits are enforced**

---

## 📋 Step-by-Step Testing Process

### Step 1: Run Database Migration

First, apply the new subscription schema to your database:

```bash
# In your Supabase SQL editor, run:
/lib/db/migrations/add-subscription-tracking.sql
```

This adds all the necessary tables and functions for subscription tracking.

### Step 2: Add Admin Testing Component

Add the `SubscriptionTester` component to your dashboard or create a testing page:

```tsx
// app/admin/page.tsx or add to your dashboard
import { SubscriptionTester } from '@/components/admin/SubscriptionTester';

export default function AdminPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-8">Admin Testing</h1>
      <SubscriptionTester />
    </div>
  );
}
```

### Step 3: Test Each Subscription Tier

#### 🆓 Testing Free Tier (Default)
```typescript
// Current limits for Free:
- Videos: 5 per month
- AI Chat: Disabled (0 questions)
- Storage: 100MB  
- Formats: Basic Summary only
- Exports: PDF with watermark
- Speed: Standard processing
```

**Test Steps:**
1. Go to `/process` and try processing 6 videos in one month
2. Verify the 6th video is blocked with limit message
3. Try accessing AI chat features (should be disabled)
4. Check that only Basic Summary format is available

#### 🎓 Testing Student Tier ($9.99)
```typescript
// Current limits for Student:
- Videos: Unlimited
- AI Chat: 10 questions per month
- Storage: 5GB
- Formats: Basic Summary, Study Notes, Presentation Slides  
- Exports: PDF, Markdown, HTML (no watermark)
- Speed: Standard processing
```

**Test Steps:**
1. Use admin tester to set your account to "Student" tier
2. Process multiple videos (should work unlimited)
3. Use AI chat 11 times in one month (11th should be blocked)
4. Verify Study Notes and Presentation formats are available
5. Check exports don't have watermarks

#### 💼 Testing Pro Tier ($19.99)
```typescript
// Current limits for Pro:
- Videos: Unlimited
- AI Chat: Unlimited
- Storage: 50GB
- Formats: All formats available
- Exports: All formats including Word, PowerPoint
- Speed: Priority processing (2x faster)
```

**Test Steps:**
1. Use admin tester to set your account to "Pro" tier
2. Process many videos (should work unlimited)
3. Use AI chat extensively (should work unlimited)
4. Verify all export formats are available (Word, PowerPoint)
5. Check processing happens with "high" priority

### Step 4: Testing API Endpoints

Test the subscription enforcement on API routes:

```bash
# Test video processing limit (should fail on 6th video for free tier)
curl -X POST http://localhost:3003/api/process-video \
  -H "Content-Type: application/json" \
  -d '{"youtubeUrl": "https://youtube.com/watch?v=example"}'

# Test AI chat limit (should fail after limit for student tier)
curl -X POST http://localhost:3003/api/ai-chat \
  -H "Content-Type: application/json" \
  -d '{"question": "What is this video about?"}'
```

---

## 🛠 Integration Examples

### Example 1: Protect Video Processing API

```typescript
// app/api/process-video/route.ts
import { withSubscriptionGuard } from '@/lib/middleware/subscription-guard';
import { incrementUsage } from '@/lib/subscription/service';

const handler = async (req: NextRequest, guardResult: any) => {
  const { youtubeUrl } = await req.json();
  
  // Process video here...
  const result = await processVideo(youtubeUrl);
  
  // Increment usage counter
  await incrementUsage(guardResult.subscription.userId, 'process_video');
  
  return NextResponse.json({ success: true, result });
};

// Wrap with subscription guard
export const POST = withSubscriptionGuard(handler, {
  action: 'process_video',
  amount: 1,
});
```

### Example 2: Protect AI Chat API

```typescript
// app/api/ai-chat/route.ts
import { withSubscriptionGuard } from '@/lib/middleware/subscription-guard';
import { recordAIChatSession } from '@/lib/subscription/service';

const handler = async (req: NextRequest, guardResult: any) => {
  const { question, videoId } = await req.json();
  
  // Generate AI response...
  const response = await generateAIResponse(question);
  
  // Record the chat session (automatically increments usage)
  await recordAIChatSession(
    guardResult.subscription.userId,
    question,
    response,
    videoId
  );
  
  return NextResponse.json({ response });
};

export const POST = withSubscriptionGuard(handler, {
  action: 'ask_ai_question',
  requiredFeature: 'ai_chat', // Blocks free tier users
});
```

### Example 3: Component-Level Subscription Check

```typescript
// components/VideoProcessor.tsx
'use client';

import { useState, useEffect } from 'react';
import { subscriptionGuard } from '@/lib/middleware/subscription-guard';
import { useSession } from 'next-auth/react';

export function VideoProcessor() {
  const { data: session } = useSession();
  const [canProcess, setCanProcess] = useState(false);
  const [limitMessage, setLimitMessage] = useState('');

  useEffect(() => {
    checkVideoLimit();
  }, [session]);

  const checkVideoLimit = async () => {
    if (!session?.user?.id) return;

    const result = await subscriptionGuard(session.user.id, {
      action: 'process_video'
    });

    setCanProcess(result.allowed);
    if (!result.allowed) {
      setLimitMessage(result.reason || 'Video processing limit reached');
    }
  };

  if (!canProcess) {
    return (
      <div className="p-4 border border-orange-200 rounded-lg bg-orange-50">
        <p className="text-orange-700">{limitMessage}</p>
        <button className="mt-2 bg-blue-500 text-white px-4 py-2 rounded">
          Upgrade Subscription
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Video processing UI */}
    </div>
  );
}
```

---

## 🔍 Manual Testing Checklist

Use this checklist to verify your subscription system works correctly:

### Free Tier Tests
- [ ] Can process up to 5 videos per month
- [ ] 6th video is blocked with clear error message
- [ ] AI chat features are completely disabled
- [ ] Only "Basic Summary" format is available
- [ ] PDF exports have watermark
- [ ] Processing uses "low" priority queue

### Student Tier Tests  
- [ ] Can process unlimited videos
- [ ] Can use AI chat up to 10 times per month
- [ ] 11th AI chat question is blocked
- [ ] Study Notes and Presentation formats are available
- [ ] PDF exports have no watermark
- [ ] Processing uses "medium" priority queue

### Pro Tier Tests
- [ ] Can process unlimited videos
- [ ] Can use unlimited AI chat
- [ ] All note formats are available
- [ ] Word and PowerPoint exports are available  
- [ ] Processing uses "high" priority queue (2x faster)

### Admin Override Tests
- [ ] Can set temporary subscription overrides
- [ ] Overrides expire automatically
- [ ] Can clear overrides manually
- [ ] Override status is clearly displayed in UI

### Monthly Reset Tests
- [ ] Usage counters reset on the 1st of each month
- [ ] Users can process videos again after reset
- [ ] Historical usage is preserved for billing

---

## 🚨 Common Issues & Solutions

### Issue: "User not found" error
**Solution:** Make sure you've run the database migration and the user exists in the `users` table.

### Issue: Limits not enforcing
**Solution:** Check that you're using `withSubscriptionGuard` wrapper on API routes and calling `incrementUsage` after successful actions.

### Issue: Admin tester not visible
**Solution:** Ensure you're in development mode or your email is in the `ADMIN_EMAILS` array.

### Issue: Database functions not found
**Solution:** Run the complete migration script in your Supabase SQL editor.

---

## 📊 Monitoring & Analytics

Track subscription metrics in your admin dashboard:

```sql
-- Current month usage by tier
SELECT 
  subscription_tier,
  COUNT(*) as user_count,
  AVG(videos_processed) as avg_videos,
  AVG(ai_questions_asked) as avg_ai_questions
FROM user_monthly_usage 
WHERE month_year = TO_CHAR(NOW(), 'YYYY-MM')
GROUP BY subscription_tier;

-- Users hitting limits
SELECT u.email, umu.subscription_tier, umu.videos_processed, umu.videos_limit
FROM user_monthly_usage umu
JOIN users u ON u.id = umu.user_id
WHERE umu.videos_processed >= umu.videos_limit
AND umu.videos_limit > 0;
```

---

## 🎯 Production Deployment

When deploying to production:

1. **Remove/secure admin endpoints** - Restrict admin API to specific IPs
2. **Set up Polar webhooks** - For real subscription updates
3. **Configure monthly reset job** - Cron job to reset usage counters
4. **Monitor usage patterns** - Set up alerts for unusual usage
5. **Test payment flows** - Ensure Polar integration works correctly

---

This system gives you complete control over testing subscription features without any payment required. You can validate all business logic, user experience, and limit enforcement before going live with real payments.