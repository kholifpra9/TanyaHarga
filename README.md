# 🌶️ TanyaHarga

[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-tanyaharga.vercel.app-2ea44f?style=for-the-badge&logo=vercel)](https://tanyaharga.vercel.app/)
[![API Docs](https://img.shields.io/badge/📖_API_Docs-View_Documentation-blue?style=for-the-badge)](https://tanyaharga.vercel.app/api-docs)

**Community-driven price radar & market transparency for traditional Indonesian markets.**

TanyaHarga collects daily commodity price data from traditional ("pasar tradisional") markets through community reports — vendors, buyers, or anyone can report a price simply by typing a free-form sentence, which an AI then parses into structured data. From there, anyone can **ask for prices**, **view average prices per commodity**, and **watch** their favorite commodities.

Built as a portfolio project under a strict **zero-budget** constraint — the entire stack runs on free tiers, with no infrastructure cost.

---

## 🌐 Live Demo & Access

Experience TanyaHarga live in action without any setup:

| Platform | Link | Description |
|---|---|---|
| 🚀 **Web Application** | [**tanyaharga.vercel.app**](https://tanyaharga.vercel.app/) | Try parsing free-form prices directly on the live app |
| 📖 **API Documentation** | [/api-docs](https://tanyaharga.vercel.app/api-docs) | Interactive reference for the free public API |

> 💡 **Try it instantly:** No sign-up required! Anonymous users get 1 free AI parse/ask query every 24 hours.

## ✨ Features

| Feature | Description |
|---|---|
| 📝 **Report Price** | Type a price report in free-form text (`"cabai rawit 45k, telur 26k/kg at Pasar Induk"`), and AI automatically extracts it into structured data |
| 🔍 **Ask Price** | Ask about commodity prices in free-form text (`"how much is chili and eggs at pasar induk?"`) and get an instant answer from community data |
| 📊 **Aggregated Dashboard** | Average price per commodity across all markets (or filtered to a single market), with 🟢 cheap / 🟡 stable / 🔴 expensive indicators |
| 🌐 **Public API** | `GET /api/prices` endpoint — price data available for free to anyone, no API key required |
| ⭐ **Watchlist** | Save commodities (per market or averaged across all markets) to keep track of — the foundation for a future WhatsApp reminder feature |
| 🔓 **Freemium Access** | All AI features are usable without an account (1x/24h), while signing in unlocks unlimited usage plus personal report history |

---

## 🖼️ Demo

🔗 **Live:** [tanyaharga.vercel.app](https://tanyaharga.vercel.app) — *(replace with your production URL)*
📖 **API Docs:** [/api-docs](https://tanyaharga.vercel.app/api-docs)

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js](https://nextjs.org) (App Router, TypeScript) |
| Database | [Supabase](https://supabase.com) (Postgres + Auth) |
| AI | [Groq API](https://console.groq.com) — free-text parsing & intent extraction |
| Validation | [Zod](https://zod.dev) |
| UI | [Tailwind CSS](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com) |
| Hosting | [Vercel](https://vercel.com) |

Every piece of this stack was chosen specifically because it offers a **free tier** generous enough for a small community/portfolio-scale project.

---

## 🚀 Running Locally

### Prerequisites

- Node.js 18+
- A free [Supabase](https://supabase.com) account
- A free [Groq](https://console.groq.com) account for an API key

### 1. Clone & install dependencies

```bash
git clone https://github.com/kholifpra9/TanyaHarga.git
cd TanyaHarga
npm install
```

### 2. Set up Supabase

1. Create a new project in the [Supabase Dashboard](https://supabase.com/dashboard).
2. Run the database schema from [`docs/architecture.md`](./docs/architecture.md) (tables: `markets`, `commodities`, `prices`, `menus`, `watchlist`) via the SQL Editor.
3. Enable Row Level Security (RLS) policies as described in the architecture doc — **this is required**; without it, some features (e.g. the dashboard) will appear empty.
4. Grab your credentials from **Project Settings → API**.

### 3. Environment Variables

Copy the example file and fill in your own values:

```bash
cp .env.example .env.local
```

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GROQ_API_KEY=your-groq-api-key
```

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase's public key (safe to expose to the browser — access is enforced via RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | Full-privilege key, **server-side only** (Route Handlers) — never expose this to the client |
| `GROQ_API_KEY` | API key for AI parsing calls |

> ⚠️ Never commit `.env.local` to Git — it's already excluded by Next.js's default `.gitignore`.

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## 📁 Project Structure

```
app/
├── api/
│   ├── report-price/      # Route Handler: parse & save price reports
│   ├── ask-price/         # Route Handler: extract intent & query prices
│   ├── confirm-new-entry/ # Route Handler: confirm new commodity/market
│   └── prices/             # Route Handler: public API (GET)
├── report-price/          # Report Price page
├── ask-price/             # Ask Price page
├── dashboard/             # Aggregated dashboard + watchlist
├── login/                 # Login/signup page
└── api-docs/               # Public API documentation
lib/
├── supabase.ts             # Supabase client (anonymous, for public data)
├── supabase/                # Supabase clients (session-aware: browser & server)
├── supabase-admin.ts        # Supabase client (service role, server-only)
├── groq.ts                  # Groq API call wrapper
├── schemas.ts                # Zod validation schemas
├── quota.ts                  # Cookie-based anonymous quota helper
└── price-aggregation.ts      # Per-commodity price aggregation logic
middleware.ts                 # Supabase session refresh
```

---

## 🔌 Public API

```
GET /api/prices?commodity=cabai&market=induk
```

| Parameter | Required? | Description |
|---|---|---|
| `commodity` | No | Filter by commodity name (fuzzy match) |
| `market` | No | Filter by market name (fuzzy match) |

See the full documentation with example responses at [`/api-docs`](https://tanyaharga.vercel.app/api-docs) once the app is running.

---

## 🗺️ Roadmap

- [ ] **KilasGizi** — a companion app in this ecosystem: a budget-based healthy meal planner that consumes price data from TanyaHarga
- [ ] **n8n integration** — a WhatsApp bot for reporting prices, and daily automated reminders based on watchlists
- [ ] Interactive map for location-based price visualization
- [ ] IP-based rate limiting (replacing the current cookie-based quota)

---

## 📚 Further Documentation

Full design documentation (architecture, database schema, design decisions) lives in the [`docs/`](./docs) folder — written as part of a deliberate deep-dive into learning the Next.js App Router while building this project.

---

## 📝 License

Built for personal portfolio purposes.