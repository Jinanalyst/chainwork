import React, { useEffect, useState } from 'react'
import { Icon } from './ui.jsx'
import { supabase, isSupabaseConfigured } from '../lib/supabase.js'
import { useT } from '../i18n/index.jsx'

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

async function signInEthereum(t) {
  const provider = detectEthProvider()
  if (!provider) {
    window.open(ETH_INSTALL_URL, '_blank', 'noopener,noreferrer')
    throw new Error(t('auth.signInModal.errors.ethMissing'))
  }
  try {
    await provider.request({ method: 'eth_requestAccounts' })
  } catch (e) {
    if (e?.code === 4001) throw new Error(t('auth.signInModal.errors.ethRejected'))
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
    throw new Error(e?.message || t('auth.signInModal.errors.ethGeneric'))
  }
}

async function signInGoogle(t) {
  if (typeof window === 'undefined') throw new Error(t('auth.signInModal.errors.browserOnly'))
  const redirectTo = window.location.origin + window.location.pathname
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      scopes: 'openid profile email',
      queryParams: { prompt: 'select_account' },
    },
  })
  if (error) {
    console.error('[ChainWork] Google sign-in failed:', error)
    throw new Error(error.message || t('auth.signInModal.errors.googleGeneric'))
  }
  return data
}

async function signInLinkedIn(t) {
  if (typeof window === 'undefined') throw new Error(t('auth.signInModal.errors.browserOnly'))
  const redirectTo = window.location.origin + window.location.pathname
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'linkedin_oidc',
    options: {
      redirectTo,
      scopes: 'openid profile email',
    },
  })
  if (error) {
    console.error('[ChainWork] LinkedIn sign-in failed:', error)
    throw new Error(error.message || t('auth.signInModal.errors.linkedinGeneric'))
  }
  return data
}

async function signInSolana(t) {
  const provider = detectSolanaProvider()
  if (!provider) {
    window.open(SOL_INSTALL_URL, '_blank', 'noopener,noreferrer')
    throw new Error(t('auth.signInModal.errors.solMissing'))
  }
  try {
    const { data, error } = await supabase.auth.signInWithWeb3({
      chain: 'solana',
      statement: STATEMENT,
      wallet: provider,
    })
    if (error) throw error
    return data
  } catch (e) {
    console.error('[ChainWork] Solana sign-in failed:', e)
    const msg = e?.message || ''
    if (/User rejected|User declined|cancelled/i.test(msg)) {
      throw new Error(t('auth.signInModal.errors.solCancelled'))
    }
    if (/invalid formatting/i.test(msg)) {
      throw new Error(t('auth.signInModal.errors.solBadFormat'))
    }
    throw new Error(msg || t('auth.signInModal.errors.solGeneric'))
  }
}

const WALLET_ICON = <path d="M3 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2h2v8h-2v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM17 13h.01" />
const LINKEDIN_ICON = (
  <>
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <path d="M8 10v7M8 7v.01M12 17v-4a2 2 0 0 1 4 0v4M12 17v-7" />
  </>
)
const GOOGLE_ICON = (
  <>
    <path d="M12 11h8.5a8 8 0 1 1-2.34-5.66" />
    <path d="M12 11v3.5h5" />
  </>
)

const SignInButton = ({ name, hint, accent, icon = WALLET_ICON, onClick, busy, disabled, signingLabel }) => (
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
        <Icon path={icon} className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <div className="font-semibold truncate">{name}</div>
        <div className="text-xs text-white/55 truncate">{hint}</div>
      </div>
    </div>
    {busy ? (
      <span className="text-xs text-white/65">{signingLabel}</span>
    ) : (
      <Icon path={<path d="M9 6l6 6-6 6" />} className="h-5 w-5 text-white/40" />
    )}
  </button>
)

export default function SignInModal({ open, onClose, onSignedIn }) {
  const { t } = useT()
  const [busy, setBusy] = useState(null)
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
      const data = await fn(t)
      onSignedIn?.(data)
      onClose()
    } catch (e) {
      setError(e?.message || t('auth.signInModal.errors.generic'))
    } finally {
      setBusy(null)
    }
  }

  const signingLabel = t('auth.signInModal.signing')
  const privacyLink = (
    <a href="#/privacy" className="underline text-white/70 hover:text-white">{t('auth.signInModal.privacyLabel')}</a>
  )
  const legalRaw = t('auth.signInModal.legalNote')
  const [legalBefore, legalAfter] = legalRaw.includes('{{privacy}}')
    ? legalRaw.split('{{privacy}}')
    : [legalRaw, '']

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-ink-950/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-ink-900 shadow-glow p-6 md:p-8">
        <button onClick={onClose} className="absolute top-4 right-4 h-8 w-8 grid place-items-center rounded-full text-white/60 hover:text-white hover:bg-white/5">
          <Icon path={<path d="M6 6l12 12M18 6l-12 12" />} className="h-4 w-4" />
        </button>

        <h2 className="text-xl font-bold">{t('auth.signInModal.title')}</h2>
        <p className="mt-1 text-sm text-white/65">{t('auth.signInModal.sub')}</p>

        {!isSupabaseConfigured && (
          <div className="mt-5 rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            {t('auth.signInModal.supabaseMissing')}
          </div>
        )}

        <div className="mt-6 space-y-3">
          <SignInButton
            name={t('auth.signInModal.withEthereum')}
            hint={ethAvailable ? t('auth.signInModal.withEthereumHint') : t('auth.signInModal.withEthereumMissing')}
            accent="from-brand-400 to-brand-700"
            busy={busy === 'eth'}
            disabled={!!busy || !isSupabaseConfigured}
            signingLabel={signingLabel}
            onClick={() => handle('eth', signInEthereum)}
          />
          <SignInButton
            name={t('auth.signInModal.withSolana')}
            hint={solAvailable ? t('auth.signInModal.withSolanaHint') : t('auth.signInModal.withSolanaMissing')}
            accent="from-violet-500 to-accent-500"
            busy={busy === 'sol'}
            disabled={!!busy || !isSupabaseConfigured}
            signingLabel={signingLabel}
            onClick={() => handle('sol', signInSolana)}
          />

          <div className="flex items-center gap-3 py-1">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-white/35">{t('auth.signInModal.orDivider')}</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <SignInButton
            name={t('auth.signInModal.withGoogle')}
            hint={t('auth.signInModal.withGoogleHint')}
            accent="from-[#ea4335] via-[#fbbc05] to-[#34a853]"
            icon={GOOGLE_ICON}
            busy={busy === 'google'}
            disabled={!!busy || !isSupabaseConfigured}
            signingLabel={signingLabel}
            onClick={() => handle('google', signInGoogle)}
          />
          <SignInButton
            name={t('auth.signInModal.withLinkedin')}
            hint={t('auth.signInModal.withLinkedinHint')}
            accent="from-[#0a66c2] to-[#0a4a8c]"
            icon={LINKEDIN_ICON}
            busy={busy === 'linkedin'}
            disabled={!!busy || !isSupabaseConfigured}
            signingLabel={signingLabel}
            onClick={() => handle('linkedin', signInLinkedIn)}
          />
        </div>

        {error && (
          <div className="mt-5 rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </div>
        )}

        <p className="mt-6 text-[11px] text-white/45 text-center">
          {legalBefore}{privacyLink}{legalAfter}
        </p>
      </div>
    </div>
  )
}
