"use server"

import { createClient } from "@/lib/supabase/server"

const GENERIC_ERROR_MESSAGE = 'Something went wrong. Please try again.'

export type MerchantOption = {
  id: string
  name: string
}

export type MerchantCategoryOption = {
  id: string
  name: string
}

export type MerchantWithCategory = {
  id: string
  name: string
  category_id: string
  category_name: string
  created_at: string
}

export async function getMerchants(): Promise<MerchantOption[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from("merchant")
    .select("id, name")
    .order("name", { ascending: true })

  if (error) {
    console.error('[merchants] getMerchants failed', error)
    return []
  }

  return data ?? []
}

export type RegisterMerchantCategoryResult =
  | { success: true; data: { id: string } }
  | { success: false; error: string }

export async function registerMerchantCategory(
  name: string
): Promise<RegisterMerchantCategoryResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "You must be signed in." }

  const trimmedName = name?.trim()
  if (!trimmedName) {
    return { success: false, error: "Category name is required." }
  }
  if (trimmedName.length > 100) {
    return { success: false, error: "Category name must be 100 characters or less." }
  }

  const { data, error } = await supabase
    .from("merchant_category")
    .insert({ name: trimmedName })
    .select("id")
    .single()

  if (error) {
    if (error.code === "23505") {
      return { success: false, error: "A category with this name already exists." }
    }
    console.error('[merchants] registerMerchantCategory failed', error)
    return { success: false, error: 'Something went wrong. Please try again.' }
  }

  return { success: true, data: { id: data.id } }
}

export type UpdateMerchantCategoryResult =
  | { success: true }
  | { success: false; error: string }

export async function updateMerchantCategory(
  id: string,
  name: string
): Promise<UpdateMerchantCategoryResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "You must be signed in." }

  const trimmedName = name?.trim()
  if (!trimmedName) {
    return { success: false, error: "Category name is required." }
  }
  if (trimmedName.length > 100) {
    return { success: false, error: "Category name must be 100 characters or less." }
  }

  const { error } = await supabase
    .from("merchant_category")
    .update({ name: trimmedName })
    .eq("id", id)

  if (error) {
    if (error.code === "23505") {
      return { success: false, error: "A category with this name already exists." }
    }
    console.error('[merchants] updateMerchantCategory failed', error)
    return { success: false, error: 'Something went wrong. Please try again.' }
  }

  return { success: true }
}

export type DeleteMerchantCategoryResult =
  | { success: true }
  | { success: false; error: string }

export async function deleteMerchantCategory(
  id: string
): Promise<DeleteMerchantCategoryResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "You must be signed in." }

  const { error } = await supabase.from("merchant_category").delete().eq("id", id)

  if (error) {
    if (error.code === "23503") {
      return {
        success: false,
        error: "Cannot delete: merchants are using this category. Move or delete them first.",
      }
    }
    console.error('[merchants] deleteMerchantCategory failed', error)
    return { success: false, error: 'Something went wrong. Please try again.' }
  }

  return { success: true }
}

export async function getMerchantCategories(): Promise<MerchantCategoryOption[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from("merchant_category")
    .select("id, name")
    .order("name", { ascending: true })

  if (error) {
    console.error('[merchants] getMerchantCategories failed', error)
    return []
  }

  return data ?? []
}

export async function getMerchantsWithCategories(): Promise<MerchantWithCategory[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from("merchant")
    .select("id, name, category_id, created_at, merchant_category(name)")
    .order("name", { ascending: true })

  if (error) {
    console.error('[merchants] getMerchantsWithCategories failed', error)
    return []
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    category_id: row.category_id,
    category_name: (row.merchant_category as { name: string } | null)?.name ?? "—",
    created_at: row.created_at,
  }))
}

export type RegisterMerchantResult =
  | { success: true; data: { id: string } }
  | { success: false; error: string }

export async function registerMerchant(
  name: string,
  categoryId: string
): Promise<RegisterMerchantResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "You must be signed in." }

  const trimmedName = name?.trim()
  if (!trimmedName) {
    return { success: false, error: "Merchant name is required." }
  }
  if (trimmedName.length > 100) {
    return { success: false, error: "Merchant name must be 100 characters or less." }
  }
  if (!categoryId?.trim()) {
    return { success: false, error: "Merchant category is required." }
  }

  const { data, error } = await supabase
    .from("merchant")
    .insert({ name: trimmedName, category_id: categoryId.trim() })
    .select("id")
    .single()

  if (error) {
    console.error('[merchants] registerMerchant failed', error)
    return { success: false, error: 'Something went wrong. Please try again.' }
  }

  return { success: true, data: { id: data.id } }
}

export type UpdateMerchantResult =
  | { success: true }
  | { success: false; error: string }

export async function updateMerchant(
  id: string,
  name: string,
  categoryId: string
): Promise<UpdateMerchantResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "You must be signed in." }

  const trimmedName = name?.trim()
  if (!trimmedName) {
    return { success: false, error: "Merchant name is required." }
  }
  if (trimmedName.length > 100) {
    return { success: false, error: "Merchant name must be 100 characters or less." }
  }
  if (!categoryId?.trim()) {
    return { success: false, error: "Merchant category is required." }
  }

  const { error } = await supabase
    .from("merchant")
    .update({ name: trimmedName, category_id: categoryId.trim() })
    .eq("id", id)

  if (error) {
    console.error('[merchants] updateMerchant failed', error)
    return { success: false, error: 'Something went wrong. Please try again.' }
  }

  return { success: true }
}

export type DeleteMerchantResult =
  | { success: true }
  | { success: false; error: string }

export async function deleteMerchant(id: string): Promise<DeleteMerchantResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "You must be signed in." }

  const { error } = await supabase.from("merchant").delete().eq("id", id)

  if (error) {
    console.error('[merchants] deleteMerchant failed', error)
    return { success: false, error: 'Something went wrong. Please try again.' }
  }

  return { success: true }
}