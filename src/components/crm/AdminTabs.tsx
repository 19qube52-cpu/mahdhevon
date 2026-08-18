import { useState, useEffect, useCallback } from "react"
import { supabase, type ContactSubmission, type CustomCalculator } from "@/lib/supabase"
import { useCustomCalculators } from "@/hooks/use-custom-calculators"
import { categories } from "@/data/categories"
import { calculators as staticCalculators } from "@/data/calculators"
import {
  BarChart3, Users, Mail, Calculator as CalcIcon, Trash2, Plus,
  TrendingUp, Eye, MousePointerClick, CheckCircle2, Clock,
  Pencil, X, Save, Loader2,
} from "lucide-react"
import { AiGenerateButton } from "@/components/crm/AiGenerateDialog"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// ─── Analytics Tab ──────────────────────────────────────────────────
export function AnalyticsTab() {
  const [stats, setStats] = useState({
    totalViews: 0, totalCalcUses: 0, todayViews: 0, uniqueSessions: 0,
  })
  const [topPages, setTopPages] = useState<{ path: string; count: number }[]>([])
  const [topCalcs, setTopCalcs] = useState<{ slug: string; count: number }[]>([])
  const [dailyData, setDailyData] = useState<{ date: string; views: number; uses: number }[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const now = new Date()
    const todayStr = now.toISOString().split("T")[0]
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000).toISOString()

    const [allRes, calcRes, todayRes, sessionRes] = await Promise.all([
      supabase.from("page_analytics").select("page_path, event_type, created_at, session_id").gte("created_at", sevenDaysAgo),
      supabase.from("page_analytics").select("calculator_slug").not("calculator_slug", "is", null).gte("created_at", sevenDaysAgo),
      supabase.from("page_analytics").select("*").gte("created_at", todayStr),
      supabase.from("page_analytics").select("session_id").gte("created_at", sevenDaysAgo),
    ])

    type AnalyticsRow = { page_path: string; event_type: string; created_at: string; session_id: string | null; calculator_slug?: string | null }
    const allRows = (allRes.data ?? []) as AnalyticsRow[]
    setStats({
      totalViews: allRows.filter((r: AnalyticsRow) => r.event_type === "page_view").length,
      totalCalcUses: allRows.filter((r: AnalyticsRow) => r.event_type === "calculator_use").length,
      todayViews: ((todayRes.data ?? []) as AnalyticsRow[]).filter((r: AnalyticsRow) => r.event_type === "page_view").length,
      uniqueSessions: new Set(((sessionRes.data ?? []) as AnalyticsRow[]).map((r: AnalyticsRow) => r.session_id)).size,
    })

    // Top pages
    const pageCounts: Record<string, number> = {}
    allRows.filter((r: AnalyticsRow) => r.event_type === "page_view").forEach((r: AnalyticsRow) => {
      pageCounts[r.page_path] = (pageCounts[r.page_path] ?? 0) + 1
    })
    setTopPages(Object.entries(pageCounts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([path, count]) => ({ path, count })))

    // Top calculators
    const calcCounts: Record<string, number> = {}
    const calcRows = (calcRes.data ?? []) as { calculator_slug: string | null }[]
    calcRows.forEach((row) => {
      if (row.calculator_slug) calcCounts[row.calculator_slug] = (calcCounts[row.calculator_slug] ?? 0) + 1
    })
    setTopCalcs(Object.entries(calcCounts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([slug, count]) => ({ slug, count })))

    // Daily breakdown
    const dailyMap: Record<string, { views: number; uses: number }> = {}
    for (let d = 6; d >= 0; d--) {
      const date = new Date(now.getTime() - d * 86400000).toISOString().split("T")[0]
      dailyMap[date] = { views: 0, uses: 0 }
    }
    allRows.forEach((r: AnalyticsRow) => {
      const date = r.created_at.split("T")[0]
      if (dailyMap[date]) {
        if (r.event_type === "page_view") dailyMap[date].views++
        else dailyMap[date].uses++
      }
    })
    setDailyData(Object.entries(dailyMap).map(([date, v]) => ({ date, ...v })))
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>

  const maxDaily = Math.max(...dailyData.map(d => Math.max(d.views, d.uses)), 1)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Eye className="w-5 h-5 text-primary" />} label="צפיות (7 ימים)" value={stats.totalViews} />
        <StatCard icon={<MousePointerClick className="w-5 h-5 text-chart-3" />} label="שימוש במחשבונים" value={stats.totalCalcUses} />
        <StatCard icon={<BarChart3 className="w-5 h-5 text-success" />} label="צפיות היום" value={stats.todayViews} />
        <StatCard icon={<Users className="w-5 h-5 text-chart-4" />} label="מבקרים ייחודיים" value={stats.uniqueSessions} />
      </div>

      <div className="bg-card rounded-2xl border border-border p-5">
        <h2 className="font-bold text-foreground mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" />פעילות יומית (7 ימים)</h2>
        <div className="flex items-end gap-2 h-40">
          {dailyData.map(d => (
            <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex flex-col gap-0.5 items-center justify-end h-32">
                <div className="w-full max-w-8 bg-primary/70 rounded-t-sm transition-all" style={{ height: `${(d.views / maxDaily) * 100}%` }} title={`${d.views} צפיות`} />
                <div className="w-full max-w-8 bg-chart-3/70 rounded-t-sm transition-all" style={{ height: `${(d.uses / maxDaily) * 100}%` }} title={`${d.uses} שימושים`} />
              </div>
              <span className="text-xs text-muted-foreground">{new Date(d.date).toLocaleDateString("he-IL", { weekday: "short" })}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-primary/70" />צפיות</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-chart-3/70" />שימוש במחשבונים</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-2xl border border-border p-5">
          <h2 className="font-bold text-foreground mb-4">דפים פופולריים</h2>
          {topPages.length === 0 ? <p className="text-sm text-muted-foreground">אין נתונים</p> : (
            <div className="space-y-2">
              {topPages.map((p, i) => (
                <div key={p.path} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-5">{i + 1}</span>
                  <span className="text-sm text-foreground flex-1 truncate">{p.path}</span>
                  <span className="text-sm font-bold text-primary">{p.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="bg-card rounded-2xl border border-border p-5">
          <h2 className="font-bold text-foreground mb-4">מחשבונים פופולריים</h2>
          {topCalcs.length === 0 ? <p className="text-sm text-muted-foreground">אין נתונים</p> : (
            <div className="space-y-2">
              {topCalcs.map((c, i) => {
                const calc = staticCalculators.find(s => s.slug === c.slug)
                return (
                  <div key={c.slug} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-5">{i + 1}</span>
                    <span className="text-sm text-foreground flex-1 truncate">{calc?.shortTitle ?? c.slug}</span>
                    <span className="text-sm font-bold text-primary">{c.count}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Users Tab ──────────────────────────────────────────────────────
export function UsersTab() {
  const [users, setUsers] = useState<{ id: string; email: string; created_at: string; role: string | null }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      setLoading(true)
      const { data: rolesData } = await supabase.from("user_roles").select("user_id, role")
      const roleMap: Record<string, string> = {}
      ;(rolesData ?? []).forEach(r => { roleMap[r.user_id] = r.role })

      const { data: profiles } = await supabase
        .from("user_favorites")
        .select("user_id")
        .limit(1)

      // Get unique user IDs from auth via favorites and saved_items
      const { data: favUsers } = await supabase.from("user_favorites").select("user_id, created_at").order("created_at", { ascending: false })
      const { data: savedUsers } = await supabase.from("saved_items").select("user_id, created_at").order("created_at", { ascending: false })

      // Merge unique user_ids
      const userMap: Record<string, string> = {}
      ;(favUsers ?? []).forEach(f => { if (f.user_id && !userMap[f.user_id]) userMap[f.user_id] = f.created_at })
      ;(savedUsers ?? []).forEach(s => { if (s.user_id && !userMap[s.user_id]) userMap[s.user_id] = s.created_at })

      const userList = Object.entries(userMap).map(([id, created]) => ({
        id, email: "", created_at: created, role: roleMap[id] ?? null,
      }))
      setUsers(userList)
      setLoading(false)
      void profiles
    })()
  }, [])

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <h2 className="font-bold text-foreground">משתמשים רשומים</h2>
        <span className="text-sm text-muted-foreground">{users.length} משתמשים</span>
      </div>
      {users.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground text-sm">אין משתמשים רשומים עדיין</div>
      ) : (
        <div className="divide-y divide-border">
          {users.map((u, i) => (
            <div key={u.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/50 transition-colors">
              <span className="text-xs text-muted-foreground w-6 text-center font-mono">{i + 1}</span>
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Users className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-foreground font-mono truncate">{u.id.slice(0, 8)}...</div>
                <div className="text-xs text-muted-foreground">{new Date(u.created_at).toLocaleDateString("he-IL", { year: "numeric", month: "short", day: "numeric" })}</div>
              </div>
              {u.role === "admin" && (
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">מנהל</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Contacts Tab ───────────────────────────────────────────────────
export function ContactsTab() {
  const [contacts, setContacts] = useState<ContactSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "new" | "read" | "replied" | "archived">("all")

  const load = useCallback(async () => {
    setLoading(true)
    let query = supabase.from("contact_submissions").select("*").order("created_at", { ascending: false })
    if (filter !== "all") query = query.eq("status", filter)
    const { data } = await query
    setContacts(data as ContactSubmission[] ?? [])
    setLoading(false)
  }, [filter])

  useEffect(() => { load() }, [load])

  const updateStatus = async (id: string, status: ContactSubmission["status"]) => {
    await supabase.from("contact_submissions").update({ status }).eq("id", id)
    setContacts(prev => prev.map(c => c.id === id ? { ...c, status } : c))
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>

  const statusLabels: Record<string, string> = { new: "חדש", read: "נקרא", replied: "השב", archived: "הועבר לארכיון" }
  const statusColors: Record<string, string> = {
    new: "bg-primary/10 text-primary", read: "bg-muted text-muted-foreground",
    replied: "bg-success/10 text-success", archived: "bg-muted text-muted-foreground",
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {(["all", "new", "read", "replied", "archived"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
              filter === f ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground"
            )}
          >
            {f === "all" ? "הכל" : statusLabels[f]}
          </button>
        ))}
      </div>

      {contacts.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border py-16 text-center text-muted-foreground text-sm">אין פניות</div>
      ) : (
        <div className="space-y-3">
          {contacts.map(c => (
            <div key={c.id} className="bg-card rounded-2xl border border-border p-5 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-foreground">{c.name}</div>
                    <div className="text-xs text-muted-foreground">{c.email}</div>
                  </div>
                </div>
                <span className={cn("text-xs px-2 py-0.5 rounded-full font-bold", statusColors[c.status])}>
                  {statusLabels[c.status]}
                </span>
              </div>
              <div>
                <div className="text-sm font-semibold text-foreground mb-1">{c.subject}</div>
                <p className="text-sm text-muted-foreground leading-relaxed">{c.message}</p>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(c.created_at).toLocaleDateString("he-IL", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </span>
                <div className="flex gap-1.5">
                  {c.status === "new" && (
                    <button onClick={() => updateStatus(c.id, "read")} className="text-xs px-2.5 py-1 rounded-lg bg-muted hover:bg-muted/70 font-medium text-foreground">סמן כנקרא</button>
                  )}
                  {c.status !== "replied" && c.status !== "archived" && (
                    <button onClick={() => updateStatus(c.id, "replied")} className="text-xs px-2.5 py-1 rounded-lg bg-success/10 text-success hover:bg-success/20 font-medium">סמן כהשב</button>
                  )}
                  <a href={`mailto:${c.email}?subject=Re: ${c.subject}`} className="text-xs px-2.5 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 font-medium">השב</a>
                  {c.status !== "archived" && (
                    <button onClick={() => updateStatus(c.id, "archived")} className="text-xs px-2.5 py-1 rounded-lg bg-muted hover:bg-muted/70 font-medium text-muted-foreground">ארכיון</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Calculators Tab ────────────────────────────────────────────────
export function CalculatorsTab() {
  const { customCalcs, loading, saveCalculator, deleteCalculator } = useCustomCalculators()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<CustomCalculator | null>(null)
  const [aiPrefill, setAiPrefill] = useState<Partial<CustomCalculator> & { slug: string; title: string } | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000) }

  const handleDelete = async (id: string) => {
    const { error } = await deleteCalculator(id)
    showToast(error ?? "נמחק")
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-foreground">מחשבונים מותאמים ({customCalcs.length})</h2>
        <div className="flex gap-2">
          <AiGenerateButton onGenerated={(calc) => {
            setEditing(null)
            setShowForm(true)
            setAiPrefill(calc)
          }} />
          <Button size="sm" onClick={() => { setEditing(null); setShowForm(true); setAiPrefill(null) }}>
            <Plus className="w-4 h-4" />מחשבון חדש
          </Button>
        </div>
      </div>

      {customCalcs.length === 0 && !showForm && (
        <div className="bg-card rounded-2xl border border-border py-16 text-center">
          <CalcIcon className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-4">עדיין לא נוצרו מחשבונים מותאמים</p>
          <Button onClick={() => setShowForm(true)}><Plus className="w-4 h-4" />צור מחשבון ראשון</Button>
        </div>
      )}

      {customCalcs.length > 0 && (
        <div className="space-y-2">
          {customCalcs.map(cc => (
            <div key={cc.id} className="bg-card rounded-xl border border-border p-4 flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <CalcIcon className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-foreground truncate">{cc.title}</div>
                <div className="text-xs text-muted-foreground">/{cc.slug} · {cc.category_slug}</div>
              </div>
              <span className={cn("text-xs px-2 py-0.5 rounded-full font-bold", cc.is_active ? "bg-success/10 text-success" : "bg-muted text-muted-foreground")}>
                {cc.is_active ? "פעיל" : "מוסתר"}
              </span>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => { setEditing(cc); setShowForm(true) }} className="p-1.5 rounded hover:bg-muted" title="עריכה"><Pencil className="w-3.5 h-3.5 text-muted-foreground" /></button>
                <button onClick={() => handleDelete(cc.id)} className="p-1.5 rounded hover:bg-destructive/10" title="מחק"><Trash2 className="w-3.5 h-3.5 text-destructive" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <CalculatorForm
          editing={editing}
          prefill={aiPrefill}
          onSave={async (data) => {
            const { error } = await saveCalculator(data)
            if (error) { showToast(error) }
            else { showToast("נשמר"); setShowForm(false); setEditing(null); setAiPrefill(null) }
          }}
          onClose={() => { setShowForm(false); setEditing(null); setAiPrefill(null) }}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3 rounded-xl shadow-xl text-sm font-semibold bg-foreground text-background">
          <CheckCircle2 className="w-4 h-4" />{toast}
        </div>
      )}
    </div>
  )
}

// ─── Calculator Form Dialog ─────────────────────────────────────────
function CalculatorForm({ editing, prefill, onSave, onClose }: {
  editing: CustomCalculator | null
  prefill: (Partial<CustomCalculator> & { slug: string; title: string }) | null
  onSave: (data: Partial<CustomCalculator> & { slug: string; title: string }) => void
  onClose: () => void
}) {
  const [slug, setSlug] = useState(editing?.slug ?? prefill?.slug ?? "")
  const [title, setTitle] = useState(editing?.title ?? prefill?.title ?? "")
  const [shortTitle, setShortTitle] = useState(editing?.short_title ?? prefill?.short_title ?? "")
  const [category, setCategory] = useState(editing?.category_slug ?? prefill?.category_slug ?? "general-tools")
  const [description, setDescription] = useState(editing?.description ?? prefill?.description ?? "")
  const [formulaCode, setFormulaCode] = useState(editing?.formula_code ?? prefill?.formula_code ?? "const { a, b } = input\nreturn { result: a + b }")
  const [resultLabels, setResultLabels] = useState(editing?.result_labels ?? prefill?.result_labels ?? { result: "תוצאה" })
  const [inputsJson, setInputsJson] = useState(editing ? JSON.stringify(editing.inputs, null, 2) : prefill?.inputs ? JSON.stringify(prefill.inputs, null, 2) : '[\n  { "id": "a", "label": "ערך A", "type": "number", "defaultValue": 10 },\n  { "id": "b", "label": "ערך B", "type": "number", "defaultValue": 20 }\n]')
  const [isActive, setIsActive] = useState(editing?.is_active ?? true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setError(null)
    if (!slug.trim() || !title.trim()) { setError("נדרשים slug וכותרת"); return }
    let parsedInputs: unknown
    try { parsedInputs = JSON.parse(inputsJson) } catch { setError("JSON של שדות הקלט אינו תקין"); return }
    setSaving(true)
    await onSave({
      slug: slug.trim(),
      title: title.trim(),
      short_title: shortTitle.trim() || title.trim(),
      category_slug: category,
      description: description.trim(),
      formula_code: formulaCode,
      result_labels: resultLabels,
      inputs: parsedInputs as CustomCalculator["inputs"],
      quick_answer: prefill?.quick_answer ?? null,
      formula_explanation: prefill?.formula_explanation ?? null,
      example_text: prefill?.example_text ?? null,
      faqs: prefill?.faqs ?? [],
      disclaimer: prefill?.disclaimer ?? null,
      is_active: isActive,
    })
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-card rounded-2xl border border-border max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="font-extrabold text-lg text-foreground">{editing ? "עריכת מחשבון" : "מחשבון חדש"}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Slug (כתובת)</Label>
            <Input value={slug} onChange={e => setSlug(e.target.value)} placeholder="my-calculator" disabled={!!editing} />
          </div>
          <div className="space-y-2">
            <Label>כותרת</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="מחשבון חדש" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>כותרת קצרה</Label>
            <Input value={shortTitle} onChange={e => setShortTitle(e.target.value)} placeholder="מחשבון" />
          </div>
          <div className="space-y-2">
            <Label>קטגוריה</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {categories.map(c => <SelectItem key={c.slug} value={c.slug}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>תיאור</Label>
          <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="תיאור המחשבון..." />
        </div>

        <div className="space-y-2">
          <Label>שדות קלט (JSON)</Label>
          <Textarea value={inputsJson} onChange={e => setInputsJson(e.target.value)} rows={6} className="font-mono text-xs" dir="ltr" />
        </div>

        <div className="space-y-2">
          <Label>קוד נוסחה (JavaScript)</Label>
          <Textarea value={formulaCode} onChange={e => setFormulaCode(e.target.value)} rows={5} className="font-mono text-xs" dir="ltr" />
          <p className="text-xs text-muted-foreground">הקוד מקבל אובייקט input עם ערכי השדות ומחזיר אובייקט תוצאה.</p>
        </div>

        <div className="space-y-2">
          <Label>תוויות תוצאה (JSON)</Label>
          <Textarea
            value={JSON.stringify(resultLabels, null, 2)}
            onChange={e => { try { setResultLabels(JSON.parse(e.target.value)) } catch { /* ignore */ } }}
            rows={3} className="font-mono text-xs" dir="ltr"
          />
        </div>

        <div className="flex items-center gap-2">
          <input type="checkbox" id="calc-active" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="w-4 h-4" />
          <Label htmlFor="calc-active">פעיל (מופיע באתר)</Label>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose}>ביטול</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            שמור
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Shared StatCard ────────────────────────────────────────────────
function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="bg-card rounded-2xl border border-border p-5">
      <div className="flex items-center gap-2 mb-3">{icon}<span className="text-sm text-muted-foreground font-medium">{label}</span></div>
      <div className="text-3xl font-extrabold text-foreground">{value}</div>
    </div>
  )
}
