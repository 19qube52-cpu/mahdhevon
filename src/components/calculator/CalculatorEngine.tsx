import { useEffect, useState, useCallback } from "react"
import type { Calculator } from "@/data/calculators"
import { runCalculator } from "@/lib/calculators"
import LiveCalculatorForm from "./LiveCalculatorForm"
import CalculatorResult from "./CalculatorResult"

interface CalculatorEngineProps {
  calculator: Calculator
}

export default function CalculatorEngine({ calculator }: CalculatorEngineProps) {
  const getDefaults = useCallback(() => {
    const defaults: Record<string, string | number> = {}
    for (const input of calculator.inputs) {
      if (input.defaultValue !== undefined) {
        defaults[input.id] = input.defaultValue
      } else if (input.type === "select" && input.options?.[0]) {
        defaults[input.id] = input.options[0].value
      } else if (input.type === "date") {
        defaults[input.id] = "1990-01-01"
      } else {
        defaults[input.id] = 0
      }
    }
    return defaults
  }, [calculator.inputs])

  const [values, setValues] = useState<Record<string, string | number>>(getDefaults)

  // Reset defaults when calculator changes
  useEffect(() => {
    setValues(getDefaults())
  }, [calculator.id, getDefaults])

  const handleChange = (id: string, value: string | number) => {
    setValues((prev) => ({ ...prev, [id]: value }))
  }

  // Live compute result from current values
  const numericValues: Record<string, unknown> = {}
  for (const input of calculator.inputs) {
    const raw = values[input.id]
    if (input.type === "number" || input.type === "range") {
      numericValues[input.id] = parseFloat(String(raw)) || 0
    } else {
      numericValues[input.id] = raw
    }
  }
  const result = runCalculator(calculator.id, numericValues)

  return (
    <div className="grid lg:grid-cols-2 gap-6">
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
  )
}
