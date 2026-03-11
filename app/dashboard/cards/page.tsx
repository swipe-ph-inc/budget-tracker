"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Plus } from "lucide-react"
import {
  CreditCardVisual,
  type CreditCardData,
} from "@/components/credit-card/credit-card-visual"
import { CardDetailsPanel } from "@/components/credit-card/card-details-panel"
import { QuickActions } from "@/components/credit-card/quick-actions"
import { getCreditCardsPageData } from "@/app/actions/credit-cards"
import type { Tables } from "@/lib/supabase/database.types"
import { toast } from "@/hooks/use-toast"
import { AddCreditCardDialog } from "@/components/credit-card/add-credit-card-dialog"
import { Button } from "@/components/ui/button"

type CreditCardRow = Tables<"credit_card">

function mapRowToCard(row: CreditCardRow, installmentReserved?: number): CreditCardData {
  return {
    id: row.id,
    name: row.name ?? "Credit Card",
    masked_identifier: row.masked_identifier ?? "•••• •••• •••• ••••",
    balance_owed: row.balance_owed ?? 0,
    credit_limit: row.credit_limit ?? 0,
    currency: row.currency ?? "PHP",
    is_active: row.is_active ?? true,
    card_type: row.card_type ?? null,
    background_img_url: row.background_img_url ?? null,
    statement_day: row.statement_day,
    payment_due_day: row.payment_due_day,
    is_blocked: row.is_blocked ?? null,
    is_temporary_blocked: row.temporary_blocked ?? null,
    installment_reserved: installmentReserved ?? 0,
  }
}

function CardsPageSkeleton() {
  return (
    <main className="mx-auto max-w-screen-2xl px-4 py-6 lg:px-8 lg:py-8">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_1fr] xl:grid-cols-[340px_1fr]">
        <aside className="flex flex-col gap-5">
          <div className="flex h-[calc(100vh-9rem)] flex-col rounded-2xl border border-border bg-card p-4 lg:p-5">
            <div className="flex items-center justify-between">
              <div className="h-5 w-24 animate-pulse rounded bg-muted" />
              <div className="h-7 w-7 animate-pulse rounded border border-border bg-muted" />
            </div>
            <div className="mt-4 flex flex-1 flex-col gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
              ))}
            </div>
          </div>
        </aside>
        <div className="flex h-[calc(100vh-9rem)] flex-col gap-6">
          <div className="h-[140px] animate-pulse rounded-2xl bg-muted" />
          <div className="min-h-0 flex-1 animate-pulse rounded-2xl border border-border bg-muted" />
        </div>
      </div>
    </main>
  )
}

export default function CardsPage() {
  const [cards, setCards] = useState<CreditCardData[]>([])
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [addDialogOpen, setAddDialogOpen] = useState(false)

  const loadPageData = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getCreditCardsPageData()
      const mapped = data.cards.map((row) =>
        mapRowToCard(row, data.reservedByCard[row.id])
      )
      setCards(mapped)
      setSelectedCardId((current) => {
        if (current && mapped.some((c) => c.id === current)) return current
        return mapped.length > 0 ? mapped[0]!.id : null
      })
    } catch {
      toast({
        title: "Failed to load cards",
        description: "There was a problem loading your credit cards.",
        variant: "destructive",
      })
      setCards([])
      setSelectedCardId(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadPageData()
  }, [loadPageData])

  const selectedCard = useMemo(
    () => cards.find((c) => c.id === selectedCardId) ?? null,
    [cards, selectedCardId]
  )

  const totalBalance = useMemo(
    () => cards.reduce((sum, c) => sum + c.balance_owed, 0),
    [cards]
  )
  const totalCredit = useMemo(
    () => cards.reduce((sum, c) => sum + c.credit_limit, 0),
    [cards]
  )
  const totalAvailable = useMemo(
    () =>
      cards.reduce(
        (sum, c) =>
          sum + Math.max(0, c.credit_limit - c.balance_owed - (c.installment_reserved ?? 0)),
        0
      ),
    [cards]
  )

  return (
    <div className="min-h-screen bg-background">
      <AddCreditCardDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onCompleted={loadPageData}
      />
      {loading ? (
        <CardsPageSkeleton />
      ) : (
        <main className="mx-auto max-w-screen-2xl px-4 py-6 lg:px-8 lg:py-8">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_1fr] xl:grid-cols-[340px_1fr]">
            {/* ── Left Column: Card List ────────────────── */}
            <aside className="flex flex-col gap-5">
              <div className="flex h-[calc(100vh-9rem)] flex-col rounded-2xl border border-border bg-card p-4 lg:p-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-card-foreground">
                    My Cards
                  </h2>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="h-7 w-7"
                    aria-label="Add credit card"
                    onClick={() => setAddDialogOpen(true)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                <div className="mt-4 flex flex-1 flex-col gap-3 overflow-y-auto pr-1">
                  {cards.length === 0 ? (
                    <div className="flex h-24 items-center justify-center text-xs text-muted-foreground">
                      Add a credit card to get started.
                    </div>
                  ) : (
                    cards.map((card) => (
                      <CreditCardVisual
                        key={card.id}
                        card={card}
                        compact
                        selected={selectedCardId === card.id}
                        onClick={() => setSelectedCardId(card.id)}
                      />
                    ))
                  )}
                </div>
              </div>
            </aside>

            {/* ── Right Column: same height as card list ────────────────── */}
            <div className="flex h-[calc(100vh-9rem)] flex-col gap-6">
              <QuickActions />
              <div className="min-h-0 flex-1">
                <CardDetailsPanel card={selectedCard} onCardUpdated={loadPageData} />
              </div>
            </div>
          </div>
        </main>
      )}
    </div>
  )
}

// ── Helpers ─────────────────────────────────────────────────

function formatPHP(amount: number): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

function SummaryRow({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span
        className={`text-sm font-bold tabular-nums ${highlight ? "text-success" : "text-card-foreground"
          }`}
      >
        {value}
      </span>
    </div>
  )
}
