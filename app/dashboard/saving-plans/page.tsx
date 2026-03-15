"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { Crown, Landmark, MoreHorizontal, Plus } from "lucide-react"
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  getSavingPlans,
  getContributions,
  createSavingPlan,
  addContribution,
  type SavingPlanListItem,
  type ContributionListItem,
} from "@/app/actions/saving-plans"
import { getAccounts } from "@/app/actions/accounts"
import { toast } from "@/hooks/use-toast"
import { getActiveSubscription } from "@/app/actions/billing"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const CURRENCIES = [{ value: "PHP", label: "PHP" }, { value: "USD", label: "USD" }] as const

function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency || "PHP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

/** Format numeric input for display: allow digits and one decimal, add commas to integer part. */
function formatNumberInput(value: string): string {
  const stripped = value.replace(/[^\d.]/g, "")
  const parts = stripped.split(".")
  const intPart = (parts[0] ?? "").replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  const decPart = parts.length > 1 ? "." + (parts[1] ?? "").slice(0, 2) : ""
  return intPart + decPart
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { dateStyle: "medium" })
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "short",
    timeStyle: "short",
  })
}

function statusLabel(s: string): string {
  if (s === "completed") return "Completed"
  if (s === "behind_schedule") return "Behind Schedule"
  return "In Progress"
}

function StatusColor(status: string) {
  if (status === "completed") return "text-primary"
  if (status === "behind_schedule") return "text-destructive"
  return "text-muted-foreground"
}

export default function SavingPlansPage() {
  const [plans, setPlans] = useState<SavingPlanListItem[]>([])
  const [subscription, setSubscription] = useState<Awaited<ReturnType<typeof getActiveSubscription>> | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)
  const [contributions, setContributions] = useState<ContributionListItem[]>([])
  const [contribLoading, setContribLoading] = useState(false)
  const [addPlanOpen, setAddPlanOpen] = useState(false)
  const [addContribOpen, setAddContribOpen] = useState(false)
  const [newPlanName, setNewPlanName] = useState("")
  const [newPlanTarget, setNewPlanTarget] = useState("")
  const [newPlanDate, setNewPlanDate] = useState("")
  const [newPlanCurrency, setNewPlanCurrency] = useState("PHP")
  const [newPlanAccountId, setNewPlanAccountId] = useState<string>("")
  const [accounts, setAccounts] = useState<{ id: string; name: string }[]>([])
  const [contribAmount, setContribAmount] = useState("")
  const [contribType, setContribType] = useState<"contribution" | "withdrawal">("contribution")
  const [contribNote, setContribNote] = useState("")
  const [saving, setSaving] = useState(false)

  const loadPlans = useCallback(async () => {
    setLoading(true)
    try {
      const [data, sub] = await Promise.all([getSavingPlans(), getActiveSubscription()])
      setPlans(data ?? [])
      setSubscription(sub ?? null)
      if (selectedPlanId && !(data ?? []).some((p) => p.id === selectedPlanId)) {
        setSelectedPlanId(null)
      }
    } finally {
      setLoading(false)
    }
  }, [selectedPlanId])

  useEffect(() => {
    void loadPlans()
  }, [loadPlans])

  useEffect(() => {
    if (addPlanOpen) {
      getAccounts().then((list) => setAccounts(list.map((a) => ({ id: a.id, name: a.name ?? "Unnamed" }))))
    }
  }, [addPlanOpen])

  const loadContributions = useCallback(async () => {
    if (!selectedPlanId) {
      setContributions([])
      return
    }
    setContribLoading(true)
    try {
      const data = await getContributions(selectedPlanId)
      setContributions(data ?? [])
    } finally {
      setContribLoading(false)
    }
  }, [selectedPlanId])

  useEffect(() => {
    void loadContributions()
  }, [loadContributions])

  const selectedPlan = selectedPlanId ? plans.find((p) => p.id === selectedPlanId) : null

  const totalSavings = plans.reduce((s, p) => s + p.current_amount, 0)
  const totalTarget = plans.reduce((s, p) => s + p.target_amount, 0)
  const primaryCurrency = plans[0]?.currency ?? "PHP"

  const isPro = subscription !== null
  const canAddPlan = isPro || plans.length < 1

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault()
    const target = parseFloat(newPlanTarget.replace(/,/g, ""))
    if (!newPlanName.trim()) {
      toast({ title: "Name required", variant: "destructive" })
      return
    }
    if (!Number.isFinite(target) || target <= 0) {
      toast({ title: "Enter a valid target amount", variant: "destructive" })
      return
    }
    setSaving(true)
    try {
      const result = await createSavingPlan({
        name: newPlanName.trim(),
        target_amount: target,
        target_date: newPlanDate || null,
        currency: newPlanCurrency,
        account_id: newPlanAccountId || null,
      })
      if (result.success) {
        toast({ title: "Plan created" })
        setAddPlanOpen(false)
        setNewPlanName("")
        setNewPlanTarget("")
        setNewPlanDate("")
        setNewPlanAccountId("")
        await loadPlans()
      } else {
        toast({ title: result.error, variant: "destructive" })
      }
    } finally {
      setSaving(false)
    }
  }

  const handleAddContribution = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPlanId) return
    const amount = parseFloat(contribAmount.replace(/,/g, ""))
    if (!Number.isFinite(amount) || amount <= 0) {
      toast({ title: "Enter a valid amount", variant: "destructive" })
      return
    }
    setSaving(true)
    try {
      const result = await addContribution({
        saving_plan_id: selectedPlanId,
        amount,
        contribution_type: contribType,
        note: contribNote.trim() || null,
      })
      if (result.success) {
        toast({ title: contribType === "contribution" ? "Contribution added" : "Withdrawal recorded" })
        setAddContribOpen(false)
        setContribAmount("")
        setContribNote("")
        await loadContributions()
        await loadPlans()
      } else {
        toast({ title: result.error, variant: "destructive" })
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <main className="flex-1 overflow-y-auto p-4 lg:p-6">
        <div className="mx-auto max-w-screen-2xl">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/dashboard">Dashboard</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Saving Plans</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

        {/* Stat Cards */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { label: "Total Savings", value: formatAmount(totalSavings, primaryCurrency) },
            { label: "Total Target", value: formatAmount(totalTarget, primaryCurrency) },
            { label: "Total Plans", value: String(plans.length) },
          ].map((stat) => (
            <div key={stat.label} className="flex items-center justify-between rounded-xl border border-border bg-card p-4 lg:p-5">
              <div>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="mt-1 text-xl font-bold text-card-foreground lg:text-2xl">{stat.value}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="3" /><path d="M8 12h8M8 8h8M8 16h4" /></svg>
              </div>
            </div>
          ))}
        </div>

        {/* Main content: 3-column grid */}
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-12">
          {/* Left column - Saving Plans list */}
          <div className="lg:col-span-4">
            <div className="rounded-xl border border-border bg-card p-4 lg:p-5">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-base font-semibold text-card-foreground">Saving Plans</h2>
                <div className="flex items-center gap-2">
                  {!canAddPlan && (
                    <span className="hidden items-center gap-1 text-xs text-muted-foreground sm:flex">
                      <Crown className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                      Free plan: 1 plan max.
                    </span>
                  )}
                  <button className="text-muted-foreground hover:text-foreground">
                    <MoreHorizontal className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <div className="mt-4 flex flex-col gap-3">
                {loading ? (
                  <p className="text-sm text-muted-foreground">Loading…</p>
                ) : plans.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No plans yet. Add one below.</p>
                ) : (
                  plans.map((plan) => {
                    const percent = plan.target_amount > 0 ? Math.min(100, (plan.current_amount / plan.target_amount) * 100) : 0
                    const isSelected = selectedPlanId === plan.id
                    return (
                      <button
                        key={plan.id}
                        type="button"
                        onClick={() => setSelectedPlanId(plan.id)}
                        className={`w-full rounded-xl border border-border p-4 text-left transition-colors hover:bg-accent/50 ${isSelected ? "ring-2 ring-primary" : ""}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-foreground">
                              <Landmark className="h-4 w-4" />
                            </div>
                            <p className="text-sm font-semibold text-card-foreground">{plan.name}</p>
                          </div>
                          <p className="text-sm font-semibold text-card-foreground">{percent.toFixed(0)}%</p>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                          <span>{formatAmount(plan.current_amount, plan.currency)} / {formatAmount(plan.target_amount, plan.currency)}</span>
                          <span className={StatusColor(plan.status)}>{statusLabel(plan.status)}</span>
                        </div>
                        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-secondary">
                          <div className="flex h-full">
                            <div
                              className="h-full bg-primary transition-all"
                              style={{ width: `${Math.min(percent, 60)}%` }}
                            />
                            {percent > 60 && (
                              <div
                                className="h-full bg-chart-2 transition-all"
                                style={{ width: `${percent - 60}%` }}
                              />
                            )}
                            {percent <= 60 && percent > 0 && (
                              <div
                                className="h-full bg-chart-2/80 transition-all"
                                style={{ width: `${Math.max(0, percent * 0.4)}%` }}
                              />
                            )}
                          </div>
                        </div>
                      </button>
                    )
                  })
                )}
              </div>
              {canAddPlan ? (
                <Button
                  variant="outline"
                  className="mt-4 h-11 w-full"
                  onClick={() => setAddPlanOpen(true)}
                >
                  <Plus className="h-4 w-4" /> Add Plan
                </Button>
              ) : (
                <Link
                  href="/dashboard/subscription"
                  className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-amber-500 bg-amber-500/10 text-sm font-medium text-amber-600 hover:bg-amber-500/20 dark:text-amber-400"
                >
                  <Crown className="h-4 w-4" /> Upgrade to Pro for more plans
                </Link>
              )}
            </div>
          </div>

          {/* Middle column - Plan Detail */}
          <div className="lg:col-span-4">
            <div className="rounded-xl border border-border bg-card p-4 lg:p-5">
              {selectedPlan ? (
                <>
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                      <Landmark className="h-5 w-5" />
                    </div>
                    <h2 className="text-base font-semibold text-card-foreground">{selectedPlan.name}</h2>
                  </div>

                  <div className="mt-5">
                    <p className="text-center text-2xl font-bold text-card-foreground">
                      {formatAmount(selectedPlan.current_amount, selectedPlan.currency)}
                      <span className="text-base font-normal text-muted-foreground"> / {formatAmount(selectedPlan.target_amount, selectedPlan.currency)}</span>
                    </p>
                  </div>

                  {(() => {
                    const pct = selectedPlan.target_amount > 0 ? Math.min(100, (selectedPlan.current_amount / selectedPlan.target_amount) * 100) : 0
                    return (
                      <>
                        <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-secondary">
                          <div className="flex h-full">
                            <div className="h-full bg-primary" style={{ width: `${Math.min(pct, 60)}%` }} />
                            <div className="h-full bg-chart-2" style={{ width: `${Math.max(0, pct - 60)}%` }} />
                          </div>
                        </div>
                        <div className="mt-4 flex items-center justify-between text-sm">
                          <span className={StatusColor(selectedPlan.status)}>{statusLabel(selectedPlan.status)}</span>
                          <span className="font-semibold text-card-foreground">{pct.toFixed(0)}%</span>
                        </div>
                      </>
                    )
                  })()}

                  <div className="mt-5 border-t border-border pt-4 space-y-3">
                    {selectedPlan.target_date && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Target date</span>
                        <span className="font-medium text-card-foreground">{formatDate(selectedPlan.target_date)}</span>
                      </div>
                    )}
                    {selectedPlan.target_date && (() => {
                      const remaining = Math.ceil((new Date(selectedPlan.target_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                      return (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Remaining</span>
                          <span className="font-medium text-card-foreground">{remaining > 0 ? `${remaining} days` : "Past due"}</span>
                        </div>
                      )
                    })()}
                  </div>

                  <Button
                    className="mt-4 w-full"
                    onClick={() => setAddContribOpen(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" /> Add contribution / withdrawal
                  </Button>
                </>
              ) : (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  Select a plan from the list to view details and add contributions.
                </div>
              )}
            </div>
          </div>

          {/* Right column - Saving Tips */}
          <div className="flex flex-col gap-4 lg:col-span-4">
            <div className="rounded-xl border border-border bg-card p-4 lg:p-5">
              <h3 className="text-base font-semibold text-card-foreground">Saving Tips</h3>
              <ul className="mt-3 flex flex-col gap-2.5">
                {[
                  "Set a target date to stay on track.",
                  "Cut unnecessary subscriptions, save more.",
                  "Skip eating out twice a week.",
                  "Automate savings from paycheck.",
                ].map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-card-foreground">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Contributions Table (for selected plan) */}
        {selectedPlanId && (
          <div className="mt-6 rounded-xl border border-border bg-card p-4 lg:p-5">
            <h2 className="text-base font-semibold text-card-foreground">Contributions</h2>
            <div className="mt-4 overflow-x-auto">
              {contribLoading ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : contributions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No contributions yet. Add one from the plan detail panel.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-secondary/50">
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date & Time</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Amount</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contributions.map((c) => {
                      const isIncome = c.contribution_type === "contribution"
                      const currency = selectedPlan?.currency ?? "PHP"
                      return (
                        <tr key={c.id} className="border-b border-border last:border-0">
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${isIncome ? "bg-accent text-primary" : "bg-destructive/10 text-destructive"}`}>
                                {isIncome ? (
                                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M12 5v14M5 12l7-7 7 7" /></svg>
                                ) : (
                                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M12 19V5M5 12l7 7 7-7" /></svg>
                                )}
                              </div>
                              <span className="text-card-foreground capitalize">{c.contribution_type}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-muted-foreground">{formatDateTime(c.created_at)}</td>
                          <td className={`px-4 py-3.5 font-medium ${isIncome ? "text-primary" : "text-destructive"}`}>
                            {isIncome ? "+" : "-"}{formatAmount(c.amount, currency)}
                          </td>
                          <td className="px-4 py-3.5 text-muted-foreground">{c.note ?? "—"}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* Add Plan Dialog */}
        <Dialog open={addPlanOpen} onOpenChange={setAddPlanOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add saving plan</DialogTitle>
              <DialogDescription>Create a new saving plan with a target amount and optional target date.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreatePlan}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="plan-name">Name</Label>
                  <Input id="plan-name" value={newPlanName} onChange={(e) => setNewPlanName(e.target.value)} placeholder="e.g. Emergency Fund" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="plan-target">Target amount</Label>
                  <Input
                    id="plan-target"
                    type="text"
                    inputMode="decimal"
                    value={newPlanTarget}
                    onChange={(e) => setNewPlanTarget(formatNumberInput(e.target.value))}
                    placeholder="10,000"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="plan-date">Target date (optional)</Label>
                  <Input id="plan-date" type="date" value={newPlanDate} onChange={(e) => setNewPlanDate(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label>Account (optional)</Label>
                  <Select value={newPlanAccountId || "_none"} onValueChange={(v) => setNewPlanAccountId(v === "_none" ? "" : v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select account for this saving plan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none">None</SelectItem>
                      {accounts.map((a) => (
                        <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Currency</Label>
                  <Select value={newPlanCurrency} onValueChange={setNewPlanCurrency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setAddPlanOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={saving}>{saving ? "Creating…" : "Create"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Add Contribution / Withdrawal Dialog */}
        <Dialog open={addContribOpen} onOpenChange={setAddContribOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add contribution or withdrawal</DialogTitle>
              <DialogDescription>Record money added to or taken from this saving plan.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddContribution}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Type</Label>
                  <Select value={contribType} onValueChange={(v: "contribution" | "withdrawal") => setContribType(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="contribution">Contribution</SelectItem>
                      <SelectItem value="withdrawal">Withdrawal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="contrib-amount">Amount</Label>
                  <Input
                    id="contrib-amount"
                    type="text"
                    inputMode="decimal"
                    value={contribAmount}
                    onChange={(e) => setContribAmount(formatNumberInput(e.target.value))}
                    placeholder="1,000"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="contrib-note">Note (optional)</Label>
                  <Input id="contrib-note" value={contribNote} onChange={(e) => setContribNote(e.target.value)} placeholder="Monthly contribution" />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setAddContribOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </main>
    </>
  )
}
