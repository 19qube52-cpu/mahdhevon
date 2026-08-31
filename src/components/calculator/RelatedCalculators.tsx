import CalculatorCard from "@/components/shared/CalculatorCard"
import type { Calculator } from "@/data/calculators"

interface RelatedCalculatorsProps {
  calculators: Calculator[]
}

export default function RelatedCalculators({ calculators }: RelatedCalculatorsProps) {
  if (!calculators.length) return null
  return (
    <section aria-label="מחשבונים קשורים">
      <h2 className="text-xl font-bold text-foreground mb-4">מחשבונים קשורים</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {calculators.map((calc) => (
          <CalculatorCard key={calc.id} calculator={calc} />
        ))}
      </div>
    </section>
  )
}
