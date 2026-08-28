import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2"
import { authErrorResponse, requireAdmin } from "../_shared/admin-auth.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
}

// ─── Provider types ───────────────────────────────────────────────
interface Provider {
  id: string
  provider: string
  api_key: string | null
  base_url: string | null
  default_model: string
  priority: number
  is_active: boolean
  error_count: number
  total_calls: number
}

// ─── Provider adapters ────────────────────────────────────────────
async function callOpenAICompat(
  provider: Provider, system: string, user: string, maxTokens: number
): Promise<string> {
  const apiKey = provider.provider === "grok"
    ? (provider.api_key || Deno.env.get("XAI_API_KEY"))
    : provider.api_key
  if (!apiKey) throw new Error(`Missing API key for ${provider.provider}`)

  const url = `${provider.base_url}/chat/completions`
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${apiKey}`,
  }
  if (provider.provider === "openrouter") {
    headers["HTTP-Referer"] = "https://chasav.li"
    headers["X-Title"] = "Chasav.li CRM"
  }

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: provider.default_model,
      max_tokens: maxTokens,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  })
  if (!res.ok) throw new Error(`${provider.provider} ${res.status}: ${await res.text()}`)
  const data = await res.json()
  return data.choices[0].message.content.trim()
}

async function callAnthropic(
  provider: Provider, system: string, user: string, maxTokens: number
): Promise<string> {
  if (!provider.api_key) throw new Error("Missing Anthropic API key")
  const res = await fetch(`${provider.base_url}/v1/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": provider.api_key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: provider.default_model,
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: user }],
    }),
  })
  if (!res.ok) throw new Error(`anthropic ${res.status}: ${await res.text()}`)
  const data = await res.json()
  return data.content[0].text.trim()
}

async function callGemini(
  provider: Provider, system: string, user: string, maxTokens: number
): Promise<string> {
  if (!provider.api_key) throw new Error("Missing Gemini API key")
  const url = `${provider.base_url}/models/${provider.default_model}:generateContent?key=${provider.api_key}`
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: `${system}\n\n${user}` }] }],
      generationConfig: { maxOutputTokens: maxTokens },
    }),
  })
  if (!res.ok) throw new Error(`gemini ${res.status}: ${await res.text()}`)
  const data = await res.json()
  return data.candidates[0].content.parts[0].text.trim()
}

// ─── Multi-provider dispatcher ────────────────────────────────────
async function callAI(
  db: SupabaseClient<any, "public", "public", any, any>,
  system: string,
  user: string,
  maxTokens = 800
): Promise<{ text: string; provider: string; model: string }> {
  const since = new Date(Date.now() - 86400000).toISOString()
  const [{ data: budget }, { count }] = await Promise.all([
    db.from("ai_budget_settings").select("daily_text_calls").eq("id", true).maybeSingle(),
    db.from("ai_usage_ledger").select("id", { count: "exact", head: true }).eq("operation", "text").gte("created_at", since),
  ])
  if ((count ?? 0) >= (budget?.daily_text_calls ?? 100)) throw new Error("מכסת יצירת הטקסט היומית נוצלה")
  const { data } = await db
    .from("ai_providers")
    .select("*")
    .eq("is_active", true)
    .order("priority", { ascending: true })

  const providers = (data ?? []) as Provider[]
  if (!providers.length) {
    // Hardcoded fallback to Grok env key
    const xaiKey = Deno.env.get("XAI_API_KEY")
    if (!xaiKey) throw new Error("No active AI providers configured")
    const fallback: Provider = {
      id: "fallback", provider: "grok", api_key: xaiKey,
      base_url: "https://api.x.ai/v1", default_model: "grok-3-latest",
      priority: 0, is_active: true, error_count: 0, total_calls: 0
    }
    const text = await callOpenAICompat(fallback, system, user, maxTokens)
    return { text, provider: "grok", model: "grok-3-latest" }
  }

  let lastError: Error | null = null
  for (const provider of providers) {
    try {
      let text: string
      if (provider.provider === "anthropic") {
        text = await callAnthropic(provider, system, user, maxTokens)
      } else if (provider.provider === "gemini") {
        text = await callGemini(provider, system, user, maxTokens)
      } else {
        text = await callOpenAICompat(provider, system, user, maxTokens)
      }
      // Success — reset error count and record usage
      await db.from("ai_providers").update({
        error_count: 0, last_error: null,
        last_used_at: new Date().toISOString(),
        total_calls: (provider.total_calls ?? 0) + 1,
      }).eq("id", provider.id)
      await db.from("ai_usage_ledger").insert({ provider: provider.provider, model: provider.default_model, operation: "text", success: true })
      return { text, provider: provider.provider, model: provider.default_model }
    } catch (err) {
      lastError = err as Error
      await db.from("ai_providers").update({
        error_count: (provider.error_count ?? 0) + 1,
        last_error: lastError.message,
      }).eq("id", provider.id)
      console.warn(`Provider ${provider.provider} failed:`, lastError.message)
      await db.from("ai_usage_ledger").insert({ provider: provider.provider, model: provider.default_model, operation: "text", success: false })
    }
  }
  throw lastError ?? new Error("All AI providers failed")
}

// ─── System prompts ───────────────────────────────────────────────
const SYS_HE = `אתה עוזר מומחה לשיווק דיגיטלי ו-SEO עבור אתר מחשבונים פיננסיים ישראלי.
כתוב תמיד בעברית תקנית, בגוף שלישי, בטון מקצועי ונגיש. אל תוסיף מבוא מיותר.`

const SYS_PLAN = `אתה יועץ אסטרטגי לניהול תוכן דיגיטלי. האתר הוא chasav.li — אתר מחשבונים פיננסיים בישראל.
ענה בעברית, בצורה מעשית ותמציתית.`

const SYS_DOMAIN = `אתה יועץ פיננסי ישראלי מנוסה עם ידע עמוק בנדל"ן, רכב, ביטוח, פנסיה והשקעות.
ענה בעברית עממית, עם מספרים ספציפיים לשוק הישראלי, וציין תמיד שההמלצות כלליות בלבד ולא מהוות ייעוץ פיננסי רשמי.`

const CALCULATOR_SYSTEM = `You design complete Hebrew RTL calculators. Return ONLY valid JSON, without markdown.
The JSON must contain: slug (lowercase English kebab-case), title, category_slug, description, inputs, formula, result_config, content, tests.
inputs: 1-5 items with id (English camelCase), label (Hebrew), type number or range, sensible min/max/step/defaultValue, optional unit and helpText.
formula is a safe expression tree. Allowed leaves: {"op":"input","id":"..."}, {"op":"const","value":number}. Allowed multi ops: add,sub,mul,div,min,max,pow with args array. Allowed unary ops: round,floor,ceil,abs with arg.
result_config: label in Hebrew, optional unit/prefix/suffix, decimals 0-2.
content: explanation, example, disclaimer and faqs array of 3 Hebrew question/answer objects.
tests: 3-6 objects with name, inputs object and expected number. Include zero/boundary and a realistic case.
Build a genuinely useful working calculator from the title. For lifetime-time questions, ask current age plus relevant average frequency/duration and calculate the lifetime total. Do not use current laws or rates unless the title requires them.`

function parseJson(text: string) {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "")
  return JSON.parse(cleaned)
}

function validateDefinition(value: any) {
  if (!value || typeof value !== "object") throw new Error("AI returned an invalid calculator")
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.slug ?? "")) throw new Error("AI returned an invalid slug")
  if (typeof value.title !== "string" || typeof value.description !== "string") throw new Error("AI omitted calculator content")
  if (!Array.isArray(value.inputs) || value.inputs.length < 1 || value.inputs.length > 5) throw new Error("AI returned invalid inputs")
  const inputIds = new Set(value.inputs.map((input: any) => input.id))
  if (inputIds.size !== value.inputs.length || value.inputs.some((input: any) => !/^[A-Za-z][A-Za-z0-9]*$/.test(input.id) || !["number", "range"].includes(input.type))) throw new Error("AI returned invalid input fields")
  let nodes = 0
  const visit = (node: any, depth = 0) => {
    nodes++
    if (!node || depth > 20 || nodes > 100) throw new Error("AI formula is too complex")
    if (node.op === "const" && Number.isFinite(node.value)) return
    if (node.op === "input" && inputIds.has(node.id)) return
    if (["round", "floor", "ceil", "abs"].includes(node.op)) return visit(node.arg, depth + 1)
    if (["add", "sub", "mul", "div", "min", "max", "pow"].includes(node.op) && Array.isArray(node.args) && node.args.length >= 1 && node.args.length <= 10) return node.args.forEach((child: any) => visit(child, depth + 1))
    throw new Error("AI returned an unsafe formula")
  }
  visit(value.formula)
  if (!Array.isArray(value.tests) || value.tests.length < 2 || value.tests.length > 8) throw new Error("AI omitted formula tests")
  const evaluate = (node: any, inputs: Record<string, number>, depth = 0): number => {
    if (depth > 20) throw new Error("formula depth")
    if (node.op === "const") return Number(node.value)
    if (node.op === "input") return Number(inputs[node.id] ?? 0)
    if (["round", "floor", "ceil", "abs"].includes(node.op)) { const n = evaluate(node.arg, inputs, depth + 1); return node.op === "round" ? Math.round(n) : node.op === "floor" ? Math.floor(n) : node.op === "ceil" ? Math.ceil(n) : Math.abs(n) }
    const args = node.args.map((child: any) => evaluate(child, inputs, depth + 1))
    if (node.op === "add") return args.reduce((a: number, b: number) => a + b, 0)
    if (node.op === "sub") return args.slice(1).reduce((a: number, b: number) => a - b, args[0] ?? 0)
    if (node.op === "mul") return args.reduce((a: number, b: number) => a * b, 1)
    if (node.op === "div") return args.slice(1).reduce((a: number, b: number) => b === 0 ? NaN : a / b, args[0] ?? 0)
    if (node.op === "min") return Math.min(...args)
    if (node.op === "max") return Math.max(...args)
    return Math.pow(args[0] ?? 0, args[1] ?? 1)
  }
  for (const test of value.tests) {
    if (!test || typeof test.name !== "string" || !test.inputs || !Number.isFinite(test.expected)) throw new Error("AI returned invalid formula tests")
    const actual = evaluate(value.formula, test.inputs)
    const tolerance = Math.max(0.01, Math.abs(test.expected) * 0.001)
    if (!Number.isFinite(actual) || Math.abs(actual - test.expected) > tolerance) throw new Error(`בדיקת הנוסחה נכשלה: ${test.name}`)
  }
  return value
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders })

  const db = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  )

  try {
    const body = await req.json()
    await requireAdmin(req)
    const { action, calculator_id, calculator_title, queue, context } = body

    let resultText = ""
    let createdCalculator: any = null
    let usedProvider = ""
    let usedModel = ""

    const ai = async (sys: string, user: string, tokens = 800) => {
      const r = await callAI(db, sys, user, tokens)
      usedProvider = r.provider
      usedModel = r.model
      return r.text
    }

    const log = async (actionName: string, entityId: string | null, status: "success" | "error", message: string, metadata: Record<string, unknown> = {}) => {
      await db.from("admin_activity_logs").insert({ action: actionName, entity_type: "calculator", entity_id: entityId, status, message, metadata })
    }

    const saveDraft = async (definition: any, queueId: string | null, summary: string) => {
      definition.calculator_id = definition.slug
      const { data, error } = await db.rpc("save_calculator_draft", { p_definition: definition, p_queue_id: queueId, p_change_summary: summary })
      if (error) throw error
      return data
    }

    switch (action) {
      case "create_calculator": {
        const title = String(calculator_title ?? "").trim().slice(0, 160)
        if (title.length < 3) throw new Error("יש להזין כותרת למחשבון")
        const { data: duplicate } = await db.from("calculator_definitions").select("slug,title,status").ilike("title", title).limit(1).maybeSingle()
        if (duplicate) throw new Error(`כבר קיים מחשבון דומה: ${duplicate.title} (${duplicate.slug}). פתח אותו ובקש שינוי במקום ליצור כפילות`)
        const raw = await ai(CALCULATOR_SYSTEM, `Create a complete calculator for this exact idea: ${title}`, 2600)
        const definition = validateDefinition(parseJson(raw))
        definition.title = title
        definition.category_slug = String(definition.category_slug || "general-tools").slice(0, 80)
        const calculatorId = definition.slug
        definition.calculator_id = calculatorId
        createdCalculator = await saveDraft(definition, null, `יצירת טיוטה: ${title}`)
        await log("create_draft", definition.slug, "success", `נוצרה טיוטה מלאה: ${title}`, { provider: usedProvider, model: usedModel })
        resultText = "המחשבון המלא נוצר בהצלחה"
        break
      }

      case "complete_calculator": {
        const slug = String(context?.slug ?? "")
        const { data: item, error } = await db.from("calculator_queue").select("*").eq("calculator_slug", slug).order("added_at", { ascending: false }).limit(1).single()
        if (error || !item) throw new Error("המחשבון הישן לא נמצא")
        const raw = await ai(CALCULATOR_SYSTEM, `Complete this existing calculator. Keep exact slug ${slug} and exact title: ${item.calculator_title}`, 2600)
        const definition = validateDefinition(parseJson(raw)); definition.slug = slug; definition.title = item.calculator_title; definition.calculator_id = item.calculator_id
        createdCalculator = await saveDraft(definition, item.id, `השלמת מחשבון ישן: ${item.calculator_title}`)
        await log("complete_legacy", slug, "success", `הושלם מחשבון ישן: ${item.calculator_title}`)
        resultText = "המחשבון הישן הושלם ונשמר כטיוטה"
        break
      }

      case "refine_calculator": {
        const slug = String(context?.slug ?? "")
        const instruction = String(context?.instruction ?? "").trim().slice(0, 1000)
        const { data: current, error } = await db.from("calculator_definitions").select("*").eq("slug", slug).single()
        if (error || !current) throw new Error("הטיוטה לא נמצאה")
        const raw = await ai(CALCULATOR_SYSTEM, `Revise this calculator according to the Hebrew instruction. Keep the exact slug and return the complete updated JSON.\nInstruction: ${instruction}\nCurrent: ${JSON.stringify(current)}`, 3000)
        const definition = validateDefinition(parseJson(raw)); definition.slug = slug; definition.calculator_id = current.calculator_id
        createdCalculator = await saveDraft(definition, null, instruction)
        await log("refine_draft", slug, "success", `הטיוטה עודכנה: ${instruction}`, { version: createdCalculator.version })
        resultText = "הטיוטה עודכנה ונשמרה כגרסה חדשה"
        break
      }

      case "publish_calculator": {
        const slug = String(context?.slug ?? "")
        const [{ data: definition }, { count: imageCount }] = await Promise.all([
          db.from("calculator_definitions").select("tests").eq("slug", slug).single(),
          db.from("calculator_media_assets").select("id", { count: "exact", head: true }).eq("calculator_slug", slug).eq("approval_status", "approved"),
        ])
        if (!Array.isArray(definition?.tests) || definition.tests.length < 2) throw new Error("המחשבון חסר בדיקות נוסחה")
        if (!imageCount) throw new Error("יש לאשר תמונה לפני פרסום המחשבון")
        const { error } = await db.rpc("publish_calculator", { p_slug: slug })
        if (error) throw error
        await log("publish", slug, "success", "המחשבון פורסם")
        resultText = "המחשבון פורסם בהצלחה"
        break
      }

      case "archive_calculator": {
        const slug = String(context?.slug ?? "")
        const { error } = await db.from("calculator_definitions").update({ status: "archived", updated_at: new Date().toISOString() }).eq("slug", slug)
        if (error) throw error
        await db.from("calculator_queue").update({ status: "skipped" }).eq("calculator_slug", slug).eq("status", "pending")
        await log("archive", slug, "success", "המחשבון הועבר לארכיון")
        resultText = "המחשבון הועבר לארכיון וניתן לשחזור מהיסטוריית הגרסאות"
        break
      }

      case "restore_version": {
        const versionId = String(context?.version_id ?? "")
        const { data: version, error } = await db.from("calculator_definition_versions").select("snapshot,calculator_definition_id").eq("id", versionId).single()
        if (error || !version) throw new Error("הגרסה לא נמצאה")
        const snapshot = version.snapshot; snapshot.status = "draft"
        createdCalculator = await saveDraft(snapshot, null, `שחזור גרסה ${snapshot.version}`)
        await log("restore_version", snapshot.slug, "success", "שוחזרה גרסה קודמת")
        resultText = "הגרסה שוחזרה כטיוטה חדשה"
        break
      }

      case "admin_state": {
        const slug = String(context?.slug ?? "")
        const [definitions, versions, logs, usage] = await Promise.all([
          db.from("calculator_definitions").select("*").order("updated_at", { ascending: false }).limit(100),
          slug ? db.from("calculator_definition_versions").select("*").eq("calculator_definition_id", context?.definition_id).order("version", { ascending: false }) : Promise.resolve({ data: [] }),
          db.from("admin_activity_logs").select("*").order("created_at", { ascending: false }).limit(100),
          db.from("ai_usage_ledger").select("*").gte("created_at", new Date(Date.now() - 86400000).toISOString()),
        ])
        return new Response(JSON.stringify({ ok: true, definitions: definitions.data ?? [], versions: versions.data ?? [], logs: logs.data ?? [], usage: usage.data ?? [] }), { headers: { ...corsHeaders, "Content-Type": "application/json" } })
      }
      // ── 1. סיכום ──────────────────────────────────────────────
      case "summary":
        resultText = await ai(SYS_HE, `כתוב משפט סיכום אחד (עד 20 מילים) שמסביר מה עושה המחשבון: "${calculator_title}". רק המשפט, ללא נקודה בסוף.`, 80)
        break

      // ── 2. SEO ────────────────────────────────────────────────
      case "seo_description":
        resultText = await ai(SYS_HE, `כתוב תיאור meta description לדף המחשבון "${calculator_title}". אורך: 140-160 תווים. כלול מילות מפתח. פנייה ישירה לגולש.`, 200)
        break

      // ── 3. מאמר ──────────────────────────────────────────────
      case "article":
        resultText = await ai(SYS_HE, `כתוב מאמר SEO מלא בעברית על "${calculator_title}" בפורמט Markdown. כותרת H1, הקדמה, 3-4 פסקאות עם H2, FAQ, סיכום. כ-500 מילים.`, 1400)
        break

      // ── 4. כותרות חלופיות ─────────────────────────────────────
      case "title_variants":
        resultText = await ai(SYS_HE, `צור 5 כותרות חלופיות בעברית לדף "${calculator_title}". סגנונות: SEO, שאלתי, ישיר, פתרון-בעיה, רגשי. מספור בשורות נפרדות.`, 300)
        break

      // ── 5. תגיות ──────────────────────────────────────────────
      case "auto_tags":
        resultText = await ai(SYS_HE, `צור 8-10 תגיות רלוונטיות למחשבון "${calculator_title}". מילים מופרדות בפסיק, בעברית ואנגלית, ללא #.`, 150)
        break

      // ── 6. פוסט חברתי ─────────────────────────────────────────
      case "social_post": {
        const platform = context?.platform ?? "LinkedIn"
        resultText = await ai(SYS_HE, `כתוב פוסט ל-${platform} על "${calculator_title}". ידידותי, 80-120 מילים, CTA ברור, 2-3 האשטאגים בסוף.`, 400)
        break
      }

      // ── 7. קהל יעד ────────────────────────────────────────────
      case "audience":
        resultText = await ai(SYS_HE, `נתח קהל יעד למחשבון "${calculator_title}": פרסונה, צורך, תזמון, עצה שיווקית. עד 120 מילים.`, 350)
        break

      // ── 8. FAQ ────────────────────────────────────────────────
      case "faq":
        resultText = await ai(SYS_HE, `צור 5 שאלות FAQ למחשבון "${calculator_title}". שאלות אמיתיות, תשובות 2-3 משפטים. פורמט Markdown: **שאלה:** ותשובה.`, 700)
        break

      // ── 9. תכנון עונתי ────────────────────────────────────────
      case "seasonal_plan": {
        const month = new Date().toLocaleString("he-IL", { month: "long", timeZone: "Asia/Jerusalem" })
        const list = (queue ?? []).slice(0, 15).map((q: { calculator_title: string }, i: number) => `${i + 1}. ${q.calculator_title}`).join("\n")
        resultText = await ai(SYS_PLAN, `חודש: ${month}. תור:\n${list}\n\nמה הכי רלוונטי לחודש ${month} מבחינת עונתיות ישראלית? המלצה מסודרת עם הסבר קצר.`, 500)
        break
      }

      // ── 10. תזמון חכם ─────────────────────────────────────────
      case "smart_schedule": {
        const list = (queue ?? []).slice(0, 20).map((q: { calculator_title: string; position: number }) => `#${q.position}: ${q.calculator_title}`).join("\n")
        resultText = await ai(SYS_PLAN, `תור:\n${list}\n\nהצע סדר פרסום ל-3 שבועות הקרובים. שקול: עונתיות ישראלית, ימי שישי (פחות גלישה), מגוון קטגוריות.`, 600)
        break
      }

      // ── 11. ניתוח רכישת דירה ──────────────────────────────────
      case "apartment_analysis": {
        const { price, income, savings, city } = context ?? {}
        resultText = await ai(SYS_DOMAIN,
          `ניתוח רכישת דירה ישראלית:\n- מחיר: ${price ? `₪${price.toLocaleString()}` : "לא צוין"}\n- הכנסה חודשית: ${income ? `₪${income.toLocaleString()}` : "לא צוינה"}\n- הון עצמי: ${savings ? `₪${savings.toLocaleString()}` : "לא צוין"}\n- עיר: ${city ?? "לא צוינה"}\n\nספק: 1) האם ההלוואה אפשרית (כלל 30% מהכנסה), 2) גובה משכנתא מקסימלי מומלץ, 3) עצות לרוכשים ראשונים, 4) תשלומים נוספים לצפות (מס רכישה, שיפוץ, עו"ד). עד 200 מילים.`, 600)
        break
      }

      // ── 12. עוזר רכישת רכב ────────────────────────────────────
      case "car_analysis": {
        const { budget, km, year, model: carModel, financeType } = context ?? {}
        resultText = await ai(SYS_DOMAIN,
          `ניתוח רכישת רכב ישראלי:\n- תקציב: ${budget ? `₪${budget.toLocaleString()}` : "לא צוין"}\n- ק"מ: ${km ? km.toLocaleString() : "לא צוין"}\n- שנה: ${year ?? "לא צוינה"}\n- דגם: ${carModel ?? "לא צוין"}\n- מימון: ${financeType ?? "לא צוין"}\n\nספק: 1) הערכת עלות בעלות שנתית (ביטוח+תחזוקה+דלק), 2) הערכת ירידת ערך, 3) האם המחיר הגיוני לשוק, 4) עצות למשא ומתן. עד 200 מילים.`, 600)
        break
      }

      // ── 13. יועץ ביטוח ────────────────────────────────────────
      case "insurance_advisor": {
        const { age, family_status, assets, income: inc, domain } = context ?? {}
        resultText = await ai(SYS_DOMAIN,
          `פרופיל לביטוח:\n- גיל: ${age ?? "לא צוין"}\n- מצב משפחתי: ${family_status ?? "לא צוין"}\n- נכסים: ${assets ?? "לא צוין"}\n- הכנסה: ${inc ? `₪${inc.toLocaleString()}` : "לא צוינה"}\n- תחום: ${domain ?? "כללי"}\n\nהמלץ על: 1) ביטוח חיים (כמה?), 2) ביטוח בריאות (איזה מסלול?), 3) ביטוח רכוש, 4) ביטוח אחריות. כלול סכומי כיסוי משוערים. עד 200 מילים.`, 600)
        break
      }

      // ── 14. מתכנן פרישה ───────────────────────────────────────
      case "retirement_plan": {
        const { current_age, retirement_age, monthly_savings, pension_balance } = context ?? {}
        resultText = await ai(SYS_DOMAIN,
          `תכנון פרישה:\n- גיל נוכחי: ${current_age ?? "לא צוין"}\n- גיל פרישה מבוקש: ${retirement_age ?? 67}\n- חיסכון חודשי: ${monthly_savings ? `₪${monthly_savings.toLocaleString()}` : "לא צוין"}\n- יתרת קרן פנסיה: ${pension_balance ? `₪${pension_balance.toLocaleString()}` : "לא צוינה"}\n\nספק: 1) תחזית קצבה חודשית בפרישה (ריאלי), 2) פער צפוי מרמת חיים, 3) המלצות להגדלת החיסכון, 4) מוצרים פנסיוניים מומלצים בישראל. עד 200 מילים.`, 600)
        break
      }

      // ── 15. ניתוח השקעות ──────────────────────────────────────
      case "investment_analysis": {
        const { amount, horizon, risk_level, goal } = context ?? {}
        resultText = await ai(SYS_DOMAIN,
          `ניתוח השקעה:\n- סכום: ${amount ? `₪${amount.toLocaleString()}` : "לא צוין"}\n- אופק: ${horizon ?? "לא צוין"} שנים\n- רמת סיכון: ${risk_level ?? "בינונית"}\n- מטרה: ${goal ?? "חיסכון"}\n\nספק: 1) הקצאת נכסים מומלצת (אחוזים), 2) תשואה ריאלית צפויה, 3) הצבר חזוי (טבלה), 4) כלי השקעה רלוונטיים בישראל (קרנות, תיק מנוהל, IRA). עד 200 מילים.`, 600)
        break
      }

      // ── 16. ניתוח תוצאת מחשבון אישי ──────────────────────────
      case "calc_explain": {
        const { summary, inputs } = context ?? {}
        const inputLines = inputs && typeof inputs === "object"
          ? Object.entries(inputs).map(([k, v]) => `- ${k}: ${v}`).join("\n")
          : "לא צוינו נתונים"
        resultText = await ai(SYS_DOMAIN,
          `הגולש השתמש במחשבון "${calculator_title}".\nהנתונים שהזין:\n${inputLines}\n\nהתוצאה: ${summary ?? "לא צוינה"}\n\nהסבר לגולש בעברית פשוטה וברורה: 1) מה התוצאה אומרת עליו באופן מעשי, 2) 2-3 עצות פרקטיות לשיפור המצב, 3) על מה כדאי לשים לב או להיזהר. דבר ישירות אל הגולש בגוף שני, בטון חם ומקצועי. עד 180 מילים.`, 550)
        break
      }

      default:
        return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } })
    }

    // Cache result (skip queue-wide actions)
    const noCache = ["seasonal_plan", "smart_schedule", "apartment_analysis", "car_analysis", "insurance_advisor", "retirement_plan", "investment_analysis", "calc_explain"]
    if (calculator_id && !noCache.includes(action)) {
      await db.from("ai_content").insert({
        calculator_id, content_type: action, content: resultText, model: usedModel, prompt_tokens: 0,
      })
    }

    return new Response(
      JSON.stringify({ ok: true, result: resultText, calculator: createdCalculator, provider: usedProvider, model: usedModel }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (err) {
    const authResponse = authErrorResponse(err, corsHeaders)
    if (authResponse) return authResponse
    console.error("ai-crm-assistant error:", err)
    return new Response(
      JSON.stringify({ ok: false, error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
