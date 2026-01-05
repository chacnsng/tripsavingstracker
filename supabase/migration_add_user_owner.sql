-- Migration: Add owner_id to users table to track which account created each user
-- Run this in your Supabase SQL Editor

-- Add owner_id column to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES users(id) ON DELETE CASCADE;

-- Create index for owner_id lookups
CREATE INDEX IF NOT EXISTS idx_users_owner_id ON users(owner_id);

-- For existing users, set owner_id to their own id (they own themselves)
UPDATE users
SET owner_id = id
WHERE owner_id IS NULL;

