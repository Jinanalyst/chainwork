/**
 * Shared helpers + constants for the NOWPayments endpoints.
 * Server-only: reads secrets from process.env, never bundled to the browser.
 *
 * Env:
 *   NOWPAYMENTS_API_KEY            REST API key (create-invoice)
 *   NOWPAYMENTS_IPN_SECRET         IPN signing secret (webhook)
 *   NOWPAYMENTS_IPN_CALLBACK_URL   Optional explicit IPN URL; otherwise derived
 *                                  from the incoming request host.
 *   SUPABASE_URL | VITE_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY      bypasses RLS for server writes
 */

export const NOWPAYMENTS_API_BASE = 'https://api.nowpayments.io/v1'

// ChainWork Pro pricing. Keep in sync with src/App.jsx (PRICE_PER_HIRE_USD).
export const PRICE_PER_HIRE_USD = 100
export const MIN_HIRES = 1
export const MAX_HIRES = 100

export function clampHires(n) {
  const v = Math.round(Number(n))
  if (!Number.isFinite(v)) return MIN_HIRES
  return Math.max(MIN_HIRES, Math.min(MAX_HIRES, v))
}

export function hiresFromAmount(amountUsd) {
  return clampHires(Number(amountUsd) / PRICE_PER_HIRE_USD)
}

// order_id convention shared by create-invoice (writer) and webhook (reader):
//   chainwork:<user_uuid>:<hires>
export function buildOrderId(userId, hires) {
  return `chainwork:${userId}:${clampHires(hires)}`
}

const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i

// Recover { userId, hires } from order_id/order_description. hires is null when
// not explicitly encoded, leaving the caller to derive it from the amount.
export function parseOrder(body) {
  const haystack = `${body?.order_id || ''} ${body?.order_description || ''}`
  const userId = (haystack.match(UUID_RE) || [])[0] || null
  const explicit = (String(body?.order_id || '').match(/(?::|[-_]?N)(\d{1,3})\b/i) || [])[1]
  const hires = explicit ? clampHires(explicit) : null
  return { userId, hires }
}

export function sendJson(res, status, payload) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.end(JSON.stringify(payload))
}

// Read the body as a parsed object (Vercel usually pre-parses JSON), falling
// back to streaming the raw text.
export function readJsonBody(req) {
  if (req.body && typeof req.body === 'object') return Promise.resolve(req.body)
  if (typeof req.body === 'string') {
    try { return Promise.resolve(JSON.parse(req.body)) } catch { return Promise.resolve(null) }
  }
  return new Promise((resolve) => {
    let raw = ''
    req.on('data', (c) => { raw += c })
    req.on('end', () => { try { resolve(raw ? JSON.parse(raw) : null) } catch { resolve(null) } })
    req.on('error', () => resolve(null))
  })
}

// Best-effort IPN callback URL: explicit env wins, else derive from the request.
export function ipnCallbackUrl(req) {
  if (process.env.NOWPAYMENTS_IPN_CALLBACK_URL) return process.env.NOWPAYMENTS_IPN_CALLBACK_URL
  const host = req.headers['x-forwarded-host'] || req.headers.host
  if (!host) return null
  const proto = req.headers['x-forwarded-proto'] || 'https'
  return `${proto}://${host}/api/nowpayments/webhook`
}

// Lazy service-role Supabase client (null if not configured).
let _supabasePromise = null
export function getSupabase() {
  if (_supabasePromise) return _supabasePromise
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return Promise.resolve(null)
  _supabasePromise = import('@supabase/supabase-js')
    .then(({ createClient }) =>
      createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }))
    .catch(() => null)
  return _supabasePromise
}
