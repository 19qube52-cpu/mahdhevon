import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/lib/auth"
import { useIsAdmin } from "@/hooks/use-is-admin"
import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"
import {
  LayoutDashboard, ListOrdered, History, Settings, Send,
  Play, ArrowUp, ArrowDown, Plus, Trash2, SkipForward,
  Calendar, CheckCircle2, Clock, AlertCircle, RefreshCw,
  ExternalLink, Loader2, Calculator, Star, Pencil,
  ChevronRight, Sparkles, TrendingUp, BarChart3, Users, Mail
} from "lucide-react"
import { cn } from "@/lib/utils"
import { supabase, type QueueItem, type DailyFeatured } from "@/lib/supabase"
import { calculators } from "@/data/calculators"
import { EditItemDialog, CreateItemDialog, DeleteDialog } from "@/components/crm/CrudDialogs"
import { AnalyticsTab, UsersTab, ContactsTab, CalculatorsTab, TelegramTab, SiteSettingsTab } from "@/components/crm/AdminTabs"

// ─── Edge-function helper ─────────────────────────────────────────
async function crmOp(body: Record<string, unknown>): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error("לא מחובר")
  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/crm-operations`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  )
  const data = await res.json()
  if (!res.ok || !data.ok) throw new Error(data.error ?? `HTTP ${res.status}`)
}

type Tab = "dashboard" | "queue" | "history" | "analytics" | "users" | "contacts" | "calculators" | "telegram" | "settings"

const CATEGORY_LABELS: Record<string, string> = {
  "salary-tax": "שכר ומסים", "mortgage-loans": "משכנתא", "health": "בריאות",
  "pension": "פנסיה", "savings": "חיסכון", "bituach-leumi": "ביטוח לאומי",
  "self-employed": "עצמאים", "tax": "מסים", "family-children": "משפחה",
}

// ─── Main CRM Page ────────────────────────────────────────────────
export default function CrmPage() {
  const { user, loading: authLoading, openAuthDialog } = useAuth()
  const isAdmin = useIsAdmin()

  const [tab, setTab] = useState<Tab>("dashboard")
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [history, setHistory] = useState<DailyFeatured[]>([])
  const [todayFeatured, setTodayFeatured] = useState<DailyFeatured | null>(null)
  const [loading, setLoading] = useState(true)
  const [publishing, setPublishing] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null)
  const [editingItem, setEditingItem] = useState<QueueItem | null>(null)
  const [deletingItem, setDeletingItem] = useState<QueueItem | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [qRes, hRes] = await Promise.all([
      supabase.from("calculator_queue").select("*").order("position", { ascending: true }),
      supabase.from("daily_featured").select("*").order("date", { ascending: false }).limit(60),
    ])
    if (qRes.data) setQueue(qRes.data)
    if (hRes.data) {
      setHistory(hRes.data)
      const today = new Date().toISOString().split("T")[0]
      setTodayFeatured(hRes.data.find(f => f.date === today) ?? null)
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
            <Calculator className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-extrabold text-foreground mb-2">כניסה לניהול</h1>
          <p className="text-muted-foreground mb-6 text-sm">יש להתחבר עם חשבון מנהל כדי להיכנס לאזור זה.</p>
          <Button onClick={() => openAuthDialog()} className="w-full">התחבר</Button>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-5">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-extrabold text-foreground mb-2">גישה נדחתה</h1>
          <p className="text-muted-foreground text-sm">אין לך הרשאות מנהל לאזור זה.</p>
        </div>
      </div>
    )
  }

  const publishToday = async () => {
    setPublishing(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        showToast("נדרשת התחברות מחדש", "error")
        setPublishing(false)
        return
      }
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/publish-daily-calculator`,
        { method: "POST", headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" }, body: "{}" }
      )
      const data = await res.json()
      if (data.success) {
        showToast(data.already_published ? "כבר פורסם מחשבון היום" : `פורסם: ${data.calculator?.title}`)
        await fetchData()
      } else {
        showToast(data.error || "שגיאה בפרסום", "error")
      }
    } catch { showToast("שגיאת רשת", "error") }
    setPublishing(false)
  }

  const moveItem = async (id: string, dir: "up" | "down") => {
    const pendingItems = queue.filter(q => q.status === "pending")
    const idx = pendingItems.findIndex(q => q.id === id)
    if (idx === -1) return
    const swapIdx = dir === "up" ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= pendingItems.length) return
    const a = pendingItems[idx], b = pendingItems[swapIdx]
    try { await crmOp({ type: "move", id: a.id, dir, swapId: b.id, posA: a.position, posB: b.position }) }
    catch (e) { showToast((e as Error).message, "error"); return }
    await fetchData()
  }

  const skipItem = async (id: string) => {
    try { await crmOp({ type: "skip", id }) } catch (e) { showToast((e as Error).message, "error"); return }
    showToast("הועבר לסטטוס 'דולג'")
    await fetchData()
  }

  const restoreItem = async (id: string) => {
    const maxPos = Math.max(...queue.filter(q => q.status === "pending").map(q => q.position), 0)
    try { await crmOp({ type: "restore", id, position: maxPos + 1 }) } catch (e) { showToast((e as Error).message, "error"); return }
    showToast("הוחזר לתור")
    await fetchData()
  }

  const deleteItem = async (id: string) => {
    try { await crmOp({ type: "delete", id }) } catch (e) { showToast((e as Error).message, "error"); return }
    setDeletingItem(null)
    showToast("נמחק")
    await fetchData()
  }

  const addFromExisting = async (calcId: string) => {
    const calc = calculators.find(c => c.id === calcId)
    if (!calc) return
    if (queue.some(q => q.calculator_id === calcId && q.status === "pending")) { showToast("כבר בתור", "error"); return }
    const maxPos = Math.max(...queue.filter(q => q.status === "pending").map(q => q.position), 0)
    try {
      await crmOp({ type: "add", calculator_id: calc.id, calculator_slug: calc.slug, calculator_title: calc.title, calculator_category: calc.categorySlug ?? null, position: maxPos + 1 })
    } catch (e) { showToast((e as Error).message, "error"); return }
    showToast(`נוסף: ${calc.title}`)
    await fetchData()
  }

  const createItem = async (fields: { calculator_id: string; calculator_slug: string; calculator_title: string; calculator_category: string | null; position: number; notes: string | null; scheduled_date: string | null }) => {
    try { await crmOp({ type: "add", ...fields }) } catch (e) { showToast((e as Error).message, "error"); return }
    showToast("נוסף לתור")
    await fetchData()
  }

  const updateItem = async (id: string, fields: Partial<QueueItem>) => {
    try { await crmOp({ type: "update", id, fields }) } catch (e) { showToast((e as Error).message, "error"); return }
    showToast("נשמר")
    await fetchData()
  }

  const updateNotes = async (id: string, notes: string) => {
    try { await crmOp({ type: "update_notes", id, notes }) } catch {}
  }

  const pending = queue.filter(q => q.status === "pending")
  const published = queue.filter(q => q.status === "published")
  const skipped = queue.filter(q => q.status === "skipped")

  const navItems: { id: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: "dashboard", label: "לוח בקרה",  icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: "queue",     label: "תור פרסום",  icon: <ListOrdered className="w-4 h-4" />,  badge: pending.length },
    { id: "history",    label: "היסטוריה",    icon: <History className="w-4 h-4" /> },
    { id: "analytics",  label: "אנליטיקס",    icon: <BarChart3 className="w-4 h-4" /> },
    { id: "users",      label: "משתמשים",    icon: <Users className="w-4 h-4" /> },
    { id: "contacts",   label: "פניות",      icon: <Mail className="w-4 h-4" /> },
    { id: "calculators",label: "מחשבונים",  icon: <Calculator className="w-4 h-4" /> },
    { id: "telegram",   label: "טלגרם",     icon: <Send className="w-4 h-4" /> },
    { id: "settings",   label: "הגדרות",     icon: <Settings className="w-4 h-4" /> },
  ]

  return (
    <div className="min-h-screen bg-muted/30 flex" dir="rtl">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 bg-card border-l border-border flex flex-col sticky top-0 h-screen">
        <div className="px-5 py-5 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Calculator className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <div className="font-extrabold text-sm text-foreground leading-tight">מנהל מחשבונים</div>
              <div className="text-xs text-muted-foreground">CRM</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={cn(
                "w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                tab === item.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <span className="flex items-center gap-2">{item.icon}{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className={cn(
                  "text-xs rounded-full px-1.5 py-0.5 font-bold min-w-5 text-center",
                  tab === item.id ? "bg-primary-foreground/20 text-primary-foreground" : "bg-primary/10 text-primary"
                )}>{item.badge}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="px-3 pb-4 border-t border-border pt-3">
          <Link
            to="/"
            className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            חזרה לאתר
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <header className="bg-card border-b border-border px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <h1 className="font-extrabold text-xl text-foreground">
            {navItems.find(n => n.id === tab)?.label}
          </h1>
          <div className="flex items-center gap-3">
            <button onClick={fetchData} disabled={loading} className="p-2 rounded-lg border border-border hover:bg-muted transition-colors text-muted-foreground" title="רענן">
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            </button>
            {tab === "queue" && (
              <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border hover:bg-muted text-sm font-semibold text-foreground transition-colors">
                <Plus className="w-4 h-4" />
                חדש
              </button>
            )}
            <button
              onClick={publishToday}
              disabled={publishing || !!todayFeatured}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all",
                todayFeatured ? "bg-muted text-muted-foreground cursor-not-allowed" : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
              )}
            >
              {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              {todayFeatured ? "פורסם היום" : "פרסם עכשיו"}
            </button>
          </div>
        </header>

        <div className="p-6 max-w-5xl mx-auto space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {tab === "dashboard" && (
                <DashboardTab
                  pending={pending.length}
                  published={published.length}
                  skipped={skipped.length}
                  historyCount={history.length}
                  todayFeatured={todayFeatured}
                  nextCalc={pending[0]}
                  recentHistory={history.slice(0, 7)}
                  onPublish={publishToday}
                  publishing={publishing}
                />
              )}
              {tab === "queue" && (
                <QueueTab
                  queue={queue}
                  onMoveUp={id => moveItem(id, "up")}
                  onMoveDown={id => moveItem(id, "down")}
                  onSkip={skipItem}
                  onRestore={restoreItem}
                  onEdit={setEditingItem}
                  onDelete={setDeletingItem}
                  onAddExisting={addFromExisting}
                  onUpdateNotes={updateNotes}
                />
              )}
              {tab === "history" && <HistoryTab history={history} />}
              {tab === "analytics" && <AnalyticsTab />}
              {tab === "users" && <UsersTab />}
              {tab === "contacts" && <ContactsTab />}
              {tab === "calculators" && <CalculatorsTab />}
              {tab === "telegram" && <TelegramTab />}
              {tab === "settings" && <SiteSettingsTab daysLeft={pending.length} />}
            </>
          )}
        </div>
      </main>

      {/* CRUD Dialogs */}
      {editingItem && (
        <EditItemDialog
          item={editingItem}
          onSave={updateItem}
          onClose={() => setEditingItem(null)}
        />
      )}
      {showCreate && (
        <CreateItemDialog
          nextPosition={Math.max(...pending.map(q => q.position), 0) + 1}
          onSave={createItem}
          onClose={() => setShowCreate(false)}
        />
      )}
      {deletingItem && (
        <DeleteDialog
          title={deletingItem.calculator_title}
          onConfirm={() => deleteItem(deletingItem.id)}
          onClose={() => setDeletingItem(null)}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className={cn(
          "fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3 rounded-xl shadow-xl text-sm font-semibold",
          toast.type === "success" ? "bg-foreground text-background" : "bg-destructive text-white"
        )}>
          {toast.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}
    </div>
  )
}

// ─── Dashboard Tab ────────────────────────────────────────────────
function DashboardTab({
  pending, published, skipped: skippedCount, historyCount, todayFeatured, nextCalc, recentHistory, onPublish, publishing
}: {
  pending: number; published: number; skipped: number; historyCount: number
  todayFeatured: DailyFeatured | null; nextCalc: QueueItem | undefined
  recentHistory: DailyFeatured[]; onPublish: () => void; publishing: boolean
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Clock className="w-5 h-5 text-amber-500" />}       label="בתור"       value={pending}       sub="ממתינים לפרסום" />
        <StatCard icon={<CheckCircle2 className="w-5 h-5 text-success" />}  label="פורסמו"     value={published}     sub="מחשבונים" />
        <StatCard icon={<Calendar className="w-5 h-5 text-primary" />}      label="היסטוריה"   value={historyCount}  sub="ימי פרסום" />
        <StatCard icon={<TrendingUp className="w-5 h-5 text-violet-500" />} label="דולגו"      value={skippedCount}  sub="פריטים" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Today */}
        <div className="bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-4 h-4 text-amber-500" />
            <h2 className="font-bold text-foreground">מחשבון היום</h2>
          </div>
          {todayFeatured ? (
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-success/8 border border-success/20">
                <div className="text-xs text-muted-foreground mb-1">
                  {new Date(todayFeatured.date).toLocaleDateString("he-IL", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                </div>
                <div className="font-extrabold text-lg text-foreground">{todayFeatured.calculator_title}</div>
                <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-success" />
                  פורסם {new Date(todayFeatured.published_at).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
              <Link to={`/calculators/${todayFeatured.calculator_slug}`} target="_blank" className="flex items-center gap-1.5 text-sm text-primary font-medium hover:underline">
                <ExternalLink className="w-3.5 h-3.5" />פתח מחשבון
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-center">
                <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">לא פורסם מחשבון היום</p>
              </div>
              <button onClick={onPublish} disabled={publishing} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors">
                {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                פרסם עכשיו
              </button>
            </div>
          )}
        </div>

        {/* Next */}
        <div className="bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-primary" />
            <h2 className="font-bold text-foreground">הבא בתור</h2>
          </div>
          {nextCalc ? (
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">#{nextCalc.position}</span>
                <span className="text-xs text-muted-foreground">{CATEGORY_LABELS[nextCalc.calculator_category ?? ""] ?? ""}</span>
              </div>
              <div className="font-extrabold text-lg text-foreground">{nextCalc.calculator_title}</div>
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3" />יפורסם מחר בחצות
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-muted text-center text-sm text-muted-foreground">התור ריק</div>
          )}
        </div>
      </div>

      {recentHistory.length > 0 && (
        <div className="bg-card rounded-2xl border border-border p-5">
          <h2 className="font-bold text-foreground mb-4">7 ימים אחרונים</h2>
          <div className="space-y-2">
            {recentHistory.map(item => (
              <div key={item.id} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                  <div>
                    <div className="text-sm font-semibold text-foreground">{item.calculator_title}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(item.date).toLocaleDateString("he-IL", { weekday: "short", month: "short", day: "numeric" })}
                    </div>
                  </div>
                </div>
                <Link to={`/calculators/${item.calculator_slug}`} target="_blank" className="text-primary hover:opacity-70">
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Queue Tab ────────────────────────────────────────────────────
function QueueTab({
  queue, onMoveUp, onMoveDown, onSkip, onRestore, onEdit, onDelete, onAddExisting, onUpdateNotes
}: {
  queue: QueueItem[]
  onMoveUp: (id: string) => void
  onMoveDown: (id: string) => void
  onSkip: (id: string) => void
  onRestore: (id: string) => void
  onEdit: (item: QueueItem) => void
  onDelete: (item: QueueItem) => void
  onAddExisting: (calcId: string) => void
  onUpdateNotes: (id: string, notes: string) => void
}) {
  const [showAdd, setShowAdd] = useState(false)
  const [search, setSearch] = useState("")
  const [editingNotes, setEditingNotes] = useState<string | null>(null)
  const [notesVal, setNotesVal] = useState("")

  const pending = queue.filter(q => q.status === "pending").sort((a, b) => a.position - b.position)
  const published = queue.filter(q => q.status === "published").sort((a, b) => new Date(b.published_at!).getTime() - new Date(a.published_at!).getTime())
  const skippedItems = queue.filter(q => q.status === "skipped")

  const availableCalcs = calculators.filter(c =>
    !queue.some(q => q.calculator_id === c.id && q.status === "pending") &&
    (search === "" || c.title.includes(search) || c.id.includes(search))
  )

  return (
    <div className="space-y-6">
      {/* Pending */}
      <div className="bg-card rounded-2xl border border-border p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-foreground flex items-center gap-2">
            <ListOrdered className="w-4 h-4 text-primary" />
            תור פרסום ({pending.length})
          </h2>
          <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 font-semibold transition-colors">
            <Plus className="w-4 h-4" />מהרשימה
          </button>
        </div>

        {showAdd && (
          <div className="mb-4 p-4 rounded-xl bg-muted border border-border">
            <input type="text" placeholder="חפש..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring mb-3" />
            <div className="grid grid-cols-2 gap-2 max-h-52 overflow-y-auto">
              {availableCalcs.slice(0, 20).map(calc => (
                <button key={calc.id} onClick={() => { onAddExisting(calc.id); setShowAdd(false); setSearch("") }}
                  className="text-right px-3 py-2 rounded-lg border border-border bg-card hover:border-primary hover:bg-primary/5 transition-colors text-sm">
                  <div className="font-medium text-foreground truncate">{calc.shortTitle}</div>
                  <div className="text-xs text-muted-foreground">{CATEGORY_LABELS[calc.categorySlug ?? ""] ?? calc.categorySlug}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {pending.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground text-sm">התור ריק</div>
        ) : (
          <div className="space-y-2">
            {pending.map((item, idx) => (
              <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-background hover:border-primary/30 transition-colors group">
                <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary text-xs font-extrabold flex items-center justify-center shrink-0">{idx + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-foreground truncate">{item.calculator_title}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                    <span>{CATEGORY_LABELS[item.calculator_category ?? ""] ?? item.calculator_category}</span>
                    {item.scheduled_date && <span className="flex items-center gap-0.5"><Calendar className="w-3 h-3" />{new Date(item.scheduled_date).toLocaleDateString("he-IL")}</span>}
                    {item.notes && <span className="text-primary truncate max-w-32">• {item.notes}</span>}
                  </div>
                </div>
                {idx === 0 && <span className="text-xs bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full font-bold shrink-0">מחר</span>}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => onMoveUp(item.id)} disabled={idx === 0} className="p-1.5 rounded hover:bg-muted disabled:opacity-30 transition-colors" title="למעלה"><ArrowUp className="w-3.5 h-3.5 text-muted-foreground" /></button>
                  <button onClick={() => onMoveDown(item.id)} disabled={idx === pending.length - 1} className="p-1.5 rounded hover:bg-muted disabled:opacity-30 transition-colors" title="למטה"><ArrowDown className="w-3.5 h-3.5 text-muted-foreground" /></button>
                  <button onClick={() => { setEditingNotes(item.id); setNotesVal(item.notes ?? "") }} className="p-1.5 rounded hover:bg-muted transition-colors text-xs text-muted-foreground px-2">הערה</button>
                  <button onClick={() => onEdit(item)} className="p-1.5 rounded hover:bg-muted transition-colors" title="עריכה"><Pencil className="w-3.5 h-3.5 text-muted-foreground" /></button>
                  <button onClick={() => onSkip(item.id)} className="p-1.5 rounded hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors" title="דלג"><SkipForward className="w-3.5 h-3.5 text-amber-500" /></button>
                  <button onClick={() => onDelete(item)} className="p-1.5 rounded hover:bg-destructive/10 transition-colors" title="מחק"><Trash2 className="w-3.5 h-3.5 text-destructive" /></button>
                </div>
              </div>
            ))}
          </div>
        )}

        {editingNotes && (
          <div className="mt-3 p-3 rounded-xl bg-muted border border-border flex gap-2">
            <input type="text" value={notesVal} onChange={e => setNotesVal(e.target.value)} placeholder="הוסף הערה..."
              className="flex-1 text-sm px-3 py-1.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              onKeyDown={e => { if (e.key === "Enter") { onUpdateNotes(editingNotes, notesVal); setEditingNotes(null) } if (e.key === "Escape") setEditingNotes(null) }} />
            <button onClick={() => { onUpdateNotes(editingNotes, notesVal); setEditingNotes(null) }} className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-bold">שמור</button>
          </div>
        )}
      </div>

      {/* Skipped */}
      {skippedItems.length > 0 && (
        <div className="bg-card rounded-2xl border border-border p-5">
          <h3 className="font-bold text-sm text-muted-foreground mb-3">דלגו ({skippedItems.length})</h3>
          <div className="space-y-1.5">
            {skippedItems.map(item => (
              <div key={item.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <span className="text-sm text-muted-foreground">{item.calculator_title}</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => onRestore(item.id)} className="text-xs text-primary hover:underline font-medium">החזר לתור</button>
                  <button onClick={() => onDelete(item)} className="text-destructive hover:opacity-70"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Published */}
      {published.length > 0 && (
        <div className="bg-card rounded-2xl border border-border p-5">
          <h3 className="font-bold text-sm text-muted-foreground mb-3">פורסמו ({published.length})</h3>
          <div className="space-y-1.5 max-h-60 overflow-y-auto">
            {published.map(item => (
              <div key={item.id} className="flex items-center gap-2 py-1.5 border-b border-border last:border-0">
                <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />
                <span className="text-sm text-foreground flex-1">{item.calculator_title}</span>
                <span className="text-xs text-muted-foreground">{item.published_at ? new Date(item.published_at).toLocaleDateString("he-IL") : ""}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── History Tab ──────────────────────────────────────────────────
function HistoryTab({ history }: { history: DailyFeatured[] }) {
  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <h2 className="font-bold text-foreground">היסטוריית פרסום</h2>
        <span className="text-sm text-muted-foreground">{history.length} ימים</span>
      </div>
      {history.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground text-sm">אין היסטוריה עדיין</div>
      ) : (
        <div className="divide-y divide-border">
          {history.map((item, idx) => (
            <div key={item.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/50 transition-colors">
              <span className="text-xs text-muted-foreground w-6 text-center font-mono">{idx + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-foreground">{item.calculator_title}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {new Date(item.date).toLocaleDateString("he-IL", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                {new Date(item.published_at).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })}
              </div>
              <Link to={`/calculators/${item.calculator_slug}`} target="_blank" className="text-primary hover:opacity-70 shrink-0">
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Settings Tab ─────────────────────────────────────────────────
// ─── Shared Sub-components ────────────────────────────────────────
function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: number; sub: string }) {
  return (
    <div className="bg-card rounded-2xl border border-border p-5">
      <div className="flex items-center gap-2 mb-3">{icon}<span className="text-sm text-muted-foreground font-medium">{label}</span></div>
      <div className="text-3xl font-extrabold text-foreground">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{sub}</div>
    </div>
  )
}
