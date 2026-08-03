-- BYOK (Bring Your Own Key) — encrypted storage for user-supplied AI provider keys.
-- Run this in the Supabase SQL editor for the Careersume project.

CREATE TABLE IF NOT EXISTS user_api_keys (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL CONSTRAINT user_api_keys_provider_check
    CHECK (provider IN ('openai', 'gemini', 'anthropic', 'groq')),
  encrypted_key text NOT NULL,
  iv text NOT NULL,
  auth_tag text NOT NULL,
  last_validated_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id, provider)
);

-- The CREATE above only applies to a fresh database, so restate the provider
-- constraint for tables that already exist (this file predates the groq adapter).
-- Both statements are safe to re-run.
ALTER TABLE user_api_keys DROP CONSTRAINT IF EXISTS user_api_keys_provider_check;
ALTER TABLE user_api_keys ADD CONSTRAINT user_api_keys_provider_check
  CHECK (provider IN ('openai', 'gemini', 'anthropic', 'groq'));

-- Trigger to keep updated_at fresh
CREATE OR REPLACE FUNCTION touch_user_api_keys_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_api_keys_updated_at ON user_api_keys;
CREATE TRIGGER user_api_keys_updated_at
  BEFORE UPDATE ON user_api_keys
  FOR EACH ROW EXECUTE FUNCTION touch_user_api_keys_updated_at();

-- RLS: each user can only read/write their own keys
ALTER TABLE user_api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own keys"
  ON user_api_keys FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own keys"
  ON user_api_keys FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own keys"
  ON user_api_keys FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own keys"
  ON user_api_keys FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Every read is "the keys belonging to this user", so index that.
CREATE INDEX IF NOT EXISTS user_api_keys_user_id_idx ON user_api_keys(user_id);
