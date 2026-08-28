import { createClient } from "npm:@supabase/supabase-js@2"

export class AuthError extends Error {
  constructor(message: string, public status = 401) { super(message) }
}

export async function requireAdmin(req: Request): Promise<void> {
  const match = (req.headers.get("Authorization") ?? "").match(/^Bearer\s+(.+)$/i)
  if (!match?.[1]) throw new AuthError("Missing bearer token")
  const token = match[1]
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  if (serviceKey && token === serviceKey) return
  const url = Deno.env.get("SUPABASE_URL")
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")
  if (!url || !anonKey) throw new AuthError("Supabase auth is not configured", 500)
  const auth = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data, error } = await auth.auth.getUser(token)
  if (error || !data.user?.email) throw new AuthError("Invalid or expired session")
  const allowed = (Deno.env.get("ADMIN_EMAILS") ?? "").split(",").map((v) => v.trim().toLowerCase()).filter(Boolean)
  if (!allowed.includes(data.user.email.toLowerCase())) throw new AuthError("Administrator access required", 403)
}

export function authErrorResponse(error: unknown, headers: Record<string, string>): Response | null {
  if (!(error instanceof AuthError)) return null
  return new Response(JSON.stringify({ ok: false, error: error.message }), {
    status: error.status, headers: { ...headers, "Content-Type": "application/json" },
  })
}
