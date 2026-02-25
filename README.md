# COINEST – Financial Dashboard

A full-stack financial management web app with a landing page, authentication, and a dashboard for accounts, payments, transfers, transactions, invoices, credit cards, saving plans, investments, and insights. Built with **Next.js**, **React**, **Supabase**, and **Tailwind CSS**.

---

## Tech stack

| Layer | Stack |
|-------|--------|
| **Framework** | Next.js 16 (App Router, Turbopack) |
| **UI** | React 19, Tailwind CSS 4, Radix UI, shadcn-style components |
| **Backend / DB** | Supabase (PostgreSQL, Auth, RLS) |
| **Forms / validation** | React Hook Form, Zod, @hookform/resolvers |
| **Charts** | Recharts |
| **Icons** | Lucide React |

---

## Features

- **Landing**: Hero, stats, features, how it works, testimonials, pricing, CTA, footer
- **Auth**: Login, register, email verification, Google OAuth (optional), Supabase Auth callback
- **Dashboard** (authenticated):
  - **Dashboard** – Balance card, stat cards, quick actions, daily limit, saving plans, cashflow chart, recent transactions, statistic panel, recent activity
  - **Account** – User profile (name, avatar, phone, currency)
  - **Payments** – Transfer (account-to-account), Payment (to merchants)
  - **Transactions**, **Invoices**, **Credit Cards**, **Saving Plans**, **Investments**
  - **Inbox**, **Promos**, **Insights**
- **Data**: User profiles, accounts, credit cards, recipients, merchants, transfers, payments (including installments and recurring), card payments, fees, subscriptions, saving plans, income, notifications, budgets, activity, invoices (via Supabase migrations)

---

## Project structure

```
├── app/
│   ├── layout.tsx              # Root layout, metadata, font
│   ├── page.tsx                # Landing page
│   ├── login/                  # Login page + server action
│   ├── register/               # Register page + server action
│   ├── auth/v1/                # Verification page, OAuth callback route
│   ├── actions/                # Auth actions (e.g. signOut)
│   └── dashboard/              # Dashboard layout + pages
│       ├── layout.tsx          # Sidebar + main area
│       ├── page.tsx            # Main dashboard
│       ├── account/
│       ├── payments/           # transfer, payment sub-routes
│       ├── transactions/       # invoice, cards, saving-plans, etc.
│       └── ...
├── components/
│   ├── app-sidebar.tsx         # Dashboard nav (COINEST sidebar)
│   ├── top-header.tsx
│   ├── dashboard/              # Balance, stats, charts, quick actions, etc.
│   ├── landing/                # Navbar, hero, features, pricing, footer, etc.
│   ├── ui/                     # shadcn-style primitives (button, card, form, …)
│   └── theme-provider.tsx
├── lib/
│   ├── supabase/               # createClient (server), createClient (client)
│   ├── utils.ts                # cn() etc.
│   ├── sign-in-google.ts
│   └── safe-redirect.ts
├── supabase/
│   └── migrations/             # SQL migrations (profiles, accounts, payments, subscriptions, etc.)
├── .env.example
├── package.json
└── next.config.mjs
```

---

## Getting started

### Prerequisites

- **Node.js** 18+ (project uses pnpm; npm/yarn work if you adjust commands)
- **Supabase** project ([supabase.com](https://supabase.com))

### 1. Install dependencies

```bash
pnpm install
```

### 2. Environment variables

Copy the example env and fill in your Supabase and app URL:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon (public) key |
| `NEXT_PUBLIC_APP_URL` | App origin (e.g. `http://localhost:3000`) |
| `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_SECRET` | Optional: for Google OAuth |
| `VERCEL_URL` | Optional: set by Vercel in production |

Do not commit `.env.local` or any file containing real keys.

### 3. Supabase database

Apply migrations so the app’s tables and RLS policies exist:

- In Supabase: **SQL Editor** → run each file in `supabase/migrations/` in order by filename (timestamp).
- Or use Supabase CLI: `supabase db push` (or equivalent) from the project root.

Migrations include:

- `user_profile` (and trigger to create profile on signup)
- Payment/transfer model: `account`, `credit_card`, `recipient`, `merchant`, `merchant_category`, `transfer`, `payment`, `payment_installment`, `card_payment`, `transaction_fee`
- `subscription_plan`, `subscription`
- `saving_plan`, `saving_plan_contribution`
- `income`, `notification`, `notification_preference`, `budget`
- `activity`, `invoice`

### 4. Run the app

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). Use the landing page, then **Login** or **Register** to reach the dashboard.

---

## Scripts

| Command | Description |
|--------|-------------|
| `pnpm dev` | Start dev server (Next.js with Turbopack) |
| `pnpm build` | Production build |
| `pnpm start` | Start production server |
| `pnpm lint` | Run Next.js lint |

---

## Database overview

- **Auth**: Supabase `auth.users`; app uses `public.user_profile` (id = `auth.users.id`) with RLS.
- **Money flows**: `account` (user funding sources), `credit_card` (liabilities), `transfer` (account-to-account), `payment` (to merchants; from account or card), `payment_installment`, `card_payment`, `transaction_fee`.
- **Other**: `recipient`, `merchant` / `merchant_category`, `subscription`, `saving_plan`, `income`, `notification` / `budget`, `activity`, `invoice`.

All tables live in `public`; RLS policies are defined in the migrations.

---

## License

Private project. All rights reserved.
