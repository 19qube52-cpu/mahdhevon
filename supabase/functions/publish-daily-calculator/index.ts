import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  try {
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
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
