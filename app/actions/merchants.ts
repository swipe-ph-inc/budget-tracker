"use server"

import { createClient } from "@/lib/supabase/server"

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
  const { data, error } = await supabase
    .from("merchant")
    .select("id, name")
    .order("name", { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return data ?? []
}

export async function getMerchantCategories(): Promise<MerchantCategoryOption[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("merchant_category")
    .select("id, name")
    .order("name", { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return data ?? []
}

export async function getMerchantsWithCategories(): Promise<MerchantWithCategory[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("merchant")
    .select("id, name, category_id, created_at, merchant_category(name)")
    .order("name", { ascending: true })

  if (error) {
    throw new Error(error.message)
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
  const trimmedName = name?.trim()
  if (!trimmedName) {
    return { success: false, error: "Merchant name is required." }
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
    return { success: false, error: error.message }
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
  const trimmedName = name?.trim()
  if (!trimmedName) {
    return { success: false, error: "Merchant name is required." }
  }
  if (!categoryId?.trim()) {
    return { success: false, error: "Merchant category is required." }
  }

  const { error } = await supabase
    .from("merchant")
    .update({ name: trimmedName, category_id: categoryId.trim() })
    .eq("id", id)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

export type DeleteMerchantResult =
  | { success: true }
  | { success: false; error: string }

export async function deleteMerchant(id: string): Promise<DeleteMerchantResult> {
  const supabase = await createClient()

  const { error } = await supabase.from("merchant").delete().eq("id", id)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}