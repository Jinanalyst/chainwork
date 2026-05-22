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

| Key | Description |
| --- | --- |
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon / publishable key |

In Supabase, enable **Auth → Providers → Web3** for both Ethereum and Solana, and add your dev/prod URLs to **Auth → URL Configuration**.

## Deploy

This is a standard Vite app — Vercel and Netlify both auto-detect it. Set the same two `VITE_*` env vars in the deployment dashboard.
