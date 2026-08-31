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
    const { prompt } = await req.json() as { prompt?: string }
    if (!prompt || typeof prompt !== "string") {
      return json({ error: "Missing prompt" }, 400)
    }

    const apiKey = Deno.env.get("XAI_API_KEY")
    if (!apiKey) {
      return json({ error: "XAI_API_KEY is not configured" }, 500)
    }

    const resp = await fetch("https://api.x.ai/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-imagine-image-quality",
        prompt: prompt,
        n: 1,
        response_format: "url",
      }),
    })

    if (!resp.ok) {
      const errText = await resp.text()
      return json({ error: `xAI image API error (${resp.status}): ${errText}` }, 500)
    }

    const data = await resp.json()
    const imageUrl = data.data?.[0]?.url
    if (!imageUrl) {
      return json({ error: "No image URL in response" }, 500)
    }

    return json({ ok: true, url: imageUrl })
  } catch (err) {
    console.error("ai-generate-image error:", err)
    return json({ error: err instanceof Error ? err.message : "Internal error" }, 500)
  }
})
