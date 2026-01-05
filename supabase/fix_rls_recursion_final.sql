-- Fix infinite recursion in RLS policies - Final Version
-- This version temporarily disables RLS, then re-enables with minimal policies
-- Run this in your Supabase SQL Editor

-- Step 1: Drop ALL existing policies to start fresh
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop all policies on users
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'users') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON users';
    END LOOP;
    
    -- Drop all policies on trips
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'trips') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON trips';
    END LOOP;
    
    -- Drop all policies on trip_members
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'trip_members') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON trip_members';
    END LOOP;
    
    -- Drop all policies on savings_log
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'savings_log') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON savings_log';
    END LOOP;
END $$;

-- Step 2: Disable RLS temporarily
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE trips DISABLE ROW LEVEL SECURITY;
ALTER TABLE trip_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE savings_log DISABLE ROW LEVEL SECURITY;

-- Step 3: Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_log ENABLE ROW LEVEL SECURITY;

-- Step 4: Create minimal policies that don't cause recursion
-- These policies only check auth.role() which doesn't query tables

-- Users: Allow authenticated users to do everything
CREATE POLICY "users_select" ON users
  FOR SELECT 
  USING (auth.role() = 'authenticated');

CREATE POLICY "users_insert" ON users
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "users_update" ON users
  FOR UPDATE 
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "users_delete" ON users
  FOR DELETE 
  USING (auth.role() = 'authenticated');

-- Trips: Public read, authenticated write
CREATE POLICY "trips_select" ON trips
  FOR SELECT 
  USING (true);

CREATE POLICY "trips_insert" ON trips
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "trips_update" ON trips
  FOR UPDATE 
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "trips_delete" ON trips
  FOR DELETE 
  USING (auth.role() = 'authenticated');

-- Trip members: Public read, authenticated write
CREATE POLICY "trip_members_select" ON trip_members
  FOR SELECT 
  USING (true);

CREATE POLICY "trip_members_insert" ON trip_members
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "trip_members_update" ON trip_members
  FOR UPDATE 
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "trip_members_delete" ON trip_members
  FOR DELETE 
  USING (auth.role() = 'authenticated');

-- Savings log: Public read, authenticated write
CREATE POLICY "savings_log_select" ON savings_log
  FOR SELECT 
  USING (true);

CREATE POLICY "savings_log_insert" ON savings_log
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

