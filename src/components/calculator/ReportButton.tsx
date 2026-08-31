import { useState } from "react"
import { Flag, Loader2, CheckCircle2, X } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { notifyTelegram } from "@/lib/notify"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

interface ReportButtonProps {
  calculatorSlug: string
  calculatorTitle: string
}

export default function ReportButton({ calculatorSlug, calculatorTitle }: ReportButtonProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [issue, setIssue] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!issue.trim()) { setError("נא לתאר את הבעיה"); return }
    if (!email.trim()) { setError("נא להזין אימייל"); return }

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    if (!emailOk) { setError("אימייל לא תקין"); return }

    setSubmitting(true)
    setError(null)

    const { error: insertError } = await supabase.from("contact_submissions").insert({
      name: name.trim() || "אנונימי",
      email: email.trim(),
      subject: `דיווח על מחשבון: ${calculatorTitle}`,
      message: issue.trim(),
      user_id: null,
    })

    if (insertError) {
      setError("שליחת הדיווח נכשלה. נסה שוב.")
      setSubmitting(false)
      return
    }

    notifyTelegram({
      event: "error",
      title: "דיווח על מחשבון לא תקין",
      details: {
        מחשבון: calculatorTitle,
        slug: calculatorSlug,
        מדווח: name.trim() || "אנונימי",
        אימייל: email.trim(),
        תיאור: issue.trim().slice(0, 200),
      },
    })

    setSuccess(true)
    setSubmitting(false)
    setName("")
    setEmail("")
    setIssue("")
  }

  if (success) {
    return (
      <div className="flex items-center gap-2 text-sm text-success">
        <CheckCircle2 className="w-4 h-4" />
        <span>תודה על הדיווח! נטפל בזה בהקדם.</span>
      </div>
    )
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors no-print"
      >
        <Flag className="w-3.5 h-3.5" />
        דווח על משהו לא תקין
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setOpen(false)}>
          <div className="bg-card rounded-2xl border border-border max-w-md w-full p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-foreground flex items-center gap-2">
                <Flag className="w-4 h-4 text-destructive" />
                דיווח על בעיה
              </h2>
              <button onClick={() => setOpen(false)} className="p-2 rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
            </div>
            <p className="text-sm text-muted-foreground">צפית בבעיה במחשבון <strong className="text-foreground">{calculatorTitle}</strong>? נשמח לדעת כדי שנוכל לתקן.</p>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-2">
                <Label>שם (אופציונלי)</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="השם שלך" disabled={submitting} />
              </div>
              <div className="space-y-2">
                <Label>אימייל</Label>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="israel@example.com" disabled={submitting} />
              </div>
              <div className="space-y-2">
                <Label>תיאור הבעיה</Label>
                <Textarea value={issue} onChange={e => setIssue(e.target.value)} rows={3} placeholder="מה לא עבד כמצופה?" disabled={submitting} />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex gap-2 justify-end">
                <Button variant="outline" type="button" onClick={() => setOpen(false)}>ביטול</Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Flag className="w-4 h-4" />}
                  שלח דיווח
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
