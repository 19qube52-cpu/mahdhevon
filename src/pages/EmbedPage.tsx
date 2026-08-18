import { useParams } from "react-router-dom"
import { getCalculatorBySlug } from "@/data/calculators"
import { runCalculator } from "@/lib/calculators"
import { useState, useMemo } from "react"
import LiveCalculatorForm from "@/components/calculator/LiveCalculatorForm"
import CalculatorResult from "@/components/calculator/CalculatorResult"
import { Link } from "lucide-react"
import { useCountry } from "@/lib/country-context"

export default function EmbedPage() {
  const { slug } = useParams<{ slug: string }>()
  const calculator = slug ? getCalculatorBySlug(slug) : undefined
  const { country } = useCountry()

  const getDefaults = useMemo(() => {
    const defaults: Record<string, string | number> = {}
    if (!calculator) return defaults
    for (const input of calculator.inputs) {
      if (input.id === "taxCredits") defaults[input.id] = country.incomeTax.defaultCreditPoints
      else if (input.defaultValue !== undefined) defaults[input.id] = input.defaultValue
      else if (input.type === "select" && input.options?.[0]) defaults[input.id] = input.options[0].value
      else defaults[input.id] = 0
    }
    return defaults
  }, [calculator, country])

  const [values, setValues] = useState<Record<string, string | number>>(getDefaults)

  if (!calculator) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">מחשבון לא נמצא</p>
      </div>
    )
  }

  const numericValues: Record<string, unknown> = {}
  for (const input of calculator.inputs) {
    const raw = values[input.id]
    if (input.type === "number" || input.type === "range") numericValues[input.id] = parseFloat(String(raw)) || 0
    else numericValues[input.id] = raw
  }
  const result = runCalculator(calculator.id, numericValues, country)

  const handleChange = (id: string, value: string | number) => {
    setValues((prev) => ({ ...prev, [id]: value }))
  }

  return (
    <div className="embed-root" dir="rtl">
      <div className="p-4 sm:p-6 bg-background text-foreground min-h-screen">
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-lg font-bold text-foreground">{calculator.title}</h1>
            <a
              href={`https://chasav.li/calculators/${calculator.slug}`}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              <Link className="w-3 h-3" />
              חשב לי
            </a>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <LiveCalculatorForm
              inputs={calculator.inputs}
              values={values}
              onChange={handleChange}
            />
            <CalculatorResult
              calculatorId={calculator.id}
              result={result}
              formulaExplanation={calculator.formulaExplanation}
              exampleText={calculator.exampleText}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
