"use client"

import { cn } from "@/lib/utils"

const CARD_TYPE_LOGOS: Record<string, string> = {
    visa: "https://wvjmbjyswzmfwrvzpsel.supabase.co/storage/v1/object/public/network-logo/Visa_Inc.-Logo.wine.svg",
    mastercard: "https://wvjmbjyswzmfwrvzpsel.supabase.co/storage/v1/object/public/network-logo/ma_symbol.svg",
    jcb: "https://wvjmbjyswzmfwrvzpsel.supabase.co/storage/v1/object/public/network-logo/jcb_logo_color.svg",
    amex: "https://wvjmbjyswzmfwrvzpsel.supabase.co/storage/v1/object/public/network-logo/Amex_logo_color.svg",
}

const DARK_BACKGROUND_IDS = [
    "photo-1550684376-efcbd6e3f031",
    "premium_photo-1755192700987-cae26287e93c",
    "photo-1664044020180-b75bfddf9776",
    "kGkSg1v",
    "Zi6v09P",
    "photo-1714548870002",
    "photo-1513346940221",
    "photo-1635151227785",
]

export interface CreditCardData {
    id: string
    name: string
    masked_identifier: string
    balance_owed: number
    credit_limit: number
    currency: string
    is_active: boolean
    card_type?: string | null
    background_img_url?: string | null
    statement_day?: number | null
    payment_due_day?: number | null
}

function formatCurrency(amount: number, currency: string): string {
    return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: currency || "PHP",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount)
}

interface CreditCardVisualProps {
    card: CreditCardData
    selected?: boolean
    compact?: boolean
    onClick?: () => void
}

export function CreditCardVisual({ card, selected, compact, onClick }: CreditCardVisualProps) {
    const bgUrl = card.background_img_url
    const hasBg = Boolean(bgUrl)
    const cardLogoUrl = card.card_type ? CARD_TYPE_LOGOS[card.card_type] : null
    const availableCredit = card.credit_limit - card.balance_owed

    const needsLightText =
        !hasBg || DARK_BACKGROUND_IDS.some((id) => bgUrl?.includes(id))
    const textMuted = needsLightText ? "text-white/70" : "text-foreground/60"
    const textPrimary = needsLightText ? "text-white" : "text-foreground"

    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "relative w-full flex-none overflow-hidden rounded-2xl text-left transition-all duration-200",
                compact ? "p-4" : "p-5",
                selected
                    ? "ring-2 ring-primary shadow-lg shadow-primary/10"
                    : "ring-1 ring-border hover:ring-2 hover:ring-primary/40 hover:shadow-md",
                hasBg
                    ? ""
                    : "bg-gradient-to-br from-[oklch(0.42_0.14_250)] to-[oklch(0.28_0.12_250)]",
                textPrimary
            )}
            style={
                hasBg
                    ? {
                        backgroundImage: `url(${bgUrl})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                    }
                    : undefined
            }
        >
            {/* Top row: name + logo */}
            <div className="flex items-start justify-between">
                <p className={cn("text-xs font-medium tracking-wide uppercase", textMuted)}>
                    {card.name}
                </p>
                {cardLogoUrl ? (
                    <img
                        src={cardLogoUrl}
                        alt={card.card_type ?? "card network"}
                        className="h-6 w-8 object-contain"
                        crossOrigin="anonymous"
                    />
                ) : (
                    <div className="flex">
                        <span
                            className={cn(
                                "h-5 w-5 rounded-full",
                                needsLightText ? "bg-white/50" : "bg-primary/50"
                            )}
                        />
                        <span
                            className={cn(
                                "-ml-2.5 h-5 w-5 rounded-full",
                                needsLightText ? "bg-white/30" : "bg-primary/30"
                            )}
                        />
                    </div>
                )}
            </div>

            {/* Balance */}
            <div className={cn("flex items-end justify-between", compact ? "mt-3" : "mt-5")}>
                <div>
                    <p className={cn("text-xs", textMuted)}>Balance Owed</p>
                    <p className={cn("font-bold tabular-nums", compact ? "text-lg" : "text-2xl", textPrimary)}>
                        {formatCurrency(card.balance_owed, card.currency)}
                    </p>
                </div>
                {/* Expiry and CVV/CVC fields */}
                <div className="flex gap-6 mt-2">
                    <div>
                        <p className={cn("text-[10px]", textMuted)}>Expiry</p>
                        <p className={cn("font-medium tabular-nums text-xs", textPrimary)}>**/**</p>
                    </div>
                    <div>
                        <p className={cn("text-[10px]", textMuted)}>CVV/CVC</p>
                        <p className={cn("font-medium tabular-nums text-xs", textPrimary)}>
                            **/**
                        </p>
                    </div>
                </div>
            </div>

            {/* Bottom row */}
            <div
                className={cn(
                    "flex items-center justify-between text-xs",
                    compact ? "mt-3" : "mt-4",
                    textMuted
                )}
            >
                <div>
                    <p className="font-medium">Card Number</p>
                    <p className={cn("mt-0.5 tabular-nums", textPrimary)}>
                        {card.masked_identifier}
                    </p>
                </div>
                <div className="text-right">
                    <p className="font-medium">Available</p>
                    <p className={cn("mt-0.5 tabular-nums", textPrimary)}>
                        {formatCurrency(availableCredit, card.currency)}
                    </p>
                </div>
            </div>
        </button>
    )
}

export { formatCurrency, CARD_TYPE_LOGOS }
