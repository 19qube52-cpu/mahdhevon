import { useMemo } from "react"
import { useAuth } from "@/lib/auth"

// UI hint only. Edge Functions enforce ADMIN_EMAILS server-side.
const ADMIN_EMAILS: string[] = (() => {
  const env = import.meta.env.VITE_ADMIN_EMAILS as string | undefined
  const list = env ? env.split(",").map((e) => e.trim().toLowerCase()) : []
  return list
})()

export function useIsAdmin(): boolean {
  const { user } = useAuth()
  return useMemo(
    () => !!user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase()),
    [user],
  )
}
