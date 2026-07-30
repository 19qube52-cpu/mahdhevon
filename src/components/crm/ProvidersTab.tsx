import { useState, useEffect } from "react"
import {
  Key, CheckCircle2, XCircle, Loader2, RefreshCw, Save,
  ChevronDown, ChevronUp, Send, Eye, EyeOff, Zap
} from "lucide-react"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"

const SUPA_URL = import.meta.env.VITE_SUPABASE_URL as string
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string

async function pmOp(action: string, body: Record<string, unknown>) {
  const res = await fetch(`${SUPA_URL}/functions/v1/provider-manager`, {
    method: "POST",
    headers: { Authorization: `Bearer ${ANON_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...body }),
  })
  return res.json()
}

interface ProviderRow {
  id: string
  provider: string
  display_name: string
  logo_emoji: string
  base_url: string | null
  default_model: string
  priority: number
  is_active: boolean
  has_key: boolean
  api_key_masked: string | null
  error_count: number
  last_error: string | null
  last_used_at: string | null
  total_calls: number
}

const PROVIDER_DOCS: Record<string, { docs: string; keyUrl: string }> = {
  grok:       { docs: "platform.openai.com compatible", keyUrl: "https://console.x.ai" },
  openai:     { docs: "GPT-4o, GPT-4o-mini",            keyUrl: "https://platform.openai.com/api-keys" },
  anthropic:  { docs: "Claude 3.5 Haiku / Sonnet",       keyUrl: "https://console.anthropic.com" },
  gemini:     { docs: "Gemini 2.0 Flash / Pro",          keyUrl: "https://aistudio.google.com/app/apikey" },
  openrouter: { docs: "Routing לכל מודל, Free tier",     keyUrl: "https://openrouter.ai/keys" },
  ollama:     { docs: "מקומי — הגדר URL ומודל",          keyUrl: "" },
}

export function ProvidersTab({ onToast }: { onToast: (msg: string, type?: "success" | "error") => void }) {
  const [providers, setProviders] = useState<ProviderRow[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [editKey, setEditKey] = useState<Record<string, string>>({})
  const [editModel, setEditModel] = useState<Record<string, string>>({})
  const [editUrl, setEditUrl] = useState<Record<string, string>>({})
  const [showKey, setShowKey] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState<string | null>(null)
  const [testing, setTesting] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<Record<string, { ok: boolean; msg: string }>>({})

  // Telegram settings
  const [telegramChatId, setTelegramChatId] = useState("")
  const [savingTelegram, setSavingTelegram] = useState(false)
  const [telegramBotConfigured, setTelegramBotConfigured] = useState<boolean | null>(null)

  const load = async () => {
    setLoading(true)
    const { data } = await supabase.from("ai_providers_public").select("*")
    if (data) setProviders(data as ProviderRow[])
    const { data: chatSetting } = await supabase.from("site_settings").select("value").eq("key", "telegram_chat_id").single()
    if (chatSetting) setTelegramChatId(chatSetting.value ?? "")
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const saveProvider = async (p: ProviderRow) => {
    setSaving(p.provider)
    const result = await pmOp("save_key", {
      provider: p.provider,
      api_key: editKey[p.provider] || undefined,
      default_model: editModel[p.provider] || undefined,
      base_url: editUrl[p.provider] || undefined,
    })
    if (result.ok) { onToast(`${p.display_name} עודכן`); await load() }
    else onToast(result.error, "error")
    setSaving(null)
  }

  const toggleActive = async (p: ProviderRow) => {
    const result = await pmOp("save_key", { provider: p.provider, is_active: !p.is_active })
    if (result.ok) await load()
    else onToast(result.error, "error")
  }

  const testProvider = async (p: ProviderRow) => {
    setTesting(p.provider)
    setTestResult(prev => ({ ...prev, [p.provider]: { ok: false, msg: "בודק..." } }))
    const result = await pmOp("test_provider", { provider: p.provider })
    setTestResult(prev => ({ ...prev, [p.provider]: { ok: result.ok, msg: result.message ?? result.error } }))
    if (result.ok) onToast(`${p.display_name}: בדיקה עברה`)
    else onToast(`${p.display_name}: ${result.error}`, "error")
    setTesting(null)
  }

  const saveTelegram = async () => {
    setSavingTelegram(true)
    const result = await pmOp("save_telegram", { chat_id: telegramChatId })
    if (result.ok) {
      setTelegramBotConfigured(result.bot_token_configured)
      onToast("הגדרות טלגרם נשמרו")
    } else onToast(result.error, "error")
    setSavingTelegram(false)
  }

  const sendTestAlert = async () => {
    const res = await fetch(`${SUPA_URL}/functions/v1/telegram-alerts`, {
      method: "POST",
      headers: { Authorization: `Bearer ${ANON_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ action: "stats" }),
    })
    const d = await res.json()
    if (d.ok) onToast("הודעת בדיקה נשלחה לטלגרם")
    else onToast(d.error ?? "שגיאה", "error")
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-l from-amber-50/50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/20 rounded-2xl border border-amber-200/50 dark:border-amber-800/30 p-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shrink-0">
            <Key className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-extrabold text-lg text-foreground">בנק מפתחות AI</h2>
            <p className="text-sm text-muted-foreground mt-0.5">6 פרובידרים עם fallback אוטומטי — כשפרובידר נכשל עובר לבא בתור</p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-4 text-sm">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <CheckCircle2 className="w-4 h-4 text-success" />
            {providers.filter(p => p.is_active && p.has_key).length} פעילים
          </span>
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Zap className="w-4 h-4 text-amber-500" />
            {providers.reduce((s, p) => s + (p.total_calls ?? 0), 0).toLocaleString()} calls סה"כ
          </span>
          <button onClick={load} className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
            <RefreshCw className="w-3.5 h-3.5" />רענן
          </button>
        </div>
      </div>

      {/* Provider cards */}
      <div className="space-y-3">
        {providers.map((p) => (
          <div key={p.id} className={cn(
            "bg-card rounded-2xl border transition-all",
            p.is_active && p.has_key ? "border-success/30" : "border-border"
          )}>
            {/* Row header */}
            <div className="flex items-center gap-3 p-4">
              <span className="text-2xl shrink-0">{p.logo_emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-foreground">{p.display_name}</span>
                  {p.is_active && p.has_key && <span className="text-xs bg-success/10 text-success px-2 py-0.5 rounded-full font-semibold">פעיל #{p.priority}</span>}
                  {p.error_count > 0 && <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded-full font-semibold">{p.error_count} שגיאות</span>}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {p.default_model} · {p.total_calls.toLocaleString()} calls
                  {p.api_key_masked && <span className="mr-2 font-mono">{p.api_key_masked}</span>}
                </div>
              </div>

              {/* Toggle active */}
              <button
                onClick={() => toggleActive(p)}
                className={cn(
                  "w-11 h-6 rounded-full transition-colors relative shrink-0",
                  p.is_active ? "bg-success" : "bg-muted"
                )}
              >
                <span className={cn(
                  "absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all",
                  p.is_active ? "right-0.5" : "left-0.5"
                )} />
              </button>

              <button
                onClick={() => setExpanded(expanded === p.provider ? null : p.provider)}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
              >
                {expanded === p.provider ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            {/* Expanded config */}
            {expanded === p.provider && (
              <div className="px-4 pb-4 border-t border-border pt-4 space-y-3">
                {PROVIDER_DOCS[p.provider] && (
                  <div className="text-xs text-muted-foreground bg-muted/60 rounded-lg px-3 py-2">
                    {PROVIDER_DOCS[p.provider].docs}
                    {PROVIDER_DOCS[p.provider].keyUrl && (
                      <a href={PROVIDER_DOCS[p.provider].keyUrl} target="_blank" rel="noopener noreferrer" className="mr-2 text-primary hover:underline">קבל מפתח ↗</a>
                    )}
                  </div>
                )}

                {/* API Key input */}
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
                    {p.provider === "ollama" ? "URL מקומי (לא נדרש מפתח)" : "מפתח API"}
                  </label>
                  <div className="relative">
                    <input
                      type={showKey[p.provider] ? "text" : "password"}
                      value={editKey[p.provider] ?? ""}
                      onChange={e => setEditKey(prev => ({ ...prev, [p.provider]: e.target.value }))}
                      placeholder={p.has_key ? p.api_key_masked ?? "••••••••" : "הכנס מפתח..."}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring font-mono pr-10"
                      dir="ltr"
                    />
                    <button
                      onClick={() => setShowKey(prev => ({ ...prev, [p.provider]: !prev[p.provider] }))}
                      className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showKey[p.provider] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1.5">מודל</label>
                    <input
                      value={editModel[p.provider] ?? p.default_model}
                      onChange={e => setEditModel(prev => ({ ...prev, [p.provider]: e.target.value }))}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring font-mono"
                      dir="ltr"
                    />
                  </div>
                  {(p.provider === "ollama" || p.provider === "openrouter") && (
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Base URL</label>
                      <input
                        value={editUrl[p.provider] ?? p.base_url ?? ""}
                        onChange={e => setEditUrl(prev => ({ ...prev, [p.provider]: e.target.value }))}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring font-mono"
                        dir="ltr"
                        placeholder="http://..."
                      />
                    </div>
                  )}
                </div>

                {/* Test result */}
                {testResult[p.provider] && (
                  <div className={cn("text-xs rounded-lg px-3 py-2 flex items-center gap-2",
                    testResult[p.provider].ok ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive")}>
                    {testResult[p.provider].ok ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <XCircle className="w-3.5 h-3.5 shrink-0" />}
                    {testResult[p.provider].msg}
                  </div>
                )}

                {p.last_error && (
                  <div className="text-xs bg-destructive/5 text-destructive rounded-lg px-3 py-2 break-all">
                    שגיאה אחרונה: {p.last_error}
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => saveProvider(p)}
                    disabled={saving === p.provider}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 disabled:opacity-50 transition-colors"
                  >
                    {saving === p.provider ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    שמור
                  </button>
                  <button
                    onClick={() => testProvider(p)}
                    disabled={testing === p.provider || !p.is_active}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border hover:bg-muted text-sm font-medium disabled:opacity-50 transition-colors"
                  >
                    {testing === p.provider ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                    בדוק
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Telegram section */}
      <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500 flex items-center justify-center shrink-0">
            <Send className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-foreground">טלגרם</h3>
            <p className="text-xs text-muted-foreground">התראות, סטטוס, וניהול מפתחות מהטלפון</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Chat ID</label>
            <input
              value={telegramChatId}
              onChange={e => setTelegramChatId(e.target.value)}
              placeholder="-1001234567890"
              className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring font-mono"
              dir="ltr"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Bot Token</label>
            <div className="px-3 py-2 text-sm rounded-lg border border-border bg-muted text-muted-foreground font-mono">
              {telegramBotConfigured === true ? "✅ מוגדר" : telegramBotConfigured === false ? "❌ חסר" : "TELEGRAM_BOT_TOKEN (secret)"}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={saveTelegram} disabled={savingTelegram} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-sky-500 text-white text-sm font-bold hover:bg-sky-600 disabled:opacity-50 transition-colors">
            {savingTelegram ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}שמור
          </button>
          <button onClick={sendTestAlert} className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border hover:bg-muted text-sm font-medium transition-colors">
            <Send className="w-3.5 h-3.5" />שלח בדיקה
          </button>
        </div>

        <div className="text-xs text-muted-foreground bg-muted/60 rounded-lg px-3 py-2 space-y-1">
          <p className="font-semibold text-foreground">פקודות בוט:</p>
          <p><code className="bg-background px-1 rounded">/status</code> — סטטוס מערכת</p>
          <p><code className="bg-background px-1 rounded">/providers</code> — רשימת פרובידרים</p>
          <p><code className="bg-background px-1 rounded">/key grok:xai-...</code> — הוסף מפתח מהטלפון</p>
        </div>
      </div>
    </div>
  )
}
