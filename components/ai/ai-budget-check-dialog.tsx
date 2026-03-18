"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import type { BudgetCheckResponse, FollowUpResponse } from "@/app/api/ai/budget-check/route"

export type PaymentCheckData = {
  amount: number
  currency: string
  merchant: string
  category: string
}

type DialogState = "checking" | "result" | "followUp" | "answered" | "error"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  paymentData: PaymentCheckData | null
  onConfirm: () => void
  onCancel: () => void
}

const STATUS_COLORS: Record<string, string> = {
  healthy: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  critical: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
}

export function AiBudgetCheckDialog({
  open,
  onOpenChange,
  paymentData,
  onConfirm,
  onCancel,
}: Props) {
  const [state, setState] = useState<DialogState>("checking")
  const [checkResult, setCheckResult] = useState<BudgetCheckResponse | null>(null)
  const [followUpMessage, setFollowUpMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  // Run budget check when dialog opens with new payment data
  useEffect(() => {
    if (!open || !paymentData) return

    setState("checking")
    setCheckResult(null)
    setFollowUpMessage(null)
    setErrorMessage(null)

    const runCheck = async () => {
      try {
        const res = await fetch("/api/ai/budget-check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(paymentData),
        })

        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          setErrorMessage(
            data.error ?? "Budget check failed. You can still proceed with your payment."
          )
          setState("error")
          return
        }

        const data: BudgetCheckResponse = await res.json()
        setCheckResult(data)
        setState("result")
      } catch {
        setErrorMessage("Budget check failed. You can still proceed with your payment.")
        setState("error")
      }
    }

    runCheck()
  }, [open, paymentData])

  const handleBubbleClick = async (question: string) => {
    if (!checkResult || state !== "result") return

    setState("followUp")
    try {
      const res = await fetch("/api/ai/budget-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...paymentData,
          followUp: question,
          context: checkResult.context,
        }),
      })

      const data: FollowUpResponse = await res.json()
      setFollowUpMessage(data.message ?? "I couldn't answer that. Please proceed with your decision.")
      setState("answered")
    } catch {
      setFollowUpMessage("Could not load answer. Please proceed with your decision.")
      setState("answered")
    }
  }

  const handleConfirm = async () => {
    setIsPending(true)
    await onConfirm()
    setIsPending(false)
  }

  const isActionDisabled = state === "checking" || state === "followUp" || isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <span>🤖</span>
            <span>AI Budget Check</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          {/* Payment summary pill */}
          {paymentData && (
            <div className="flex items-center gap-2 rounded-lg bg-secondary/50 px-3 py-2 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">
                {paymentData.currency} {Number(paymentData.amount).toLocaleString()}
              </span>
              <span>·</span>
              <span>{paymentData.merchant}</span>
              <span>·</span>
              <span>{paymentData.category}</span>
            </div>
          )}

          {/* Checking state */}
          {state === "checking" && (
            <div className="flex flex-col items-center gap-3 py-6">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Analyzing your budget…</p>
            </div>
          )}

          {/* Error state */}
          {state === "error" && (
            <div className="rounded-lg border border-border bg-secondary/30 p-4">
              <p className="text-sm text-muted-foreground">{errorMessage}</p>
            </div>
          )}

          {/* Result / Answered state */}
          {(state === "result" || state === "followUp" || state === "answered") &&
            checkResult && (
              <div className="flex flex-col gap-3">
                {/* Status badge + message */}
                <div
                  className={`rounded-lg px-4 py-3 text-sm font-medium ${
                    STATUS_COLORS[checkResult.status] ?? STATUS_COLORS.warning
                  }`}
                >
                  {checkResult.message}
                </div>

                {/* Follow-up answer */}
                {(state === "answered") && followUpMessage && (
                  <div className="rounded-lg border border-border bg-secondary/30 px-4 py-3 text-sm text-foreground">
                    {followUpMessage}
                  </div>
                )}

                {/* Bubble suggestions — only in result state */}
                {state === "result" && checkResult.suggestions && (
                  <div className="flex flex-col gap-2">
                    <p className="text-xs font-medium text-muted-foreground">Quick questions:</p>
                    <div className="flex flex-wrap gap-2">
                      {checkResult.suggestions.map((s, i) => (
                        <button
                          key={i}
                          onClick={() => handleBubbleClick(s)}
                          className="rounded-full border border-border bg-background px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                        >
                          💬 {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Follow-up loading */}
                {state === "followUp" && (
                  <div className="flex items-center gap-2 py-1">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Getting answer…</span>
                  </div>
                )}
              </div>
            )}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={onCancel}
            disabled={isActionDisabled}
          >
            ✕ Cancel Payment
          </Button>
          <Button
            className="w-full sm:w-auto"
            onClick={handleConfirm}
            disabled={isActionDisabled}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              "✓ Proceed Anyway"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
