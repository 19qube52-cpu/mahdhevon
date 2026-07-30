import { useCallback, useEffect, useState } from "react"
import { supabase, type SavedItem, type SavedKind } from "@/lib/supabase"
import { useAuth } from "@/lib/auth"

interface SaveInput {
  calculator_slug: string
  calculator_title: string
  kind: SavedKind
  inputs?: Record<string, string | number> | null
  summary?: string | null
  ai_text?: string | null
  provider?: string | null
}

export function useSavedItems() {
  const { user } = useAuth()
  const [items, setItems] = useState<SavedItem[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!user) {
      setItems([])
      setLoading(false)
      return
    }
    setLoading(true)
    const { data, error } = await supabase
      .from("saved_items")
      .select("*")
      .order("created_at", { ascending: false })
    if (!error && data) setItems(data as SavedItem[])
    setLoading(false)
  }, [user])

  useEffect(() => { load() }, [load])

  const saveItem = useCallback(async (input: SaveInput) => {
    const { data, error } = await supabase
      .from("saved_items")
      .insert({
        calculator_slug: input.calculator_slug,
        calculator_title: input.calculator_title,
        kind: input.kind,
        inputs: input.inputs ?? null,
        summary: input.summary ?? null,
        ai_text: input.ai_text ?? null,
        provider: input.provider ?? null,
      })
      .select()
      .maybeSingle()
    if (error || !data) return { error: error?.message ?? "שמירה נכשלה" }
    setItems((prev) => [data as SavedItem, ...prev])
    return { error: null }
  }, [])

  const removeItem = useCallback(async (id: string) => {
    const { error } = await supabase.from("saved_items").delete().eq("id", id)
    if (error) return { error: error.message }
    setItems((prev) => prev.filter((i) => i.id !== id))
    return { error: null }
  }, [])

  return { items, loading, saveItem, removeItem, reload: load }
}
