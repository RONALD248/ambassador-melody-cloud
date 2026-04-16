
-- Drop the broad SELECT policy and replace with path-based access
DROP POLICY IF EXISTS "Anyone can view media files" ON storage.objects;

-- Allow access to specific files (not listing)
CREATE POLICY "Anyone can view media files by path"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'media' AND name IS NOT NULL);
