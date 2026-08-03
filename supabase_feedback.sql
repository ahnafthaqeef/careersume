-- supabase_feedback.sql
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS feedback (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  type text NOT NULL CHECK (type IN ('bug', 'idea', 'other')),
  message text NOT NULL CHECK (char_length(message) <= 2000),
  screenshot_url text,
  page_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Authenticated users can insert their own feedback
CREATE POLICY "Users can insert own feedback"
  ON feedback FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Only admins can read all feedback
CREATE POLICY "Admin reads all feedback"
  ON feedback FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE INDEX idx_feedback_created_at ON feedback (created_at DESC);

-- Storage bucket policy (run after creating bucket 'feedback-screenshots' in dashboard)
CREATE POLICY "Users upload own screenshots"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'feedback-screenshots' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
