# חשב לי — Developer README

> **מדריך מלא למתכנתים שממשיכים לעבוד על המערכת.**  
> נכון לתאריך: 12 באוגוסט 2026  
> דומיין מתוכנן: `chasav.li`

---

## תוכן עניינים

1. [סקירה כללית](#1-סקירה-כללית)
2. [Tech Stack](#2-tech-stack)
3. [מבנה הפרויקט](#3-מבנה-הפרויקט)
4. [מה קיים ועובד עכשיו](#4-מה-קיים-ועובד-עכשיו)
5. [מה נשאר לסיים](#5-מה-נשאר-לסיים)
6. [באגים ידועים](#6-באגים-ידועים)
7. [מודל האבטחה](#7-מודל-האבטחה)
8. [SEO — מצב נוכחי והמלצות](#8-seo--מצב-נוכחי-והמלצות)
9. [חוזקות וחולשות](#9-חוזקות-וחולשות)
10. [איך להוסיף מחשבון חדש](#10-איך-להוסיף-מחשבון-חדש)
11. [בדיקות](#11-בדיקות)
12. [משתני סביבה](#12-משתני-סביבה)
13. [חוות דעת מלאה](#13-חוות-דעת-מלאה)

---

## 1. סקירה כללית

**חשב לי** הוא אתר מחשבונים ישראלי בעברית (RTL) שמטרתו להיות היעד המוביל בגוגל לחיפושי מחשבונים בישראל. האתר מכסה נושאי שכר, מסים, ביטוח לאומי, משכנתא, פנסיה, זכויות עובדים, ועוד — עם דגש על חווית משתמש מעולה, SEO טכני נכון, ותוכן איכותי בעברית.

**החזון:** אתר עם 50+ מחשבונים, פורטל זכויות AI, ניתוח מסמכים ב-AI, CRM ניהולי, ודשבורד אישי למשתמשים — שמייצר טראפיק אורגני גבוה מגוגל.

---

## 2. Tech Stack

| שכבה | טכנולוגיה | גרסה |
|------|----------|------|
| Frontend Framework | React | 19.2 |
| Build Tool | Vite | 7.3 |
| Language | TypeScript | 5.9 |
| Styling | Tailwind CSS v4 (OKLCH) | 4.2 |
| Design System | shadcn/ui (new-york style) | — |
| Icons | lucide-react | 1.6 |
| Routing | react-router-dom | 7.6 |
| Charts | recharts | 3.8 |
| Forms | react-hook-form + zod | 7.72 / 4.3 |
| Backend | Supabase (Postgres + Auth + Edge Functions) | — |
| Toasts | sonner | 2.0 |
| Font | @fontsource/heebo | 5.1 |
| Testing | vitest | 4.1 |

**ערה:** הפרויקט משתמש ב-Tailwind v4 עם OKLCH colors ו-`@theme inline` — לא HSL כמו v3. כל הצבעים מוגדרים ב-`src/index.css`.

---

## 3. מבנה הפרויקט

```
project/
├── src/
│   ├── App.tsx                      # Routing + ThemeProvider + AuthProvider
│   ├── main.tsx                     # Entry point
│   ├── index.css                    # Tailwind v4 + OKLCH theme (light/dark)
│   │
├── src/pages/                       # דפי route
│   ├── HomePage.tsx                 # דף הבית — חיפוש, קטגוריות, מחשבון מומלץ
│   ├── CalculatorPage.tsx           # עמוד מחשבון בודד /calculators/:slug
│   ├── CategoryPage.tsx             # רשימת מחשבונים בקטגוריה /categories/:slug
│   ├── FunCalculatorsPage.tsx       # מחשבונים "כיפיים" (מונה מונית, שכר אמיתי)
│   ├── AccountPage.tsx              # דשבורד אישי (מועדפים, ניתוחים, זכויות, מסמכים)
│   ├── CrmPage.tsx                  # CRM ניהולי /backstage (admin only)
│   ├── RightsAssistantPage.tsx      # פורטל זכויות AI
│   ├── LetterExplainerPage.tsx      # ניתוח מסמכים/מכתבים AI
│   └── NotFoundPage.tsx             # 404
│
├── src/components/
│   ├── layout/                      # Header, Footer, SiteLayout, AccountMenu, RateAlertBanner
│   ├── calculator/                  # CalculatorEngine, LiveCalculatorForm, CalculatorResult,
│   │                                # CalculatorActions, ResultToolbar, AmortizationTable,
│   │                                # FAQSection, SeoTextSection, InternalLinksBlock,
│   │                                # QuickAnswerBlock, DisclaimerBox, RelatedCalculators
│   ├── auth/AuthDialog.tsx          # Modal התחברות/הרשמה
│   ├── crm/                         # AiTab, ProvidersTab, MonitorTab, CrudDialogs
│   ├── fun/                         # RealTakeHomeCalculator, TaxiMeterCalculator, TransitFareCalculator
│   ├── shared/                      # CalculatorCard, CategoryGrid, CommandPalette, PopularCalculators, Breadcrumbs
│   ├── theme-provider.tsx           # ThemeProvider (next-themes pattern, custom impl)
│   ├── mode-toggle.tsx              # כפתור החלפת דארק/לייט
│   └── ui/                          # 56 רכיבי shadcn/ui (button, card, dialog, tabs, וכו')
│
├── src/lib/
│   ├── supabase.ts                  # Supabase client + כל הטיפוסים (QueueItem, Favorite, SavedItem, RightsCase, וכו')
│   ├── auth.tsx                     # AuthProvider + useAuth (email/password, humanizeError)
│   ├── calculators/index.ts         # כל פונקציות החישוב (19 מחשבונים) + runCalculator dispatcher
│   ├── format.ts                    # formatCurrency, formatNumber, formatPercent, formatDate (he-IL)
│   ├── sanitize.ts                  # sanitizeText, sanitizeNumber, isValidEmail, isValidIsraeliPhone, sanitizeUrl
│   ├── seo.ts                       # usePageMeta — title, description, OG, Twitter, canonical, robots
│   ├── jsonld.ts                    # useCalculatorJsonLd — WebApplication + BreadcrumbList + FAQPage + Organization
│   ├── smart-tips.ts                # getSmartTips + getResultSummary — טיפים דינמיים לפי תוצאה
│   └── utils.ts                     # cn (clsx + tailwind-merge)
│
├── src/hooks/
│   ├── use-favorites.ts             # ספריית מועדפים (Supabase)
│   ├── use-saved-items.ts           # תוצאות וניתוחי AI שמורים (Supabase)
│   ├── use-recently-viewed.ts       # היסטוריית צפייה (localStorage)
│   ├── use-is-admin.ts              # בדיקת admin לפי רשימת אימיילים
│   ├── use-count-up.ts              # אנימציית ספירה
│   ├── use-today-featured.ts        # מחשבון יומי מומלץ (Supabase)
│   ├── use-shareable-url.ts         # יצירת URL שיתוף
│   ├── use-voice-input.ts           # קלט קולי (Web Speech API)
│   └── use-mobile.ts                # זיהוי מובייל
│
├── src/data/
│   ├── calculators.ts               # רישום סטטי של 19 מחשבונים (metadata + SEO + FAQs)
│   └── categories.ts                # 8 קטגוריות
│
├── supabase/
│   ├── migrations/                  # 8 migrations (tables, RLS, cron, AI providers)
│   └── functions/                   # 7 Edge Functions
│       ├── ai-crm-assistant/        # AI dispatch ל-CRM
│       ├── crm-operations/          # Queue CRUD
│       ├── explain-letter/          # ניתוח מסמכים (Grok vision)
│       ├── provider-manager/        # ניהול AI providers
│       ├── publish-daily-calculator/# פרסום יומי אוטומטי (cron)
│       ├── rights-assistant/        # פורטל זכויות (Grok vision)
│       └── telegram-alerts/         # התראות Telegram
│
├── public/
│   ├── sitemap.xml                  # 21 URLs (יש לעדכן!)
│   ├── robots.txt                   # Allow all + sitemap reference
│   ├── manifest.webmanifest         # PWA manifest
│   └── favicon.svg
│
├── tests/
│   ├── src/lib/sanitize.test.ts     # 18 בדיקות
│   ├── src/lib/format.test.ts       # 8 בדיקות
│   └── src/lib/calculators/index.test.ts  # 13 בדיקות
│
├── MODULES.md                       # תיעוד מודולים ישן (חלקית מעודכן)
├── components.json                   # shadcn config
├── vite.config.ts                    # Vite + vitest config
└── package.json
```

---

## 4. מה קיים ועובד עכשיו

### מחשבונים (19 פעילים)

| # | slug | שם | קטגוריה | סטטוס |
|---|------|-----|---------|-------|
| 1 | `bruto-neto` | ברוטו לנטו | salary-tax | ✅ עובד + renderer + גרף |
| 2 | `neto-bruto` | נטו לברוטו | salary-tax | ✅ עובד + renderer + גרף |
| 3 | `bmi` | BMI | health-lifestyle | ✅ עובד + renderer |
| 4 | `mortgage-payment` | משכנתא | mortgage-loans | ✅ עובד + renderer + גרף |
| 5 | `loan-payment` | הלוואה | mortgage-loans | ✅ עובד + renderer |
| 6 | `compound-interest` | ריבית דריבית | general-tools | ✅ עובד + renderer + גרף |
| 7 | `vat-calculator` | מע"מ | general-tools | ✅ עובד + renderer |
| 8 | `percentage` | אחוזים | general-tools | ✅ עובד + renderer |
| 9 | `age-calculator` | גיל מדויק | general-tools | ✅ עובד + renderer |
| 10 | `bituach-leumi-employee` | דמי אבטלה | bituach-leumi | ✅ עובד + renderer |
| 11 | `child-allowance` | קצבת ילדים | bituach-leumi | ✅ עובד + renderer |
| 12 | `tax-credit-points` | נקודות זיכוי | salary-tax | ✅ עובד + renderer |
| 13 | `pension-estimate` | פנסיה | pension | ✅ עובד + renderer + גרף |
| 14 | `self-employed-tax` | מס עצמאי | self-employed | ✅ עובד + renderer |
| 15 | `hourly-to-monthly` | שעתי לחודשי | salary-tax | ✅ עובד + renderer |
| 16 | `property-purchase-tax` | מס רכישה | mortgage-loans | ✅ עובד + renderer |
| 17 | `credit-card-payoff` | פירעון כרטיס אשראי | mortgage-loans | ✅ עובד + renderer |
| 18 | `rental-yield` | תשואת שכירות | mortgage-loans | ✅ עובד + renderer |
| 19 | `salary-raise` | עליית שכר | salary-tax | ✅ עובד + renderer |
| 20 | `rent-vs-buy` | שכירות מול קנייה | mortgage-loans | ✅ עובד + renderer |

### דפים ותכונות

| תכונה | סטטוס | הערות |
|-------|-------|-------|
| דף הבית | ✅ | חיפוש, קטגוריות, מחשבון יומי |
| עמוד מחשבון | ✅ | חישוב live, SEO, FAQ, קישורים פנימיים |
| עמוד קטגוריה | ✅ | רשימת מחשבונים |
| מחשבונים כיפיים | ✅ | 3 מחשבונים אנימטיביים |
| דשבורד אישי | ✅ | 6 טאבים: מועדפים, AI, תוצאות, זכויות, מסמכים, היסטוריה |
| CRM /backstage | ✅ | ניהול תור, AI providers, monitor |
| פורטל זכויות AI | ✅ | Grok vision, ניתוח + מכתבים |
| ניתוח מסמכים AI | ✅ | הדבקת טקסט/העלאת תמונה |
| Auth (email/password) | ✅ | Supabase, ללא אישור אימייל |
| Dark/Light mode | ✅ | ThemeProvider + keyboard shortcut 'd' |
| Command Palette (⌘K) | ✅ | חיפוש מהיר |
| קלט קולי | ✅ | Web Speech API |
| PWA manifest | ✅ | |
| בדיקות | ✅ | 39 בדיקות, 3 קבצים |

### Supabase — טבלאות ו-RLS

| טבלה | RLS | מדיניות |
|-------|-----|---------|
| `calculator_queue` | ✅ | admin only |
| `daily_featured` | ✅ | public read |
| `favorites` | ✅ | owner (auth.uid) |
| `saved_items` | ✅ | owner (auth.uid) |
| `rights_cases` | ✅ | owner (auth.uid) |
| `ai_content` | ✅ | admin only |
| `ai_providers` | ✅ | admin only |
| `site_settings` | ✅ | admin only |

### Edge Functions

| slug | JWT | מטרה |
|------|-----|------|
| `rights-assistant` | anon | ניתוח זכויות + יצירת מכתבים (Grok) |
| `explain-letter` | anon | הסבר מסמכים בעברית פשוטה (Grok) |
| `ai-crm-assistant` | anon | dispatch AI ל-CRM |
| `crm-operations` | anon | queue CRUD |
| `provider-manager` | anon | provider config |
| `publish-daily-calculator` | service | cron יומי |
| `telegram-alerts` | service | התראות |

---

## 5. מה נשאר לסיים

### קריטי — באגים שחייבים לתקן

| # | בעיה | קובץ | פתרון |
|---|------|------|-------|
| 1 | **לוגאאוט לא עובד** — `signOut()` לא ממתין לפני `navigate("/")` | `src/pages/AccountPage.tsx` שורה 229 | שנה ל-`onClick={async () => { try { await signOut() } catch {} navigate("/") }}` |
| 2 | **מצב light לא קריא** — חלק מהרכיבים משתמשים בצבעים קבועים (לא token) | `src/index.css` + רכיבים שונים | עבור על כל `bg-blue-50`, `text-blue-700` וכו' והחלף ל-tokens: `bg-primary/10`, `text-primary` |

### חסר — 15 מחשבונים שתוכננו ולא נשמרו

בסשן קודם נכתבו פונקציות חישוב והגדרות data ל-15 מחשבונים חדשים, אך **העריכות לא נשמרו בהצלחה** (הסשן קרס באמצע). יש להוסיף אותם מחדש:

| # | slug | שם | סטטוס נוכחי |
|---|------|-----|------------|
| 1 | `severance-pay` | פיצויי פיטורים | חסר ב-3 קבצים |
| 2 | `maternity-benefit` | דמי לידה | חסר |
| 3 | `overtime-pay` | שעות נוספות | חסר |
| 4 | `vacation-pay` | ימי חופשה | חסר |
| 5 | `arnona` | ארנונה | חסר |
| 6 | `car-total-cost` | עלות רכב | חסר |
| 7 | `old-age-pension` | קצבת זקנה | חסר |
| 8 | `minimum-wage-check` | שכר מינימום | חסר |
| 9 | `debt-interest-cost` | עלות חוב | חסר |
| 10 | `child-cost` | עלות ילד | חסר |
| 11 | `true-hourly-wage` | שכר אמיתי לשעה | חסר |
| 12 | `fire-retirement` | פרישה מוקדמת FIRE | חסר |
| 13 | `procrastination-cost` | עלות דחיינות | חסר |
| 14 | `freelance-vs-employed` | פרילנסר מול שכיר | חסר |
| 15 | `bank-interest-loss` | ריבית שמפסידים בבנק | חסר |

**לכל מחשבון חסר יש להוסיף:**
1. פונקציית חישוב ב-`src/lib/calculators/index.ts` (+ `case` ב-`runCalculator`)
2. הגדרת metadata ב-`src/data/calculators.ts` (כולל SEO, FAQs, inputs)
3. Renderer ב-`src/components/calculator/CalculatorResult.tsx` (`case` חדש)
4. עדכון `public/sitemap.xml` עם URL חדש

### חסר — תכונות מתוכננות

| # | תכונה | עדיפות | תיאור |
|---|-------|--------|-------|
| 1 | **עדכון sitemap.xml** | גבוה | כולל רק 19 מחשבונים (מתוכם 12 ב-URL). יש להוסיף את כל 19 + 15 החדשים + דפים מיוחדים |
| 2 | **Code splitting** | בינוני | bundle 1.36MB — יש לפצל ל-chunks דינמיים (lazy load דפים) |
| 3 | **מחולל תוכן יומי אוטומטי** | בינוני | cron שמייצר מחשבון מומלץ + תוכן AI מדי יום |
| 4 | **מפת סניפים עם ניווט** | נמוכה | שילוב Google Maps API לסניפי ביטוח לאומי/מס הכנסה |
| 5 | **אנליטיקת טוקנים ב-CRM** | נמוכה | מעקב צריכת AI tokens |
| 6 | **Canvas builder למחשבונים** | נמוכה | ממשק גרירה ליצירת מחשבונים |

---

## 6. באגים ידועים

### באג 1: לוגאאוט לא עובד בדשבורד

**מיקום:** `src/pages/AccountPage.tsx` שורה ~229

**הבעיה:** `onClick={() => { signOut(); navigate("/") }}` — `signOut()` היא async אבל לא ממתינים לה. הניווט קורה לפני שהסשן מתנתק, והמשתמש נשאר מחובר.

**הפתרון:**
```tsx
onClick={async () => {
  try { await signOut() } catch { /* ignore */ }
  navigate("/")
}}
```

**הערה:** ב-`AccountMenu.tsx` הלוגאאוט כן ממתין נכון (`await signOut()`), אבל גם שם כדאי להוסיף try/catch.

### באג 2: מצב light לא קריא בחלק מהדפים

**הבעיה:** חלק מהרכיבים משתמשים בצבעים קבועים (hardcoded) כמו `bg-blue-50`, `text-blue-700`, `bg-green-50` במקום ב-tokens של ה-theme (`bg-primary/10`, `text-primary`, `bg-success/10`). במצב light הצבעים האלה נראים טוב, אבל הם לא מתחלפים נכון עם dark mode ולהיפך.

**הפתרון:** עבור על כל הקבצים והחלף צבעים קבועים בטוקנים:
- `bg-blue-50` → `bg-primary/5`
- `text-blue-700` → `text-primary`
- `border-blue-200` → `border-primary/20`
- `bg-green-50` → `bg-success/5`
- `text-green-700` → `text-success`

### באג 3: חוסר עקביות ב-escaped quotes ב-JSX

**הבעיה:** מחרוזות עבריות עם `"` (כמו `סה"כ`) בתוך JSX attributes גורמות לשגיאות קומפילציה אם לא עטופות בסוגריים מסולסלים.

**הפתרון:** השתמש ב-`label={'סה"כ'}` במקום `label="סה\"כ"`.

---

## 7. מודל האבטחה

| שכבה | מנגנון | סטטוס |
|------|--------|-------|
| SQL Injection | Supabase JS client — parameterized queries בלבד | ✅ |
| Stored XSS | `sanitizeText()` מסיר HTML tags לפני שמירה; React escapes JSX | ✅ |
| URL Injection | `sanitizeUrl()` חוסם `javascript:` URLs | ✅ |
| Admin Access | `useIsAdmin()` — allowlist אימיילים (`jelyashar@gmail.com` + `VITE_ADMIN_EMAILS`) | ✅ |
| Admin Route | `/backstage` (לא `/admin` או `/crm` — נתיב לא צפוי) | ✅ |
| Auth | Supabase email/password, ללא אישור אימייל | ✅ |
| RLS | כל טבלה עם 4 policies (SELECT/INSERT/UPDATE/DELETE) לפי `auth.uid()` | ✅ |
| Input Limits | `maxLength` על כל textareas; `sanitizeNumber()` clamps | ✅ |
| Edge Functions | CORS headers בכל תגובה | ✅ |

**מה חסר:**
- Rate limiting על Edge Functions (חשוב למניעת שימוש לרעה ב-AI)
- בדיקת `VITE_ADMIN_EMAILS` גם בשרת (כרגע client-only — מתקבל כי אין נתיב admin ישיר)

---

## 8. SEO — מצב נוכחי והמלצות

### מה קיים ועובד

| תכונה | סטטוס | פרטים |
|-------|-------|-------|
| Meta tags | ✅ | `usePageMeta()` — title, description, robots, keywords |
| Open Graph | ✅ | og:title, og:description, og:type, og:locale=he_IL, og:site_name |
| Twitter Cards | ✅ | twitter:card, twitter:title, twitter:description |
| Canonical URLs | ✅ | `link[rel=canonical]` דינמי |
| JSON-LD Structured Data | ✅ | WebApplication, BreadcrumbList, FAQPage, Organization |
| Sitemap | ⚠️ חלקי | 21 URLs בלבד (חסרים 7 מחשבונים + דפים מיוחדים) |
| Robots.txt | ✅ | Allow all + sitemap reference |
| PWA Manifest | ✅ | name, theme_color, lang=he, dir=rtl |
| RTL | ✅ | `<html lang="he" dir="rtl">` |
| קישורים פנימיים | ✅ | InternalLinksBlock + RelatedCalculators |
| SEO Content | ✅ | כל מחשבון עם `seoContent` (HTML) מתחת לחישוב |
| FAQs | ✅ | כל מחשבון עם 2-4 FAQ + FAQPage schema |
| Breadcrumbs | ✅ | RTL breadcrumbs + BreadcrumbList schema |
| noindex | ✅ | דפים רגישים (account, backstage) עם `noindex, nofollow` |

### מה חסר וקריטי לטראפיק

| # | תכונה | עדיפות | פתרון מוצע |
|---|-------|--------|-----------|
| 1 | **Sitemap מלא** | קריטי | צריך לכלול את כל 19+15 מחשבונים, 8 קטגוריות, /fun, /rights, /letter-explainer. כדאי ליצור סקריפט שמייצר את ה-sitemap אוטומטית מ-`calculators.ts` |
| 2 | **SSR / SSG** | גבוה | כרגע SPA — גוגל מתקשה לראות meta tags בקרול ראשון. כדאי לעבור ל-SSG (vite-ssg) או להוסיף prerender. **לחלופין:** הוסף meta tags סטטיים ב-`index.html` + server-side rendering של meta |
| 3 | **hreflang** | בינוני | האתר בעברית בלבד — הוסף `<link rel="alternate" hreflang="he" href="...">` |
| 4 | **Page speed** | גבוה | bundle 1.36MB (385KB gzip). יש לפצל ל-chunks דינמיים: `React.lazy()` לדפים, `manualChunks` ב-vite.config |
| 5 | **Image optimization** | בינוני | אין תמונות כרגע, אבל כשיוסיפו — השתמש ב-`<img>` עם `loading="lazy"` ו-`width`/`height` |
| 6 | **Internal linking strategy** | בינוני | כל מחשבון מקשר ל-2-3 קשורים. כדאי להרחיב ל-5+ ולהוסיף "מחשבונים פופולריים" בכל עמוד |
| 7 | **Blog / Content hub** | גבוה | מאמרים כמו "איך לחשב שכר נטו", "כל מה שצריך לדעת על משכנתא" — ייצור טראפיק אורגני עצום |
| 8 | **Google Search Console** | קריטי | חובה לחבר ולהגיש sitemap |
| 9 | **Schema.org Calculator** | בינוני | כרגע `WebApplication` — אפשר להוסיף `SoftwareApplication` עם `applicationCategory: "FinanceApplication"` |
| 10 | **Canonical לדפים עם query params** | נמוך | דפי שיתוף עם פרמטרים — ודא canonical נקי |

### חוות דעת SEO

התשתית הטכנית **טובה מאוד** לאתר SPA: יש meta tags דינמיים, JSON-LD, sitemap, robots, RTL, ותוכן SEO בכל עמוד. הבעיה המרכזית היא ש**זה SPA** — גוגל צריך להריץ JavaScript כדי לראות את ה-meta tags, מה שמעכב את האינדקס. **המלצה חמה:** עבור ל-prerendering (vite-ssg או vite-plugin-prerender) לפחות לדפי המחשבונים והקטגוריות. זה ישפר משמעותית את האינדקס והדירוג.

---

## 9. חוזקות וחולשות

### חוזקות

1. **עיצוב מקצועי** — shadcn/ui עם theme מותאם אישית (OKLCH, RTL, Heebo font). נראה כמו מוצר אמיתי, לא template.

2. **ארכיטקטורה נקייה** — הפרדה ברורה: data (static) → lib (pure functions) → components (UI) → pages (routing). קל להוסיף מחשבונים.

3. **SEO טכני מוצק** — JSON-LD, meta tags, sitemap, canonical, breadcrumbs, תוכן SEO. התשתית קיימת, רק צריך להרחיב.

4. **AI משולב** — פורטל זכויות + ניתוח מסמכים + טיפים דינמיים. ערך מוסף שמבדל ממתחרים.

5. **אבטחה נכונה** — RLS על כל טבלה, sanitize functions, admin allowlist, נתיב admin לא צפוי.

6. **בדיקות** — 39 בדיקות יחידה על פונקציות חישוב, sanitize, ופורמט. לא מושלם אבל יש תשתית.

7. **חווית משתמש** — חישוב live (לא צריך submit), command palette, קלט קולי, dark mode, PWA.

8. **CRM מובנה** — ניהול תור פרסום, AI providers, מוניטור. מאפשר תפעול שוטף בלי לגעת בקוד.

### חולשות

1. **SPA ללא SSR/SSG** — החולשה הגדולה ביותר מבחינת SEO. גוגל מתקשה באינדקס ראשוני.

2. **Bundle ענק (1.36MB)** — אין code splitting. כל הדפים נטענים ב-initial bundle. פוגע ב-page speed וב-Core Web Vitals.

3. **19 מחשבונים בלבד** — מתחרים (כמו calc.co.il) מציעים 50-100+. חסרים מחשבוני "כאב" קריטיים.

4. **אין blog / content hub** — המקור הגדול ביותר לטראפיק אורגני חסר לחלוטין.

5. **ניהול state גלובלי** — אין Redux/Zustand. כל hook מנהל state בעצמו. זה עובד עכשיו אבל לא יסקול עם 50+ מחשבונים.

6. **קבצים גדולים** — `calculators.ts` (1305 שורות), `CalculatorResult.tsx` (514 שורות), `calculators/index.ts` (807 שורות). קשים לתחזוקה. כדאי לפצל.

7. **אין E2E tests** — יש unit tests אבל לא בדיקות אינטגרציה/UI. שינויים יכולים לשבור דפים בלי שנדע.

8. **היסטוריית עריכות אבודות** — בסשנים קודמים נכתבו 15 מחשבונים + תיקוני באגים שלא נשמרו (קריסת token limit). חובה לוודא שכל edit נשמר.

9. **אין analytics** — לא מחובר ל-GA4 / Search Console. לא יודעים מה עובד ומה לא.

10. **תלות ב-Grok/XAI** — AI תלוי ב-provider יחיד. אין fallback ל-OpenAI/Gemini ב-runtime (רק ב-CRM config).

---

## 10. איך להוסיף מחשבון חדש

### שלב 1: פונקציית חישוב

ב-`src/lib/calculators/index.ts`:

```typescript
export interface MyCalcInput { value1: number; value2: number }
export function calcMyCalc(input: MyCalcInput) {
  const result = input.value1 * input.value2
  return { result, someBreakdown: result * 0.1 }
}
```

הוסף `case` ב-`runCalculator`:
```typescript
case "my-calc": return calcMyCalc(i) as unknown as Record<string, unknown>
```

### שלב 2: הגדרת Data

ב-`src/data/calculators.ts`, הוסף אובייקט למערך `calculators`:

```typescript
{
  id: "my-calc", slug: "my-calc",
  title: "מחשבון שלי", shortTitle: "שלי",
  categorySlug: "salary-tax", // אחת מ-8 קטגוריות
  description: "תיאור קצר",
  seoTitle: "מחשבון שלי 2024 – כמה מגיע? | חשב לי",
  seoDescription: "תיאור SEO ארוך יותר...",
  keywords: ["מילת מפתח 1", "מילת מפתח 2"],
  inputs: [
    { id: "value1", label: "ערך 1", type: "number", min: 0, max: 100000, step: 100, unit: "₪", defaultValue: 5000 },
  ],
  quickAnswer: { question: "שאלה?", answer: "תשובה." },
  formulaExplanation: "הסבר נוסחה",
  exampleText: "דוגמה עם מספרים",
  faqs: [{ question: "שאלה", answer: "תשובה" }],
  relatedCalculatorSlugs: ["bruto-neto", "percentage"],
  lastUpdated: "2024-01-01",
  disclaimer: "המידע הוא הערכה בלבד",
  sourceNote: "מקור",
  seoContent: `<h2>כותרת SEO</h2><p>תוכן...</p>`,
}
```

### שלב 3: Renderer

ב-`src/components/calculator/CalculatorResult.tsx`, הוסף `case`:

```tsx
case "my-calc": {
  const r = result as { result: number; someBreakdown: number }
  return (
    <div className="space-y-3">
      <BigResult label="תוצאה" value={formatCurrency(r.result)} />
      <div className="grid grid-cols-2 gap-2">
        <Stat label="פירוט" value={formatCurrency(r.someBreakdown)} />
      </div>
    </div>
  )
}
```

### שלב 4: Sitemap

הוסף entry ב-`public/sitemap.xml`:
```xml
<url>
  <loc>https://chasav.li/calculators/my-calc</loc>
  <changefreq>monthly</changefreq>
  <priority>0.8</priority>
  <lastmod>2024-01-01</lastmod>
</url>
```

### שלב 5: בדיקה

הוסף test ב-`src/lib/calculators/index.test.ts` והרץ `npm test`.

---

## 11. בדיקות

```bash
npm test          # הרצת 39 בדיקות
npm run build     # בנייה + typecheck
npm run typecheck # typecheck בלבד
```

**כיסוי נוכחי:**
- `sanitize.test.ts` — 18 בדיקות (sanitizeText, sanitizeNumber, isValidEmail, isValidIsraeliPhone, sanitizeUrl, buildSafeParams)
- `format.test.ts` — 8 בדיקות (formatCurrency, formatNumber, formatPercent)
- `calculators/index.test.ts` — 13 בדיקות (calcBrutoNeto, calcNetoBruto round-trip, calcMortgage)

**מה חסר:** בדיקות על שאר המחשבונים, בדיקות E2E, בדיקות על hooks.

---

## 12. משתני סביבה

| משתנה | סביבה | נדרש | תיאור |
|-------|-------|------|-------|
| `VITE_SUPABASE_URL` | client | ✅ | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | client | ✅ | Supabase anon key (public) |
| `VITE_ADMIN_EMAILS` | client | לא | comma-separated אימיילים (default: `jelyashar@gmail.com`) |
| `XAI_API_KEY` | server | ✅ | Grok/xAI API key (edge functions) |
| `TELEGRAM_BOT_TOKEN` | server | לא | Telegram bot token |
| `TELEGRAM_CHAT_ID` | server | לא | Telegram chat ID |

**אבטחה:** משתני `VITE_` נחשפים ל-client. אל תשים שם סודות. `XAI_API_KEY` ו-`TELEGRAM_*` הם server-side בלבד.

---

## 13. חוות דעת מלאה

### דירוג כללי: 7/10

המערכת **מרשימה מאוד** לאתר שנבנה ב-AI. הארכיטקטורה נקייה, העיצוב מקצועי, הקוד מאורגן, ויש תשתית איתנה לפיתוח עתידי. ה-AI משולב היטב (פורטל זכויות, ניתוח מסמכים, טיפים), וה-CRM מאפשר ניהול שוטף. אבטחה נכונה עם RLS, sanitize, ו-admin allowlist.

**הבעיה המרכזית:** האתר הוא SPA. ללא SSR/SSG, גוגל מתקשה לאנדקס meta tags ותוכן דינמי. זה הדבר **הכי חשוב** לתקן כדי לייצר טראפיק. כל שאר ה-SEO (JSON-LD, sitemap, breadcrumbs) לא יעזור אם גוגל לא רואה אותו בקרול ראשוני.

**המלצות עדיפות להמשך עבודה:**

1. **תקן את באג הלוגאאוט** (5 דקות)
2. **הוסיף 15 מחשבונים חסרים** (פונקציות + data + renderers + sitemap) — הם כבר תוכננו, רק צריך לכתוב מחדש
3. **עבור ל-SSG/prerendering** — הדבר הכי חשוב לטראפיק
4. **Code splitting** — פצל את ה-bundle ל-chunks דינמיים
5. **עדכן sitemap.xml** — הוסף את כל המחשבונים והדפים
6. **חבר Google Search Console + GA4**
7. **כתוב בלוג** — 5-10 מאמרים כמו "איך לחשב שכר נטו", "מדריך משכנתא למתחילים"
8. **תקן light mode** — החלף צבעים קבועים בטוקנים
9. **הוסף E2E tests** — לפחות על הדפים הראשיים
10. **פצל קבצים גדולים** — `calculators.ts` ו-`CalculatorResult.tsx`

**סיכום:** התשתית מוצקת, העיצוב מקצועי, ה-AI מרשים. חסרים מחשבונים, SSR, ותוכן (blog). אם מתקנים את ה-SSR ומוסיפים מחשבונים + מאמרים — יש פוטנציאל לטראפיק אורגני גבוה מאוד בישראל.
