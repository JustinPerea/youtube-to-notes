# Database Migration Steps

## Step 1: Update Database Schema

Go to your Supabase dashboard and run this SQL script:

```sql
-- Migration script to add OAuth fields to existing database
-- Run this if you already have a database with the users table

-- Step 1: Add new columns if they don't exist
DO $$ 
BEGIN
    -- Add oauth_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'oauth_id'
    ) THEN
        ALTER TABLE users ADD COLUMN oauth_id TEXT;
    END IF;
    
    -- Add oauth_provider column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'oauth_provider'
    ) THEN
        ALTER TABLE users ADD COLUMN oauth_provider TEXT DEFAULT 'google';
    END IF;
END $$;

-- Step 2: Create unique index for OAuth lookup if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_users_oauth'
    ) THEN
        CREATE UNIQUE INDEX idx_users_oauth ON users(oauth_id, oauth_provider);
    END IF;
END $$;

-- Step 3: Create notes table if it doesn't exist
CREATE TABLE IF NOT EXISTS notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    video_id UUID REFERENCES videos(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    template_id TEXT,
    tags TEXT[],
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Step 4: Create indexes for notes table
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_video_id ON notes(video_id);
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at DESC);

-- Step 5: Verify the migration
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- Step 6: Check indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'users';

-- Step 7: Check notes table
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'notes'
ORDER BY ordinal_position;
```

## Step 2: Test the Implementation

1. **Sign out and sign in again** to trigger the new authentication flow
2. **Process a video** to generate notes
3. **Click "Save Note"** to test the UUID-based saving
4. **Check the database** to verify the user and note records

## Expected Results

After running the migration and testing:

1. ✅ **Users table** should have `oauth_id` and `oauth_provider` columns
2. ✅ **Notes table** should be created with proper UUID relationships
3. ✅ **Authentication** should create users with both OAuth ID and UUID
4. ✅ **Note saving** should work without UUID type mismatch errors
5. ✅ **Session** should contain the database UUID instead of OAuth ID

## Troubleshooting

If you encounter issues:

1. **Check database logs** for any migration errors
2. **Verify environment variables** are properly set
3. **Clear browser cookies** and sign in again
4. **Check the database** for proper table structure
