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

async function callAi(
  provider: string,
  apiKey: string,
  baseUrl: string,
  model: string,
  userPrompt: string
): Promise<string> {
  const resp = await fetch(`${baseUrl}/chat/completions`, {
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

function extractJson(raw: string): Record<string, unknown> {
  let cleaned = raw.trim()
  if (cleaned.startsWith("```json")) cleaned = cleaned.slice(7)
  if (cleaned.startsWith("```")) cleaned = cleaned.slice(3)
  if (cleaned.endsWith("```")) cleaned = cleaned.slice(0, -3)
  cleaned = cleaned.trim()
  const start = cleaned.indexOf("{")
  const end = cleaned.lastIndexOf("}")
  if (start === -1 || end === -1) throw new Error("No JSON object found")
  return JSON.parse(cleaned.slice(start, end + 1))
}

async function sendTelegramMessage(chatId: string, text: string): Promise<void> {
  const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN")
  if (!botToken) return
  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
  })
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders })
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405)
  }

  const webhookSecret = Deno.env.get("TELEGRAM_WEBHOOK_SECRET")
  const urlPath = new URL(req.url).pathname
  const providedSecret = urlPath.split("/").pop()

  if (webhookSecret && providedSecret && providedSecret !== webhookSecret) {
    return json({ error: "Invalid webhook secret" }, 403)
  }

  const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN")
  const botChatId = Deno.env.get("TELEGRAM_BOT_ID")
  if (!botToken || !botChatId) {
    return json({ error: "Telegram not configured" }, 500)
  }

  try {
    const update = await req.json()
    const message = update.message
    if (!message || !message.text) {
      return json({ ok: true, reason: "not a text message" })
    }

    const chatId = String(message.chat.id)
    const text = message.text.trim()

    const db = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    )

    const logEvent = async (event: string, direction: string, summary: string, logChatId: string | null = null) => {
      try { await db.from("telegram_logs").insert({ event, direction, summary, chat_id: logChatId }) } catch { /* best-effort */ }
    }

    await logEvent("incoming_message", "in", `${message.from?.first_name ?? "Unknown"}: ${text.slice(0, 200)}`, chatId)

    if (text === "/start" || text === "/help") {
      await sendTelegramMessage(
        chatId,
        "שלום! תאר מחשבון שתרצה ליצור ואני אייצר אותו לאתר.\n\nלדוגמה:\nמחשבון המרה מקילומטר למייל\nמחשבון עלות חשמל חודשית לפי צריכה ומחיר"
      )
      return json({ ok: true })
    }

    if (text === "/setup") {
      await logEvent("setup_command", "in", "/setup", chatId)
      const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? ""
      const webhookUrl = `${supabaseUrl}/functions/v1/telegram-webhook`
      const setResp = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: webhookUrl, drop_pending_updates: true }),
      })
      const setResult = await setResp.json()
      await sendTelegramMessage(
        chatId,
        setResult.ok
          ? `✅ Webhook הוגדר!\nכתובת: ${webhookUrl}\n\nעכשיו שלח תיאור של מחשבון ואני אייצר אותו.`
          : `❌ הגדרת webhook נכשלה: ${setResult.description ?? "שגיאה"}`
      )
      return json({ ok: true })
    }

    if (text.startsWith("/")) {
      await sendTelegramMessage(chatId, "פקודה לא מזוהה. שלח תיאור של מחשבון בשפה חופשית.")
      await logEvent("unknown_command", "out", `Unknown: ${text.slice(0, 100)}`, chatId)
      return json({ ok: true })
    }

    await sendTelegramMessage(chatId, "🧠 מייצר מחשבון... זה ייקח כמה שניות.")

    const { data: providers } = await db
      .from("ai_providers")
      .select("provider, api_key, base_url, default_model, is_active, priority")
      .order("priority", { ascending: true })

    if (!providers || providers.length === 0) {
      await sendTelegramMessage(chatId, "❌ אין ספקי AI מוגדרים.")
      return json({ ok: true })
    }

    const envKeys: Record<string, string | undefined> = {
      grok: Deno.env.get("XAI_API_KEY"),
      ollama: Deno.env.get("OLLAMA_API_KEY"),
    }

    const chosen = providers.find(p => {
      if (!p.is_active) return false
      const key = envKeys[p.provider] || p.api_key
      return !!key
    })

    if (!chosen) {
      await sendTelegramMessage(chatId, "❌ אין ספק AI פעיל עם מפתח.")
      return json({ ok: true })
    }

    const apiKey = envKeys[chosen.provider] || chosen.api_key
    if (!apiKey) {
      await sendTelegramMessage(chatId, `❌ לספק ${chosen.provider} אין מפתח API.`)
      return json({ ok: true })
    }

    let calcJson: Record<string, unknown>
    try {
      const rawResponse = await callAi(chosen.provider, apiKey, chosen.base_url, chosen.default_model, text)
      calcJson = extractJson(rawResponse)
    } catch (aiErr) {
      const errMsg = aiErr instanceof Error ? aiErr.message : "שגיאה לא צפויה"
      await sendTelegramMessage(chatId, `❌ שגיאה ביצירת המחשבון: ${errMsg}`)
      return json({ ok: true })
    }

    const slug = String(calcJson.slug ?? "")
    const title = String(calcJson.title ?? "")

    if (!slug || !title) {
      await sendTelegramMessage(chatId, "❌ ה-AI לא החזיר slug או כותרת תקינים.")
      return json({ ok: true })
    }

    const { error: insertError } = await db.from("custom_calculators").upsert({
      slug,
      title,
      short_title: String(calcJson.short_title ?? title),
      category_slug: String(calcJson.category_slug ?? "general-tools"),
      description: String(calcJson.description ?? ""),
      inputs: Array.isArray(calcJson.inputs) ? calcJson.inputs : [],
      formula_code: String(calcJson.formula_code ?? "return {}"),
      result_labels: (calcJson.result_labels ?? {}) as Record<string, string>,
      quick_answer: (calcJson.quick_answer ?? null) as { question: string; answer: string } | null,
      formula_explanation: String(calcJson.formula_explanation ?? ""),
      example_text: String(calcJson.example_text ?? ""),
      faqs: Array.isArray(calcJson.faqs) ? calcJson.faqs : [],
      disclaimer: String(calcJson.disclaimer ?? ""),
      is_active: true,
    })

    if (insertError) {
      await sendTelegramMessage(chatId, `❌ שגיאה בשמירת המחשבון: ${insertError.message}`)
      return json({ ok: true })
    }

    await db.from("ai_providers")
      .update({ last_used_at: new Date().toISOString(), total_calls: 1 })
      .eq("provider", chosen.provider)

    const siteUrl = Deno.env.get("SUPABASE_URL")?.replace(".supabase.co", "") ?? ""
    await logEvent("calc_created", "out", `נוצר: ${title} (/${slug})`, chatId)
    await sendTelegramMessage(
      chatId,
      `✅ המחשבון "${title}" נוצר ופורסם!\n\n` +
      `כתובת: /calculators/${slug}\n` +
      `ספק AI: ${chosen.provider} (${chosen.default_model})\n` +
      `קטגוריה: ${calcJson.category_slug ?? "general-tools"}`
    )

    await sendTelegramMessage(
      botChatId,
      `🆕 מחשבון חדש נוצר דרך טלגרם!\n` +
      `שם: ${title}\n` +
      `כתובת: /calculators/${slug}\n` +
      `משתמש: ${message.from?.first_name ?? "לא ידוע"}`
    )

    return json({ ok: true })
  } catch (err) {
    console.error("telegram-webhook error:", err)
    return json({ error: "Internal error" }, 500)
  }
})
