import { Gift, Clock, Tag, Percent } from "lucide-react"
import { Badge } from "@/components/ui/badge"

const promos = [
  {
    title: "2% Cashback on Transfers",
    description: "Earn 2% cashback on all international transfers made this month. Maximum cashback $100.",
    code: "TRANSFER2X",
    expires: "Mar 31, 2028",
    status: "Active",
    icon: Percent,
  },
  {
    title: "Free Premium for 3 Months",
    description: "Refer a friend and get 3 months of Clairo Pro free. Your friend also gets 1 month free.",
    code: "REFER3FREE",
    expires: "Apr 15, 2028",
    status: "Active",
    icon: Gift,
  },
  {
    title: "$50 Welcome Bonus",
    description: "New savings plan? Get a $50 bonus when you save $500 or more in your first month.",
    code: "SAVE50",
    expires: "Mar 20, 2028",
    status: "Active",
    icon: Tag,
  },
  {
    title: "0% Transfer Fee",
    description: "Enjoy zero transfer fees on domestic transfers up to $5,000. Limited time offer.",
    code: "ZEROFEE",
    expires: "Feb 28, 2028",
    status: "Expired",
    icon: Tag,
  },
]

export default function PromosPage() {
  return (
    <>
      <div className="flex-1 overflow-y-auto p-4 lg:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-border bg-card p-4 lg:p-5">
            <p className="text-xs lg:text-sm text-muted-foreground">Active Promos</p>
            <p className="mt-1 text-xl lg:text-2xl font-bold text-card-foreground">3</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 lg:p-5">
            <p className="text-xs lg:text-sm text-muted-foreground">Total Saved</p>
            <p className="mt-1 text-xl lg:text-2xl font-bold text-primary">$234.50</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 lg:p-5">
            <p className="text-xs lg:text-sm text-muted-foreground">Codes Used</p>
            <p className="mt-1 text-xl lg:text-2xl font-bold text-card-foreground">7</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
          {promos.map((promo) => (
            <div key={promo.code} className={`rounded-xl border border-border bg-card p-4 lg:p-6 ${promo.status === "Expired" ? "opacity-60" : ""}`}>
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 lg:h-11 lg:w-11">
                  <promo.icon className="h-5 w-5 text-primary" />
                </div>
                <Badge variant="outline" className={
                  promo.status === "Active" ? "border-primary/30 bg-primary/10 text-primary" : "border-border bg-muted text-muted-foreground"
                }>{promo.status}</Badge>
              </div>
              <h3 className="mt-3 text-sm font-semibold text-card-foreground lg:text-base">{promo.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground lg:text-sm">{promo.description}</p>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 rounded-lg bg-secondary px-3 py-1.5">
                  <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-sm font-mono font-medium text-card-foreground">{promo.code}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{promo.expires}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
