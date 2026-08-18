import { AlertTriangle } from "lucide-react"

interface DisclaimerBoxProps {
  disclaimer: string
  sourceNote?: string
}

export default function DisclaimerBox({ disclaimer, sourceNote }: DisclaimerBoxProps) {
  return (
    <aside
      role="note"
      aria-label="הערה חשובה"
      className="flex gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl"
    >
      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
      <div className="text-sm">
        <p className="font-medium text-amber-800 mb-1">הערה חשובה</p>
        <p className="text-amber-700 leading-relaxed">{disclaimer}</p>
        {sourceNote && (
          <p className="text-amber-600 text-xs mt-2 italic">{sourceNote}</p>
        )}
      </div>
    </aside>
  )
}
