import { useState } from "react"
import { ChevronDown } from "lucide-react"
import type { FAQ } from "@/data/calculators"
import { cn } from "@/lib/utils"

interface FAQSectionProps {
  faqs: FAQ[]
}

export default function FAQSection({ faqs }: FAQSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section aria-label="שאלות נפוצות">
      <h2 className="text-xl font-bold text-foreground mb-4">שאלות נפוצות</h2>
      <dl className="space-y-2">
        {faqs.map((faq, i) => (
          <div key={i} className="border border-border rounded-xl overflow-hidden">
            <dt>
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-right bg-card hover:bg-muted/50 transition-colors"
                aria-expanded={openIndex === i}
              >
                <span className="font-medium text-foreground text-sm">{faq.question}</span>
                <ChevronDown
                  className={cn(
                    "w-4 h-4 text-muted-foreground shrink-0 transition-transform",
                    openIndex === i && "rotate-180"
                  )}
                />
              </button>
            </dt>
            {openIndex === i && (
              <dd className="px-5 py-4 bg-muted/30 border-t border-border">
                <p className="text-sm text-muted-foreground leading-relaxed">{faq.answer}</p>
              </dd>
            )}
          </div>
        ))}
      </dl>
    </section>
  )
}
