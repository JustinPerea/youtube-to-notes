# 🗄️ Supabase Migration Guide

This guide walks you through setting up the subscription system database schema in Supabase.

## 📋 Step 1: Copy the SQL Migration

Copy the entire SQL code below and paste it into your **Supabase SQL Editor**:

```sql
-- Migration: Add comprehensive subscription tracking fields
-- This adds proper subscription management and usage tracking

-- First, update the users table subscription tier enum to match our configuration
ALTER TABLE users 
  DROP CONSTRAINT IF EXISTS users_subscription_tier_check,
  ADD CONSTRAINT users_subscription_tier_check 
  CHECK (subscription_tier IN ('free', 'student', 'pro'));

-- Add missing subscription tracking fields to users table
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS subscription_current_period_start TIMESTAMP,
  ADD COLUMN IF NOT EXISTS subscription_current_period_end TIMESTAMP,
  ADD COLUMN IF NOT EXISTS subscription_cancel_at_period_end BOOLEAN DEFAULT FALSE,
  
  -- AI Chat Usage Tracking
  ADD COLUMN IF NOT EXISTS ai_questions_used_this_month INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ai_questions_reset_date TIMESTAMP DEFAULT DATE_TRUNC('month', NOW()) + INTERVAL '1 month',
  
  -- Storage Usage Tracking
  ADD COLUMN IF NOT EXISTS storage_used_mb INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS storage_limit_mb INTEGER DEFAULT 100, -- 100MB for free tier
  
  -- Admin Override for Testing
  ADD COLUMN IF NOT EXISTS admin_override_tier TEXT CHECK (admin_override_tier IN ('free', 'student', 'pro') OR admin_override_tier IS NULL),
  ADD COLUMN IF NOT EXISTS admin_override_expires TIMESTAMP;

-- Create a comprehensive usage tracking table
CREATE TABLE IF NOT EXISTS user_monthly_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  month_year TEXT NOT NULL, -- Format: YYYY-MM
  
  -- Video Processing
  videos_processed INTEGER DEFAULT 0,
  videos_limit INTEGER NOT NULL,
  
  -- AI Chat
  ai_questions_asked INTEGER DEFAULT 0,
  ai_questions_limit INTEGER DEFAULT 0, -- 0 means disabled, -1 means unlimited
  
  -- Storage (tracked monthly for billing/limits)
  storage_used_mb INTEGER DEFAULT 0,
  storage_limit_mb INTEGER NOT NULL,
  
  -- Subscription info at time of usage (for historical tracking)
  subscription_tier TEXT NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  
  -- Ensure one record per user per month
  UNIQUE(user_id, month_year)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_monthly_usage_user_id ON user_monthly_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_user_monthly_usage_month_year ON user_monthly_usage(month_year);
CREATE INDEX IF NOT EXISTS idx_users_subscription_tier ON users(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_users_admin_override ON users(admin_override_tier, admin_override_expires);

-- Add storage tracking to processing results
ALTER TABLE processing_results 
  ADD COLUMN IF NOT EXISTS file_size_mb INTEGER DEFAULT 0;

-- Add AI chat tracking table
CREATE TABLE IF NOT EXISTS ai_chat_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  video_id UUID REFERENCES videos(id) ON DELETE SET NULL,
  note_id UUID REFERENCES notes(id) ON DELETE SET NULL,
  
  -- Chat content
  question TEXT NOT NULL,
  response TEXT NOT NULL,
  
  -- Cost tracking
  tokens_used INTEGER DEFAULT 0,
  cost_in_cents INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create indexes for AI chat
CREATE INDEX IF NOT EXISTS idx_ai_chat_user_id ON ai_chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_created_at ON ai_chat_sessions(created_at DESC);

-- Function to get or create current month usage record
CREATE OR REPLACE FUNCTION get_or_create_monthly_usage(p_user_id UUID)
RETURNS user_monthly_usage AS $$
DECLARE
  current_month TEXT;
  usage_record user_monthly_usage;
  user_record users;
BEGIN
  current_month := TO_CHAR(NOW(), 'YYYY-MM');
  
  -- Get user info
  SELECT * INTO user_record FROM users WHERE id = p_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found: %', p_user_id;
  END IF;
  
  -- Try to get existing record
  SELECT * INTO usage_record 
  FROM user_monthly_usage 
  WHERE user_id = p_user_id AND month_year = current_month;
  
  -- Create if doesn't exist
  IF NOT FOUND THEN
    -- Get limits based on subscription tier (or admin override)
    DECLARE
      effective_tier TEXT;
      video_limit INTEGER;
      ai_limit INTEGER;
      storage_limit INTEGER;
    BEGIN
      -- Use admin override if active and not expired
      IF user_record.admin_override_tier IS NOT NULL AND 
         (user_record.admin_override_expires IS NULL OR user_record.admin_override_expires > NOW()) THEN
        effective_tier := user_record.admin_override_tier;
      ELSE
        effective_tier := user_record.subscription_tier;
      END IF;
      
      -- Set limits based on tier
      CASE effective_tier
        WHEN 'free' THEN
          video_limit := 5;
          ai_limit := 0;
          storage_limit := 100; -- 100MB
        WHEN 'student' THEN
          video_limit := -1; -- unlimited
          ai_limit := 10;
          storage_limit := 5120; -- 5GB in MB
        WHEN 'pro' THEN
          video_limit := -1; -- unlimited
          ai_limit := -1; -- unlimited
          storage_limit := 51200; -- 50GB in MB
        ELSE
          video_limit := 5;
          ai_limit := 0;
          storage_limit := 100;
      END CASE;
      
      INSERT INTO user_monthly_usage (
        user_id, month_year, videos_limit, ai_questions_limit, 
        storage_limit_mb, subscription_tier
      ) VALUES (
        p_user_id, current_month, video_limit, ai_limit, 
        storage_limit, effective_tier
      ) RETURNING * INTO usage_record;
    END;
  END IF;
  
  RETURN usage_record;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user can perform an action
CREATE OR REPLACE FUNCTION check_usage_limit(
  p_user_id UUID,
  p_action TEXT -- 'process_video', 'ask_ai_question', 'use_storage'
)
RETURNS JSON AS $$
DECLARE
  usage_record user_monthly_usage;
  result JSON;
BEGIN
  -- Get current month usage
  usage_record := get_or_create_monthly_usage(p_user_id);
  
  CASE p_action
    WHEN 'process_video' THEN
      IF usage_record.videos_limit = -1 THEN
        -- Unlimited
        result := json_build_object(
          'allowed', true,
          'unlimited', true,
          'current', usage_record.videos_processed,
          'limit', -1
        );
      ELSIF usage_record.videos_processed < usage_record.videos_limit THEN
        -- Under limit
        result := json_build_object(
          'allowed', true,
          'unlimited', false,
          'current', usage_record.videos_processed,
          'limit', usage_record.videos_limit,
          'remaining', usage_record.videos_limit - usage_record.videos_processed
        );
      ELSE
        -- Over limit
        result := json_build_object(
          'allowed', false,
          'unlimited', false,
          'current', usage_record.videos_processed,
          'limit', usage_record.videos_limit,
          'remaining', 0,
          'reason', 'Monthly video limit reached'
        );
      END IF;
      
    WHEN 'ask_ai_question' THEN
      IF usage_record.ai_questions_limit = 0 THEN
        -- AI chat disabled for tier
        result := json_build_object(
          'allowed', false,
          'unlimited', false,
          'current', usage_record.ai_questions_asked,
          'limit', 0,
          'reason', 'AI chat not available in your subscription tier'
        );
      ELSIF usage_record.ai_questions_limit = -1 THEN
        -- Unlimited
        result := json_build_object(
          'allowed', true,
          'unlimited', true,
          'current', usage_record.ai_questions_asked,
          'limit', -1
        );
      ELSIF usage_record.ai_questions_asked < usage_record.ai_questions_limit THEN
        -- Under limit
        result := json_build_object(
          'allowed', true,
          'unlimited', false,
          'current', usage_record.ai_questions_asked,
          'limit', usage_record.ai_questions_limit,
          'remaining', usage_record.ai_questions_limit - usage_record.ai_questions_asked
        );
      ELSE
        -- Over limit
        result := json_build_object(
          'allowed', false,
          'unlimited', false,
          'current', usage_record.ai_questions_asked,
          'limit', usage_record.ai_questions_limit,
          'remaining', 0,
          'reason', 'Monthly AI chat limit reached'
        );
      END IF;
      
    ELSE
      result := json_build_object('allowed', false, 'reason', 'Unknown action');
  END CASE;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to increment usage
CREATE OR REPLACE FUNCTION increment_usage(
  p_user_id UUID,
  p_action TEXT,
  p_amount INTEGER DEFAULT 1
)
RETURNS BOOLEAN AS $$
DECLARE
  current_month TEXT;
BEGIN
  current_month := TO_CHAR(NOW(), 'YYYY-MM');
  
  CASE p_action
    WHEN 'process_video' THEN
      INSERT INTO user_monthly_usage (user_id, month_year, videos_processed)
      VALUES (p_user_id, current_month, p_amount)
      ON CONFLICT (user_id, month_year) 
      DO UPDATE SET 
        videos_processed = user_monthly_usage.videos_processed + p_amount,
        updated_at = NOW();
        
    WHEN 'ask_ai_question' THEN
      INSERT INTO user_monthly_usage (user_id, month_year, ai_questions_asked)
      VALUES (p_user_id, current_month, p_amount)
      ON CONFLICT (user_id, month_year) 
      DO UPDATE SET 
        ai_questions_asked = user_monthly_usage.ai_questions_asked + p_amount,
        updated_at = NOW();
        
    ELSE
      RETURN false;
  END CASE;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE user_monthly_usage IS 'Tracks monthly usage limits and current usage for each user';
COMMENT ON TABLE ai_chat_sessions IS 'Tracks AI chat interactions for usage billing and limits';
COMMENT ON FUNCTION get_or_create_monthly_usage IS 'Gets or creates monthly usage record with proper limits based on subscription tier';
COMMENT ON FUNCTION check_usage_limit IS 'Checks if user can perform an action based on their subscription and current usage';
COMMENT ON FUNCTION increment_usage IS 'Increments usage counters after successful actions';
```

## 🎯 Step 2: Execute in Supabase

1. **Open your Supabase Dashboard**
2. **Navigate to SQL Editor**
3. **Create a new query**
4. **Paste the SQL code above**
5. **Click "Run" to execute**

You should see a success message like "Success. No rows returned" or similar.

## ✅ Step 3: Verify Migration Success

After running the migration, you should see these new database elements:

### New Columns Added to `users` Table:
- `stripe_customer_id` - Stripe customer reference
- `stripe_subscription_id` - Stripe subscription reference
- `subscription_current_period_start` - Current billing period start
- `subscription_current_period_end` - Current billing period end
- `subscription_cancel_at_period_end` - Cancellation flag
- `ai_questions_used_this_month` - AI chat usage counter
- `ai_questions_reset_date` - Next reset date
- `storage_used_mb` - Current storage usage in MB
- `storage_limit_mb` - Storage limit in MB
- `admin_override_tier` - **Testing override tier**
- `admin_override_expires` - **Testing override expiration**

### New Tables Created:
- `user_monthly_usage` - Tracks monthly usage per user
- `ai_chat_sessions` - Tracks AI chat interactions

### New Functions Created:
- `get_or_create_monthly_usage()` - Manages monthly usage records
- `check_usage_limit()` - Checks if user can perform actions
- `increment_usage()` - Updates usage counters

## 🧪 Step 4: Test the Admin Interface

After the migration is complete:

1. **Start your development server** (if not running):
   ```bash
   npm run dev
   ```

2. **Visit the admin interface**:
   ```
   http://localhost:3003/admin
   ```

3. **Use the subscription tester** to switch between tiers

4. **Test limits** by trying to process videos on `/process`

## 🚨 Troubleshooting

### Common Issues:

**Error: "relation 'users' does not exist"**
- Make sure you've run your initial database setup first
- Verify you have a `users` table in your database

**Error: "function uuid_generate_v4() does not exist"**
- Run this first: `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`

**Error: "column already exists"**
- This is normal - the migration uses `IF NOT EXISTS` to be safe
- You can ignore these warnings

### Success Indicators:
- ✅ No error messages in the SQL editor
- ✅ New tables visible in your database schema
- ✅ Admin interface at `/admin` loads without errors
- ✅ Subscription tester shows current tier information

## 🎉 Next Steps

Once the migration is successful:

1. **Test all subscription tiers** using the admin interface
2. **Verify video processing limits** work correctly
3. **Check that AI chat limits** are enforced (if implemented)
4. **Review the testing guide** in `SUBSCRIPTION_TESTING_GUIDE.md`

---

**💡 Pro Tip**: Keep this migration file for reference. You can re-run it safely multiple times since it uses `IF NOT EXISTS` clauses.