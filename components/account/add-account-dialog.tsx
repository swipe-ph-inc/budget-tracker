"use client"

import { useEffect, useRef, useState } from "react"
import { Shuffle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createAccount } from "@/app/actions/accounts"
import type { Database } from "@/lib/supabase/database.types"
import { SuccessMessage, ErrorMessage } from "@/components/ui/status-message"

type AccountInsert = Database["public"]["Tables"]["account"]["Insert"]

export const ACCOUNT_TYPES = [
  { value: "savings", label: "Savings" },
  { value: "current", label: "Current" },
  { value: "checking", label: "Checking" },
  { value: "e_wallet", label: "E-Wallet" },
  { value: "cash", label: "Cash" },
  { value: "other", label: "Other" },
] as const

export const CURRENCIES = [
  { value: "PHP", label: "PHP" },
  { value: "USD", label: "USD" },
] as const

export const CARD_TYPES = [
  { value: "visa", label: "Visa" },
  { value: "mastercard", label: "Mastercard" },
  { value: "amex", label: "American Express" },
  { value: "none", label: "None" },
] as const

export const BACKGROUND = [
  { value: "https://i.imgur.com/kGkSg1v.png", label: "Blue" },
  { value: "https://i.imgur.com/Zi6v09P.png", label: "Orange" },
] as const

export interface AddAccountFormValues {
  accountName: string
  bankName: string
  maskedIdentifier: string
  totalBalance: string
  currency: string
  accountType: string
  cardType: string
  isHidden: boolean
}

interface AddAccountDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCompleted?: () => void
}

function generateMaskedIdentifier(): string {
  const digits = Array.from({ length: 16 }, () =>
    Math.floor(Math.random() * 10)
  ).join("")
  return digits
}

/** Formats a numeric input string with locale thousands separators (e.g. 1234567.89 -> 1,234,567.89) */
function formatBalanceInput(value: string): string {
  if (!value) return ""
  let cleaned = value.replace(/[^\d.]/g, "")
  const firstDotIndex = cleaned.indexOf(".")
  if (firstDotIndex !== -1) {
    cleaned =
      cleaned.slice(0, firstDotIndex + 1) +
      cleaned.slice(firstDotIndex + 1).replace(/\./g, "")
  }
  const hasDecimal = cleaned.includes(".")
  let [intPart = "", decPart = ""] = cleaned.split(".")
  if (intPart === "" && hasDecimal) {
    intPart = "0"
  }
  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",")

  if (hasDecimal && cleaned.endsWith(".")) {
    return `${formattedInt}.`
  }

  if (hasDecimal) {
    return `${formattedInt}.${decPart.slice(0, 2)}`
  }

  return formattedInt
}

export function AddAccountDialog({
  open,
  onOpenChange,
  onCompleted,
}: AddAccountDialogProps) {
  const [accountName, setAccountName] = useState<string>("")
  const [maskedIdentifier, setMaskedIdentifier] = useState<string>("")
  const [bankName, setBankName] = useState<string>("")
  const [totalBalance, setTotalBalance] = useState<string>("")
  const [currency, setCurrency] = useState<string>("PHP")
  const [accountType, setAccountType] = useState<string>("savings")
  const [cardType, setCardType] = useState<string>("none")
  const [background, setBackground] = useState<string>("")
  const [hideContents, setHideContents] = useState<boolean>(false)
  const [status, setStatus] = useState<
    { type: "success" | "error"; message: string } | null
  >(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const prevOpenRef = useRef(false)
  useEffect(() => {
    prevOpenRef.current = open
    if (open) setStatus(null)
  }, [open])

  const handleCancel = () => onOpenChange(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const missingFields: string[] = []
    if (!accountName.trim()) missingFields.push("Account Name")
    if (!bankName.trim()) missingFields.push("Bank Name")
    if (!maskedIdentifier.trim()) missingFields.push("Masked Identifier")
    if (!totalBalance.trim()) missingFields.push("Total Balance")
    if (!background.trim()) missingFields.push("Background Color")

    if (missingFields.length > 0) {
      setStatus({
        type: "error",
        message: `Please fill in the following required fields: ${missingFields.join(
          ", "
        )}.`,
      })
      return
    }

    const payload = {
      accountName,
      bankName,
      maskedIdentifier,
      totalBalance,
      currency,
      accountType,
      cardType,
      isHidden: hideContents,
      background
    }

    setIsSubmitting(true)
    const result = await createAccount(payload)
    if (result.success) {
      setStatus({ type: "success", message: "Account added successfully." })
      onCompleted?.()
      setTimeout(() => {
        onOpenChange(false)
        setStatus(null)
      }, 1500)
    } else {
      setStatus({ type: "error", message: result.error })
    }
    setIsSubmitting(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Add New Account</DialogTitle>
          <DialogDescription>
            Add a funding source that holds money—savings, current, e-wallet, or
            cash. Credit cards are managed separately.
          </DialogDescription>
        </DialogHeader>

        {status && (
          <div className="sm:col-span-2">
            {status.type === "success" ? (
              <SuccessMessage message={status.message} />
            ) : (
              <ErrorMessage message={status.message} />
            )}
          </div>
        )}
        <form
          className="grid grid-cols-1 gap-6 py-4 sm:grid-cols-2"
          onSubmit={handleSubmit}
        >
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="account-name">Account Name</Label>
            <Input
              id="account-name"
              placeholder="e.g. BPI Savings, GCash"
              maxLength={255}
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              aria-describedby="account-name-hint"
            />
            <p id="account-name-hint" className="text-xs text-muted-foreground">
              A friendly name for this account
            </p>
          </div>
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="bank-name">Bank Name</Label>
            <Input
              id="bank-name"
              placeholder="e.g. BPI, BDO, GCash"
              maxLength={255}
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              aria-describedby="bank-name-hint"
            />
            <p id="bank-name-hint" className="text-xs text-muted-foreground">
              Name of the bank or financial institution
            </p>
          </div>
          <div className="sm:col-span-2 grid gap-2">
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="flex-1 grid gap-2">
                <Label htmlFor="masked-identifier">Masked Identifier</Label>
                <div className="flex overflow-hidden rounded-md border border-input focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                  <Input
                    id="masked-identifier"
                    placeholder="e.g. **** 1234 or BPI"
                    maxLength={50}
                    value={maskedIdentifier}
                    onChange={(e) => setMaskedIdentifier(e.target.value)}
                    aria-describedby="masked-identifier-hint"
                    className="min-w-0 border-0 rounded-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setMaskedIdentifier(generateMaskedIdentifier())}
                    title="Generate random account number"
                    aria-label="Generate random account number"
                    className="h-10 shrink-0 rounded-none border-l border-input"
                  >
                    <Shuffle className="h-4 w-4" />
                  </Button>
                </div>
                <p
                  id="masked-identifier-hint"
                  className="text-xs text-muted-foreground"
                >
                  Last 4 digits or bank/institution name
                </p>
              </div>

              <div className="flex-1 grid gap-2">
                <Label htmlFor="total-balance">Total Balance</Label>
                <div className="flex overflow-hidden rounded-md border border-input focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                  <Input
                    id="total-balance"
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={totalBalance}
                    onChange={(e) =>
                      setTotalBalance(formatBalanceInput(e.target.value))
                    }
                    aria-describedby="total-balance-hint"
                    className="min-w-0 border-0 rounded-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                  <Select
                    value={currency}
                    onValueChange={setCurrency}
                    name="currency"
                  >
                    <SelectTrigger
                      id="currency"
                      className="h-10 w-auto min-w-[72px] shrink-0 rounded-none border-0 border-l border-input bg-transparent px-3 shadow-none focus:ring-0 focus:ring-offset-0"
                    >
                      <SelectValue placeholder="Currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <p
                  id="total-balance-hint"
                  className="text-xs text-muted-foreground"
                >
                  Initial balance when adding this account
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="account-type">Account Type</Label>
            <Select
              name="account_type"
              value={accountType}
              onValueChange={setAccountType}
              required
            >
              <SelectTrigger id="account-type">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {ACCOUNT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="card-type">Card Type</Label>
            <Select
              name="card_type"
              value={cardType}
              onValueChange={setCardType}
            >
              <SelectTrigger id="card-type">
                <SelectValue placeholder="Select card type" />
              </SelectTrigger>
              <SelectContent>
                {CARD_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="background">Background Color</Label>
            <Select
              name="background"
              value={background}
              onValueChange={setBackground}
            >
              <SelectTrigger id="background">
                <SelectValue placeholder="Select background type" />
              </SelectTrigger>
              <SelectContent>
                {BACKGROUND.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2 sm:col-span-2">
            <Checkbox
              id="hide-contents"
              checked={hideContents}
              onCheckedChange={(checked) =>
                setHideContents(checked === true)
              }
            />
            <Label
              htmlFor="hide-contents"
              className="text-sm font-normal cursor-pointer"
            >
              Make the contents hidden or not
            </Label>
          </div>

          <DialogFooter className="mt-2 flex flex-col gap-2 sm:col-span-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Account"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
