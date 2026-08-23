import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { authErrorResponse, requireAdmin } from "../_shared/admin-auth.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
}

const SYSTEM_PROMPT = `אתה עוזר ישראלי חכם ואדיב שמתמחה בהסבר מכתבים רשמיים לאנשים מבוגרים.
תפקידך הוא לקרוא מכתב ממשרדי ממשלה, ביטוח לאומי, בנקים, קופות חולים ורשויות שונות, ולהסביר אותו בשפה פשוטה, ברורה וחמה.

כתוב תמיד בעברית. השתמש במשפטים קצרים. הימנע ממינוח משפטי-בירוקרטי.

החזר תשובה ב-JSON בדיוק במבנה הבא:
{
  "sender": "שם הגוף ששלח את המכתב (מילה אחת-שתיים, למשל: ביטוח לאומי)",
  "topic": "נושא המכתב בקצרה (משפט אחד)",
  "plainExplanation": "הסבר פשוט ומלא של המכתב. כתוב כאילו אתה מסביר לסבא/סבתא שלך. השתמש בפסקאות קצרות. 3-6 משפטים.",
  "whatToDo": ["פעולה ראשונה שצריך לעשות", "פעולה שנייה אם יש"],
  "importantNumbers": ["סכום 1: 500 ₪", "תאריך 2: 15 לינואר 2025"],
  "urgency": "low",
  "urgencyReason": "הסבר קצר למה דחיפות כזו"
}

כאשר urgency:
- "low" = אין לחץ זמן, אפשר לטפל בשלווה
- "medium" = יש תאריך חשוב אבל לא דחוף מאוד
- "high" = דחוף! צריך לפעול תוך ימים ספורים

אם אין מספיק מידע בתמונה, ציין זאת ב-plainExplanation.`

interface RequestBody {
  imageBase64?: string
  mimeType?: string
  text?: string
}

interface ExplainResult {
  sender: string
  topic: string
  plainExplanation: string
  whatToDo: string[]
  importantNumbers: string[]
  urgency: "low" | "medium" | "high"
  urgencyReason: string
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  try {
    await requireAdmin(req)
    const apiKey = Deno.env.get("XAI_API_KEY")
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "XAI_API_KEY not configured. Please add it to your Supabase secrets." }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const body: RequestBody = await req.json()
    const { imageBase64, mimeType = "image/jpeg", text } = body

    if (!imageBase64 && !text) {
      return new Response(
        JSON.stringify({ error: "Either imageBase64 or text is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Build the message content
    type ContentItem =
      | { type: "text"; text: string }
      | { type: "image_url"; image_url: { url: string; detail: string } }

    const userContent: ContentItem[] = []

    if (imageBase64) {
      userContent.push({
        type: "image_url",
        image_url: {
          url: `data:${mimeType};base64,${imageBase64}`,
          detail: "high",
        },
      })
    }

    userContent.push({
      type: "text",
      text: text
        ? `הנה תוכן המכתב:\n\n${text}\n\nאנא הסבר את המכתב הזה בשפה פשוטה.`
        : "בתמונה יש מכתב רשמי. אנא קרא אותו בקפידה והסבר אותו בשפה פשוטה ומובנת לאדם מבוגר.",
    })

    const xaiResponse = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "grok-4.5",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userContent },
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 1200,
      }),
    })

    if (!xaiResponse.ok) {
      const errText = await xaiResponse.text()
      console.error("xAI API error:", xaiResponse.status, errText)
      return new Response(
        JSON.stringify({ error: `xAI API error: ${xaiResponse.status}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const xaiData = await xaiResponse.json()
    const content = xaiData.choices?.[0]?.message?.content

    if (!content) {
      return new Response(
        JSON.stringify({ error: "Empty response from AI" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    let result: ExplainResult
    try {
      result = JSON.parse(content)
    } catch {
      // If not valid JSON, wrap the text
      result = {
        sender: "מכתב רשמי",
        topic: "הסבר המכתב",
        plainExplanation: content,
        whatToDo: [],
        importantNumbers: [],
        urgency: "medium",
        urgencyReason: "",
      }
    }

    return new Response(
      JSON.stringify({ result }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (err) {
    const authResponse = authErrorResponse(err, corsHeaders)
    if (authResponse) return authResponse
    console.error("Edge function error:", err)
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
