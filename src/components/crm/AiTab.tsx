import { useState } from "react"
import {
  Sparkles, FileText, Newspaper, Shuffle, Tags, Share2,
  Users, CalendarDays, Clock, HelpCircle, Copy, Check,
  Loader2, ChevronDown, ChevronUp, Zap, Home, Car, ShieldCheck,
  PiggyBank, TrendingUp
} from "lucide-react"
import { cn } from "@/lib/utils"
import { type QueueItem } from "@/lib/supabase"
import { supabase } from "@/lib/supabase"
import { adminFetch } from "@/lib/admin-api"


async function callAI(action: string, payload: Record<string, unknown>): Promise<string> {
  const res = await adminFetch("ai-crm-assistant", {
    method: "POST",

    body: JSON.stringify({ action, ...payload }),
  })
  const data = await res.json()
  if (!data.ok) throw new Error(data.error ?? "שגיאה לא ידועה")
  return data.result as string
}

interface AiFeature {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  color: string
  needsCalc: boolean
  needsQueue?: boolean
  platformOptions?: string[]
  hasContext?: boolean
}

const AI_FEATURES: AiFeature[] = [
  {
    id: "summary",
    title: "סיכום מחשבון",
    description: "משפט אחד שמסביר מה עושה המחשבון — לשימוש בכרטיסיות ורשימות",
    icon: <Sparkles className="w-5 h-5" />, color: "text-violet-500", needsCalc: true,
  },
  {
    id: "seo_description",
    title: "תיאור SEO",
    description: "Meta description מותאם לגוגל — 140-160 תווים עם מילות מפתח",
    icon: <FileText className="w-5 h-5" />, color: "text-blue-500", needsCalc: true,
  },
  {
    id: "article",
    title: "מאמר מלא",
    description: "מאמר Markdown מלא כ-500 מילים עם כותרות, FAQ וסיכום",
    icon: <Newspaper className="w-5 h-5" />, color: "text-emerald-500", needsCalc: true,
  },
  {
    id: "title_variants",
    title: "כותרות חלופיות",
    description: "5 גרסאות כותרת לבדיקת A/B: SEO, שאלתי, רגשי, ישיר, פתרון",
    icon: <Shuffle className="w-5 h-5" />, color: "text-amber-500", needsCalc: true,
  },
  {
    id: "auto_tags",
    title: "תיוג אוטומטי",
    description: "8-10 תגיות רלוונטיות בעברית ואנגלית לשיפור החיפוש",
    icon: <Tags className="w-5 h-5" />, color: "text-pink-500", needsCalc: true,
  },
  {
    id: "social_post",
    title: "פוסט לרשת חברתית",
    description: "פוסט מותאם לפלטפורמה עם CTA וHashtags",
    icon: <Share2 className="w-5 h-5" />, color: "text-cyan-500", needsCalc: true, platformOptions: ["LinkedIn", "Facebook", "Twitter/X", "Instagram"],
  },
  {
    id: "audience",
    title: "קהל יעד",
    description: "ניתוח פרסונה, צורך, ותזמון — עם עצה שיווקית אחת",
    icon: <Users className="w-5 h-5" />, color: "text-orange-500", needsCalc: true,
  },
  {
    id: "faq",
    title: "שאלות ותשובות FAQ",
    description: "5 שאלות אמיתיות שגולשים שואלים עם תשובות מפורטות",
    icon: <HelpCircle className="w-5 h-5" />, color: "text-teal-500", needsCalc: true,
  },
  {
    id: "seasonal_plan",
    title: "תכנון עונתי",
    description: "AI מנתח את התור ומציע אילו מחשבונים הכי רלוונטיים לחודש הנוכחי",
    icon: <CalendarDays className="w-5 h-5" />, color: "text-indigo-500", needsCalc: false, needsQueue: true,
  },
  {
    id: "smart_schedule",
    title: "תזמון חכם",
    description: "סדר פרסום אופטימלי לשלושת השבועות הקרובים, עונתיות + מגוון קטגוריות",
    icon: <Clock className="w-5 h-5" />, color: "text-rose-500", needsCalc: false, needsQueue: true,
  },
]

const DOMAIN_FEATURES: AiFeature[] = [
  {
    id: "apartment_analysis",
    title: "ניתוח רכישת דירה",
    description: "האם המשכנתא אפשרית? מסים, עלויות נוספות, עצות לרוכשים ראשונים",
    icon: <Home className="w-5 h-5" />, color: "text-blue-500", needsCalc: false, hasContext: true,
  },
  {
    id: "car_analysis",
    title: "עוזר רכישת רכב",
    description: "עלות בעלות שנתית, ירידת ערך, הערכת מחיר שוק, עצות למשא ומתן",
    icon: <Car className="w-5 h-5" />, color: "text-orange-500", needsCalc: false, hasContext: true,
  },
  {
    id: "insurance_advisor",
    title: "יועץ ביטוח חכם",
    description: "המלצת ביטוחים לפי פרופיל: חיים, בריאות, רכוש, אחריות — עם סכומים",
    icon: <ShieldCheck className="w-5 h-5" />, color: "text-emerald-500", needsCalc: false, hasContext: true,
  },
  {
    id: "retirement_plan",
    title: "מתכנן פרישה",
    description: "קצבה צפויה, פער מרמת חיים, המלצות לחיסכון וכלים פנסיוניים ישראליים",
    icon: <PiggyBank className="w-5 h-5" />, color: "text-violet-500", needsCalc: false, hasContext: true,
  },
  {
    id: "investment_analysis",
    title: "ניתוח השקעות",
    description: "הקצאת נכסים מומלצת, תשואה ריאלית, תחזית צבירה לפי פרופיל סיכון",
    icon: <TrendingUp className="w-5 h-5" />, color: "text-pink-500", needsCalc: false, hasContext: true,
  },
]

interface AiTabProps {
  queue: QueueItem[]
}

export function AiTab({ queue }: AiTabProps) {
  const pendingCalcs = queue.filter(q => q.status === "pending")
  const [selectedCalcId, setSelectedCalcId] = useState(pendingCalcs[0]?.calculator_id ?? "")
  const [selectedCalcTitle, setSelectedCalcTitle] = useState(pendingCalcs[0]?.calculator_title ?? "")
  const [results, setResults] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [platform, setPlatform] = useState("LinkedIn")
  const [activeSection, setActiveSection] = useState<"content" | "domain">("content")
  const [domainCtx, setDomainCtx] = useState<Record<string, Record<string, string>>>({})
  const setCtx = (featureId: string, key: string, val: string) =>
    setDomainCtx(prev => ({ ...prev, [featureId]: { ...(prev[featureId] ?? {}), [key]: val } }))

  const run = async (feature: AiFeature) => {
    setLoading(p => ({ ...p, [feature.id]: true }))
    try {
      const payload: Record<string, unknown> = {}
      if (feature.needsCalc) {
        payload.calculator_id = selectedCalcId
        payload.calculator_title = selectedCalcTitle
      }
      if (feature.needsQueue) {
        payload.queue = pendingCalcs.map(q => ({ calculator_title: q.calculator_title, position: q.position }))
      }
      if (feature.id === "social_post") payload.context = { platform }
      else if (feature.hasContext) payload.context = { ...(domainCtx[feature.id] ?? {}) }

      const result = await callAI(feature.id, payload)
      setResults(p => ({ ...p, [feature.id]: result }))
      setExpanded(p => ({ ...p, [feature.id]: true }))
    } catch (e) {
      setResults(p => ({ ...p, [feature.id]: `שגיאה: ${e instanceof Error ? e.message : "לא ידוע"}` }))
      setExpanded(p => ({ ...p, [feature.id]: true }))
    }
    setLoading(p => ({ ...p, [feature.id]: false }))
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-l from-violet-50/50 to-indigo-50/50 dark:from-violet-950/20 dark:to-indigo-950/20 rounded-2xl border border-violet-200/50 dark:border-violet-800/30 p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-extrabold text-lg text-foreground">AI Assistant — Powered by Grok</h2>
            <p className="text-sm text-muted-foreground mt-0.5">10 כלים מבוססי x.ai לייצור תוכן, SEO ותכנון התור</p>
          </div>
        </div>

        {/* Calculator selector */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-0">
            <label className="text-xs font-semibold text-muted-foreground block mb-1.5">בחר מחשבון לניתוח</label>
            <select
              value={selectedCalcId}
              onChange={e => {
                const calc = pendingCalcs.find(q => q.calculator_id === e.target.value)
                setSelectedCalcId(e.target.value)
                setSelectedCalcTitle(calc?.calculator_title ?? "")
              }}
              className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {pendingCalcs.length === 0 && <option value="">אין מחשבונים בתור</option>}
              {pendingCalcs.map(q => (
                <option key={q.id} value={q.calculator_id}>{q.calculator_title}</option>
              ))}
            </select>
          </div>

          {/* Platform for social */}
          <div className="shrink-0">
            <label className="text-xs font-semibold text-muted-foreground block mb-1.5">פלטפורמה (פוסט)</label>
            <select
              value={platform}
              onChange={e => setPlatform(e.target.value)}
              className="px-3 py-2 text-sm rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {["LinkedIn", "Facebook", "Twitter/X", "Instagram"].map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Section toggle */}
      <div className="flex gap-2 p-1 bg-muted rounded-xl w-fit">
        <button onClick={() => setActiveSection("content")} className={cn("px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors", activeSection === "content" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}>תוכן ו-SEO</button>
        <button onClick={() => setActiveSection("domain")} className={cn("px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors", activeSection === "domain" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}>ייעוץ פיננסי</button>
      </div>

      {/* AI Feature Grid */}
      {activeSection === "content" && (
        <div className="grid md:grid-cols-2 gap-4">
          {AI_FEATURES.map(feature => (
            <AiFeatureCard
              key={feature.id}
              feature={feature}
              result={results[feature.id]}
              isLoading={loading[feature.id] ?? false}
              isExpanded={expanded[feature.id] ?? false}
              disabled={feature.needsCalc && !selectedCalcId}
              onRun={() => run(feature)}
              onToggle={() => setExpanded(p => ({ ...p, [feature.id]: !p[feature.id] }))}
            />
          ))}
        </div>
      )}

      {/* Domain features */}
      {activeSection === "domain" && (
        <div className="grid md:grid-cols-2 gap-4">
          {DOMAIN_FEATURES.map(feature => (
            <DomainFeatureCard
              key={feature.id}
              feature={feature}
              ctx={domainCtx[feature.id] ?? {}}
              setCtx={(k, v) => setCtx(feature.id, k, v)}
              result={results[feature.id]}
              isLoading={loading[feature.id] ?? false}
              isExpanded={expanded[feature.id] ?? false}
              onRun={() => run(feature)}
              onToggle={() => setExpanded(p => ({ ...p, [feature.id]: !p[feature.id] }))}
            />
          ))}
        </div>
      )}

      {/* Cached results from DB */}
      {selectedCalcId && <CachedResults calcId={selectedCalcId} />}
    </div>
  )
}

// ─── Individual feature card ──────────────────────────────────────
function AiFeatureCard({
  feature, result, isLoading, isExpanded, disabled, onRun, onToggle
}: {
  feature: AiFeature
  result?: string
  isLoading: boolean
  isExpanded: boolean
  disabled: boolean
  onRun: () => void
  onToggle: () => void
}) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    if (!result) return
    await navigator.clipboard.writeText(result)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={cn(
      "bg-card rounded-2xl border transition-all",
      result ? "border-border shadow-sm" : "border-border"
    )}>
      {/* Card header */}
      <div className="p-4 flex items-start gap-3">
        <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-muted", feature.color)}>
          {feature.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm text-foreground">{feature.title}</div>
          <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{feature.description}</div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 pb-4 flex items-center gap-2">
        <button
          onClick={onRun}
          disabled={isLoading || disabled}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors",
            disabled
              ? "bg-muted text-muted-foreground cursor-not-allowed"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          )}
        >
          {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          {isLoading ? "מייצר..." : "הפעל AI"}
        </button>

        {result && (
          <>
            <button
              onClick={onToggle}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border border-border hover:bg-muted transition-colors text-muted-foreground"
            >
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              {isExpanded ? "הסתר" : "הצג"}
            </button>
            <button
              onClick={copy}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border border-border hover:bg-muted transition-colors text-muted-foreground"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "הועתק" : "העתק"}
            </button>
          </>
        )}
      </div>

      {/* Result */}
      {result && isExpanded && (
        <div className="px-4 pb-4">
          <div className="bg-muted/60 rounded-xl p-3 text-sm text-foreground leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto font-mono text-xs border border-border/50">
            {result}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Domain Feature Card (with context inputs) ────────────────────
const DOMAIN_INPUTS: Record<string, { key: string; label: string; placeholder: string; type?: string }[]> = {
  apartment_analysis: [
    { key: "price",  label: "מחיר דירה (₪)", placeholder: "1500000", type: "number" },
    { key: "income", label: "הכנסה חודשית (₪)", placeholder: "18000", type: "number" },
    { key: "savings",label: "הון עצמי (₪)", placeholder: "400000", type: "number" },
    { key: "city",   label: "עיר", placeholder: "תל אביב" },
  ],
  car_analysis: [
    { key: "budget", label: "תקציב (₪)", placeholder: "120000", type: "number" },
    { key: "model",  label: "דגם רכב", placeholder: "יונדאי i35 2021" },
    { key: "km",     label: "קילומטראז'", placeholder: "80000", type: "number" },
    { key: "financeType", label: "מימון", placeholder: "ליסינג / מזומן / הלוואה" },
  ],
  insurance_advisor: [
    { key: "age",           label: "גיל", placeholder: "35", type: "number" },
    { key: "family_status", label: "מצב משפחתי", placeholder: "נשוי + 2 ילדים" },
    { key: "income",        label: "הכנסה חודשית (₪)", placeholder: "20000", type: "number" },
    { key: "domain",        label: "תחום", placeholder: "נדל\"ן / עצמאי / עובד שכיר" },
  ],
  retirement_plan: [
    { key: "current_age",    label: "גיל נוכחי", placeholder: "40", type: "number" },
    { key: "retirement_age", label: "גיל פרישה", placeholder: "67", type: "number" },
    { key: "monthly_savings",label: "חיסכון חודשי (₪)", placeholder: "3000", type: "number" },
    { key: "pension_balance",label: "יתרת פנסיה (₪)", placeholder: "300000", type: "number" },
  ],
  investment_analysis: [
    { key: "amount",      label: "סכום להשקעה (₪)", placeholder: "200000", type: "number" },
    { key: "horizon",     label: "אופק (שנים)", placeholder: "10", type: "number" },
    { key: "risk_level",  label: "רמת סיכון", placeholder: "בינונית" },
    { key: "goal",        label: "מטרה", placeholder: "פנסיה / דיור / חינוך" },
  ],
}

function DomainFeatureCard({
  feature, ctx, setCtx, result, isLoading, isExpanded, onRun, onToggle
}: {
  feature: AiFeature
  ctx: Record<string, string>
  setCtx: (key: string, val: string) => void
  result?: string
  isLoading: boolean
  isExpanded: boolean
  onRun: () => void
  onToggle: () => void
}) {
  const [copied, setCopied] = useState(false)
  const inputs = DOMAIN_INPUTS[feature.id] ?? []

  const copy = async () => {
    if (!result) return
    await navigator.clipboard.writeText(result)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-card rounded-2xl border border-border">
      <div className="p-4 flex items-start gap-3">
        <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-muted", feature.color)}>
          {feature.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm text-foreground">{feature.title}</div>
          <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{feature.description}</div>
        </div>
      </div>
      <div className="px-4 pb-3 grid grid-cols-2 gap-2">
        {inputs.map(inp => (
          <div key={inp.key}>
            <label className="text-xs text-muted-foreground block mb-0.5">{inp.label}</label>
            <input
              type={inp.type ?? "text"}
              value={ctx[inp.key] ?? ""}
              onChange={e => setCtx(inp.key, e.target.value)}
              placeholder={inp.placeholder}
              className="w-full px-2 py-1.5 text-xs rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        ))}
      </div>
      <div className="px-4 pb-4 flex items-center gap-2">
        <button onClick={onRun} disabled={isLoading} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
          {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          {isLoading ? "מנתח..." : "נתח AI"}
        </button>
        {result && (
          <>
            <button onClick={onToggle} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border border-border hover:bg-muted transition-colors text-muted-foreground">
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              {isExpanded ? "הסתר" : "הצג"}
            </button>
            <button onClick={copy} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border border-border hover:bg-muted transition-colors text-muted-foreground">
              {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "הועתק" : "העתק"}
            </button>
          </>
        )}
      </div>
      {result && isExpanded && (
        <div className="px-4 pb-4">
          <div className="bg-muted/60 rounded-xl p-3 text-xs text-foreground leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto border border-border/50">
            {result}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Cached DB results panel ──────────────────────────────────────
function CachedResults({ calcId }: { calcId: string }) {
  const [rows, setRows] = useState<{ id: string; content_type: string; content: string; created_at: string }[]>([])
  const [loaded, setLoaded] = useState(false)
  const [open, setOpen] = useState(false)

  const load = async () => {
    if (loaded) { setOpen(o => !o); return }
    const { data } = await supabase
      .from("ai_content")
      .select("id, content_type, content, created_at")
      .eq("calculator_id", calcId)
      .order("created_at", { ascending: false })
      .limit(30)
    setRows(data ?? [])
    setLoaded(true)
    setOpen(true)
  }

  const LABELS: Record<string, string> = {
    summary: "סיכום", seo_description: "SEO", article: "מאמר",
    title_variants: "כותרות", auto_tags: "תגיות", social_post: "פוסט",
    audience: "קהל יעד", faq: "FAQ",
  }

  return (
    <div className="bg-card rounded-2xl border border-border">
      <button onClick={load} className="w-full flex items-center justify-between px-5 py-4 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
        <span className="flex items-center gap-2"><FileText className="w-4 h-4" />תוצאות AI שמורות עבור המחשבון הנבחר</span>
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {open && (
        <div className="px-5 pb-5 space-y-3 border-t border-border pt-4">
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">אין תוצאות שמורות עדיין</p>
          ) : (
            rows.map(row => (
              <div key={row.id} className="rounded-xl border border-border overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 bg-muted/50">
                  <span className="text-xs font-bold text-foreground">{LABELS[row.content_type] ?? row.content_type}</span>
                  <span className="text-xs text-muted-foreground">{new Date(row.created_at).toLocaleDateString("he-IL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                </div>
                <div className="px-3 py-2 text-xs text-muted-foreground whitespace-pre-wrap line-clamp-4 leading-relaxed">
                  {row.content}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
