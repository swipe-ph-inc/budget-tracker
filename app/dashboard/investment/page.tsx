import { TopHeader } from "@/components/top-header"
import { TrendingUp, TrendingDown, BarChart3, DollarSign } from "lucide-react"

const portfolio = [
  { name: "Apple Inc.", ticker: "AAPL", shares: 50, price: "$182.50", change: "+2.4%", value: "$9,125.00", trend: "up" },
  { name: "Tesla Inc.", ticker: "TSLA", shares: 20, price: "$245.30", change: "-1.2%", value: "$4,906.00", trend: "down" },
  { name: "Microsoft Corp.", ticker: "MSFT", shares: 30, price: "$378.90", change: "+1.8%", value: "$11,367.00", trend: "up" },
  { name: "Amazon.com", ticker: "AMZN", shares: 15, price: "$155.20", change: "+3.1%", value: "$2,328.00", trend: "up" },
  { name: "NVIDIA Corp.", ticker: "NVDA", shares: 25, price: "$495.60", change: "-0.5%", value: "$12,390.00", trend: "down" },
]

export default function InvestmentPage() {
  return (
    <>
      <TopHeader title="Investment" />
      <div className="flex-1 overflow-y-auto p-4 lg:p-6">
        {/* Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl border border-border bg-card p-4 lg:p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs lg:text-sm text-muted-foreground">Total Value</p>
                <p className="text-lg lg:text-xl font-bold text-card-foreground">$40,116</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 lg:p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent">
                <TrendingUp className="h-5 w-5 text-accent-foreground" />
              </div>
              <div>
                <p className="text-xs lg:text-sm text-muted-foreground">Total Gain</p>
                <p className="text-lg lg:text-xl font-bold text-primary">+$5,230</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 lg:p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary">
                <BarChart3 className="h-5 w-5 text-secondary-foreground" />
              </div>
              <div>
                <p className="text-xs lg:text-sm text-muted-foreground">Return Rate</p>
                <p className="text-lg lg:text-xl font-bold text-card-foreground">15.02%</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 lg:p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs lg:text-sm text-muted-foreground">Dividends</p>
                <p className="text-lg lg:text-xl font-bold text-card-foreground">$1,240</p>
              </div>
            </div>
          </div>
        </div>

        {/* Portfolio */}
        <div className="mt-6 rounded-xl border border-border bg-card p-4 lg:p-6">
          <h2 className="text-lg font-semibold text-card-foreground">Portfolio</h2>
          <div className="mt-4 overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[500px] text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Asset</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Shares</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Price</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Change</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Value</th>
                </tr>
              </thead>
              <tbody>
                {portfolio.map((stock) => (
                  <tr key={stock.ticker} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-card-foreground">{stock.name}</p>
                        <p className="text-xs text-muted-foreground">{stock.ticker}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-card-foreground">{stock.shares}</td>
                    <td className="px-4 py-3 text-card-foreground">{stock.price}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {stock.trend === "up" ? (
                          <TrendingUp className="h-3.5 w-3.5 text-primary" />
                        ) : (
                          <TrendingDown className="h-3.5 w-3.5 text-destructive" />
                        )}
                        <span className={stock.trend === "up" ? "text-primary" : "text-destructive"}>
                          {stock.change}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-card-foreground">{stock.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}
