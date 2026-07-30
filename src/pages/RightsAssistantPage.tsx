import { useState, useRef } from "react"
import {
  Scale, Upload, Camera, X, Loader2, Sparkles, AlertTriangle, RotateCcw,
  ShieldCheck, FileText, Copy, Check, MessageCircle, Save, ClipboardList,
  Landmark, ChevronLeft, CheckCircle, Clock
} from "lucide-react"
import { cn } from "@/lib/utils"
import { usePageMeta } from "@/lib/seo"
import { useAuth } from "@/lib/auth"
import { supabase } from "@/lib/supabase"
import type { RightsResult } from "@/lib/supabase"
import { toast } from "sonner"
import { Link } from "react-router-dom"

const CASE_TYPES = [
  { value: "bituach-leumi", label: "ביטוח לאומי" },
  { value: "tax", label: "מסים ורשות המסים" },
  { value: "health", label: "בריאות וקופת חולים" },
  { value: "housing", label: "דיור ושיכון" },
  { value: "enforcement", label: "הוצאה לפועל וחובות" },
  { value: "employment", label: "עבודה ופיטורים" },
  { value: "general", label: "אחר / לא בטוח" },
]

type Step = "form" | "loading" | "result" | "error"
interface UploadImage { base64: string; mimeType: string; preview: string }

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve((reader.result as string).split(",")[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function RightsAssistantPage() {
  const { user, openAuthDialog } = useAuth()
  const [step, setStep] = useState<Step>("form")
  const [caseType, setCaseType] = useState("bituach-leumi")
  const [description, setDescription] = useState("")
  const [accusation, setAccusation] = useState("")
  const [images, setImages] = useState<UploadImage[]>([])
  const [result, setResult] = useState<RightsResult | null>(null)
  const [errorMsg, setErrorMsg] = useState("")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  usePageMeta({
    title: "פורטל הזכויות של מדינת ישראל — מצא מה מגיע לך | חשב לי",
    description: "מערכת חכמה שמנתחת את המקרה שלך, מוצאת את כל הזכויות שמגיעות לך מול ביטוח לאומי וכל משרד ממשלתי, ומנסחת עבורך מכתבים רשמיים מוכנים לשליחה.",
    canonical: `${window.location.origin}/rights`,
  })

  const addFiles = async (files: FileList | null) => {
    if (!files) return
    const next: UploadImage[] = []
    for (const file of Array.from(files).slice(0, 6 - images.length)) {
      if (!file.type.startsWith("image/")) continue
      if (file.size > 20 * 1024 * 1024) {
        toast.error("התמונה גדולה מדי (עד 20MB)")
        continue
      }
      const base64 = await fileToBase64(file)
      next.push({ base64, mimeType: file.type, preview: URL.createObjectURL(file) })
    }
    setImages((prev) => [...prev, ...next].slice(0, 6))
  }

  const removeImage = (i: number) => setImages((prev) => prev.filter((_, idx) => idx !== i))

  const canSubmit = description.trim().length > 0 || images.length > 0

  const analyze = async () => {
    if (!canSubmit) {
      toast.error("אנא תאר את המקרה או העלה תמונה")
      return
    }
    setStep("loading")
    setSaved(false)
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/rights-assistant`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          description,
          accusation,
          caseType,
          images: images.map((img) => ({ base64: img.base64, mimeType: img.mimeType })),
        }),
      })
      const data = await res.json()
      if (!res.ok || data.error || !data.result) {
        throw new Error(data.error ?? `שגיאת שרת (${res.status})`)
      }
      setResult(data.result as RightsResult)
      setStep("result")
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "אירעה שגיאה. אנא נסה שוב.")
      setStep("error")
    }
  }

  const reset = () => {
    setStep("form")
    setResult(null)
    setImages([])
    setDescription("")
    setAccusation("")
    setErrorMsg("")
    setSaved(false)
  }

  const doSave = async () => {
    if (!result) return
    setSaving(true)
    const { error } = await supabase.from("rights_cases").insert({
      title: result.caseTitle,
      case_type: caseType,
      description,
      accusation,
      ai_analysis: `${result.summary}\n\n${result.strategy}`,
      rights_found: result.rights,
      generated_letters: result.letters,
      status: "analyzed",
    })
    setSaving(false)
    if (error) {
      toast.error("שמירה נכשלה, נסה שוב")
      return
    }
    setSaved(true)
    toast.success("התיק נשמר בחשבון שלך")
  }

  const handleSave = () => {
    if (!user) {
      openAuthDialog(() => doSave())
      return
    }
    doSave()
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background">
      <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
        {/* Hero */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <Scale className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-2 leading-tight">
            פורטל הזכויות של מדינת ישראל
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto">
            ספר לנו מה קרה, צרף תמונות של המסמכים — והמערכת תמצא אילו זכויות מגיעות לך ותנסח עבורך מכתבים רשמיים לביטוח לאומי ולכל משרד ממשלתי.
          </p>
          <div className="flex items-center justify-center gap-1.5 mt-3">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary font-semibold">מופעל על ידי Grok AI של x.ai</span>
          </div>
        </div>

        {step === "form" && (
          <div className="space-y-5">
            {/* Case type */}
            <section className="bg-card border border-border rounded-2xl p-5">
              <label className="flex items-center gap-2 font-bold text-foreground mb-3">
                <Landmark className="w-5 h-5 text-primary" />
                באיזה תחום מדובר?
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {CASE_TYPES.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setCaseType(t.value)}
                    className={cn(
                      "px-3 py-2.5 rounded-xl text-sm font-medium border transition-colors text-center",
                      caseType === t.value
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </section>

            {/* Description */}
            <section className="bg-card border border-border rounded-2xl p-5">
              <label htmlFor="desc" className="flex items-center gap-2 font-bold text-foreground mb-3">
                <ClipboardList className="w-5 h-5 text-primary" />
                מה קרה? ספר לנו את כל הפרטים
              </label>
              <textarea
                id="desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                placeholder="לדוגמה: קיבלתי מכתב מביטוח לאומי שדוחה את בקשתי לקצבת נכות. עבדתי 20 שנה, ובחצי שנה האחרונה איבדתי את היכולת לעבוד בגלל..."
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground/60 resize-y focus:outline-none focus:ring-2 focus:ring-ring leading-relaxed"
              />
            </section>

            {/* Accusation / problem */}
            <section className="bg-card border border-border rounded-2xl p-5">
              <label htmlFor="acc" className="flex items-center gap-2 font-bold text-foreground mb-3">
                <AlertTriangle className="w-5 h-5 text-primary" />
                במה אתה מואשם או מה הבעיה המרכזית? <span className="text-sm font-normal text-muted-foreground">(לא חובה)</span>
              </label>
              <textarea
                id="acc"
                value={accusation}
                onChange={(e) => setAccusation(e.target.value)}
                rows={3}
                placeholder="לדוגמה: טוענים שלא דיווחתי על הכנסה, או שדחו לי בקשה, או שדורשים ממני להחזיר כסף..."
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground/60 resize-y focus:outline-none focus:ring-2 focus:ring-ring leading-relaxed"
              />
            </section>

            {/* Images */}
            <section className="bg-card border border-border rounded-2xl p-5">
              <label className="flex items-center gap-2 font-bold text-foreground mb-3">
                <FileText className="w-5 h-5 text-primary" />
                צרף תמונות של מסמכים ומכתבים <span className="text-sm font-normal text-muted-foreground">(עד 6)</span>
              </label>

              {images.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 mb-3">
                  {images.map((img, i) => (
                    <div key={i} className="relative group aspect-square rounded-xl overflow-hidden border border-border bg-muted">
                      <img src={img.preview} alt={`מסמך ${i + 1}`} className="w-full h-full object-cover" />
                      <button
                        onClick={() => removeImage(i)}
                        className="absolute top-1 left-1 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-90 hover:opacity-100"
                        aria-label="הסר תמונה"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {images.length < 6 && (
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center justify-center gap-2 py-3.5 rounded-xl border-2 border-dashed border-primary/40 text-primary hover:bg-primary/5 hover:border-primary transition-colors font-medium"
                  >
                    <Upload className="w-5 h-5" />
                    העלה תמונה
                  </button>
                  <button
                    onClick={() => cameraInputRef.current?.click()}
                    className="flex items-center justify-center gap-2 py-3.5 rounded-xl border-2 border-dashed border-success/40 text-success hover:bg-success/5 hover:border-success transition-colors font-medium"
                  >
                    <Camera className="w-5 h-5" />
                    צלם מסמך
                  </button>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={(e) => addFiles(e.target.files)} className="hidden" />
              <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={(e) => addFiles(e.target.files)} className="hidden" />
            </section>

            {/* Submit */}
            <button
              onClick={analyze}
              disabled={!canSubmit}
              className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-primary/20"
            >
              <ShieldCheck className="w-6 h-6" />
              מצא את הזכויות שלי
            </button>
            <p className="text-xs text-muted-foreground text-center">
              המידע נשלח לניתוח מאובטח. השירות אינו מהווה ייעוץ משפטי.
            </p>
          </div>
        )}

        {step === "loading" && (
          <div className="bg-card border border-border rounded-3xl p-10 text-center space-y-4">
            <div className="relative inline-flex">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-primary-foreground" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">בודק את המקרה שלך...</p>
              <p className="text-muted-foreground mt-2 text-lg">המערכת מחפשת את כל הזכויות שמגיעות לך ומנסחת מכתבים רשמיים</p>
            </div>
            <div className="flex justify-center gap-1.5">
              {[0, 1, 2].map((i) => (
                <div key={i} className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: `${i * 0.2}s` }} />
              ))}
            </div>
          </div>
        )}

        {step === "error" && (
          <div className="bg-destructive/5 border border-destructive/20 rounded-3xl p-8 text-center space-y-4">
            <AlertTriangle className="w-14 h-14 text-destructive mx-auto" />
            <div>
              <p className="text-2xl font-bold text-foreground">אירעה שגיאה</p>
              <p className="text-destructive mt-2 text-lg">{errorMsg}</p>
            </div>
            <button
              onClick={() => setStep("form")}
              className="flex items-center gap-2 mx-auto px-6 py-3 bg-primary text-primary-foreground rounded-2xl font-bold text-lg hover:bg-primary/90 transition-colors"
            >
              <RotateCcw className="w-5 h-5" />
              חזרה לטופס
            </button>
          </div>
        )}

        {step === "result" && result && (
          <ResultView
            result={result}
            saving={saving}
            saved={saved}
            onSave={handleSave}
            onReset={reset}
          />
        )}
      </div>
    </div>
  )
}

function UrgencyBanner({ urgency }: { urgency: "low" | "medium" | "high" }) {
  const config = {
    low: { icon: <CheckCircle className="w-5 h-5" />, label: "אין דחיפות מיידית", className: "bg-success/8 border-success/20 text-success" },
    medium: { icon: <Clock className="w-5 h-5" />, label: "שים לב לתאריכים ולמועדים", className: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400" },
    high: { icon: <AlertTriangle className="w-5 h-5" />, label: "דחוף — יש מועד קרוב, פעל מהר!", className: "bg-destructive/8 border-destructive/20 text-destructive" },
  }
  const c = config[urgency]
  return (
    <div className={cn("flex items-center gap-3 px-4 py-3.5 rounded-2xl border font-bold", c.className)}>
      {c.icon}
      {c.label}
    </div>
  )
}

function ResultView({
  result, saving, saved, onSave, onReset,
}: {
  result: RightsResult
  saving: boolean
  saved: boolean
  onSave: () => void
  onReset: () => void
}) {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)

  const copyLetter = (idx: number, letter: { to: string; subject: string; body: string }) => {
    navigator.clipboard.writeText(`אל: ${letter.to}\nנושא: ${letter.subject}\n\n${letter.body}`)
    setCopiedIdx(idx)
    setTimeout(() => setCopiedIdx(null), 2000)
  }

  const shareLetter = (letter: { to: string; subject: string; body: string }) => {
    const msg = encodeURIComponent(`אל: ${letter.to}\nנושא: ${letter.subject}\n\n${letter.body}`)
    window.open(`https://wa.me/?text=${msg}`, "_blank", "noopener")
  }

  return (
    <div className="space-y-5">
      <UrgencyBanner urgency={result.urgency} />

      {/* Summary block */}
      <section className="bg-card border border-border rounded-2xl p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1.5 h-6 bg-primary rounded-full" />
          <h2 className="font-bold text-lg text-foreground">{result.caseTitle}</h2>
        </div>
        <p className="text-foreground leading-relaxed whitespace-pre-wrap">{result.summary}</p>
      </section>

      {/* Strategy block */}
      {result.strategy && (
        <section className="bg-primary/5 border border-primary/20 rounded-2xl p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck className="w-5 h-5 text-primary shrink-0" />
            <h2 className="font-bold text-foreground">האסטרטגיה המומלצת</h2>
          </div>
          <p className="text-foreground leading-relaxed whitespace-pre-wrap">{result.strategy}</p>
        </section>
      )}

      {/* Rights — each in its own block */}
      {result.rights.length > 0 && (
        <div className="space-y-3">
          <h2 className="flex items-center gap-2 font-bold text-lg text-foreground px-1">
            <Scale className="w-5 h-5 text-primary" />
            הזכויות שמגיעות לך ({result.rights.length})
          </h2>
          {result.rights.map((r, i) => (
            <section key={i} className="bg-card border border-border rounded-2xl p-5">
              <div className="flex items-start justify-between gap-3 mb-2">
                <h3 className="font-bold text-foreground">{r.title}</h3>
                <span className="shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary">{r.authority}</span>
              </div>
              <p className="text-muted-foreground leading-relaxed mb-3">{r.description}</p>
              {r.howToClaim && (
                <div className="bg-success/8 border border-success/20 rounded-xl p-3.5">
                  <div className="flex items-center gap-1.5 text-success font-semibold text-sm mb-1">
                    <ChevronLeft className="w-4 h-4" />
                    איך ממשים
                  </div>
                  <p className="text-foreground text-sm leading-relaxed whitespace-pre-wrap">{r.howToClaim}</p>
                </div>
              )}
            </section>
          ))}
        </div>
      )}

      {/* Letters — each in its own block */}
      {result.letters.length > 0 && (
        <div className="space-y-3">
          <h2 className="flex items-center gap-2 font-bold text-lg text-foreground px-1">
            <FileText className="w-5 h-5 text-primary" />
            מכתבים מוכנים לשליחה ({result.letters.length})
          </h2>
          {result.letters.map((l, i) => (
            <section key={i} className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-border bg-muted/40">
                <div className="text-xs font-semibold text-muted-foreground">אל: {l.to}</div>
                <div className="font-bold text-foreground mt-0.5">{l.subject}</div>
              </div>
              <div className="p-5">
                <p className="text-foreground leading-relaxed whitespace-pre-wrap text-[15px]">{l.body}</p>
              </div>
              <div className="grid grid-cols-2 gap-2.5 px-5 pb-5">
                <button
                  onClick={() => copyLetter(i, l)}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border hover:bg-muted transition-colors font-medium text-sm text-foreground"
                >
                  {copiedIdx === i ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                  {copiedIdx === i ? "הועתק!" : "העתק מכתב"}
                </button>
                <button
                  onClick={() => shareLetter(l)}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#25D366]/10 border border-[#25D366]/30 text-[#128C7E] dark:text-[#25D366] hover:bg-[#25D366]/20 transition-colors font-medium text-sm"
                >
                  <MessageCircle className="w-4 h-4" />
                  שלח בוואטסאפ
                </button>
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
        <button
          onClick={onSave}
          disabled={saving || saved}
          className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 disabled:opacity-60 transition-colors"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : saved ? <Check className="w-5 h-5" /> : <Save className="w-5 h-5" />}
          {saved ? "נשמר בחשבון" : "שמור תיק בחשבון"}
        </button>
        <button
          onClick={onReset}
          className="flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-border hover:bg-muted transition-colors font-bold text-foreground"
        >
          <RotateCcw className="w-5 h-5" />
          מקרה חדש
        </button>
      </div>

      <div className="bg-muted/40 border border-border rounded-2xl p-4 text-center">
        <p className="text-sm text-muted-foreground leading-relaxed">
          המידע והמכתבים נוצרו על ידי AI ומיועדים לסיוע ראשוני בלבד. הם אינם מהווים ייעוץ משפטי. לפני שליחה מומלץ לבדוק את הפרטים.{" "}
          <Link to="/letter-explainer" className="text-primary font-medium hover:underline">קיבלת מכתב שאינך מבין? פענח אותו כאן</Link>
        </p>
      </div>
    </div>
  )
}
