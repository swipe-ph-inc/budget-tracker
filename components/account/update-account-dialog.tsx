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
import { SuccessMessage, ErrorMessage } from "@/components/ui/status-message"
import { Checkbox } from "@/components/ui/checkbox"
import {
  ACCOUNT_TYPES,
  BACKGROUND,
  CARD_TYPES,
  CURRENCIES,
} from "@/components/account/add-account-dialog"
import { updateAccount } from "@/app/actions/accounts"

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

export type UpdateAccountInitialValues = {
  accountName: string
  bankName: string | null
  maskedIdentifier: string
  totalBalance: string
  currency: string
  accountType:
    | "savings"
    | "current"
    | "checking"
    | "e_wallet"
    | "cash"
    | "other"
  hidden: boolean
  cardType: string | null
  backgroundImgUrl: string | null
  cardNetworkUrl: string | null
}

interface UpdateAccountDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  accountId: string
  initialValues: UpdateAccountInitialValues
  onUpdated?: () => void
}

export function UpdateAccountDialog({
  open,
  onOpenChange,
  accountId,
  initialValues,
  onUpdated,
}: UpdateAccountDialogProps) {
  const [accountName, setAccountName] = useState(initialValues.accountName)
  const [bankName, setBankName] = useState<string>(initialValues.bankName ?? "")
  const [maskedIdentifier, setMaskedIdentifier] = useState(
    initialValues.maskedIdentifier,
  )
  const [totalBalance, setTotalBalance] = useState<string>(
    initialValues.totalBalance,
  )
  const [currency, setCurrency] = useState<string>(initialValues.currency)
  const [accountType, setAccountType] = useState<string>(
    initialValues.accountType,
  )
  const [hidden, setHidden] = useState<boolean>(initialValues.hidden)
  const [cardType, setCardType] = useState<string>(initialValues.cardType ?? "none")
  const [backgroundImgUrl, setBackgroundImgUrl] = useState<string>(
    initialValues.backgroundImgUrl ?? "",
  )
  const [status, setStatus] = useState<
    { type: "success" | "error"; message: string } | null
  >(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Reset form fields when dialog is opened or when initial values change
  useEffect(() => {
    if (open) {
      setStatus(null)
      setAccountName(initialValues.accountName)
      setBankName(initialValues.bankName ?? "")
      setMaskedIdentifier(initialValues.maskedIdentifier)
      setTotalBalance(initialValues.totalBalance)
      setCurrency(initialValues.currency)
      setAccountType(initialValues.accountType)
      setHidden(initialValues.hidden)
      setCardType(initialValues.cardType ?? "none")
      setBackgroundImgUrl(initialValues.backgroundImgUrl ?? "")
    }
  }, [open, initialValues])

  const handleCancel = () => onOpenChange(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const trimmedName = accountName.trim()
    const trimmedMasked = maskedIdentifier.trim()

    if (!trimmedName || !trimmedMasked) {
      const missing: string[] = []
      if (!trimmedName) missing.push("Account Name")
      if (!trimmedMasked) missing.push("Masked Identifier")

      setStatus({
        type: "error",
        message: `Please fill in the following required fields: ${missing.join(
          ", ",
        )}.`,
      })
      return
    }

    const payload: {
      accountId: string
      accountName?: string
      totalBalance?: string
      accountType?:
        | "savings"
        | "current"
        | "checking"
        | "e_wallet"
        | "cash"
        | "other"
      maskedIdentifier?: string
      currency?: string
      bankName?: string | null
      hidden?: boolean
      cardType?: string | null
      backgroundImgUrl?: string | null
      cardNetworkUrl?: string | null
    } = {
      accountId,
    }

    if (trimmedName !== initialValues.accountName.trim()) {
      payload.accountName = trimmedName
    }

    const normalizedInitialBalance = initialValues.totalBalance
    if (totalBalance !== normalizedInitialBalance) {
      payload.totalBalance = totalBalance
    }

    if (accountType !== initialValues.accountType) {
      payload.accountType = accountType as UpdateAccountInitialValues["accountType"]
    }

    if (trimmedMasked !== initialValues.maskedIdentifier.trim()) {
      payload.maskedIdentifier = trimmedMasked
    }

    if (currency !== initialValues.currency) {
      payload.currency = currency
    }

    const normalizedBankName = bankName.trim() || ""
    const initialBankNameNormalized = (initialValues.bankName ?? "").trim()
    if (normalizedBankName !== initialBankNameNormalized) {
      payload.bankName = normalizedBankName === "" ? null : normalizedBankName
    }

    if (hidden !== initialValues.hidden) {
      payload.hidden = hidden
    }

    const normalizedCardType = cardType.trim() || "none"
    const initialCardType = (initialValues.cardType ?? "none").trim() || "none"
    if (normalizedCardType !== initialCardType) {
      payload.cardType = normalizedCardType === "none" ? null : normalizedCardType
      payload.cardNetworkUrl =
        normalizedCardType === "none"
          ? null
          : (CARD_TYPES.find((t) => t.value === normalizedCardType)?.url ?? null)
    }

    const normalizedBg = backgroundImgUrl.trim() || ""
    const initialBg = (initialValues.backgroundImgUrl ?? "").trim()
    if (normalizedBg !== initialBg) {
      payload.backgroundImgUrl = normalizedBg === "" ? null : normalizedBg
    }

    // Avoid calling the server if nothing changed
    const { accountId: _, ...maybeUpdates } = payload
    if (Object.keys(maybeUpdates).length === 0) {
      setStatus({
        type: "error",
        message: "No changes to save. Update at least one field.",
      })
      return
    }

    setIsSubmitting(true)
    const result = await updateAccount(payload)
    if (result.success) {
      setStatus({ type: "success", message: "Account updated successfully." })
      onUpdated?.()
      setTimeout(() => {
        onOpenChange(false)
        setStatus(null)
      }, 1200)
    } else {
      setStatus({ type: "error", message: result.error })
    }
    setIsSubmitting(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Update Account</DialogTitle>
          <DialogDescription>
            Edit the basic details for this funding source. Only these fields
            will be updated.
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
                <Input
                  id="masked-identifier"
                  placeholder="e.g. **** 1234 or BPI"
                  maxLength={50}
                  value={maskedIdentifier}
                  onChange={(e) => setMaskedIdentifier(e.target.value)}
                  aria-describedby="masked-identifier-hint"
                />
                <p
                  id="masked-identifier-hint"
                  className="text-xs text-muted-foreground"
                >
                  Last 4 digits or bank/institution name
                </p>
              </div>

              <div className="flex-1 grid gap-2">
                <Label htmlFor="total-balance">Total Balance</Label>
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
                />
                <p
                  id="total-balance-hint"
                  className="text-xs text-muted-foreground"
                >
                  Current balance for this account
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
            <Label htmlFor="currency">Currency</Label>
            <Select
              name="currency"
              value={currency}
              onValueChange={setCurrency}
              required
            >
              <SelectTrigger id="currency">
                <SelectValue placeholder="Select currency" />
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

          <div className="grid gap-2">
            <Label htmlFor="card-type">Card Type</Label>
            <Select name="card_type" value={cardType} onValueChange={setCardType}>
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
              value={backgroundImgUrl}
              onValueChange={setBackgroundImgUrl}
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

          <div className="flex items-start gap-3 sm:col-span-2">
            <Checkbox
              id="hidden"
              checked={hidden}
              onCheckedChange={(v) => setHidden(v === true)}
            />
            <div className="grid gap-1 leading-none">
              <Label htmlFor="hidden" className="cursor-pointer">
                Hidden contents
              </Label>
              <p className="text-xs text-muted-foreground">
                When enabled, sensitive values may be hidden in parts of the UI.
              </p>
            </div>
          </div>

          <DialogFooter className="mt-2 flex flex-col gap-2 sm:col-span-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

