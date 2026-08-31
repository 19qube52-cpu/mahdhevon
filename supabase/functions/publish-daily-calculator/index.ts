import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } })

/**
 * Publishing mutates the editorial queue, so the caller must be either the daily
 * cron job (service role bearer) or a signed-in admin. Returns an error Response,
 * or null when the caller is allowed.
 */
async function requireCronOrAdmin(req: Request): Promise<Response | null> {
  const authHeader = req.headers.get("Authorization")
  if (!authHeader?.startsWith("Bearer ")) return json({ success: false, error: "Unauthorized" }, 401)
  const token = authHeader.replace("Bearer ", "").trim()

  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  if (token === serviceKey) return null // pg_cron

  const anonClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!)
  const { data: { user }, error } = await anonClient.auth.getUser(token)
  if (error || !user) return json({ success: false, error: "Unauthorized" }, 401)

  const { data: roleRow } = await anonClient
    .from("user_roles").select("role").eq("user_id", user.id).maybeSingle()
  if (!roleRow || roleRow.role !== "admin") return json({ success: false, error: "Forbidden" }, 403)
  return null
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  try {
    const denied = await requireCronOrAdmin(req)
    if (denied) return denied

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    const db = createClient(supabaseUrl, supabaseKey)

    const today = new Date().toISOString().split("T")[0] // YYYY-MM-DD

    // 1. Check if today already has a featured calculator
    const { data: existing } = await db
      .from("daily_featured")
      .select("id, calculator_slug, calculator_title")
      .eq("date", today)
      .maybeSingle()

    if (existing) {
      return new Response(
        JSON.stringify({
          success: true,
          already_published: true,
          date: today,
          calculator: existing,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // 2. Find the next pending item in the queue (lowest position)
    const { data: nextItem, error: fetchError } = await db
      .from("calculator_queue")
      .select("*")
      .eq("status", "pending")
      .order("position", { ascending: true })
      .limit(1)
      .maybeSingle()

    if (fetchError) throw fetchError

    if (!nextItem) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Queue is empty — no pending calculators to publish.",
        }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // 3. Mark the queue item as published
    const { error: updateError } = await db
      .from("calculator_queue")
      .update({
        status: "published",
        published_at: new Date().toISOString(),
      })
      .eq("id", nextItem.id)

    if (updateError) throw updateError

    // 4. Insert into daily_featured
    const { error: insertError } = await db
      .from("daily_featured")
      .insert({
        date: today,
        calculator_slug: nextItem.calculator_slug,
        calculator_id: nextItem.calculator_id,
        calculator_title: nextItem.calculator_title,
      })

    if (insertError) throw insertError

    console.log(`Published calculator: ${nextItem.calculator_title} for ${today}`)

    return new Response(
      JSON.stringify({
        success: true,
        date: today,
        calculator: {
          id: nextItem.calculator_id,
          slug: nextItem.calculator_slug,
          title: nextItem.calculator_title,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (err) {
    console.error("publish-daily-calculator error:", err)
    return json({ success: false, error: "Internal error" }, 500)
  }
})
