import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import OpenAI from "openai"

export const maxDuration = 20

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export type BudgetCheckRequest = {
  amount: number
  currency: string
  merchant: string
  category: string
  followUp?: string          // optional — if set, runs one follow-up question
  context?: string           // passed back from client for follow-up continuity
}

export type BudgetCheckResponse = {
  status: "healthy" | "warning" | "critical"
  message: string
  suggestions: [string, string, string]
  context: string            // serialized context — client sends back for follow-up
}

export type FollowUpResponse = {
  message: string
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Auth check
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: BudgetCheckRequest
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const { amount, currency, merchant, category, followUp, context: clientContext } = body

  // --- Follow-up branch ---
  if (followUp && clientContext) {
    try {
      const followUpResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        max_tokens: 120,
        messages: [
          {
            role: "system",
            content:
              "You are a budget assistant. Answer in ONE sentence max. Be direct and helpful. No JSON needed.",
          },
          { role: "user", content: clientContext },
          {
            role: "assistant",
            content: "(previous budget check response)",
          },
          { role: "user", content: followUp },
        ],
      })

      return NextResponse.json({
        message: followUpResponse.choices[0]?.message?.content?.trim() ?? "I couldn't process that question.",
      } satisfies FollowUpResponse)
    } catch (err) {
      console.error("[budget-check] follow-up error", err instanceof Error ? err.message : err)
      return NextResponse.json(
        { error: "Follow-up failed. Please proceed with your decision." },
        { status: 500 }
      )
    }
  }

  // --- Initial budget check branch ---
  // Fetch financial context in parallel
  const now = new Date()
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  const monthEnd = nextMonth.toISOString().split("T")[0]
  const daysLeft = Math.ceil((nextMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  const [budgetsResult, accountsResult, spendingResult] = await Promise.all([
    // Active budgets for current month
    supabase
      .from("budget")
      .select("name, amount, currency, period_type, merchant_category(name)")
      .eq("user_id", user.id),

    // Account balances
    supabase
      .from("account")
      .select("name, balance, currency")
      .eq("user_id", user.id)
      .eq("is_active", true),

    // Total spending this month by merchant category
    supabase
      .from("payment")
      .select("amount, currency, merchant:merchant_id(name, merchant_category:category_id(name))")
      .eq("user_id", user.id)
      .gte("created_at", monthStart)
      .lt("created_at", monthEnd)
      .in("status", ["completed", "pending", "processing"]),
  ])

  // Build context string (kept short for token efficiency)
  const budgets = budgetsResult.data ?? []
  const accounts = accountsResult.data ?? []
  const payments = spendingResult.data ?? []

  // Aggregate spending by category
  const spendingByCategory: Record<string, number> = {}
  for (const p of payments) {
    const catName =
      (p.merchant as { merchant_category?: { name?: string } } | null)
        ?.merchant_category?.name ?? "Other"
    spendingByCategory[catName] = (spendingByCategory[catName] ?? 0) + Number(p.amount)
  }

  const totalBalance = accounts.reduce((sum, a) => sum + Number(a.balance ?? 0), 0)
  const primaryCurrency = accounts[0]?.currency ?? currency

  const budgetLines = budgets
    .map((b) => {
      const catName =
        (b.merchant_category as { name?: string } | null)?.name ?? "Overall"
      const spent = spendingByCategory[catName] ?? 0
      const remaining = Number(b.amount) - spent
      const pct = Math.round((spent / Number(b.amount)) * 100)
      return `${catName} budget: ${b.amount} ${b.currency} (spent: ${spent.toFixed(0)}, remaining: ${remaining.toFixed(0)}, ${pct}% used)`
    })
    .join("; ")

  const spendingLines = Object.entries(spendingByCategory)
    .map(([cat, amt]) => `${cat}: ${amt.toFixed(0)}`)
    .join(", ")

  const contextString = [
    `Payment: ${amount} ${currency} at "${merchant}" (category: ${category})`,
    `Total account balance: ${totalBalance.toFixed(0)} ${primaryCurrency}`,
    `Days left in month: ${daysLeft}`,
    budgetLines ? `Budgets this month: ${budgetLines}` : "No budgets configured",
    spendingLines ? `Spending this month by category: ${spendingLines}` : "No spending this month",
  ].join(". ")

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 200,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are a budget checker. Respond with ONLY valid JSON, no extra text.
Status rules: "healthy" = budget OK, "warning" = close to limit or notable concern, "critical" = over budget or critically low balance.
Message: 1 sentence max, start with ✅/⚠️/🚨 matching status. Be specific with numbers.
Suggestions: 3 short follow-up questions the user might want to ask (max 8 words each).`,
        },
        {
          role: "user",
          content: `${contextString}

Return JSON: {"status":"healthy"|"warning"|"critical","message":"string","suggestions":["string","string","string"]}`,
        },
      ],
    })

    const raw = response.choices[0]?.message?.content ?? ""
    let parsed: BudgetCheckResponse
    try {
      parsed = JSON.parse(raw)
    } catch {
      return NextResponse.json(
        { error: "AI response could not be parsed." },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ...parsed,
      context: contextString,
    } satisfies BudgetCheckResponse)
  } catch (err) {
    console.error("[budget-check] OpenAI error", err instanceof Error ? err.message : err)
    return NextResponse.json(
      { error: "Budget check failed. You can still proceed with your payment." },
      { status: 500 }
    )
  }
}
