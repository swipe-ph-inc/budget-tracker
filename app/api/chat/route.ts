import { createOpenAI } from "@ai-sdk/openai"
import { createAnthropic } from "@ai-sdk/anthropic"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { frontendTools } from "@assistant-ui/react-ai-sdk"
import { createMCPClient } from "@ai-sdk/mcp"
import { streamText, convertToModelMessages, type UIMessage, type LanguageModel } from "ai"
import { createClient } from "@/lib/supabase/server"
import { getAISettings, type AIProvider } from "@/app/actions/profile"
import { getActiveSubscription } from "@/app/actions/billing"

export const maxDuration = 30

const DEFAULT_SYSTEM = `You are a helpful AI Budget Assistant for the Budget Partner app. You help users understand their spending, set budgets, track savings, and answer questions about their finances. Use the available tools to fetch their real data (dashboard stats, accounts, saving plans, recent transactions) when answering. Be concise and friendly.`

const PROVIDER_LABELS: Record<AIProvider, string> = {
  openai: "OpenAI",
  anthropic: "Anthropic (Claude)",
  gemini: "Google Gemini",
}

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

function resolveModel(provider: AIProvider, apiKey: string): LanguageModel {
  switch (provider) {
    case "openai":
      return createOpenAI({ apiKey })("gpt-4o-mini")
    case "anthropic":
      return createAnthropic({ apiKey })("claude-3-5-haiku-20251001")
    case "gemini":
      return createGoogleGenerativeAI({ apiKey })("gemini-1.5-flash")
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
  }
  const apiKey = keyMap[provider]

  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error: `No API key configured for ${PROVIDER_LABELS[provider]}. Add one in Profile → AI Settings.`,
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    )
  }

  const body = (await req.json()) as {
    messages: UIMessage[]
    system?: string
    tools?: Parameters<typeof frontendTools>[0]
  }
  const { messages, system, tools } = body

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
  const model = resolveModel(provider, apiKey)

  const result = streamText({
    model,
    system: resolvedSystem,
    messages: await convertToModelMessages(messages),
    tools: allTools,
    onFinish: () => mcpClient.close(),
  })

  return result.toUIMessageStreamResponse()
}
