import "jsr:@supabase/functions-js/edge-runtime.d.ts"

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

interface NotifyPayload {
  event: string
  title?: string
  details?: Record<string, unknown>
  url?: string
}

const EMOJI: Record<string, string> = {
  page_view: "👁️",
  calculator_use: "🧮",
  signup: "🎉",
  signin: "🔑",
  signout: "👋",
  contact: "✉️",
  favorite_add: "❤️",
  favorite_remove: "💔",
  saved_item: "🔖",
  error: "⚠️",
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}

function formatMessage(payload: NotifyPayload): string {
  const emoji = EMOJI[payload.event] ?? "🔔"
  const title = escapeHtml(payload.title ?? payload.event)
  const time = new Date().toLocaleString("he-IL", { timeZone: "Asia/Jerusalem" })

  let msg = `<b>${emoji} ${title}</b>\n`
  msg += `<i>🕒 ${escapeHtml(time)}</i>\n`

  if (payload.url) {
    msg += `🔗 <code>${escapeHtml(payload.url)}</code>\n`
  }

  if (payload.details) {
    for (const [key, value] of Object.entries(payload.details)) {
      const display = typeof value === "string" ? value : JSON.stringify(value)
      const truncated = display.length > 200 ? display.slice(0, 200) + "…" : display
      msg += `• <b>${escapeHtml(key)}</b>: ${escapeHtml(truncated)}\n`
    }
  }

  return msg
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders })
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405)
  }

  const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN")
  if (!botToken) {
    console.error("TELEGRAM_BOT_TOKEN not configured")
    return json({ error: "Not configured" }, 500)
  }

  try {
    const payload: NotifyPayload = await req.json()
    if (!payload.event) {
      return json({ error: "Missing event" }, 400)
    }

    const text = formatMessage(payload)

    const tgResp = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: Deno.env.get("TELEGRAM_BOT_ID"),
          text,
          parse_mode: "HTML",
          disable_web_page_preview: true,
        }),
      }
    )

    if (!tgResp.ok) {
      const tgErr = await tgResp.text()
      console.error("Telegram API error:", tgErr)
      return json({ error: "Telegram delivery failed" }, 502)
    }

    return json({ ok: true })
  } catch (err) {
    console.error("telegram-notify error:", err)
    return json({ error: "Internal error" }, 500)
  }
})
