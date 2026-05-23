import React, { useState } from 'react'
import { Icon } from './ui.jsx'
import { PLATFORM_WALLETS, savePaymentProof } from '../lib/platform.js'

/**
 * Lets a hirer submit on-chain proof that they funded a reference.
 * theme: 'dark' (default) | 'warm'
 */
export default function PaymentProofForm({ reference, kind = 'task', amount, theme = 'dark', onSubmitted }) {
  const [token, setToken]   = useState(PLATFORM_WALLETS[0].id)
  const [txHash, setTxHash] = useState('')
  const [from, setFrom]     = useState('')
  const [submitted, setSubmitted] = useState(false)

  const warm = theme === 'warm'

  const submit = (e) => {
    e.preventDefault()
    const trimmed = txHash.trim()
    if (!trimmed) return
    const wallet = PLATFORM_WALLETS.find((w) => w.id === token)
    savePaymentProof({
      reference,
      kind,
      amount: amount || null,
      txHash: trimmed,
      fromWallet: from.trim() || null,
      token: wallet?.token,
      chain: wallet?.chain,
      toAddress: wallet?.address,
    })
    setSubmitted(true)
    onSubmitted?.({ reference, txHash: trimmed })
  }

  if (submitted) {
    return (
      <div className={
        warm
          ? 'rounded-2xl border border-emerald-500/40 bg-emerald-100/60 p-4 md:p-5 text-emerald-900'
          : 'rounded-2xl border border-accent-500/40 bg-accent-500/10 p-4 md:p-5 text-accent-100'
      }>
        <div className="flex items-start gap-3">
          <Icon path={<path d="M5 12l5 5L20 7" />} className="h-5 w-5 mt-0.5 shrink-0" />
          <div className="text-sm leading-relaxed">
            <div className="font-semibold">Proof submitted — verification pending.</div>
            <div className={warm ? 'text-emerald-900/75 mt-0.5' : 'text-accent-100/80 mt-0.5'}>
              We'll verify your tx hash on-chain and credit reference <code className="font-mono">{reference}</code> within 24h.
            </div>
          </div>
        </div>
      </div>
    )
  }

  const baseField = warm
    ? 'w-full rounded-xl bg-white border border-warm-ink/15 px-3 py-2 text-sm text-warm-ink placeholder:text-warm-ink/40 focus:outline-none focus:border-[#1e5be3]'
    : 'w-full rounded-xl bg-white/[0.04] border border-white/15 px-3 py-2 text-sm placeholder:text-white/35 focus:outline-none focus:border-brand-300'

  return (
    <form onSubmit={submit} className={
      warm
        ? 'rounded-2xl border border-warm-ink/10 bg-white/70 backdrop-blur p-5 md:p-6'
        : 'rounded-2xl border border-white/10 bg-white/[0.03] p-5'
    }>
      <div className={warm ? 'text-warm-ink' : ''}>
        <div className="flex items-center gap-2 mb-1">
          <Icon path={<><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></>} className="h-4 w-4" />
          <div className="font-semibold">Submit payment proof</div>
        </div>
        <p className={warm ? 'text-sm text-warm-ink/65' : 'text-sm text-white/65'}>
          After sending the funds, paste your transaction hash so we can verify it on-chain and credit reference <code className="font-mono">{reference}</code>.
        </p>
      </div>

      <div className="mt-4 grid sm:grid-cols-2 gap-3">
        <label className="block">
          <span className={warm ? 'text-[11px] uppercase tracking-[0.18em] text-warm-ink/55' : 'text-[11px] uppercase tracking-[0.18em] text-white/55'}>
            Token / chain
          </span>
          <select
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className={baseField + ' mt-1'}
          >
            {PLATFORM_WALLETS.map((w) => (
              <option key={w.id} value={w.id} className={warm ? 'text-warm-ink' : 'bg-ink-900'}>
                {w.token} · {w.chain}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className={warm ? 'text-[11px] uppercase tracking-[0.18em] text-warm-ink/55' : 'text-[11px] uppercase tracking-[0.18em] text-white/55'}>
            Your sending wallet (optional)
          </span>
          <input
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            placeholder="0x… or T…"
            className={baseField + ' mt-1 font-mono text-xs'}
          />
        </label>
      </div>

      <label className="block mt-3">
        <span className={warm ? 'text-[11px] uppercase tracking-[0.18em] text-warm-ink/55' : 'text-[11px] uppercase tracking-[0.18em] text-white/55'}>
          Transaction hash
        </span>
        <input
          required
          value={txHash}
          onChange={(e) => setTxHash(e.target.value)}
          placeholder="0x… or Tron tx id"
          className={baseField + ' mt-1 font-mono text-xs'}
        />
      </label>

      <div className={warm ? 'mt-3 text-[11px] text-warm-ink/55' : 'mt-3 text-[11px] text-white/55'}>
        Memo recommended: include <code className="font-mono">{reference}</code> in the tx memo (Tron) or transaction note.
      </div>

      <button
        type="submit"
        className={warm ? 'btn-primary mt-4 w-full justify-center' : 'btn-primary mt-4 w-full justify-center'}
      >
        Submit proof
      </button>
    </form>
  )
}
