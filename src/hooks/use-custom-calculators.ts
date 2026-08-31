import { useCallback, useEffect, useState } from "react"
import { supabase, type CustomCalculator } from "@/lib/supabase"
import type { Calculator } from "@/data/calculators"

export function useCustomCalculators() {
  const [customCalcs, setCustomCalcs] = useState<CustomCalculator[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("custom_calculators")
      .select("*")
      .order("created_at", { ascending: false })
    if (!error && data) setCustomCalcs(data as CustomCalculator[])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const saveCalculator = useCallback(async (calc: Partial<CustomCalculator> & { slug: string; title: string }) => {
    const { data, error } = await supabase
      .from("custom_calculators")
      .upsert({
        slug: calc.slug,
        title: calc.title,
        short_title: calc.short_title ?? calc.title,
        category_slug: calc.category_slug ?? "general-tools",
        description: calc.description ?? "",
        seo_title: calc.seo_title ?? null,
        seo_description: calc.seo_description ?? null,
        keywords: calc.keywords ?? [],
        inputs: calc.inputs ?? [],
        formula_code: calc.formula_code ?? "return {}",
        result_labels: calc.result_labels ?? {},
        quick_answer: calc.quick_answer ?? null,
        formula_explanation: calc.formula_explanation ?? null,
        example_text: calc.example_text ?? null,
        faqs: calc.faqs ?? [],
        related_slugs: calc.related_slugs ?? [],
        disclaimer: calc.disclaimer ?? null,
        source_note: calc.source_note ?? null,
        seo_content: calc.seo_content ?? null,
        image_url: calc.image_url ?? null,
        is_active: calc.is_active ?? true,
      })
      .select()
      .maybeSingle()
    if (error) return { error: error.message }
    if (data) {
      setCustomCalcs(prev => {
        const idx = prev.findIndex(c => c.id === (data as CustomCalculator).id)
        if (idx >= 0) {
          const next = [...prev]
          next[idx] = data as CustomCalculator
          return next
        }
        return [data as CustomCalculator, ...prev]
      })
    }
    return { error: null }
  }, [])

  const deleteCalculator = useCallback(async (id: string) => {
    const { error } = await supabase.from("custom_calculators").delete().eq("id", id)
    if (error) return { error: error.message }
    setCustomCalcs(prev => prev.filter(c => c.id !== id))
    return { error: null }
  }, [])

  const toCalculatorType = useCallback((cc: CustomCalculator): Calculator => ({
    id: `custom-${cc.slug}`,
    slug: cc.slug,
    title: cc.title,
    shortTitle: cc.short_title,
    categorySlug: cc.category_slug,
    description: cc.description,
    seoTitle: cc.seo_title ?? cc.title,
    seoDescription: cc.seo_description ?? cc.description,
    keywords: cc.keywords ?? [],
    inputs: (cc.inputs ?? []).map(i => ({
      ...i,
      type: (i.type === "select" || i.type === "date" ? i.type : "number") as "number" | "select" | "date",
    })),
    quickAnswer: cc.quick_answer ?? { question: "", answer: "" },
    formulaExplanation: cc.formula_explanation ?? "",
    exampleText: cc.example_text ?? "",
    faqs: cc.faqs ?? [],
    relatedCalculatorSlugs: cc.related_slugs ?? [],
    lastUpdated: cc.updated_at.split("T")[0],
    disclaimer: cc.disclaimer ?? "",
    sourceNote: cc.source_note ?? "",
    seoContent: cc.seo_content ?? "",
    imageUrl: cc.image_url ?? undefined,
  }), [])

  return { customCalcs, loading, saveCalculator, deleteCalculator, toCalculatorType, reload: load }
}
