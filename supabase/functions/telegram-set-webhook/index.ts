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

    // Get bot token from site_settings or env
    const { data: settings } = await db
      .from("site_settings")
      .select("key, value")
      .in("key", ["telegram_bot_token", "telegram_webhook_url"])

    const map: Record<string, string> = {}
    ;(settings ?? []).forEach((s: { key: string; value: string }) => { map[s.key] = s.value })

    const botToken = map.telegram_bot_token || Deno.env.get("TELEGRAM_BOT_TOKEN") || ""
    const customWebhookUrl = map.telegram_webhook_url || ""

    if (!botToken) {
      return json({ ok: false, error: "Bot Token לא מוגדר. שמור הגדרות טלגרם תחילה." })
    }

    // Determine webhook URL
    let webhookUrl: string
    if (customWebhookUrl) {
      webhookUrl = customWebhookUrl
    } else {
      const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? ""
      const webhookSecret = Deno.env.get("TELEGRAM_WEBHOOK_SECRET") ?? ""
      webhookUrl = webhookSecret
        ? `${supabaseUrl}/functions/v1/telegram-webhook/${webhookSecret}`
        : `${supabaseUrl}/functions/v1/telegram-webhook`
    }

    // Set webhook
    const setResp = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: webhookUrl, drop_pending_updates: true }),
    })
    const setResult = await setResp.json()

    if (!setResult.ok) {
      return json({ ok: false, error: `הגדרת webhook נכשלה: ${setResult.description ?? "שגיאה"}` })
    }

    // Verify by getting webhook info
    const infoResp = await fetch(`https://api.telegram.org/bot${botToken}/getWebhookInfo`)
    const infoData = await infoResp.json()

    // Log to telegram_logs
    try {
      await db.from("telegram_logs").insert({
        event: "webhook_set",
        direction: "out",
        summary: `Webhook set to: ${webhookUrl}`,
      })
    } catch { /* best-effort */ }

    return json({
      ok: true,
      webhook_url: webhookUrl,
      pending_updates: infoData.result?.pending_update_count ?? 0,
      last_error: infoData.result?.last_error_message ?? null,
    })
  } catch (err) {
    console.error("telegram-set-webhook error:", err)
    return json({ error: err instanceof Error ? err.message : "Internal error" }, 500)
  }
})
