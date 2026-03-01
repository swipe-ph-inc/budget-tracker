"use client"

import { useEffect, useState } from "react"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CURRENCIES } from "@/components/account/add-account-dialog"
import { SuccessMessage, ErrorMessage } from "@/components/ui/status-message"
import { createRecipient } from "@/app/actions/recipient"
import { toast } from "@/hooks/use-toast"

interface AddRecipientDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCompleted?: () => void
}

export function AddRecipientDialog({
  open,
  onOpenChange,
  onCompleted,
}: AddRecipientDialogProps) {
  const [displayName, setDisplayName] = useState("")
  const [accountNumber, setAccountNumber] = useState("")
  const [bankName, setBankName] = useState("")
  const [bankCode, setBankCode] = useState("")
  const [countryCode, setCountryCode] = useState("")
  const [currency, setCurrency] = useState("")
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setDisplayName("")
      setAccountNumber("")
      setBankName("")
      setBankCode("")
      setCountryCode("")
      setCurrency("")
      setStatus(null)
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const trimmedDisplayName = displayName.trim()
    const trimmedAccountNumber = accountNumber.trim()

    if (!trimmedDisplayName) {
      setStatus({ type: "error", message: "Display name is required." })
      return
    }

    if (!trimmedAccountNumber) {
      setStatus({ type: "error", message: "Account number is required." })
      return
    }

    setIsSubmitting(true)
    setStatus(null)

    const result = await createRecipient({
      displayName: trimmedDisplayName,
      accountNumber: trimmedAccountNumber,
      bankName: bankName.trim() || null,
      bankCode: bankCode.trim() || null,
      countryCode: countryCode.trim() || null,
      currency: currency.trim() || null,
    })

    if (result.success) {
      toast({ title: "Recipient added", description: "The recipient has been saved successfully." })
      onCompleted?.()
      onOpenChange(false)
    } else {
      setStatus({ type: "error", message: result.error })
    }

    setIsSubmitting(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Add New Recipient</DialogTitle>
          <DialogDescription>
            Add a saved beneficiary for quick transfers. Display name and account number are required.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="space-y-2">
            <Label htmlFor="display-name">
              Display name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="display-name"
              placeholder="e.g. Bob Johnson"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              disabled={isSubmitting}
              aria-required="true"
              autoComplete="name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="account-number">
              Account number <span className="text-destructive">*</span>
            </Label>
            <Input
              id="account-number"
              placeholder="e.g. 120987654324"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              disabled={isSubmitting}
              aria-required="true"
              inputMode="numeric"
              autoComplete="off"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bank-name">Bank name</Label>
              <Input
                id="bank-name"
                placeholder="e.g. BDO"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bank-code">Bank code</Label>
              <Input
                id="bank-code"
                placeholder="e.g. BDO"
                value={bankCode}
                onChange={(e) => setBankCode(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="country-code">Country code</Label>
              <Input
                id="country-code"
                placeholder="e.g. PH"
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                disabled={isSubmitting}
                maxLength={2}
                className="uppercase"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select
                value={currency || "none"}
                onValueChange={(v) => setCurrency(v === "none" ? "" : v)}
                disabled={isSubmitting}
              >
                <SelectTrigger id="currency">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Select currency</SelectItem>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {status && (
            <div>
              {status.type === "success" ? (
                <SuccessMessage message={status.message} />
              ) : (
                <ErrorMessage message={status.message} />
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Recipient"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
