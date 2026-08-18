import { formatCurrency, formatNumber, formatPercent } from "@/lib/format"
import { TrendingDown, TrendingUp, CheckCircle, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  AreaChart, Area, ResponsiveContainer
} from "recharts"

interface CalculatorResultProps {
  calculatorId: string
  result: Record<string, unknown>
  formulaExplanation: string
  exampleText: string
}

export default function CalculatorResult({
  calculatorId,
  result,
  formulaExplanation,
  exampleText,
}: CalculatorResultProps) {
  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <h2 className="text-base font-semibold text-foreground mb-5 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-success" />
          תוצאת החישוב
        </h2>
        <ResultContent id={calculatorId} result={result} />
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-800 mb-1">איך חושב?</p>
            <p className="text-sm text-blue-700">{formulaExplanation}</p>
            <p className="text-xs text-blue-500 mt-1.5 italic">{exampleText}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Per-calculator result renderers ─────────────────────────────
function ResultContent({ id, result }: { id: string; result: Record<string, unknown> }) {
  switch (id) {
    case "bruto-neto":
    case "neto-bruto": {
      const r = result as {
        grossSalary: number; incomeTax: number; nationalInsurance: number; netSalary: number; effectiveTaxRate: number
      }
      const pieData = [
        { name: "שכר נטו", value: Math.max(0, r.netSalary), color: "var(--color-success)" },
        { name: "מס הכנסה", value: Math.max(0, r.incomeTax), color: "var(--color-primary)" },
        { name: "ביטוח לאומי", value: Math.max(0, r.nationalInsurance), color: "oklch(0.828 0.189 84.429)" },
      ]
      return (
        <div className="space-y-4">
          <BigResult label="שכר נטו חודשי" value={formatCurrency(r.netSalary)} />
          <div className="flex gap-4 items-center">
            <div className="shrink-0">
              <ResponsiveContainer width={110} height={110}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={28} outerRadius={50} dataKey="value" strokeWidth={2}>
                    {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-2">
              {pieData.map((d) => (
                <div key={d.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                    <span className="text-xs text-muted-foreground">{d.name}</span>
                  </div>
                  <span className="text-xs font-semibold text-foreground">{formatCurrency(d.value)}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Stat label="שכר ברוטו" value={formatCurrency(r.grossSalary)} />
            <Stat label="ניכוי אפקטיבי" value={formatPercent(r.effectiveTaxRate)} variant="negative" />
          </div>
        </div>
      )
    }

    case "bmi": {
      const r = result as { bmi: number; category: string; categoryKey: string; idealWeightMin: number; idealWeightMax: number; weightToLose: number; weightToGain: number }
      const isNormal = r.categoryKey === "normal"
      const bmiColor = isNormal ? "var(--color-success)" :
        r.categoryKey === "underweight" ? "var(--color-primary)" : "oklch(0.828 0.189 84.429)"
      const zones = [
        { label: "תת-משקל", range: [0, 18.5], color: "oklch(0.546 0.24 264.4)" },
        { label: "תקין", range: [18.5, 25], color: "var(--color-success)" },
        { label: "עודף", range: [25, 30], color: "oklch(0.828 0.189 84.429)" },
        { label: "השמנה", range: [30, 40], color: "oklch(0.577 0.245 27.3)" },
      ]
      return (
        <div className="space-y-4">
          <div className="text-center p-4 rounded-xl" style={{ background: `${bmiColor}1a`, border: `1px solid ${bmiColor}40` }}>
            <div className="text-4xl font-black" style={{ color: bmiColor }}>{formatNumber(r.bmi, 1)}</div>
            <div className="text-sm font-semibold mt-1" style={{ color: bmiColor }}>{r.category}</div>
          </div>
          {/* BMI scale bar */}
          <div>
            <div className="flex rounded-full overflow-hidden h-3 mb-1">
              {zones.map((z) => <div key={z.label} className="flex-1" style={{ background: z.color }} />)}
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              {zones.map((z) => <span key={z.label}>{z.label}</span>)}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Stat label="טווח תקין" value={`${formatNumber(r.idealWeightMin, 0)}–${formatNumber(r.idealWeightMax, 0)} ק"ג`} />
            {r.weightToLose > 0
              ? <Stat label="לירידה" value={`${formatNumber(r.weightToLose, 1)} ק"ג`} variant="negative" />
              : r.weightToGain > 0
              ? <Stat label="לעלייה" value={`${formatNumber(r.weightToGain, 1)} ק"ג`} variant="positive" />
              : <Stat label="סטטוס" value="✓ משקל תקין" variant="positive" />}
          </div>
        </div>
      )
    }

    case "mortgage-payment": {
      const r = result as { monthlyPayment: number; totalPayment: number; totalInterest: number; loanAmount: number; principalPercent: number; interestPercent: number }
      const pieData = [
        { name: "קרן", value: r.loanAmount, color: "var(--color-success)" },
        { name: "ריבית", value: r.totalInterest, color: "var(--color-destructive)" },
      ]
      return (
        <div className="space-y-4">
          <BigResult label="תשלום חודשי" value={formatCurrency(r.monthlyPayment)} />
          <div className="flex gap-4 items-center">
            <div className="shrink-0">
              <ResponsiveContainer width={110} height={110}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={28} outerRadius={50} dataKey="value" strokeWidth={2}>
                    {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-2">
              {pieData.map((d) => (
                <div key={d.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                    <span className="text-xs text-muted-foreground">{d.name}</span>
                  </div>
                  <span className="text-xs font-semibold">{formatCurrency(d.value)}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Stat label="סך תשלומים" value={formatCurrency(r.totalPayment)} />
            <Stat label="סך ריבית" value={formatCurrency(r.totalInterest)} variant="negative" />
          </div>
        </div>
      )
    }

    case "loan-payment": {
      const r = result as { monthlyPayment: number; totalPayment: number; totalInterest: number; loanAmount: number; interestToLoanRatio: number }
      return (
        <div className="space-y-4">
          <BigResult label="תשלום חודשי" value={formatCurrency(r.monthlyPayment)} />
          <div className="grid grid-cols-2 gap-2">
            <Stat label="קרן הלוואה" value={formatCurrency(r.loanAmount)} />
            <Stat label="סך ריבית" value={formatCurrency(r.totalInterest)} variant="negative" />
            <Stat label="סך תשלומים" value={formatCurrency(r.totalPayment)} />
            <Stat label="ריבית / קרן" value={formatPercent(r.interestToLoanRatio)} variant="negative" />
          </div>
        </div>
      )
    }

    case "compound-interest": {
      const r = result as { finalAmount: number; totalDeposited: number; totalInterest: number; yearlyData: { year: number; balance: number; deposited: number; interest: number }[] }
      const chartData = r.yearlyData.filter((_, i) => i % Math.max(1, Math.floor(r.yearlyData.length / 8)) === 0 || i === r.yearlyData.length - 1)
      return (
        <div className="space-y-4">
          <BigResult label="סכום סופי" value={formatCurrency(r.finalAmount)} />
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
                <XAxis dataKey="year" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis hide />
                <Tooltip
                  formatter={(v: unknown) => [formatCurrency(v as number), ""]}
                  contentStyle={{ fontSize: 11, borderRadius: 8 }}
                />
                <Area type="monotone" dataKey="deposited" stackId="1" stroke="var(--color-primary)" fill="var(--color-primary)" fillOpacity={0.15} name="הפקדות" />
                <Area type="monotone" dataKey="interest" stackId="1" stroke="var(--color-success)" fill="var(--color-success)" fillOpacity={0.25} name="ריבית" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Stat label="הפקדות" value={formatCurrency(r.totalDeposited)} />
            <Stat label="רווח ריבית" value={formatCurrency(r.totalInterest)} variant="positive" />
          </div>
        </div>
      )
    }

    case "vat-calculator": {
      const r = result as { amountBeforeVat: number; vatAmount: number; amountWithVat: number; vatRate: number }
      return (
        <div className="space-y-4">
          <BigResult label='מחיר כולל מע"מ' value={formatCurrency(r.amountWithVat)} />
          <div className="grid grid-cols-2 gap-2">
            <Stat label='לפני מע"מ' value={formatCurrency(r.amountBeforeVat)} />
            <Stat label={`מע"מ ${r.vatRate}%`} value={formatCurrency(r.vatAmount)} variant="negative" />
          </div>
        </div>
      )
    }

    case "percentage": {
      const r = result as { result: number; explanation: string }
      return (
        <div className="space-y-4">
          <BigResult label="תוצאה" value={formatNumber(r.result, 2)} />
          <div className="p-3 bg-muted rounded-xl text-center">
            <p className="text-sm text-muted-foreground">{r.explanation}</p>
          </div>
        </div>
      )
    }

    case "age-calculator": {
      const r = result as { years: number; months: number; days: number; totalDays: number; nextBirthday: { daysUntil: number; date: string }; zodiacSign: string }
      return (
        <div className="space-y-4">
          <BigResult label="גיל מדויק" value={`${r.years} שנים`} />
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { label: "שנים", value: r.years },
              { label: "חודשים", value: r.months },
              { label: "ימים", value: r.days },
            ].map((item) => (
              <div key={item.label} className="bg-primary/5 rounded-xl p-3">
                <div className="text-2xl font-black text-primary">{item.value}</div>
                <div className="text-xs text-muted-foreground">{item.label}</div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Stat label="ימים כולל" value={formatNumber(r.totalDays)} />
            <Stat label="יום הולדת בעוד" value={`${r.nextBirthday.daysUntil} ימים`} variant="positive" />
            <Stat label="מזל" value={r.zodiacSign} />
          </div>
        </div>
      )
    }

    case "bituach-leumi-employee": {
      const r = result as { dailyBenefit: number; monthlyBenefit: number; eligibleDays: number; totalBenefit: number; isCapApplied: boolean }
      return (
        <div className="space-y-4">
          <BigResult label="גמלה חודשית משוערת" value={formatCurrency(r.monthlyBenefit)} sub={`עבור ${r.eligibleDays} ימים ראשונים`} />
          <div className="grid grid-cols-2 gap-2">
            <Stat label="גמלה יומית" value={formatCurrency(r.dailyBenefit)} />
            <Stat label="ימי זכאות" value={`${r.eligibleDays} ימים`} />
            <Stat label="סה״כ גמלה" value={formatCurrency(r.totalBenefit)} variant="positive" />
            {r.isCapApplied && <Stat label="הוחלה תקרה" value="337 ₪/יום" variant="negative" />}
          </div>
          <p className="text-xs text-muted-foreground text-center">* זכאות בפועל נקבעת ע"י המל"ל בלבד</p>
        </div>
      )
    }

    case "child-allowance": {
      const r = result as { monthlyTotal: number; annualTotal: number; perChild: number; numChildren: number }
      return (
        <div className="space-y-4">
          <BigResult label="קצבה חודשית" value={formatCurrency(r.monthlyTotal)} />
          <div className="grid grid-cols-2 gap-2">
            <Stat label="לכל ילד" value={formatCurrency(r.perChild)} />
            <Stat label="קצבה שנתית" value={formatCurrency(r.annualTotal)} variant="positive" />
          </div>
        </div>
      )
    }

    case "tax-credit-points": {
      const r = result as { totalPoints: number; monthlyReduction: number; annualReduction: number; breakdown: { label: string; points: number }[] }
      const chartData = r.breakdown.map((b) => ({ name: b.label.split(" ")[0], points: b.points }))
      return (
        <div className="space-y-4">
          <BigResult label="חיסכון במס חודשי" value={formatCurrency(r.monthlyReduction)} sub={`${formatNumber(r.totalPoints, 2)} נקודות × 242 ₪`} />
          {chartData.length > 1 && (
            <div className="h-28">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 4, right: 4, left: 4, bottom: 4 }} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={55} />
                  <Tooltip formatter={(v: unknown) => [`${v as number} נקודות`, ""]} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                  <Bar dataKey="points" fill="var(--color-primary)" radius={4} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <Stat label="חיסכון שנתי" value={formatCurrency(r.annualReduction)} variant="positive" />
            <Stat label="נקודות כולל" value={formatNumber(r.totalPoints, 2)} variant="positive" />
          </div>
        </div>
      )
    }

    // New calculators
    case "pension-estimate": {
      const r = result as { monthlyPension: number; totalSaved: number; totalContributions: number; replacementRate: number; yearlyData: { year: number; balance: number }[] }
      const chartData = r.yearlyData.filter((_, i) => i % Math.max(1, Math.floor(r.yearlyData.length / 8)) === 0 || i === r.yearlyData.length - 1)
      return (
        <div className="space-y-4">
          <BigResult label="קצבת פנסיה חודשית (הערכה)" value={formatCurrency(r.monthlyPension)} />
          <div className="h-36">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
                <XAxis dataKey="year" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis hide />
                <Tooltip formatter={(v: unknown) => [formatCurrency(v as number), "חיסכון"]} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                <Area type="monotone" dataKey="balance" stroke="var(--color-primary)" fill="var(--color-primary)" fillOpacity={0.15} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Stat label="חיסכון כולל צפוי" value={formatCurrency(r.totalSaved)} variant="positive" />
            <Stat label="שיעור החלפה" value={formatPercent(r.replacementRate)} />
          </div>
        </div>
      )
    }

    case "self-employed-tax": {
      const r = result as { netIncome: number; totalTax: number; incomeTax: number; niContrib: number; effectiveRate: number }
      const pieData = [
        { name: "הכנסה נטו", value: Math.max(0, r.netIncome), color: "var(--color-success)" },
        { name: "מס הכנסה", value: Math.max(0, r.incomeTax), color: "var(--color-primary)" },
        { name: "ביטוח לאומי", value: Math.max(0, r.niContrib), color: "oklch(0.828 0.189 84.429)" },
      ]
      return (
        <div className="space-y-4">
          <BigResult label="הכנסה נטו חודשית" value={formatCurrency(r.netIncome)} />
          <div className="flex gap-4 items-center">
            <ResponsiveContainer width={100} height={100}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={24} outerRadius={46} dataKey="value" strokeWidth={2}>
                  {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-1.5">
              {pieData.map((d) => (
                <div key={d.name} className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color }} />
                    {d.name}
                  </span>
                  <span className="text-xs font-semibold">{formatCurrency(d.value)}</span>
                </div>
              ))}
            </div>
          </div>
          <Stat label="שיעור מס אפקטיבי" value={formatPercent(r.effectiveRate)} variant="negative" />
        </div>
      )
    }

    case "hourly-to-monthly": {
      const r = result as { hourlyRate: number; dailyRate: number; monthlyGross: number; annualGross: number; withVacation: number }
      return (
        <div className="space-y-4">
          <BigResult label="שכר חודשי ברוטו" value={formatCurrency(r.monthlyGross)} />
          <div className="grid grid-cols-2 gap-2">
            <Stat label="לשעה" value={formatCurrency(r.hourlyRate)} />
            <Stat label="ליום (8 שעות)" value={formatCurrency(r.dailyRate)} />
            <Stat label="לשנה" value={formatCurrency(r.annualGross)} variant="positive" />
            <Stat label="עם חופשה (21 יום)" value={formatCurrency(r.withVacation)} />
          </div>
        </div>
      )
    }

    case "property-purchase-tax": {
      const r = result as { tax: number; taxRate: number; totalCost: number; price: number; isFirstApartment: boolean }
      return (
        <div className="space-y-4">
          <BigResult label="מס רכישה" value={formatCurrency(r.tax)} sub={r.isFirstApartment ? "דירה ראשונה" : "דירה נוספת"} />
          <div className="grid grid-cols-2 gap-2">
            <Stat label="מחיר נכס" value={formatCurrency(r.price)} />
            <Stat label="שיעור מס" value={formatPercent(r.taxRate)} variant="negative" />
            <Stat label="עלות כוללת" value={formatCurrency(r.totalCost)} />
          </div>
        </div>
      )
    }

    case "credit-card-payoff": {
      const r = result as { monthsToPayoff: number; totalInterest: number; totalPaid: number; minimumMonthly: number }
      return (
        <div className="space-y-4">
          <BigResult label="חודשים לסיום החוב" value={`${r.monthsToPayoff}`} sub={`${Math.ceil(r.monthsToPayoff / 12)} שנים`} />
          <div className="grid grid-cols-2 gap-2">
            <Stat label="תשלום מינימלי" value={formatCurrency(r.minimumMonthly)} />
            <Stat label="סך ריבית" value={formatCurrency(r.totalInterest)} variant="negative" />
            <Stat label="סה״כ תשלומים" value={formatCurrency(r.totalPaid)} />
          </div>
        </div>
      )
    }

    case "rental-yield": {
      const r = result as { grossYield: number; netYield: number; monthlyProfit: number; annualProfit: number; breakEvenYears: number }
      return (
        <div className="space-y-4">
          <BigResult label="תשואה שנתית ברוטו" value={formatPercent(r.grossYield, 2)} />
          <div className="grid grid-cols-2 gap-2">
            <Stat label="תשואה נטו" value={formatPercent(r.netYield, 2)} />
            <Stat label="רווח חודשי" value={formatCurrency(r.monthlyProfit)} variant="positive" />
            <Stat label="רווח שנתי" value={formatCurrency(r.annualProfit)} variant="positive" />
            <Stat label="החזר השקעה" value={`${r.breakEvenYears.toFixed(1)} שנים`} />
          </div>
        </div>
      )
    }

    case "salary-raise": {
      const r = result as { oldNet: number; newNet: number; netDiff: number; grossDiff: number; percentRaise: number; netPercentRaise: number; monthlyGain: number; annualGain: number }
      return (
        <div className="space-y-4">
          <BigResult label="תוספת נטו חודשית" value={formatCurrency(r.monthlyGain)} />
          <div className="grid grid-cols-2 gap-2">
            <Stat label="שכר נטו ישן" value={formatCurrency(r.oldNet)} />
            <Stat label="שכר נטו חדש" value={formatCurrency(r.newNet)} variant="positive" />
            <Stat label="הועלאה ברוטו" value={formatPercent(r.percentRaise, 1)} variant="positive" />
            <Stat label="העלאה נטו" value={formatPercent(r.netPercentRaise, 1)} variant="positive" />
            <Stat label="רווח שנתי" value={formatCurrency(r.annualGain)} variant="positive" />
            <Stat label="תוספת ברוטו" value={formatCurrency(r.grossDiff)} />
          </div>
          <div className="p-3 rounded-xl bg-muted text-center text-sm text-muted-foreground">
            מכל {formatCurrency(r.grossDiff)} העלאה ברוטו — {formatCurrency(r.monthlyGain)} מגיעים לחשבון ({formatPercent(r.monthlyGain / r.grossDiff * 100, 0)})
          </div>
        </div>
      )
    }

    case "rent-vs-buy": {
      const r = result as { monthlyMortgage: number; totalMortgageCost: number; totalRentCost: number; propertyValueAtEnd: number; buyNetWorth: number; rentNetWorth: number; betterChoice: "buy" | "rent" | "equal"; breakEvenYear: number }
      const isBuyBetter = r.betterChoice === "buy"
      return (
        <div className="space-y-4">
          <div className={cn(
            "p-4 rounded-xl text-center border",
            isBuyBetter ? "bg-success/10 border-success/30" : "bg-primary/10 border-primary/30"
          )}>
            <div className={`text-sm font-semibold mb-1 ${isBuyBetter ? "text-success" : "text-primary"}`}>
              {r.betterChoice === "buy" ? "קנייה עדיפה פיננסית" : r.betterChoice === "rent" ? "שכירות עדיפה פיננסית" : "שקולים"}
            </div>
            <div className={`text-2xl font-black ${isBuyBetter ? "text-success" : "text-primary"}`}>
              {r.betterChoice === "buy" ? "קנה!" : r.betterChoice === "rent" ? "שכור!" : "שקולים"}
            </div>
            <div className="text-xs text-muted-foreground mt-1">נקודת איזון: שנה {r.breakEvenYear}</div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Stat label="תשלום משכנתא חודשי" value={formatCurrency(r.monthlyMortgage)} />
            <Stat label="ערך נכס בסוף" value={formatCurrency(r.propertyValueAtEnd)} variant="positive" />
            <Stat label="שווי נטו קנייה" value={formatCurrency(r.buyNetWorth)} variant={isBuyBetter ? "positive" : undefined} />
            <Stat label="שווי נטו שכירות" value={formatCurrency(r.rentNetWorth)} variant={!isBuyBetter ? "positive" : undefined} />
          </div>
        </div>
      )
    }

    case "severance-pay": {
      const r = result as { severancePay: number; taxFreeLimit: number; taxableAmount: number; dailyRate: number }
      return (
        <div className="space-y-4">
          <BigResult label="סך פיצויים" value={formatCurrency(r.severancePay)} />
          <div className="grid grid-cols-2 gap-2">
            <Stat label="פטור ממס" value={formatCurrency(r.taxFreeLimit)} variant="positive" />
            <Stat label="סכום חייב במס" value={formatCurrency(r.taxableAmount)} variant="negative" />
            <Stat label="שכר יומי" value={formatCurrency(r.dailyRate)} />
          </div>
        </div>
      )
    }

    case "calorie-calculator": {
      const r = result as { bmr: number; tdee: number; loseWeight: number; gainWeight: number; maintainWeight: number }
      return (
        <div className="space-y-4">
          <BigResult label="צריכה יומית לשמירה" value={formatNumber(r.maintainWeight) + " קל"} />
          <div className="grid grid-cols-2 gap-2">
            <Stat label="BMR (מנוחה)" value={formatNumber(r.bmr) + " קל"} />
            <Stat label="לירידה במשקל" value={formatNumber(r.loseWeight) + " קל"} variant="negative" />
            <Stat label="לעלייה במשקל" value={formatNumber(r.gainWeight) + " קל"} variant="positive" />
            <Stat label="TDEE (פעילות)" value={formatNumber(r.tdee) + " קל"} />
          </div>
        </div>
      )
    }

    case "vacation-pay": {
      const r = result as { dailyRate: number; vacationPay: number }
      return (
        <div className="space-y-4">
          <BigResult label="סך פדיון חופשה" value={formatCurrency(r.vacationPay)} />
          <div className="grid grid-cols-2 gap-2">
            <Stat label="שכר יומי" value={formatCurrency(r.dailyRate)} />
          </div>
        </div>
      )
    }

    case "sick-pay": {
      const r = result as { dailyRate: number; sickPay: number; firstThreeDays: number; remainingDays: number }
      return (
        <div className="space-y-4">
          <BigResult label="סך דמי מחלה" value={formatCurrency(r.sickPay)} />
          <div className="grid grid-cols-2 gap-2">
            <Stat label="3 ימים ראשונים" value={formatCurrency(r.firstThreeDays)} />
            <Stat label="ימים נוספים" value={formatCurrency(r.remainingDays)} />
            <Stat label="שכר יומי" value={formatCurrency(r.dailyRate)} />
          </div>
        </div>
      )
    }

    case "car-lease-vs-buy": {
      const r = result as { totalLeaseCost: number; carValueAfterDepreciation: number; buyNetLoss: number; cheaper: "lease" | "buy" | "equal" }
      const isLeaseBetter = r.cheaper === "lease"
      return (
        <div className="space-y-4">
          <div className={cn(
            "p-4 rounded-xl text-center border",
            isLeaseBetter ? "bg-success/10 border-success/30" : "bg-primary/10 border-primary/30"
          )}>
            <div className="text-2xl font-black text-success">
              {r.cheaper === "lease" ? "ליסינג עדיף" : r.cheaper === "buy" ? "קנייה עדיפה" : "שקול"}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Stat label="עלות ליסינג כוללת" value={formatCurrency(r.totalLeaseCost)} variant={isLeaseBetter ? "positive" : undefined} />
            <Stat label="ערך רכב אחרי פחת" value={formatCurrency(r.carValueAfterDepreciation)} />
            <Stat label="הפסד קנייה" value={formatCurrency(r.buyNetLoss)} variant={!isLeaseBetter ? "positive" : undefined} />
          </div>
        </div>
      )
    }

    case "fuel-cost": {
      const r = result as { monthlyLiters: number; monthlyCost: number; annualCost: number }
      return (
        <div className="space-y-4">
          <BigResult label="עלות חודשית" value={formatCurrency(r.monthlyCost)} />
          <div className="grid grid-cols-2 gap-2">
            <Stat label="צריכה חודשית" value={formatNumber(r.monthlyLiters) + " ל'"} />
            <Stat label="עלות שנתית" value={formatCurrency(r.annualCost)} variant="negative" />
          </div>
        </div>
      )
    }

    case "inflation-impact": {
      const r = result as { futureValue: number; purchasingPower: number; lostValue: number }
      return (
        <div className="space-y-4">
          <BigResult label="ערך כוח הקנייה" value={formatCurrency(r.purchasingPower)} />
          <div className="grid grid-cols-2 gap-2">
            <Stat label="סכום מקורי" value={formatCurrency(r.futureValue)} />
            <Stat label="ערך שאבד" value={formatCurrency(r.lostValue)} variant="negative" />
          </div>
        </div>
      )
    }

    case "tip-calculator": {
      const r = result as { tipAmount: number; totalAmount: number; perPerson: number }
      return (
        <div className="space-y-4">
          <BigResult label="סך כולל" value={formatCurrency(r.totalAmount)} />
          <div className="grid grid-cols-2 gap-2">
            <Stat label="טיפ" value={formatCurrency(r.tipAmount)} />
            <Stat label="לאדם" value={formatCurrency(r.perPerson)} />
          </div>
        </div>
      )
    }

    case "water-intake": {
      const r = result as { baseWaterMl: number; activityWaterMl: number; totalMl: number; totalLiters: number; glasses: number }
      return (
        <div className="space-y-4">
          <BigResult label="צריכת מים יומית" value={formatNumber(r.totalLiters, 1) + " ל'"} />
          <div className="grid grid-cols-2 gap-2">
            <Stat label={'כוסות (250 מ"ל)'} value={formatNumber(r.glasses)} />
            <Stat label="בסיס לפי משקל" value={formatNumber(r.baseWaterMl) + " מ'ל"} />
            <Stat label="תוספת פעילות" value={formatNumber(r.activityWaterMl) + " מ'ל"} />
          </div>
        </div>
      )
    }

    case "unit-converter": {
      const r = result as { converted: number; fromLabel: string; toLabel: string; allConversions: { label: string; value: number }[] }
      return (
        <div className="space-y-4">
          <BigResult label={r.toLabel} value={formatNumber(r.converted, 2)} sub={`מ-${r.fromLabel}`} />
          {r.allConversions.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {r.allConversions.map((c) => (
                <Stat key={c.label} label={c.label} value={formatNumber(c.value, 2)} />
              ))}
            </div>
          )}
        </div>
      )
    }

    default:
      return <pre className="text-xs text-muted-foreground overflow-auto">{JSON.stringify(result, null, 2)}</pre>
  }
}

// ─── Shared primitives ────────────────────────────────────────────
function BigResult({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="p-4 rounded-xl text-center" style={{ background: "var(--color-success)1a", border: "1px solid color-mix(in oklch, var(--color-success) 30%, transparent)" }}>
      <div className="text-xs font-medium text-success mb-1">{label}</div>
      <div className="text-3xl font-black text-success">{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  )
}

function Stat({ label, value, variant }: { label: string; value: string; variant?: "positive" | "negative" }) {
  return (
    <div className="p-3 bg-muted rounded-xl">
      <div className="text-xs text-muted-foreground mb-0.5">{label}</div>
      <div className={cn(
        "font-bold text-sm flex items-center gap-1",
        variant === "positive" ? "text-success" :
          variant === "negative" ? "text-destructive" : "text-foreground"
      )}>
        {variant === "negative" && <TrendingDown className="w-3 h-3" />}
        {variant === "positive" && <TrendingUp className="w-3 h-3" />}
        {value}
      </div>
    </div>
  )
}
