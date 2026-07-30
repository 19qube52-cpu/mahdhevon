import { useMemo } from "react"
import { useAuth } from "@/lib/auth"

// Admin emails: comma-separated in VITE_ADMIN_EMAILS env var, or the default owner email.
const ADMIN_EMAILS: string[] = (() => {
  const env = import.meta.env.VITE_ADMIN_EMAILS as string | undefined
  const list = env ? env.split(",").map((e) => e.trim().toLowerCase()) : []
  if (!list.includes("jelyashar@gmail.com")) {
    list.push("jelyashar@gmail.com")
  }
  return list
})()

export function useIsAdmin(): boolean {
  const { user } = useAuth()
  return useMemo(
    () => !!user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase()),
    [user],
  )
}
