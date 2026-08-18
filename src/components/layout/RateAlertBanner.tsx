import { useState } from "react"
import { X, Bell } from "lucide-react"

const ALERTS = [
  { id: "vat2025", text: "עדכון: מע\"מ עלה ל-18% מינואר 2025 (מ-17%). המחשבונים מעודכנים.", date: "01/2025" },
  { id: "prime2024", text: "ריבית בנק ישראל: 4.5% (ינואר 2025). בדוק את עלות המשכנתא שלך מחדש.", date: "01/2025" },
  { id: "ni2024", text: "שכר מינימום חדש: 6,300 ₪/חודש מינואר 2025. נקודות זיכוי: 242 ₪.", date: "01/2025" },
]

export default function RateAlertBanner() {
  const [dismissed, setDismissed] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("dismissed-alerts") ?? "[]")
    } catch { return [] }
  })

  const visible = ALERTS.filter(a => !dismissed.includes(a.id))
  if (!visible.length) return null

  const alert = visible[0]

  const dismiss = () => {
    const next = [...dismissed, alert.id]
    setDismissed(next)
    localStorage.setItem("dismissed-alerts", JSON.stringify(next))
  }

  return (
    <div className="bg-primary/10 border-b border-primary/20 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 min-w-0">
          <Bell className="w-4 h-4 text-primary shrink-0" />
          <span className="text-sm text-primary font-medium line-clamp-1">
            <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded font-bold ml-1.5">
              {alert.date}
            </span>
            {alert.text}
          </span>
        </div>
        <button
          onClick={dismiss}
          className="shrink-0 p-1 rounded hover:bg-primary/20 text-primary transition-colors"
          aria-label="סגור התראה"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
