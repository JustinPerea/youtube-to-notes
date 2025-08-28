-- Database Setup Script for YouTube-to-Notes
-- Run this script in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- USERS TABLE (Updated with OAuth fields)
-- =============================================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    image TEXT,
    oauth_id TEXT,
    oauth_provider TEXT DEFAULT 'google',
    email_verified TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    
    -- Subscription and usage tracking
    subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'basic', 'pro', 'enterprise')),
    subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'canceled', 'past_due', 'incomplete')),
    monthly_video_limit INTEGER DEFAULT 3,
    videos_processed_this_month INTEGER DEFAULT 0,
    reset_date TIMESTAMP,
    
    -- Settings
    preferences JSONB
);

-- Create unique index for OAuth lookup
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_oauth ON users(oauth_id, oauth_provider);

-- =============================================================================
-- VIDEOS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS videos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    youtube_url TEXT NOT NULL,
    video_id TEXT NOT NULL,
    title TEXT,
    description TEXT,
    thumbnail_url TEXT,
    duration INTEGER,
    channel_name TEXT,
    
    -- Processing status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    processing_started TIMESTAMP,
    processing_completed TIMESTAMP,
    error_message TEXT,
    
    -- Cost tracking
    tokens_used INTEGER,
    cost_estimate INTEGER,
    
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- =============================================================================
-- PROCESSING RESULTS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS processing_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    template_id TEXT NOT NULL,
    content TEXT NOT NULL,
    format TEXT DEFAULT 'markdown' CHECK (format IN ('markdown', 'html', 'json', 'text')),
    
    -- Processing metadata
    processing_time INTEGER,
    tokens_used INTEGER,
    cost_in_cents INTEGER,
    
    -- Export options
    exported_at TIMESTAMP,
    export_format TEXT CHECK (export_format IN ('pdf', 'md', 'html', 'docx')),
    export_url TEXT,
    
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- =============================================================================
-- NOTES TABLE (New table for storing user notes)
-- =============================================================================
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_videos_user_id ON videos(user_id);
CREATE INDEX IF NOT EXISTS idx_videos_status ON videos(status);
CREATE INDEX IF NOT EXISTS idx_processing_results_video_id ON processing_results(video_id);
CREATE INDEX IF NOT EXISTS idx_processing_results_template_id ON processing_results(template_id);
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_video_id ON notes(video_id);
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at DESC);
