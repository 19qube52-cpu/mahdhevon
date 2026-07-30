import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders })

  const db = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  )

  try {
    const body = await req.json()
    const { action } = body

    switch (action) {
      // Save/update provider API key
      case "save_key": {
        const { provider, api_key, is_active, default_model, base_url, priority } = body
        const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
        if (api_key !== undefined) patch.api_key = api_key
        if (is_active !== undefined) patch.is_active = is_active
        if (default_model !== undefined) patch.default_model = default_model
        if (base_url !== undefined) patch.base_url = base_url
        if (priority !== undefined) patch.priority = priority
        // Reset errors when key is saved
        if (api_key) { patch.error_count = 0; patch.last_error = null }

        const { error } = await db.from("ai_providers").update(patch).eq("provider", provider)
        if (error) throw error
        return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } })
      }

      // Test a provider by making a minimal call
      case "test_provider": {
        const { provider } = body
        const { data: p } = await db.from("ai_providers").select("*").eq("provider", provider).single()
        if (!p) throw new Error("Provider not found")
        if (!p.is_active) throw new Error("Provider is not active")

        const key = provider === "grok" ? (p.api_key || Deno.env.get("XAI_API_KEY")) : p.api_key
        if (!key) throw new Error("No API key configured")

        let testResult = ""

        if (provider === "anthropic") {
          const res = await fetch(`${p.base_url}/v1/messages`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
            body: JSON.stringify({ model: p.default_model, max_tokens: 20, messages: [{ role: "user", content: "Reply with one word: working" }] }),
          })
          if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`)
          const d = await res.json(); testResult = d.content[0].text
        } else if (provider === "gemini") {
          const res = await fetch(`${p.base_url}/models/${p.default_model}:generateContent?key=${key}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: "Reply with one word: working" }] }], generationConfig: { maxOutputTokens: 20 } }),
          })
          if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`)
          const d = await res.json(); testResult = d.candidates[0].content.parts[0].text
        } else {
          const res = await fetch(`${p.base_url}/chat/completions`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}`, ...(provider === "openrouter" ? { "HTTP-Referer": "https://chasav.li" } : {}) },
            body: JSON.stringify({ model: p.default_model, max_tokens: 20, messages: [{ role: "user", content: "Reply with one word: working" }] }),
          })
          if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`)
          const d = await res.json(); testResult = d.choices[0].message.content
        }

        await db.from("ai_providers").update({ error_count: 0, last_error: null, total_calls: (p.total_calls ?? 0) + 1, last_used_at: new Date().toISOString() }).eq("provider", provider)
        return new Response(JSON.stringify({ ok: true, message: `✓ ${provider} responds: "${testResult.trim()}"` }), { headers: { ...corsHeaders, "Content-Type": "application/json" } })
      }

      // Save site settings
      case "save_setting": {
        const { key, value } = body
        const { error } = await db.from("site_settings").upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" })
        if (error) throw error
        return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } })
      }

      // Save Telegram secrets
      case "save_telegram": {
        const { bot_token, chat_id } = body
        if (chat_id !== undefined) {
          await db.from("site_settings").upsert({ key: "telegram_chat_id", value: chat_id, is_secret: false, updated_at: new Date().toISOString() }, { onConflict: "key" })
        }
        // bot_token is stored as a Supabase secret (cannot be set via API, must be set manually)
        // We just confirm whether it exists in env
        return new Response(JSON.stringify({ ok: true, bot_token_configured: !!Deno.env.get("TELEGRAM_BOT_TOKEN") }), { headers: { ...corsHeaders, "Content-Type": "application/json" } })
      }

      default:
        return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } })
    }
  } catch (err) {
    return new Response(
      JSON.stringify({ ok: false, error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
