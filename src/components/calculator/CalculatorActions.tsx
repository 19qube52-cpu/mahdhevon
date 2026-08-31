import { Heart, Bookmark, Check } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/lib/auth"
import { useFavorites } from "@/hooks/use-favorites"
import { useSavedItems } from "@/hooks/use-saved-items"
import { cn } from "@/lib/utils"
import { useState } from "react"

interface CalculatorActionsProps {
  calculatorId: string
  slug: string
  title: string
  categorySlug: string | null
  inputs: Record<string, string | number>
  resultSummary: string | null
}

export default function CalculatorActions({
  calculatorId: _calculatorId, slug, title, categorySlug, inputs, resultSummary,
}: CalculatorActionsProps) {
  const { user, openAuthDialog } = useAuth()
  const { isFavorite, addFavorite, removeFavorite } = useFavorites()
  const { saveItem } = useSavedItems()
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
        calculator_slug: slug, calculator_title: title,
        inputs, summary: resultSummary,
      })
      if (error) { toast.error("השמירה נכשלה, נסה שוב"); return }
      setResultSaved(true)
      toast.success("התוצאה נשמרה לחשבון")
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
      </div>
    </div>
  )
}
