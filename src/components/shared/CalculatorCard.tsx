import { Link } from "react-router-dom"
import { Calculator, ArrowLeft } from "lucide-react"
import type { Calculator as CalculatorType } from "@/data/calculators"
import { getCategoryBySlug } from "@/data/categories"
import { cn } from "@/lib/utils"

interface CalculatorCardProps {
  calculator: CalculatorType
  variant?: "default" | "compact"
}

export default function CalculatorCard({ calculator, variant = "default" }: CalculatorCardProps) {
  const category = getCategoryBySlug(calculator.categorySlug)

  if (variant === "compact") {
    return (
      <Link
        to={`/calculators/${calculator.slug}`}
        className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:border-primary/50 hover:shadow-sm transition-all group"
      >
        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
          {calculator.imageUrl ? (
            <img src={calculator.imageUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <Calculator className="w-4 h-4 text-primary" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
            {calculator.shortTitle}
          </div>
        </div>
        <ArrowLeft className="w-4 h-4 text-muted-foreground group-hover:text-primary rtl:rotate-180 transition-all group-hover:-translate-x-0.5 shrink-0" />
      </Link>
    )
  }

  return (
    <Link
      to={`/calculators/${calculator.slug}`}
      className="flex flex-col p-5 rounded-xl border border-border bg-card hover:border-primary/50 hover:shadow-md transition-all group overflow-hidden"
    >
      {calculator.imageUrl ? (
        <div className="relative -mx-5 -mt-5 mb-3 h-32 overflow-hidden">
          <img src={calculator.imageUrl} alt={calculator.title} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
            <Calculator className="w-5 h-5 text-primary" />
          </div>
          {category && (
            <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full border", category.color)}>
              {category.shortName}
            </span>
          )}
        </div>
      )}
      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors mb-1.5">
        {calculator.title}
      </h3>
      <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed flex-1">
        {calculator.description}
      </p>
      <div className="flex items-center gap-1 mt-4 text-sm font-medium text-primary">
        <span>חשב עכשיו</span>
        <ArrowLeft className="w-4 h-4 rtl:rotate-180 transition-transform group-hover:-translate-x-0.5" />
      </div>
    </Link>
  )
}
