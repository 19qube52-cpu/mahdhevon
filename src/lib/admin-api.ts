import { supabase } from "@/lib/supabase"

export async function adminFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  const token = data.session?.access_token
  if (!token) throw new Error("יש להתחבר מחדש כדי לבצע פעולת ניהול")
  const headers = new Headers(init.headers)
  headers.set("Authorization", `Bearer ${token}`)
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json")
  return fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${path}`, { ...init, headers })
}
