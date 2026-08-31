import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react"
import type { Session, User } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"
import AuthDialog from "@/components/auth/AuthDialog"
import { notifyTelegram } from "@/lib/notify"

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
  if (m.includes("password should be")) return "הסיסמה חייבת להכיל לפחות 6 תווים"
  if (m.includes("unable to validate email") || m.includes("invalid email")) return "כתובת אימייל לא תקינה"
  if (m.includes("network")) return "בעיית תקשורת, נסה שוב"
  // Never surface the provider's raw error text to the user.
  return "אירעה שגיאה. אנא נסה שוב."
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

    const { data: sub } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession)
      setUser(newSession?.user ?? null)
      ;(async () => {
        if (event === "SIGNED_IN" && newSession?.user) {
          notifyTelegram({
            event: "signin",
            title: "התחברות משתמש",
            details: { user: newSession.user.email ?? "—" },
          })
        } else if (event === "SIGNED_OUT") {
          notifyTelegram({ event: "signout", title: "התנתקות משתמש" })
        } else if (event === "USER_UPDATED" && newSession?.user) {
          notifyTelegram({
            event: "signup",
            title: "הרשמה חדשה!",
            details: { user: newSession.user.email ?? "—" },
          })
        }
      })()
    })

    return () => sub.subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string): Promise<AuthResult> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error ? humanizeError(error.message) : null }
  }

  const signUp = async (email: string, password: string): Promise<AuthResult> => {
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) {
      const m = error.message.toLowerCase()
      // Do not reveal whether an address already has an account.
      if (m.includes("already registered") || m.includes("already been registered") || m.includes("user already")) {
        return { error: "לא ניתן להשלים את ההרשמה. אם כבר יש לך חשבון, התחבר עם הסיסמה שלך או אפס אותה." }
      }
      return { error: humanizeError(error.message) }
    }
    return { error: null }
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
