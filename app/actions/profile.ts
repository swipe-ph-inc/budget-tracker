"use server"

import { createClient } from "@/lib/supabase/server"
import type { Database } from "@/lib/supabase/database.types"

type UserProfileRow = Database["public"]["Tables"]["user_profile"]["Row"]
type UserProfileUpdate = Database["public"]["Tables"]["user_profile"]["Insert"]

export type ProfileData = {
  email: string | null
  profile: UserProfileRow | null
}

export async function getProfile(): Promise<ProfileData> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { email: null, profile: null }
  }

  const { data: profile } = await supabase
    .from("user_profile")
    .select("*")
    .eq("id", user.id)
    .maybeSingle()

  return {
    email: user.email ?? null,
    profile: profile as UserProfileRow | null,
  }
}

export type AIProvider = "openai" | "anthropic" | "gemini" | "openrouter"

export type AISettings = {
  ai_provider: AIProvider
  openai_api_key: string | null
  anthropic_api_key: string | null
  gemini_api_key: string | null
  openrouter_api_key: string | null
  openrouter_model: string | null
  ai_system_prompt: string | null
}

export async function getAISettings(): Promise<AISettings> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      ai_provider: "openai",
      openai_api_key: null,
      anthropic_api_key: null,
      gemini_api_key: null,
      openrouter_api_key: null,
      openrouter_model: null,
      ai_system_prompt: null,
    }
  }

  const { data } = await supabase
    .from("user_profile")
    .select("ai_provider, openai_api_key, anthropic_api_key, gemini_api_key, openrouter_api_key, openrouter_model, ai_system_prompt")
    .eq("id", user.id)
    .maybeSingle()

  const row = data as {
    ai_provider?: string | null
    openai_api_key?: string | null
    anthropic_api_key?: string | null
    gemini_api_key?: string | null
    openrouter_api_key?: string | null
    openrouter_model?: string | null
    ai_system_prompt?: string | null
  } | null

  return {
    ai_provider: (row?.ai_provider as AIProvider | null) ?? "openai",
    openai_api_key: row?.openai_api_key ?? null,
    anthropic_api_key: row?.anthropic_api_key ?? null,
    gemini_api_key: row?.gemini_api_key ?? null,
    openrouter_api_key: row?.openrouter_api_key ?? null,
    openrouter_model: row?.openrouter_model ?? null,
    ai_system_prompt: row?.ai_system_prompt ?? null,
  }
}

export type UpdateAISettingsResult =
  | { success: true }
  | { success: false; error: string }

export async function updateAISettings(values: {
  ai_provider?: AIProvider
  openai_api_key?: string | null
  anthropic_api_key?: string | null
  gemini_api_key?: string | null
  openrouter_api_key?: string | null
  openrouter_model?: string | null
  ai_system_prompt?: string | null
}): Promise<UpdateAISettingsResult> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: "You must be signed in to update AI settings." }
  }

  const payload: Record<string, unknown> = { id: user.id }
  if (values.ai_provider !== undefined) payload.ai_provider = values.ai_provider
  if (values.openai_api_key !== undefined) payload.openai_api_key = values.openai_api_key ?? null
  if (values.anthropic_api_key !== undefined) payload.anthropic_api_key = values.anthropic_api_key ?? null
  if (values.gemini_api_key !== undefined) payload.gemini_api_key = values.gemini_api_key ?? null
  if (values.openrouter_api_key !== undefined) payload.openrouter_api_key = values.openrouter_api_key ?? null
  if (values.openrouter_model !== undefined) payload.openrouter_model = values.openrouter_model ?? null
  if (values.ai_system_prompt !== undefined) payload.ai_system_prompt = values.ai_system_prompt ?? null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await supabase
    .from("user_profile")
    .upsert(payload as any, { onConflict: "id" })

  if (error) {
    console.error('[profile] updateAISettings failed', error)
    return { success: false, error: 'Something went wrong. Please try again.' }
  }

  return { success: true }
}

export type UpdateProfileResult =
  | { success: true }
  | { success: false; error: string }

export async function updateProfile(values: {
  first_name?: string | null
  last_name?: string | null
  middle_name?: string | null
  phone_number?: string | null
  currency?: string | null
  avatar_url?: string | null
}): Promise<UpdateProfileResult> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: "You must be signed in to update your profile." }
  }

  const payload: UserProfileUpdate = {
    id: user.id,
    first_name: values.first_name ?? null,
    last_name: values.last_name ?? null,
    middle_name: values.middle_name ?? null,
    phone_number: values.phone_number ?? null,
    currency: values.currency ?? null,
    avatar_url: values.avatar_url ?? null,
  }

  const { error } = await supabase.from("user_profile").upsert(payload, {
    onConflict: "id",
  })

  if (error) {
    console.error('[profile] updateProfile failed', error)
    return { success: false, error: 'Something went wrong. Please try again.' }
  }

  return { success: true }
}
