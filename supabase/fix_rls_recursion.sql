-- Fix infinite recursion in RLS policies
-- Run this in your Supabase SQL Editor

-- Drop existing policies that might cause recursion
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can insert users" ON users;
DROP POLICY IF EXISTS "Users can view trips they're members of" ON trips;
DROP POLICY IF EXISTS "Users can view trip members" ON trip_members;
DROP POLICY IF EXISTS "Users can view savings logs" ON savings_log;

-- Create simpler, non-recursive policies for users
-- Allow authenticated users to view all users (for admin panel)
CREATE POLICY "Authenticated users can view all users" ON users
  FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert their own profile
CREATE POLICY "Authenticated users can insert their own profile" ON users
  FOR INSERT 
  WITH CHECK (auth.uid() = auth_user_id);

-- Allow authenticated users to update their own profile
CREATE POLICY "Authenticated users can update their own profile" ON users
  FOR UPDATE 
  USING (auth.uid() = auth_user_id);

-- Allow authenticated users to insert users (for admin panel)
CREATE POLICY "Authenticated users can insert users" ON users
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update users (for admin panel)
CREATE POLICY "Authenticated users can update users" ON users
  FOR UPDATE 
  USING (auth.role() = 'authenticated');

-- Allow authenticated users to delete users (for admin panel)
CREATE POLICY "Authenticated users can delete users" ON users
  FOR DELETE 
  USING (auth.role() = 'authenticated');

-- Create policies for trips (no recursion)
-- Allow everyone to view trips (public dashboard)
CREATE POLICY "Anyone can view trips" ON trips
  FOR SELECT 
  USING (true);

-- Allow authenticated users to insert trips
CREATE POLICY "Authenticated users can insert trips" ON trips
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update trips
CREATE POLICY "Authenticated users can update trips" ON trips
  FOR UPDATE 
  USING (auth.role() = 'authenticated');

-- Allow authenticated users to delete trips
CREATE POLICY "Authenticated users can delete trips" ON trips
  FOR DELETE 
  USING (auth.role() = 'authenticated');

-- Create policies for trip_members (no recursion)
-- Allow everyone to view trip members (public dashboard)
CREATE POLICY "Anyone can view trip members" ON trip_members
  FOR SELECT 
  USING (true);

-- Allow authenticated users to insert trip members
CREATE POLICY "Authenticated users can insert trip members" ON trip_members
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update trip members
CREATE POLICY "Authenticated users can update trip members" ON trip_members
  FOR UPDATE 
  USING (auth.role() = 'authenticated');

-- Allow authenticated users to delete trip members
CREATE POLICY "Authenticated users can delete trip members" ON trip_members
  FOR DELETE 
  USING (auth.role() = 'authenticated');

-- Create policies for savings_log (no recursion)
-- Allow everyone to view savings logs (public dashboard)
CREATE POLICY "Anyone can view savings logs" ON savings_log
  FOR SELECT 
  USING (true);

-- Allow authenticated users to insert savings logs
CREATE POLICY "Authenticated users can insert savings logs" ON savings_log
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

