-- LEGACY ONLY. A fresh install does not need this file: supabase_core.sql
-- already creates cover_letters and every column added below. It is kept for
-- databases created before history persistence landed, where resume_generations
-- exists but is missing the content columns. Running it on a fresh database
-- does nothing useful, and running it on a database with no resume_generations
-- table fails on the first statement.
-- Run this in the Supabase SQL editor.

-- 1. Extend resume_generations with full content
ALTER TABLE resume_generations
  ADD COLUMN IF NOT EXISTS job_title text,
  ADD COLUMN IF NOT EXISTS company text,
  ADD COLUMN IF NOT EXISTS job_description_text text,
  ADD COLUMN IF NOT EXISTS resume_json jsonb;

-- 2. Cover letters table
CREATE TABLE IF NOT EXISTS cover_letters (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  job_title text,
  company text,
  job_description_text text,
  cover_letter_text text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE cover_letters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own cover letters" ON cover_letters;
CREATE POLICY "Users manage own cover letters"
  ON cover_letters FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS cover_letters_user_id_created_at
  ON cover_letters (user_id, created_at DESC);
