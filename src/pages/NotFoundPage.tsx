import { Link } from "react-router-dom"
import { Calculator, Home } from "lucide-react"
import { usePageMeta } from "@/lib/seo"
import { getPopularCalculators } from "@/data/calculators"

export default function NotFoundPage() {
  const popular = getPopularCalculators().slice(0, 6)

  usePageMeta({
    title: "דף לא נמצא (404) | חשב לי",
    description: "הדף שחיפשת לא נמצא.",
    robots: "noindex, nofollow",
  })

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-6">
        <Calculator className="w-8 h-8 text-muted-foreground" />
      </div>
      <h1 className="text-3xl font-bold text-foreground mb-3">עמוד לא נמצא</h1>
      <p className="text-muted-foreground mb-8">
        הדף שחיפשת אינו קיים. אולי תרצה לחפש אחד מהמחשבונים הפופולריים שלנו?
      </p>

      <div className="flex flex-wrap gap-3 justify-center mb-8">
        {popular.map((calc) => (
          <Link
            key={calc.id}
            to={`/calculators/${calc.slug}`}
            className="px-4 py-2 bg-white border border-border rounded-lg text-sm font-medium hover:border-primary hover:text-primary transition-colors"
          >
            {calc.shortTitle}
          </Link>
        ))}
      </div>

      <Link
        to="/"
        className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
      >
        <Home className="w-4 h-4" />
        חזרה לדף הבית
      </Link>
    </div>
  )
}
