"use client"

import { Wifi } from "lucide-react"

export function BalanceCard() {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[hsl(145,50%,25%)] to-[hsl(145,60%,18%)] p-6 text-[hsl(0,0%,100%)]">
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
          <p className="text-lg font-semibold">Andrew Forbist</p>
        </div>

        <div className="mt-4 flex items-end justify-between">
          <div>
            <p className="text-xs opacity-70">Balance Amount</p>
            <p className="text-2xl font-bold">$562,000</p>
          </div>
          <div className="flex gap-4 text-xs">
            <div>
              <span className="opacity-70">EXP</span>
              <p className="font-medium">11/29</p>
            </div>
            <div>
              <span className="opacity-70">CVV</span>
              <p className="font-medium">323</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
