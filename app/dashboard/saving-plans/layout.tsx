import type { Metadata } from "next"

export const metadata: Metadata = { title: "Saving Plans" }

export default function SavingPlansLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
