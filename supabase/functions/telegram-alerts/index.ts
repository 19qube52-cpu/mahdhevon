import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
}

async function sendTelegram(botToken: string, chatId: string, text: string) {
  const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  })
  return res.json()
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders })

  const db = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  )

  try {
    const body = await req.json().catch(() => ({}))
    const action = body.action ?? "stats"

    // Get Telegram config
    const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN") ?? ""
    const { data: chatSetting } = await db.from("site_settings").select("value").eq("key", "telegram_chat_id").single()
    const chatId = chatSetting?.value ?? ""

    if (!botToken || !chatId) {
      return new Response(JSON.stringify({ ok: false, error: "Telegram not configured" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } })
    }

    // Handle incoming Telegram webhook (bot commands)
    if (action === "webhook") {
      const update = body.update ?? {}
      const message = update.message
      if (!message) return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } })

      const text: string = message.text ?? ""
      const fromChatId = String(message.chat.id)

      if (text.startsWith("/status")) {
        const [qRes, pRes] = await Promise.all([
          db.from("calculator_queue").select("status", { count: "exact" }),
          db.from("ai_providers").select("provider, is_active, error_count, total_calls").eq("is_active", true),
        ])
        const pending = (qRes.data ?? []).filter((q: { status: string }) => q.status === "pending").length
        const provList = (pRes.data ?? []).map((p: { provider: string; error_count: number; total_calls: number }) =>
          `  ${p.provider}: ${p.total_calls} calls, ${p.error_count} errors`
        ).join("\n")
        await sendTelegram(botToken, fromChatId,
          `<b>📊 סטטוס chasav.li</b>\n\n⏳ בתור: <b>${pending}</b> מחשבונים\n\n<b>🤖 פרובידרים פעילים:</b>\n${provList || "אין"}`)

      } else if (text.startsWith("/key ")) {
        // Format: /key provider:api_key_value
        const parts = text.slice(5).split(":")
        const provider = parts[0]?.trim()
        const key = parts.slice(1).join(":").trim()
        if (!provider || !key) {
          await sendTelegram(botToken, fromChatId, "❌ פורמט שגוי. השתמש ב: /key provider:api_key")
        } else {
          const { error } = await db.from("ai_providers")
            .update({ api_key: key, is_active: true, error_count: 0, last_error: null, updated_at: new Date().toISOString() })
            .eq("provider", provider)
          if (error) {
            await sendTelegram(botToken, fromChatId, `❌ שגיאה: ${error.message}`)
          } else {
            await sendTelegram(botToken, fromChatId, `✅ מפתח עודכן ל-<b>${provider}</b>`)
          }
        }

      } else if (text.startsWith("/providers")) {
        const { data: providers } = await db.from("ai_providers").select("provider, display_name, is_active, error_count, total_calls, has_key:api_key").order("priority")
        const list = (providers ?? []).map((p: { provider: string; display_name: string; is_active: boolean; error_count: number; total_calls: number; has_key: string | null }) =>
          `${p.is_active ? "✅" : "⭕"} <b>${p.display_name}</b> — ${p.has_key ? "מפתח ✓" : "ללא מפתח"} | ${p.total_calls} calls`
        ).join("\n")
        await sendTelegram(botToken, fromChatId, `<b>🔑 פרובידרי AI</b>\n\n${list}\n\nלהוסיף: /key provider:key`)

      } else {
        await sendTelegram(botToken, fromChatId,
          `<b>פקודות זמינות:</b>\n/status — סטטוס מערכת\n/providers — רשימת פרובידרים\n/key provider:key — עדכון מפתח`)
      }
      return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } })
    }

    // Manual send stats
    if (action === "stats" || action === "publish_alert") {
      const today = new Date().toISOString().split("T")[0]
      const [qRes, todayRes, provRes] = await Promise.all([
        db.from("calculator_queue").select("status"),
        db.from("daily_featured").select("calculator_title, calculator_slug").eq("date", today).maybeSingle(),
        db.from("ai_providers").select("provider, is_active, total_calls").eq("is_active", true),
      ])

      const allItems = qRes.data ?? []
      const pending = allItems.filter((q: { status: string }) => q.status === "pending").length
      const published = allItems.filter((q: { status: string }) => q.status === "published").length
      const totalAiCalls = (provRes.data ?? []).reduce((s: number, p: { total_calls: number }) => s + (p.total_calls ?? 0), 0)

      if (action === "publish_alert" && todayRes) {
        await sendTelegram(botToken, chatId,
          `🚀 <b>מחשבון היום פורסם!</b>\n\n📊 <b>${todayRes.calculator_title}</b>\n🔗 chasav.li/calculators/${todayRes.calculator_slug}\n\n⏳ בתור: ${pending} | 🤖 AI calls: ${totalAiCalls}`)
      } else {
        await sendTelegram(botToken, chatId,
          `📊 <b>סטטוס יומי — chasav.li</b>\n\n⏳ בתור: <b>${pending}</b>\n✅ פורסמו: <b>${published}</b>\n🤖 AI calls סה"כ: <b>${totalAiCalls}</b>\n\nמחשבון היום: ${todayRes ? `<b>${todayRes.calculator_title}</b>` : "לא פורסם עדיין"}`)
      }
    }

    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } })
  } catch (err) {
    console.error("telegram-alerts error:", err)
    return new Response(
      JSON.stringify({ ok: false, error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
