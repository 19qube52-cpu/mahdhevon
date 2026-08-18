import { Sparkles, Zap } from "lucide-react"
import { usePageMeta } from "@/lib/seo"
import Breadcrumbs from "@/components/shared/Breadcrumbs"
import RealTakeHomeCalculator from "@/components/fun/RealTakeHomeCalculator"
import TaxiMeterCalculator from "@/components/fun/TaxiMeterCalculator"
import TransitFareCalculator from "@/components/fun/TransitFareCalculator"

export default function FunCalculatorsPage() {
  usePageMeta({
    title: "מחשבונים מגניבים – הישב",
    description:
      "מחשבונים אינטראקטיביים עם אנימציות: כמה באמת נשאר לך מהשכר, מונה מונית חי, ואם משתלם לך חופשי חודשי בתחבורה הציבורית.",
    keywords: ["מחשבונים מגניבים", "מונה מונית", "מחיר אוטובוס", "כמה נשאר לי מהשכר", "חופשי חודשי"],
  })

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <Breadcrumbs items={[{ label: "מחשבונים מגניבים" }]} />

      {/* Hero */}
      <section className="mt-4 rounded-3xl overflow-hidden border border-border bg-gradient-to-bl from-primary/10 via-card to-chart-4/10 p-7 sm:p-10 text-center">
        <div className="inline-flex items-center gap-2 bg-primary/15 text-primary px-3 py-1.5 rounded-full text-sm font-semibold mb-4">
          <Zap className="w-3.5 h-3.5" />
          חדש ואינטראקטיבי
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-3">
          מחשבונים <span className="text-primary">מגניבים</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
          לא סתם מספרים — מחשבונים חיים עם אנימציות שמראים לך את האמת: כמה באמת נשאר לך,
          כמה תעלה המונית, ומה באמת משתלם לך בתחבורה הציבורית
        </p>
        <div className="mt-5 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Sparkles className="w-4 h-4 text-chart-4" />
          הזז את המחוונים וצפה בתוצאה מתעדכנת בזמן אמת
        </div>
      </section>

      {/* Calculators */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="lg:col-span-2">
          <RealTakeHomeCalculator />
        </div>
        <TaxiMeterCalculator />
        <TransitFareCalculator />
      </div>
    </div>
  )
}
