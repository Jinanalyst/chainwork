/**
 * Shared helpers for the Talent Reward Program endpoints.
 * Server-only: reads secrets from process.env, never bundled to the browser.
 *
 * Reuses the service-role Supabase client + JSON helpers from the NOWPayments
 * module (single source of truth for the service-role connection), and adds
 * reward-specific auth + period helpers.
 *
 * Env:
 *   REWARDS_CRON_SECRET   shared secret; callers send it as
 *                         `Authorization: Bearer <secret>` or `x-cron-secret`.
 *   SUPABASE_URL | VITE_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY   bypasses RLS; required for the engine RPCs.
 */

import crypto from 'node:crypto'

export { getSupabase, sendJson, readJsonBody } from '../nowpayments/_shared.js'

function secretsMatch(provided, secret) {
  const a = Buffer.from(String(provided), 'utf8')
  const b = Buffer.from(String(secret), 'utf8')
  if (a.length !== b.length) return false
  try { return crypto.timingSafeEqual(a, b) } catch { return false }
}

// Constant-time check of the cron/admin secret. Accepts either REWARDS_CRON_SECRET
// (external POST schedulers) or CRON_SECRET (Vercel Cron auto-sends this as a
// Bearer token). Returns false when no secret is configured (fail closed) or the
// request carries none / a mismatched one.
export function isAuthorized(req) {
  const secrets = [process.env.REWARDS_CRON_SECRET, process.env.CRON_SECRET].filter(Boolean)
  if (!secrets.length) return false

  const auth = req.headers['authorization'] || ''
  const bearer = auth.startsWith('Bearer ') ? auth.slice(7) : null
  const provided = bearer || req.headers['x-cron-secret'] || null
  if (!provided) return false

  return secrets.some((s) => secretsMatch(provided, s))
}

const pad = (n) => String(n).padStart(2, '0')
const isoDate = (d) => d.toISOString().slice(0, 10)

// Previous *complete* calendar month — the safe default for a monthly run.
// (Running rewards for the current, in-progress month would snapshot partial
// revenue.) Returns { period: 'YYYY-MM', start: 'YYYY-MM-DD', end: 'YYYY-MM-DD' }
// where end is the inclusive last day of that month.
export function previousMonthPeriod(now = new Date()) {
  const y = now.getUTCFullYear()
  const m = now.getUTCMonth() // 0..11 (current month)
  const start = new Date(Date.UTC(y, m - 1, 1)) // first day of previous month
  const end = new Date(Date.UTC(y, m, 0))       // day 0 of current = last day of previous
  return {
    period: `${start.getUTCFullYear()}-${pad(start.getUTCMonth() + 1)}`,
    start: isoDate(start),
    end: isoDate(end),
  }
}

// Resolve the reward window from a request body. Explicit period/start/end win;
// otherwise default to the previous complete month.
export function resolvePeriod(body) {
  if (body && body.period && body.start && body.end) {
    return { period: String(body.period), start: String(body.start), end: String(body.end) }
  }
  return previousMonthPeriod()
}
