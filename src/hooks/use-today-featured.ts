import { useEffect, useState } from "react"
import { supabase, type DailyFeatured } from "@/lib/supabase"

export function useTodayFeatured() {
  const [featured, setFeatured] = useState<DailyFeatured | null>(null)

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0]
    supabase
      .from("daily_featured")
      .select("*")
      .eq("date", today)
      .maybeSingle()
      .then(({ data }) => setFeatured(data))
  }, [])

  return featured
}
