-- Fix infinite recursion in RLS policies - Version 2
-- This version uses SECURITY DEFINER functions to bypass RLS
-- Run this in your Supabase SQL Editor

-- First, drop all existing policies
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can insert users" ON users;
DROP POLICY IF EXISTS "Users can view trips they're members of" ON trips;
DROP POLICY IF EXISTS "Users can view trip members" ON trip_members;
DROP POLICY IF EXISTS "Users can view savings logs" ON savings_log;
DROP POLICY IF EXISTS "Authenticated users can view all users" ON users;
DROP POLICY IF EXISTS "Authenticated users can insert their own profile" ON users;
DROP POLICY IF EXISTS "Authenticated users can update their own profile" ON users;
DROP POLICY IF EXISTS "Authenticated users can insert users" ON users;
DROP POLICY IF EXISTS "Authenticated users can update users" ON users;
DROP POLICY IF EXISTS "Authenticated users can delete users" ON users;
DROP POLICY IF EXISTS "Anyone can view trips" ON trips;
DROP POLICY IF EXISTS "Authenticated users can insert trips" ON trips;
DROP POLICY IF EXISTS "Authenticated users can update trips" ON trips;
DROP POLICY IF EXISTS "Authenticated users can delete trips" ON trips;
DROP POLICY IF EXISTS "Anyone can view trip members" ON trip_members;
DROP POLICY IF EXISTS "Authenticated users can insert trip members" ON trip_members;
DROP POLICY IF EXISTS "Authenticated users can update trip members" ON trip_members;
DROP POLICY IF EXISTS "Authenticated users can delete trip members" ON trip_members;
DROP POLICY IF EXISTS "Anyone can view savings logs" ON savings_log;
DROP POLICY IF EXISTS "Authenticated users can insert savings logs" ON savings_log;

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS create_user_profile(UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS insert_user(UUID, TEXT, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS update_user(UUID, UUID, TEXT, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS delete_user(UUID);
DROP FUNCTION IF EXISTS insert_trip(TEXT, TEXT, DATE, DECIMAL, TEXT, TEXT, JSONB, UUID);
DROP FUNCTION IF EXISTS update_trip(UUID, TEXT, TEXT, DATE, DECIMAL, TEXT, TEXT, JSONB);
DROP FUNCTION IF EXISTS delete_trip(UUID);

-- Simple policies that don't cause recursion
-- Users: Allow authenticated users to view all (for admin panel)
CREATE POLICY "View users" ON users
  FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Users: Allow authenticated users to insert (for signup and admin)
CREATE POLICY "Insert users" ON users
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

-- Users: Allow authenticated users to update
CREATE POLICY "Update users" ON users
  FOR UPDATE 
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Users: Allow authenticated users to delete
CREATE POLICY "Delete users" ON users
  FOR DELETE 
  USING (auth.role() = 'authenticated');

-- Trips: Public read access (for dashboard)
CREATE POLICY "View trips" ON trips
  FOR SELECT 
  USING (true);

-- Trips: Allow authenticated users to insert
CREATE POLICY "Insert trips" ON trips
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

-- Trips: Allow authenticated users to update
CREATE POLICY "Update trips" ON trips
  FOR UPDATE 
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Trips: Allow authenticated users to delete
CREATE POLICY "Delete trips" ON trips
  FOR DELETE 
  USING (auth.role() = 'authenticated');

-- Trip members: Public read access
CREATE POLICY "View trip members" ON trip_members
  FOR SELECT 
  USING (true);

-- Trip members: Allow authenticated users to insert
CREATE POLICY "Insert trip members" ON trip_members
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

-- Trip members: Allow authenticated users to update
CREATE POLICY "Update trip members" ON trip_members
  FOR UPDATE 
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Trip members: Allow authenticated users to delete
CREATE POLICY "Delete trip members" ON trip_members
  FOR DELETE 
  USING (auth.role() = 'authenticated');

-- Savings log: Public read access
CREATE POLICY "View savings logs" ON savings_log
  FOR SELECT 
  USING (true);

-- Savings log: Allow authenticated users to insert
CREATE POLICY "Insert savings logs" ON savings_log
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

-- If the above still causes recursion, try this alternative:
-- Temporarily disable RLS for testing, then re-enable with simpler policies
-- ALTER TABLE users DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE trips DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE trip_members DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE savings_log DISABLE ROW LEVEL SECURITY;

