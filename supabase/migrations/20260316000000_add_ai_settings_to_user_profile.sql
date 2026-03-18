-- Add AI Budget Assistant settings to user_profile
-- openai_api_key: user's personal OpenAI API key (used instead of server env var)
-- ai_system_prompt: custom system prompt prepended to every AI chat session

ALTER TABLE public.user_profile
  ADD COLUMN IF NOT EXISTS openai_api_key TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS ai_system_prompt TEXT DEFAULT NULL;
