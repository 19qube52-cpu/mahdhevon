import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react"
import type { Session, User } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"
import AuthDialog from "@/components/auth/AuthDialog"

interface AuthResult {
  error: string | null
}

interface AuthContextValue {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<AuthResult>
  signUp: (email: string, password: string) => Promise<AuthResult>
  signOut: () => Promise<void>
  openAuthDialog: (onSuccess?: () => void) => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function humanizeError(message: string): string {
  const m = message.toLowerCase()
  if (m.includes("invalid login")) return "אימייל או סיסמה שגויים"
  if (m.includes("already registered") || m.includes("already been registered")) return "כתובת האימייל כבר רשומה"
  if (m.includes("password should be")) return "הסיסמה חייבת להכיל לפחות 6 תווים"
  if (m.includes("unable to validate email") || m.includes("invalid email")) return "כתובת אימייל לא תקינה"
  if (m.includes("network")) return "בעיית תקשורת, נסה שוב"
  return message
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const successCb = useRef<(() => void) | undefined>(undefined)

  const openAuthDialog = (onSuccess?: () => void) => {
    successCb.current = onSuccess
    setDialogOpen(true)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setUser(data.session?.user ?? null)
      setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      setUser(newSession?.user ?? null)
    })

    return () => sub.subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string): Promise<AuthResult> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error ? humanizeError(error.message) : null }
  }

  const signUp = async (email: string, password: string): Promise<AuthResult> => {
    const { error } = await supabase.auth.signUp({ email, password })
    return { error: error ? humanizeError(error.message) : null }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut, openAuthDialog }}>
      {children}
      <AuthDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={() => { successCb.current?.(); successCb.current = undefined }}
      />
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
