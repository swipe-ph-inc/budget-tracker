"use server"

import { createClient } from "@/lib/supabase/server"

export type MerchantOption = {
  id: string
  name: string
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
