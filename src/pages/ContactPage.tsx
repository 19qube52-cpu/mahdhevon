import { Mail, Phone, MessageSquare } from "lucide-react"
import { usePageMeta } from "@/lib/seo"
import ContactForm from "@/components/shared/ContactForm"

export default function ContactPage() {
  usePageMeta({
    title: "צור קשר | חשב לי",
    description: "צור קשר עם צוות חשב לי לכל שאלה, הצעה או פנייה.",
    robots: "noindex, nofollow",
  })

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      <div className="text-center space-y-3">
        <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto border border-primary/20">
          <Mail className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-extrabold text-foreground">צור קשר</h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          יש לך שאלה, הצעה למחשבון חדש או פנייה אחרת? מלא את הטופס ונחזור אליך בהקדם.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 max-w-xl mx-auto">
        <a href="tel:+972584423342" className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 hover:border-primary/40 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Phone className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground">טלפון</div>
            <div className="text-xs text-muted-foreground">058-4423342</div>
          </div>
        </a>
        <a href="mailto:Jelyashar@gmail.com" className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 hover:border-primary/40 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <MessageSquare className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground">אימייל</div>
            <div className="text-xs text-muted-foreground">Jelyashar@gmail.com</div>
          </div>
        </a>
      </div>

      <ContactForm />
    </div>
  )
}
