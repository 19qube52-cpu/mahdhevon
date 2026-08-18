import { useMemo, useState } from "react"
import { Bus, TramFront, Sparkles } from "lucide-react"
import { formatCurrency, formatNumber } from "@/lib/format"
import { useCountUp } from "@/hooks/use-count-up"

// Approximate Rav-Kav fares (2024). Single-ride price + monthly "free pass" per zone tier.
const TIERS = [
  { id: "urban", label: "עירוני", hint: "עד אזור 1", single: 5.5, monthly: 99 },
  { id: "short", label: "בין-עירוני קצר", hint: '2–3 טבעות', single: 12, monthly: 213 },
  { id: "long", label: "בין-עירוני ארוך", hint: "4+ טבעות", single: 20, monthly: 355 },
] as const

const WEEKS_PER_MONTH = 4.33

export default function TransitFareCalculator() {
  const [tierId, setTierId] = useState<(typeof TIERS)[number]["id"]>("urban")
  const [ridesPerWeek, setRidesPerWeek] = useState(10)

  const tier = TIERS.find((t) => t.id === tierId)!

  const calc = useMemo(() => {
    const monthlyRides = ridesPerWeek * WEEKS_PER_MONTH
    const payPerRide = monthlyRides * tier.single
    const monthlyPass = tier.monthly
    const breakeven = Math.ceil(monthlyPass / tier.single)
    const cheaper = payPerRide <= monthlyPass ? "single" : "pass"
    const savings = Math.abs(payPerRide - monthlyPass)
    return { monthlyRides, payPerRide, monthlyPass, breakeven, cheaper, savings }
  }, [tier, ridesPerWeek])

  const payAnim = useCountUp(calc.payPerRide)
  const savingsAnim = useCountUp(calc.savings)

  const max = Math.max(calc.payPerRide, calc.monthlyPass, 1)

  return (
    <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-sm">
      {/* Header */}
      <div className="p-6 sm:p-7 bg-gradient-to-bl from-primary/10 via-card to-card border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/15 flex items-center justify-center shrink-0">
            <Bus className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-foreground">אוטובוס או חופשי חודשי?</h3>
            <p className="text-sm text-muted-foreground">מה משתלם לך יותר בתחבורה הציבורית</p>
          </div>
        </div>
      </div>

      <div className="p-6 sm:p-7 space-y-6">
        {/* Tier selector */}
        <div className="grid grid-cols-3 gap-2">
          {TIERS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTierId(t.id)}
              className={`rounded-xl border-2 px-2 py-3 text-center transition-colors ${
                t.id === tierId
                  ? "border-primary bg-primary/10"
                  : "border-border bg-card hover:border-primary/40"
              }`}
            >
              <div className={`text-sm font-bold ${t.id === tierId ? "text-primary" : "text-foreground"}`}>
                {t.label}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">{t.hint}</div>
            </button>
          ))}
        </div>

        {/* Rides per week */}
        <div>
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">נסיעות בשבוע</span>
            <span className="text-lg font-black text-foreground tabular-nums">{ridesPerWeek}</span>
          </div>
          <div className="relative h-2.5">
            <div className="absolute inset-0 h-2.5 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${(ridesPerWeek / 40) * 100}%` }}
              />
            </div>
            <input
              type="range" min={1} max={40} step={1} value={ridesPerWeek}
              onChange={(e) => setRidesPerWeek(Number(e.target.value))}
              className="absolute inset-0 w-full h-2.5 opacity-0 cursor-pointer"
              aria-label="נסיעות בשבוע"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1.5">
            כ-{formatNumber(calc.monthlyRides)} נסיעות בחודש
          </p>
        </div>

        {/* Comparison bars */}
        <div className="space-y-3">
          <CompareBar
            icon={<TramFront className="w-4 h-4" />}
            label="תשלום לפי נסיעה"
            amount={Math.round(payAnim)}
            pct={(calc.payPerRide / max) * 100}
            active={calc.cheaper === "single"}
          />
          <CompareBar
            icon={<Sparkles className="w-4 h-4" />}
            label="חופשי חודשי"
            amount={calc.monthlyPass}
            pct={(calc.monthlyPass / max) * 100}
            active={calc.cheaper === "pass"}
          />
        </div>

        {/* Verdict */}
        <div
          className={`rounded-2xl border p-5 text-center ${
            calc.cheaper === "pass"
              ? "border-success/30 bg-success/5"
              : "border-primary/25 bg-primary/5"
          }`}
        >
          <div className="text-sm text-muted-foreground mb-1">
            {calc.cheaper === "pass" ? "כדאי לך חופשי חודשי!" : "עדיף לשלם לפי נסיעה"}
          </div>
          <div
            className={`text-3xl font-black tabular-nums leading-none ${
              calc.cheaper === "pass" ? "text-success" : "text-primary"
            }`}
          >
            חיסכון {formatCurrency(Math.round(savingsAnim))}
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            החופשי חודשי משתלם מ-<span className="font-bold text-foreground">{calc.breakeven} נסיעות</span> בחודש
          </div>
        </div>
        <p className="text-xs text-muted-foreground text-center">
          מחירים משוערים לפי תעריפי הרב-קו ועשויים להשתנות בין אזורים ומפעילים.
        </p>
      </div>
    </div>
  )
}

function CompareBar({
  icon, label, amount, pct, active,
}: {
  icon: React.ReactNode
  label: string
  amount: number
  pct: number
  active: boolean
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className={`flex items-center gap-1.5 text-sm font-medium ${active ? "text-foreground" : "text-muted-foreground"}`}>
          {icon}
          {label}
        </span>
        <span className={`text-sm font-black tabular-nums ${active ? "text-success" : "text-foreground"}`}>
          {formatCurrency(amount)}
        </span>
      </div>
      <div className="h-3 bg-secondary rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${active ? "bg-success" : "bg-primary/50"}`}
          style={{ width: `${Math.max(4, pct)}%` }}
        />
      </div>
    </div>
  )
}
