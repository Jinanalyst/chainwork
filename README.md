# ChainWork

**Small tasks. Trusted workers. Flexible payments.**

A niche freelance marketplace for web-related work — landing pages, bug fixes, AI automation, Web3 projects, and digital launch support. Clients post tasks, workers send offers, and payments are held in escrow until the work is approved.

## Stack

- Vite + React 18
- Tailwind CSS
- Supabase (auth — Ethereum & Solana wallet sign-in via `signInWithWeb3`)

## Pages

- `/#/` — marketing home (hero, categories, how-it-works, two-sides, payments, CTA)
- `/#/post-task` — 5-step task posting wizard for hirers (auth-gated)
- `/#/worker` — worker dashboard: earnings, active tasks, payments, portfolio, experience (auth-gated)

## Local development

```bash
npm install
cp .env.example .env.local   # then paste your Supabase anon key
npm run dev
```

### Environment variables

| Key | Where | Description |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | client | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | client | Supabase anon / publishable key |
| `RESEND_API_KEY` | server | Resend secret key (`re_...`). Powers `/api/notify`. |
| `RESEND_FROM` | server | From-address, e.g. `ChainWork <notifications@yourdomain.com>`. Defaults to `onboarding@resend.dev` (test sender — only delivers to your own Resend account email until a domain is verified). |
| `NOTIFY_OVERRIDE_TO` | server | Optional. Redirects every notification to one address — handy for testing. |

The `VITE_*` vars are bundled into the client at build time. `RESEND_*` and `NOTIFY_*` are read by the Vercel function only and never reach the browser.

### Notifications

`/api/notify` is a Vercel serverless function that sends transactional emails through Resend. The store fires it after relevant mutations:

| Action | Recipient | Template |
| --- | --- | --- |
| Worker accepts an offer | Hirer | `offer_accepted` |
| Worker submits for review | Hirer | `submitted_for_review` |
| Hirer approves a milestone | Worker | `milestone_approved` |
| Hirer requests an adjustment | Worker | `adjustment_requested` |
| Either side sends a chat message | Other party | `new_message` |

Calls are fire-and-forget — UI never blocks on email delivery. In local Vite dev (`npm run dev`), the function isn't served; the helper logs a one-time warning and skips. Use `vercel dev` if you want to test the API locally.

In Supabase, enable **Auth → Providers → Web3** for both Ethereum and Solana, and add your dev/prod URLs to **Auth → URL Configuration**.

## Deploy

This is a standard Vite app — Vercel and Netlify both auto-detect it. Set the same two `VITE_*` env vars in the deployment dashboard.
