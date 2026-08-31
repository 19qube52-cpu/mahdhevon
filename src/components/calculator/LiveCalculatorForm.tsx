import type { CalculatorInput } from "@/data/calculators"
import { formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"

interface LiveCalculatorFormProps {
  inputs: CalculatorInput[]
  values: Record<string, string | number>
  onChange: (id: string, value: string | number) => void
}

export default function LiveCalculatorForm({ inputs, values, onChange }: LiveCalculatorFormProps) {
  return (
    <div className="bg-card border border-border rounded-2xl p-6 space-y-6 shadow-sm">
      <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
        <span className="w-2 h-5 bg-primary rounded-full inline-block" />
        נתוני חישוב
      </h2>

      {inputs.map((input) => (
        <InputField
          key={input.id}
          input={input}
          value={values[input.id] ?? (input.defaultValue ?? "")}
          onChange={(v) => onChange(input.id, v)}
        />
      ))}

      <p className="text-xs text-muted-foreground text-center pt-1">
        התוצאות מתעדכנות אוטומטית בזמן אמת
      </p>
    </div>
  )
}

function InputField({
  input,
  value,
  onChange,
}: {
  input: CalculatorInput
  value: string | number
  onChange: (v: string | number) => void
}) {
  const numVal = typeof value === "string" ? parseFloat(value) || 0 : value

  if (input.type === "select") {
    return (
      <div>
        <label htmlFor={input.id} className="block text-sm font-medium text-foreground mb-1.5">
          {input.label}
        </label>
        <select
          id={input.id}
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2.5 text-sm border border-border rounded-xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
        >
          {input.options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {input.helpText && <p className="text-xs text-muted-foreground mt-1">{input.helpText}</p>}
      </div>
    )
  }

  if (input.type === "date") {
    return (
      <div>
        <label htmlFor={input.id} className="block text-sm font-medium text-foreground mb-1.5">
          {input.label}
        </label>
        <input
          id={input.id}
          type="date"
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
          max={new Date().toISOString().split("T")[0]}
          className="w-full px-3 py-2.5 text-sm border border-border rounded-xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
    )
  }

  // Number with slider if min/max defined
  const hasSlider = input.min !== undefined && input.max !== undefined
  const pct = hasSlider ? ((numVal - input.min!) / (input.max! - input.min!)) * 100 : 0

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label htmlFor={input.id} className="text-sm font-medium text-foreground">
          {input.label}
        </label>
        <span className="text-sm font-bold text-primary">
          {input.unit === "₪"
            ? `₪${formatNumber(numVal)}`
            : input.unit === "%"
            ? `${numVal}%`
            : input.unit
            ? `${formatNumber(numVal)} ${input.unit}`
            : formatNumber(numVal, 2)}
        </span>
      </div>

      {hasSlider && (
        <div className="relative mb-2">
          <div className="relative h-2 bg-border rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 right-0 bg-primary rounded-full transition-all"
              style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
            />
          </div>
          <input
            type="range"
            min={input.min}
            max={input.max}
            step={input.step ?? 1}
            value={numVal}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="absolute inset-0 w-full opacity-0 cursor-pointer h-2"
            aria-label={input.label}
          />
        </div>
      )}

      <div className="relative">
        <input
          id={input.id}
          type="number"
          value={numVal || ""}
          onChange={(e) => {
            const v = parseFloat(e.target.value)
            if (!isNaN(v)) onChange(v)
          }}
          min={input.min}
          max={input.max}
          step={input.step}
          placeholder={input.placeholder}
          className={cn(
            "w-full px-3 py-2.5 text-sm border border-border rounded-xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-shadow",
            input.unit && "pl-12"
          )}
          aria-label={input.label}
        />
        {input.unit && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground pointer-events-none">
            {input.unit}
          </span>
        )}
      </div>
      {input.helpText && <p className="text-xs text-muted-foreground mt-1">{input.helpText}</p>}
    </div>
  )
}
