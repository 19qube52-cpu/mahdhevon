import { Link } from "react-router-dom"
import {
  Banknote, Shield, TrendingUp, Home, Users, Heart, Briefcase, Calculator
} from "lucide-react"
import type { Category } from "@/data/categories"
import { cn } from "@/lib/utils"

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Banknote, Shield, TrendingUp, Home, Users, Heart, Briefcase, Calculator,
}

interface CategoryGridProps {
  categories: Category[]
  title?: string
}

export default function CategoryGrid({ categories, title }: CategoryGridProps) {
  return (
    <section aria-label={title ?? "קטגוריות מחשבונים"}>
      {title && (
        <h2 className="text-2xl font-bold text-foreground mb-6">{title}</h2>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {categories.map((cat) => {
          const Icon = iconMap[cat.icon] ?? Calculator
          return (
            <Link
              key={cat.slug}
              to={`/categories/${cat.slug}`}
              className={cn(
                "flex flex-col items-center text-center p-5 rounded-xl border transition-all hover:shadow-md hover:-translate-y-0.5 group",
                cat.color
              )}
            >
              <div className="w-12 h-12 rounded-xl bg-white/80 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-sm">
                <Icon className="w-6 h-6" />
              </div>
              <span className="font-semibold text-sm leading-tight">{cat.shortName}</span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
