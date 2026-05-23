import React, { useState } from 'react'
import { Icon } from './ui.jsx'
import { workerNet, fmtUSD, parseBudget } from '../lib/fees.js'

const initials = (n) =>
  (n || '?').split(/\s+/).map((p) => p[0] || '').slice(0, 2).join('').toUpperCase()

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

export default function OfferCard({ offer, onAccept, onDecline }) {
  const [confirming, setConfirming] = useState(false)
  const gross = parseBudget(offer.budget)
  const net   = workerNet(gross)

  const accept = async () => {
    if (!confirming) { setConfirming(true); return }
    await onAccept(offer)
  }

  return (
    <div className="card flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Pill tone="info">{offer.category}</Pill>
            <Pill>{offer.paymentStructure === 'fifty-fifty' ? '50 / 50' : 'Full'}</Pill>
            <span className="text-[11px] text-white/45">
              {offer.postedAgo ? `posted ${offer.postedAgo}` : 'New'}
              {offer.candidates ? <span> · {offer.candidates} candidates</span> : null}
            </span>
          </div>
          <h3 className="mt-2 font-semibold leading-tight">{offer.title}</h3>
        </div>
        <div className="text-right shrink-0">
          <div className="text-lg font-bold">{offer.budget}</div>
          <div className="text-[11px] text-white/45">Budget · gross</div>
          <div className="mt-1 text-xs text-accent-300 font-medium">{fmtUSD(net)} to you</div>
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm">
        <div className={`h-7 w-7 rounded-full grid place-items-center text-[10px] font-bold text-ink-950 bg-gradient-to-br from-brand-300 to-brand-500`}>
          {initials(offer.employer?.name)}
        </div>
        <span className="text-white/85">{offer.employer?.name}</span>
        <span className="text-white/45">·</span>
        <span className="text-white/65 truncate">{offer.employer?.company}</span>
      </div>

      {offer.description && (
        <p className="text-sm text-white/70 leading-relaxed line-clamp-3">{offer.description}</p>
      )}

      <div className="flex flex-wrap gap-1">
        {(offer.skills || []).slice(0, 6).map((s) => (
          <span key={s} className="text-[11px] text-white/80 bg-white/[0.04] border border-white/10 rounded-full px-2 py-0.5">{s}</span>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-lg bg-white/[0.03] border border-white/10 px-3 py-2">
          <div className="text-[10px] uppercase tracking-wider text-white/45">Deadline</div>
          <div className="font-medium mt-0.5">{offer.deadline || '—'}</div>
        </div>
        <div className="rounded-lg bg-white/[0.03] border border-white/10 px-3 py-2">
          <div className="text-[10px] uppercase tracking-wider text-white/45">Payment</div>
          <div className="font-medium mt-0.5">
            {offer.paymentStructure === 'fifty-fifty' ? '50% kickoff · 50% on approval' : '100% on approval'}
          </div>
        </div>
      </div>

      {confirming ? (
        <div className="rounded-xl border border-accent-500/30 bg-accent-500/[0.06] p-3">
          <div className="text-sm text-accent-100 mb-2">
            Accept this task? You'll be matched with <span className="font-semibold">{offer.employer?.name}</span> and a chat thread will open.
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setConfirming(false)} className="btn-ghost !py-1.5 !px-3 text-xs">Cancel</button>
            <button onClick={accept} className="btn-primary !py-1.5 !px-3 text-xs">
              <Icon path={<path d="M5 12l4 4 10-10" />} className="h-3.5 w-3.5" />
              Confirm accept
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <button onClick={accept} className="btn-primary !py-2 !px-4 text-sm">
            Accept offer
            <Icon path={<path d="M5 12l4 4 10-10" />} className="h-4 w-4" />
          </button>
          <button onClick={() => onDecline?.(offer)} className="btn-ghost !py-2 !px-4 text-sm">
            Decline
          </button>
        </div>
      )}
    </div>
  )
}
