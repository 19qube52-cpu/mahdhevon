import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  const denied = await requireAdmin(req)
  if (denied) return denied

  try {
    const db = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    )

    // Get settings from site_settings
    const { data: settings } = await db
      .from("site_settings")
      .select("key, value")
      .in("key", ["telegram_bot_token", "telegram_chat_id"])

    const map: Record<string, string> = {}
    ;(settings ?? []).forEach((s: { key: string; value: string }) => { map[s.key] = s.value })

    const botToken = map.telegram_bot_token || Deno.env.get("TELEGRAM_BOT_TOKEN") || ""
    const chatId = map.telegram_chat_id || Deno.env.get("TELEGRAM_BOT_ID") || ""

    if (!botToken) {
      return json({ ok: false, error: "Bot Token לא מוגדר" })
    }

    // 1. Validate bot token by calling getMe
    const meResp = await fetch(`https://api.telegram.org/bot${botToken}/getMe`)
    const meData = await meResp.json()

    if (!meData.ok) {
      return json({
        ok: false,
        error: `Bot Token לא תקין: ${meData.description ?? "שגיאה"}`,
      })
    }

    const botInfo = {
      username: meData.result.username,
      first_name: meData.result.first_name,
      id: meData.result.id,
    }

    // 2. If chat_id is set, try to send a test message
    let messageStatus: "ok" | "error" | "skipped" = "skipped"
    let messageError: string | null = null

    if (chatId) {
      const sendResp = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: "✅ בדיקת חיבור ממערכת הניהול - הבוט פעיל!",
          parse_mode: "HTML",
        }),
      })
      const sendData = await sendResp.json()
      if (sendData.ok) {
        messageStatus = "ok"
      } else {
        messageStatus = "error"
        messageError = sendData.description ?? "שגיאה לא ידועה"
      }
    }

    // 3. Get webhook info
    const webhookResp = await fetch(`https://api.telegram.org/bot${botToken}/getWebhookInfo`)
    const webhookData = await webhookResp.json()

    return json({
      ok: true,
      bot: botInfo,
      chat_id: chatId || null,
      message_status: messageStatus,
      message_error: messageError,
      webhook: webhookData.ok ? {
        url: webhookData.result.url || "",
        pending_updates: webhookData.result.pending_update_count ?? 0,
        last_error: webhookData.result.last_error_message ?? null,
      } : null,
    })
  } catch (err) {
    console.error("telegram-validate error:", err)
    return json({ error: err instanceof Error ? err.message : "Internal error" }, 500)
  }
})
