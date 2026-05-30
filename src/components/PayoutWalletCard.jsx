import React, { useEffect, useState } from 'react'
import { Icon } from './ui.jsx'
import { useProfile } from '../hooks/useProfile.js'

const CHAINS = [
  { id: 'ethereum', label: 'Ethereum', token: 'USDC / USDT', regex: /^0x[a-fA-F0-9]{40}$/, hint: '0x… 42 chars' },
  { id: 'base',     label: 'Base',     token: 'USDC',         regex: /^0x[a-fA-F0-9]{40}$/, hint: '0x… 42 chars' },
  { id: 'polygon',  label: 'Polygon',  token: 'USDC / USDT',  regex: /^0x[a-fA-F0-9]{40}$/, hint: '0x… 42 chars' },
  { id: 'solana',   label: 'Solana',   token: 'USDC / USDT',  regex: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/, hint: 'Base58 32-44 chars' },
  { id: 'tron',     label: 'Tron',     token: 'USDT (TRC20)', regex: /^T[1-9A-HJ-NP-Za-km-z]{33}$/,   hint: 'Starts with T, 34 chars' },
]

const chainById = (id) => CHAINS.find((c) => c.id === id) || CHAINS[0]

const truncate = (s) => (s && s.length > 14 ? `${s.slice(0, 6)}…${s.slice(-6)}` : s || '')

/**
 * Card for setting where ChainWork sends a worker's earnings.
 *
 * Crypto-only: a stablecoin payout to an on-chain address (USDC / USDT on
 * Ethereum, Base, Polygon, Solana, or Tron). KRW bank settlement has been
 * retired while domestic regulation + PG approval are pending.
 */
export default function PayoutWalletCard() {
  const { profile, update } = useProfile()

  const [editing, setEditing] = useState(false)
  const [chain, setChain]     = useState('base')
  const [address, setAddress] = useState('')
  const [token, setToken]     = useState('USDC')

  const [busy, setBusy]   = useState(false)
  const [error, setError] = useState('')

  // Hydrate from the profile row.
  useEffect(() => {
    if (!profile) return
    setChain(profile.payout_chain   || 'base')
    setAddress(profile.payout_address || '')
    setToken(profile.payout_token   || 'USDC')
  }, [
    profile?.payout_chain,
    profile?.payout_address,
    profile?.payout_token,
  ])

  const savedWallet = profile?.payout_address

  const startEdit = () => { setEditing(true); setError('') }
  const cancel = () => {
    setEditing(false); setError('')
    if (profile) {
      setChain(profile.payout_chain   || 'base')
      setAddress(profile.payout_address || '')
      setToken(profile.payout_token   || 'USDC')
    }
  }

  const saveWallet = async () => {
    const trimmed = (address || '').trim()
    if (!trimmed) { setError('Paste a wallet address.'); return }
    const c = chainById(chain)
    if (!c.regex.test(trimmed)) {
      setError(`That doesn't look like a ${c.label} address (${c.hint}).`)
      return
    }
    setBusy(true); setError('')
    // Persist the wallet and clear any legacy bank fields so a stale value
    // doesn't sit on the row claiming to be active.
    const res = await update({
      payout_method:          'wallet',
      payout_address:         trimmed,
      payout_chain:           chain,
      payout_token:           token || null,
      payout_bank_name:       null,
      payout_account_holder:  null,
      payout_account_number:  null,
    })
    setBusy(false)
    if (!res.ok) { setError(res.error || 'Could not save.'); return }
    setEditing(false)
  }

  const clear = async () => {
    const msg = 'Remove your payout wallet? You won\'t receive payouts until you set a new one.'
    if (!confirm(msg)) return
    setBusy(true)
    const res = await update({
      payout_method:         null,
      payout_address:        null,
      payout_chain:          null,
      payout_token:          null,
      payout_bank_name:      null,
      payout_account_holder: null,
      payout_account_number: null,
    })
    setBusy(false)
    if (!res.ok) { alert('Could not remove: ' + (res.error || 'unknown')); return }
    setEditing(false)
  }

  const isSaved = !!savedWallet
  const savedLabel = savedWallet
    ? `Active · ${chainById(profile?.payout_chain).label}`
    : 'No payout wallet set'

  return (
    <div className="card">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl grid place-items-center text-white bg-gradient-to-br from-brand-400 to-accent-400">
            <Icon path={<><path d="M12 19V5M5 12l7-7 7 7" /></>} className="h-5 w-5" />
          </div>
          <div>
            <div className="font-semibold">Payout wallet</div>
            <div className="text-xs text-white/55">{savedLabel}</div>
          </div>
        </div>
        {!editing && isSaved && (
          <button onClick={startEdit} className="text-xs text-brand-300 hover:text-white">Change</button>
        )}
      </div>

      {/* Saved view — wallet */}
      {!editing && savedWallet && (
        <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-[0.18em] text-white/45">
              {chainById(profile.payout_chain).label} · {profile.payout_token || chainById(profile.payout_chain).token}
            </div>
            <code className="block mt-0.5 font-mono text-sm text-white/85 truncate">{truncate(savedWallet)}</code>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => { try { navigator.clipboard.writeText(savedWallet) } catch {} }}
              className="text-[11px] rounded-full border border-white/15 hover:border-white/35 px-2.5 py-1"
            >
              Copy
            </button>
            <button onClick={clear} className="text-[11px] text-rose-300 hover:text-rose-200">Remove</button>
          </div>
        </div>
      )}

      {/* Editor */}
      {(editing || !isSaved) && (
        <div className="mt-4 space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="text-[11px] uppercase tracking-[0.18em] text-white/55">Network</span>
              <select
                value={chain}
                onChange={(e) => setChain(e.target.value)}
                disabled={busy}
                className="mt-1 w-full rounded-xl bg-white/[0.04] border border-white/15 px-3 py-2 text-sm focus:outline-none focus:border-brand-300"
              >
                {CHAINS.map((c) => (
                  <option key={c.id} value={c.id} className="bg-ink-900">{c.label} ({c.token})</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-[11px] uppercase tracking-[0.18em] text-white/55">Preferred token</span>
              <select
                value={token}
                onChange={(e) => setToken(e.target.value)}
                disabled={busy}
                className="mt-1 w-full rounded-xl bg-white/[0.04] border border-white/15 px-3 py-2 text-sm focus:outline-none focus:border-brand-300"
              >
                <option value="USDC" className="bg-ink-900">USDC</option>
                <option value="USDT" className="bg-ink-900">USDT</option>
              </select>
            </label>
          </div>

          <label className="block">
            <span className="text-[11px] uppercase tracking-[0.18em] text-white/55">Wallet address ({chainById(chain).hint})</span>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={chain === 'tron' ? 'T…' : (chain === 'solana' ? '7Xy…3z9' : '0x…')}
              disabled={busy}
              className="mt-1 w-full rounded-xl bg-white/[0.04] border border-white/15 px-3 py-2 text-sm font-mono focus:outline-none focus:border-brand-300"
            />
          </label>

          <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-100 leading-relaxed">
            <strong>Double-check the network.</strong> Send only the chosen token on the chosen network — funds sent on the wrong chain may be lost.
          </div>

          {error && <div className="text-xs text-rose-300">{error}</div>}

          <div className="flex items-center gap-2 justify-end">
            {editing && (
              <button onClick={cancel} disabled={busy} className="text-sm text-white/60 hover:text-white px-3 py-1.5">
                Cancel
              </button>
            )}
            <button
              onClick={saveWallet}
              disabled={busy}
              className="btn-primary !py-2 !px-4 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {busy ? 'Saving…' : (savedWallet ? 'Update payout wallet' : 'Save payout wallet')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
