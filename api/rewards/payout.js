import { NOWPAYMENTS_API_BASE } from '../nowpayments/_shared.js'
import {
  getSupabase,
  sendJson,
  readJsonBody,
  isAuthorized,
} from './_shared.js'

/**
 * POST /api/rewards/payout
 *
 * Pays out finalized Talent Reward distributions via the NOWPayments Mass
 * Payout API, flipping reward_distributions.payout_status pending -> sent
 * (or -> failed for unpayable rows). Idempotent: only 'pending' rows in
 * 'finalized' pools are processed, and each withdrawal carries the distribution
 * id as unique_external_id so a retry can't double-send.
 *
 * Auth: REWARDS_CRON_SECRET / CRON_SECRET as Bearer or x-cron-secret (401 otherwise).
 *
 * Body (all optional):
 *   pool_id            restrict to one finalized pool (default: all finalized)
 *   limit              max distributions to process this run (default 100)
 *   verification_code  TOTP code to auto-verify the payout batch(es) if the
 *                      NOWPayments account requires 2FA
 *
 * Env (server-only):
 *   NOWPAYMENTS_PAYOUT_API_KEY   payout API key (falls back to NOWPAYMENTS_API_KEY)
 *   NOWPAYMENTS_EMAIL            account email — for the JWT auth step
 *   NOWPAYMENTS_PASSWORD        account password — for the JWT auth step
 *   NOWPAYMENTS_PAYOUT_IPN_URL   optional explicit payout IPN callback URL
 *
 * NOTE: NOWPayments converts the KRW reward to the talent's stablecoin using
 * fiat_amount + fiat_currency, so no FX math happens here. Final settlement
 * confirmation arrives later via the payout IPN (a separate webhook); this
 * worker marks rows 'sent' on successful submission.
 */

const BATCH_SIZE = 50 // NOWPayments caps withdrawals per batch; chunk to be safe.

// Map a talent's (chain, token) to a NOWPayments currency ticker. Unknown
// combinations are skipped (marked failed) rather than guessed.
function nowpaymentsCurrency(chain, token) {
  const c = String(chain || '').toLowerCase()
  const t = String(token || 'USDT').toUpperCase()
  const chainKey =
    /bsc|bep20|binance/.test(c) ? 'bsc' :
    /eth|erc20/.test(c)         ? 'eth' :
    /tron|trc20/.test(c)        ? 'tron' :
    /polygon|matic/.test(c)     ? 'matic' :
    /base/.test(c)              ? 'base' :
    /sol/.test(c)               ? 'sol' :
    null
  if (!chainKey) return null

  const map = {
    'USDT:bsc': 'usdtbsc',  'USDC:bsc': 'usdcbsc',
    'USDT:eth': 'usdterc20', 'USDC:eth': 'usdc',
    'USDT:tron': 'usdttrc20', 'USDC:tron': 'usdctrc20',
    'USDT:matic': 'usdtmatic', 'USDC:matic': 'usdcmatic',
    'USDT:base': 'usdtbase', 'USDC:base': 'usdcbase',
    'USDT:sol': 'usdtsol',  'USDC:sol': 'usdcsol',
  }
  return map[`${t}:${chainKey}`] || null
}

// NOWPayments per-withdrawal statuses that mean "not sent" -> failed.
const FAILED_STATUSES = new Set(['REJECTED', 'FAILED'])

// ---- NOWPayments API calls -------------------------------------------------

async function npAuth(email, password) {
  const r = await fetch(`${NOWPAYMENTS_API_BASE}/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const data = await r.json().catch(() => ({}))
  if (!r.ok || !data?.token) {
    throw new Error(data?.message || `auth failed (${r.status})`)
  }
  return data.token
}

async function npCreatePayout(apiKey, token, withdrawals, ipnUrl) {
  const payload = { withdrawals }
  if (ipnUrl) payload.ipn_callback_url = ipnUrl
  const r = await fetch(`${NOWPAYMENTS_API_BASE}/payout`, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  const data = await r.json().catch(() => ({}))
  if (!r.ok || !data?.id) {
    throw new Error(data?.message || `payout failed (${r.status})`)
  }
  return data // { id, withdrawals: [{ id, status, unique_external_id, ... }] }
}

async function npVerify(apiKey, token, batchId, code) {
  const r = await fetch(`${NOWPAYMENTS_API_BASE}/payout/${batchId}/verify`, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ verification_code: String(code) }),
  })
  const data = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(data?.message || `verify failed (${r.status})`)
  return data
}

function payoutIpnUrl(req) {
  if (process.env.NOWPAYMENTS_PAYOUT_IPN_URL) return process.env.NOWPAYMENTS_PAYOUT_IPN_URL
  const host = req.headers['x-forwarded-host'] || req.headers.host
  if (!host) return null
  const proto = req.headers['x-forwarded-proto'] || 'https'
  return `${proto}://${host}/api/rewards/payout-webhook`
}

const chunk = (arr, n) => {
  const out = []
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n))
  return out
}

// ---- handler ---------------------------------------------------------------

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'method_not_allowed' })
  }
  if (!isAuthorized(req)) {
    return sendJson(res, 401, { error: 'unauthorized' })
  }

  const apiKey = process.env.NOWPAYMENTS_PAYOUT_API_KEY || process.env.NOWPAYMENTS_API_KEY
  const email = process.env.NOWPAYMENTS_EMAIL
  const password = process.env.NOWPAYMENTS_PASSWORD
  if (!apiKey || !email || !password) {
    console.error('[rewards/payout] NOWPayments payout credentials not configured')
    return sendJson(res, 500, { error: 'payout_not_configured' })
  }

  const sb = await getSupabase()
  if (!sb) {
    console.error('[rewards/payout] Supabase service role not configured')
    return sendJson(res, 500, { error: 'supabase_not_configured' })
  }

  const body = (await readJsonBody(req)) || {}
  const limit = Math.min(Math.max(Number(body.limit) || 100, 1), 500)

  try {
    // ---- 1. Which finalized pools are in scope? ----------------------------
    let poolQ = sb.from('reward_pools').select('id, payout_currency, status').eq('status', 'finalized')
    if (body.pool_id) poolQ = poolQ.eq('id', body.pool_id)
    const { data: pools, error: poolErr } = await poolQ
    if (poolErr) throw new Error(`pools read: ${poolErr.message}`)
    if (!pools?.length) return sendJson(res, 200, { ok: true, processed: 0, note: 'no finalized pools' })

    const poolById = new Map(pools.map((p) => [p.id, p]))
    const poolIds = pools.map((p) => p.id)

    // ---- 2. Pending distributions in those pools ---------------------------
    const { data: dists, error: distErr } = await sb
      .from('reward_distributions')
      .select('id, user_id, reward_pool_id, reward_amount')
      .eq('payout_status', 'pending')
      .in('reward_pool_id', poolIds)
      .limit(limit)
    if (distErr) throw new Error(`distributions read: ${distErr.message}`)
    if (!dists?.length) return sendJson(res, 200, { ok: true, processed: 0, note: 'nothing pending' })

    // ---- 3. Resolve payout destinations ------------------------------------
    const userIds = [...new Set(dists.map((d) => d.user_id))]
    const { data: profs, error: profErr } = await sb
      .from('profiles')
      .select('id, payout_address, payout_chain, payout_token')
      .in('id', userIds)
    if (profErr) throw new Error(`profiles read: ${profErr.message}`)
    const profById = new Map((profs || []).map((p) => [p.id, p]))

    // ---- 4. Build withdrawals; fail rows we can't pay ----------------------
    const withdrawals = []         // payable -> NOWPayments
    const failures = []            // { id, reason }
    for (const d of dists) {
      const pool = poolById.get(d.reward_pool_id)
      const prof = profById.get(d.user_id)
      const amount = Number(d.reward_amount)
      if (!(amount > 0)) { failures.push({ id: d.id, reason: 'zero_amount' }); continue }
      if (!prof?.payout_address) { failures.push({ id: d.id, reason: 'no_address' }); continue }
      const currency = nowpaymentsCurrency(prof.payout_chain, prof.payout_token)
      if (!currency) { failures.push({ id: d.id, reason: 'unsupported_currency' }); continue }
      withdrawals.push({
        address: prof.payout_address,
        currency,
        fiat_amount: amount,
        fiat_currency: String(pool.payout_currency || 'KRW').toLowerCase(),
        unique_external_id: d.id, // idempotency key on NOWPayments' side
        payout_description: 'ChainWork Talent Reward',
      })
    }

    // Mark unpayable rows failed so they don't loop forever (an admin can reset
    // them to 'pending' after fixing the payout address).
    for (const f of failures) {
      await sb.from('reward_distributions')
        .update({ payout_status: 'failed', payout_ref: `skipped:${f.reason}` })
        .eq('id', f.id)
    }

    if (!withdrawals.length) {
      return sendJson(res, 200, { ok: true, processed: 0, failed: failures.length, failures })
    }

    // ---- 5. Authenticate + submit batches ----------------------------------
    const token = await npAuth(email, password)
    const ipnUrl = payoutIpnUrl(req)
    let sent = 0
    let markedFailed = failures.length
    const batches = []

    for (const group of chunk(withdrawals, BATCH_SIZE)) {
      const batch = await npCreatePayout(apiKey, token, group, ipnUrl)
      batches.push(batch.id)

      // Optional 2FA verification when a code is supplied.
      let verified = false
      if (body.verification_code) {
        try { await npVerify(apiKey, token, batch.id, body.verification_code); verified = true }
        catch (e) { console.warn(`[rewards/payout] verify batch ${batch.id} failed: ${e.message}`) }
      }

      // Reconcile each withdrawal back to its distribution by unique_external_id.
      const byExt = new Map((batch.withdrawals || []).map((w) => [String(w.unique_external_id), w]))
      for (const w of group) {
        const resp = byExt.get(String(w.unique_external_id))
        const status = String(resp?.status || '').toUpperCase()
        const failed = FAILED_STATUSES.has(status)
        await sb.from('reward_distributions')
          .update({
            payout_status: failed ? 'failed' : 'sent',
            payout_ref: resp?.id ? String(resp.id) : `batch:${batch.id}`,
          })
          .eq('id', w.unique_external_id)
        if (failed) markedFailed++; else sent++
      }
      void verified
    }

    // ---- 6. Mark fully-paid pools 'paid' -----------------------------------
    const paidPools = []
    for (const poolId of poolIds) {
      const { count } = await sb
        .from('reward_distributions')
        .select('id', { count: 'exact', head: true })
        .eq('reward_pool_id', poolId)
        .eq('payout_status', 'pending')
      if ((count || 0) === 0) {
        await sb.from('reward_pools')
          .update({ status: 'paid', paid_at: new Date().toISOString() })
          .eq('id', poolId)
          .eq('status', 'finalized')
        paidPools.push(poolId)
      }
    }

    return sendJson(res, 200, {
      ok: true,
      processed: sent + markedFailed,
      sent,
      failed: markedFailed,
      batches,
      pools_marked_paid: paidPools,
      verification_required: !body.verification_code,
    })
  } catch (err) {
    console.error('[rewards/payout] error:', err.message)
    return sendJson(res, 500, { error: 'payout_failed', detail: err.message })
  }
}
