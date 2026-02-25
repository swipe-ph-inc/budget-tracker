import { TopHeader } from "@/components/top-header"
import { Star, Archive, Trash2 } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

const messages = [
  { from: "COINEST Support", subject: "Welcome to COINEST Pro!", preview: "Thank you for upgrading to Pro. Here's what you can do with your new features...", time: "2 hours ago", read: false, starred: true },
  { from: "Security Alert", subject: "New login detected", preview: "We detected a new login to your account from Chrome on macOS...", time: "5 hours ago", read: false, starred: false },
  { from: "Investment Team", subject: "Weekly Market Report", preview: "This week's market showed significant growth in tech sector. Here's your personalized report...", time: "1 day ago", read: true, starred: false },
  { from: "Billing", subject: "Payment Confirmation", preview: "Your payment of $89.99 for COINEST Pro has been successfully processed...", time: "2 days ago", read: true, starred: true },
  { from: "Morgan Lee", subject: "Shared budget plan", preview: "Hey Andrew, I've shared the vacation budget plan with you. Let me know your thoughts...", time: "3 days ago", read: true, starred: false },
  { from: "Promo Team", subject: "Exclusive: Get 2% cashback!", preview: "For a limited time, earn 2% cashback on all international transfers...", time: "4 days ago", read: true, starred: false },
]

export default function InboxPage() {
  return (
    <>
      <TopHeader title="Inbox" />
      <div className="flex-1 overflow-y-auto p-4 lg:p-6">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Badge className="bg-primary text-primary-foreground">All</Badge>
            <Badge variant="outline" className="cursor-pointer text-muted-foreground hover:text-foreground">Unread (2)</Badge>
            <Badge variant="outline" className="cursor-pointer text-muted-foreground hover:text-foreground">Starred</Badge>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground">
              <Archive className="h-4 w-4" />
            </button>
            <button className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="mt-4 rounded-xl border border-border bg-card">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex items-start gap-3 border-b border-border p-3 last:border-0 hover:bg-muted/30 lg:gap-4 lg:p-4 ${!msg.read ? "bg-accent/30" : ""}`}
            >
              <Avatar className="mt-0.5 h-8 w-8 shrink-0 lg:h-9 lg:w-9">
                <AvatarFallback className="bg-primary/10 text-[10px] font-medium text-primary lg:text-xs">
                  {msg.from.split(" ").map(w => w[0]).join("").slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`truncate text-sm ${!msg.read ? "font-semibold text-card-foreground" : "font-medium text-card-foreground"}`}>
                      {msg.from}
                    </span>
                    {!msg.read && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="hidden text-xs text-muted-foreground sm:block">{msg.time}</span>
                    <button className={`${msg.starred ? "text-warning" : "text-muted-foreground"} hover:text-warning`}>
                      <Star className="h-4 w-4" fill={msg.starred ? "currentColor" : "none"} />
                    </button>
                  </div>
                </div>
                <p className={`mt-0.5 truncate text-sm ${!msg.read ? "font-medium text-card-foreground" : "text-card-foreground"}`}>
                  {msg.subject}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{msg.preview}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
