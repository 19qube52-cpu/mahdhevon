import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js@2"
import { authErrorResponse, requireAdmin } from "../_shared/admin-auth.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, X-Telegram-Bot-Api-Secret-Token",
}

interface TelegramResponse<T = unknown> { ok: boolean; result?: T; description?: string; error_code?: number }

async function telegramApi<T>(token: string, method: string, body?: Record<string, unknown>): Promise<T> {
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: body ? "POST" : "GET",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json() as TelegramResponse<T>
  if (!res.ok || !data.ok) throw new Error(`Telegram ${data.error_code ?? res.status}: ${data.description ?? "request failed"}`)
  return data.result as T
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders })
  try {
    const body = await req.json().catch(() => ({}))
    const isWebhook = typeof body.update_id === "number"
    if (isWebhook) {
      const expected = Deno.env.get("TELEGRAM_WEBHOOK_SECRET") ?? ""
      const received = req.headers.get("X-Telegram-Bot-Api-Secret-Token") ?? ""
      if (!expected || received !== expected) return new Response("Unauthorized", { status: 401 })
    } else {
      await requireAdmin(req)
    }

    const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!)
    const token = (Deno.env.get("TELEGRAM_BOT_TOKEN") ?? "").trim()
    const { data: setting } = await db.from("site_settings").select("value").eq("key", "telegram_chat_id").maybeSingle()
    const chatId = String(setting?.value || Deno.env.get("TELEGRAM_CHAT_ID") || "").trim()
    if (!token) throw new Error("TELEGRAM_BOT_TOKEN is missing from Supabase Edge Function secrets")

    const bot = await telegramApi<{ username: string; id: number }>(token, "getMe")
    if (isWebhook) {
      const message = body.message
      if (!message?.chat?.id) return Response.json({ ok: true }, { headers: corsHeaders })
      const fromChatId = String(message.chat.id)
      if (chatId && fromChatId !== chatId) return new Response("Forbidden", { status: 403 })
      const reply = String(message.text ?? "").startsWith("/status")
        ? `✅ <b>המערכת מחוברת</b>\nBot: @${bot.username}`
        : "<b>פקודות זמינות:</b>\n/status — סטטוס חיבור"
      await telegramApi(token, "sendMessage", { chat_id: fromChatId, text: reply, parse_mode: "HTML" })
      return Response.json({ ok: true }, { headers: corsHeaders })
    }

    if (!chatId) throw new Error("Telegram Chat ID is missing; save it in the CRM or set TELEGRAM_CHAT_ID")
    const action = body.action ?? "stats"
    const text = action === "test"
      ? `✅ <b>חיבור Telegram תקין</b>\nBot: @${bot.username}\nChat ID: <code>${chatId}</code>`
      : "📊 <b>chasav.li מחובר ל-Telegram</b>"
    await telegramApi(token, "sendMessage", { chat_id: chatId, text, parse_mode: "HTML" })
    return Response.json({ ok: true, bot: `@${bot.username}`, chat_id: chatId }, { headers: corsHeaders })
  } catch (err) {
    const authResponse = authErrorResponse(err, corsHeaders)
    if (authResponse) return authResponse
    console.error("telegram-alerts error:", err)
    return Response.json({ ok: false, error: err instanceof Error ? err.message : String(err) }, { status: 502, headers: corsHeaders })
  }
})
