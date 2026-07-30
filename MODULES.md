# MODULES.md — Living System Documentation
> Auto-maintained: describes every major module, its purpose, dependencies, and test coverage.  
> Last updated: 2026-07-30

---

## Architecture Overview

```
Frontend (React 19 + Vite + Tailwind v4 RTL)
    │
    ├── Pages          → route-level views
    ├── Components     → reusable UI pieces
    ├── Hooks          → stateful logic
    ├── Lib            → pure utilities + Supabase client
    └── Data           → static calculator registry + categories
         │
Supabase (Postgres + Edge Functions)
    ├── Tables         → persistent user data
    ├── Edge Functions → AI proxy (Grok/XAI) + cron jobs
    └── RLS Policies   → row-level security per user
```

---

## Pages

| File | Route | Auth Required | Description |
|------|-------|:---:|-------------|
| `HomePage.tsx` | `/` | ✗ | Landing: search, category grid, fun-calc promo, featured calculator |
| `CalculatorPage.tsx` | `/calculators/:slug` | ✗ | Single calculator runner with SEO, FAQ, related links |
| `CategoryPage.tsx` | `/categories/:slug` | ✗ | Grid of calculators in a category |
| `FunCalculatorsPage.tsx` | `/fun` | ✗ | 3 animated gimmick calculators (take-home, taxi, transit) |
| `AccountPage.tsx` | `/account` | ✓ | **Ultra dashboard** — favorites, AI analyses, rights cases, document analyzer, history |
| `CrmPage.tsx` | `/backstage` | ✓ Admin | CRM — queue, AI monitor, provider config, publish |
| `RightsAssistantPage.tsx` | `/rights` | ✗ (save needs auth) | AI-powered Israeli rights portal (Grok vision) |
| `LetterExplainerPage.tsx` | `/letter-explainer` | ✗ | Upload / paste a letter → plain Hebrew explanation |
| `NotFoundPage.tsx` | `*` | ✗ | 404 |

---

## Components

### Layout
| File | Purpose |
|------|---------|
| `SiteLayout.tsx` | Wraps every page with `Header` + `Footer` |
| `Header.tsx` | Logo, desktop nav (admin-conditional CRM link), mobile sheet menu, theme toggle, command palette trigger |
| `Footer.tsx` | Brand block, business promo (elyasharpc / elyasharlabs), contact, categories |
| `AccountMenu.tsx` | User avatar dropdown (sign-in / sign-out / dashboard) |
| `RateAlertBanner.tsx` | Prime-rate alert ribbon |

### Calculator
| File | Purpose |
|------|---------|
| `CalculatorEngine.tsx` | Orchestrates form → result → AI tip pipeline |
| `LiveCalculatorForm.tsx` | Generic input renderer (number, select, toggle) with voice input support |
| `CalculatorResult.tsx` | Result display with animations |
| `CalculatorActions.tsx` | Save / share / AI-tip buttons |
| `ResultToolbar.tsx` | Copy / WhatsApp share / print |
| `AmortizationTable.tsx` | Mortgage amortization table |
| `SeoTextSection.tsx` | Structured SEO text below result |
| `FAQSection.tsx` | Accordion FAQ |
| `InternalLinksBlock.tsx` | Related-calculator links |
| `QuickAnswerBlock.tsx` | Schema.org quick-answer widget |
| `DisclaimerBox.tsx` | Legal disclaimer |
| `RelatedCalculators.tsx` | Side-panel related cards |

### Fun Calculators
| File | Purpose |
|------|---------|
| `RealTakeHomeCalculator.tsx` | Animated gross-to-net + 365-day calendar |
| `TaxiMeterCalculator.tsx` | Live animated taxi fare (tariff 1/2, wait, phone-order) |
| `TransitFareCalculator.tsx` | Rav-Kav single vs monthly-pass comparison |

### CRM
| File | Purpose |
|------|---------|
| `AiTab.tsx` | AI provider dispatch + token-usage logging |
| `ProvidersTab.tsx` | Configure AI providers (XAI, OpenAI, Gemini…) |
| `MonitorTab.tsx` | System health + Telegram alert toggle |
| `CrudDialogs.tsx` | Create / Edit / Delete dialogs for queue items |

### Auth
| File | Purpose |
|------|---------|
| `AuthDialog.tsx` | Sign-in / Sign-up modal (email + password) |

### Shared
| File | Purpose |
|------|---------|
| `CalculatorCard.tsx` | Calculator preview card used in grids |
| `CategoryGrid.tsx` | Responsive category tile grid |
| `CommandPalette.tsx` | `⌘K` fuzzy search across all calculators |
| `PopularCalculators.tsx` | Top-6 popular calculator strip |
| `Breadcrumbs.tsx` | RTL breadcrumb nav |

---

## Hooks

| File | Returns | Purpose |
|------|---------|---------|
| `use-auth.tsx` (via `AuthProvider`) | `{ user, session, loading, signIn, signUp, signOut, openAuthDialog }` | Auth state |
| `use-is-admin.ts` | `boolean` | Checks user email against `VITE_ADMIN_EMAILS` list |
| `use-favorites.ts` | `{ favorites, addFavorite, removeFavorite, isFavorite }` | Supabase-backed calculator favorites |
| `use-saved-items.ts` | `{ items, saveItem, removeItem }` | Supabase-backed saved results + AI analyses |
| `use-recently-viewed.ts` | `{ recent, track, clear }` | localStorage-based recently viewed |
| `use-count-up.ts` | `number` | Animated number count-up (rAF + easing) |
| `use-today-featured.ts` | `{ calculator, loading }` | Fetches daily featured calculator |
| `use-shareable-url.ts` | `{ url, copy }` | Generates shareable deep links |
| `use-voice-input.ts` | `{ listening, transcript, start, stop }` | Web Speech API voice input |
| `use-mobile.ts` | `boolean` | Breakpoint-based mobile detection |

---

## Lib (utilities)

| File | Exports | Purpose |
|------|---------|---------|
| `supabase.ts` | `supabase`, types (`QueueItem`, `Favorite`, `SavedItem`, `RightsCase`, …) | Supabase JS client + shared types |
| `auth.tsx` | `AuthProvider`, `useAuth` | Auth context provider |
| `format.ts` | `formatCurrency`, `formatNumber`, `formatPercent`, `formatDate` | Israeli locale formatters |
| `sanitize.ts` | `sanitizeText`, `sanitizeNumber`, `isValidEmail`, `isValidIsraeliPhone`, `sanitizeUrl`, `buildSafeParams` | **Security** — input sanitization & validation |
| `seo.ts` | `usePageMeta` | Sets `<title>`, meta tags, OG, canonical |
| `jsonld.ts` | `buildCalculatorLD`, `buildFAQLD` | JSON-LD structured data helpers |
| `smart-tips.ts` | `getSmartTips`, `getResultSummary` | Contextual AI tip prompts |
| `utils.ts` | `cn` | Tailwind class merger (clsx + tailwind-merge) |
| `calculators/index.ts` | All calculator pure functions | Core math: salary, mortgage, NI, retirement… |

---

## Data

| File | Exports | Purpose |
|------|---------|---------|
| `data/calculators.ts` | `calculators[]`, `getCalculatorBySlug`, `getRelatedCalculators`, `getPopularCalculators` | Static registry of all calculators with inputs, formulas, SEO |
| `data/categories.ts` | `categories[]` | 8 calculator categories |

---

## Supabase (Database)

### Tables

| Table | RLS | Purpose |
|-------|:---:|---------|
| `calculator_queue` | ✓ Admin | Scheduled publish queue |
| `daily_featured` | ✓ Public read | Today's featured calculator |
| `favorites` | ✓ Owner | User's favorite calculators |
| `saved_items` | ✓ Owner | Saved results + AI analyses |
| `rights_cases` | ✓ Owner | Rights portal case files |
| `ai_content` | ✓ Admin | AI-generated content log |
| `ai_providers` | ✓ Admin | Provider API config |
| `site_settings` | ✓ Admin | Global settings |

### Edge Functions

| Slug | Auth | Purpose |
|------|:----:|---------|
| `rights-assistant` | Anon | Grok vision → rights analysis + letters |
| `explain-letter` | Anon | Grok vision → plain-language letter explanation |
| `ai-crm-assistant` | Anon | Multi-provider AI dispatch for CRM |
| `crm-operations` | Anon | Queue CRUD |
| `provider-manager` | Anon | Provider config CRUD |
| `publish-daily-calculator` | Service (cron) | Daily auto-publish |
| `telegram-alerts` | Service | Push Telegram notifications |

---

## Security Model

| Layer | Mechanism |
|-------|-----------|
| SQL injection | Supabase JS parameterized queries (no raw SQL in client) |
| Stored XSS | `sanitizeText()` strips tags before persistence; React escapes all JSX strings on render |
| URL injection | `sanitizeUrl()` blocks non-http/https protocols |
| Admin access | Email allowlist via `VITE_ADMIN_EMAILS`; CRM route is non-obvious (`/backstage`) |
| Auth | Supabase email/password; sessions via httpOnly cookies (Supabase default) |
| RLS | Every table has 4 per-verb policies scoped to `auth.uid()` |
| Input limits | `maxLength` on all textareas; `sanitizeNumber()` clamps ranges |

---

## Test Coverage

Run: `npm test`

| File | Tests | What it covers |
|------|------:|----------------|
| `src/lib/sanitize.test.ts` | 18 | All sanitize/validate functions |
| `src/lib/format.test.ts` | 8 | Currency, number, percent formatters |
| `src/lib/calculators/index.test.ts` | 13 | Bruto→Neto, Neto→Bruto, Mortgage round-trips |
| **Total** | **39** | |

---

## Environment Variables

| Variable | Used in | Purpose |
|----------|---------|---------|
| `VITE_SUPABASE_URL` | Client | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Client | Supabase anon key (public) |
| `VITE_ADMIN_EMAILS` | `use-is-admin.ts` | Comma-separated admin email whitelist |
| `XAI_API_KEY` | Edge functions | Grok / xAI API key (secret, server-side only) |
| `TELEGRAM_BOT_TOKEN` | `telegram-alerts` | Telegram bot token (secret) |
| `TELEGRAM_CHAT_ID` | `telegram-alerts` | Telegram chat/channel ID (secret) |

---

## Adding a New Calculator

1. Add an entry to `src/data/calculators.ts` with: `id`, `slug`, `title`, `shortTitle`, `description`, `categorySlug`, `inputs[]`, and `formula` reference.
2. Add the pure function to `src/lib/calculators/index.ts`.
3. Add a test case in `src/lib/calculators/index.test.ts`.
4. The calculator page, SEO, breadcrumbs, related calculators, and command palette all pick it up automatically.
