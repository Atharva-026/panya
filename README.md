# Panya (पण्य)

**An AI agent that sells, upsells, and accounts for every rupee.**

Panya is a conversational AI shopping agent built on Razorpay's payment infrastructure. A customer describes what they want — typed or spoken, in English, Hindi, Marathi, or Kannada — and Panya finds the right item, reasons about a genuinely fitting pairing, and completes payment on the spot. Every decision is explainable, every payment is bounded and gated by merchant-defined rules, and every action is recorded in a full audit trail.

> **पण्य** — Sanskrit for *merchandise, goods worthy of trade*. A fitting name for an agent whose entire job is deciding what's worth selling, to whom, and why — and being able to explain that decision every time.

---

## Live Demo

- **Live app:** https://panya-app-live.azurewebsites.net
- **Repository:** https://github.com/Atharva-026/panya
- **Blog — Overview & Architecture:** https://atharva026.hashnode.dev/panya-an-ai-agent-that-shops-sells-and-explains-every-rupee
- **Blog — Challenges & Observability:** https://atharva026.hashnode.dev/the-wall-i-hit-building-panya-and-what-opentelemetry-showed-me

---

## Built for the Razorpay AI Buildathon 2026 — Track 01: AI Growth & Agentic Commerce

**The track's bar:** *"Every money action explainable, bounded and gated. Show the audit trail and one failure handled gracefully."*

Panya meets this directly:

| Requirement | How Panya satisfies it |
|---|---|
| **Explainable** | Every LLM decision (product match, upsell suggestion) includes a stated reason, surfaced in the chat UI and logged to the audit trail. |
| **Bounded** | Merchant-configurable per-order spend limit *and* a rolling daily spend cap, enforced server-side before any payment is attempted. |
| **Gated** | Payments require either real-time customer confirmation (chat checkout) or one-tap human approval (autonomous auto-order via Payment Link) — money never moves without a deliberate gate. |
| **Audit trail** | A dedicated merchant dashboard shows every order, block, and payment event, timestamped and reasoned, not just a raw database table. |
| **Graceful failure** | Multiple genuine failure modes are handled visibly — see [Failure Stories](#failure-stories--what-broke-and-how-we-got-out) below. |
| **Agent-to-agent commerce ("why now")** | A standalone autonomous AI buyer script and a full scheduled Auto-Order feature demonstrate real unattended agent-initiated purchasing — not just a conversational checkout. |

---

## Features

### Customer-facing
- Conversational shopping in English, Hindi, Marathi, and Kannada — typed or spoken (voice input via Whisper, voice output via speech synthesis)
- Persistent cart with live spend-rule visibility (shows whether the current cart is within or exceeds merchant limits, before checkout)
- Dynamic, LLM-reasoned upsell suggestions with a stated reason for every pairing — not a hardcoded category map
- Multi-candidate stylistic matching for vague requests (e.g. "something formal for a wedding")
- Clarifying questions instead of a silent guess when two or more products are genuinely comparable matches
- Product images shown inline in chat
- Light and dark mode across every page, sharing one design-token system with the landing page's identity
- Personal order history and spend dashboard
- Google OAuth sign-in, with a guest-mode fallback for quick access without a real account

### Merchant-facing
- Merchant dashboard: total revenue, upsell revenue, order counts, full audit trail
- Analytics: revenue-over-time chart, top products, revenue by category, AI-generated restock priority forecasting, natural-language insights
- Full product catalog management (add/edit/delete) — changes reflect instantly in the storefront and in what the agent recommends
- Configurable spend rules (max order value, daily spend cap)

### Agentic / Automation
- A standalone **autonomous AI buyer script** that fetches the merchant's agent-readable catalog, reasons over it independently, and creates a real order — zero human typing, a direct demonstration of agent-to-agent commerce
- **Scheduled Auto-Order rules**: a customer sets a standing goal ("casual wear, weekly, under ₹1,000"), and Panya's agent reasons over the live catalog on schedule, creates a real Razorpay Payment Link, and waits for one-tap human approval before any money moves
- Rules can be paused, resumed, or deleted at any time

### Observability
- OpenTelemetry instrumentation across the backend — automatic spans for every HTTP request and MongoDB query, plus custom spans around every Groq LLM call and every Razorpay API call
- Traces visualized in Jaeger — see [Observability](#observability--tracing) below for real findings

### Notifications
- Transactional email (order confirmation, welcome email) via Nodemailer/Gmail SMTP

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite, React Router |
| Backend | Node.js, Express 5, Mongoose / MongoDB Atlas |
| AI | Groq (`openai/gpt-oss-120b` for reasoning, `whisper-large-v3-turbo` for voice transcription) |
| Payments | Razorpay — Orders API, Payment Links API, signature verification, status polling |
| Auth | Passport.js (Google OAuth 2.0), `express-session` + `connect-mongo` for persistent sessions |
| Observability | OpenTelemetry SDK (Node auto-instrumentation + custom spans), Jaeger |
| Deployment | Docker (multi-stage build), Azure Container Registry, Azure App Service, GitHub Actions CI/CD |

---

## Architecture

Panya runs as a single Express backend serving both the REST API (`/api/*`) and the built React frontend (single-origin in production — no CORS, no cross-origin cookie complexity). One MongoDB database backs everything: products, orders, audit logs, users, and auto-order rules.

```
Customer (chat, voice, or scheduled rule)
        │
        ▼
  Groq LLM reasoning ──► Product catalog (MongoDB)
        │
        ▼
  Spend-rule gate (per-order + daily cap)
        │
        ├─ blocked ──► explained in chat + logged to audit trail
        │
        ▼
  Razorpay (Order + Checkout, or Payment Link for autonomous runs)
        │
        ▼
  Payment verified ──► Audit log + email confirmation ──► Merchant dashboard
```

---

## Running Locally

**Prerequisites:** Node.js 20+, MongoDB Atlas connection string, Razorpay test-mode API keys, a Groq API key, Google OAuth credentials, Gmail app password (for email).

```bash
# Backend
cd server
npm install
# create a .env file — see Environment Variables below
npm run dev

# Frontend (separate terminal)
cd client
npm install
npm run dev
```

Open `http://localhost:5173`.

### Environment Variables (`server/.env`)

```
MONGODB_URI=
GROQ_API_KEY=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
SESSION_SECRET=
GMAIL_USER=
GMAIL_APP_PASSWORD=
FRONTEND_URL=http://localhost:5173
SECURE_COOKIES=false
```

---

## Deployment

Panya is containerized with a multi-stage Dockerfile (React build → bundled into the Express image) and deployed to **Azure App Service** via a private **Azure Container Registry**, using managed identity for registry access (no stored credentials). A **GitHub Actions** pipeline builds, pushes, and deploys through a staging environment before production, and automatically restarts the Web App on every push to `main`.

---

## Observability / Tracing

Panya is instrumented end-to-end with OpenTelemetry, with custom spans specifically around the two categories of external calls that matter most for this track: **LLM reasoning calls** and **Razorpay payment operations**. Traces are visualized in Jaeger.

| Screenshot | What it shows |
|---|---|
| `docs/traces/trace-01-groq-upsell-bottleneck-18s.png` | A real 18.72s trace where the `groq.upsell_reasoning` span alone accounted for 16.45s |
| `docs/traces/trace-02-groq-429-error-detail.png` | The root cause of the above: a `429` rate-limit response from Groq, captured directly in the span |
| `docs/traces/trace-03-razorpay-create-order-checkout.png` | A normal chat checkout, with `razorpay.amount_paise` and `currency` attached as span attributes |
| `docs/traces/trace-04-razorpay-create-payment-link-autoorder.png` | The autonomous auto-order path creating a real Payment Link, alongside its own DB writes (`insert orders`, `insert auditlogs`, `update autoorderrules`) |

This wasn't a staged demonstration — tracing surfaced a genuine performance issue (LLM rate-limiting under a specific reasoning call) that wasn't otherwise visible from application logs alone.

---

## Failure Stories — What Broke, and How We Got Out

**1. Full tokenized autopay hit a real platform wall.**
We built the complete Razorpay recurring-payments flow — Customer creation, token-generating orders, the checkout consent screen — and it worked right up to the point where actually completing a recurring charge required full business KYC/account activation, which we deliberately hadn't done to keep the project safely in test mode. Rather than complete unnecessary KYC for a hackathon demo, we pivoted to **Razorpay Payment Links**: the agent still reasons and initiates the transaction autonomously, and the customer still only needs one tap to approve — achieving the same practical outcome through a mechanism that doesn't require live-account activation.

**2. The observability backend itself needed a pivot.**
Our first choice, SigNoz, hit a local storage initialization issue in its standalone Docker image, and SigNoz Cloud required a company email domain we didn't have. We switched to **Jaeger** — equally OpenTelemetry-native, equally standard — with zero change to our actual instrumentation code, since OpenTelemetry is vendor-neutral by design.

**3. Tracing found a real bug: Groq rate-limiting.**
Once tracing was live, we discovered an 18-second chat response caused by a `429` rate-limit error during upsell reasoning — a genuine performance issue we wouldn't have precisely diagnosed without distributed tracing.

**4. Express 5's routing syntax silently broke our production catch-all route.**
`app.get("*", ...)` — valid in Express 4 — throws at startup in Express 5's stricter path parser. Fixed with the new named-wildcard syntax, `app.get("/{*splat}", ...)`.

**5. Secure cookies silently failed over local HTTP during a production-mode test.**
Testing the combined production build locally over plain HTTP caused the browser to silently discard `secure: true` session cookies — no error, just an inexplicable auth bounce-back. Diagnosed by isolating the cookie security flag from `NODE_ENV`, into its own explicit `SECURE_COOKIES` variable.

**6. Azure's reverse proxy broke Google OAuth in production.**
Azure App Service terminates HTTPS at its own load balancer and forwards requests internally as HTTP, so Express reported the wrong protocol when building the OAuth redirect URI — causing a `redirect_uri_mismatch` against Google's registered callback. Fixed with `app.set("trust proxy", 1)`, so Express respects Azure's `X-Forwarded-Proto` header.

**7. A mid-project model deprecation.**
Groq deprecated `llama-3.3-70b-versatile` partway through development. Diagnosed from the exact API error and migrated to `openai/gpt-oss-120b`.

---

## Roadmap / Future Work

- Complete business KYC to enable full tokenized recurring payments (Spotify-style silent autopay)
