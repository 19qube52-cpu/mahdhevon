import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js@2"
import { authErrorResponse, requireAdmin } from "../_shared/admin-auth.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
}

type Action =
  | { type: "move"; id: string; dir: "up" | "down"; swapId: string; posA: number; posB: number }
  | { type: "reorder"; items: Array<{ id: string; position: number }> }
  | { type: "publish"; id: string }
  | { type: "skip"; id: string }
  | { type: "restore"; id: string; position: number }
  | { type: "delete"; id: string }
  | { type: "add"; calculator_id: string; calculator_slug: string; calculator_title: string; calculator_category: string | null; position: number }
  | { type: "update"; id: string; fields: Record<string, unknown> }
  | { type: "update_notes"; id: string; notes: string }
  | { type: "skip_featured"; date: string; calculator_slug: string; calculator_id: string; calculator_title: string }

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders })
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } })
  }

  try {
    await requireAdmin(req)
    const db = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    )

    const action: Action = await req.json()

    switch (action.type) {
      case "publish": {
        const { data: item, error: fetchError } = await db.from("calculator_queue").select("*").eq("id", action.id).eq("status", "pending").single()
        if (fetchError || !item) throw fetchError ?? new Error("Calculator is not pending")
        const { data: definition } = await db.from("calculator_definitions").select("slug,status,tests").eq("slug", item.calculator_slug).maybeSingle()
        if (definition) {
          if (!Array.isArray(definition.tests) || definition.tests.length < 2) throw new Error("המחשבון חסר בדיקות נוסחה")
          const { count: imageCount } = await db.from("calculator_media_assets").select("id", { count: "exact", head: true }).eq("calculator_slug", item.calculator_slug).eq("approval_status", "approved")
          if (!imageCount) throw new Error("יש לאשר תמונה לפני פרסום המחשבון")
        }
        const today = new Date().toISOString().split("T")[0]
        const { error: featuredError } = await db.from("daily_featured").upsert({
          date: today,
          calculator_slug: item.calculator_slug,
          calculator_id: item.calculator_id,
          calculator_title: item.calculator_title,
          published_at: new Date().toISOString(),
        }, { onConflict: "date" })
        if (featuredError) throw featuredError
        const { error: updateError } = definition
          ? await db.rpc("publish_calculator", { p_slug: item.calculator_slug })
          : await db.from("calculator_queue").update({ status: "published", published_at: new Date().toISOString() }).eq("id", item.id)
        if (updateError) throw updateError
        await db.from("admin_activity_logs").insert({ action: "publish", entity_type: "calculator", entity_id: item.calculator_slug, status: "success", message: `פורסם: ${item.calculator_title}` })
        break
      }

      case "reorder": {
        if (!Array.isArray(action.items) || action.items.length > 200) throw new Error("Invalid reorder payload")
        const ids = new Set(action.items.map((item) => item.id))
        if (ids.size !== action.items.length || action.items.some((item) => !item.id || !Number.isInteger(item.position) || item.position < 1)) throw new Error("Invalid reorder positions")
        const results = await Promise.all(action.items.map((item) =>
          db.from("calculator_queue").update({ position: item.position }).eq("id", item.id).eq("status", "pending")
        ))
        const failure = results.find((result) => result.error)
        if (failure?.error) throw failure.error
        break
      }

      case "move": {
        const [r1, r2] = await Promise.all([
          db.from("calculator_queue").update({ position: action.posB }).eq("id", action.id),
          db.from("calculator_queue").update({ position: action.posA }).eq("id", action.swapId),
        ])
        if (r1.error) throw r1.error
        if (r2.error) throw r2.error
        break
      }

      case "skip": {
        const { error } = await db.from("calculator_queue").update({ status: "skipped" }).eq("id", action.id)
        if (error) throw error
        break
      }

      case "restore": {
        const { error } = await db.from("calculator_queue").update({ status: "pending", position: action.position }).eq("id", action.id)
        if (error) throw error
        break
      }

      case "delete": {
        const { error } = await db.from("calculator_queue").delete().eq("id", action.id)
        if (error) throw error
        break
      }

      case "add": {
        const { error } = await db.from("calculator_queue").insert({
          calculator_id: action.calculator_id,
          calculator_slug: action.calculator_slug,
          calculator_title: action.calculator_title,
          calculator_category: action.calculator_category,
          position: action.position,
          status: "pending",
        })
        if (error) throw error
        break
      }

      case "update": {
        // Full edit: update any allowed fields on a queue item
        const allowed = ["calculator_title", "calculator_slug", "calculator_id", "calculator_category", "notes", "scheduled_date", "position", "status"]
        const patch: Record<string, unknown> = {}
        for (const key of allowed) {
          if (key in action.fields) patch[key] = action.fields[key]
        }
        const { error } = await db.from("calculator_queue").update(patch).eq("id", action.id)
        if (error) throw error
        break
      }

      case "update_notes": {
        const { error } = await db.from("calculator_queue").update({ notes: action.notes }).eq("id", action.id)
        if (error) throw error
        break
      }

      case "skip_featured": {
        const { error } = await db.from("daily_featured").upsert({
          date: action.date,
          calculator_slug: action.calculator_slug,
          calculator_id: action.calculator_id,
          calculator_title: action.calculator_title,
        }, { onConflict: "date" })
        if (error) throw error
        break
      }

      default:
        return new Response(JSON.stringify({ error: "Unknown action type" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } })
    }

    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } })
  } catch (err) {
    const authResponse = authErrorResponse(err, corsHeaders)
    if (authResponse) return authResponse
    console.error("crm-operations error:", err)
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
