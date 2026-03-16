import { createOpenAI } from "@ai-sdk/openai"
import { createAnthropic } from "@ai-sdk/anthropic"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { frontendTools } from "@assistant-ui/react-ai-sdk"
import { createMCPClient } from "@ai-sdk/mcp"
import { streamText, convertToModelMessages, type UIMessage, type LanguageModel, type TextUIPart } from "ai"
// TextUIPart used in onFinish to extract user message text
import { createClient } from "@/lib/supabase/server"
import { getAISettings, type AIProvider } from "@/app/actions/profile"
import { getActiveSubscription } from "@/app/actions/billing"
import { appendMessages } from "@/app/actions/chat-threads"

export const maxDuration = 30

const DEFAULT_SYSTEM = `You are a helpful AI Budget Assistant for Clairo. You help users understand their spending, set budgets, track savings, and answer questions about their finances. Use the available tools to fetch their real data (dashboard stats, accounts, saving plans, recent transactions) when answering. Be concise and friendly.`

const PROVIDER_LABELS: Record<AIProvider, string> = {
  openai: "OpenAI",
  anthropic: "Anthropic (Claude)",
  gemini: "Google Gemini",
  openrouter: "OpenRouter",
}

const OPENROUTER_DEFAULT_MODEL = "openai/gpt-4o-mini"

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

function resolveModel(
  provider: AIProvider,
  apiKey: string,
  openrouterModel?: string | null,
): LanguageModel {
  switch (provider) {
    case "openai":
      return createOpenAI({ apiKey })("gpt-4o-mini")
    case "anthropic":
      return createAnthropic({ apiKey })("claude-3-5-haiku-20251001")
    case "gemini":
      return createGoogleGenerativeAI({ apiKey })("gemini-1.5-flash")
    case "openrouter":
      return createOpenAI({
        apiKey,
        baseURL: "https://openrouter.ai/api/v1",
      })(openrouterModel?.trim() || OPENROUTER_DEFAULT_MODEL)
  }
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

  // Pro plan gate
  const subscription = await getActiveSubscription()
  if (!subscription) {
    return new Response(
      JSON.stringify({ error: "The AI Budget Assistant is available on the Pro plan only. Upgrade to continue." }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    )
  }

  // Load user's AI settings
  const aiSettings = await getAISettings()
  const provider = aiSettings.ai_provider

  // Resolve API key: user's stored key → env var fallback
  const keyMap: Record<AIProvider, string | undefined> = {
    openai: aiSettings.openai_api_key ?? process.env.OPENAI_API_KEY,
    anthropic: aiSettings.anthropic_api_key ?? process.env.ANTHROPIC_API_KEY,
    gemini: aiSettings.gemini_api_key ?? process.env.GEMINI_API_KEY,
    openrouter: aiSettings.openrouter_api_key ?? process.env.OPENROUTER_API_KEY,
  }
  const apiKey = keyMap[provider]

  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error: `No API key configured for ${PROVIDER_LABELS[provider]}. Add one in AI Settings.`,
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
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

  const resolvedSystem = system ?? aiSettings.ai_system_prompt ?? DEFAULT_SYSTEM
  const model = resolveModel(provider, apiKey, aiSettings.openrouter_model)

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
