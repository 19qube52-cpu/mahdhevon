import { useState } from "react"
import { Copy, Check, Printer, MessageCircle, Lightbulb, ChevronDown, ChevronUp } from "lucide-react"

interface ResultToolbarProps {
  calculatorTitle: string
  resultSummary: string
  tips: string[]
}

export default function ResultToolbar({ calculatorTitle, resultSummary, tips }: ResultToolbarProps) {
  const [copied, setCopied] = useState(false)
  const [showTips, setShowTips] = useState(false)

  const handleCopy = () => {
    const text = `${calculatorTitle}\n${resultSummary}\nחושב ב-חשב.לי`
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleWhatsApp = () => {
    const msg = encodeURIComponent(`${calculatorTitle}\n${resultSummary}\n\nחשב גם אתה: ${window.location.href}`)
    window.open(`https://wa.me/?text=${msg}`, "_blank", "noopener")
  }

  const handlePrint = () => window.print()

  return (
    <div className="space-y-3 no-print">
      {/* Action buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-border hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "הועתק!" : "העתק תוצאה"}
        </button>
        <button
          onClick={handleWhatsApp}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-[#25D366]/10 border border-[#25D366]/30 text-[#128C7E] dark:text-[#25D366] hover:bg-[#25D366]/20 transition-colors"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          שלח ב-WhatsApp
        </button>
        <button
          onClick={handlePrint}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-border hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        >
          <Printer className="w-3.5 h-3.5" />
          הדפס
        </button>
      </div>

      {/* Smart Tips */}
      {tips.length > 0 && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-800 overflow-hidden">
          <button
            onClick={() => setShowTips(!showTips)}
            className="w-full flex items-center justify-between px-4 py-3 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-950 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                {tips.length} טיפ{tips.length > 1 ? "ים" : ""} לשיפור התוצאה
              </span>
            </div>
            {showTips ? (
              <ChevronUp className="w-4 h-4 text-amber-600" />
            ) : (
              <ChevronDown className="w-4 h-4 text-amber-600" />
            )}
          </button>
          {showTips && (
            <ul className="px-4 py-3 bg-amber-50/50 dark:bg-amber-950/30 space-y-2">
              {tips.map((tip, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-amber-800 dark:text-amber-300">
                  <span className="w-5 h-5 rounded-full bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  {tip}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
