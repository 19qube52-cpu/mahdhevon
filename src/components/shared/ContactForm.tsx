import { useState } from "react"
import { Send, Loader2, CheckCircle2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/auth"
import { notifyTelegram } from "@/lib/notify"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

export default function ContactForm() {
  const { user } = useAuth()
  const [name, setName] = useState("")
  const [email, setEmail] = useState(user?.email ?? "")
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      setError("נא למלא את כל השדות")
      return
    }
    setSubmitting(true)
    setError(null)
    const { error: insertError } = await supabase.from("contact_submissions").insert({
      name: name.trim(),
      email: email.trim(),
      subject: subject.trim(),
      message: message.trim(),
      user_id: user?.id ?? null,
    })
    setSubmitting(false)
    if (insertError) {
      setError("שליחת ההודעה נכשלה. נסה שוב מאוחר יותר.")
      return
    }
    setSuccess(true)
    setName("")
    setSubject("")
    setMessage("")
    notifyTelegram({
      event: "contact",
      title: "פנייה חדשה מהאתר!",
      details: { name: name.trim(), email: email.trim(), subject: subject.trim() },
    })
  }

  if (success) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center max-w-xl mx-auto">
        <div className="w-14 h-14 rounded-2xl bg-success/10 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-7 h-7 text-success" />
        </div>
        <h3 className="text-lg font-extrabold text-foreground mb-2">ההודעה נשלחה!</h3>
        <p className="text-sm text-muted-foreground mb-5">תודה על פנייתך. נחזור אליך בהקדם האפשרי.</p>
        <Button variant="outline" onClick={() => setSuccess(false)}>שלח הודעה נוספת</Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-6 sm:p-8 max-w-xl mx-auto space-y-5">
      <div className="space-y-2">
        <Label htmlFor="contact-name">שם מלא</Label>
        <Input id="contact-name" value={name} onChange={e => setName(e.target.value)} placeholder="ישראל ישראלי" disabled={submitting} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contact-email">אימייל</Label>
        <Input id="contact-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="israel@example.com" disabled={submitting} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contact-subject">נושא</Label>
        <Input id="contact-subject" value={subject} onChange={e => setSubject(e.target.value)} placeholder="נושא הפנייה" disabled={submitting} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contact-message">הודעה</Label>
        <Textarea id="contact-message" value={message} onChange={e => setMessage(e.target.value)} placeholder="כתוב את ההודעה כאן..." rows={5} disabled={submitting} />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={submitting} className="w-full" size="lg">
        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        {submitting ? "שולח..." : "שלח הודעה"}
      </Button>
    </form>
  )
}
