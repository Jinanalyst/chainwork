import {
  getSupabase,
  sendJson,
  readJsonBody,
  isAuthorized,
  resolvePeriod,
} from './_shared.js'

/**
 * GET | POST /api/rewards/run
 *
 * Drives the Talent Reward pipeline using the service-role RPCs from
 * 0025_talent_rewards.sql (which are granted to service_role only). Intended to
 * be called by a scheduler or an admin tool. GET is supported so a Vercel Cron
 * (which only issues GET) can trigger the default monthly run; POST is used by
 * external schedulers / admin tools that pass a JSON body.
 *
 * Auth: send REWARDS_CRON_SECRET (or Vercel's CRON_SECRET) as
 * `Authorization: Bearer <secret>` or `x-cron-secret`. Unauthorized callers get 401.
 *
 * Body (all optional):
 *   action          'run' (default) | 'recompute' | 'fund' | 'compute' | 'finalize'
 *   period          e.g. '2026-05' or 'Q1-2026'   (defaults to previous month)
 *   start, end      'YYYY-MM-DD' window bounds      (defaults to previous month)
 *   allocation_pct  % of revenue -> pool            (default 10)
 *   finalize        boolean — when action='run', also finalize (freeze) the pool
 *   skip_recompute  boolean — when action='run', skip the rank recompute step
 *   pool_id         required for 'compute' / 'finalize' when run standalone
 *
 * 'run' orchestrates: recompute ranks -> fund pool -> compute shares
 * -> (optionally) finalize. It leaves the pool in 'draft' by default so an admin
 * can review the distribution before the irreversible finalize. Always JSON.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return sendJson(res, 405, { error: 'method_not_allowed' })
  }
  if (!isAuthorized(req)) {
    return sendJson(res, 401, { error: 'unauthorized' })
  }

  const sb = await getSupabase()
  if (!sb) {
    console.error('[rewards/run] Supabase service role not configured')
    return sendJson(res, 500, { error: 'supabase_not_configured' })
  }

  // GET (Vercel Cron) carries params in the query string; POST in a JSON body.
  // Query values are always strings, so flags are matched loosely below.
  const body = req.method === 'GET' ? (req.query || {}) : ((await readJsonBody(req)) || {})
  const isTrue = (v) => v === true || v === 'true' || v === '1'
  const action = String(body.action || 'run')

  // Small wrapper so every RPC failure becomes a clean 500 with the PG message.
  const rpc = async (fn, args) => {
    const { data, error } = await sb.rpc(fn, args)
    if (error) {
      const e = new Error(error.message)
      e.fn = fn
      throw e
    }
    return data
  }

  try {
    // ---- standalone actions -------------------------------------------------
    if (action === 'recompute') {
      const count = await rpc('recompute_all_talents', {})
      return sendJson(res, 200, { ok: true, action, talents_recomputed: count })
    }

    if (action === 'compute' || action === 'finalize') {
      const poolId = body.pool_id
      if (!poolId) return sendJson(res, 400, { error: 'pool_id_required' })
      if (action === 'compute') await rpc('compute_reward_distribution', { p_pool_id: poolId })
      else await rpc('finalize_reward_pool', { p_pool_id: poolId })
      return sendJson(res, 200, { ok: true, action, ...(await summarize(sb, poolId)) })
    }

    // ---- fund (and 'run') need a window + allocation ------------------------
    const { period, start, end } = resolvePeriod(body)
    const allocationPct = body.allocation_pct != null ? Number(body.allocation_pct) : 10

    if (action === 'fund') {
      const poolId = await rpc('fund_reward_pool', {
        p_period: period, p_start: start, p_end: end, p_allocation_pct: allocationPct,
      })
      return sendJson(res, 200, { ok: true, action, period, ...(await summarize(sb, poolId)) })
    }

    if (action !== 'run') {
      return sendJson(res, 400, { error: 'unknown_action', action })
    }

    // ---- run: recompute -> fund -> compute -> (finalize?) -------------------
    let talentsRecomputed = null
    if (!isTrue(body.skip_recompute)) {
      talentsRecomputed = await rpc('recompute_all_talents', {})
    }

    const poolId = await rpc('fund_reward_pool', {
      p_period: period, p_start: start, p_end: end, p_allocation_pct: allocationPct,
    })
    await rpc('compute_reward_distribution', { p_pool_id: poolId })

    const willFinalize = isTrue(body.finalize)
    if (willFinalize) {
      await rpc('finalize_reward_pool', { p_pool_id: poolId })
    }

    return sendJson(res, 200, {
      ok: true,
      action,
      period,
      talents_recomputed: talentsRecomputed,
      finalized: willFinalize,
      ...(await summarize(sb, poolId)),
    })
  } catch (err) {
    console.error(`[rewards/run] ${err.fn || 'rpc'} failed:`, err.message)
    return sendJson(res, 500, { error: 'pipeline_failed', detail: err.message, fn: err.fn })
  }
}

// Read back the pool + a distribution summary with the service-role client.
// (We can't use admin_reward_overview here — it gates on is_admin(auth.uid()),
// and the service role has no auth.uid().)
async function summarize(sb, poolId) {
  const { data: pool } = await sb
    .from('reward_pools')
    .select('id, period, revenue, allocation_pct, pool_amount, payout_currency, status, total_weight, finalized_at')
    .eq('id', poolId)
    .single()

  const { data: dist } = await sb
    .from('reward_distributions')
    .select('reward_amount')
    .eq('reward_pool_id', poolId)

  const recipients = dist ? dist.length : 0
  const distributed = (dist || []).reduce((s, r) => s + Number(r.reward_amount || 0), 0)

  return {
    pool_id: poolId,
    pool,
    recipients,
    distributed: Math.round(distributed * 100) / 100,
  }
}
