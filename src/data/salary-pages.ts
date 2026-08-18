import { calcBrutoNeto, type BrutoNetoResult } from "@/lib/calculators"
import { getDefaultCountry } from "@/data/countries"

export interface SalaryPage {
  amount: number
  slug: string
  title: string
  seoTitle: string
  seoDescription: string
  result: BrutoNetoResult
  keywords: string[]
  h1: string
  introParagraph: string
  breakdownText: string
  yearPages: { year: number; slug: string; title: string }[]
}

const SALARY_VALUES: number[] = [
  5000, 6000, 7000, 8000, 9000, 10000, 11000, 12000, 13000, 14000,
  15000, 16000, 17000, 18000, 19000, 20000, 22000, 25000, 28000, 30000,
  35000, 40000, 45000, 50000, 60000, 80000, 100000,
]

const COUNTRY = getDefaultCountry()

function formatNis(n: number): string {
  return new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS", maximumFractionDigits: 0 }).format(n)
}

export function generateSalaryPages(): SalaryPage[] {
  return SALARY_VALUES.map((amount) => {
    const slug = `salary-${amount}`
    const result = calcBrutoNeto({ grossSalary: amount, taxCredits: 2.25 }, COUNTRY)
    const neto = Math.round(result.netSalary)
    const tax = Math.round(result.incomeTax)
    const ni = Math.round(result.nationalInsurance)
    const effectiveRate = result.effectiveTaxRate.toFixed(1)

    const yearPages = [2024, 2025, 2026].map((year) => ({
      year,
      slug: `${slug}-${year}`,
      title: `משכורת ${formatNis(amount)} ברוטו לנטו ${year}`,
    }))

    return {
      amount,
      slug,
      title: `משכורת ${formatNis(amount)} ברוטו — כמה נטו?`,
      seoTitle: `משכורת ${formatNis(amount)} ברוטו כמה נטו ${COUNTRY.taxYear} | חשב לי`,
      seoDescription: `משכורת ${formatNis(amount)} ברוטו → ${formatNis(neto)} נטו. מס הכנסה ${formatNis(tax)}, ביטוח לאומי ${formatNis(ni)}, שיעור מס אפקטיבי ${effectiveRate}%. חישוב מדויק ל-${COUNTRY.taxYear}.`,
      keywords: [
        `${amount} ברוטו`, `${amount} נטו`, `משכורת ${amount}`, `כמה נטו מ${amount} ברוטו`,
        `מחשבון שכר ${amount}`, `שכר ${amount} לאחר מס`, `משכורת ${formatNis(amount)} נטו`,
      ],
      result,
      h1: `משכורת ${formatNis(amount)} ברוטו — כמה נשאר נטו?`,
      introParagraph: `משכורת של ${formatNis(amount)} ברוטו בישראל מניבה ${formatNis(neto)} נטו לחודש, לאחר ניכוי מס הכנסה בסך ${formatNis(tax)} וביטוח לאומי ובריאות בסך ${formatNis(ni)}. שיעור המס האפקטיבי הוא ${effectiveRate}%. החישוב מבוסס על מדרגות מס הכנסה ושיעורי ביטוח לאומי לשנת ${COUNTRY.taxYear}, עם 2.25 נקודות זיכוי (תושב רגיל).`,
      breakdownText: `משכורת ברוטו: ${formatNis(amount)} ← מס הכנסה: -${formatNis(tax)} ← ביטוח לאומי: -${formatNis(ni)} ← שכר נטו: ${formatNis(neto)}`,
      yearPages,
    }
  })
}

export function getSalaryPage(slug: string): SalaryPage | undefined {
  const pages = generateSalaryPages()
  const basePage = pages.find((p) => p.slug === slug)
  if (basePage) return basePage

  const yearMatch = slug.match(/^(salary-\d+)-(2024|2025|2026)$/)
  if (!yearMatch) return undefined

  const page = pages.find((p) => p.slug === yearMatch[1])
  if (!page) return undefined

  const year = Number(yearMatch[2])
  return {
    ...page,
    slug,
    title: `משכורת ${formatNis(page.amount)} ברוטו — כמה נטו בשנת ${year}?`,
    seoTitle: `משכורת ${formatNis(page.amount)} ברוטו כמה נטו ${year} | חשב לי`,
    seoDescription: `משכורת ${formatNis(page.amount)} ברוטו → ${formatNis(Math.round(page.result.netSalary))} נטו לפי חישוב שנת ${year}.`,
    h1: `משכורת ${formatNis(page.amount)} ברוטו — כמה נשאר נטו בשנת ${year}?`,
    introParagraph: `בשנת ${year}, משכורת של ${formatNis(page.amount)} ברוטו מניבה לפי החישוב הנוכחי ${formatNis(Math.round(page.result.netSalary))} נטו לחודש. התוצאה היא הערכה המבוססת על 2.25 נקודות זיכוי ועל נתוני המס הזמינים למחשבון.`,
  }
}

export function getAllSalarySlugs(): string[] {
  return generateSalaryPages().flatMap((p) => [p.slug, ...p.yearPages.map((yp) => yp.slug)])
}
