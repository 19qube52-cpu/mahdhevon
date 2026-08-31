import { Link } from "react-router-dom"
import { Users, ArrowLeft } from "lucide-react"
import type { Calculator } from "@/data/calculators"

interface InternalLinksBlockProps {
  calculators: Calculator[]
}

export default function InternalLinksBlock({ calculators }: InternalLinksBlockProps) {
  if (!calculators.length) return null
  return (
    <aside className="bg-muted/50 border border-border rounded-xl p-5" aria-label="חיפושים קשורים">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-semibold text-muted-foreground">אנשים שחישבו זאת חיפשו גם:</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {calculators.map((calc) => (
          <Link
            key={calc.id}
            to={`/calculators/${calc.slug}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-border rounded-full text-sm text-foreground hover:border-primary hover:text-primary transition-colors"
          >
            {calc.shortTitle}
            <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
          </Link>
        ))}
      </div>
    </aside>
  )
}
