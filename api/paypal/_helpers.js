/**
 * Shared helpers for PayPal Sandbox/Live integration on Vercel Functions.
 *
 * Reads ONLY from process.env — secrets never reach the browser bundle.
 *
 *   PAYPAL_MODE             "sandbox" | "live"  (default: sandbox)
 *   PAYPAL_CLIENT_ID        Public client id (server-side reference)
 *   PAYPAL_CLIENT_SECRET    SECRET — server only, never exposed
 *   PAYPAL_API_BASE         Override base URL (optional)
 *   NEXT_PUBLIC_PAYPAL_CLIENT_ID  Mirror of CLIENT_ID for frontend (optional)
 */

const SANDBOX_BASE = 'https://api-m.sandbox.paypal.com'
const LIVE_BASE    = 'https://api-m.paypal.com'

export const PAYPAL_MODE = (process.env.PAYPAL_MODE || 'sandbox').toLowerCase()

export function paypalBase() {
  const explicit = process.env.PAYPAL_API_BASE
  if (explicit) return explicit.replace(/\/+$/, '')
  return PAYPAL_MODE === 'live' ? LIVE_BASE : SANDBOX_BASE
}

export function publicClientId() {
  return (
    process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ||
    process.env.PAYPAL_CLIENT_ID ||
    ''
  )
}

export function assertServerCreds() {
  const id     = process.env.PAYPAL_CLIENT_ID
  const secret = process.env.PAYPAL_CLIENT_SECRET
  if (!id || !secret) {
    const missing = [!id && 'PAYPAL_CLIENT_ID', !secret && 'PAYPAL_CLIENT_SECRET']
      .filter(Boolean).join(', ')
    const err = new Error(`Missing PayPal credentials: ${missing}`)
    err.status = 500
    err.code = 'paypal_missing_credentials'
    throw err
  }
  return { id, secret }
}

// Cache the access token in module scope. PayPal tokens last ~9h; we refresh
// 5 minutes before expiry to keep the next request snappy.
let _tokenCache = { value: null, exp: 0 }

export async function getAccessToken() {
  const now = Date.now()
  if (_tokenCache.value && _tokenCache.exp > now + 60_000) return _tokenCache.value

  const { id, secret } = assertServerCreds()
  const auth = Buffer.from(`${id}:${secret}`).toString('base64')

  const res = await fetch(`${paypalBase()}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    const err = new Error(`PayPal token request failed (${res.status}): ${text.slice(0, 200)}`)
    err.status = 502
    err.code = 'paypal_token_failed'
    throw err
  }
  const data = await res.json()
  _tokenCache = {
    value: data.access_token,
    exp: now + (data.expires_in || 600) * 1000 - 300_000,
  }
  return _tokenCache.value
}

export async function paypalFetch(path, init = {}) {
  const token = await getAccessToken()
  const res = await fetch(`${paypalBase()}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init.headers || {}),
    },
  })
  const text = await res.text()
  let body
  try { body = text ? JSON.parse(text) : null } catch { body = { raw: text } }
  if (!res.ok) {
    const err = new Error(body?.message || `PayPal API error (${res.status})`)
    err.status = res.status >= 400 && res.status < 500 ? res.status : 502
    err.code   = body?.name || 'paypal_api_error'
    err.body   = body
    throw err
  }
  return body
}

// ---- Supabase service-role client (optional) ---------------------------------
// We try to record payments to Supabase if SUPABASE_SERVICE_ROLE_KEY is set.
// We import lazily so the API still works without Supabase installed/configured.
let _supabasePromise = null
export function getSupabase() {
  if (_supabasePromise) return _supabasePromise
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return Promise.resolve(null)
  _supabasePromise = import('@supabase/supabase-js')
    .then(({ createClient }) => createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    }))
    .catch(() => null)
  return _supabasePromise
}

// ---- Validation --------------------------------------------------------------
const ALLOWED_PAYMENT_TYPES = new Set([
  'employer_pro_membership',
  'project_posting_fee',
  'platform_service_fee',
  'monthly_partner_contract',
  'work_service_payment',
  'featured_talent_listing',
  'business_matching_service',
])

const ALLOWED_CURRENCIES = new Set([
  'USD', 'EUR', 'GBP', 'JPY', 'KRW', 'AUD', 'CAD', 'SGD', 'HKD',
])

export function validateCreateOrder(input) {
  const errors = []
  const payment_type = String(input?.payment_type || '').trim()
  const currency     = String(input?.currency || 'USD').toUpperCase()
  const description  = String(input?.description || '').slice(0, 127)
  const amount       = Number(input?.amount)

  if (!ALLOWED_PAYMENT_TYPES.has(payment_type)) errors.push('invalid payment_type')
  if (!ALLOWED_CURRENCIES.has(currency))        errors.push('invalid currency')
  if (!Number.isFinite(amount) || amount <= 0)  errors.push('invalid amount')
  if (amount > 100_000)                         errors.push('amount exceeds max')

  // PayPal expects strings with the correct decimal precision per currency.
  // JPY has 0 decimals; everything else we support uses 2.
  const decimals = currency === 'JPY' ? 0 : 2
  const value = amount.toFixed(decimals)

  return { errors, payment_type, currency, description, amount, value }
}

export function readJsonBody(req) {
  if (req.body && typeof req.body === 'object') return Promise.resolve(req.body)
  if (typeof req.body === 'string') {
    try { return Promise.resolve(JSON.parse(req.body)) } catch { return Promise.resolve({}) }
  }
  return new Promise((resolve) => {
    let raw = ''
    req.on('data', (c) => { raw += c })
    req.on('end', () => {
      try { resolve(raw ? JSON.parse(raw) : {}) } catch { resolve({}) }
    })
    req.on('error', () => resolve({}))
  })
}

export function sendJson(res, status, payload) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.end(JSON.stringify(payload))
}
