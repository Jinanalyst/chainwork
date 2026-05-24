import React, { useEffect, useState } from 'react'
import { Icon } from './ui.jsx'
import { useProfile } from '../hooks/useProfile.js'
import { useSession, isOAuthAuth, shortAddress } from '../hooks/useSession.js'

const CHAINS = [
  { id: 'ethereum', label: 'Ethereum', regex: /^0x[a-fA-F0-9]{40}$/, hint: '0x… 42 chars' },
  { id: 'base',     label: 'Base',     regex: /^0x[a-fA-F0-9]{40}$/, hint: '0x… 42 chars' },
  { id: 'polygon',  label: 'Polygon',  regex: /^0x[a-fA-F0-9]{40}$/, hint: '0x… 42 chars' },
  { id: 'solana',   label: 'Solana',   regex: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/, hint: 'Base58 32-44 chars' },
  { id: 'tron',     label: 'Tron',     regex: /^T[1-9A-HJ-NP-Za-km-z]{33}$/,   hint: 'Starts with T, 34 chars' },
]
const chainById = (id) => CHAINS.find((c) => c.id === id) || CHAINS[0]

const detectEth = () => (typeof window !== 'undefined' ? window.ethereum : null)
const detectSol = () => {
  if (typeof window === 'undefined') return null
  if (window.phantom?.solana?.isPhantom) return window.phantom.solana
  if (window.solana?.isPhantom) return window.solana
  return window.solana || null
}

/**
 * Optional wallet-linking card for OAuth-authed (LinkedIn etc.) users.
 *
 * LinkedIn sign-in creates an account with no on-chain identity. This card
 * lets the user opt in to a wallet address on their profile row so they
 * can (a) fund escrow as a hirer, (b) receive payouts as a worker, or
 * just (c) be discoverable on Talents with a public address.
 *
 * Renders nothing for users who already signed in with a wallet.
 *
 * @param {'hire'|'work'|'both'} [purpose='both']
 */
export default function LinkedWalletCard({ purpose = 'both' }) {
  const { user } = useSession()
  const { profile, update } = useProfile()
  const [editing, setEditing] = useState(false)
  const [chain, setChain]     = useState('ethereum')
  const [address, setAddress] = useState('')
  const [busy, setBusy]       = useState(false)
  const [error, setError]     = useState('')
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (!profile) return
    setChain(profile.wallet_chain && CHAINS.some((c) => c.id === profile.wallet_chain)
      ? profile.wallet_chain
      : 'ethereum')
    setAddress(profile.wallet_address || '')
  }, [profile?.wallet_chain, profile?.wallet_address])

  if (!user || !isOAuthAuth(user)) return null

  const saved = profile?.wallet_address || ''

  const purposeCopy =
    purpose === 'hire' ? 'Link a wallet to fund escrow when you hire workers.' :
    purpose === 'work' ? 'Link a wallet to receive payouts when you ship work.' :
    'Link a wallet so you can fund escrow as a hirer or receive payouts as a worker.'

  // Dismissed state only matters when there's nothing saved yet — once a
  // wallet is linked the card stays visible (as a compact "linked" view).
  if (!saved && dismissed) return null

  const save = async (overrides) => {
    const nextChain   = overrides?.chain   ?? chain
    const nextAddress = (overrides?.address ?? address ?? '').trim()
    if (!nextAddress) { setError('Paste a wallet address or connect a wallet.'); return }
    const c = chainById(nextChain)
    if (!c.regex.test(nextAddress)) {
      setError(`That doesn't look like a ${c.label} address (${c.hint}).`)
      return
    }
    setBusy(true); setError('')
    const res = await update({ wallet_address: nextAddress, wallet_chain: nextChain })
    setBusy(false)
    if (!res.ok) { setError(res.error || 'Could not save.'); return }
    setEditing(false)
  }

  const connectEth = async () => {
    const eth = detectEth()
    if (!eth) {
      window.open('https://metamask.io/download/', '_blank', 'noopener,noreferrer')
      setError('No Ethereum wallet detected. Install MetaMask to continue.')
      return
    }
    setError(''); setBusy(true)
    try {
      const accounts = await eth.request({ method: 'eth_requestAccounts' })
      const addr = (accounts && accounts[0]) || ''
      if (!addr) throw new Error('No account returned.')
      setAddress(addr); setChain('ethereum')
      await save({ chain: 'ethereum', address: addr })
    } catch (e) {
      const msg = e?.code === 4001 ? 'You rejected the connection request.' : (e?.message || 'Could not connect.')
      setError(msg); setBusy(false)
    }
  }

  const connectSol = async () => {
    const sol = detectSol()
    if (!sol) {
      window.open('https://phantom.app/download', '_blank', 'noopener,noreferrer')
      setError('No Solana wallet detected. Install Phantom to continue.')
      return
    }
    setError(''); setBusy(true)
    try {
      const res = await sol.connect()
      const addr = res?.publicKey?.toString?.() || sol.publicKey?.toString?.() || ''
      if (!addr) throw new Error('No public key returned.')
      setAddress(addr); setChain('solana')
      await save({ chain: 'solana', address: addr })
    } catch (e) {
      setError(e?.message || 'Could not connect.'); setBusy(false)
    }
  }

  const clear = async () => {
    if (!confirm('Unlink this wallet from your account?')) return
    setBusy(true)
    const res = await update({ wallet_address: null, wallet_chain: null })
    setBusy(false)
    if (!res.ok) { alert('Could not unlink: ' + (res.error || 'unknown')); return }
    setEditing(false)
  }

  return (
    <div className="card">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl grid place-items-center text-white bg-gradient-to-br from-brand-400 to-accent-400">
            <Icon path={<><path d="M3 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2h2v8h-2v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM17 13h.01" /></>} className="h-5 w-5" />
          </div>
          <div>
            <div className="font-semibold">{saved ? 'Wallet linked' : 'Connect a wallet (optional)'}</div>
            <div className="text-xs text-white/55">
              {saved
                ? `Linked · ${chainById(profile.wallet_chain).label}`
                : purposeCopy}
            </div>
          </div>
        </div>
        {!editing && saved && (
          <button onClick={() => setEditing(true)} className="text-xs text-brand-300 hover:text-white">Change</button>
        )}
        {!editing && !saved && (
          <button onClick={() => setDismissed(true)} className="text-xs text-white/40 hover:text-white">Skip for now</button>
        )}
      </div>

      {!editing && saved && (
        <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-[0.18em] text-white/45">{chainById(profile.wallet_chain).label}</div>
            <code className="block mt-0.5 font-mono text-sm text-white/85 truncate" title={saved}>{shortAddress(saved)}</code>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => { try { navigator.clipboard.writeText(saved) } catch {} }}
              className="text-[11px] rounded-full border border-white/15 hover:border-white/35 px-2.5 py-1"
            >
              Copy
            </button>
            <button onClick={clear} className="text-[11px] text-rose-300 hover:text-rose-200">Unlink</button>
          </div>
        </div>
      )}

      {(editing || !saved) && (
        <div className="mt-4 space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <button
              onClick={connectEth}
              disabled={busy}
              className="rounded-2xl border border-white/10 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.06] transition px-4 py-3 flex items-center gap-3 disabled:opacity-60 disabled:cursor-wait text-left"
            >
              <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-brand-400 to-brand-700 grid place-items-center text-white shrink-0">
                <Icon path={<path d="M12 2l8 4-8 14L4 6z" />} className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold">Connect MetaMask</div>
                <div className="text-[11px] text-white/55">Ethereum / Base / Polygon</div>
              </div>
            </button>
            <button
              onClick={connectSol}
              disabled={busy}
              className="rounded-2xl border border-white/10 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.06] transition px-4 py-3 flex items-center gap-3 disabled:opacity-60 disabled:cursor-wait text-left"
            >
              <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-violet-500 to-accent-500 grid place-items-center text-white shrink-0">
                <Icon path={<path d="M4 8l8-4 8 4-8 4zM4 16l8 4 8-4M4 12l8 4 8-4" />} className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold">Connect Phantom</div>
                <div className="text-[11px] text-white/55">Solana</div>
              </div>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-white/35">or paste manually</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <div className="grid sm:grid-cols-[160px_1fr] gap-3">
            <label className="block">
              <span className="text-[11px] uppercase tracking-[0.18em] text-white/55">Network</span>
              <select
                value={chain}
                onChange={(e) => setChain(e.target.value)}
                disabled={busy}
                className="mt-1 w-full rounded-xl bg-white/[0.04] border border-white/15 px-3 py-2 text-sm focus:outline-none focus:border-brand-300"
              >
                {CHAINS.map((c) => (
                  <option key={c.id} value={c.id} className="bg-ink-900">{c.label}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-[11px] uppercase tracking-[0.18em] text-white/55">Address ({chainById(chain).hint})</span>
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={chain === 'tron' ? 'T…' : (chain === 'solana' ? '7Xy…3z9' : '0x…')}
                disabled={busy}
                className="mt-1 w-full rounded-xl bg-white/[0.04] border border-white/15 px-3 py-2 text-sm font-mono focus:outline-none focus:border-brand-300"
              />
            </label>
          </div>

          {error && <div className="text-xs text-rose-300">{error}</div>}

          <div className="flex items-center gap-2 justify-end">
            {editing && (
              <button onClick={() => { setEditing(false); setError('') }} disabled={busy} className="text-sm text-white/60 hover:text-white px-3 py-1.5">
                Cancel
              </button>
            )}
            <button
              onClick={() => save()}
              disabled={busy}
              className="btn-primary !py-2 !px-4 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {busy ? 'Saving…' : (saved ? 'Update wallet' : 'Link wallet')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
