import React, { useEffect, useState } from 'react'
import { Icon } from './ui.jsx'
import { getProMembership } from '../lib/platform.js'

/**
 * Shows the current user's Pro membership status.
 * `variant`:
 *   - 'card' (default): full panel with progress bar, for dashboards.
 *   - 'inline'        : compact pill, for nav / headers.
 *   - 'warm'          : light theme card for the warm (post-task) flow.
 *
 * Set `refreshKey` to re-fetch (e.g. after a task is posted).
 */
export default function ProMembershipBadge({ variant = 'card', refreshKey = 0 }) {
  const [pro, setPro] = useState(undefined)

  useEffect(() => {
    let cancelled = false
    getProMembership().then((p) => { if (!cancelled) setPro(p) })
    return () => { cancelled = true }
  }, [refreshKey])

  if (pro === undefined) return null
  if (!pro || !pro.active) {
    if (variant === 'inline') return null
    return (
      <div className={
        variant === 'warm'
          ? 'rounded-2xl border border-warm-ink/10 bg-white/70 backdrop-blur p-4 text-sm text-warm-ink/70'
          : 'rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/65'
      }>
        <div className="flex items-center gap-2 mb-1">
          <Icon path={<><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></>} className="h-4 w-4" />
          <span className="font-medium">No active Pro membership</span>
        </div>
        <div className={variant === 'warm' ? 'text-warm-ink/55 text-xs' : 'text-white/45 text-xs'}>
          Activate Pro from the home page to unlock flat-fee hiring.
        </div>
      </div>
    )
  }

  const pct = pro.hiresIncluded > 0
    ? Math.min(100, Math.round((pro.hiresUsed / pro.hiresIncluded) * 100))
    : 0
  const expires = pro.expiresAt ? new Date(pro.expiresAt) : null
  const expiresFmt = expires ? expires.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—'

  if (variant === 'inline') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-accent-400/40 bg-accent-400/10 px-2.5 py-1 text-[11px] font-medium text-accent-100">
        <span className="h-1.5 w-1.5 rounded-full bg-accent-300" />
        Pro · {pro.hiresRemaining} / {pro.hiresIncluded} hires left
      </span>
    )
  }

  const warm = variant === 'warm'
  return (
    <div className={
      warm
        ? 'rounded-2xl border border-[#1e5be3]/30 bg-[#1e5be3]/[0.06] p-5'
        : 'rounded-2xl border border-accent-400/30 bg-gradient-to-br from-brand-700/30 via-ink-900 to-accent-600/20 p-5'
    }>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className={warm ? 'inline-flex items-center gap-1.5 rounded-full bg-[#1e5be3]/15 text-[#1e5be3] px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.15em]' : 'inline-flex items-center gap-1.5 rounded-full bg-accent-400/20 text-accent-200 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.15em]'}>
            <span className={warm ? 'h-1.5 w-1.5 rounded-full bg-[#1e5be3]' : 'h-1.5 w-1.5 rounded-full bg-accent-300'} />
            ChainWork Pro · Active
          </span>
        </div>
        <code className={warm ? 'font-mono text-xs text-warm-ink/65' : 'font-mono text-xs text-white/55'}>{pro.reference}</code>
      </div>

      <div className="mt-4 flex items-baseline gap-2">
        <span className={warm ? 'text-3xl font-bold tabular-nums text-warm-ink' : 'text-3xl font-bold tabular-nums text-white'}>
          {pro.hiresRemaining}
        </span>
        <span className={warm ? 'text-sm text-warm-ink/60' : 'text-sm text-white/60'}>
          of {pro.hiresIncluded} hires remaining
        </span>
      </div>

      <div className={warm ? 'mt-3 h-2 w-full rounded-full bg-warm-ink/10 overflow-hidden' : 'mt-3 h-2 w-full rounded-full bg-white/10 overflow-hidden'}>
        <div
          className={warm ? 'h-full bg-[#1e5be3] transition-all' : 'h-full bg-gradient-to-r from-brand-300 to-accent-300 transition-all'}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className={warm ? 'mt-2 flex items-center justify-between text-xs text-warm-ink/55' : 'mt-2 flex items-center justify-between text-xs text-white/55'}>
        <span>{pro.hiresUsed} used</span>
        <span>Renews {expiresFmt}</span>
      </div>
    </div>
  )
}
