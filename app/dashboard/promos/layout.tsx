import type { Metadata } from "next"

export const metadata: Metadata = { title: "Promos" }

export default function PromosLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
