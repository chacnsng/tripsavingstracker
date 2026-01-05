-- Migration: Add place photos, description, and location to trips table
-- Run this in your Supabase SQL Editor

-- Add new columns to trips table
ALTER TABLE trips
ADD COLUMN IF NOT EXISTS place_description TEXT,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS photos JSONB DEFAULT '[]'::jsonb;

-- Add index for photos queries
CREATE INDEX IF NOT EXISTS idx_trips_photos ON trips USING GIN (photos);

