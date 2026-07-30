import { useState } from "react"
import { Loader2, LogIn, UserPlus } from "lucide-react"
import { useAuth } from "@/lib/auth"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface AuthDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export default function AuthDialog({ open, onOpenChange, onSuccess }: AuthDialogProps) {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState<"signin" | "signup">("signin")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const reset = () => {
    setError(null)
    setPassword("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!email || !password) {
      setError("נא למלא אימייל וסיסמה")
      return
    }
    if (password.length < 6) {
      setError("הסיסמה חייבת להכיל לפחות 6 תווים")
      return
    }
    setLoading(true)
    const { error } = mode === "signin"
      ? await signIn(email, password)
      : await signUp(email, password)
    setLoading(false)
    if (error) {
      setError(error)
      return
    }
    setEmail("")
    setPassword("")
    onOpenChange(false)
    onSuccess?.()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) reset() }}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader className="text-right">
          <DialogTitle className="flex items-center gap-2">
            {mode === "signin" ? <LogIn className="w-5 h-5 text-primary" /> : <UserPlus className="w-5 h-5 text-primary" />}
            {mode === "signin" ? "התחברות לחשבון" : "יצירת חשבון חדש"}
          </DialogTitle>
          <DialogDescription>
            {mode === "signin"
              ? "התחבר כדי לשמור מחשבונים, תוצאות וניתוחי AI."
              : "הרשמה מהירה — רק אימייל וסיסמה, בלי אישור מייל."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="auth-email">אימייל</Label>
            <Input
              id="auth-email"
              type="email"
              autoComplete="email"
              dir="ltr"
              className="text-right"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="auth-password">סיסמה</Label>
            <Input
              id="auth-password"
              type="password"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              dir="ltr"
              className="text-right"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="לפחות 6 תווים"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{error}</p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {mode === "signin" ? "התחבר" : "צור חשבון"}
          </Button>
        </form>

        <div className="text-center text-sm text-muted-foreground">
          {mode === "signin" ? (
            <>עדיין אין לך חשבון?{" "}
              <button type="button" onClick={() => { setMode("signup"); reset() }} className="text-primary font-semibold hover:underline">
                הרשמה
              </button>
            </>
          ) : (
            <>כבר יש לך חשבון?{" "}
              <button type="button" onClick={() => { setMode("signin"); reset() }} className="text-primary font-semibold hover:underline">
                התחברות
              </button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
