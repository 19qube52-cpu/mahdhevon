import { useParams, Link } from "react-router-dom"
import { getCategoryBySlug, categories } from "@/data/categories"
import { getCalculatorsByCategory, calculators as allCalcs } from "@/data/calculators"
import { usePageMeta } from "@/lib/seo"
import Breadcrumbs from "@/components/shared/Breadcrumbs"
import CalculatorCard from "@/components/shared/CalculatorCard"
import CategoryGrid from "@/components/shared/CategoryGrid"
import { ArrowLeft } from "lucide-react"

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>()
  const category = slug ? getCategoryBySlug(slug) : undefined
  const catCalculators = slug ? getCalculatorsByCategory(slug) : []
  const otherCategories = categories.filter((c) => c.slug !== slug)

  usePageMeta({
    title: category
      ? `${category.name} – מחשבונים ישראלים | הישב`
      : "קטגוריה | הישב",
    description: category
      ? `${category.description} – כל המחשבונים בתחום ${category.name} לישראלים. חינם ומהיר.`
      : "קטגוריית מחשבונים",
    keywords: category ? [category.name, category.shortName, "מחשבונים ישראל"] : [],
  })

  if (!category) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold mb-2">קטגוריה לא נמצאה</h1>
        <Link to="/" className="text-primary hover:underline">
          חזרה לדף הבית
        </Link>
      </div>
    )
  }

  // Calculators from other categories as "recommendations"
  const recommended = allCalcs
    .filter((c) => c.categorySlug !== slug)
    .slice(0, 3)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <div className="mb-6">
        <Breadcrumbs items={[{ label: category.name }]} />
      </div>

      {/* Category header */}
      <header className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
          מחשבוני {category.name}
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
          {category.description}
        </p>
      </header>

      {/* Calculators in this category */}
      {catCalculators.length > 0 ? (
        <section className="mb-12" aria-label={`מחשבוני ${category.name}`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {catCalculators.map((calc) => (
              <CalculatorCard key={calc.id} calculator={calc} />
            ))}
          </div>
        </section>
      ) : (
        <div className="text-center py-16">
          <p className="text-muted-foreground text-lg mb-4">מחשבונים בקטגוריה זו יתווספו בקרוב</p>
          <Link to="/" className="text-primary hover:underline font-medium">
            ראה את כל המחשבונים הזמינים
          </Link>
        </div>
      )}

      {/* Recommendations */}
      {recommended.length > 0 && (
        <section className="mb-12" aria-label="מחשבונים מומלצים">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-foreground">מחשבונים שאולי יעניינו אותך</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommended.map((calc) => (
              <CalculatorCard key={calc.id} calculator={calc} />
            ))}
          </div>
        </section>
      )}

      {/* Other categories */}
      <section aria-label="קטגוריות נוספות">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-foreground">קטגוריות נוספות</h2>
          <Link to="/" className="text-sm text-primary font-medium flex items-center gap-1 hover:underline">
            כל הקטגוריות
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
          </Link>
        </div>
        <CategoryGrid categories={otherCategories} />
      </section>
    </div>
  )
}
