import React, { useState } from 'react'

/**
 * <NowPaymentsCheckoutButton />
 *
 * Starts a ChainWork Pro purchase via NOWPayments. Calls
 * /api/nowpayments/create-invoice with the signed-in user + chosen hire count,
 * then redirects the browser to the hosted NOWPayments checkout. When the
 * payment reaches "finished", the IPN webhook activates Pro automatically.
 *
 *   userId:      string  — required; the buyer (used to attribute the payment)
 *   hires:       number  — plan size; webhook grants this many hires
 *   amountUsd:   number  — display-only total (server recomputes authoritatively)
 *   description: string  — display-only label
 */
export default function NowPaymentsCheckoutButton({ userId, hires, amountUsd, description }) {
  const [busy, setBusy]   = useState(false)
  const [error, setError] = useState('')

  if (!userId) {
    return (
      <div className="rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
        Sign in to purchase ChainWork Pro.
      </div>
    )
  }

  const start = async () => {
    setBusy(true); setError('')
    try {
      const res = await fetch('/api/nowpayments/create-invoice', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, hires }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data?.invoice_url) {
        throw new Error(data?.message || data?.error || `checkout failed (${res.status})`)
      }
      // Hand off to the NOWPayments hosted checkout.
      window.location.href = data.invoice_url
    } catch (e) {
      setError(e?.message || 'Could not start checkout.')
      setBusy(false)
    }
  }

  return (
    <div className="w-full">
      <button
        onClick={start}
        disabled={busy}
        className="btn-primary w-full justify-center disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {busy
          ? 'Starting checkout…'
          : `Pay with crypto${typeof amountUsd === 'number' ? ` · USD ${amountUsd.toFixed(2)}` : ''}`}
      </button>
      {description && (
        <p className="mt-2 text-[10px] text-white/40 leading-relaxed">{description}</p>
      )}
      {error && (
        <div className="mt-2 rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-100">
          {error}
        </div>
      )}
    </div>
  )
}
