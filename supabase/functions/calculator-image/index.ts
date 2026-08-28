import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js@2"
import { authErrorResponse, requireAdmin } from "../_shared/admin-auth.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
}
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } })
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const style = "Wide 16:9 composition, premium cinematic editorial image, sophisticated modern Israeli fintech visual language, deep navy and electric blue with warm gold accents, dramatic volumetric light, elegant realistic 3D objects, subtle data-inspired geometry, clean focal point, generous negative space, impressive and trustworthy."

async function sha256(bytes: Uint8Array) {
  const hash = await crypto.subtle.digest("SHA-256", Uint8Array.from(bytes))
  return [...new Uint8Array(hash)].map((v) => v.toString(16).padStart(2, "0")).join("")
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders })
  try {
    await requireAdmin(req)
    const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!)
    const body = await req.json()
    const action = String(body.action ?? "list")

    if (action === "list") {
      const { data, error } = await db.from("calculator_media_assets").select("*").order("created_at", { ascending: false }).limit(100)
      if (error) throw error
      const assets = await Promise.all((data ?? []).map(async (asset) => {
        if (asset.approval_status === "approved") return asset
        const { data: signed } = await db.storage.from("calculator-image-drafts").createSignedUrl(asset.storage_path, 3600)
        return { ...asset, preview_url: signed?.signedUrl ?? null }
      }))
      return json({ ok: true, assets })
    }

    if (action === "generate") {
      const calculatorId = String(body.calculator_id ?? "").trim()
      const slug = String(body.calculator_slug ?? "").trim()
      const title = String(body.calculator_title ?? "").trim().slice(0, 160)
      const description = String(body.description ?? "").trim().slice(0, 1000)
      if (!calculatorId || !slugPattern.test(slug) || !title) return json({ ok: false, error: "Invalid calculator fields" }, 400)

      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      const [{ count, error: countError }, { data: budget }] = await Promise.all([
        db.from("calculator_media_assets").select("id", { count: "exact", head: true }).gte("created_at", since),
        db.from("ai_budget_settings").select("daily_image_calls").eq("id", true).maybeSingle(),
      ])
      if (countError) throw countError
      if ((count ?? 0) >= (budget?.daily_image_calls ?? 20)) return json({ ok: false, error: "מכסת התמונות היומית נוצלה" }, 429)

      const apiKey = Deno.env.get("XAI_API_KEY")
      if (!apiKey) return json({ ok: false, error: "XAI_API_KEY is not configured" }, 503)
      const model = Deno.env.get("XAI_IMAGE_MODEL") ?? "grok-imagine-image-2.0"
      const custom = String(body.prompt ?? "").trim().slice(0, 2000)
      const prompt = `Create a unique hero image for an Israeli calculator titled "${title}". Concept: ${description || title}. ${style} ${custom} Absolutely no words, letters, Hebrew, numbers, logos, watermarks, or UI screenshots.`

      const xai = await fetch("https://api.x.ai/v1/images/generations", {
        method: "POST",
        signal: AbortSignal.timeout(180000),
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model, prompt }),
      })
      const generated = await xai.json()
      if (!xai.ok || !generated.data?.[0]?.url) throw new Error(`xAI ${xai.status}: ${generated.error?.message ?? "generation failed"}`)
      const download = await fetch(generated.data[0].url, { signal: AbortSignal.timeout(120000) })
      if (!download.ok) throw new Error(`Image download failed: ${download.status}`)
      const mime = (download.headers.get("content-type") ?? "").split(";")[0]
      if (!["image/jpeg", "image/png", "image/webp"].includes(mime)) throw new Error(`Unsupported image MIME: ${mime}`)
      const bytes = new Uint8Array(await download.arrayBuffer())
      if (!bytes.length || bytes.length > 15 * 1024 * 1024) throw new Error("Invalid image size")
      const checksum = await sha256(bytes)
      const extension = mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : "jpg"
      const storagePath = `${slug}/${crypto.randomUUID()}.${extension}`
      const { error: uploadError } = await db.storage.from("calculator-image-drafts").upload(storagePath, bytes, { contentType: mime, upsert: false })
      if (uploadError) throw uploadError
      const authHeader = req.headers.get("Authorization")!.replace(/^Bearer\s+/i, "")
      const authClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!)
      const { data: authData } = await authClient.auth.getUser(authHeader)
      const { data: asset, error: insertError } = await db.from("calculator_media_assets").insert({
        calculator_id: calculatorId, calculator_slug: slug, calculator_title: title,
        model, prompt, storage_path: storagePath, mime_type: mime, byte_size: bytes.length,
        sha256: checksum, request_id: xai.headers.get("x-request-id"),
        cost_in_usd_ticks: generated.usage?.cost_in_usd_ticks ?? null,
        created_by: authData.user?.id ?? null,
      }).select().single()
      if (insertError) {
        await db.storage.from("calculator-image-drafts").remove([storagePath])
        throw insertError
      }
      await db.from("ai_usage_ledger").insert({ provider: "xai", model, operation: "image", calculator_slug: slug, cost_in_usd_ticks: generated.usage?.cost_in_usd_ticks ?? null, success: true })
      const { data: signed } = await db.storage.from("calculator-image-drafts").createSignedUrl(storagePath, 3600)
      return json({ ok: true, asset: { ...asset, preview_url: signed?.signedUrl ?? null } })
    }

    const id = String(body.id ?? "")
    const { data: asset, error: assetError } = await db.from("calculator_media_assets").select("*").eq("id", id).single()
    if (assetError || !asset) return json({ ok: false, error: "Asset not found" }, 404)

    if (action === "approve") {
      const { data: file, error: downloadError } = await db.storage.from("calculator-image-drafts").download(asset.storage_path)
      if (downloadError) throw downloadError
      const publicPath = `${asset.calculator_slug}/hero.${asset.storage_path.split(".").pop()}`
      const { error: uploadError } = await db.storage.from("calculator-images").upload(publicPath, file, { contentType: asset.mime_type, upsert: true })
      if (uploadError) throw uploadError
      const publicUrl = db.storage.from("calculator-images").getPublicUrl(publicPath).data.publicUrl
      const { error } = await db.from("calculator_media_assets").update({ approval_status: "approved", public_url: publicUrl, reviewed_at: new Date().toISOString() }).eq("id", id)
      if (error) throw error
      return json({ ok: true, public_url: publicUrl })
    }
    if (action === "reject") {
      const { error } = await db.from("calculator_media_assets").update({ approval_status: "rejected", reviewed_at: new Date().toISOString() }).eq("id", id)
      if (error) throw error
      return json({ ok: true })
    }
    return json({ ok: false, error: "Unknown action" }, 400)
  } catch (error) {
    const authResponse = authErrorResponse(error, corsHeaders)
    if (authResponse) return authResponse
    console.error("calculator-image:", error)
    return json({ ok: false, error: error instanceof Error ? error.message : String(error) }, 500)
  }
})
