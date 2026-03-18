-- Add OpenRouter as a supported AI provider
-- Requires dropping + recreating the CHECK constraint (Postgres doesn't support ALTER CONSTRAINT)

ALTER TABLE public.user_profile
  DROP CONSTRAINT IF EXISTS user_profile_ai_provider_check;

ALTER TABLE public.user_profile
  ADD CONSTRAINT user_profile_ai_provider_check
    CHECK (ai_provider IN ('openai', 'anthropic', 'gemini', 'openrouter'));

ALTER TABLE public.user_profile
  ADD COLUMN IF NOT EXISTS openrouter_api_key TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS openrouter_model   TEXT DEFAULT NULL;

COMMENT ON COLUMN public.user_profile.openrouter_api_key IS
  'API key for OpenRouter (openrouter.ai). Used when ai_provider = openrouter.';

COMMENT ON COLUMN public.user_profile.openrouter_model IS
  'OpenRouter model ID, e.g. openai/gpt-4o-mini or meta-llama/llama-3.1-8b-instruct:free. Defaults to openai/gpt-4o-mini if blank.';
