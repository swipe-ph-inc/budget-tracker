-- Add multi-LLM support to user_profile
-- Each provider has its own API key column so the user can store all keys simultaneously
-- ai_provider tracks which one is active for the AI Budget Assistant

ALTER TABLE public.user_profile
  ADD COLUMN IF NOT EXISTS anthropic_api_key TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS gemini_api_key     TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS ai_provider        TEXT NOT NULL DEFAULT 'openai'
    CONSTRAINT user_profile_ai_provider_check
      CHECK (ai_provider IN ('openai', 'anthropic', 'gemini'));
