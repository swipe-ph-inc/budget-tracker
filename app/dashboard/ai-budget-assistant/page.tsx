import { Sparkles } from "lucide-react"
import { getAIUsage } from "@/app/actions/ai-usage"
import { listThreads } from "@/app/actions/chat-threads"
import { AIBudgetAssistantClient } from "@/components/dashboard/ai-budget-assistant-client"

export default async function AIBudgetAssistantPage() {
  const [usage, threads] = await Promise.all([
    getAIUsage(),
    listThreads().catch(() => []),
  ])

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <AIBudgetAssistantClient initialThreads={threads} initialUsage={usage} />
    </div>
  )
}
