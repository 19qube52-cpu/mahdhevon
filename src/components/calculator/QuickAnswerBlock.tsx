import { Zap } from "lucide-react"

interface QuickAnswerBlockProps {
  question: string
  answer: string
}

export default function QuickAnswerBlock({ question, answer }: QuickAnswerBlockProps) {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-5" role="note" aria-label="תשובה קצרה">
      <div className="flex items-center gap-2 mb-2">
        <Zap className="w-4 h-4 text-blue-600" />
        <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">תשובה קצרה</span>
      </div>
      <p className="font-semibold text-blue-900 mb-2 text-sm">{question}</p>
      <p className="text-sm text-blue-800 leading-relaxed">{answer}</p>
    </div>
  )
}
