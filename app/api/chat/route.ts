import { createOpenAI } from "@ai-sdk/openai"
import { frontendTools } from "@assistant-ui/react-ai-sdk"
import { createMCPClient } from "@ai-sdk/mcp"
import { streamText, convertToModelMessages, type UIMessage, type TextUIPart } from "ai"
import { createClient } from "@/lib/supabase/server"
import { checkChatLimit, incrementChatUsage } from "@/app/actions/ai-usage"
import { appendMessages } from "@/app/actions/chat-threads"

export const maxDuration = 30

const DEFAULT_SYSTEM = `You are a helpful AI Budget Assistant for Clairo. You help users understand their spending, set budgets, track savings, and answer questions about their finances. Use the available tools to fetch their real data (dashboard stats, accounts, saving plans, recent transactions) when answering. Be concise and friendly.`

function getMcpBaseUrl(req: Request): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")
  }
  const host = req.headers.get("x-forwarded-host")
  if (host) {
    const proto = req.headers.get("x-forwarded-proto") ?? "https"
    return `${proto}://${host}`
  }
  return new URL(req.url).origin
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    })
  }

  // Rate limit check
  const { allowed, used, limit } = await checkChatLimit()
  if (!allowed) {
    return new Response(
      JSON.stringify({
        error: `Monthly limit reached (${used}/${limit} messages). Upgrade to Pro for unlimited access.`,
      }),
      { status: 429, headers: { "Content-Type": "application/json" } }
    )
  }

  const body = (await req.json()) as {
    messages: UIMessage[]
    system?: string
    tools?: Parameters<typeof frontendTools>[0]
    threadId?: string
  }
  const { messages, system, tools, threadId } = body

  const mcpBaseUrl = getMcpBaseUrl(req)
  const cookieHeader = req.headers.get("cookie") ?? ""

  const mcpClient = await createMCPClient({
    transport: {
      type: "http",
      url: `${mcpBaseUrl}/api/mcp`,
      headers: { Cookie: cookieHeader },
    },
  })

  const mcpTools = await mcpClient.tools()
  const allTools = {
    ...frontendTools(tools ?? {}),
    ...mcpTools,
  }

  const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const model = openai("gpt-4o-mini")
  const resolvedSystem = system ?? DEFAULT_SYSTEM

  // Increment usage before streaming (counts the request, not completion)
  await incrementChatUsage(user.id)

  const result = streamText({
    model,
    system: resolvedSystem,
    messages: await convertToModelMessages(messages),
    tools: allTools,
    onFinish: async ({ text }) => {
      mcpClient.close()

      if (threadId) {
        // Save only the latest exchange: last user message + assistant reply
        const newMessages: { role: "user" | "assistant"; content: string }[] = []

        // Last user message from the input array
        const lastUser = [...messages].reverse().find((m) => m.role === "user")
        if (lastUser) {
          const userText = (lastUser.parts ?? [])
            .filter((p): p is TextUIPart => p.type === "text")
            .map((p) => p.text)
            .join("")
          if (userText.trim()) newMessages.push({ role: "user", content: userText })
        }

        // Assistant reply (text is the full streamed text)
        if (text.trim()) newMessages.push({ role: "assistant", content: text })

        if (newMessages.length > 0) {
          await appendMessages(threadId, newMessages).catch((err) =>
            console.error("[chat] appendMessages failed", err)
          )
        }
      }
    },
  })

  return result.toUIMessageStreamResponse()
}
