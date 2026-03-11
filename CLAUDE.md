# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # Start dev server (Next.js with Turbopack)
pnpm build        # Production build (TypeScript errors ignored — see next.config.mjs)
pnpm lint         # Run Next.js ESLint
pnpm db:types     # Regenerate Supabase TypeScript types → lib/supabase/database.types.ts
pnpm db:new:migration  # Scaffold a new SQL migration in supabase/migrations/
```

## Architecture

**Clairo** is a full-stack financial dashboard. Stack: Next.js 16 App Router + Turbopack, React 19, Supabase (PostgreSQL + Auth + RLS), Tailwind CSS v3, Radix UI/shadcn primitives, React Hook Form + Zod, Recharts, Stripe, Lucide React.

### Key directories

| Path | Purpose |
|------|---------|
| `app/` | Next.js App Router pages. Root layout → landing page. |
| `app/actions/` | All server actions (`"use server"`). One file per domain: `accounts.ts`, `auth.ts`, `billing.ts`, `credit-cards.ts`, `dashboard.ts`, `invoice.ts`, `merchants.ts`, `notification.ts`, `profile.ts`, `recipient.ts`, `saving-plans.ts`, `transaction.ts`. |
| `app/dashboard/` | Authenticated dashboard. Layout wraps `AppSidebar` + children. Sub-routes: `account/`, `cards/`, `inbox/`, `insights/`, `investment/`, `invoice/`, `notification/`, `payments/transfer`, `payments/payment`, `profile/`, `promos/`, `saving-plans/`, `subscription/`, `transactions/`. |
| `app/auth/` | Supabase OAuth callback and email verification routes. |
| `components/ui/` | shadcn-style Radix UI primitives (Button, Card, Form, Dialog, etc.). |
| `components/dashboard/` | Feature-specific dashboard widgets (balance card, stat cards, cashflow chart, etc.). |
| `components/landing/` | Landing page sections (Navbar, Hero, Features, Pricing, Footer, etc.). |
| `lib/supabase/server.ts` | `createClient()` for Server Components/Actions — uses `next/headers` cookies. |
| `lib/supabase/client.ts` | `createClient()` for Client Components — uses `createBrowserClient`. |
| `lib/supabase/admin.ts` | `createAdminClient()` using `SUPABASE_SERVICE_ROLE_KEY` — bypasses RLS. Use only in webhook/server-only routes. |
| `lib/supabase/database.types.ts` | Auto-generated DB types. Regenerate with `pnpm db:types`. |
| `supabase/migrations/` | Ordered SQL migrations. Apply via Supabase SQL Editor or `supabase db push`. |

### Data flow pattern

Pages and components call **server actions** from `app/actions/`. Server actions call `createClient()` from `lib/supabase/server.ts` to run authenticated Supabase queries. There is no dedicated API layer — everything goes through Next.js server actions.

### Auth

Supabase Auth. `app/login/` and `app/register/` use server actions (`app/actions/auth.ts`). The dashboard is protected at `app/dashboard/layout.tsx`. Google OAuth is optional.

### Stripe

`app/actions/billing.ts` creates Stripe Checkout sessions for Pro subscriptions. Required env vars: `STRIPE_SECRET_KEY`, `STRIPE_PRICE_PRO_MONTH`, `STRIPE_PRICE_PRO_YEAR`. The `stripe_customer_id` is persisted on `user_profile`.

### Environment variables

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY    # used by admin client in webhook handler (bypasses RLS)
NEXT_PUBLIC_APP_URL          # e.g. http://localhost:3000
STRIPE_SECRET_KEY
STRIPE_PRICE_PRO_MONTH
STRIPE_PRICE_PRO_YEAR
SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_SECRET  # optional
VERCEL_URL                   # optional, set by Vercel
```

### Database schema (key tables)

- **`user_profile`** — extends `auth.users`; includes `stripe_customer_id`
- **`account`** — user funding sources with balances
- **`credit_card`** — liability cards
- **`transfer`** — account-to-account transfers
- **`payment`** — payments to merchants (supports installments, recurring)
- **`payment_installment`**, **`card_payment`**, **`transaction_fee`**
- **`merchant`**, **`merchant_category`**, **`recipient`**
- **`subscription_plan`**, **`subscription`**
- **`saving_plan`**, **`saving_plan_contribution`**
- **`income`**, **`notification`**, **`notification_preference`**, **`budget`**
- **`activity`**, **`invoice`**

All tables use RLS; policies are defined in the migrations. Migrations must be applied in filename (timestamp) order.
