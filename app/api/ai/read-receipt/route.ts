import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { checkReceiptLimit, incrementReceiptUsage } from "@/app/actions/ai-usage"
import OpenAI from "openai"

export const maxDuration = 30

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export type ReceiptData = {
  amount: number | null
  currency: string | null
  merchant: string | null
  category: string | null
  date: string | null
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Auth check
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Rate limit check
  const limitCheck = await checkReceiptLimit()
  if (!limitCheck.allowed) {
    return NextResponse.json(
      {
        error: `Receipt scan limit reached (${limitCheck.used}/${limitCheck.limit} this month). Upgrade to Pro for unlimited scans.`,
        limitReached: true,
      },
      { status: 429 }
    )
  }

  // Parse FormData
  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const file = formData.get("file") as File | null
  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 })
  }

  // Validate file type
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"]
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json(
      { error: "Unsupported file type. Please upload JPG, PNG, or WebP." },
      { status: 400 }
    )
  }

  // Convert to base64
  const arrayBuffer = await file.arrayBuffer()
  const base64 = Buffer.from(arrayBuffer).toString("base64")
  const mediaType = file.type as "image/jpeg" | "image/png" | "image/webp" | "image/gif"

  // Call GPT-4o Vision
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 300,
      messages: [
        {
          role: "system",
          content:
            'You are a receipt parser. Extract data from receipts and return ONLY valid JSON with no extra text or markdown.',
        },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: `data:${mediaType};base64,${base64}`, detail: "low" },
            },
            {
              type: "text",
              text: 'Extract from this receipt: total amount (number only, no currency symbols), currency code (e.g. "PHP", "USD", "EUR" — default "PHP" if unclear), merchant name (string), category (one of: Food, Transport, Shopping, Entertainment, Utilities, Healthcare, Other), date (YYYY-MM-DD format, or null if not visible). Return ONLY this JSON: {"amount": number|null, "currency": string|null, "merchant": string|null, "category": string|null, "date": string|null}',
            },
          ],
        },
      ],
    })

    const raw = response.choices[0]?.message?.content ?? ""

    // Parse JSON — strip any markdown fences if present
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
    let parsed: ReceiptData
    try {
      parsed = JSON.parse(cleaned)
    } catch {
      return NextResponse.json(
        { error: "Could not read receipt. Please fill in the fields manually." },
        { status: 422 }
      )
    }

    // Increment usage after successful extraction
    await incrementReceiptUsage(user.id)

    return NextResponse.json(parsed)
  } catch (err) {
    console.error("[read-receipt] OpenAI error", err instanceof Error ? err.message : err)
    return NextResponse.json(
      { error: "Receipt processing failed. Please fill in the fields manually." },
      { status: 500 }
    )
  }
}
