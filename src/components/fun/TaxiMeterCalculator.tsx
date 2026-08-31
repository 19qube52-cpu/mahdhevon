import { useEffect, useMemo, useRef, useState } from "react"
import { Car, Play, RotateCcw, Moon, Sun, Phone } from "lucide-react"
import { formatCurrency } from "@/lib/format"
import { Button } from "@/components/ui/button"

// Approximate Israeli Ministry of Transport taxi tariff (2024). For estimation only.
const OPENING_FARE = 12.9
const PER_KM = 2.6
const PER_WAIT_MIN = 0.9
const NIGHT_MULTIPLIER = 1.25
const PHONE_ORDER = 5.79

export default function TaxiMeterCalculator() {
  const [km, setKm] = useState(8)
  const [waitMin, setWaitMin] = useState(0)
  const [night, setNight] = useState(false)
  const [phoneOrder, setPhoneOrder] = useState(false)

  const [displayed, setDisplayed] = useState(0)
  const [running, setRunning] = useState(false)
  const frameRef = useRef<number>(0)

  const breakdown = useMemo(() => {
    const mult = night ? NIGHT_MULTIPLIER : 1
    const opening = OPENING_FARE * mult
    const distance = km * PER_KM * mult
    const waiting = waitMin * PER_WAIT_MIN
    const order = phoneOrder ? PHONE_ORDER : 0
    return {
      opening,
      distance,
      waiting,
      order,
      total: opening + distance + waiting + order,
    }
  }, [km, waitMin, night, phoneOrder])

  useEffect(() => {
    return () => cancelAnimationFrame(frameRef.current)
  }, [])

  function startRide() {
    cancelAnimationFrame(frameRef.current)
    setRunning(true)
    const target = breakdown.total
    const duration = 2600
    const start = performance.now()
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1)
      setDisplayed(target * p)
      if (p < 1) {
        frameRef.current = requestAnimationFrame(tick)
      } else {
        setRunning(false)
      }
    }
    frameRef.current = requestAnimationFrame(tick)
  }

  function reset() {
    cancelAnimationFrame(frameRef.current)
    setRunning(false)
    setDisplayed(0)
  }

  return (
    <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-sm">
      {/* Header */}
      <div className="p-6 sm:p-7 bg-gradient-to-bl from-chart-4/15 via-card to-card border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-chart-4/20 flex items-center justify-center shrink-0">
            <Car className="w-6 h-6 text-chart-4" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-foreground">מונה מונית חי</h3>
            <p className="text-sm text-muted-foreground">כמה תעלה הנסיעה — לפי תעריף משרד התחבורה</p>
          </div>
        </div>
      </div>

      <div className="p-6 sm:p-7 space-y-6">
        {/* Meter display */}
        <div className="relative rounded-2xl bg-foreground text-background px-6 py-5 overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${running ? "bg-chart-4 animate-pulse" : "bg-chart-4/40"}`}
              />
              <span className="text-xs font-semibold uppercase tracking-widest opacity-70">
                {night ? "תעריף 2" : "תעריף 1"}
              </span>
            </div>
            <span className="text-xs opacity-60">₪ ILS</span>
          </div>
          <div className="mt-2 text-5xl sm:text-6xl font-black tabular-nums tracking-tight text-chart-4 leading-none">
            {displayed.toFixed(2)}
          </div>
          <div className="mt-1 text-xs opacity-60">
            {running ? "המונה פועל…" : displayed > 0 ? "סה\"כ לתשלום" : "לחץ 'הפעל מונה' כדי לראות את הנסיעה"}
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={startRide} disabled={running} className="flex-1 gap-2">
            <Play className="w-4 h-4" />
            הפעל מונה
          </Button>
          <Button onClick={reset} variant="outline" className="gap-2">
            <RotateCcw className="w-4 h-4" />
            אפס
          </Button>
        </div>

        {/* Distance slider */}
        <div>
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">מרחק הנסיעה</span>
            <span className="text-lg font-black text-foreground tabular-nums">{km} ק"מ</span>
          </div>
          <div className="relative h-2.5">
            <div className="absolute inset-0 h-2.5 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-chart-4 rounded-full transition-all duration-300"
                style={{ width: `${(km / 60) * 100}%` }}
              />
            </div>
            <input
              type="range" min={1} max={60} step={1} value={km}
              onChange={(e) => setKm(Number(e.target.value))}
              className="absolute inset-0 w-full h-2.5 opacity-0 cursor-pointer"
              aria-label="מרחק הנסיעה"
            />
          </div>
        </div>

        {/* Waiting slider */}
        <div>
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">זמן המתנה בפקקים</span>
            <span className="text-lg font-black text-foreground tabular-nums">{waitMin} דק'</span>
          </div>
          <div className="relative h-2.5">
            <div className="absolute inset-0 h-2.5 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-chart-4 rounded-full transition-all duration-300"
                style={{ width: `${(waitMin / 30) * 100}%` }}
              />
            </div>
            <input
              type="range" min={0} max={30} step={1} value={waitMin}
              onChange={(e) => setWaitMin(Number(e.target.value))}
              className="absolute inset-0 w-full h-2.5 opacity-0 cursor-pointer"
              aria-label="זמן המתנה"
            />
          </div>
        </div>

        {/* Toggles */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setNight((v) => !v)}
            className={`flex items-center justify-center gap-2 rounded-xl border-2 py-3 text-sm font-semibold transition-colors ${
              night
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card text-muted-foreground hover:border-primary/40"
            }`}
          >
            {night ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            {night ? "לילה / שבת (+25%)" : "יום רגיל"}
          </button>
          <button
            type="button"
            onClick={() => setPhoneOrder((v) => !v)}
            className={`flex items-center justify-center gap-2 rounded-xl border-2 py-3 text-sm font-semibold transition-colors ${
              phoneOrder
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card text-muted-foreground hover:border-primary/40"
            }`}
          >
            <Phone className="w-4 h-4" />
            הזמנה טלפונית
          </button>
        </div>

        {/* Breakdown */}
        <div className="rounded-2xl border border-border divide-y divide-border">
          <Row label="מחיר פתיחה" value={breakdown.opening} />
          <Row label={`נסיעה (${km} ק"מ)`} value={breakdown.distance} />
          {breakdown.waiting > 0 && <Row label={`המתנה (${waitMin} דק')`} value={breakdown.waiting} />}
          {breakdown.order > 0 && <Row label="תוספת הזמנה" value={breakdown.order} />}
          <div className="flex items-center justify-between px-4 py-3 bg-chart-4/10">
            <span className="text-sm font-bold text-foreground">סה"כ משוער</span>
            <span className="text-lg font-black text-foreground tabular-nums">{formatCurrency(breakdown.total, 2)}</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground text-center">
          המחירים משוערים לפי תעריף משרד התחבורה ועשויים להשתנות. אינם מהווים מחיר מחייב.
        </p>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold text-foreground tabular-nums">{formatCurrency(value, 2)}</span>
    </div>
  )
}
