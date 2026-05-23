import React, { useEffect, useState } from 'react'
import { Icon } from './ui.jsx'
import { supabase, isSupabaseConfigured } from '../lib/supabase.js'

const ETH_INSTALL_URL = 'https://metamask.io/download/'
const SOL_INSTALL_URL = 'https://phantom.app/download'

function detectEthProvider() {
  if (typeof window === 'undefined') return null
  return window.ethereum || null
}

function detectSolanaProvider() {
  if (typeof window === 'undefined') return null
  if (window.phantom?.solana?.isPhantom) return window.phantom.solana
  if (window.solana?.isPhantom) return window.solana
  return window.solana || null
}

const STATEMENT = 'I accept the ChainWork Terms of Service'

async function signInEthereum() {
  const provider = detectEthProvider()
  if (!provider) {
    window.open(ETH_INSTALL_URL, '_blank', 'noopener,noreferrer')
    throw new Error('No Ethereum wallet detected. Install MetaMask to continue.')
  }
  try {
    await provider.request({ method: 'eth_requestAccounts' })
  } catch (e) {
    if (e?.code === 4001) throw new Error('You rejected the connection request.')
    throw e
  }
  try {
    const { data, error } = await supabase.auth.signInWithWeb3({
      chain: 'ethereum',
      statement: STATEMENT,
      wallet: provider,
    })
    if (error) throw error
    return data
  } catch (e) {
    console.error('[ChainWork] Ethereum sign-in failed:', e)
    throw new Error(e?.message || 'Ethereum sign-in failed. Please try again.')
  }
}

async function signInSolana() {
  if (!detectSolanaProvider()) {
    window.open(SOL_INSTALL_URL, '_blank', 'noopener,noreferrer')
    throw new Error('No Solana wallet detected. Install Phantom to continue.')
  }
  try {
    const { data, error } = await supabase.auth.signInWithWeb3({
      chain: 'solana',
      statement: STATEMENT,
    })
    if (error) throw error
    return data
  } catch (e) {
    console.error('[ChainWork] Solana sign-in failed:', e)
    const msg = e?.message || ''
    if (/User rejected|User declined|cancelled/i.test(msg)) {
      throw new Error('You cancelled the signature request.')
    }
    if (/invalid formatting/i.test(msg)) {
      throw new Error(
        "Your wallet couldn't read the sign-in request. Make sure Phantom is up to date and that 'Sign In With Solana' is enabled in Phantom settings."
      )
    }
    throw new Error(msg || 'Solana sign-in failed. Please try again.')
  }
}

const WalletButton = ({ name, hint, accent, onClick, busy, disabled }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={busy || disabled}
    className={
      'w-full text-left rounded-2xl border transition px-5 py-4 flex items-center justify-between gap-4 ' +
      (busy
        ? 'border-white/15 bg-white/5 opacity-80 cursor-wait'
        : 'border-white/10 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.06]')
    }
  >
    <div className="flex items-center gap-3 min-w-0">
      <div className={`h-11 w-11 rounded-xl grid place-items-center text-white shrink-0 bg-gradient-to-br ${accent}`}>
        <Icon path={<path d="M3 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2h2v8h-2v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM17 13h.01" />} className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <div className="font-semibold truncate">{name}</div>
        <div className="text-xs text-white/55 truncate">{hint}</div>
      </div>
    </div>
    {busy ? (
      <span className="text-xs text-white/65">Signing…</span>
    ) : (
      <Icon path={<path d="M9 6l6 6-6 6" />} className="h-5 w-5 text-white/40" />
    )}
  </button>
)

export default function SignInModal({ open, onClose, onSignedIn }) {
  const [busy, setBusy] = useState(null) // 'eth' | 'sol' | null
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!open) { setBusy(null); setError(null) }
  }, [open])

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && open) onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const ethAvailable = !!detectEthProvider()
  const solAvailable = !!detectSolanaProvider()

  const handle = async (kind, fn) => {
    setError(null); setBusy(kind)
    try {
      const data = await fn()
      onSignedIn?.(data)
      onClose()
    } catch (e) {
      setError(e?.message || 'Sign-in failed. Please try again.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-ink-950/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-ink-900 shadow-glow p-6 md:p-8">
        <button onClick={onClose} className="absolute top-4 right-4 h-8 w-8 grid place-items-center rounded-full text-white/60 hover:text-white hover:bg-white/5">
          <Icon path={<path d="M6 6l12 12M18 6l-12 12" />} className="h-4 w-4" />
        </button>

        <h2 className="text-xl font-bold">Sign in to ChainWork</h2>
        <p className="mt-1 text-sm text-white/65">Connect a wallet to post tasks, send offers, and get paid.</p>

        {!isSupabaseConfigured && (
          <div className="mt-5 rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            Supabase isn't configured yet. Add <code className="bg-amber-500/20 px-1 rounded">VITE_SUPABASE_ANON_KEY</code> to <code className="bg-amber-500/20 px-1 rounded">.env.local</code> and restart <code className="bg-amber-500/20 px-1 rounded">npm run dev</code>.
          </div>
        )}

        <div className="mt-6 space-y-3">
          <WalletButton
            name="Continue with Ethereum"
            hint={ethAvailable ? 'MetaMask, Coinbase Wallet, Rabby…' : 'No wallet detected — install MetaMask'}
            accent="from-brand-400 to-brand-700"
            busy={busy === 'eth'}
            disabled={!!busy || !isSupabaseConfigured}
            onClick={() => handle('eth', signInEthereum)}
          />
          <WalletButton
            name="Continue with Solana"
            hint={solAvailable ? 'Phantom, Solflare…' : 'No wallet detected — install Phantom'}
            accent="from-violet-500 to-accent-500"
            busy={busy === 'sol'}
            disabled={!!busy || !isSupabaseConfigured}
            onClick={() => handle('sol', signInSolana)}
          />
        </div>

        {error && (
          <div className="mt-5 rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </div>
        )}

        <p className="mt-6 text-[11px] text-white/45 text-center">
          By continuing you agree to ChainWork's Terms and{' '}
          <a href="#/privacy" className="underline text-white/70 hover:text-white">Privacy Policy</a>.
          We never see your private key.
        </p>
      </div>
    </div>
  )
}
