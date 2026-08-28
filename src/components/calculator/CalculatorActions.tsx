import { useState } from "react"
import { Heart, Bookmark, Check } from "lucide-react"
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

export default function CalculatorActions({ slug, title, categorySlug, inputs, resultSummary }: CalculatorActionsProps) {
  const { user, openAuthDialog } = useAuth()
  const { isFavorite, addFavorite, removeFavorite } = useFavorites()
  const { saveItem } = useSavedItems()
  const [resultSaved, setResultSaved] = useState(false)
  const fav = isFavorite(slug)

  const requireAuth = (action: () => void) => {
    if (!user) { openAuthDialog(action); return }
    action()
  }

  const toggleFavorite = () => requireAuth(async () => {
    if (fav) {
      await removeFavorite(slug)
      toast.success("הוסר מהמועדפים")
    } else {
      const { error } = await addFavorite(slug, title, categorySlug)
      error ? toast.error("השמירה נכשלה") : toast.success("נוסף למועדפים")
    }
  })

  const saveResult = () => requireAuth(async () => {
    const { error } = await saveItem({
      calculator_slug: slug, calculator_title: title, kind: "result", inputs, summary: resultSummary,
    })
    if (error) return toast.error("השמירה נכשלה")
    setResultSaved(true)
    toast.success("התוצאה נשמרה לחשבון")
  })

  return (
    <div className="flex flex-wrap items-center gap-2 no-print">
      <button onClick={toggleFavorite} className={cn("inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors", fav ? "border-rose-300 bg-rose-50 text-rose-600 dark:bg-rose-950/20" : "border-border hover:bg-muted")}>
        <Heart className={cn("h-4 w-4", fav && "fill-current")} />{fav ? "במועדפים" : "הוסף למועדפים"}
      </button>
      <button onClick={saveResult} disabled={resultSaved || !resultSummary} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3.5 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50">
        {resultSaved ? <Check className="h-4 w-4 text-success" /> : <Bookmark className="h-4 w-4" />}{resultSaved ? "נשמר" : "שמור תוצאה"}
      </button>
    </div>
  )
}
