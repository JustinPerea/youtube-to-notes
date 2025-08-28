-- Migration script to add OAuth fields and notes table
-- Run this in your Supabase SQL editor

-- Step 1: Add OAuth columns to users table if they don't exist
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

-- Step 6: Check notes table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'notes'
ORDER BY ordinal_position;
