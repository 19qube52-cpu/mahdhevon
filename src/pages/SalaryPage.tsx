import { useParams, Link } from "react-router-dom"
import { getSalaryPage } from "@/data/salary-pages"
import { usePageMeta } from "@/lib/seo"
import { useEffect } from "react"
import Breadcrumbs from "@/components/shared/Breadcrumbs"
import { Calculator, TrendingDown, ArrowLeft, Link as LinkIcon } from "lucide-react"

export default function SalaryPage() {
  const { slug } = useParams<{ slug: string }>()
  const page = slug ? getSalaryPage(slug) : undefined

  usePageMeta({
    title: page?.seoTitle ?? "משכורת ברוטו לנטו | חשב לי",
    description: page?.seoDescription ?? "",
    canonical: page ? `${window.location.origin}/salary/${page.slug}` : undefined,
    keywords: page?.keywords,
    hreflangs: [
      { lang: "he", href: `${window.location.origin}/salary/${page?.slug ?? ""}` },
    ],
  })

  useEffect(() => {
    if (!page) return
    const id = "jsonld-salary"
    document.getElementById(id)?.remove()
    const schema = [
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: `כמה נטו מקבלים מ${page.amount} ש"ח ברוטו?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: page.introParagraph,
            },
          },
          {
            "@type": "Question",
            name: `כמה מס הכנסה משלמים על ${page.amount} ש"ח?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: `על משכורת של ${page.amount} ש"ח ברוטו משלמים ${Math.round(page.result.incomeTax)} ש"ח מס הכנסה חודשי (עם 2.25 נקודות זיכוי).`,
            },
          },
        ],
      },
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "בית", item: window.location.origin },
          { "@type": "ListItem", position: 2, name: "מחשבון שכר", item: `${window.location.origin}/calculators/bruto-neto` },
          { "@type": "ListItem", position: 3, name: page.title, item: window.location.href },
        ],
      },
    ]
    const script = document.createElement("script")
    script.type = "application/ld+json"
    script.id = id
    script.textContent = JSON.stringify(schema)
    document.head.appendChild(script)
    return () => { document.getElementById(id)?.remove() }
  }, [page])

  if (!page) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <Calculator className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">עמוד לא נמצא</h1>
        <Link to="/" className="text-primary hover:underline">חזרה לדף הבית</Link>
      </div>
    )
  }

  const neto = Math.round(page.result.netSalary)
  const tax = Math.round(page.result.incomeTax)
  const ni = Math.round(page.result.nationalInsurance)
  const rate = page.result.effectiveTaxRate.toFixed(1)
  const formatNis = (n: number) => new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS", maximumFractionDigits: 0 }).format(n)

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <Breadcrumbs
        items={[
          { label: "מחשבונים", href: "/calculators/bruto-neto" },
          { label: page.title },
        ]}
      />

      <div className="mt-6 mb-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-4 leading-tight">
          {page.h1}
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          {page.introParagraph}
        </p>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 mb-8 shadow-sm">
        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-muted-foreground mb-1">שכר ברוטו</p>
            <p className="text-3xl font-bold text-foreground">{formatNis(page.amount)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">שכר נטו</p>
            <p className="text-3xl font-bold text-primary">{formatNis(neto)}</p>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-border space-y-3">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingDown className="w-4 h-4" />
              מס הכנסה
            </span>
            <span className="text-sm font-semibold text-foreground">-{formatNis(tax)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingDown className="w-4 h-4" />
              ביטוח לאומי + בריאות
            </span>
            <span className="text-sm font-semibold text-foreground">-{formatNis(ni)}</span>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-border">
            <span className="text-sm text-muted-foreground">שיעור מס אפקטיבי</span>
            <span className="text-sm font-bold text-foreground">{rate}%</span>
          </div>
        </div>
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 mb-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="font-bold text-foreground mb-1">רוצה לחשב עם נקודות זיכוי אחרות?</h2>
            <p className="text-sm text-muted-foreground">הזן את השכר והנקודות שלך וקבל חישוב מדויק</p>
          </div>
          <Link
            to="/calculators/bruto-neto"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors whitespace-nowrap"
          >
            פתח מחשבון שכר
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-bold text-foreground mb-4">חישוב לפי שנה</h2>
        <div className="flex gap-3 flex-wrap">
          {page.yearPages.map((yp) => (
            <Link
              key={yp.slug}
              to={`/salary/${yp.slug}`}
              className="px-4 py-2 bg-card border border-border rounded-lg text-sm font-medium text-foreground hover:border-primary hover:text-primary transition-colors"
            >
              {yp.title}
            </Link>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 mb-8 text-sm">
        <Link
          to="/embed-directory"
          className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
        >
          <LinkIcon className="w-4 h-4" />
          הטמע מחשבון באתר שלך
        </Link>
      </div>

      <div className="prose prose-sm max-w-none text-muted-foreground leading-relaxed space-y-4">
        <h2 className="text-xl font-bold text-foreground">פירוט החישוב: {formatNis(page.amount)} ברוטו</h2>
        <p>{page.breakdownText}</p>
        <p>
          החישוב מתבסס על מדרגות מס ההכנסה הפרוגרסיביות בישראל לשנת {new Date().getFullYear()}.
          ככל שהשכר גבוה יותר, שיעור המס על החלק העליון עולה — ולכן הפער בין ברוטו לנטו גדל.
          על משכורת של {formatNis(page.amount)} שיעור המס האפקטיבי הוא {rate}%, כלומר
          {formatNis(page.amount - neto)} נגזבים במסים והפרשות סוציאליות.
        </p>
        <h2 className="text-xl font-bold text-foreground">טיפים להגדלת הנטו</h2>
        <ul className="list-disc mr-6 space-y-2">
          <li>בדוק אם מגיעות לך נקודות זיכוי נוספות (ילדים, לימודים, עולה חדש)</li>
          <li>הפרשות לפנסיה וקרן השתלמות מפחיתות את הבסיס החייב במס</li>
          <li>בקש החזר מס מרשות המסים — ייתכן שמגיע לך כסף חזרה</li>
          <li>השווה בין הצעות עבודה לפי נטו, לא ברוטו</li>
        </ul>
      </div>
    </div>
  )
}
