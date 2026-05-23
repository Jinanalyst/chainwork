import React from 'react'
import { Icon } from './ui.jsx'

const initials = (name) =>
  (name || '?').split(/\s+/).map((p) => p[0] || '').slice(0, 2).join('').toUpperCase()

const Pill = ({ tone = 'default', children }) => {
  const tones = {
    default: 'bg-white/[0.05] border-white/10 text-white/75',
    info:    'bg-brand-500/15 border-brand-400/30 text-brand-200',
    ok:      'bg-accent-500/15 border-accent-500/30 text-accent-300',
    warm:    'bg-amber-500/15 border-amber-400/30 text-amber-200',
  }
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] ${tones[tone]}`}>
      {children}
    </span>
  )
}

/**
 * Dark talent card used on the Talents page and (in compact mode) on the
 * post-task success page.
 */
export default function TalentCard({ talent, compact = false, onInvite, onView }) {
  return (
    <div className="card flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <div className={`shrink-0 h-12 w-12 rounded-2xl bg-gradient-to-br ${talent.accent} grid place-items-center text-base font-bold text-ink-950`}>
          {initials(talent.name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold leading-tight truncate">{talent.name}</h3>
            {talent.verified && (
              <Pill tone="ok"><Icon path={<path d="M5 12l4 4 10-10" />} className="h-3 w-3" /> Verified</Pill>
            )}
            {talent.topRated && <Pill tone="info">Top-rated</Pill>}
          </div>
          <div className="text-sm text-white/70 mt-0.5 truncate">{talent.role}</div>
          <div className="text-xs text-white/45 mt-0.5">{talent.location}</div>
        </div>
        <div className="text-right shrink-0">
          <div className="flex items-center gap-1 text-sm font-medium">
            <Icon path={<path d="M12 17.3l-6.2 3.7 1.6-7.1L2 9.2l7.2-.6L12 2l2.8 6.6 7.2.6-5.4 4.7 1.6 7.1z" />} className="h-3.5 w-3.5 text-amber-300" />
            {talent.rating.toFixed(1)}
          </div>
          <div className="text-[11px] text-white/45">{talent.reviews} reviews</div>
        </div>
      </div>

      {!compact && talent.about && (
        <p className="text-sm text-white/70 leading-relaxed">{talent.about}</p>
      )}

      <div className="grid grid-cols-3 gap-2 text-xs">
        <Stat label="From" value={`$${talent.startingPrice}`} />
        <Stat label="Hourly" value={`$${talent.hourlyRate}/h`} />
        <Stat label="Replies" value={talent.responseTime} />
      </div>

      <div className="flex flex-wrap gap-1">
        {talent.skills.slice(0, compact ? 4 : 6).map((s) => (
          <span key={s} className="text-[11px] text-white/80 bg-white/[0.04] border border-white/10 rounded-full px-2 py-0.5">{s}</span>
        ))}
        {talent.skills.length > (compact ? 4 : 6) && (
          <span className="text-[11px] text-white/45 px-1">+{talent.skills.length - (compact ? 4 : 6)} more</span>
        )}
      </div>

      <div className="flex items-center justify-between gap-2">
        <Pill tone={talent.availability === 'Available now' ? 'ok' : talent.availability === 'Limited' ? 'warm' : 'default'}>
          {talent.availability}
        </Pill>
        <div className="flex gap-2">
          {onView && (
            <button onClick={() => onView(talent)} className="btn-ghost !py-1.5 !px-3 text-xs">View</button>
          )}
          {onInvite && (
            <button onClick={() => onInvite(talent)} className="btn-primary !py-1.5 !px-3 text-xs">
              Invite
              <Icon path={<path d="M5 12h14M13 5l7 7-7 7" />} className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

const Stat = ({ label, value }) => (
  <div className="rounded-lg bg-white/[0.03] border border-white/10 px-3 py-2">
    <div className="text-[10px] uppercase tracking-wider text-white/45">{label}</div>
    <div className="font-semibold mt-0.5">{value}</div>
  </div>
)
