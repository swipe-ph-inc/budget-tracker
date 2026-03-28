import type { Metadata } from "next"
import { AppSidebar } from "@/components/app-sidebar"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { getActiveSubscription } from "@/app/actions/billing"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login?next=/dashboard")
  }

  const activeSubscription = await getActiveSubscription()

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar hasActiveSubscription={activeSubscription !== null} />
      <div className="flex flex-1 flex-col min-h-0 min-w-0 overflow-hidden lg:ml-[220px]">
        <DashboardHeader />
        {children}
      </div>
    </div>
  )
}

