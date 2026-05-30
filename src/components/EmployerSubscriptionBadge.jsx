import React, { useEffect, useState } from 'react'
import { Icon } from './ui.jsx'
import { getEmployerSubscription } from '../lib/platform.js'

/**
 * Shows the current user's ChainWork Verified Employer subscription status.
 * `variant`:
 *   - 'card' (default): full panel, for dashboards.
 *   - 'inline'        : compact pill, for nav / headers.
 *   - 'warm'          : light theme card for the warm (post-task) flow.
 *
 * Set `refreshKey` to re-fetch (e.g. after returning from checkout).
 */
export default function EmployerSubscriptionBadge({ variant = 'card', refreshKey = 0 }) {
  const [sub, setSub] = useState(undefined)

  useEffect(() => {
    let cancelled = false
    getEmployerSubscription().then((s) => { if (!cancelled) setSub(s) })
    return () => { cancelled = true }
  }, [refreshKey])

  if (sub === undefined) return null

  const warm = variant === 'warm'

  // ---- Inactive (never subscribed, expired, or cancelled) ------------------
  if (!sub || !sub.active) {
    if (variant === 'inline') return null
    const expired = sub && (sub.status === 'expired' || sub.status === 'cancelled')
    return (
      <div className={
        warm
          ? 'rounded-2xl border border-warm-ink/10 bg-white/70 backdrop-blur p-4 text-sm text-warm-ink/70'
          : 'rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/65'
      }>
        <div className="flex items-center gap-2 mb-1">
          <Icon path={<><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></>} className="h-4 w-4" />
          <span className="font-medium">
            {expired ? 'Verified Employer subscription expired' : 'No active Verified Employer subscription'}
          </span>
        </div>
        <div className={warm ? 'text-warm-ink/55 text-xs' : 'text-white/45 text-xs'}>
          Become a Verified Employer to post jobs and unlock employer features.
        </div>
      </div>
    )
  }

  // ---- Active --------------------------------------------------------------
  const expires = sub.expiresAt ? new Date(sub.expiresAt) : null
  const expiresFmt = expires
    ? expires.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : '—'

  if (variant === 'inline') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-accent-400/40 bg-accent-400/10 px-2.5 py-1 text-[11px] font-medium text-accent-100">
        <span className="h-1.5 w-1.5 rounded-full bg-accent-300" />
        Verified Employer
      </span>
    )
  }

  return (
    <div className={
      warm
        ? 'rounded-2xl border border-[#1e5be3]/30 bg-[#1e5be3]/[0.06] p-5'
        : 'rounded-2xl border border-accent-400/30 bg-gradient-to-br from-brand-700/30 via-ink-900 to-accent-600/20 p-5'
    }>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <span className={warm
          ? 'inline-flex items-center gap-1.5 rounded-full bg-[#1e5be3]/15 text-[#1e5be3] px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.15em]'
          : 'inline-flex items-center gap-1.5 rounded-full bg-accent-400/20 text-accent-200 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.15em]'}>
          <span className={warm ? 'h-1.5 w-1.5 rounded-full bg-[#1e5be3]' : 'h-1.5 w-1.5 rounded-full bg-accent-300'} />
          Verified Employer · Active
        </span>
        <Icon
          path={<><path d="M9 12l2 2 4-4" /><circle cx="12" cy="12" r="10" /></>}
          className={warm ? 'h-5 w-5 text-[#1e5be3]' : 'h-5 w-5 text-accent-300'}
        />
      </div>

      <div className={warm ? 'mt-4 text-sm text-warm-ink/70' : 'mt-4 text-sm text-white/70'}>
        Your annual subscription is active. You can post jobs and use all employer features.
      </div>

      <div className={warm ? 'mt-3 flex items-center justify-between text-xs text-warm-ink/55' : 'mt-3 flex items-center justify-between text-xs text-white/55'}>
        <span>Annual plan</span>
        <span>Renews {expiresFmt}</span>
      </div>
    </div>
  )
}
