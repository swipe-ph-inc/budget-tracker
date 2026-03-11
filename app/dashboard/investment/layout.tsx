import type { Metadata } from "next"

export const metadata: Metadata = { title: "Investment" }

export default function InvestmentLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
