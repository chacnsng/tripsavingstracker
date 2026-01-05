-- Storage setup for user photos
-- Run this in your Supabase SQL Editor after creating the storage bucket

-- Create storage bucket for user photos (if it doesn't exist)
-- Note: You need to create the bucket in Supabase Dashboard first:
-- 1. Go to Storage in your Supabase dashboard
-- 2. Click "New bucket"
-- 3. Name it "user-photos"
-- 4. Make it public (or set up RLS policies below)

-- Storage policies for user-photos bucket
-- Allow authenticated users to upload their own photos
CREATE POLICY "Users can upload their own photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'user-photos' AND
  auth.role() = 'authenticated'
);

-- Allow public read access to photos
CREATE POLICY "Public can view photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'user-photos');

-- Allow users to update their own photos
CREATE POLICY "Users can update their own photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'user-photos' AND
  auth.role() = 'authenticated'
);

-- Allow users to delete their own photos
CREATE POLICY "Users can delete their own photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'user-photos' AND
  auth.role() = 'authenticated'
);

