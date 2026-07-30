import { useEffect, useState, useCallback } from "react"
import { Link, useNavigate } from "react-router-dom"
import {
  Heart, Bookmark, Clock, Sparkles, LogIn, Trash2, Calculator as CalcIcon,
  FileText, Scale, User, TrendingUp, ChevronRight, Upload,
  AlertCircle, CheckCircle2, Loader2, Copy, Check, X,
} from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/lib/auth"
import { useFavorites } from "@/hooks/use-favorites"
import { useSavedItems } from "@/hooks/use-saved-items"
import { useRecentlyViewed } from "@/hooks/use-recently-viewed"
import { useCountUp } from "@/hooks/use-count-up"
import { usePageMeta } from "@/lib/seo"
import { supabase, type RightsCase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { sanitizeText } from "@/lib/sanitize"

// ── helpers ──────────────────────────────────────────────────────────────────

const URGENCY_COLOR: Record<string, string> = {
  high: "text-destructive border-destructive/30 bg-destructive/5",
  medium: "text-chart-4 border-chart-4/30 bg-chart-4/10",
  low: "text-success border-success/30 bg-success/5",
}
const URGENCY_LABEL: Record<string, string> = { high: "דחוף", medium: "חשוב", low: "רגוע" }

function fileToBase64(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const reader = new FileReader()
    reader.onload = () => res((reader.result as string).split(",")[1])
    reader.onerror = rej
    reader.readAsDataURL(file)
  })
}

// ── types ─────────────────────────────────────────────────────────────────────

interface DocResult {
  sender: string
  topic: string
  plainExplanation: string
  whatToDo: string[]
  importantNumbers: string[]
  urgency: "low" | "medium" | "high"
  urgencyReason: string
}

// ── stat card ─────────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, color }: {
  icon: React.ReactNode; label: string; value: number; color: string
}) {
  const anim = useCountUp(value, 600)
  return (
    <div className={`rounded-2xl border p-4 flex items-center gap-4 ${color}`}>
      <div className="w-10 h-10 rounded-xl bg-background/60 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <div className="text-2xl font-black tabular-nums leading-none">{Math.round(anim)}</div>
        <div className="text-xs font-medium mt-0.5 opacity-80">{label}</div>
      </div>
    </div>
  )
}

// ── empty state ───────────────────────────────────────────────────────────────

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
      {text}
    </div>
  )
}

// ── copy button ───────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [done, setDone] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(text)
    setDone(true)
    setTimeout(() => setDone(false), 1800)
  }
  return (
    <button onClick={copy} className="text-muted-foreground hover:text-foreground transition-colors" aria-label="העתק">
      {done ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  )
}

// ── main page ─────────────────────────────────────────────────────────────────

export default function AccountPage() {
  usePageMeta({
    title: "הדשבורד שלי | חשב לי",
    description: "כל המחשבונים, הניתוחים והמקרים שלך במקום אחד.",
    robots: "noindex, nofollow",
  })

  const { user, loading: authLoading, openAuthDialog, signOut } = useAuth()
  const navigate = useNavigate()
  const { favorites, removeFavorite } = useFavorites()
  const { items, removeItem } = useSavedItems()
  const { recent, clear } = useRecentlyViewed()

  const [rightsCases, setRightsCases] = useState<RightsCase[]>([])
  const [casesLoading, setCasesLoading] = useState(false)

  // Document analyzer state
  const [docText, setDocText] = useState("")
  const [docFile, setDocFile] = useState<File | null>(null)
  const [docResult, setDocResult] = useState<DocResult | null>(null)
  const [docLoading, setDocLoading] = useState(false)
  const [docError, setDocError] = useState("")

  const fetchCases = useCallback(async () => {
    if (!user) return
    setCasesLoading(true)
    const { data } = await supabase
      .from("rights_cases")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50)
    setRightsCases((data as RightsCase[]) ?? [])
    setCasesLoading(false)
  }, [user])

  useEffect(() => { fetchCases() }, [fetchCases])

  const analyzeDoc = async () => {
    if (!docText.trim() && !docFile) return
    setDocLoading(true)
    setDocError("")
    setDocResult(null)
    try {
      const body: Record<string, string> = {}
      if (docFile) {
        body.imageBase64 = await fileToBase64(docFile)
        body.mimeType = docFile.type
      } else {
        body.text = sanitizeText(docText, 8000)
      }
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/explain-letter`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        },
      )
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "שגיאה בניתוח")
      setDocResult(json.result ?? json)
    } catch (e) {
      setDocError(e instanceof Error ? e.message : "שגיאה לא ידועה")
    } finally {
      setDocLoading(false)
    }
  }

  // ── auth guard ──────────────────────────────────────────────────────────────

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-bl from-primary/20 to-primary/5 flex items-center justify-center mx-auto mb-6 border border-primary/20">
          <User className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-3xl font-extrabold text-foreground mb-2">הדשבורד שלי</h1>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          התחבר כדי לגשת לכל המחשבונים, הניתוחים, מקרי הזכויות וניתוחי המסמכים שלך.
        </p>
        <Button
          onClick={() => openAuthDialog(() => toast.success("ברוך הבא!"))}
          size="lg"
          className="w-full"
        >
          <LogIn className="w-4 h-4" />
          התחברות / הרשמה
        </Button>
      </div>
    )
  }

  const savedResults = items.filter((i) => i.kind === "result")
  const savedAi = items.filter((i) => i.kind === "ai")
  const totalItems = favorites.length + savedResults.length + savedAi.length + rightsCases.length

  const initials = user.email?.slice(0, 2).toUpperCase() ?? "ME"

  // ── render ──────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">

      {/* ── Profile header ── */}
      <section className="rounded-3xl bg-gradient-to-bl from-primary/15 via-card to-card border border-border overflow-hidden">
        <div className="p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-5">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground text-xl font-black shrink-0">
            {initials}
          </div>
          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground font-medium mb-0.5">מחובר כ</p>
            <h1 className="text-xl font-extrabold text-foreground truncate">{user.email}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              חבר מ-{new Date(user.created_at ?? Date.now()).toLocaleDateString("he-IL", { year: "numeric", month: "long" })}
            </p>
          </div>
          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={() => { signOut(); navigate("/") }}>
              התנתק
            </Button>
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-6 sm:px-8 pb-6 sm:pb-8">
          <StatCard
            icon={<Heart className="w-5 h-5 text-destructive" />}
            label="מועדפים"
            value={favorites.length}
            color="border-destructive/20 bg-destructive/5 text-destructive"
          />
          <StatCard
            icon={<Sparkles className="w-5 h-5 text-primary" />}
            label="ניתוחי AI"
            value={savedAi.length}
            color="border-primary/20 bg-primary/5 text-primary"
          />
          <StatCard
            icon={<Scale className="w-5 h-5 text-success" />}
            label="מקרי זכויות"
            value={rightsCases.length}
            color="border-success/20 bg-success/5 text-success"
          />
          <StatCard
            icon={<TrendingUp className="w-5 h-5 text-chart-4" />}
            label={'סה"כ פעולות'}
            value={totalItems}
            color="border-chart-4/20 bg-chart-4/10 text-chart-4"
          />
        </div>
      </section>

      {/* ── Tabs ── */}
      <Tabs defaultValue="favorites" className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto flex-nowrap gap-0 h-auto p-1 bg-muted rounded-2xl">
          {[
            { value: "favorites", label: "מועדפים", count: favorites.length },
            { value: "analyses", label: "ניתוחי AI", count: savedAi.length },
            { value: "results", label: "תוצאות", count: savedResults.length },
            { value: "rights", label: "זכויות", count: rightsCases.length },
            { value: "documents", label: "ניתוח מסמכים", count: null },
            { value: "history", label: "היסטוריה", count: recent.length },
          ].map((t) => (
            <TabsTrigger
              key={t.value}
              value={t.value}
              className="rounded-xl px-3 py-2 text-sm font-medium whitespace-nowrap data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              {t.label}
              {t.count !== null && t.count > 0 && (
                <span className="mr-1.5 text-xs bg-primary/15 text-primary rounded-full px-1.5 py-0.5 font-bold">
                  {t.count}
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ── Favorites ── */}
        <TabsContent value="favorites" className="mt-6">
          {favorites.length === 0 ? (
            <Empty text="עדיין לא שמרת מחשבונים מועדפים. לחץ על סמל הלב בכל מחשבון כדי להוסיף." />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {favorites.map((f) => (
                <div
                  key={f.id}
                  className="group flex items-center justify-between gap-2 bg-card border border-border rounded-2xl p-4 hover:border-primary/40 transition-colors"
                >
                  <Link to={`/calculators/${f.calculator_slug}`} className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <CalcIcon className="w-4 h-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{f.calculator_title}</p>
                      {f.category_slug && (
                        <p className="text-xs text-muted-foreground mt-0.5">{f.category_slug}</p>
                      )}
                    </div>
                  </Link>
                  <button
                    onClick={async () => { await removeFavorite(f.calculator_slug); toast.success("הוסר מהמועדפים") }}
                    className="text-muted-foreground hover:text-destructive transition-colors shrink-0 p-1"
                    aria-label="הסר"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── AI Analyses ── */}
        <TabsContent value="analyses" className="mt-6 space-y-3">
          {savedAi.length === 0 ? (
            <Empty text="שמור ניתוח AI מתוצאה של מחשבון כדי לחזור אליו בכל עת." />
          ) : (
            savedAi.map((i) => (
              <article key={i.id} className="bg-card border border-border rounded-2xl p-5">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <Link to={`/calculators/${i.calculator_slug}`} className="flex items-center gap-2 text-sm font-bold text-primary hover:underline">
                    <Sparkles className="w-4 h-4" />
                    {i.calculator_title}
                  </Link>
                  <div className="flex items-center gap-2">
                    {i.provider && <Badge variant="secondary" className="text-xs">{i.provider}</Badge>}
                    <CopyButton text={i.ai_text ?? ""} />
                    <button onClick={async () => { await removeItem(i.id); toast.success("נמחק") }} className="text-muted-foreground hover:text-destructive transition-colors" aria-label="מחק">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-foreground/90 whitespace-pre-line leading-relaxed">{i.ai_text}</p>
              </article>
            ))
          )}
        </TabsContent>

        {/* ── Saved Results ── */}
        <TabsContent value="results" className="mt-6">
          {savedResults.length === 0 ? (
            <Empty text="שמור תוצאת חישוב כדי להשוות בין תרחישים בעתיד." />
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {savedResults.map((i) => (
                <article key={i.id} className="bg-card border border-border rounded-2xl p-4">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <Link to={`/calculators/${i.calculator_slug}`} className="flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
                      <Bookmark className="w-3.5 h-3.5" />
                      {i.calculator_title}
                    </Link>
                    <button onClick={async () => { await removeItem(i.id); toast.success("נמחק") }} className="text-muted-foreground hover:text-destructive transition-colors" aria-label="מחק">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {i.summary && <p className="text-sm text-foreground/90 leading-relaxed">{i.summary}</p>}
                </article>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Rights Cases ── */}
        <TabsContent value="rights" className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{rightsCases.length} מקרים שמורים</p>
            <Link to="/rights" className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
              מקרה חדש <ChevronRight className="w-4 h-4 rtl:rotate-180" />
            </Link>
          </div>
          {casesLoading && (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          )}
          {!casesLoading && rightsCases.length === 0 && (
            <Empty text="עדיין לא פתחת מקרה בפורטל הזכויות." />
          )}
          {rightsCases.map((c) => (
            <article key={c.id} className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="flex items-start justify-between gap-3 p-5">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Scale className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-foreground truncate">{c.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(c.created_at).toLocaleDateString("he-IL")} · {c.case_type}
                    </p>
                  </div>
                </div>
                <UrgencyBadge analysis={c.ai_analysis} />
              </div>
              {c.ai_analysis && (
                <div className="px-5 pb-4">
                  <p className="text-sm text-foreground/85 leading-relaxed line-clamp-3">{c.ai_analysis}</p>
                </div>
              )}
              <div className="px-5 pb-4 flex items-center gap-4 text-xs text-muted-foreground">
                <span>{c.rights_found?.length ?? 0} זכויות נמצאו</span>
                <span>{c.generated_letters?.length ?? 0} מכתבים</span>
              </div>
            </article>
          ))}
        </TabsContent>

        {/* ── Document Analyzer ── */}
        <TabsContent value="documents" className="mt-6 space-y-5">
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-extrabold text-foreground">ניתוח מסמכים וחוזים</h2>
                <p className="text-sm text-muted-foreground">הדבק טקסט או העלה תמונה — AI יסביר לך הכל בעברית פשוטה</p>
              </div>
            </div>

            {/* Input */}
            <div className="space-y-3">
              <textarea
                value={docText}
                onChange={(e) => setDocText(sanitizeText(e.target.value, 8000))}
                placeholder="הדבק כאן את תוכן המסמך, החוזה, המכתב מהבנק, הביטוח הלאומי..."
                rows={6}
                maxLength={8000}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                dir="rtl"
              />

              <div className="flex items-center gap-3">
                <label className="flex-1 flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border py-3 text-sm font-medium text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors cursor-pointer">
                  <Upload className="w-4 h-4" />
                  {docFile ? docFile.name : "או העלה תמונה של המסמך"}
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => setDocFile(e.target.files?.[0] ?? null)}
                  />
                </label>
                {docFile && (
                  <button onClick={() => setDocFile(null)} className="text-muted-foreground hover:text-destructive transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <Button
                onClick={analyzeDoc}
                disabled={docLoading || (!docText.trim() && !docFile)}
                className="w-full"
              >
                {docLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> מנתח...</> : <><Sparkles className="w-4 h-4" /> נתח את המסמך</>}
              </Button>
            </div>
          </div>

          {/* Error */}
          {docError && (
            <div className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
              <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{docError}</p>
            </div>
          )}

          {/* Result */}
          {docResult && <DocResultCard result={docResult} />}
        </TabsContent>

        {/* ── History ── */}
        <TabsContent value="history" className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">{recent.length} מחשבונים נצפו לאחרונה</p>
            {recent.length > 0 && (
              <button onClick={clear} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                נקה הכל
              </button>
            )}
          </div>
          {recent.length === 0 ? (
            <Empty text="מחשבונים שתצפה בהם יופיעו כאן." />
          ) : (
            <div className="flex flex-wrap gap-2">
              {recent.map((r) => (
                <Link
                  key={r.slug}
                  to={`/calculators/${r.slug}`}
                  className="inline-flex items-center gap-1.5 text-sm bg-muted hover:bg-muted/70 text-foreground rounded-full px-4 py-2 transition-colors"
                >
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  {r.title}
                </Link>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ── UrgencyBadge ──────────────────────────────────────────────────────────────

function UrgencyBadge({ analysis }: { analysis?: string }) {
  if (!analysis) return null
  const urgency = analysis.toLowerCase().includes("דחוף") ? "high"
    : analysis.toLowerCase().includes("חשוב") ? "medium" : "low"
  return (
    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border shrink-0 ${URGENCY_COLOR[urgency]}`}>
      {URGENCY_LABEL[urgency]}
    </span>
  )
}

// ── DocResultCard ─────────────────────────────────────────────────────────────

function DocResultCard({ result }: { result: DocResult }) {
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden space-y-0">
      {/* Header */}
      <div className={`p-5 border-b border-border ${URGENCY_COLOR[result.urgency]}`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium opacity-80 mb-0.5">שולח: {result.sender}</p>
            <h3 className="font-extrabold text-foreground text-lg">{result.topic}</h3>
          </div>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${URGENCY_COLOR[result.urgency]} shrink-0`}>
            {URGENCY_LABEL[result.urgency]}
          </span>
        </div>
        {result.urgencyReason && <p className="text-sm mt-2 opacity-80">{result.urgencyReason}</p>}
      </div>

      {/* Explanation */}
      <div className="p-5 border-b border-border">
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle2 className="w-4 h-4 text-success" />
          <span className="font-bold text-sm text-foreground">ההסבר הפשוט</span>
        </div>
        <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">{result.plainExplanation}</p>
      </div>

      {/* What to do */}
      {result.whatToDo?.length > 0 && (
        <div className="p-5 border-b border-border">
          <p className="font-bold text-sm text-foreground mb-3">מה לעשות:</p>
          <ol className="space-y-2">
            {result.whatToDo.map((step, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-foreground/90">
                <span className="w-5 h-5 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Important numbers */}
      {result.importantNumbers?.length > 0 && (
        <div className="p-5">
          <p className="font-bold text-sm text-foreground mb-3">מספרים חשובים:</p>
          <div className="flex flex-wrap gap-2">
            {result.importantNumbers.map((n, i) => (
              <span key={i} className="text-sm bg-muted rounded-full px-3 py-1.5 text-foreground font-medium">
                {n}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
