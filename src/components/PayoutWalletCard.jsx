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

// Major Korean banks for the dropdown. The user can still type "Other" via
// the free-text fallback if their bank isn't listed.
const KR_BANKS = [
  '국민은행', '신한은행', '우리은행', '하나은행', '농협은행', 'IBK기업은행',
  'SC제일은행', '한국씨티은행', '카카오뱅크', '케이뱅크', '토스뱅크',
  '새마을금고', '신협', '우체국', '수협은행', '대구은행', '부산은행',
  '경남은행', '광주은행', '전북은행', '제주은행',
]

const truncate    = (s) => (s && s.length > 14 ? `${s.slice(0, 6)}…${s.slice(-6)}` : s || '')
// Bank account numbers are PII — show only last 4 digits in the saved view.
const maskAccount = (s) => {
  const digits = String(s || '').replace(/\D/g, '')
  if (digits.length <= 4) return digits
  return '••• ' + digits.slice(-4)
}
// Korean bank numbers vary by bank (10–14 digits) — accept digits + dashes,
// require at least 8 digits to weed out obvious typos.
const ACCT_REGEX = /^[0-9-]{8,25}$/

/**
 * Single card for setting where ChainWork sends a worker's earnings.
 *
 * Two paths:
 *   - 'bank'   → KRW settlement to a Korean bank account (for Google /
 *                LinkedIn users who don't hold a crypto wallet). Settled
 *                via the ChainWork PG, so the hirer never sees the account.
 *   - 'wallet' → stablecoin payout to an on-chain address (USDC / USDT on
 *                Ethereum, Base, Polygon, Solana, or Tron).
 *
 * The active path is persisted in profile.payout_method.
 */
export default function PayoutWalletCard() {
  const { profile, update } = useProfile()

  // Default to whatever the user already saved; otherwise bank — the new flow
  // is the friendlier default for non-wallet users, which is the majority
  // after enabling Google login.
  const [method, setMethod] = useState('bank')
  const [editing, setEditing] = useState(false)

  // Wallet sub-state
  const [chain, setChain]     = useState('base')
  const [address, setAddress] = useState('')
  const [token, setToken]     = useState('USDC')

  // Bank sub-state
  const [bankName, setBankName]     = useState('')
  const [holder, setHolder]         = useState('')
  const [acctNumber, setAcctNumber] = useState('')

  const [busy, setBusy]   = useState(false)
  const [error, setError] = useState('')

  // Hydrate from the profile row.
  useEffect(() => {
    if (!profile) return
    // Infer method from stored fields if the new column is null (legacy rows).
    const inferred = profile.payout_method
      || (profile.payout_address ? 'wallet'
          : (profile.payout_bank_name ? 'bank' : 'bank'))
    setMethod(inferred)
    setChain(profile.payout_chain   || 'base')
    setAddress(profile.payout_address || '')
    setToken(profile.payout_token   || 'USDC')
    setBankName(profile.payout_bank_name      || '')
    setHolder(profile.payout_account_holder   || '')
    setAcctNumber(profile.payout_account_number || '')
  }, [
    profile?.payout_method,
    profile?.payout_chain,
    profile?.payout_address,
    profile?.payout_token,
    profile?.payout_bank_name,
    profile?.payout_account_holder,
    profile?.payout_account_number,
  ])

  // What's currently saved on the row (independent of the form state).
  const savedMethod = profile?.payout_method
    || (profile?.payout_address ? 'wallet'
        : (profile?.payout_bank_name ? 'bank' : null))
  const savedWallet = profile?.payout_address
  const savedBank   = profile?.payout_bank_name && profile?.payout_account_number

  const startEdit = () => { setEditing(true); setError('') }
  const cancel = () => {
    setEditing(false); setError('')
    if (profile) {
      setMethod(savedMethod || 'bank')
      setChain(profile.payout_chain   || 'base')
      setAddress(profile.payout_address || '')
      setToken(profile.payout_token   || 'USDC')
      setBankName(profile.payout_bank_name      || '')
      setHolder(profile.payout_account_holder   || '')
      setAcctNumber(profile.payout_account_number || '')
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
    // Switching to wallet — clear bank fields so a stale value
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

  const saveBank = async () => {
    const bn = (bankName || '').trim()
    const ho = (holder   || '').trim()
    const an = (acctNumber || '').trim()
    if (!bn) { setError('Choose your bank.'); return }
    if (!ho) { setError('Enter the account holder name (예금주).'); return }
    if (!ACCT_REGEX.test(an)) {
      setError('Account number should be 8+ digits (dashes are okay).')
      return
    }
    setBusy(true); setError('')
    const res = await update({
      payout_method:          'bank',
      payout_bank_name:       bn,
      payout_account_holder:  ho,
      payout_account_number:  an,
      // Clear wallet fields so the saved view is unambiguous.
      payout_address:         null,
      payout_chain:           null,
      payout_token:           null,
    })
    setBusy(false)
    if (!res.ok) { setError(res.error || 'Could not save.'); return }
    setEditing(false)
  }

  const clear = async () => {
    const msg = 'Remove your payout destination? You won\'t receive payouts until you set a new one.'
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

  const isSaved = !!(savedWallet || savedBank)
  const savedLabel =
      savedMethod === 'bank'   ? `Active · KRW · ${profile?.payout_bank_name}`
    : savedMethod === 'wallet' ? `Active · ${chainById(profile?.payout_chain).label}`
    : 'No payout destination set'

  return (
    <div className="card">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl grid place-items-center text-white bg-gradient-to-br from-brand-400 to-accent-400">
            <Icon path={<><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M16 12h.01" /><path d="M3 11h18" /></>} className="h-5 w-5" />
          </div>
          <div>
            <div className="font-semibold">Payout destination</div>
            <div className="text-xs text-white/55">{savedLabel}</div>
          </div>
        </div>
        {!editing && isSaved && (
          <button onClick={startEdit} className="text-xs text-brand-300 hover:text-white">Change</button>
        )}
      </div>

      {/* Saved view — bank */}
      {!editing && savedBank && savedMethod === 'bank' && (
        <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-[0.18em] text-white/45">
              KRW · {profile.payout_bank_name}
            </div>
            <div className="mt-0.5 text-sm text-white/85 truncate">
              <span className="text-white/55">예금주</span>{' '}
              <span>{profile.payout_account_holder}</span>
              <span className="text-white/30"> · </span>
              <span className="font-mono">{maskAccount(profile.payout_account_number)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={clear} className="text-[11px] text-rose-300 hover:text-rose-200">Remove</button>
          </div>
        </div>
      )}

      {/* Saved view — wallet */}
      {!editing && savedWallet && savedMethod === 'wallet' && (
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
          {/* Method picker */}
          <div className="grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-white/[0.02] p-1">
            {[
              { id: 'bank',   title: '한국 계좌',     sub: 'KRW · 토스/국민/신한…' },
              { id: 'wallet', title: 'Crypto',       sub: 'USDC / USDT' },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => { setMethod(m.id); setError('') }}
                className={
                  'rounded-lg px-3 py-2 text-sm transition text-left ' +
                  (method === m.id
                    ? 'bg-white text-ink-950 font-semibold'
                    : 'text-white/70 hover:text-white')
                }
              >
                {m.title}
                <div className={'text-[10px] mt-0.5 ' + (method === m.id ? 'text-ink-950/65' : 'text-white/45')}>
                  {m.sub}
                </div>
              </button>
            ))}
          </div>

          {/* Bank fields */}
          {method === 'bank' && (
            <>
              <div className="grid sm:grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-[11px] uppercase tracking-[0.18em] text-white/55">은행 · Bank</span>
                  <select
                    value={KR_BANKS.includes(bankName) ? bankName : (bankName ? '__other' : '')}
                    onChange={(e) => {
                      const v = e.target.value
                      if (v === '__other')      setBankName('')
                      else if (v === '')        setBankName('')
                      else                      setBankName(v)
                    }}
                    disabled={busy}
                    className="mt-1 w-full rounded-xl bg-white/[0.04] border border-white/15 px-3 py-2 text-sm focus:outline-none focus:border-brand-300"
                  >
                    <option value="" className="bg-ink-900">— 선택 —</option>
                    {KR_BANKS.map((b) => (
                      <option key={b} value={b} className="bg-ink-900">{b}</option>
                    ))}
                    <option value="__other" className="bg-ink-900">기타 (직접 입력)</option>
                  </select>
                  {!KR_BANKS.includes(bankName) && (
                    <input
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="은행명 직접 입력"
                      disabled={busy}
                      className="mt-2 w-full rounded-xl bg-white/[0.04] border border-white/15 px-3 py-2 text-sm focus:outline-none focus:border-brand-300"
                    />
                  )}
                </label>
                <label className="block">
                  <span className="text-[11px] uppercase tracking-[0.18em] text-white/55">예금주 · Account holder</span>
                  <input
                    value={holder}
                    onChange={(e) => setHolder(e.target.value)}
                    placeholder="홍길동"
                    disabled={busy}
                    className="mt-1 w-full rounded-xl bg-white/[0.04] border border-white/15 px-3 py-2 text-sm focus:outline-none focus:border-brand-300"
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-[11px] uppercase tracking-[0.18em] text-white/55">계좌번호 · Account number</span>
                <input
                  value={acctNumber}
                  onChange={(e) => setAcctNumber(e.target.value)}
                  placeholder="숫자 또는 하이픈 (예: 110-123-456789)"
                  disabled={busy}
                  inputMode="numeric"
                  autoComplete="off"
                  className="mt-1 w-full rounded-xl bg-white/[0.04] border border-white/15 px-3 py-2 text-sm font-mono focus:outline-none focus:border-brand-300"
                />
              </label>

              <div className="rounded-xl border border-brand-400/30 bg-brand-500/10 px-3 py-2 text-[11px] text-brand-100 leading-relaxed">
                <strong>안전한 KRW 정산.</strong> 계좌 정보는 본인만 열람할 수 있으며,
                의뢰자에게는 노출되지 않습니다. 검수 승인 후 ChainWork 결제대행(PG)
                통해 등록된 계좌로 자동 정산됩니다.
              </div>
            </>
          )}

          {/* Wallet fields */}
          {method === 'wallet' && (
            <>
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
            </>
          )}

          {error && <div className="text-xs text-rose-300">{error}</div>}

          <div className="flex items-center gap-2 justify-end">
            {editing && (
              <button onClick={cancel} disabled={busy} className="text-sm text-white/60 hover:text-white px-3 py-1.5">
                Cancel
              </button>
            )}
            <button
              onClick={method === 'bank' ? saveBank : saveWallet}
              disabled={busy}
              className="btn-primary !py-2 !px-4 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {busy
                ? 'Saving…'
                : method === 'bank'
                    ? (savedBank   ? 'Update bank account'  : 'Save bank account')
                    : (savedWallet ? 'Update payout wallet' : 'Save payout wallet')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
