import { useParams, Link, useSearchParams } from "react-router-dom"
import { getCalculatorBySlug, getRelatedCalculators, getPopularCalculators } from "@/data/calculators"
import { getCategoryBySlug } from "@/data/categories"
import { usePageMeta } from "@/lib/seo"
import { useCalculatorJsonLd } from "@/lib/jsonld"
import { getSmartTips, getResultSummary } from "@/lib/smart-tips"
import { runCalculator } from "@/lib/calculators"
import { useState, useCallback, useEffect } from "react"
import Breadcrumbs from "@/components/shared/Breadcrumbs"
import LiveCalculatorForm from "@/components/calculator/LiveCalculatorForm"
import CalculatorResult from "@/components/calculator/CalculatorResult"
import QuickAnswerBlock from "@/components/calculator/QuickAnswerBlock"
import FAQSection from "@/components/calculator/FAQSection"
import DisclaimerBox from "@/components/calculator/DisclaimerBox"
import RelatedCalculators from "@/components/calculator/RelatedCalculators"
import SeoTextSection from "@/components/calculator/SeoTextSection"
import InternalLinksBlock from "@/components/calculator/InternalLinksBlock"
import ResultToolbar from "@/components/calculator/ResultToolbar"
import CalculatorActions from "@/components/calculator/CalculatorActions"
import AmortizationTable from "@/components/calculator/AmortizationTable"
import { Calculator, Info, Table, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import { useRecentlyViewed } from "@/hooks/use-recently-viewed"

export default function CalculatorPage() {
  const { slug } = useParams<{ slug: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const calculator = slug ? getCalculatorBySlug(slug) : undefined

  const getDefaults = useCallback(() => {
    const defaults: Record<string, string | number> = {}
    if (!calculator) return defaults
    for (const input of calculator.inputs) {
      if (input.defaultValue !== undefined) defaults[input.id] = input.defaultValue
      else if (input.type === "select" && input.options?.[0]) defaults[input.id] = input.options[0].value
      else if (input.type === "date") defaults[input.id] = "1990-01-01"
      else defaults[input.id] = 0
    }
    return defaults
  }, [calculator])

  const [values, setValues] = useState<Record<string, string | number>>(() => {
    // Restore from URL params on first load
    if (!calculator) return {}
    const fromUrl: Record<string, string | number> = {}
    let hasUrlValues = false
    for (const input of calculator.inputs) {
      const urlVal = searchParams.get(input.id)
      if (urlVal !== null) {
        hasUrlValues = true
        fromUrl[input.id] = input.type === "number" ? parseFloat(urlVal) || 0 : urlVal
      }
    }
    if (hasUrlValues) return { ...getDefaults(), ...fromUrl }
    return getDefaults()
  })

  // Reset when calculator changes
  useEffect(() => {
    setValues(getDefaults())
    setSearchParams({}, { replace: true })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calculator?.id])

  const { track } = useRecentlyViewed()
  useEffect(() => {
    if (calculator) track(calculator.slug, calculator.title, calculator.categorySlug)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calculator?.id])

  const handleChange = (id: string, value: string | number) => {
    setValues((prev) => {
      const next = { ...prev, [id]: value }
      // Sync to URL
      const params: Record<string, string> = {}
      Object.entries(next).forEach(([k, v]) => { params[k] = String(v) })
      setSearchParams(params, { replace: true })
      return next
    })
  }

  if (!calculator) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <Calculator className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">מחשבון לא נמצא</h1>
        <p className="text-muted-foreground mb-6">המחשבון שחיפשת אינו קיים.</p>
        <Link to="/" className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors">
          חזרה לדף הבית
        </Link>
      </div>
    )
  }

  const category = getCategoryBySlug(calculator.categorySlug)
  const related = getRelatedCalculators(calculator.relatedCalculatorSlugs)
  const popular = getPopularCalculators().filter((c) => c.id !== calculator.id).slice(0, 3)
  const allRelated = [...related, ...popular.filter((p) => !related.find((r) => r.id === p.id))].slice(0, 6)
  const dataAgeDays = (Date.now() - new Date(calculator.lastUpdated).getTime()) / 86_400_000
  const isFinancialDataStale = dataAgeDays > 400 && calculator.categorySlug !== "health"

  const breadcrumbs = [
    { name: "בית", url: window.location.origin },
    ...(category ? [{ name: category.name, url: `${window.location.origin}/categories/${category.slug}` }] : []),
    { name: calculator.title, url: window.location.href },
  ]

  usePageMeta({
    title: calculator.seoTitle,
    description: calculator.seoDescription,
    canonical: `${window.location.origin}/calculators/${calculator.slug}`,
    keywords: calculator.keywords,
  })

  useCalculatorJsonLd(calculator, breadcrumbs)

  // Compute result live
  const numericValues: Record<string, unknown> = {}
  for (const input of calculator.inputs) {
    const raw = values[input.id]
    if (input.type === "number" || input.type === "range") numericValues[input.id] = parseFloat(String(raw)) || 0
    else numericValues[input.id] = raw
  }
  const result = runCalculator(calculator.id, numericValues)
  const tips = getSmartTips(calculator.id, result)
  const resultSummary = getResultSummary(calculator.id, result)

  // Show amortization table for mortgage/loan
  const showAmortization = calculator.id === "mortgage-payment" || calculator.id === "loan-payment"
  const amortizationProps = showAmortization ? {
    loanAmount: calculator.id === "mortgage-payment"
      ? (numericValues.loanAmount as number) ?? 1000000
      : (numericValues.loanAmount as number) ?? 50000,
    annualRate: (numericValues.interestRate as number) ?? 5.5,
    months: calculator.id === "mortgage-payment"
      ? ((numericValues.loanTermYears as number) ?? 25) * 12
      : (numericValues.loanTermMonths as number) ?? 36,
  } : null

  const [resultTab, setResultTab] = useState<"result" | "table">("result")

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10 print-full">
      <div className="mb-6 no-print">
        <Breadcrumbs
          items={[
            ...(category ? [{ label: category.shortName, href: `/categories/${category.slug}` }] : []),
            { label: calculator.title },
          ]}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main */}
        <div className="lg:col-span-2 space-y-8">
          <div>
            <div className="relative mb-6 aspect-[16/9] overflow-hidden rounded-2xl border border-border bg-muted shadow-lg">
              <img src={`/assets/calculators/${calculator.slug}.jpg`} alt={`תמונת המחשה עבור ${calculator.title}`} fetchPriority="high" className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" aria-hidden="true" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-3 leading-tight">
              {calculator.title}
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">{calculator.description}</p>
            {category && (
              <Link to={`/categories/${category.slug}`} className="inline-flex items-center gap-1.5 mt-3 text-sm text-primary font-medium hover:underline no-print">
                ← {category.name}
              </Link>
            )}
          </div>

          {isFinancialDataStale && (
            <div role="alert" className="flex gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
              <p className="text-sm"><strong>נתוני הבסיס אינם עדכניים.</strong> עודכן לאחרונה ב-{new Date(calculator.lastUpdated).toLocaleDateString("he-IL")}. אין להסתמך על התוצאה לקבלת החלטה כספית לפני אימות מול המקור הרשמי.</p>
            </div>
          )}

          <QuickAnswerBlock question={calculator.quickAnswer.question} answer={calculator.quickAnswer.answer} />

          {/* Calculator + Result side by side */}
          <section aria-label="מחשבון" className="space-y-4">
            {/* Tabs (only if amortization available) */}
            {showAmortization && (
              <div className="flex gap-1 no-print">
                {[
                  { key: "result", label: "תוצאה", icon: <Info className="w-4 h-4" /> },
                  { key: "table", label: "לוח תשלומים", icon: <Table className="w-4 h-4" /> },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setResultTab(tab.key as "result" | "table")}
                    className={cn(
                      "flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg border transition-colors",
                      resultTab === tab.key
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>
            )}

            <div className="grid lg:grid-cols-2 gap-6">
              <LiveCalculatorForm
                inputs={calculator.inputs}
                values={values}
                onChange={handleChange}
              />
              {resultTab === "result" || !showAmortization ? (
                <CalculatorResult
                  calculatorId={calculator.id}
                  result={result}
                  formulaExplanation={calculator.formulaExplanation}
                  exampleText={calculator.exampleText}
                />
              ) : null}
            </div>

            {/* Amortization table */}
            {showAmortization && resultTab === "table" && amortizationProps && (
              <AmortizationTable {...amortizationProps} />
            )}
          </section>

          {/* Toolbar: share, WhatsApp, print, smart tips */}
          <ResultToolbar
            calculatorTitle={calculator.title}
            resultSummary={resultSummary}
            tips={tips}
          />

          {/* Account actions: favorite, save, AI analysis */}
          <CalculatorActions
            calculatorId={calculator.id}
            slug={calculator.slug}
            title={calculator.title}
            categorySlug={calculator.categorySlug}
            inputs={values}
            resultSummary={resultSummary}
          />

          <DisclaimerBox disclaimer={calculator.disclaimer} sourceNote={calculator.sourceNote} />
          <SeoTextSection html={calculator.seoContent} />
          <InternalLinksBlock calculators={allRelated.slice(0, 5)} />
          <FAQSection faqs={calculator.faqs} />
          <RelatedCalculators calculators={allRelated} />
        </div>

        {/* Sidebar */}
        <aside className="space-y-4 no-print" aria-label="סרגל צד">
          <div className="lg:sticky lg:top-24 space-y-4">

            {/* Related / popular calculators block */}
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-bold text-foreground mb-3 text-sm">מחשבונים קשורים</h3>
              <div className="space-y-1.5">
                {allRelated.slice(0, 5).map((calc) => (
                  <Link
                    key={calc.id}
                    to={`/calculators/${calc.slug}`}
                    className="flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-muted transition-colors group"
                  >
                    <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                      <Calculator className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-sm text-foreground group-hover:text-primary transition-colors">{calc.shortTitle}</span>
                  </Link>
                ))}
              </div>
              {category && (
                <Link
                  to={`/categories/${category.slug}`}
                  className="mt-3 block text-center py-2 px-4 border border-border text-muted-foreground hover:text-foreground text-sm rounded-lg font-medium hover:bg-muted transition-colors"
                >
                  כל מחשבוני {category.shortName}
                </Link>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
