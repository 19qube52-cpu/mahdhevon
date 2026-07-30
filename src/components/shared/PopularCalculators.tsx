import CalculatorCard from "./CalculatorCard"
import type { Calculator } from "@/data/calculators"

interface PopularCalculatorsProps {
  calculators: Calculator[]
  title?: string
}

export default function PopularCalculators({ calculators, title = "מחשבונים פופולריים" }: PopularCalculatorsProps) {
  return (
    <section aria-label={title}>
      <h2 className="text-2xl font-bold text-foreground mb-6">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {calculators.map((calc) => (
          <CalculatorCard key={calc.id} calculator={calc} />
        ))}
      </div>
    </section>
  )
}
