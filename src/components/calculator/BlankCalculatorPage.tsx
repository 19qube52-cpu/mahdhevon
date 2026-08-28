import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Calculator, Loader2, Pencil, Plus } from "lucide-react"
import { supabase, type QueueItem } from "@/lib/supabase"
import Breadcrumbs from "@/components/shared/Breadcrumbs"

interface BlankCalculatorPageProps {
  slug: string
}

export default function BlankCalculatorPage({ slug }: BlankCalculatorPageProps) {
  const [item, setItem] = useState<QueueItem | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    const load = async () => {
      const { data } = await supabase
        .from("calculator_queue")
        .select("*")
        .eq("calculator_slug", slug)
        .order("added_at", { ascending: false })
        .limit(1)
        .maybeSingle()
      if (active) {
        setItem(data as QueueItem | null)
        setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [slug])

  useEffect(() => {
    if (!item) return
    document.title = `${item.calculator_title} | חשב לי`
  }, [item])

  if (loading) {
    return <div className="flex min-h-[45vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  if (!item) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <Calculator className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">מחשבון לא נמצא</h1>
        <p className="text-muted-foreground mb-6">המחשבון שחיפשת אינו קיים.</p>
        <Link to="/" className="inline-flex px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium">חזרה לדף הבית</Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8" dir="rtl">
      <Breadcrumbs items={[{ label: "מחשבונים", href: "/" }, { label: item.calculator_title }]} />
      <div className="mt-6 overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
        <header className="border-b border-border bg-gradient-to-l from-primary/10 via-background to-background px-6 py-8 sm:px-10">
          <div className="mb-3 flex items-center gap-2 text-sm text-primary">
            <Calculator className="h-4 w-4" />
            <span>{item.calculator_category || "מחשבון חדש"}</span>
          </div>
          <h1 className="text-3xl font-extrabold text-foreground sm:text-4xl">{item.calculator_title}</h1>
          <p className="mt-3 text-muted-foreground">עמוד בסיס נוצר אוטומטית. ניתן להוסיף כאן שדות, נוסחה ותוצאות דרך הניהול.</p>
        </header>

        <section className="p-6 sm:p-10">
          <div className="flex min-h-80 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-primary/25 bg-muted/30 px-6 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Plus className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-bold">עמוד מחשבון ריק</h2>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">המחשבון נוצר במסד ומוכן לעריכת המבנה והחישוב.</p>
            {item.notes ? <p className="mt-4 rounded-lg bg-background px-4 py-2 text-sm">{item.notes}</p> : null}
            <Link to="/backstage" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 font-bold text-primary-foreground hover:bg-primary/90">
              <Pencil className="h-4 w-4" />ערוך בניהול
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}
