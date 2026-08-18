import { Link } from "react-router-dom"
import { Search, Calculator, ArrowLeft, TrendingUp, Banknote, Home, Shield, Star, Sparkles } from "lucide-react"
import { useState, useMemo } from "react"
import { useTodayFeatured } from "@/hooks/use-today-featured"
import { usePageMeta } from "@/lib/seo"
import { calculators, getPopularCalculators, searchCalculators } from "@/data/calculators"
import { categories } from "@/data/categories"
import { calcBrutoNeto } from "@/lib/calculators"
import { formatCurrency, formatPercent } from "@/lib/format"
import CategoryGrid from "@/components/shared/CategoryGrid"
import CalculatorCard from "@/components/shared/CalculatorCard"
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts"

export default function HomePage() {
  const [query, setQuery] = useState("")
  const searchResults = query.length >= 2 ? searchCalculators(query) : []
  const popular = getPopularCalculators()
  const todayFeatured = useTodayFeatured()

  usePageMeta({
    title: "חשב לי – כל המחשבונים החשובים בישראל במקום אחד",
    description: 'מחשבוני ישראל: שכר נטו-ברוטו, ביטוח לאומי, מס הכנסה, משכנתא, BMI, מע"מ, פנסיה ועוד. כל החישובים החשובים לישראלים בחינם.',
    keywords: ["מחשבונים ישראל", "חשב לי", "שכר ישראל", "מס הכנסה", "ביטוח לאומי", "משכנתא ישראל"],
  })

  const salaryCalcs = calculators.filter((c) => c.categorySlug === "salary-tax")
  const mortgageCalcs = calculators.filter((c) => c.categorySlug === "mortgage-loans").slice(0, 3)
  const bituachCalcs = calculators.filter((c) => ["bituach-leumi", "family-children"].includes(c.categorySlug))

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-primary/5 border-b border-border py-10 sm:py-14" aria-label="כותרת ראשית">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            {/* Left: headline + search */}
            <div>
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm font-semibold mb-4">
                <Calculator className="w-3.5 h-3.5" />
                {calculators.length}+ מחשבונים בחינם
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground mb-4 leading-tight">
                כל המחשבונים<br />
                <span className="text-primary">החשובים לישראלים</span>
              </h1>
              <p className="text-lg text-muted-foreground mb-6 leading-relaxed max-w-lg">
                חשב שכר נטו, פנסיה, מס רכישה, ביטוח לאומי, BMI ועוד — הכל בזמן אמת, ללא הרשמה
              </p>
              <div className="relative max-w-md">
                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                  <Search className="w-5 h-5 text-muted-foreground" />
                </div>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="חפש מחשבון... ברוטו, משכנתא, BMI..."
                  className="w-full pr-12 pl-4 py-3.5 text-base border-2 border-border rounded-xl bg-card text-card-foreground focus:outline-none focus:border-primary shadow-sm transition-shadow"
                  aria-label="חיפוש מחשבון"
                />
                {query.length >= 2 && (
                  <div className="absolute top-full mt-1 w-full bg-popover text-popover-foreground border border-border rounded-xl shadow-xl z-20">
                    {searchResults.length > 0 ? (
                      <ul className="py-2 max-h-60 overflow-y-auto">
                        {searchResults.map((calc) => (
                          <li key={calc.id}>
                            <Link
                              to={`/calculators/${calc.slug}`}
                              onClick={() => setQuery("")}
                              className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted transition-colors"
                            >
                              <Calculator className="w-4 h-4 text-primary shrink-0" />
                              <div>
                                <div className="text-sm font-medium">{calc.title}</div>
                                <div className="text-xs text-muted-foreground line-clamp-1">{calc.description}</div>
                              </div>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="px-4 py-3 text-sm text-muted-foreground text-center">לא נמצאו תוצאות</p>
                    )}
                  </div>
                )}
              </div>
              {/* Quick links */}
              <div className="flex flex-wrap gap-2 mt-4">
                {["bruto-neto", "mortgage-payment", "bmi", "pension-estimate"].map((slug) => {
                  const calc = calculators.find((c) => c.slug === slug)
                  if (!calc) return null
                  return (
                    <Link
                      key={slug}
                      to={`/calculators/${slug}`}
                      className="text-sm px-3 py-1.5 bg-card border border-border rounded-full font-medium text-card-foreground hover:border-primary hover:text-primary transition-colors"
                    >
                      {calc.shortTitle}
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* Right: live mini bruto-neto widget */}
            <HeroWidget />
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-14">
        {/* Daily featured calculator */}
        {todayFeatured && (
          <Link
            to={`/calculators/${todayFeatured.calculator_slug}`}
            className="flex items-center gap-4 p-4 sm:p-5 rounded-2xl border-2 border-amber-300 dark:border-amber-700 bg-gradient-to-l from-amber-50/80 to-yellow-50 dark:from-amber-950/30 dark:to-amber-950/10 hover:border-amber-400 hover:shadow-sm transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center shrink-0">
              <Star className="w-6 h-6 text-amber-500 fill-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-extrabold bg-amber-400 text-amber-900 px-2 py-0.5 rounded-full">מחשבון היום</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(todayFeatured.date).toLocaleDateString("he-IL", { weekday: "long", day: "numeric", month: "long" })}
                </span>
              </div>
              <p className="font-extrabold text-foreground text-lg group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                {todayFeatured.calculator_title}
              </p>
            </div>
            <ArrowLeft className="w-5 h-5 text-amber-500 rtl:rotate-180 shrink-0" />
          </Link>
        )}

        {/* Fun calculators promo */}
        <Link
          to="/fun"
          className="flex flex-col sm:flex-row items-center gap-4 p-5 sm:p-6 rounded-2xl border-2 border-chart-4/40 bg-gradient-to-l from-chart-4/10 to-primary/10 hover:border-chart-4/60 transition-all group"
        >
          <div className="w-14 h-14 rounded-2xl bg-chart-4/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Sparkles className="w-7 h-7 text-chart-4" />
          </div>
          <div className="text-center sm:text-right flex-1">
            <div className="flex items-center gap-1.5 justify-center sm:justify-start mb-1">
              <span className="text-xs bg-chart-4 text-white px-2 py-0.5 rounded-full font-bold">חדש!</span>
              <span className="text-xs text-muted-foreground font-medium">מחשבונים אינטראקטיביים עם אנימציות</span>
            </div>
            <p className="text-lg font-extrabold text-foreground">מחשבונים מגניבים</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              כמה באמת נשאר לך מהשכר, מונה מונית חי, ואם משתלם לך חופשי חודשי — הכל מתעדכן בזמן אמת
            </p>
          </div>
          <div className="text-chart-4 font-bold text-sm whitespace-nowrap flex items-center gap-1 group-hover:gap-2 transition-all">
            נסה עכשיו ←
          </div>
        </Link>

        {/* Categories */}
        <CategoryGrid categories={categories} title="כל הקטגוריות" />

        {/* Salary quick-links (long-tail SEO) */}
        <section aria-label="חישובי שכר מהירים">
          <h2 className="text-2xl font-bold text-foreground mb-2">כמה נטו מקבלים מהמשכורת?</h2>
          <p className="text-sm text-muted-foreground mb-4">תוצאות מחושבות מראש — ללא המתנה</p>
          <div className="flex flex-wrap gap-2">
            {[
              { amount: 8000, slug: "salary-8000" },
              { amount: 10000, slug: "salary-10000" },
              { amount: 12000, slug: "salary-12000" },
              { amount: 15000, slug: "salary-15000" },
              { amount: 18000, slug: "salary-18000" },
              { amount: 20000, slug: "salary-20000" },
              { amount: 25000, slug: "salary-25000" },
              { amount: 30000, slug: "salary-30000" },
            ].map(({ amount, slug }) => {
              const r = calcBrutoNeto({ grossSalary: amount, taxCredits: 2.25 })
              return (
                <Link
                  key={slug}
                  to={`/salary/${slug}`}
                  className="px-4 py-2.5 bg-card border border-border rounded-xl text-sm font-medium text-card-foreground hover:border-primary hover:text-primary hover:shadow-sm transition-all"
                >
                  {formatCurrency(amount)} ברוטו → <span className="font-bold">{formatCurrency(Math.round(r.netSalary))}</span> נטו
                </Link>
              )
            })}
          </div>
        </section>

        {/* Popular quick tiles */}
        <section aria-label="מחשבונים מהירים">
          <h2 className="text-2xl font-bold text-foreground mb-5">הכי פופולריים</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {popular.slice(0, 10).map((calc) => (
              <Link
                key={calc.id}
                to={`/calculators/${calc.slug}`}
                className="flex flex-col items-center gap-2 p-4 bg-card border border-border rounded-xl hover:border-primary/50 hover:shadow-sm transition-all text-center group"
              >
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Calculator className="w-5 h-5 text-primary" />
                </div>
                <span className="text-xs font-semibold text-foreground leading-tight group-hover:text-primary transition-colors">
                  {calc.shortTitle}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Salary & Tax */}
        <HomeSection
          title="שכר, מסים ומשכורת"
          icon={<Banknote className="w-5 h-5 text-primary" />}
          categorySlug="salary-tax"
          calculators={salaryCalcs}
        />

        {/* Mortgage & Loans */}
        <HomeSection
          title="משכנתא, הלוואות ומימון"
          icon={<Home className="w-5 h-5 text-primary" />}
          categorySlug="mortgage-loans"
          calculators={mortgageCalcs}
        />

        {/* Bituach Leumi */}
        <HomeSection
          title="ביטוח לאומי, משפחה וזכויות"
          icon={<Shield className="w-5 h-5 text-primary" />}
          categorySlug="bituach-leumi"
          calculators={bituachCalcs}
        />

        {/* CTA banner */}
        <section
          className="rounded-2xl p-8 sm:p-12 text-center"
          style={{ background: "linear-gradient(135deg, var(--color-primary), oklch(0.4 0.22 280))" }}
          aria-label="קריאה לפעולה"
        >
          <TrendingUp className="w-10 h-10 mx-auto mb-4 text-white opacity-80" />
          <h2 className="text-2xl sm:text-3xl font-extrabold mb-3 text-white">לא מצאת את המחשבון שאתה צריך?</h2>
          <p className="text-white/80 mb-6 max-w-md mx-auto">
            יש לנו {calculators.length}+ מחשבונים בכל הקטגוריות
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                to={`/categories/${cat.slug}`}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-semibold text-white transition-colors border border-white/20"
              >
                {cat.shortName}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  )
}

// ─── Hero live widget ─────────────────────────────────────────────
function HeroWidget() {
  const [gross, setGross] = useState(15000)
  const result = useMemo(() => calcBrutoNeto({ grossSalary: gross, taxCredits: 2.25 }), [gross])

  const pieData = [
    { name: "נטו", value: Math.max(0, result.netSalary), color: "var(--color-success)" },
    { name: "מס", value: Math.max(0, result.incomeTax), color: "var(--color-primary)" },
    { name: "ב.ל", value: Math.max(0, result.nationalInsurance), color: "oklch(0.828 0.189 84.429)" },
  ]

  return (
    <div className="bg-card text-card-foreground rounded-2xl border border-border shadow-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
          <Banknote className="w-4 h-4 text-primary" />
        </div>
        <div>
          <div className="text-sm font-bold text-foreground">מחשבון ברוטו לנטו</div>
          <div className="text-xs text-muted-foreground">תוצאות בזמן אמת</div>
        </div>
      </div>

      {/* Slider */}
      <div className="mb-5">
        <div className="flex justify-between mb-1.5">
          <span className="text-sm text-muted-foreground">שכר ברוטו</span>
          <span className="text-sm font-bold text-primary">{formatCurrency(gross)}</span>
        </div>
        <div className="relative">
          <div className="h-2 bg-border rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${((gross - 5000) / (50000 - 5000)) * 100}%` }}
            />
          </div>
          <input
            type="range" min={5000} max={50000} step={500} value={gross}
            onChange={(e) => setGross(Number(e.target.value))}
            className="absolute inset-0 opacity-0 w-full cursor-pointer h-2"
            aria-label="שכר ברוטו"
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>5,000 ₪</span><span>50,000 ₪</span>
        </div>
      </div>

      {/* Result */}
      <div className="flex items-center gap-4">
        <ResponsiveContainer width={100} height={100}>
          <PieChart>
            <Pie data={pieData} cx="50%" cy="50%" innerRadius={28} outerRadius={46} dataKey="value" strokeWidth={0}>
              {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="flex-1 space-y-2">
          <div className="text-center">
            <div className="text-2xl font-black text-success">{formatCurrency(result.netSalary)}</div>
            <div className="text-xs text-muted-foreground">שכר נטו</div>
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-center">
            <div className="bg-muted rounded-lg py-1.5">
              <div className="text-xs font-bold text-foreground">{formatCurrency(result.incomeTax)}</div>
              <div className="text-xs text-muted-foreground">מס הכנסה</div>
            </div>
            <div className="bg-muted rounded-lg py-1.5">
              <div className="text-xs font-bold text-foreground">{formatCurrency(result.nationalInsurance)}</div>
              <div className="text-xs text-muted-foreground">ביטוח לאומי</div>
            </div>
          </div>
          <div className="text-center text-xs text-muted-foreground">
            ניכוי {formatPercent(result.effectiveTaxRate)}
          </div>
        </div>
      </div>

      <Link
        to="/calculators/bruto-neto"
        className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors"
      >
        חשב מלא עם פירוט
        <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
      </Link>
    </div>
  )
}

// ─── Reusable home section ────────────────────────────────────────
function HomeSection({
  title, icon, categorySlug, calculators: calcs,
}: {
  title: string
  icon: React.ReactNode
  categorySlug: string
  calculators: typeof calculators
}) {
  return (
    <section aria-label={title}>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="text-2xl font-bold text-foreground">{title}</h2>
        </div>
        <Link
          to={`/categories/${categorySlug}`}
          className="flex items-center gap-1 text-sm text-primary font-semibold hover:underline"
        >
          כל המחשבונים
          <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {calcs.map((calc) => (
          <CalculatorCard key={calc.id} calculator={calc} />
        ))}
      </div>
    </section>
  )
}
