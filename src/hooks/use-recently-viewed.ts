import { useCallback, useEffect, useState } from "react"

const KEY = "hishov-recent"
const MAX = 8

export interface RecentEntry {
  slug: string
  title: string
  category: string | null
  at: number
}

function read(): RecentEntry[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function useRecentlyViewed() {
  const [recent, setRecent] = useState<RecentEntry[]>([])

  useEffect(() => { setRecent(read()) }, [])

  const track = useCallback((slug: string, title: string, category: string | null) => {
    const next = [{ slug, title, category, at: Date.now() }, ...read().filter((e) => e.slug !== slug)].slice(0, MAX)
    localStorage.setItem(KEY, JSON.stringify(next))
    setRecent(next)
  }, [])

  const clear = useCallback(() => {
    localStorage.removeItem(KEY)
    setRecent([])
  }, [])

  return { recent, track, clear }
}
