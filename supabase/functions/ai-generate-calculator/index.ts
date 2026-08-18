import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })

async function requireAdmin(req: Request): Promise<Response | null> {
  const authHeader = req.headers.get("Authorization")
  if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401)
  const token = authHeader.replace("Bearer ", "")

  const anonClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!
  )
  const { data: { user }, error } = await anonClient.auth.getUser(token)
  if (error || !user) return json({ error: "Unauthorized" }, 401)

  const { data: roleRow } = await anonClient
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle()
  if (!roleRow || roleRow.role !== "admin") return json({ error: "Forbidden" }, 403)
  return null
}

const SYSTEM_PROMPT = `אתה עוזר שיוצר מחשבונים לאתר ישראלי בעברית. המשתמש יתאר מחשבון בשפה חופשית, ואתה תחזיר JSON בדיוק בפורמט הבא - ללא הסברים, ללוואי, רק JSON חוקי:

{
  "title": "שם המחשבון בעברית",
  "short_title": "שם מקוצר",
  "slug": "slug-in-english-kebab-case",
  "category_slug": "salary-tax | health-lifestyle | loans-mortgage | savings-investments | general-tools | rights-benefits | fun-tools | real-estate | car-expenses",
  "description": "תיאור המחשבון בעברית 1-2 משפטים",
  "inputs": [
    {
      "id": "camelCaseId",
      "label": "תווית בעברית",
      "type": "number",
      "placeholder": "לדוגמה: 1000",
      "min": 0,
      "max": 1000000,
      "step": 1,
      "unit": "₪",
      "defaultValue": 1000
    }
  ],
  "formula_code": "const result = {}; result.total = (inputs.amount || 0) * 1.17; return result;",
  "result_labels": { "total": "סכום כולל מע״מ" },
  "quick_answer": { "question": "שאלה נפוצה?", "answer": "תשובה קצרה" },
  "formula_explanation": "הסבר קצר על הנוסחה",
  "example_text": "דוגמה: סכום 1000 ₪ + 17% מע״מ = 1170 ₪",
  "faqs": [
    { "question": "שאלה?", "answer": "תשובה" }
  ],
  "disclaimer": "החישוב הוא הערכה בלבד."
}

חוקים חשובים:
1. formula_code חייב להיות קוד JavaScript תקין שמשתמש ב-inputs (אובייקט עם שמות השדות) ומחזיר אובייקט result
2. כל שדה ב-result חייב להופיע ב-result_labels עם תווית בעברית
3. slug חייב להיות ייחודי, באנגלית, kebab-case
4. אל תשתמש ב-Toast, alert, console.log או פונקציות חיצוניות ב-formula_code
5. החזר רק JSON, בלי markdown, בלי תווים מסביב`

interface GenerateRequest {
  prompt: string
  provider?: "grok" | "ollama" | "auto"
}

async function callProvider(
  provider: string,
  apiKey: string,
  baseUrl: string,
  model: string,
  userPrompt: string
): Promise<string> {
  const url = `${baseUrl}/chat/completions`
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    }),
  })

  if (!resp.ok) {
    const errText = await resp.text()
    throw new Error(`${provider} API error (${resp.status}): ${errText}`)
  }

  const data = await resp.json()
  const content = data.choices?.[0]?.message?.content
  if (!content) throw new Error(`${provider} returned empty response`)
  return content
}

function extractJson(raw: string): unknown {
  let cleaned = raw.trim()
  if (cleaned.startsWith("```json")) cleaned = cleaned.slice(7)
  if (cleaned.startsWith("```")) cleaned = cleaned.slice(3)
  if (cleaned.endsWith("```")) cleaned = cleaned.slice(0, -3)
  cleaned = cleaned.trim()

  const start = cleaned.indexOf("{")
  const end = cleaned.lastIndexOf("}")
  if (start === -1 || end === -1) throw new Error("No JSON object found in response")
  return JSON.parse(cleaned.slice(start, end + 1))
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders })
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405)
  }

  const denied = await requireAdmin(req)
  if (denied) return denied

  try {
    const { prompt, provider: requestedProvider } = await req.json() as GenerateRequest
    if (!prompt || typeof prompt !== "string") {
      return json({ error: "Missing prompt" }, 400)
    }

    const db = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    )

    const { data: providers } = await db
      .from("ai_providers")
      .select("provider, api_key, base_url, default_model, is_active, priority")
      .order("priority", { ascending: true })

    if (!providers || providers.length === 0) {
      return json({ error: "No AI providers configured" }, 500)
    }

    const envKeys: Record<string, string | undefined> = {
      grok: Deno.env.get("XAI_API_KEY"),
      ollama: Deno.env.get("OLLAMA_API_KEY"),
    }

    const pickProvider = () => {
      if (requestedProvider && requestedProvider !== "auto") {
        const p = providers.find(p => p.provider === requestedProvider && p.is_active)
        if (p && (envKeys[p.provider] || p.api_key)) return p
      }
      for (const p of providers) {
        if (!p.is_active) continue
        const key = envKeys[p.provider] || p.api_key
        if (key) return p
      }
      return null
    }

    const chosen = pickProvider()
    if (!chosen) {
      return json({ error: "No active AI provider with an API key" }, 500)
    }

    const apiKey = envKeys[chosen.provider] || chosen.api_key
    if (!apiKey) {
      return json({ error: `Provider ${chosen.provider} has no API key` }, 500)
    }

    const rawResponse = await callProvider(
      chosen.provider,
      apiKey,
      chosen.base_url,
      chosen.default_model,
      prompt
    )

    const calcJson = extractJson(rawResponse) as Record<string, unknown>

    await db.from("ai_providers")
      .update({ last_used_at: new Date().toISOString(), total_calls: (chosen.total_calls ?? 0) + 1 })
      .eq("provider", chosen.provider)

    return json({
      ok: true,
      provider: chosen.provider,
      model: chosen.default_model,
      calculator: calcJson,
    })
  } catch (err) {
    console.error("ai-generate-calculator error:", err)
    return json({ error: err instanceof Error ? err.message : "Internal error" }, 500)
  }
})
