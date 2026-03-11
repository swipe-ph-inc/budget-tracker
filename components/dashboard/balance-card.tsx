"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { Wifi } from "lucide-react"
import { getAccounts } from "@/app/actions/accounts"
import { getProfile } from "@/app/actions/profile"
import type { ProfileData } from "@/app/actions/profile"

function formatBalance(amount: number, currency: string): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency || "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

type AccountLike = { balance?: number | null; currency?: string | null }
type BalanceCardInitialData = { accounts: AccountLike[]; profile: ProfileData }

function deriveState(accounts: AccountLike[], profile: ProfileData) {
  const total = (accounts ?? []).reduce((sum, a) => sum + (a.balance ?? 0), 0)
  const primaryCurrency = accounts?.[0]?.currency ?? profile?.profile?.currency ?? "PHP"
  const displayName =
    profile?.profile?.first_name || profile?.profile?.last_name
      ? [profile.profile.first_name, profile.profile.last_name].filter(Boolean).join(" ") ?? null
      : null
  return { totalBalance: total, currency: primaryCurrency, accountCount: accounts?.length ?? 0, displayName }
}

export function BalanceCard({
  initialData,
}: {
  initialData?: BalanceCardInitialData
} = {}) {
  const [totalBalance, setTotalBalance] = useState(0)
  const [currency, setCurrency] = useState("PHP")
  const [accountCount, setAccountCount] = useState(0)
  const [displayName, setDisplayName] = useState<string | null>(null)
  const [loading, setLoading] = useState(!initialData)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [accounts, profile] = await Promise.all([getAccounts(), getProfile()])
      const state = deriveState(accounts ?? [], profile)
      setTotalBalance(state.totalBalance)
      setCurrency(state.currency)
      setAccountCount(state.accountCount)
      setDisplayName(state.displayName)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (initialData) {
      const state = deriveState(initialData.accounts, initialData.profile)
      setTotalBalance(state.totalBalance)
      setCurrency(state.currency)
      setAccountCount(state.accountCount)
      setDisplayName(state.displayName)
      setLoading(false)
      return
    }
    void loadData()
  }, [initialData, loadData])

  return (
    <Link href="/dashboard/account" className="block">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[hsl(145,50%,25%)] to-[hsl(145,60%,18%)] p-6 text-[hsl(0,0%,100%)] transition-opacity hover:opacity-95">
        {/* Card Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full border border-[hsl(0,0%,100%)]" />
          <div className="absolute -right-4 -top-4 h-32 w-32 rounded-full border border-[hsl(0,0%,100%)]" />
        </div>

        <div className="relative">
          <div className="flex items-start justify-between">
            <svg viewBox="0 0 32 32" className="h-8 w-8" fill="currentColor">
              <circle cx="10" cy="10" r="4" />
              <circle cx="22" cy="10" r="4" />
              <circle cx="10" cy="22" r="4" />
              <circle cx="22" cy="22" r="4" />
            </svg>
            <Wifi className="h-5 w-5 rotate-90 opacity-80" />
          </div>

          <div className="mt-6">
            <p className="text-lg font-semibold">{loading ? "…" : displayName ?? "Account"}</p>
          </div>

          <div className="mt-4 flex items-end justify-between">
            <div>
              <p className="text-xs opacity-70">Total balance</p>
              <p className="text-2xl font-bold">
                {loading ? "—" : formatBalance(totalBalance, currency)}
              </p>
            </div>
            <div className="text-right text-xs">
              <span className="opacity-70">Accounts</span>
              <p className="font-medium">{loading ? "—" : accountCount}</p>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
