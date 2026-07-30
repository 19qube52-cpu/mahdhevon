import { useCallback, useEffect, useState } from "react"
import { supabase, type Favorite } from "@/lib/supabase"
import { useAuth } from "@/lib/auth"

export function useFavorites() {
  const { user } = useAuth()
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!user) {
      setFavorites([])
      setLoading(false)
      return
    }
    setLoading(true)
    const { data, error } = await supabase
      .from("favorites")
      .select("*")
      .order("created_at", { ascending: false })
    if (!error && data) setFavorites(data as Favorite[])
    setLoading(false)
  }, [user])

  useEffect(() => { load() }, [load])

  const isFavorite = useCallback(
    (slug: string) => favorites.some((f) => f.calculator_slug === slug),
    [favorites],
  )

  const addFavorite = useCallback(
    async (calculator_slug: string, calculator_title: string, category_slug: string | null) => {
      const { data, error } = await supabase
        .from("favorites")
        .insert({ calculator_slug, calculator_title, category_slug })
        .select()
        .maybeSingle()
      if (error || !data) return { error: error?.message ?? "שמירה נכשלה" }
      setFavorites((prev) => [data as Favorite, ...prev])
      return { error: null }
    },
    [],
  )

  const removeFavorite = useCallback(
    async (calculator_slug: string) => {
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("calculator_slug", calculator_slug)
      if (error) return { error: error.message }
      setFavorites((prev) => prev.filter((f) => f.calculator_slug !== calculator_slug))
      return { error: null }
    },
    [],
  )

  return { favorites, loading, isFavorite, addFavorite, removeFavorite, reload: load }
}
