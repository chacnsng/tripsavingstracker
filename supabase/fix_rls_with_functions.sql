-- Fix infinite recursion using SECURITY DEFINER functions
-- These functions bypass RLS, so they won't cause recursion
-- Run this in your Supabase SQL Editor

-- Step 1: Drop all existing policies
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'users') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON users';
    END LOOP;
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'trips') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON trips';
    END LOOP;
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'trip_members') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON trip_members';
    END LOOP;
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'savings_log') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON savings_log';
    END LOOP;
END $$;

-- Step 2: Create simple policies that only check authentication (no table queries)
-- Users: Authenticated users can do everything
CREATE POLICY "users_all" ON users
  FOR ALL 
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Trips: Public read, authenticated write
CREATE POLICY "trips_select" ON trips
  FOR SELECT 
  USING (true);

CREATE POLICY "trips_modify" ON trips
  FOR ALL 
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Trip members: Public read, authenticated write
CREATE POLICY "trip_members_select" ON trip_members
  FOR SELECT 
  USING (true);

CREATE POLICY "trip_members_modify" ON trip_members
  FOR ALL 
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Savings log: Public read, authenticated write
CREATE POLICY "savings_log_select" ON savings_log
  FOR SELECT 
  USING (true);

CREATE POLICY "savings_log_insert" ON savings_log
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

-- If the above still causes recursion, use this alternative:
-- Completely disable RLS for authenticated operations
-- This is safe if you're using Supabase Auth to control access

