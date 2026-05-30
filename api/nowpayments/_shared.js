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

// ChainWork Verified Employer — single flat annual plan.
// Priced in KRW; charged in USDT on BEP20 (NOWPayments converts at checkout).
export const ANNUAL_PRICE_KRW = 990000
export const PRICE_CURRENCY = 'krw'
export const PAY_CURRENCY = 'usdtbsc' // USDT (BEP20 / BSC)

// order_id convention shared by create-invoice (writer) and webhook (reader):
//   chainwork-sub:<user_uuid>
export function buildOrderId(userId) {
  return `chainwork-sub:${userId}`
}

const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i

// Recover { userId } from order_id/order_description.
export function parseOrder(body) {
  const haystack = `${body?.order_id || ''} ${body?.order_description || ''}`
  const userId = (haystack.match(UUID_RE) || [])[0] || null
  return { userId }
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
