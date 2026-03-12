"use server"

import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  // Clear the Remember Me preference cookie on sign-out.
  const cookieStore = await cookies()
  cookieStore.delete('clairo-persistent')
  redirect("/login")
}
