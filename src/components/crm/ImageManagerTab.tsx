import { useCallback, useEffect, useMemo, useState } from "react"
import { Check, ImagePlus, Loader2, RefreshCw, Sparkles, X } from "lucide-react"
import { adminFetch } from "@/lib/admin-api"
import type { QueueItem } from "@/lib/supabase"

interface MediaAsset {
  id: string
  calculator_slug: string
  calculator_title: string
  model: string
  prompt: string
  approval_status: "draft" | "approved" | "rejected"
  preview_url?: string | null
  public_url?: string | null
  cost_in_usd_ticks?: number | null
  created_at: string
}

async function imageOp(body: Record<string, unknown>) {
  const response = await adminFetch("calculator-image", { method: "POST", body: JSON.stringify(body) })
  const data = await response.json()
  if (!response.ok || !data.ok) throw new Error(data.error ?? `HTTP ${response.status}`)
  return data
}

export function ImageManagerTab({ queue, onToast }: { queue: QueueItem[]; onToast: (message: string, type?: "success" | "error") => void }) {
  const [selectedId, setSelectedId] = useState(queue[0]?.id ?? "")
  const [description, setDescription] = useState("")
  const [customPrompt, setCustomPrompt] = useState("")
  const [assets, setAssets] = useState<MediaAsset[]>([])
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const selected = useMemo(() => queue.find((item) => item.id === selectedId), [queue, selectedId])

  const load = useCallback(async () => {
    setLoading(true)
    try { setAssets((await imageOp({ action: "list" })).assets ?? []) }
    catch (error) { onToast(error instanceof Error ? error.message : "טעינת התמונות נכשלה", "error") }
    finally { setLoading(false) }
  }, [onToast])

  useEffect(() => { load() }, [load])

  const generate = async () => {
    if (!selected) return
    setGenerating(true)
    try {
      await imageOp({
        action: "generate",
        calculator_id: selected.calculator_id,
        calculator_slug: selected.calculator_slug,
        calculator_title: selected.calculator_title,
        description: description || selected.notes || selected.calculator_category || "",
        prompt: customPrompt,
      })
      onToast("התמונה נוצרה כטיוטה — יש לבדוק ולאשר")
      await load()
    } catch (error) {
      onToast(error instanceof Error ? error.message : "יצירת התמונה נכשלה", "error")
    } finally { setGenerating(false) }
  }

  const review = async (id: string, action: "approve" | "reject") => {
    try {
      await imageOp({ action, id })
      onToast(action === "approve" ? "התמונה אושרה לפרסום" : "התמונה נדחתה")
      await load()
    } catch (error) { onToast(error instanceof Error ? error.message : "הפעולה נכשלה", "error") }
  }

  return (
    <div className="space-y-6" dir="rtl">
      <section className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500 text-white"><ImagePlus className="h-5 w-5" /></div>
          <div><h2 className="font-extrabold">יצירת תמונת מחשבון</h2><p className="text-sm text-muted-foreground">אותו סגנון פרימיום לכל מחשבון, ללא טקסט בתוך התמונה</p></div>
        </div>
        <select aria-label="בחירת מחשבון ליצירת תמונה" value={selectedId} onChange={(event) => setSelectedId(event.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2">
          <option value="">בחר מחשבון מהתור</option>
          {queue.map((item) => <option key={item.id} value={item.id}>{item.calculator_title} — {item.calculator_slug}</option>)}
        </select>
        <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={2} className="w-full rounded-lg border border-input bg-background px-3 py-2" placeholder="תיאור חזותי או מטרת המחשבון (אופציונלי)" />
        <textarea value={customPrompt} onChange={(event) => setCustomPrompt(event.target.value)} rows={2} className="w-full rounded-lg border border-input bg-background px-3 py-2" placeholder="הנחיות סגנון נוספות (אופציונלי)" />
        <button type="button" onClick={generate} disabled={!selected || generating} className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 font-bold text-white disabled:opacity-50">
          {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} צור תמונה עם xAI
        </button>
      </section>

      <section className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h3 className="font-bold">טיוטות ותמונות מאושרות</h3>
          <button type="button" aria-label="רענון רשימת התמונות" onClick={load} disabled={loading} className="p-2 text-muted-foreground"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /></button>
        </div>
        <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3">
          {assets.map((asset) => (
            <article key={asset.id} className="overflow-hidden rounded-xl border border-border">
              {(asset.preview_url || asset.public_url) && <img src={asset.preview_url || asset.public_url || ""} alt={`טיוטת תמונה עבור ${asset.calculator_title}`} className="aspect-video w-full object-cover" />}
              <div className="space-y-2 p-3">
                <div className="font-semibold">{asset.calculator_title}</div>
                <div className="text-xs text-muted-foreground">{asset.model} · {asset.approval_status}</div>
                {asset.approval_status === "draft" && <div className="flex gap-2">
                  <button type="button" onClick={() => review(asset.id, "approve")} className="inline-flex items-center gap-1 rounded-md bg-success px-3 py-1.5 text-xs font-bold text-white"><Check className="h-3.5 w-3.5" />אשר</button>
                  <button type="button" onClick={() => review(asset.id, "reject")} className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs"><X className="h-3.5 w-3.5" />דחה</button>
                </div>}
              </div>
            </article>
          ))}
          {!loading && assets.length === 0 && <p className="text-sm text-muted-foreground">עדיין לא נוצרו תמונות דרך הניהול.</p>}
        </div>
      </section>
    </div>
  )
}
