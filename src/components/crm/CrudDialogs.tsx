import { useState } from "react"
import { X, Save, Calendar, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { type QueueItem } from "@/lib/supabase"

const CATEGORY_OPTIONS = [
  { value: "salary-tax",     label: "שכר ומסים" },
  { value: "mortgage-loans", label: "משכנתא והלוואות" },
  { value: "health",         label: "בריאות" },
  { value: "pension",        label: "פנסיה" },
  { value: "savings",        label: "חיסכון" },
  { value: "bituach-leumi",  label: "ביטוח לאומי" },
  { value: "self-employed",  label: "עצמאים" },
  { value: "tax",            label: "מסים" },
  { value: "family-children",label: "משפחה וילדים" },
]

const STATUS_OPTIONS = [
  { value: "pending",   label: "ממתין" },
  { value: "skipped",   label: "דלוג" },
  { value: "published", label: "פורסם" },
]

interface EditItemDialogProps {
  item: QueueItem
  onSave: (id: string, fields: Partial<QueueItem>) => Promise<void>
  onClose: () => void
}

export function EditItemDialog({ item, onSave, onClose }: EditItemDialogProps) {
  const [title, setTitle] = useState(item.calculator_title)
  const [slug, setSlug] = useState(item.calculator_slug)
  const [category, setCategory] = useState(item.calculator_category ?? "")
  const [status, setStatus] = useState<QueueItem["status"]>(item.status)
  const [notes, setNotes] = useState(item.notes ?? "")
  const [scheduledDate, setScheduledDate] = useState(item.scheduled_date ?? "")
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    await onSave(item.id, {
      calculator_title: title,
      calculator_slug: slug,
      calculator_category: category || null,
      status,
      notes: notes || null,
      scheduled_date: scheduledDate || null,
    })
    setSaving(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-extrabold text-lg text-foreground">עריכת פריט</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <Field label="כותרת">
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              className={inputCls}
              placeholder="שם המחשבון"
            />
          </Field>

          <Field label="Slug (URL)">
            <input
              value={slug}
              onChange={e => setSlug(e.target.value)}
              className={cn(inputCls, "font-mono text-sm")}
              placeholder="calculator-slug"
              dir="ltr"
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="קטגוריה">
              <select value={category} onChange={e => setCategory(e.target.value)} className={inputCls}>
                <option value="">-- ללא --</option>
                {CATEGORY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>

            <Field label="סטטוס">
              <select value={status} onChange={e => setStatus(e.target.value as QueueItem["status"])} className={inputCls}>
                {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>
          </div>

          <Field label="תאריך פרסום מתוכנן">
            <div className="relative">
              <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                type="date"
                value={scheduledDate}
                onChange={e => setScheduledDate(e.target.value)}
                className={cn(inputCls, "pr-9")}
                dir="ltr"
              />
            </div>
          </Field>

          <Field label="הערות">
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              className={cn(inputCls, "resize-none")}
              placeholder="הערות פנימיות..."
            />
          </Field>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-border hover:bg-muted text-sm font-medium text-muted-foreground transition-colors">
            ביטול
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !title.trim()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            שמור
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Create new item dialog ────────────────────────────────────────
interface CreateItemDialogProps {
  nextPosition: number
  onSave: (fields: {
    calculator_id: string
    calculator_slug: string
    calculator_title: string
    calculator_category: string | null
    position: number
    notes: string | null
    scheduled_date: string | null
  }) => Promise<void>
  onClose: () => void
}

export function CreateItemDialog({ nextPosition, onSave, onClose }: CreateItemDialogProps) {
  const [title, setTitle] = useState("")
  const [id, setId] = useState("")
  const [slug, setSlug] = useState("")
  const [category, setCategory] = useState("")
  const [notes, setNotes] = useState("")
  const [scheduledDate, setScheduledDate] = useState("")
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!title.trim() || !id.trim()) return
    setSaving(true)
    await onSave({
      calculator_id: id.trim(),
      calculator_slug: slug.trim() || id.trim(),
      calculator_title: title.trim(),
      calculator_category: category || null,
      position: nextPosition,
      notes: notes.trim() || null,
      scheduled_date: scheduledDate || null,
    })
    setSaving(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-extrabold text-lg text-foreground">הוסף מחשבון חדש</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <Field label="שם המחשבון *">
            <input value={title} onChange={e => setTitle(e.target.value)} className={inputCls} placeholder="למשל: מחשבון מס הכנסה" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="מזהה (ID) *">
              <input value={id} onChange={e => setId(e.target.value)} className={cn(inputCls, "font-mono text-sm")} placeholder="income-tax" dir="ltr" />
            </Field>
            <Field label="Slug URL">
              <input value={slug} onChange={e => setSlug(e.target.value)} className={cn(inputCls, "font-mono text-sm")} placeholder="income-tax" dir="ltr" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="קטגוריה">
              <select value={category} onChange={e => setCategory(e.target.value)} className={inputCls}>
                <option value="">-- ללא --</option>
                {CATEGORY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>
            <Field label="תאריך מתוכנן">
              <input type="date" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} className={inputCls} dir="ltr" />
            </Field>
          </div>
          <Field label="הערות">
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className={cn(inputCls, "resize-none")} placeholder="הערות פנימיות..." />
          </Field>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-border hover:bg-muted text-sm font-medium text-muted-foreground transition-colors">
            ביטול
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !title.trim() || !id.trim()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            הוסף לתור
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Delete confirm dialog ─────────────────────────────────────────
interface DeleteDialogProps {
  title: string
  onConfirm: () => void
  onClose: () => void
}

export function DeleteDialog({ title, onConfirm, onClose }: DeleteDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
        <h2 className="font-extrabold text-lg text-foreground">מחיקת פריט</h2>
        <p className="text-sm text-muted-foreground">האם למחוק את <span className="font-semibold text-foreground">"{title}"</span> מהתור? פעולה זו אינה הפיכה.</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-border hover:bg-muted text-sm font-medium transition-colors">ביטול</button>
          <button onClick={onConfirm} className="px-4 py-2 rounded-lg bg-destructive text-white text-sm font-bold hover:bg-destructive/90 transition-colors">מחק</button>
        </div>
      </div>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────
const inputCls = "w-full px-3 py-2 text-sm rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground transition-colors"

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-muted-foreground">{label}</label>
      {children}
    </div>
  )
}
