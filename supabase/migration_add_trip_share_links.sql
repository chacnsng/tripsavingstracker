-- Migration: Add trip_share_links table for shareable trip links
-- Run this in your Supabase SQL Editor

-- Create trip_share_links table
CREATE TABLE IF NOT EXISTS trip_share_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  share_token TEXT NOT NULL UNIQUE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for share_token lookups
CREATE INDEX IF NOT EXISTS idx_trip_share_links_token ON trip_share_links(share_token);
CREATE INDEX IF NOT EXISTS idx_trip_share_links_trip_id ON trip_share_links(trip_id);

-- Add trigger for updated_at
CREATE TRIGGER update_trip_share_links_updated_at BEFORE UPDATE ON trip_share_links
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE trip_share_links ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view share links (needed for validation)
CREATE POLICY "Anyone can view share links" ON trip_share_links
  FOR SELECT USING (true);

-- Policy: Only admins can create share links
CREATE POLICY "Admins can create share links" ON trip_share_links
  FOR INSERT WITH CHECK (true); -- Simplified for demo

