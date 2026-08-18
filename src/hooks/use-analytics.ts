import { useEffect, useRef } from "react"
import { useLocation } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/auth"
import { useCountry } from "@/lib/country-context"
import { notifyTelegram } from "@/lib/notify"

function getSessionId(): string {
  const key = "analytics_session_id"
  let id = sessionStorage.getItem(key)
  if (!id) {
    id = crypto.randomUUID()
    sessionStorage.setItem(key, id)
  }
  return id
}

export function useAnalytics() {
  const location = useLocation()
  const { user } = useAuth()
  const { country } = useCountry()
  const lastPath = useRef("")

  useEffect(() => {
    if (lastPath.current === location.pathname) return
    lastPath.current = location.pathname

    supabase.from("page_analytics").insert({
      event_type: "page_view",
      page_path: location.pathname,
      user_id: user?.id ?? null,
      session_id: getSessionId(),
      country_code: country?.code ?? null,
      referrer: document.referrer || null,
    }).then(({ error }) => {
      if (error) console.warn("analytics insert failed:", error.message)
    })

    notifyTelegram({
      event: "page_view",
      title: "צפייה בדף",
      details: {
        page: location.pathname,
        country: country?.code ?? "IL",
        referrer: document.referrer || "—",
        user: user?.email ?? "אורח",
      },
    })
  }, [location.pathname, user, country])
}

export function trackCalculatorUse(slug: string, userId?: string) {
  supabase.from("page_analytics").insert({
    event_type: "calculator_use",
    page_path: `/calculators/${slug}`,
    calculator_slug: slug,
    user_id: userId ?? null,
    session_id: getSessionId(),
  }).then(({ error }) => {
    if (error) console.warn("analytics insert failed:", error.message)
  })

  notifyTelegram({
    event: "calculator_use",
    title: "שימוש במחשבון",
    details: {
      calculator: slug,
    },
  })
}
