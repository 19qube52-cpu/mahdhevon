import { Link, useLocation } from "react-router-dom"
import { Calculator, Menu, X, Search, Moon, Sun, Share2, Check, LayoutDashboard, Sparkles } from "lucide-react"
import { useState } from "react"
import { useTheme } from "@/components/theme-provider"
import { categories } from "@/data/categories"
import { cn } from "@/lib/utils"
import CommandPalette, { useCommandPalette } from "@/components/shared/CommandPalette"
import AccountMenu from "@/components/layout/AccountMenu"
import CountrySelector from "@/components/layout/CountrySelector"
import { useIsAdmin } from "@/hooks/use-is-admin"

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const location = useLocation()
  const { theme, setTheme } = useTheme()
  const { open: cmdOpen, setOpen: setCmdOpen } = useCommandPalette()
  const isAdmin = useIsAdmin()

  const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const isCalcPage = location.pathname.startsWith("/calculators/")

  return (
    <>
    <header className="bg-card border-b border-border sticky top-0 z-50 shadow-sm no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Calculator className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl text-foreground hidden sm:block">הישב</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1" aria-label="ניווט קטגוריות">
            {categories.filter(c => c.popular).slice(0, 5).map((cat) => (
              <Link
                key={cat.slug}
                to={`/categories/${cat.slug}`}
                className={cn(
                  "px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  location.pathname === `/categories/${cat.slug}`
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {cat.shortName}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1">
          {/* CRM link — admin only */}
            {isAdmin && (
            <Link
              to="/backstage"
              className="hidden lg:flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <LayoutDashboard className="w-4 h-4" />
              ניהול
            </Link>
            )}

          {/* Fun calculators CTA */}
            <Link
              to="/fun"
              className="hidden lg:flex items-center gap-1.5 px-3 py-2 text-sm font-bold rounded-md bg-chart-4/15 text-chart-4 hover:bg-chart-4/25 transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              מחשבונים מגניבים
            </Link>

            {/* Search - opens command palette */}
            <CountrySelector />
            <button
              onClick={() => setCmdOpen(true)}
              className="flex items-center gap-2 px-2.5 py-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="חיפוש מהיר"
              title="חיפוש מהיר (Ctrl+K)"
            >
              <Search className="w-5 h-5" />
              <kbd className="hidden xl:inline-flex items-center gap-0.5 text-[10px] font-mono border border-border rounded px-1.5 py-0.5 text-muted-foreground">
                <span>Ctrl</span>K
              </kbd>
            </button>

            {/* Account */}
            <AccountMenu />

            {/* Share URL (only on calculator pages) */}
            {isCalcPage && (
              <button
                onClick={handleCopyLink}
                className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                aria-label="שתף קישור"
                title="העתק קישור עם הערכים"
              >
                {copied ? <Check className="w-4 h-4 text-success" /> : <Share2 className="w-4 h-4" />}
              </button>
            )}

            {/* Dark mode toggle */}
            <button
              onClick={() => setTheme(isDark ? "light" : "dark")}
              className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label={isDark ? "מצב יום" : "מצב לילה"}
              title={isDark ? "מצב יום" : "מצב לילה"}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="lg:hidden p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
              aria-label="תפריט"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {menuOpen && (
          <nav className="lg:hidden border-t border-border py-3" aria-label="תפריט נייד">
            <div className="grid grid-cols-1 gap-1.5 mb-3">
              <Link
                to="/fun"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-3 rounded-lg text-sm font-bold bg-chart-4/15 text-chart-4"
              >
                <Sparkles className="w-4 h-4" />
                מחשבונים מגניבים — עם אנימציות
              </Link>
              {isAdmin && (
              <Link
                to="/backstage"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <LayoutDashboard className="w-4 h-4" />
                ניהול מערכת
              </Link>
              )}
            </div>
            <div className="grid grid-cols-2 gap-1 border-t border-border pt-3">
              {categories.map((cat) => (
                <Link
                  key={cat.slug}
                  to={`/categories/${cat.slug}`}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  {cat.shortName}
                </Link>
              ))}
            </div>
          </nav>
        )}
      </div>

      {/* Backdrop */}
      {menuOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
      )}
    </header>
    <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} />
    </>
  )
}
