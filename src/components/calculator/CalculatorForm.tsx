import { useState, useCallback } from "react"
import { Mic, MicOff } from "lucide-react"
import type { CalculatorInput } from "@/data/calculators"
import { cn } from "@/lib/utils"
import { useVoiceInput } from "@/hooks/use-voice-input"

interface CalculatorFormProps {
  inputs: CalculatorInput[]
  values: Record<string, string | number>
  onChange: (id: string, value: string | number) => void
  onCalculate: () => void
}

export default function CalculatorForm({ inputs, values, onChange, onCalculate }: CalculatorFormProps) {
  const [activeVoiceField, setActiveVoiceField] = useState<string | null>(null)

  const handleVoiceResult = useCallback((fieldId: string, text: string) => {
    // Extract the first number from speech (e.g. "חמישים אלף" → 50000, or "50000")
    const num = parseFloat(text.replace(/[^0-9.]/g, ""))
    if (!isNaN(num)) onChange(fieldId, num)
    setActiveVoiceField(null)
  }, [onChange])

  const { listening, supported, toggle } = useVoiceInput({
    onResult: (text) => { if (activeVoiceField) handleVoiceResult(activeVoiceField, text) },
    lang: "he-IL",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onCalculate()
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="bg-card border border-border rounded-xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">נתוני חישוב</h2>
          {supported && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Mic className="w-3 h-3" />לחץ על המיקרופון ליד שדה לקלט קולי
            </span>
          )}
        </div>
        {inputs.map((input) => (
          <div key={input.id}>
            <label
              htmlFor={input.id}
              className="block text-sm font-medium text-foreground mb-1.5"
            >
              {input.label}
            </label>
            {input.type === "select" ? (
              <select
                id={input.id}
                name={input.id}
                value={String(values[input.id] ?? "")}
                onChange={(e) => onChange(input.id, e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                aria-label={input.label}
              >
                {input.options?.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : input.type === "date" ? (
              <input
                id={input.id}
                name={input.id}
                type="date"
                value={String(values[input.id] ?? "")}
                onChange={(e) => onChange(input.id, e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                aria-label={input.label}
                max={new Date().toISOString().split("T")[0]}
              />
            ) : (
              <div className="relative">
                <input
                  id={input.id}
                  name={input.id}
                  type="number"
                  value={values[input.id] ?? ""}
                  onChange={(e) => onChange(input.id, e.target.value)}
                  placeholder={input.placeholder}
                  min={input.min}
                  max={input.max}
                  step={input.step}
                  className={cn(
                    "w-full px-3 py-2.5 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary",
                    input.unit && "pl-14",
                    supported && "pr-10"
                  )}
                  aria-label={input.label}
                  aria-describedby={input.helpText ? `${input.id}-help` : undefined}
                />
                {input.unit && (
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium pointer-events-none">
                    {input.unit}
                  </span>
                )}
                {supported && (
                  <button
                    type="button"
                    onClick={() => { setActiveVoiceField(input.id); toggle() }}
                    title="קלט קולי"
                    className={cn(
                      "absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md transition-colors",
                      listening && activeVoiceField === input.id
                        ? "text-destructive bg-destructive/10 animate-pulse"
                        : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                    )}
                  >
                    {listening && activeVoiceField === input.id
                      ? <MicOff className="w-3.5 h-3.5" />
                      : <Mic className="w-3.5 h-3.5" />
                    }
                  </button>
                )}
              </div>
            )}
            {input.helpText && (
              <p id={`${input.id}-help`} className="text-xs text-muted-foreground mt-1">
                {input.helpText}
              </p>
            )}
          </div>
        ))}

        <button
          type="submit"
          className="w-full py-3 px-6 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors text-base shadow-sm"
        >
          חשב
        </button>
      </div>
    </form>
  )
}
