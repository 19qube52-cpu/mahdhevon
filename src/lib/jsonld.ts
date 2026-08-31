import { useEffect } from "react"
import type { Calculator } from "@/data/calculators"

interface BreadcrumbItem {
  name: string
  url: string
}

export function useCalculatorJsonLd(calculator: Calculator, breadcrumbs: BreadcrumbItem[]) {
  useEffect(() => {
    const id = `jsonld-calc-${calculator.id}`
    const existing = document.getElementById(id)
    if (existing) existing.remove()

    const schemas = [
      {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        name: calculator.title,
        description: calculator.description,
        applicationCategory: "FinanceApplication",
        operatingSystem: "All",
        offers: { "@type": "Offer", price: "0", priceCurrency: "ILS" },
        inLanguage: "he",
      },
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: breadcrumbs.map((item, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: item.name,
          item: item.url,
        })),
      },
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: calculator.faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: { "@type": "Answer", text: faq.answer },
        })),
      },
      {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "הישב",
        description: "מחשבוני ישראל – כל המחשבונים החשובים לישראלים",
        url: window.location.origin,
        inLanguage: "he",
      },
    ]

    const script = document.createElement("script")
    script.type = "application/ld+json"
    script.id = id
    script.textContent = JSON.stringify(schemas)
    document.head.appendChild(script)

    return () => {
      const s = document.getElementById(id)
      if (s) s.remove()
    }
  }, [calculator, breadcrumbs])
}
