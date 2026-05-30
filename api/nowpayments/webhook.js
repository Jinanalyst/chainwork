import crypto from 'node:crypto'
import {
  sendJson,
  readJsonBody,
  getSupabase,
  parseOrder,
} from './_shared.js'

/**
 * POST /api/nowpayments/webhook
 *
 * NOWPayments IPN (Instant Payment Notification) receiver for ChainWork.
 *
 * Flow:
 *   1. Verify the `x-nowpayments-sig` header (HMAC-SHA512 of the JSON body with
 *      keys sorted recursively, signed with NOWPAYMENTS_IPN_SECRET).
 *   2. Upsert the payment into the Supabase `payments` table (keyed on the
 *      NOWPayments payment_id, so retries are idempotent).
 *   3. On `finished`, activate the buyer's ChainWork Verified Employer
 *      subscription by upserting an `employer_subscriptions` row (status=active,
 *      expires_at = now + 1 year, keyed on the NOWPayments payment_id). The
 *      employer_subscription_status RPC then reports the user as active.
 *
 * Always returns JSON. Signature/secret problems return 4xx; transient DB
 * failures return 5xx so NOWPayments retries. Successful handling returns 200.
 */

// NOWPayments status -> our payments.status CHECK set (see 0015/0021 migrations).
const STATUS_MAP = {
  waiting: 'pending',
  confirming: 'pending',
  confirmed: 'pending',
  sending: 'pending',
  partially_paid: 'pending',
  finished: 'paid',
  failed: 'failed',
  refunded: 'refunded',
  expired: 'failed',
}

// NOWPayments signs the HMAC over the JSON body with keys sorted alphabetically
// at every level. Reproduce that canonical form from the parsed object.
function sortedStringify(value) {
  if (Array.isArray(value)) return `[${value.map(sortedStringify).join(',')}]`
  if (value && typeof value === 'object') {
    const keys = Object.keys(value).sort()
    return `{${keys.map((k) => `${JSON.stringify(k)}:${sortedStringify(value[k])}`).join(',')}}`
  }
  return JSON.stringify(value === undefined ? null : value)
}

function verifySignature(body, signature, secret) {
  if (!signature || typeof signature !== 'string') return false
  const expected = crypto
    .createHmac('sha512', secret)
    .update(sortedStringify(body))
    .digest('hex')
  const a = Buffer.from(expected, 'utf8')
  const b = Buffer.from(signature, 'utf8')
  if (a.length !== b.length) return false
  try { return crypto.timingSafeEqual(a, b) } catch { return false }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'method_not_allowed' })
  }

  const secret = process.env.NOWPAYMENTS_IPN_SECRET
  if (!secret) {
    console.error('[nowpayments/webhook] NOWPAYMENTS_IPN_SECRET is not set')
    return sendJson(res, 500, { error: 'ipn_secret_not_configured' })
  }

  const body = await readJsonBody(req)
  if (!body || typeof body !== 'object') {
    return sendJson(res, 400, { error: 'invalid_body' })
  }

  // ---- 1. Verify signature -------------------------------------------------
  const signature = req.headers['x-nowpayments-sig']
  if (!verifySignature(body, signature, secret)) {
    console.warn('[nowpayments/webhook] signature verification failed')
    return sendJson(res, 401, { error: 'invalid_signature' })
  }

  // ---- 2. Parse the payment ------------------------------------------------
  const paymentId = body.payment_id != null ? String(body.payment_id) : null
  const rawStatus = String(body.payment_status || '').toLowerCase()
  const dbStatus = STATUS_MAP[rawStatus]

  if (!paymentId) {
    return sendJson(res, 400, { error: 'missing_payment_id' })
  }
  if (!dbStatus) {
    // Acknowledge so NOWPayments stops retrying, but record that we ignored it.
    console.warn(`[nowpayments/webhook] unhandled status "${rawStatus}" for ${paymentId}`)
    return sendJson(res, 200, { ok: true, ignored: true, status: rawStatus })
  }

  const priceAmount = body.price_amount != null ? Number(body.price_amount) : null
  const priceCurrency = body.price_currency ? String(body.price_currency).toUpperCase() : null
  const { userId } = parseOrder(body)

  // ---- 3. Upsert the payment row -------------------------------------------
  const sb = await getSupabase()
  if (!sb) {
    console.error('[nowpayments/webhook] Supabase service role not configured')
    return sendJson(res, 500, { error: 'supabase_not_configured' })
  }

  const patch = {
    provider: 'nowpayments',
    nowpayments_payment_id: paymentId,
    payment_type: 'employer_subscription',
    amount: priceAmount,
    currency: priceCurrency,
    status: dbStatus,
    updated_at: new Date().toISOString(),
    metadata: {
      nowpayments_status: rawStatus,
      pay_currency: body.pay_currency || null,
      pay_address: body.pay_address || null,
      pay_amount: body.pay_amount ?? null,
      actually_paid: body.actually_paid ?? null,
      outcome_amount: body.outcome_amount ?? null,
      outcome_currency: body.outcome_currency || null,
      payin_hash: body.payin_hash || null,
      order_id: body.order_id || null,
      order_description: body.order_description || null,
      purchase_id: body.purchase_id != null ? String(body.purchase_id) : null,
    },
  }
  // Only set user_id when we actually recovered one, so a later event can't null
  // out a user_id captured by an earlier one.
  if (userId) patch.user_id = userId

  const { error: upErr } = await sb
    .from('payments')
    .upsert(patch, { onConflict: 'nowpayments_payment_id' })
  if (upErr) {
    console.error('[nowpayments/webhook] payments upsert failed:', upErr.message)
    return sendJson(res, 500, { error: 'payment_write_failed' })
  }

  // ---- 4. Activate Verified Employer subscription on finished --------------
  let subscriptionActivated = false
  if (rawStatus === 'finished') {
    if (!userId) {
      // Payment recorded, but we can't attribute it. Surface loudly; an admin
      // can reconcile from metadata.order_id. Don't 500 — the payment is real.
      console.warn(`[nowpayments/webhook] finished payment ${paymentId} has no user_id; subscription not activated`)
    } else {
      const now = new Date()
      const expiresAt = new Date(now)
      expiresAt.setFullYear(expiresAt.getFullYear() + 1)

      const subscription = {
        user_id: userId,
        status: 'active',
        started_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
        // Keyed on payment_id so duplicate finished events upsert instead of
        // inserting a second subscription.
        payment_id: paymentId,
      }

      const { error: subErr } = await sb
        .from('employer_subscriptions')
        .upsert(subscription, { onConflict: 'payment_id' })
      if (subErr) {
        console.error('[nowpayments/webhook] subscription activation failed:', subErr.message)
        return sendJson(res, 500, { error: 'subscription_activation_failed' })
      }
      subscriptionActivated = true
    }
  }

  return sendJson(res, 200, {
    ok: true,
    payment_id: paymentId,
    status: dbStatus,
    nowpayments_status: rawStatus,
    subscription_activated: subscriptionActivated,
  })
}
