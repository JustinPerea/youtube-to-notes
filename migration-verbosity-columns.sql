-- Migration: Add verbosity_versions column to notes table
-- This migration adds support for storing multiple verbosity levels (brief, standard, comprehensive)
-- for each note, enabling users to switch between different detail levels in the UI

ALTER TABLE notes 
ADD COLUMN verbosity_versions JSONB;

-- Create an index on the verbosity_versions column for better query performance
CREATE INDEX idx_notes_verbosity_versions ON notes USING gin(verbosity_versions);

-- Add a comment to document the column
COMMENT ON COLUMN notes.verbosity_versions IS 'Stores brief, standard, and comprehensive versions of note content as JSON';