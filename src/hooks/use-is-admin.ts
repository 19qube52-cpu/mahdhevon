import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/auth"

/**
 * UI-only admin check. Reads role from user_roles table via RLS.
 * Server-side enforcement is in edge functions (requireAdmin).
 */
export function useIsAdmin(): boolean {
  const { user } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    if (!user) {
      setIsAdmin(false)
      return
    }
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        setIsAdmin(data?.role === "admin")
      })
  }, [user])

  return isAdmin
}
