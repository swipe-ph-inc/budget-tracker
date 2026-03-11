"use server"

import { createClient } from "@/lib/supabase/server"
import { getIncome } from "@/app/actions/transaction"
import { getPayments } from "@/app/actions/transaction"
import { getTransfers } from "@/app/actions/transaction"
import { getSavingPlans } from "@/app/actions/saving-plans"
import { getAccounts } from "@/app/actions/accounts"
import { getProfile } from "@/app/actions/profile"
import type { ProfileData } from "@/app/actions/profile"
import type { SavingPlanListItem } from "@/app/actions/saving-plans"

export type DashboardStats = {
  totalIncome: number
  totalExpense: number
  totalSavings: number
  currency: string
}

function getYearRange(year: number): { from: string; to: string } {
  const from = new Date(year, 0, 1).toISOString()
  const to = new Date(year, 11, 31, 23, 59, 59, 999).toISOString()
  return { from, to }
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const now = new Date()
  const year = now.getFullYear()
  const { from, to } = getYearRange(year)

  const [incomeList, paymentsList, plans] = await Promise.all([
    getIncome({ dateFrom: from, dateTo: to, limit: 1_000 }),
    getPayments({ dateFrom: from, dateTo: to, limit: 1_000 }),
    getSavingPlans(),
  ])

  const totalIncome = (incomeList ?? []).reduce((s, i) => s + i.amount, 0)
  const totalExpense = (paymentsList ?? []).reduce((s, p) => s + p.amount, 0)
  const totalSavings = (plans ?? []).reduce((s, p) => s + p.current_amount, 0)
  const currency = incomeList?.[0]?.currency ?? paymentsList?.[0]?.currency ?? plans?.[0]?.currency ?? "PHP"

  return { totalIncome, totalExpense, totalSavings, currency }
}

export type DashboardCashflowMonth = {
  month: string
  income: number
  expense: number
}

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

export async function getDashboardCashflow(
  period: "this_year" | "last_year" = "this_year"
): Promise<DashboardCashflowMonth[]> {
  const year = period === "this_year" ? new Date().getFullYear() : new Date().getFullYear() - 1
  const { from, to } = getYearRange(year)

  const [incomeList, paymentsList] = await Promise.all([
    getIncome({ dateFrom: from, dateTo: to, limit: 1_000 }),
    getPayments({ dateFrom: from, dateTo: to, limit: 1_000 }),
  ])

  const byMonth: Record<number, { income: number; expense: number }> = {}
  for (let m = 0; m < 12; m++) {
    byMonth[m] = { income: 0, expense: 0 }
  }

  for (const i of incomeList ?? []) {
    const date = i.receivedAt ?? i.createdAt
    if (date) {
      const month = new Date(date).getMonth()
      if (month in byMonth) byMonth[month].income += i.amount
    }
  }
  for (const p of paymentsList ?? []) {
    const date = p.paidAt ?? p.createdAt
    if (date) {
      const month = new Date(date).getMonth()
      if (month in byMonth) byMonth[month].expense += p.amount
    }
  }

  return MONTH_LABELS.map((label, index) => ({
    month: label,
    income: byMonth[index].income,
    expense: -byMonth[index].expense,
  }))
}

export type RecentTransactionItem = {
  id: string
  type: "income" | "payment" | "transfer"
  name: string
  category: string
  date: string
  amount: number
  currency: string
  note: string | null
  status: string
}

export async function getRecentTransactionsForDashboard(
  limit = 10
): Promise<RecentTransactionItem[]> {
  const [incomeList, paymentsList, transfersList] = await Promise.all([
    getIncome({ limit: 30 }),
    getPayments({ limit: 30 }),
    getTransfers({ dateFrom: undefined, dateTo: undefined }),
  ])

  const items: RecentTransactionItem[] = []

  for (const i of incomeList ?? []) {
    const date = i.receivedAt ?? i.createdAt ?? ""
    items.push({
      id: `income-${i.id}`,
      type: "income",
      name: i.source ?? "Income",
      category: "Income",
      date,
      amount: i.amount,
      currency: i.currency,
      note: i.note,
      status: "completed",
    })
  }
  for (const p of paymentsList ?? []) {
    const date = p.paidAt ?? p.createdAt ?? ""
    items.push({
      id: `payment-${p.id}`,
      type: "payment",
      name: p.merchantName ?? "Payment",
      category: "Payment",
      date,
      amount: -p.amount,
      currency: p.currency,
      note: p.note,
      status: p.status,
    })
  }
  for (const t of (transfersList ?? []).slice(0, 30)) {
    const date = t.completedAt ?? t.createdAt ?? ""
    items.push({
      id: `transfer-${t.id}`,
      type: "transfer",
      name: t.toName ?? "Transfer",
      category: "Transfer",
      date,
      amount: -t.amount,
      currency: t.currency,
      note: t.note,
      status: t.status,
    })
  }

  items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  return items.slice(0, limit)
}

export async function getDashboardTotalBalance(): Promise<{ total: number; currency: string }> {
  const accounts = await getAccounts()
  const total = (accounts ?? []).reduce((s, a) => s + (a.balance ?? 0), 0)
  const currency = accounts?.[0]?.currency ?? "PHP"
  return { total, currency }
}

function getMonthRange(period: "this_month" | "last_month"): { from: string; to: string } {
  const now = new Date()
  const year = period === "this_month" ? now.getFullYear() : now.getFullYear() - (now.getMonth() === 0 ? 1 : 0)
  const month = period === "this_month" ? now.getMonth() : now.getMonth() === 0 ? 11 : now.getMonth() - 1
  const from = new Date(year, month, 1).toISOString()
  const to = new Date(year, month + 1, 0, 23, 59, 59, 999).toISOString()
  return { from, to }
}

const EXPENSE_CHART_COLORS = [
  "hsl(145,50%,25%)",
  "hsl(145,40%,50%)",
  "hsl(145,30%,70%)",
  "hsl(145,20%,80%)",
  "hsl(120,10%,89%)",
  "hsl(145,35%,60%)",
  "hsl(145,25%,75%)",
]

export type StatisticPanelCategory = {
  name: string
  value: number
  percent: string
  color: string
}

export type StatisticPanelData = {
  incomeTotal: number
  expenseTotal: number
  expenseByCategory: StatisticPanelCategory[]
  currency: string
}

export async function getStatisticPanelData(
  period: "this_month" | "last_month" = "this_month"
): Promise<StatisticPanelData> {
  const { from, to } = getMonthRange(period)

  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    const incomeList = await getIncome({ dateFrom: from, dateTo: to, limit: 1_000 })
    const incomeTotal = (incomeList ?? []).reduce((s, i) => s + i.amount, 0)
    const currency = incomeList?.[0]?.currency ?? "PHP"
    return { incomeTotal, expenseTotal: 0, expenseByCategory: [], currency }
  }

  const [incomeList, { data: paymentRows }] = await Promise.all([
    getIncome({ dateFrom: from, dateTo: to, limit: 1_000 }),
    supabase
      .from("payment")
      .select("amount, merchant:merchant_id(merchant_category(name))")
      .eq("user_id", user.id)
      .gte("created_at", from)
      .lte("created_at", to),
  ])

  const incomeTotal = (incomeList ?? []).reduce((s, i) => s + i.amount, 0)
  const currency = incomeList?.[0]?.currency ?? "PHP"

  const byCategory: Record<string, number> = {}
  let expenseTotal = 0
  for (const row of paymentRows ?? []) {
    const amount = Number(row.amount)
    expenseTotal += amount
    const merchant = row.merchant as { merchant_category?: { name: string } | null } | null
    const categoryName = merchant?.merchant_category?.name ?? "Other"
    byCategory[categoryName] = (byCategory[categoryName] ?? 0) + amount
  }

  const sorted = Object.entries(byCategory).sort((a, b) => b[1] - a[1])
  const expenseByCategory: StatisticPanelCategory[] = sorted.map(([name], index) => {
    const value = byCategory[name] ?? 0
    const percent = expenseTotal > 0 ? ((value / expenseTotal) * 100).toFixed(0) : "0"
    return {
      name,
      value,
      percent: `${percent}%`,
      color: EXPENSE_CHART_COLORS[index % EXPENSE_CHART_COLORS.length],
    }
  })

  return { incomeTotal, expenseTotal, expenseByCategory, currency }
}

export type RecentActivityItem = {
  id: string
  label: string
  sublabel: string
  time: string
  type: "income" | "payment" | "transfer"
}

/** Single-call payload for the dashboard page so all sections load together. */
export type DashboardPageData = {
  accounts: Awaited<ReturnType<typeof getAccounts>>
  profile: ProfileData
  stats: DashboardStats
  savingPlans: SavingPlanListItem[]
  cashflow: DashboardCashflowMonth[]
  totalBalance: { total: number; currency: string }
  recentTransactions: RecentTransactionItem[]
  statisticPanel: StatisticPanelData
  recentActivity: RecentActivityItem[]
}

export async function getDashboardPageData(): Promise<DashboardPageData> {
  const [
    accounts,
    profile,
    stats,
    savingPlans,
    cashflow,
    totalBalance,
    recentTransactions,
    statisticPanel,
    recentActivity,
  ] = await Promise.all([
    getAccounts(),
    getProfile(),
    getDashboardStats(),
    getSavingPlans(),
    getDashboardCashflow("this_year"),
    getDashboardTotalBalance(),
    getRecentTransactionsForDashboard(10),
    getStatisticPanelData("this_month"),
    getRecentActivityForDashboard(15),
  ])
  return {
    accounts: accounts ?? [],
    profile,
    stats,
    savingPlans: savingPlans ?? [],
    cashflow,
    totalBalance,
    recentTransactions,
    statisticPanel,
    recentActivity,
  }
}

export async function getRecentActivityForDashboard(limit = 15): Promise<RecentActivityItem[]> {
  const items = await getRecentTransactionsForDashboard(limit)
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const yesterdayStart = todayStart - 24 * 60 * 60 * 1000

  return items.map((tx) => {
    const d = new Date(tx.date)
    const ts = d.getTime()
    const timeStr = d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
    let dayLabel = d.toLocaleDateString(undefined, { dateStyle: "medium" })
    if (ts >= todayStart) dayLabel = "Today"
    else if (ts >= yesterdayStart) dayLabel = "Yesterday"

    let label: string
    if (tx.type === "income") {
      label = `Income: ${tx.name}`
      const amt = new Intl.NumberFormat(undefined, { style: "currency", currency: tx.currency, maximumFractionDigits: 0 }).format(tx.amount)
      label += ` (+${amt})`
    } else if (tx.type === "payment") {
      label = `Payment to ${tx.name}`
      const amt = new Intl.NumberFormat(undefined, { style: "currency", currency: tx.currency, maximumFractionDigits: 0 }).format(Math.abs(tx.amount))
      label += ` (${amt})`
    } else {
      label = `Transfer to ${tx.name}`
      const amt = new Intl.NumberFormat(undefined, { style: "currency", currency: tx.currency, maximumFractionDigits: 0 }).format(Math.abs(tx.amount))
      label += ` (${amt})`
    }

    return {
      id: tx.id,
      label,
      sublabel: dayLabel,
      time: timeStr,
      type: tx.type,
    }
  })
}
