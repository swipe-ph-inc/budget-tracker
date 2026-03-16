"use client"

import { useCallback, useEffect, useState } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { getAISettings, updateAISettings, type AIProvider } from "@/app/actions/profile"
import { toast } from "@/hooks/use-toast"
import { Eye, EyeOff } from "lucide-react"

const AI_PROVIDERS: { value: AIProvider; label: string; model: string; envVar: string }[] = [
  { value: "openai",    label: "OpenAI",            model: "gpt-4o-mini",               envVar: "OPENAI_API_KEY" },
  { value: "anthropic", label: "Anthropic (Claude)", model: "claude-3-5-haiku-20251001", envVar: "ANTHROPIC_API_KEY" },
  { value: "gemini",    label: "Google Gemini",      model: "gemini-1.5-flash",          envVar: "GEMINI_API_KEY" },
]

interface AISettingsDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AISettingsDrawer({ open, onOpenChange }: AISettingsDrawerProps) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [aiProvider, setAiProvider] = useState<AIProvider>("openai")
  const [openaiApiKey, setOpenaiApiKey] = useState("")
  const [anthropicApiKey, setAnthropicApiKey] = useState("")
  const [geminiApiKey, setGeminiApiKey] = useState("")
  const [aiSystemPrompt, setAiSystemPrompt] = useState("")
  const [showKeys, setShowKeys] = useState<Record<AIProvider, boolean>>({
    openai: false,
    anthropic: false,
    gemini: false,
  })

  const loadSettings = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getAISettings()
      setAiProvider(res.ai_provider)
      setOpenaiApiKey(res.openai_api_key ?? "")
      setAnthropicApiKey(res.anthropic_api_key ?? "")
      setGeminiApiKey(res.gemini_api_key ?? "")
      setAiSystemPrompt(res.ai_system_prompt ?? "")
    } finally {
      setLoading(false)
    }
  }, [])

  // Load when drawer opens
  useEffect(() => {
    if (open) void loadSettings()
  }, [open, loadSettings])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const result = await updateAISettings({
        ai_provider: aiProvider,
        openai_api_key: openaiApiKey.trim() || null,
        anthropic_api_key: anthropicApiKey.trim() || null,
        gemini_api_key: geminiApiKey.trim() || null,
        ai_system_prompt: aiSystemPrompt.trim() || null,
      })
      if (result.success) {
        toast({ title: "AI settings saved", description: "Your AI Budget Assistant settings have been updated." })
      } else {
        toast({ title: "Save failed", description: result.error, variant: "destructive" })
      }
    } finally {
      setSaving(false)
    }
  }

  const toggleKey = (provider: AIProvider) =>
    setShowKeys((prev) => ({ ...prev, [provider]: !prev[provider] }))

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle>AI Settings</SheetTitle>
          <SheetDescription>
            Configure the model and API keys used by your AI Budget Assistant.
          </SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="flex flex-col gap-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {/* Active provider */}
            <div className="space-y-2">
              <Label htmlFor="drawer-ai-provider">Active LLM provider</Label>
              <Select value={aiProvider} onValueChange={(v) => setAiProvider(v as AIProvider)}>
                <SelectTrigger id="drawer-ai-provider" className="w-full">
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  {AI_PROVIDERS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                      <span className="ml-2 text-xs text-muted-foreground">({p.model})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                The selected provider is used for every conversation.
              </p>
            </div>

            {/* API keys */}
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">API keys</p>
              <p className="text-xs text-muted-foreground">
                Only the active provider's key is used. Others are stored but ignored.
              </p>
            </div>

            {AI_PROVIDERS.map((p) => {
              const valueMap: Record<AIProvider, string> = {
                openai: openaiApiKey,
                anthropic: anthropicApiKey,
                gemini: geminiApiKey,
              }
              const setterMap: Record<AIProvider, (v: string) => void> = {
                openai: setOpenaiApiKey,
                anthropic: setAnthropicApiKey,
                gemini: setGeminiApiKey,
              }
              const isActive = aiProvider === p.value
              return (
                <div
                  key={p.value}
                  className={`space-y-2 rounded-lg p-3 transition-colors ${
                    isActive ? "bg-accent/40 ring-1 ring-border" : ""
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`drawer-key-${p.value}`} className="flex-1">
                      {p.label} API Key
                    </Label>
                    {isActive && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <Input
                      id={`drawer-key-${p.value}`}
                      type={showKeys[p.value] ? "text" : "password"}
                      placeholder={`${p.envVar.toLowerCase().replace(/_/g, "-")} key…`}
                      value={valueMap[p.value]}
                      onChange={(e) => setterMap[p.value](e.target.value)}
                      className="pr-10 font-mono text-sm"
                      autoComplete="off"
                    />
                    <button
                      type="button"
                      onClick={() => toggleKey(p.value)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showKeys[p.value] ? "Hide key" : "Show key"}
                    >
                      {showKeys[p.value] ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Falls back to the server's <code className="font-mono">{p.envVar}</code> env var if blank.
                  </p>
                </div>
              )
            })}

            {/* System prompt */}
            <div className="space-y-2">
              <Label htmlFor="drawer-system-prompt">Custom system prompt</Label>
              <Textarea
                id="drawer-system-prompt"
                placeholder="You are a helpful AI Budget Assistant…"
                value={aiSystemPrompt}
                onChange={(e) => setAiSystemPrompt(e.target.value)}
                rows={5}
                className="resize-y text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Replaces the default instructions. Leave blank to use the default.
              </p>
            </div>

            <div className="flex justify-end border-t border-border pt-4">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save AI settings"}
              </Button>
            </div>
          </form>
        )}
      </SheetContent>
    </Sheet>
  )
}
