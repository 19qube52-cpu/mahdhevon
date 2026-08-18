import { Link } from "react-router-dom"
import { calculators } from "@/data/calculators"
import { usePageMeta } from "@/lib/seo"
import { useState } from "react"
import { Copy, Check, Code2 } from "lucide-react"
import { toast } from "sonner"

export default function EmbedDirectoryPage() {
  usePageMeta({
    title: "הטמעת מחשבונים — קוד להטמעה באתר | חשב לי",
    description: "הטמינו את המחשבונים של חשב לי באתר שלכם בחינם. קוד iframe מוכן להעתקה, עם קרדיט וקישור.",
    canonical: `${window.location.origin}/embed-directory`,
  })

  const [copiedSlug, setCopiedSlug] = useState<string | null>(null)

  const copyEmbedCode = (slug: string) => {
    const code = `<iframe src="https://chasav.li/embed/${slug}" width="100%" height="600" frameborder="0" title="מחשבון חשב לי" style="border-radius:12px;"></iframe>`
    navigator.clipboard.writeText(code)
    setCopiedSlug(slug)
    toast.success("קוד ההטמעה הועתק!")
    setTimeout(() => setCopiedSlug(null), 2000)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <Code2 className="w-6 h-6 text-primary" />
          <h1 className="text-3xl font-extrabold text-foreground">הטמעת מחשבונים</h1>
        </div>
        <p className="text-lg text-muted-foreground leading-relaxed">
          הטמינו את המחשבונים שלנו באתר שלכם בחינם. כל מחשבון מגיע עם קוד iframe מוכן להעתקה,
          עם קרדיט וקישור לאתר. מתאים לרואי חשבון, יועצי משכנתאות, בלוגים פיננסיים ובעלי אתרים.
        </p>
      </div>

      <div className="space-y-4">
        {calculators.map((calc) => (
          <div
            key={calc.id}
            className="bg-card border border-border rounded-xl p-5 flex items-center justify-between gap-4 flex-wrap"
          >
            <div className="flex-1 min-w-[200px]">
              <h2 className="font-bold text-foreground mb-1">{calc.title}</h2>
              <p className="text-sm text-muted-foreground">{calc.description}</p>
              <Link
                to={`/embed/${calc.slug}`}
                target="_blank"
                className="text-xs text-primary hover:underline mt-2 inline-block"
              >
                תצוגה מקדימה →
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <code className="text-xs bg-muted px-3 py-2 rounded-lg text-muted-foreground max-w-[300px] truncate">
                {`<iframe src="chasav.li/embed/${calc.slug}" ...>`}
              </code>
              <button
                onClick={() => copyEmbedCode(calc.slug)}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground text-sm rounded-lg hover:bg-primary/90 transition-colors whitespace-nowrap"
              >
                {copiedSlug === calc.slug ? (
                  <><Check className="w-4 h-4" /> הועתק</>
                ) : (
                  <><Copy className="w-4 h-4" /> העתק</>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 bg-muted/50 rounded-xl p-6">
        <h2 className="font-bold text-foreground mb-3">תנאי שימוש</h2>
        <ul className="text-sm text-muted-foreground space-y-2 list-disc mr-6">
          <li>ההטמעה בחינם ומותרת לכל אתר, כולל מסחרי</li>
          <li>חובה לשמור את הקרדיט והקישור לאתר חשב לי</li>
          <li>אין לשנות או להסתיר את קוד ההטמעה</li>
          <li>המחשבונים מתעדכנים אוטומטית — אין צורך לעדכן ידנית</li>
        </ul>
      </div>
    </div>
  )
}
