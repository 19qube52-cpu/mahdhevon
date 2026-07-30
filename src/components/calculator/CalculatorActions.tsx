import { useState } from "react"
import { Heart, Bookmark, Sparkles, Loader2, Check } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/lib/auth"
import { useFavorites } from "@/hooks/use-favorites"
import { useSavedItems } from "@/hooks/use-saved-items"
import { cn } from "@/lib/utils"

interface CalculatorActionsProps {
  calculatorId: string
  slug: string
  title: string
  categorySlug: string | null
  inputs: Record<string, string | number>
  resultSummary: string | null
}

export default function CalculatorActions({
  calculatorId, slug, title, categorySlug, inputs, resultSummary,
}: CalculatorActionsProps) {
  const { user, openAuthDialog } = useAuth()
  const { isFavorite, addFavorite, removeFavorite } = useFavorites()
  const { saveItem } = useSavedItems()

  const [aiText, setAiText] = useState<string | null>(null)
  const [aiProvider, setAiProvider] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [aiSaved, setAiSaved] = useState(false)
  const [resultSaved, setResultSaved] = useState(false)

  const fav = isFavorite(slug)

  const requireAuth = (after: () => void) => {
    if (!user) {
      openAuthDialog(after)
      return false
    }
    after()
    return true
  }

  const toggleFavorite = () => {
    requireAuth(async () => {
      if (isFavorite(slug)) {
        await removeFavorite(slug)
        toast.success("הוסר מהמועדפים")
      } else {
        const { error } = await addFavorite(slug, title, categorySlug)
        if (error) toast.error("השמירה נכשלה, נסה שוב")
        else toast.success("נוסף למועדפים")
      }
    })
  }

  const saveResult = () => {
    requireAuth(async () => {
      const { error } = await saveItem({
        calculator_slug: slug, calculator_title: title, kind: "result",
        inputs, summary: resultSummary,
      })
      if (error) { toast.error("השמירה נכשלה, נסה שוב"); return }
      setResultSaved(true)
      toast.success("התוצאה נשמרה לחשבון")
    })
  }

  const runAnalysis = async () => {
    setAiLoading(true)
    setAiError(null)
    setAiText(null)
    setAiSaved(false)
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-crm-assistant`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          action: "calc_explain",
          calculator_id: calculatorId,
          calculator_title: title,
          context: { summary: resultSummary, inputs },
        }),
      })
      if (!res.ok) throw new Error(`status ${res.status}`)
      const data = await res.json()
      if (!data.ok || typeof data.result !== "string") throw new Error(data.error ?? "invalid")
      setAiText(data.result)
      setAiProvider(typeof data.provider === "string" ? data.provider : null)
    } catch {
      setAiError("לא הצלחנו להפיק ניתוח כרגע. נסה שוב בעוד רגע.")
    } finally {
      setAiLoading(false)
    }
  }

  const saveAnalysis = () => {
    if (!aiText) return
    requireAuth(async () => {
      const { error } = await saveItem({
        calculator_slug: slug, calculator_title: title, kind: "ai",
        inputs, summary: resultSummary, ai_text: aiText, provider: aiProvider,
      })
      if (error) { toast.error("השמירה נכשלה, נסה שוב"); return }
      setAiSaved(true)
      toast.success("הניתוח נשמר לחשבון")
    })
  }

  return (
    <div className="space-y-4 no-print">
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={toggleFavorite}
          className={cn(
            "inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium border transition-colors",
            fav
              ? "bg-primary/10 border-primary/30 text-primary"
              : "bg-card border-border text-muted-foreground hover:text-foreground hover:bg-muted",
          )}
        >
          <Heart className={cn("w-4 h-4", fav && "fill-primary")} />
          {fav ? "במועדפים" : "הוסף למועדפים"}
        </button>

        <button
          onClick={saveResult}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium border bg-card border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          {resultSaved ? <Check className="w-4 h-4 text-primary" /> : <Bookmark className="w-4 h-4" />}
          {resultSaved ? "נשמר" : "שמור תוצאה"}
        </button>

        <button
          onClick={runAnalysis}
          disabled={aiLoading}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60"
        >
          {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          נתח לי את התוצאה
        </button>
      </div>

      {aiError && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-4 py-3">{aiError}</p>
      )}

      {aiText && (
        <div className="bg-gradient-to-b from-primary/5 to-transparent border border-primary/20 rounded-xl p-5">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground">ניתוח אישי של התוצאה</h3>
            </div>
            <button
              onClick={saveAnalysis}
              disabled={aiSaved}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline disabled:text-muted-foreground disabled:no-underline"
            >
              {aiSaved ? <Check className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
              {aiSaved ? "נשמר" : "שמור ניתוח"}
            </button>
          </div>
          <p className="text-sm sm:text-[15px] text-foreground/90 whitespace-pre-line leading-relaxed">{aiText}</p>
          <p className="text-[11px] text-muted-foreground mt-3">
            הניתוח נוצר על ידי בינה מלאכותית ואינו מהווה ייעוץ מקצועי.
          </p>
        </div>
      )}
    </div>
  )
}
