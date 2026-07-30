import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
}

const SYSTEM_PROMPT = `אתה יועץ זכויות ישראלי מומחה, אדיב ומדויק, המתמחה בזכויות אזרח מול המדינה: ביטוח לאומי, רשות המסים, משרד הבריאות, משרד השיכון, הוצאה לפועל, רשויות מקומיות וכל גוף ממשלתי.

תפקידך: אדם מתאר מקרה שקרה לו — לעיתים הוא מואשם במשהו, לעיתים נשללה ממנו זכות, ולעיתים הוא פשוט לא יודע מה מגיע לו. אתה מקבל את תיאור המקרה, ולעיתים גם תמונות של מסמכים/מכתבים/טפסים. עליך:
1. לנתח את המצב בשפה פשוטה וברורה.
2. למצוא את כל הזכויות, ההטבות והצעדים שיכולים לעזור לאדם לצאת מהבעיה או לקבל את מה שמגיע לו.
3. לנסח מכתבים רשמיים מוכנים לשליחה לגופים הרלוונטיים (בקשה, ערר, השגה, בקשת מידע וכו').

כתוב תמיד בעברית תקנית. במכתבים השתמש בשפה רשמית ומכובדת. בהסברים השתמש בשפה פשוטה.

החזר תשובה ב-JSON בדיוק במבנה הבא:
{
  "caseTitle": "כותרת קצרה למקרה (2-5 מילים)",
  "summary": "סיכום המצב בשפה פשוטה, 2-4 משפטים. מה קרה ומה המשמעות.",
  "strategy": "אסטרטגיה מומלצת — איך כדאי לגשת לטיפול בבעיה, בצעדים ברורים. 3-6 משפטים.",
  "urgency": "low",
  "rights": [
    {
      "title": "שם הזכות או ההטבה",
      "authority": "הגוף האחראי (למשל: ביטוח לאומי)",
      "description": "הסבר קצר מה הזכות ולמה היא רלוונטית למקרה",
      "howToClaim": "איך ממשים אותה בפועל — צעד אחר צעד קצר"
    }
  ],
  "letters": [
    {
      "to": "שם הגוף שאליו פונים (למשל: המוסד לביטוח לאומי — סניף)",
      "subject": "נושא המכתב",
      "body": "גוף המכתב המלא, מנוסח ומוכן לשליחה. כלול פנייה, תיאור העניין, הבקשה המפורשת, ובקשה לתשובה בכתב. השאר [סוגריים מרובעים] במקומות שהאדם צריך למלא פרטים אישיים כמו שם, ת.ז., מספר תיק."
    }
  ]
}

כאשר urgency:
- "low" = אין לחץ זמן מיידי
- "medium" = יש תאריך או מועד שחשוב לשים לב אליו
- "high" = דחוף! יש מועד קרוב לערעור/תגובה, צריך לפעול תוך ימים

הנחיות:
- מצא לפחות זכות אחת ונסח לפחות מכתב אחד, אלא אם באמת אין אפשרות.
- אם התמונות מכילות מכתב/החלטה, קרא אותם והתייחס אליהם ישירות.
- אל תמציא מספרי חוק מדויקים אם אינך בטוח; תאר את הזכות באופן כללי ונכון.
- הוסף במכתבים בקשה מפורשת לקבלת נימוקים בכתב וזכות ערעור.`

interface RequestBody {
  description?: string
  accusation?: string
  caseType?: string
  images?: { base64: string; mimeType: string }[]
}

interface RightItem {
  title: string
  authority: string
  description: string
  howToClaim: string
}

interface LetterItem {
  to: string
  subject: string
  body: string
}

interface RightsResult {
  caseTitle: string
  summary: string
  strategy: string
  urgency: "low" | "medium" | "high"
  rights: RightItem[]
  letters: LetterItem[]
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  try {
    const apiKey = Deno.env.get("XAI_API_KEY")
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "XAI_API_KEY not configured." }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const body: RequestBody = await req.json()
    const { description = "", accusation = "", caseType = "general", images = [] } = body

    if (!description.trim() && images.length === 0) {
      return new Response(
        JSON.stringify({ error: "יש לתאר את המקרה או להעלות תמונה" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    type ContentItem =
      | { type: "text"; text: string }
      | { type: "image_url"; image_url: { url: string; detail: string } }

    const userContent: ContentItem[] = []

    for (const img of images.slice(0, 6)) {
      if (!img?.base64) continue
      userContent.push({
        type: "image_url",
        image_url: {
          url: `data:${img.mimeType || "image/jpeg"};base64,${img.base64}`,
          detail: "high",
        },
      })
    }

    const parts: string[] = []
    parts.push(`סוג המקרה: ${caseType}`)
    if (description.trim()) parts.push(`תיאור המקרה מפי האדם:\n${description.trim()}`)
    if (accusation.trim()) parts.push(`במה האדם מואשם / מה הבעיה המרכזית:\n${accusation.trim()}`)
    if (images.length > 0) parts.push(`מצורפות ${images.length} תמונות של מסמכים/מכתבים רלוונטיים — קרא אותן בקפידה.`)
    parts.push("נתח את המקרה, מצא את כל הזכויות שיכולות לעזור, ונסח מכתבים רשמיים מוכנים לשליחה.")

    userContent.push({ type: "text", text: parts.join("\n\n") })

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
        temperature: 0.4,
        max_tokens: 4000,
      }),
    })

    if (!xaiResponse.ok) {
      const errText = await xaiResponse.text()
      console.error("xAI API error:", xaiResponse.status, errText)
      return new Response(
        JSON.stringify({ error: `שגיאת שירות ה-AI (${xaiResponse.status})` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const xaiData = await xaiResponse.json()
    const content = xaiData.choices?.[0]?.message?.content

    if (!content) {
      return new Response(
        JSON.stringify({ error: "תשובה ריקה מה-AI" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    let parsed: Partial<RightsResult>
    try {
      parsed = JSON.parse(content)
    } catch {
      parsed = {
        caseTitle: "תיק זכויות",
        summary: content,
        strategy: "",
        urgency: "medium",
        rights: [],
        letters: [],
      }
    }

    const result: RightsResult = {
      caseTitle: parsed.caseTitle || "תיק זכויות",
      summary: parsed.summary || "",
      strategy: parsed.strategy || "",
      urgency: parsed.urgency === "low" || parsed.urgency === "high" ? parsed.urgency : "medium",
      rights: Array.isArray(parsed.rights) ? parsed.rights : [],
      letters: Array.isArray(parsed.letters) ? parsed.letters : [],
    }

    return new Response(
      JSON.stringify({ result }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (err) {
    console.error("Edge function error:", err)
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "שגיאת שרת" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
