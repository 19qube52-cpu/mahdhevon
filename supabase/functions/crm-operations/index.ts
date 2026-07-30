import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
}

type Action =
  | { type: "move"; id: string; dir: "up" | "down"; swapId: string; posA: number; posB: number }
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
    const db = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    )

    const action: Action = await req.json()

    switch (action.type) {
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
    console.error("crm-operations error:", err)
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
