import { useMemo, useState } from "react"
import { Wallet, CalendarDays, TrendingDown } from "lucide-react"
import { calcBrutoNeto } from "@/lib/calculators"
import { formatCurrency, formatPercent } from "@/lib/format"
import { useCountUp } from "@/hooks/use-count-up"

const DAYS_IN_YEAR = 365

export default function RealTakeHomeCalculator() {
  const [gross, setGross] = useState(15000)

  const result = useMemo(
    () => calcBrutoNeto({ grossSalary: gross, taxCredits: 2.25 }),
    [gross],
  )

  const keepRatio = result.netSalary / result.grossSalary
  const daysForYou = Math.round(DAYS_IN_YEAR * keepRatio)
  const daysForState = DAYS_IN_YEAR - daysForYou

  const netAnim = useCountUp(result.netSalary)
  const daysAnim = useCountUp(daysForYou)
  const deductionsAnim = useCountUp(result.incomeTax + result.nationalInsurance)

  const netPct = keepRatio * 100
  const taxPct = (result.incomeTax / result.grossSalary) * 100
  const niPct = (result.nationalInsurance / result.grossSalary) * 100

  return (
    <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-sm">
      {/* Header */}
      <div className="p-6 sm:p-7 bg-gradient-to-bl from-success/10 via-card to-card border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-success/15 flex items-center justify-center shrink-0">
            <Wallet className="w-6 h-6 text-success" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-foreground">כמה באמת נשאר לך?</h3>
            <p className="text-sm text-muted-foreground">כמה ימים בשנה אתה עובד באמת בשביל עצמך</p>
          </div>
        </div>
      </div>

      <div className="p-6 sm:p-7 space-y-7">
        {/* Slider */}
        <div>
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">שכר ברוטו חודשי</span>
            <span className="text-lg font-black text-foreground tabular-nums">{formatCurrency(gross)}</span>
          </div>
          <div className="relative h-2.5">
            <div className="absolute inset-0 h-2.5 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-l from-success to-success/60 rounded-full transition-all duration-300"
                style={{ width: `${((gross - 5000) / (60000 - 5000)) * 100}%` }}
              />
            </div>
            <input
              type="range" min={5000} max={60000} step={250} value={gross}
              onChange={(e) => setGross(Number(e.target.value))}
              className="absolute inset-0 w-full h-2.5 opacity-0 cursor-pointer"
              aria-label="שכר ברוטו חודשי"
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-1.5 tabular-nums">
            <span>5,000 ₪</span><span>60,000 ₪</span>
          </div>
        </div>

        {/* Big net number */}
        <div className="text-center rounded-2xl bg-success/5 border border-success/20 py-6 px-4">
          <div className="text-sm font-medium text-muted-foreground mb-1">נשאר לך ביד כל חודש</div>
          <div className="text-4xl sm:text-5xl font-black text-success tabular-nums leading-none">
            {formatCurrency(Math.round(netAnim))}
          </div>
          <div className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-success">
            <TrendingDown className="w-4 h-4 rotate-180" />
            {formatPercent(netPct)} מהברוטו
          </div>
        </div>

        {/* Segmented bar */}
        <div>
          <div className="flex h-4 rounded-full overflow-hidden shadow-inner">
            <div className="bg-success transition-all duration-500" style={{ width: `${netPct}%` }} title="נטו" />
            <div className="bg-primary transition-all duration-500" style={{ width: `${taxPct}%` }} title="מס הכנסה" />
            <div className="bg-chart-4 transition-all duration-500" style={{ width: `${niPct}%` }} title="ביטוח לאומי" />
          </div>
          <div className="grid grid-cols-3 gap-2 mt-3 text-center">
            <Legend color="bg-success" label="נטו" amount={result.netSalary} />
            <Legend color="bg-primary" label="מס הכנסה" amount={result.incomeTax} />
            <Legend color="bg-chart-4" label="ביטוח לאומי" amount={result.nationalInsurance} />
          </div>
        </div>

        {/* Days for you */}
        <div className="rounded-2xl border border-border bg-secondary/40 p-5">
          <div className="flex items-center gap-2 mb-3">
            <CalendarDays className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">מתוך 365 ימי שנה</span>
          </div>
          <div className="flex items-end justify-between gap-4 mb-3">
            <div>
              <div className="text-3xl font-black text-success tabular-nums leading-none">{Math.round(daysAnim)}</div>
              <div className="text-xs text-muted-foreground mt-1">ימים בשביל עצמך</div>
            </div>
            <div className="text-left">
              <div className="text-2xl font-black text-muted-foreground tabular-nums leading-none">{daysForState}</div>
              <div className="text-xs text-muted-foreground mt-1">ימים בשביל המדינה</div>
            </div>
          </div>
          {/* 365 dot grid */}
          <div className="grid grid-cols-[repeat(37,minmax(0,1fr))] gap-[3px]" aria-hidden="true">
            {Array.from({ length: DAYS_IN_YEAR }).map((_, i) => (
              <span
                key={i}
                className={`aspect-square rounded-[2px] transition-colors duration-300 ${
                  i < daysForYou ? "bg-success" : "bg-border"
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3 text-center">
            עד <span className="font-bold text-foreground">{dayLabel(daysForState)}</span> אתה עובד בשביל
            הניכויים — ומשם והלאה בשביל עצמך
          </p>
        </div>

        {/* Annual deductions */}
        <div className="flex items-center justify-between rounded-2xl bg-primary/5 border border-primary/15 px-5 py-4">
          <span className="text-sm font-medium text-foreground">סך הניכויים בשנה</span>
          <span className="text-xl font-black text-primary tabular-nums">
            {formatCurrency(Math.round(deductionsAnim) * 12)}
          </span>
        </div>
      </div>
    </div>
  )
}

function Legend({ color, label, amount }: { color: string; label: string; amount: number }) {
  return (
    <div>
      <div className="flex items-center justify-center gap-1.5 mb-0.5">
        <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <div className="text-sm font-bold text-foreground tabular-nums">{formatCurrency(amount)}</div>
    </div>
  )
}

function dayLabel(dayOfYear: number): string {
  const d = new Date(new Date().getFullYear(), 0, 1)
  d.setDate(d.getDate() + Math.max(0, dayOfYear - 1))
  return d.toLocaleDateString("he-IL", { day: "numeric", month: "long" })
}
