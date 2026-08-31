import { Link } from "react-router-dom"
import { Calculator, Shield, ExternalLink, Cpu, Sparkles, Phone, Mail, Code2 } from "lucide-react"
import { categories } from "@/data/categories"
import { getPopularCalculators } from "@/data/calculators"

export default function Footer() {
  const popular = getPopularCalculators().slice(0, 6)

  return (
    <footer className="bg-foreground text-primary-foreground mt-16" role="contentinfo">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand + featured tools */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Calculator className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-xl">הישב</span>
            </div>
            <p className="text-sm text-primary-foreground/70 leading-relaxed">
              כל המחשבונים והזכויות החשובים לישראלים במקום אחד. שכר, מסים, ביטוח לאומי, משכנתא ועוד.
            </p>

            <div className="flex items-center gap-1.5 text-xs text-primary-foreground/50 pt-1">
              <Shield className="w-3.5 h-3.5" />
              <span>כל החישובים הם הערכה בלבד</span>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h3 className="font-semibold text-sm mb-3 text-primary-foreground/90">קטגוריות</h3>
            <ul className="space-y-2">
              {categories.map((cat) => (
                <li key={cat.slug}>
                  <Link
                    to={`/categories/${cat.slug}`}
                    className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors"
                  >
                    {cat.shortName}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Popular calculators */}
          <div>
            <h3 className="font-semibold text-sm mb-3 text-primary-foreground/90">מחשבונים פופולריים</h3>
            <ul className="space-y-2">
              {popular.map((calc) => (
                <li key={calc.id}>
                  <Link
                    to={`/calculators/${calc.slug}`}
                    className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors"
                  >
                    {calc.shortTitle}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  to="/contact"
                  className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors flex items-center gap-1"
                >
                  <Mail className="w-3.5 h-3.5" />
                  צור קשר
                </Link>
              </li>
              <li>
                <Link
                  to="/embed-directory"
                  className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors flex items-center gap-1"
                >
                  <Code2 className="w-3.5 h-3.5" />
                  הטמן מחשבון באתרך
                </Link>
              </li>
            </ul>
          </div>

          {/* Sources */}
          <div>
            <h3 className="font-semibold text-sm mb-3 text-primary-foreground/90">מקורות מידע רשמיים</h3>
            <ul className="space-y-2">
              {[
                { label: "רשות המסים", href: "https://www.taxes.gov.il" },
                { label: "המוסד לביטוח לאומי", href: "https://www.btl.gov.il" },
                { label: "בנק ישראל", href: "https://www.boi.org.il" },
                { label: "משרד הבריאות", href: "https://www.health.gov.il" },
              ].map(({ label, href }) => (
                <li key={href}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors flex items-center gap-1"
                  >
                    {label}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Business promotion block */}
        <div className="mt-12 rounded-2xl border border-primary-foreground/15 bg-primary-foreground/[0.03] p-6 sm:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="flex items-center gap-1.5 text-primary font-semibold text-xs uppercase tracking-wide mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                Powered by Joseph Elyashar Labs
              </div>
              <p className="text-sm text-primary-foreground/70 leading-relaxed max-w-md">
                האתר פותח ומתוחזק על ידי Elyasharlabs.com — פתרונות טכנולוגיה ובינה מלאכותית מותאמים אישית.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:min-w-[420px]">
              <a
                href="https://elyasharpc.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 rounded-xl border border-primary-foreground/15 bg-primary-foreground/[0.04] p-4 hover:border-primary/50 hover:bg-primary-foreground/[0.07] transition-colors"
              >
                <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                  <Cpu className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="font-semibold text-sm text-primary-foreground flex items-center gap-1">
                    elyasharpc.com <ExternalLink className="w-3 h-3 opacity-60" />
                  </div>
                  <div className="text-xs text-primary-foreground/60 mt-0.5">טכנאי מחשבים</div>
                </div>
              </a>

              <a
                href="https://elyasharlabs.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 rounded-xl border border-primary-foreground/15 bg-primary-foreground/[0.04] p-4 hover:border-primary/50 hover:bg-primary-foreground/[0.07] transition-colors"
              >
                <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="font-semibold text-sm text-primary-foreground flex items-center gap-1">
                    elyasharlabs.com <ExternalLink className="w-3 h-3 opacity-60" />
                  </div>
                  <div className="text-xs text-primary-foreground/60 mt-0.5">פתרונות בינה מלאכותית</div>
                </div>
              </a>
            </div>
          </div>

          <div className="mt-5 pt-5 border-t border-primary-foreground/10 flex flex-col sm:flex-row items-center gap-3 sm:gap-6">
            <a href="tel:+972584423342" className="flex items-center gap-2 text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
              <Phone className="w-4 h-4 text-primary" />
              058-4423342
            </a>
            <a href="mailto:Jelyashar@gmail.com" className="flex items-center gap-2 text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
              <Mail className="w-4 h-4 text-primary" />
              Jelyashar@gmail.com
            </a>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-primary-foreground/20 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-xs text-primary-foreground/50 text-center">
            © {new Date().getFullYear()} הישב · Powered by Joseph Elyashar Labs by Elyasharlabs.com
          </p>
          <p className="text-xs text-primary-foreground/50 text-center max-w-lg">
            האתר מספק מידע כללי ואינו מהווה ייעוץ מקצועי. לכל שאלה משפטית, פיננסית או רפואית יש לפנות לבעל מקצוע מוסמך.
          </p>
        </div>
      </div>
    </footer>
  )
}
