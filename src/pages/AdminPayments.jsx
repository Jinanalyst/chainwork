import React, { useEffect, useState } from 'react'
import { Icon } from '../components/ui.jsx'
import { fetchPaymentProofs, setPaymentProofStatus, isCurrentUserAdmin } from '../lib/platform.js'

const STATUS_TABS = [
  { id: 'pending',  label: 'Pending'  },
  { id: 'verified', label: 'Verified' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'all',      label: 'All'      },
]

const STATUS_PILL = {
  pending:  'bg-amber-500/15 border-amber-500/40 text-amber-200',
  verified: 'bg-accent-500/15 border-accent-500/40 text-accent-200',
  rejected: 'bg-red-500/15 border-red-500/40 text-red-200',
}

const fmt = (iso) => {
  if (!iso) return '—'
  try { return new Date(iso).toLocaleString() } catch { return iso }
}

const explorerLink = (chain, hash) => {
  if (!hash) return null
  if (/tron/i.test(chain || '')) return `https://tronscan.org/#/transaction/${hash}`
  if (/base/i.test(chain || '')) return `https://basescan.org/tx/${hash}`
  return null
}

export default function AdminPayments() {
  const [allowed, setAllowed] = useState(null)
  const [tab, setTab]         = useState('pending')
  const [proofs, setProofs]   = useState([])
  const [loading, setLoading] = useState(false)
  const [noteDraft, setNoteDraft] = useState({})

  useEffect(() => { isCurrentUserAdmin().then(setAllowed) }, [])

  const refresh = async () => {
    setLoading(true)
    const rows = await fetchPaymentProofs(tab === 'all' ? {} : { status: tab })
    setProofs(rows)
    setLoading(false)
  }

  useEffect(() => { if (allowed) refresh() }, [allowed, tab])

  const act = async (id, status) => {
    const notes = noteDraft[id]
    const res = await setPaymentProofStatus(id, status, notes)
    if (!res.ok) { alert('Update failed: ' + (res.reason || 'unknown')); return }
    setNoteDraft((d) => { const n = { ...d }; delete n[id]; return n })
    refresh()
  }

  if (allowed === null) {
    return <div className="py-24 text-center text-white/50 text-sm">Loading…</div>
  }
  if (!allowed) {
    return (
      <div className="mx-auto max-w-xl px-6 py-24 text-center">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8">
          <div className="text-2xl font-semibold mb-2">Admins only</div>
          <p className="text-white/65 text-sm">
            Your account isn't flagged as an admin. Mark it with{' '}
            <code className="font-mono text-white">update public.profiles set is_admin = true where id = auth.uid();</code>
            {' '}in the Supabase SQL editor while signed in.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-white/45">Admin</div>
          <h1 className="text-2xl md:text-3xl font-semibold">Payment proofs</h1>
        </div>
        <button onClick={refresh} className="btn-ghost text-sm py-2 px-4">
          <Icon path={<><path d="M21 12a9 9 0 1 1-3.5-7.1" /><path d="M21 4v6h-6" /></>} className="h-4 w-4" />
          Refresh
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        {STATUS_TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={
              'rounded-full px-4 py-1.5 text-sm border transition ' +
              (tab === t.id
                ? 'bg-white text-ink-950 border-white'
                : 'border-white/15 text-white/70 hover:border-white/30')
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-12 text-center text-white/50 text-sm">Loading…</div>
      ) : proofs.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-center text-white/55 text-sm">
          No proofs in this view.
        </div>
      ) : (
        <div className="space-y-3">
          {proofs.map((p) => {
            const link = explorerLink(p.chain, p.tx_hash)
            const note = noteDraft[p.id] ?? (p.notes || '')
            return (
              <div key={p.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={'inline-flex items-center text-[11px] font-medium rounded-full border px-2 py-0.5 ' + (STATUS_PILL[p.status] || 'border-white/15 text-white/60')}>
                        {p.status}
                      </span>
                      <span className="text-[11px] uppercase tracking-[0.18em] text-white/50">{p.kind}</span>
                      <code className="font-mono text-sm font-semibold text-brand-200">{p.reference}</code>
                    </div>
                    <div className="mt-2 text-sm text-white/80">
                      <span className="text-white/55">Amount:</span> {p.amount_text || '—'}
                      <span className="text-white/30 mx-2">·</span>
                      <span className="text-white/55">Token:</span> {p.token || '—'}
                      <span className="text-white/30 mx-2">·</span>
                      <span className="text-white/55">Chain:</span> {p.chain || '—'}
                    </div>
                    <div className="mt-1 text-xs text-white/55 font-mono break-all">
                      tx: {link
                        ? <a href={link} target="_blank" rel="noreferrer" className="text-brand-300 hover:text-white underline">{p.tx_hash}</a>
                        : p.tx_hash}
                    </div>
                    {p.from_wallet && (
                      <div className="mt-1 text-xs text-white/55 font-mono break-all">
                        from: {p.from_wallet}
                      </div>
                    )}
                    {p.to_address && (
                      <div className="mt-1 text-xs text-white/45 font-mono break-all">
                        to: {p.to_address}
                      </div>
                    )}
                  </div>
                  <div className="text-right text-xs text-white/45 shrink-0">
                    <div>Submitted {fmt(p.created_at)}</div>
                    {p.verified_at && <div className="mt-1">Acted {fmt(p.verified_at)}</div>}
                    {p.user_id && (
                      <div className="mt-1 font-mono">user {p.user_id.slice(0, 8)}…</div>
                    )}
                  </div>
                </div>

                <div className="mt-4">
                  <textarea
                    rows={2}
                    placeholder="Admin notes (optional)…"
                    value={note}
                    onChange={(e) => setNoteDraft((d) => ({ ...d, [p.id]: e.target.value }))}
                    className="w-full rounded-xl bg-white/[0.04] border border-white/15 px-3 py-2 text-sm placeholder:text-white/35 focus:outline-none focus:border-brand-300"
                  />
                </div>

                <div className="mt-3 flex flex-wrap gap-2 justify-end">
                  {p.status !== 'verified' && (
                    <button
                      onClick={() => act(p.id, 'verified')}
                      className="inline-flex items-center gap-1.5 rounded-full bg-accent-500 hover:bg-accent-600 text-ink-950 font-semibold text-sm px-4 py-1.5"
                    >
                      <Icon path={<path d="M5 12l5 5L20 7" />} className="h-3.5 w-3.5" />
                      Mark verified
                    </button>
                  )}
                  {p.status !== 'rejected' && (
                    <button
                      onClick={() => act(p.id, 'rejected')}
                      className="inline-flex items-center gap-1.5 rounded-full bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-100 text-sm px-4 py-1.5"
                    >
                      Reject
                    </button>
                  )}
                  {p.status !== 'pending' && (
                    <button
                      onClick={() => act(p.id, 'pending')}
                      className="inline-flex items-center gap-1.5 rounded-full border border-white/15 hover:border-white/30 text-white/80 text-sm px-4 py-1.5"
                    >
                      Reset to pending
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
