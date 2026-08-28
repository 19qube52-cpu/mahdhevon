import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { Calculator, Loader2, Pencil } from "lucide-react"
import { supabase, type QueueItem } from "@/lib/supabase"
import { evaluateFormula, type DynamicCalculatorDefinition } from "@/lib/dynamic-calculator"
import Breadcrumbs from "@/components/shared/Breadcrumbs"

export default function BlankCalculatorPage({ slug }: { slug: string }) {
  const [item, setItem] = useState<QueueItem | null>(null)
  const [definition, setDefinition] = useState<DynamicCalculatorDefinition | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [values, setValues] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    Promise.all([
      supabase.from("calculator_queue").select("*").eq("calculator_slug", slug).order("added_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("calculator_definitions").select("*").eq("slug", slug).maybeSingle(),
      supabase.from("calculator_media_assets").select("public_url").eq("calculator_slug", slug).eq("approval_status", "approved").order("created_at", { ascending: false }).limit(1).maybeSingle(),
    ]).then(([queueResult, definitionResult, imageResult]) => {
      if (!active) return
      const nextDefinition = definitionResult.data as DynamicCalculatorDefinition | null
      setItem(queueResult.data as QueueItem | null)
      setDefinition(nextDefinition)
      setImageUrl(imageResult.data?.public_url ?? null)
      if (nextDefinition) setValues(Object.fromEntries(nextDefinition.inputs.map(input => [input.id, Number(input.defaultValue ?? input.min ?? 0)])))
      setLoading(false)
    })
    return () => { active = false }
  }, [slug])

  useEffect(() => { if (definition?.title || item?.calculator_title) document.title = `${definition?.title ?? item?.calculator_title} | חשב לי` }, [definition, item])
  const result = useMemo(() => {
    if (!definition) return null
    try { const value = evaluateFormula(definition.formula, values); return Number.isFinite(value) ? value : null } catch { return null }
  }, [definition, values])

  if (loading) return <div className="flex min-h-[45vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  if (!item && !definition) return <div className="mx-auto max-w-2xl px-4 py-20 text-center"><Calculator className="mx-auto mb-4 h-12 w-12 text-muted-foreground" /><h1 className="mb-2 text-2xl font-bold">מחשבון לא נמצא</h1><Link to="/" className="text-primary">חזרה לדף הבית</Link></div>
  const title = definition?.title ?? item?.calculator_title ?? "מחשבון"
  if (!definition) return <div className="mx-auto max-w-3xl px-4 py-16 text-center" dir="rtl"><h1 className="text-3xl font-extrabold">{title}</h1><p className="mt-4 text-muted-foreground">המחשבון קיים בתור אך עדיין אין לו הגדרת חישוב מלאה.</p><Link to="/backstage" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 font-bold text-primary-foreground"><Pencil className="h-4 w-4" />פתח בניהול</Link></div>

  const config = definition.result_config ?? {}
  return <main className="mx-auto max-w-6xl px-4 py-8" dir="rtl">
    <Breadcrumbs items={[{ label: "מחשבונים", href: "/" }, { label: title }]} />
    <section className="mt-6 overflow-hidden rounded-3xl border bg-card shadow-sm">
      <div className="grid lg:grid-cols-2">
        <header className="flex flex-col justify-center bg-gradient-to-bl from-primary/15 via-background to-background p-8 sm:p-12">
          <span className="mb-3 text-sm font-bold text-primary">{definition.category_slug}</span>
          <h1 className="text-3xl font-black sm:text-5xl">{title}</h1>
          <p className="mt-5 text-lg leading-8 text-muted-foreground">{definition.description}</p>
        </header>
        {imageUrl ? <img src={imageUrl} alt={title} className="h-full min-h-72 w-full object-cover" /> : <div className="flex min-h-72 items-center justify-center bg-primary/10"><Calculator className="h-24 w-24 text-primary/30" /></div>}
      </div>
    </section>
    <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_.85fr]">
      <section className="rounded-3xl border bg-card p-6 shadow-sm sm:p-8">
        <h2 className="mb-6 text-2xl font-extrabold">הזנת נתונים</h2>
        <div className="space-y-5">{definition.inputs.map(input => <label key={input.id} className="block"><span className="mb-2 block font-bold">{input.label}</span><div className="relative"><input type={input.type} min={input.min} max={input.max} step={input.step ?? 1} value={values[input.id] ?? ""} onChange={event => setValues(current => ({ ...current, [input.id]: Number(event.target.value) }))} className="w-full rounded-xl border bg-background px-4 py-3 text-lg outline-none focus:ring-2 focus:ring-primary" />{input.unit && input.type === "number" ? <span className="absolute left-4 top-3.5 text-muted-foreground">{input.unit}</span> : null}</div>{input.helpText ? <span className="mt-1 block text-sm text-muted-foreground">{input.helpText}</span> : null}</label>)}</div>
      </section>
      <aside className="rounded-3xl bg-primary p-7 text-primary-foreground shadow-xl sm:p-9"><p className="text-sm font-bold opacity-80">{config.label ?? "התוצאה"}</p><div className="mt-4 break-words text-4xl font-black sm:text-5xl">{result === null ? "—" : `${config.prefix ?? ""}${result.toLocaleString("he-IL", { maximumFractionDigits: Math.min(2, Math.max(0, config.decimals ?? 0)) })}${config.unit ? ` ${config.unit}` : ""}${config.suffix ?? ""}`}</div><p className="mt-6 text-sm leading-6 opacity-80">התוצאה מתעדכנת אוטומטית לפי הנתונים שהזנת.</p></aside>
    </div>
    <section className="mt-8 space-y-6 rounded-3xl border bg-card p-7 sm:p-10"><h2 className="text-2xl font-extrabold">איך החישוב עובד?</h2><p className="leading-8 text-muted-foreground">{definition.content?.explanation}</p>{definition.content?.example ? <div className="rounded-xl bg-muted p-5"><strong>דוגמה:</strong> {definition.content.example}</div> : null}{definition.content?.faqs?.map(faq => <details key={faq.question} className="rounded-xl border p-4"><summary className="cursor-pointer font-bold">{faq.question}</summary><p className="mt-3 leading-7 text-muted-foreground">{faq.answer}</p></details>)}{definition.content?.disclaimer ? <p className="border-t pt-5 text-sm text-muted-foreground">{definition.content.disclaimer}</p> : null}</section>
  </main>
}
