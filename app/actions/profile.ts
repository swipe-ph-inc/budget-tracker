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
    return { success: false, error: error.message }
  }

  return { success: true }
}
