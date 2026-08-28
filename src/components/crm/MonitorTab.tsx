import { useState, useCallback } from "react"
import {
  Activity, CheckCircle2, XCircle, Loader2, RefreshCw,
  Globe, Database, Zap, Server, Clock, AlertTriangle
} from "lucide-react"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"
import { adminFetch } from "@/lib/admin-api"


type CheckStatus = "pending" | "running" | "pass" | "fail" | "skip"

interface HealthCheck {
  id: string
  label: string
  category: string
  icon: React.ReactNode
  run: () => Promise<{ ok: boolean; detail: string; latencyMs?: number }>
}

const CHECKS: HealthCheck[] = [
  {
    id: "db_queue", label: "DB: טבלת תור", category: "מסד נתונים",
    icon: <Database className="w-4 h-4" />,
    run: async () => {
      const t0 = Date.now()
      const { error } = await supabase.from("calculator_queue").select("id", { count: "exact", head: true })
      return error ? { ok: false, detail: error.message } : { ok: true, detail: `תקין`, latencyMs: Date.now() - t0 }
    },
  },
  {
    id: "db_featured", label: "DB: featured היום", category: "מסד נתונים",
    icon: <Database className="w-4 h-4" />,
    run: async () => {
      const t0 = Date.now()
      const today = new Date().toISOString().split("T")[0]
      const { data, error } = await supabase.from("daily_featured").select("calculator_title").eq("date", today).maybeSingle()
      if (error) return { ok: false, detail: error.message }
      return { ok: true, detail: data ? `✓ ${data.calculator_title}` : "לא פורסם עדיין", latencyMs: Date.now() - t0 }
    },
  },
  {
    id: "db_providers", label: "DB: פרובידרי AI", category: "מסד נתונים",
    icon: <Database className="w-4 h-4" />,
    run: async () => {
      const t0 = Date.now()
      const { data, error } = await supabase.from("ai_providers_public").select("provider, is_active, has_key")
      if (error) return { ok: false, detail: error.message }
      const active = (data ?? []).filter((p: { is_active: boolean; has_key: boolean }) => p.is_active && p.has_key).length
      return { ok: active > 0, detail: `${active} פרובידרים פעילים עם מפתח`, latencyMs: Date.now() - t0 }
    },
  },
  {
    id: "db_ai_content", label: "DB: תוכן AI", category: "מסד נתונים",
    icon: <Database className="w-4 h-4" />,
    run: async () => {
      const t0 = Date.now()
      const { count, error } = await supabase.from("ai_content").select("*", { count: "exact", head: true })
      return error ? { ok: false, detail: error.message } : { ok: true, detail: `${count} רשומות`, latencyMs: Date.now() - t0 }
    },
  },
  {
    id: "fn_publish", label: "Edge: publish-daily-calculator", category: "Edge Functions",
    icon: <Zap className="w-4 h-4" />,
    run: async () => {
      const t0 = Date.now()
      const res = await adminFetch("publish-daily-calculator", {
        method: "POST",

        body: JSON.stringify({ dry_run: true }),
      }).catch((e: Error) => ({ ok: false, status: 0, text: async () => e.message }))
      if (!res.ok && (res as Response).status !== 200) {
        return { ok: (res as Response).status !== 500, detail: `status ${(res as Response).status}`, latencyMs: Date.now() - t0 }
      }
      return { ok: true, detail: `זמין (${Date.now() - t0}ms)`, latencyMs: Date.now() - t0 }
    },
  },
  {
    id: "fn_ai", label: "Edge: ai-crm-assistant", category: "Edge Functions",
    icon: <Zap className="w-4 h-4" />,
    run: async () => {
      const t0 = Date.now()
      const res = await adminFetch("ai-crm-assistant", {
        method: "OPTIONS",
      }).catch(() => null)
      return { ok: res?.ok ?? false, detail: res?.ok ? "זמין" : "לא מגיב", latencyMs: Date.now() - t0 }
    },
  },
  {
    id: "fn_telegram", label: "Edge: telegram-alerts", category: "Edge Functions",
    icon: <Zap className="w-4 h-4" />,
    run: async () => {
      const t0 = Date.now()
      const res = await adminFetch("telegram-alerts", {
        method: "POST", body: JSON.stringify({ action: "test" }),
      }).catch(() => null)
      return { ok: res?.ok ?? false, detail: res?.ok ? "זמין" : "לא מגיב", latencyMs: Date.now() - t0 }
    },
  },
  {
    id: "fn_provider", label: "Edge: provider-manager", category: "Edge Functions",
    icon: <Zap className="w-4 h-4" />,
    run: async () => {
      const t0 = Date.now()
      const res = await adminFetch("provider-manager", {
        method: "OPTIONS",

      }).catch(() => null)
      return { ok: res?.ok ?? false, detail: res?.ok ? "זמין" : "לא מגיב", latencyMs: Date.now() - t0 }
    },
  },
  {
    id: "page_home", label: "דף הבית", category: "דפי האתר",
    icon: <Globe className="w-4 h-4" />,
    run: async () => {
      const t0 = Date.now()
      const res = await fetch(window.location.origin + "/", { method: "HEAD" }).catch(() => null)
      return { ok: res?.ok ?? false, detail: res?.ok ? "זמין" : "לא מגיב", latencyMs: Date.now() - t0 }
    },
  },
  {
    id: "page_calc", label: "דף מחשבון לדוגמה", category: "דפי האתר",
    icon: <Globe className="w-4 h-4" />,
    run: async () => {
      const t0 = Date.now()
      const res = await fetch(window.location.origin + "/calculators/income-tax", { method: "HEAD" }).catch(() => null)
      return { ok: res?.ok ?? false, detail: res?.ok ? "זמין" : "לא מגיב", latencyMs: Date.now() - t0 }
    },
  },
]

export function MonitorTab() {
  const [results, setResults] = useState<Record<string, { status: CheckStatus; detail: string; latencyMs?: number }>>({})
  const [running, setRunning] = useState(false)
  const [lastRun, setLastRun] = useState<Date | null>(null)

  const runAll = useCallback(async () => {
    setRunning(true)
    // Set all to running
    const initial: Record<string, { status: CheckStatus; detail: string }> = {}
    CHECKS.forEach(c => { initial[c.id] = { status: "running", detail: "בודק..." } })
    setResults(initial)

    // Run all checks in parallel
    await Promise.allSettled(CHECKS.map(async (check) => {
      const result = await check.run()
      setResults(prev => ({ ...prev, [check.id]: { status: result.ok ? "pass" : "fail", detail: result.detail, latencyMs: result.latencyMs } }))
    }))

    setRunning(false)
    setLastRun(new Date())
  }, [])

  const categories = [...new Set(CHECKS.map(c => c.category))]
  const passCount = Object.values(results).filter(r => r.status === "pass").length
  const failCount = Object.values(results).filter(r => r.status === "fail").length
  const totalRan = Object.values(results).filter(r => r.status === "pass" || r.status === "fail").length

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-l from-teal-50/50 to-emerald-50/50 dark:from-teal-950/20 dark:to-emerald-950/20 rounded-2xl border border-teal-200/50 dark:border-teal-800/30 p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center shrink-0">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-extrabold text-lg text-foreground">מוניטור בריאות מערכת</h2>
              <p className="text-sm text-muted-foreground mt-0.5">{CHECKS.length} בדיקות: DB, Edge Functions, דפי האתר</p>
            </div>
          </div>
          <button
            onClick={runAll}
            disabled={running}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            הפעל הכל
          </button>
        </div>

        {totalRan > 0 && (
          <div className="mt-4 flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1.5 text-success font-semibold"><CheckCircle2 className="w-4 h-4" />{passCount} עברו</span>
            {failCount > 0 && <span className="flex items-center gap-1.5 text-destructive font-semibold"><XCircle className="w-4 h-4" />{failCount} נכשלו</span>}
            {lastRun && <span className="flex items-center gap-1.5 text-muted-foreground"><Clock className="w-3.5 h-3.5" />
              {lastRun.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>}
          </div>
        )}
      </div>

      {/* Checks by category */}
      {categories.map(cat => (
        <div key={cat} className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="px-5 py-3 border-b border-border bg-muted/30 flex items-center gap-2">
            <Server className="w-4 h-4 text-muted-foreground" />
            <span className="font-semibold text-sm text-foreground">{cat}</span>
          </div>
          <div className="divide-y divide-border">
            {CHECKS.filter(c => c.category === cat).map(check => {
              const result = results[check.id]
              const status = result?.status ?? "pending"
              return (
                <div key={check.id} className="flex items-center gap-3 px-5 py-3.5">
                  <StatusIcon status={status} />
                  <div className={cn("shrink-0", statusColor(status))}>{check.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground">{check.label}</div>
                    {result && <div className="text-xs text-muted-foreground mt-0.5">{result.detail}</div>}
                  </div>
                  {result?.latencyMs !== undefined && (
                    <span className={cn("text-xs font-mono shrink-0",
                      result.latencyMs < 200 ? "text-success" : result.latencyMs < 800 ? "text-amber-500" : "text-destructive")}>
                      {result.latencyMs}ms
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {totalRan === 0 && (
        <div className="bg-card rounded-2xl border border-dashed border-border p-12 text-center">
          <Activity className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">לחץ "הפעל הכל" להרצת כל בדיקות המערכת</p>
        </div>
      )}
    </div>
  )
}

function StatusIcon({ status }: { status: CheckStatus }) {
  if (status === "running") return <Loader2 className="w-4 h-4 animate-spin text-primary shrink-0" />
  if (status === "pass") return <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
  if (status === "fail") return <XCircle className="w-4 h-4 text-destructive shrink-0" />
  if (status === "skip") return <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
  return <div className="w-4 h-4 rounded-full border-2 border-muted shrink-0" />
}

function statusColor(status: CheckStatus) {
  if (status === "pass") return "text-success"
  if (status === "fail") return "text-destructive"
  if (status === "running") return "text-primary"
  return "text-muted-foreground"
}
