-- Migration: Add photo_url to users table
-- Run this in your Supabase SQL Editor

ALTER TABLE users
ADD COLUMN IF NOT EXISTS photo_url TEXT;

