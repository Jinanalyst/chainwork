import React, { useEffect, useState } from 'react'
import { Icon } from './ui.jsx'
import { fetchTaskWorkerPayout } from '../lib/payouts.js'

const CHAIN_LABEL = {
  ethereum: 'Ethereum',
  base:     'Base',
  polygon:  'Polygon',
  solana:   'Solana',
  tron:     'Tron (TRC20)',
}

const truncate = (s) => (s && s.length > 14 ? `${s.slice(0, 6)}…${s.slice(-6)}` : s || '')

/**
 * Shown to the hirer (or an admin) inside the task detail modal so they
 * know which address to send the payout to once they approve the work.
 * Backed by the task_worker_payout RPC, which only returns data when the
 * caller is authorized.
 */
export default function WorkerPayoutPanel({ taskId, workerName }) {
  const [loading, setLoading] = useState(true)
  const [payout, setPayout]   = useState(null)
  const [copied, setCopied]   = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetchTaskWorkerPayout(taskId)
      .then((p) => { if (!cancelled) setPayout(p) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [taskId])

  if (loading) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-xs text-white/55">
        Loading payout destination…
      </div>
    )
  }

  // Worker chose PayPal — give the hirer a copyable email so they can pay
  // direct via PayPal Sandbox after approving the work.
  if (payout && payout.payoutMethod === 'paypal' && payout.payoutPaypalEmail) {
    const copyEmail = async () => {
      try {
        await navigator.clipboard.writeText(payout.payoutPaypalEmail)
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      } catch {}
    }
    return (
      <div className="rounded-xl border border-accent-400/30 bg-accent-500/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <Icon path={<><path d="M7 4h7a4 4 0 0 1 0 8h-3l-1 8H6z" /></>} className="h-4 w-4 text-accent-200" />
          <div className="text-sm font-semibold text-accent-100">Send PayPal payout to</div>
        </div>
        <div className="mt-2 flex items-center justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-[0.18em] text-white/55">PayPal · USD</div>
            <code className="block mt-0.5 font-mono text-sm text-white truncate">{payout.payoutPaypalEmail}</code>
          </div>
          <button
            onClick={copyEmail}
            className="shrink-0 text-[11px] rounded-full border border-white/20 hover:border-white/40 px-2.5 py-1 text-white"
          >
            {copied ? 'Copied' : 'Copy email'}
          </button>
        </div>
        <div className="mt-2 text-[11px] text-white/55 leading-snug">
          Use the "Send Money" flow in PayPal — friends & family is for sandbox testing only.
        </div>
      </div>
    )
  }

  // Worker chose KRW bank settlement. ChainWork's PG handles the payout, so
  // the hirer never needs the account number — we just confirm it's ready.
  if (payout && payout.payoutMethod === 'bank' && payout.payoutBankName) {
    return (
      <div className="rounded-xl border border-brand-400/30 bg-brand-500/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <Icon path={<><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M3 11h18" /></>} className="h-4 w-4 text-brand-200" />
          <div className="text-sm font-semibold text-brand-100">KRW bank payout · 자동 정산</div>
        </div>
        <div className="mt-2 text-xs text-white/75 leading-relaxed">
          <strong>{workerName || 'The worker'}</strong> has set up KRW settlement
          ({payout.payoutBankName}{payout.payoutAccountHolder ? ` · 예금주 ${payout.payoutAccountHolder}` : ''}).
          ChainWork's PG settles automatically once you approve — no manual transfer needed.
        </div>
      </div>
    )
  }

  if (!payout || !payout.payoutAddress) {
    return (
      <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-100 leading-relaxed">
        <strong>{workerName || 'The worker'} hasn't set a payout destination yet.</strong> Ask them to add one in
        their Worker dashboard → Payments → Payout destination (KRW bank or crypto wallet) before you release funds.
      </div>
    )
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(payout.payoutAddress)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {}
  }

  return (
    <div className="rounded-xl border border-accent-400/30 bg-accent-500/10 px-4 py-3">
      <div className="flex items-center gap-2">
        <Icon path={<><path d="M12 19V5M5 12l7-7 7 7" /></>} className="h-4 w-4 text-accent-200" />
        <div className="text-sm font-semibold text-accent-100">Send payout to</div>
      </div>
      <div className="mt-2 flex items-center justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-[0.18em] text-white/55">
            {CHAIN_LABEL[payout.payoutChain] || payout.payoutChain || '—'}
            {payout.payoutToken ? <> · {payout.payoutToken}</> : null}
          </div>
          <code className="block mt-0.5 font-mono text-sm text-white truncate">{truncate(payout.payoutAddress)}</code>
        </div>
        <button
          onClick={copy}
          className="shrink-0 text-[11px] rounded-full border border-white/20 hover:border-white/40 px-2.5 py-1 text-white"
        >
          {copied ? 'Copied' : 'Copy address'}
        </button>
      </div>
      <div className="mt-2 text-[11px] text-white/55 leading-snug">
        Double-check the network before sending — only the worker's chosen chain will deliver funds.
      </div>
    </div>
  )
}
