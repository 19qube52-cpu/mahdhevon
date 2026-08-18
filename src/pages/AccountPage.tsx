import { Link, useNavigate } from "react-router-dom"
import {
  Heart, Bookmark, Clock, LogIn, Trash2, Calculator as CalcIcon,
  User, TrendingUp, Loader2,
} from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/lib/auth"
import { useFavorites } from "@/hooks/use-favorites"
import { useSavedItems } from "@/hooks/use-saved-items"
import { useRecentlyViewed } from "@/hooks/use-recently-viewed"
import { useCountUp } from "@/hooks/use-count-up"
import { usePageMeta } from "@/lib/seo"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

// ── stat card ─────────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, color }: {
  icon: React.ReactNode; label: string; value: number; color: string
}) {
  const anim = useCountUp(value, 600)
  return (
    <div className={`rounded-2xl border p-4 flex items-center gap-4 ${color}`}>
      <div className="w-10 h-10 rounded-xl bg-background/60 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <div className="text-2xl font-black tabular-nums leading-none">{Math.round(anim)}</div>
        <div className="text-xs font-medium mt-0.5 opacity-80">{label}</div>
      </div>
    </div>
  )
}

// ── empty state ───────────────────────────────────────────────────────────────

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
      {text}
    </div>
  )
}

// ── main page ─────────────────────────────────────────────────────────────────

export default function AccountPage() {
  usePageMeta({
    title: "הדשבורד שלי | הישב",
    description: "כל המחשבונים והתוצאות שלך במקום אחד.",
    robots: "noindex, nofollow",
  })

  const { user, loading: authLoading, openAuthDialog, signOut } = useAuth()
  const navigate = useNavigate()
  const { favorites, removeFavorite } = useFavorites()
  const { items, removeItem } = useSavedItems()
  const { recent, clear } = useRecentlyViewed()

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-bl from-primary/20 to-primary/5 flex items-center justify-center mx-auto mb-6 border border-primary/20">
          <User className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-3xl font-extrabold text-foreground mb-2">הדשבורד שלי</h1>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          התחבר כדי לגשת לכל המחשבונים, המועדפים והתוצאות השמורות שלך.
        </p>
        <Button
          onClick={() => openAuthDialog(() => toast.success("ברוך הבא!"))}
          size="lg"
          className="w-full"
        >
          <LogIn className="w-4 h-4" />
          התחברות / הרשמה
        </Button>
      </div>
    )
  }

  const savedResults = items.filter((i) => i.kind === "result")
  const totalItems = favorites.length + savedResults.length

  const initials = user.email?.slice(0, 2).toUpperCase() ?? "ME"

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">

      {/* ── Profile header ── */}
      <section className="rounded-3xl bg-gradient-to-bl from-primary/15 via-card to-card border border-border overflow-hidden">
        <div className="p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground text-xl font-black shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground font-medium mb-0.5">מחובר כ</p>
            <h1 className="text-xl font-extrabold text-foreground truncate">{user.email}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              חבר מ-{new Date(user.created_at ?? Date.now()).toLocaleDateString("he-IL", { year: "numeric", month: "long" })}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={async () => { try { await signOut() } catch { /* ignore */ } navigate("/") }}>
              התנתק
            </Button>
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 px-6 sm:px-8 pb-6 sm:pb-8">
          <StatCard
            icon={<Heart className="w-5 h-5 text-destructive" />}
            label="מועדפים"
            value={favorites.length}
            color="border-destructive/20 bg-destructive/5 text-destructive"
          />
          <StatCard
            icon={<Bookmark className="w-5 h-5 text-primary" />}
            label="תוצאות שמורות"
            value={savedResults.length}
            color="border-primary/20 bg-primary/5 text-primary"
          />
          <StatCard
            icon={<TrendingUp className="w-5 h-5 text-chart-4" />}
            label={'סה"כ פעולות'}
            value={totalItems}
            color="border-chart-4/20 bg-chart-4/10 text-chart-4"
          />
        </div>
      </section>

      {/* ── Tabs ── */}
      <Tabs defaultValue="favorites" className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto flex-nowrap gap-0 h-auto p-1 bg-muted rounded-2xl">
          {[
            { value: "favorites", label: "מועדפים", count: favorites.length },
            { value: "results", label: "תוצאות", count: savedResults.length },
            { value: "history", label: "היסטוריה", count: recent.length },
          ].map((t) => (
            <TabsTrigger
              key={t.value}
              value={t.value}
              className="rounded-xl px-3 py-2 text-sm font-medium whitespace-nowrap data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              {t.label}
              {t.count !== null && t.count > 0 && (
                <span className="mr-1.5 text-xs bg-primary/15 text-primary rounded-full px-1.5 py-0.5 font-bold">
                  {t.count}
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ── Favorites ── */}
        <TabsContent value="favorites" className="mt-6">
          {favorites.length === 0 ? (
            <Empty text="עדיין לא שמרת מחשבונים מועדפים. לחץ על סמל הלב בכל מחשבון כדי להוסיף." />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {favorites.map((f) => (
                <div
                  key={f.id}
                  className="group flex items-center justify-between gap-2 bg-card border border-border rounded-2xl p-4 hover:border-primary/40 transition-colors"
                >
                  <Link to={`/calculators/${f.calculator_slug}`} className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <CalcIcon className="w-4 h-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{f.calculator_title}</p>
                      {f.category_slug && (
                        <p className="text-xs text-muted-foreground mt-0.5">{f.category_slug}</p>
                      )}
                    </div>
                  </Link>
                  <button
                    onClick={async () => { await removeFavorite(f.calculator_slug); toast.success("הוסר מהמועדפים") }}
                    className="text-muted-foreground hover:text-destructive transition-colors shrink-0 p-1"
                    aria-label="הסר"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Saved Results ── */}
        <TabsContent value="results" className="mt-6">
          {savedResults.length === 0 ? (
            <Empty text="שמור תוצאת חישוב כדי להשוות בין תרחישים בעתיד." />
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {savedResults.map((i) => (
                <article key={i.id} className="bg-card border border-border rounded-2xl p-4">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <Link to={`/calculators/${i.calculator_slug}`} className="flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
                      <Bookmark className="w-3.5 h-3.5" />
                      {i.calculator_title}
                    </Link>
                    <button onClick={async () => { await removeItem(i.id); toast.success("נמחק") }} className="text-muted-foreground hover:text-destructive transition-colors" aria-label="מחק">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {i.summary && <p className="text-sm text-foreground/90 leading-relaxed">{i.summary}</p>}
                </article>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── History ── */}
        <TabsContent value="history" className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">{recent.length} מחשבונים נצפו לאחרונה</p>
            {recent.length > 0 && (
              <button onClick={clear} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                נקה הכל
              </button>
            )}
          </div>
          {recent.length === 0 ? (
            <Empty text="מחשבונים שתצפה בהם יופיעו כאן." />
          ) : (
            <div className="flex flex-wrap gap-2">
              {recent.map((r) => (
                <Link
                  key={r.slug}
                  to={`/calculators/${r.slug}`}
                  className="inline-flex items-center gap-1.5 text-sm bg-muted hover:bg-muted/70 text-foreground rounded-full px-4 py-2 transition-colors"
                >
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  {r.title}
                </Link>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
