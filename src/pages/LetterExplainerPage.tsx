import { useState, useRef, useCallback, useEffect } from "react"
import {
  Upload, Camera, FileText, Volume2, VolumeX, ZoomIn, ZoomOut,
  RotateCcw, AlertTriangle, CheckCircle, Clock, Share2, Check,
  Loader2, Sparkles, ChevronDown, ChevronUp, MessageCircle
} from "lucide-react"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────
interface ExplainResult {
  sender: string
  topic: string
  plainExplanation: string
  whatToDo: string[]
  importantNumbers: string[]
  urgency: "low" | "medium" | "high"
  urgencyReason: string
}

// ─── TTS Hook ─────────────────────────────────────────────────────
function useSpeech() {
  const [speaking, setSpeaking] = useState(false)
  const [supported] = useState(() => typeof speechSynthesis !== "undefined")
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null)

  const speak = useCallback((text: string) => {
    if (!supported) return
    speechSynthesis.cancel()
    const utter = new SpeechSynthesisUtterance(text)
    utter.lang = "he-IL"
    utter.rate = 0.85
    utter.pitch = 1.05
    utter.volume = 1
    // Try to find a Hebrew voice
    const voices = speechSynthesis.getVoices()
    const heVoice = voices.find(v => v.lang.startsWith("he")) ?? voices.find(v => v.lang.startsWith("ar")) ?? voices[0]
    if (heVoice) utter.voice = heVoice
    utter.onstart = () => setSpeaking(true)
    utter.onend = () => setSpeaking(false)
    utter.onerror = () => setSpeaking(false)
    utterRef.current = utter
    speechSynthesis.speak(utter)
  }, [supported])

  const stop = useCallback(() => {
    speechSynthesis.cancel()
    setSpeaking(false)
  }, [])

  return { speak, stop, speaking, supported }
}

// ─── Main Page ────────────────────────────────────────────────────
export default function LetterExplainerPage() {
  const [step, setStep] = useState<"upload" | "loading" | "result" | "error">("upload")
  const [result, setResult] = useState<ExplainResult | null>(null)
  const [errorMsg, setErrorMsg] = useState("")
  const [fontSize, setFontSize] = useState(18)
  const [preview, setPreview] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [showTips, setShowTips] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const { speak, stop, speaking, supported: ttsSupported } = useSpeech()

  // Load voices when component mounts (Chrome needs a user gesture)
  useEffect(() => {
    if (typeof speechSynthesis !== "undefined") {
      speechSynthesis.getVoices()
    }
  }, [])

  const processFile = async (file: File) => {
    if (!file) return
    if (!file.type.startsWith("image/")) {
      setErrorMsg("אנא העלה תמונה (JPG, PNG). מסמכי PDF אינם נתמכים עדיין.")
      setStep("error")
      return
    }
    if (file.size > 20 * 1024 * 1024) {
      setErrorMsg("התמונה גדולה מדי. אנא השתמש בתמונה עד 20MB.")
      setStep("error")
      return
    }

    // Show preview
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target?.result as string)
    reader.readAsDataURL(file)

    setStep("loading")

    try {
      const base64 = await fileToBase64(file)
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

      const res = await fetch(`${supabaseUrl}/functions/v1/explain-letter`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageBase64: base64,
          mimeType: file.type,
        }),
      })

      const data = await res.json()
      if (!res.ok || data.error) {
        throw new Error(data.error ?? `שגיאת שרת (${res.status})`)
      }

      setResult(data.result)
      setStep("result")
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "אירעה שגיאה. אנא נסה שוב.")
      setStep("error")
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  const reset = () => {
    setStep("upload")
    setResult(null)
    setPreview(null)
    setErrorMsg("")
    stop()
    if (fileInputRef.current) fileInputRef.current.value = ""
    if (cameraInputRef.current) cameraInputRef.current.value = ""
  }

  const buildSpeechText = (r: ExplainResult) => {
    let text = `מכתב מ${r.sender}. ${r.topic}. ${r.plainExplanation}`
    if (r.whatToDo.length > 0) {
      text += ` מה צריך לעשות? ${r.whatToDo.join(". ")}.`
    }
    if (r.importantNumbers.length > 0) {
      text += ` פרטים חשובים: ${r.importantNumbers.join(", ")}.`
    }
    return text
  }

  const handleShare = () => {
    if (!result) return
    const text = buildSpeechText(result)
    const msg = encodeURIComponent(`הסבר מכתב:\n\n${text}`)
    window.open(`https://wa.me/?text=${msg}`, "_blank", "noopener")
  }

  const handleCopy = () => {
    if (!result) return
    navigator.clipboard.writeText(buildSpeechText(result))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/60 to-background dark:from-blue-950/20 dark:to-background">
      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <FileText className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-2">
            מפענח מכתבים
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-md mx-auto">
            צלם או העלה מכתב מביטוח לאומי, בנק, קופת חולים — ונסביר לך הכל בשפה פשוטה
          </p>
          <div className="flex items-center justify-center gap-1.5 mt-3">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary font-semibold">מופעל על ידי Grok AI של x.ai</span>
          </div>
        </div>

        {/* Upload Step */}
        {step === "upload" && (
          <div className="space-y-4">
            {/* Drag & drop zone */}
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              className="relative border-2 border-dashed border-primary/40 rounded-3xl p-10 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all group bg-card"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Upload className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <p className="text-xl font-bold text-foreground">לחץ כאן להעלאת מכתב</p>
                  <p className="text-muted-foreground mt-1">או גרור לכאן תמונה</p>
                </div>
                <p className="text-sm text-muted-foreground">JPG, PNG • עד 20MB</p>
              </div>
            </div>

            {/* Camera button */}
            <button
              onClick={() => cameraInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-3 py-5 rounded-2xl bg-success/10 border-2 border-success/30 hover:bg-success/20 hover:border-success/60 transition-all text-success"
            >
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
              />
              <Camera className="w-7 h-7" />
              <span className="text-xl font-bold">צלם את המכתב עם הטלפון</span>
            </button>

            {/* Tips */}
            <div className="rounded-2xl border border-border bg-muted/50 overflow-hidden">
              <button
                onClick={() => setShowTips(!showTips)}
                className="w-full flex items-center justify-between px-5 py-4 text-sm font-semibold text-foreground"
              >
                <span>טיפים לצילום טוב</span>
                {showTips ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {showTips && (
                <ul className="px-5 pb-4 space-y-2 border-t border-border">
                  {[
                    "וודא שכל הטקסט נראה בבירור",
                    "תאורה טובה — אל תצלם בצל",
                    "המכתב צריך להיות ישר, לא מוטה",
                    "אפשר לצלם כמה עמודים בנפרד",
                  ].map((tip, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">{i + 1}</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* Loading Step */}
        {step === "loading" && (
          <div className="space-y-6">
            {preview && (
              <div className="rounded-2xl overflow-hidden border border-border max-h-48 flex items-center justify-center bg-muted">
                <img src={preview} alt="המכתב שהועלה" className="max-h-48 object-contain" />
              </div>
            )}
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
                <p className="text-2xl font-bold text-foreground">קורא את המכתב...</p>
                <p className="text-muted-foreground mt-2 text-lg">ה-AI מנתח את המכתב ומכין הסבר פשוט עבורך</p>
              </div>
              <div className="flex justify-center gap-1.5">
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full bg-primary animate-bounce"
                    style={{ animationDelay: `${i * 0.2}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Error Step */}
        {step === "error" && (
          <div className="bg-destructive/5 border border-destructive/20 rounded-3xl p-8 text-center space-y-4">
            <AlertTriangle className="w-14 h-14 text-destructive mx-auto" />
            <div>
              <p className="text-2xl font-bold text-foreground">אירעה שגיאה</p>
              <p className="text-destructive mt-2 text-lg">{errorMsg}</p>
            </div>
            <button
              onClick={reset}
              className="flex items-center gap-2 mx-auto px-6 py-3 bg-primary text-primary-foreground rounded-2xl font-bold text-lg hover:bg-primary/90 transition-colors"
            >
              <RotateCcw className="w-5 h-5" />
              נסה שוב
            </button>
          </div>
        )}

        {/* Result Step */}
        {step === "result" && result && (
          <div className="space-y-4">
            {/* Font size controls */}
            <div className="flex items-center justify-between bg-card border border-border rounded-2xl px-4 py-3">
              <span className="text-sm text-muted-foreground font-medium">גודל טקסט</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFontSize(s => Math.max(14, s - 2))}
                  className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-colors"
                  aria-label="הקטן טקסט"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-sm font-bold w-10 text-center text-foreground">{fontSize}px</span>
                <button
                  onClick={() => setFontSize(s => Math.min(32, s + 2))}
                  className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-colors"
                  aria-label="הגדל טקסט"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Urgency badge */}
            <UrgencyBanner urgency={result.urgency} reason={result.urgencyReason} />

            {/* Main result card */}
            <div
              className="bg-card border border-border rounded-3xl p-6 sm:p-8 space-y-6"
              style={{ fontSize: `${fontSize}px`, lineHeight: 1.7 }}
            >
              {/* Sender & topic */}
              <div className="pb-5 border-b border-border">
                <div className="text-sm font-semibold text-muted-foreground mb-1">מכתב מ:</div>
                <div className="font-extrabold text-foreground" style={{ fontSize: `${fontSize + 4}px` }}>
                  {result.sender}
                </div>
                <div className="text-muted-foreground mt-1 font-medium">{result.topic}</div>
              </div>

              {/* Plain explanation */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1.5 h-6 bg-primary rounded-full" />
                  <span className="font-bold text-foreground">מה המכתב אומר?</span>
                </div>
                <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                  {result.plainExplanation}
                </p>
              </div>

              {/* What to do */}
              {result.whatToDo.length > 0 && (
                <div className="bg-success/8 border border-success/20 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle className="w-5 h-5 text-success shrink-0" />
                    <span className="font-bold text-foreground">מה צריך לעשות?</span>
                  </div>
                  <ol className="space-y-3">
                    {result.whatToDo.map((action, i) => (
                      <li key={i} className="flex items-start gap-3 text-foreground">
                        <span
                          className="shrink-0 w-7 h-7 rounded-full bg-success/20 text-success font-bold text-sm flex items-center justify-center"
                        >
                          {i + 1}
                        </span>
                        {action}
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Important numbers & dates */}
              {result.importantNumbers.length > 0 && (
                <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="w-5 h-5 text-primary shrink-0" />
                    <span className="font-bold text-foreground">פרטים חשובים</span>
                  </div>
                  <ul className="space-y-2">
                    {result.importantNumbers.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-foreground font-medium">
                        <span className="text-primary mt-1">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* TTS + actions */}
            <div className="space-y-3">
              {/* Read aloud */}
              {ttsSupported && (
                <button
                  onClick={() => speaking ? stop() : speak(buildSpeechText(result))}
                  className={cn(
                    "w-full flex items-center justify-center gap-3 py-5 rounded-2xl font-bold text-xl transition-all",
                    speaking
                      ? "bg-destructive/10 border-2 border-destructive/30 text-destructive hover:bg-destructive/20"
                      : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20"
                  )}
                >
                  {speaking ? (
                    <>
                      <VolumeX className="w-6 h-6" />
                      עצור קריאה
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-6 h-6" />
                      קרא לי את ההסבר
                    </>
                  )}
                </button>
              )}

              {/* Share & copy */}
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={handleShare}
                  className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl bg-[#25D366]/10 border border-[#25D366]/30 text-[#128C7E] dark:text-[#25D366] hover:bg-[#25D366]/20 transition-colors"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span className="text-xs font-semibold">WhatsApp</span>
                </button>
                <button
                  onClick={handleCopy}
                  className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl border border-border hover:bg-muted transition-colors text-muted-foreground"
                >
                  {copied ? <Check className="w-5 h-5 text-success" /> : <Share2 className="w-5 h-5" />}
                  <span className="text-xs font-semibold">{copied ? "הועתק!" : "העתק"}</span>
                </button>
                <button
                  onClick={reset}
                  className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl border border-border hover:bg-muted transition-colors text-muted-foreground"
                >
                  <RotateCcw className="w-5 h-5" />
                  <span className="text-xs font-semibold">מכתב חדש</span>
                </button>
              </div>
            </div>

            {/* Preview thumbnail */}
            {preview && (
              <details className="rounded-2xl border border-border overflow-hidden">
                <summary className="px-4 py-3 text-sm text-muted-foreground cursor-pointer hover:bg-muted transition-colors">
                  הצג את התמונה המקורית
                </summary>
                <div className="p-4 border-t border-border bg-muted/30">
                  <img src={preview} alt="מכתב מקורי" className="max-h-80 mx-auto rounded-xl object-contain" />
                </div>
              </details>
            )}

            {/* Disclaimer */}
            <p className="text-xs text-muted-foreground text-center">
              * ההסבר נוצר על ידי AI ועשוי להכיל שגיאות. לשאלות משפטיות, פנה לאיש מקצוע.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Urgency Banner ───────────────────────────────────────────────
function UrgencyBanner({ urgency, reason }: { urgency: "low" | "medium" | "high"; reason: string }) {
  const config = {
    low: {
      icon: <CheckCircle className="w-5 h-5" />,
      label: "אין דחיפות",
      sub: reason || "ניתן לטפל בשלווה",
      className: "bg-success/8 border-success/20 text-success",
    },
    medium: {
      icon: <Clock className="w-5 h-5" />,
      label: "יש לשים לב לתאריכים",
      sub: reason || "בדוק תאריכים חשובים",
      className: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400",
    },
    high: {
      icon: <AlertTriangle className="w-5 h-5" />,
      label: "דחוף — יש לפעול מהר!",
      sub: reason || "פנה לטיפול בהקדם",
      className: "bg-destructive/8 border-destructive/20 text-destructive",
    },
  }
  const c = config[urgency]
  return (
    <div className={cn("flex items-center gap-3 px-4 py-3.5 rounded-2xl border font-semibold", c.className)}>
      {c.icon}
      <div>
        <div className="font-bold">{c.label}</div>
        {c.sub && <div className="text-sm opacity-80 font-normal">{c.sub}</div>}
      </div>
    </div>
  )
}

// ─── Util ─────────────────────────────────────────────────────────
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // Remove the data:image/xxx;base64, prefix
      const base64 = result.split(",")[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
