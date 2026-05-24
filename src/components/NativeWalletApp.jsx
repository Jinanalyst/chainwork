import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Browser } from '@capacitor/browser'
import QRCode from './QRCode.jsx'
import {
  hasWallet, mnemonicConfirmed, setMnemonicConfirmed,
  createWallet, importMnemonic, save, unlock, reset,
  getBalances, sendUSDC, sendETH, formatUnits, parseUnits, BASE,
  getQuote, getUsdcAllowance, approveUsdc, swapEthForUsdc, swapUsdcForEth, MAX_UINT256,
} from '../lib/nativeWallet.js'

/* ─── identity palette (same as ChainPay.jsx) ─────────────────────────── */
const C = {
  bg: '#0B1020', surface: '#141A2E', surface2: '#1E2742',
  line: 'rgba(244,247,251,0.08)', lineStr: 'rgba(244,247,251,0.14)',
  white: '#F4F7FB', text2: '#C5CCDF', muted: '#6B7390',
  teal: '#00E0B8', amber: '#FFB547', green: '#3CD68C', red: '#FF7A8A',
}
const FONT_HEAD = "'Space Grotesk', sans-serif"
const FONT_MONO = "'JetBrains Mono', ui-monospace, monospace"

const SvgIcon = ({ d, size = 20, stroke = C.white, sw = 1.6, fill = 'none' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke}
       strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">{d}</svg>
)
const IconSend  = (p) => <SvgIcon {...p} d={<path d="M5 19L19 5M19 5H9M19 5v10"/>} />
const IconRecv  = (p) => <SvgIcon {...p} d={<path d="M19 5L5 19M5 19h10M5 19V9"/>} />
const IconSwap  = (p) => <SvgIcon {...p} d={<><path d="M4 7h13M14 4l3 3-3 3"/><path d="M20 17H7M10 20l-3-3 3-3"/></>} />
const IconBuy   = (p) => <SvgIcon {...p} d={<path d="M12 5v14M5 12h14"/>} />
const IconClose = (p) => <SvgIcon {...p} d={<path d="M6 6l12 12M18 6L6 18"/>} />
const IconCopy  = (p) => <SvgIcon {...p} d={<><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></>} />

const short = (a) => a ? `${a.slice(0, 6)}…${a.slice(-4)}` : ''
const fmtUsd = (n) => Number.isFinite(n)
  ? n.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 2 })
  : '$0.00'

/* ────────────────────────────────────────────────────────────────────────── *
 * Modal
 * ────────────────────────────────────────────────────────────────────────── */
function Modal({ open, onClose, title, children }) {
  if (!open) return null
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)',
      display: 'grid', placeItems: 'end', justifyItems: 'stretch',
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: '100%', maxHeight: '88vh', overflow: 'auto',
        background: C.surface, color: C.white,
        borderTopLeftRadius: 24, borderTopRightRadius: 24,
        borderTop: '1px solid ' + C.lineStr,
        padding: '0 0 20px',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 18px', borderBottom: '1px solid ' + C.line,
        }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{title}</div>
          <button onClick={onClose} style={{
            background: 'transparent', border: 0, color: C.text2, cursor: 'pointer',
          }}><IconClose size={22} stroke={C.text2}/></button>
        </div>
        <div style={{ padding: 18 }}>{children}</div>
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────────────── *
 * Onboarding flow — generate phrase → confirm → set passcode
 * ────────────────────────────────────────────────────────────────────────── */
function Onboarding({ onDone }) {
  const [step, setStep] = useState('welcome') // welcome | phrase | confirm | passcode | importing
  const [pair, setPair] = useState(null)      // { wallet, mnemonic }
  const [importText, setImportText] = useState('')
  const [pass, setPass] = useState('')
  const [pass2, setPass2] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const begin = () => {
    setErr('')
    setPair(createWallet())
    setStep('phrase')
  }
  const beginImport = () => { setErr(''); setImportText(''); setStep('importing') }
  const doImport = () => {
    setErr('')
    try {
      setPair(importMnemonic(importText))
      setStep('passcode')
    } catch (e) { setErr('That doesn\'t look like a 12 or 24 word phrase.') }
  }

  const finish = async () => {
    setErr('')
    if (pass.length < 6) return setErr('Passcode must be at least 6 characters.')
    if (pass !== pass2)  return setErr('Passcodes don\'t match.')
    setBusy(true)
    try {
      await save(pair.wallet, pass)
      await setMnemonicConfirmed()
      onDone(pair.wallet)
    } catch (e) { setErr(e.message || 'Could not save wallet'); setBusy(false) }
  }

  const wrap = { padding: '40px 24px', maxWidth: 460, margin: '0 auto', color: C.white }
  const h1 = { fontFamily: FONT_HEAD, fontSize: 30, fontWeight: 600, lineHeight: 1.1, letterSpacing: '-0.02em', margin: '0 0 12px' }
  const p = { color: C.text2, fontSize: 15, lineHeight: 1.5, marginBottom: 24 }
  const btnPrimary = {
    width: '100%', padding: '14px 0', borderRadius: 14, marginTop: 16,
    background: C.teal, color: C.bg, border: 0, fontWeight: 700, fontSize: 16, cursor: 'pointer',
  }
  const btnGhost = {
    width: '100%', padding: '14px 0', borderRadius: 14, marginTop: 10,
    background: 'transparent', color: C.white, border: '1px solid ' + C.lineStr,
    fontWeight: 600, fontSize: 15, cursor: 'pointer',
  }
  const input = {
    width: '100%', boxSizing: 'border-box', padding: '12px 14px',
    background: C.surface, border: '1px solid ' + C.lineStr, color: C.white,
    borderRadius: 12, fontSize: 15, outline: 'none', fontFamily: 'inherit',
  }
  const errBox = err ? (
    <div style={{
      marginTop: 12, padding: '10px 12px', borderRadius: 10,
      background: 'rgba(255,122,138,0.12)', border: '1px solid rgba(255,122,138,0.3)',
      color: C.red, fontSize: 13,
    }}>{err}</div>
  ) : null

  if (step === 'welcome') return (
    <div style={wrap}>
      <div style={{ width: 64, height: 64, borderRadius: 18, background: 'rgba(0,224,184,0.16)',
        border: '1px solid rgba(0,224,184,0.3)', display: 'grid', placeItems: 'center', marginBottom: 28 }}>
        <SvgIcon d={<><rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></>} size={28} stroke={C.teal}/>
      </div>
      <h1 style={h1}>Your wallet. Your keys.</h1>
      <p style={p}>ChainPay generates a private key on this phone. Nobody — not us, not Google, not your carrier — can read it. Back up the recovery phrase and the wallet is yours forever.</p>
      <button onClick={begin}     style={btnPrimary}>Create a new wallet</button>
      <button onClick={beginImport} style={btnGhost}>I already have a recovery phrase</button>
    </div>
  )

  if (step === 'importing') return (
    <div style={wrap}>
      <h1 style={h1}>Restore from phrase</h1>
      <p style={p}>Paste your 12 or 24 word recovery phrase. Words separated by spaces.</p>
      <textarea
        value={importText}
        onChange={(e) => setImportText(e.target.value)}
        rows={4}
        placeholder="word word word…"
        style={{ ...input, fontFamily: FONT_MONO, fontSize: 14, resize: 'vertical' }}
      />
      {errBox}
      <button onClick={doImport} style={btnPrimary}>Continue</button>
      <button onClick={() => setStep('welcome')} style={btnGhost}>Back</button>
    </div>
  )

  if (step === 'phrase') {
    const words = pair.mnemonic.split(' ')
    return (
      <div style={wrap}>
        <h1 style={h1}>Your recovery phrase</h1>
        <p style={p}>Twelve words. Write them down in order on paper and keep them somewhere safe. Anyone with this phrase owns your wallet.</p>
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8,
          padding: 14, background: C.surface, border: '1px solid ' + C.lineStr, borderRadius: 14,
        }}>
          {words.map((w, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'baseline', gap: 8,
              padding: '8px 10px', background: C.bg, borderRadius: 10,
              fontFamily: FONT_MONO, fontSize: 14,
            }}>
              <span style={{ color: C.muted, fontSize: 11 }}>{(i + 1).toString().padStart(2, '0')}</span>
              <span>{w}</span>
            </div>
          ))}
        </div>
        <button onClick={() => setStep('confirm')} style={btnPrimary}>I've written it down</button>
      </div>
    )
  }

  if (step === 'confirm') return (
    <div style={wrap}>
      <h1 style={h1}>One last check.</h1>
      <p style={p}>If you lose this phrase and your phone, the wallet — and everything in it — is gone. ChainPay can't recover it for you. Ready?</p>
      <button onClick={() => setStep('passcode')} style={btnPrimary}>Yes, I have it saved</button>
      <button onClick={() => setStep('phrase')} style={btnGhost}>Show me again</button>
    </div>
  )

  return (
    <div style={wrap}>
      <h1 style={h1}>Set a passcode</h1>
      <p style={p}>Used to unlock the app on this device. At least 6 characters. Forgetting it means restoring from your recovery phrase.</p>
      <input type="password" value={pass}  onChange={(e) => setPass(e.target.value)}  placeholder="Passcode"        style={input}/>
      <div style={{ height: 10 }}/>
      <input type="password" value={pass2} onChange={(e) => setPass2(e.target.value)} placeholder="Confirm passcode" style={input}/>
      {errBox}
      <button onClick={finish} disabled={busy} style={{ ...btnPrimary, opacity: busy ? 0.7 : 1 }}>
        {busy ? 'Encrypting…' : 'Finish setup'}
      </button>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────────────── *
 * Unlock screen
 * ────────────────────────────────────────────────────────────────────────── */
function UnlockScreen({ onUnlocked, onReset }) {
  const [pass, setPass] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async () => {
    setErr(''); setBusy(true)
    try { onUnlocked(await unlock(pass)) }
    catch (e) { setErr('Wrong passcode.'); setBusy(false) }
  }
  return (
    <div style={{ padding: '60px 24px', maxWidth: 460, margin: '0 auto', textAlign: 'center', color: C.white }}>
      <div style={{
        width: 72, height: 72, borderRadius: 20, margin: '0 auto 24px',
        background: 'rgba(0,224,184,0.16)', border: '1px solid rgba(0,224,184,0.3)',
        display: 'grid', placeItems: 'center',
      }}>
        <SvgIcon d={<><rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></>} size={32} stroke={C.teal}/>
      </div>
      <h1 style={{ fontFamily: FONT_HEAD, fontSize: 28, fontWeight: 600, margin: '0 0 8px' }}>Welcome back</h1>
      <div style={{ color: C.text2, fontSize: 14, marginBottom: 28 }}>Enter your passcode to unlock ChainPay.</div>
      <input
        type="password" value={pass}
        onChange={(e) => setPass(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        placeholder="Passcode" autoFocus
        style={{
          width: '100%', boxSizing: 'border-box', padding: '14px 16px',
          background: C.surface, border: '1px solid ' + C.lineStr, color: C.white,
          borderRadius: 14, fontSize: 16, textAlign: 'center', letterSpacing: '0.2em', outline: 'none',
        }}
      />
      {err && <div style={{ color: C.red, fontSize: 13, marginTop: 12 }}>{err}</div>}
      <button onClick={submit} disabled={busy} style={{
        width: '100%', padding: '14px 0', borderRadius: 14, marginTop: 16,
        background: C.teal, color: C.bg, border: 0, fontWeight: 700, fontSize: 16,
        cursor: 'pointer', opacity: busy ? 0.7 : 1,
      }}>{busy ? 'Unlocking…' : 'Unlock'}</button>
      <button onClick={onReset} style={{
        marginTop: 18, background: 'transparent', border: 0, color: C.muted, fontSize: 12, cursor: 'pointer',
      }}>Forgot passcode · reset wallet</button>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────────────── *
 * Send / Receive modals
 * ────────────────────────────────────────────────────────────────────────── */
function SendSheet({ open, onClose, wallet, balances, onSent }) {
  const [token, setToken] = useState('USDC')
  const [to,    setTo]    = useState('')
  const [amt,   setAmt]   = useState('')
  const [busy,  setBusy]  = useState(false)
  const [err,   setErr]   = useState('')
  const [hash,  setHash]  = useState('')
  const [status, setStatus] = useState('')

  useEffect(() => { if (open) { setTo(''); setAmt(''); setHash(''); setStatus(''); setErr('') } }, [open])

  const send = async () => {
    setErr('')
    if (!/^0x[a-fA-F0-9]{40}$/.test(to)) return setErr('Recipient must be a 0x address.')
    if (!amt || Number(amt) <= 0) return setErr('Enter an amount.')
    setBusy(true)
    try {
      const tx = token === 'USDC'
        ? await sendUSDC(wallet, to, amt)
        : await sendETH(wallet, to, amt)
      setHash(tx.hash); setStatus('pending')
      const r = await tx.wait()
      setStatus(r.status === 1 ? 'confirmed' : 'failed')
      onSent({ kind: 'send', token, amount: amt, to, hash: tx.hash, status: r.status === 1 ? 'confirmed' : 'failed', ts: Date.now() })
    } catch (e) { setErr(e?.shortMessage || e?.message || 'Send failed') }
    finally { setBusy(false) }
  }

  const label = { fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 6 }
  const inp = {
    width: '100%', boxSizing: 'border-box', background: C.surface2,
    border: '1px solid ' + C.line, color: C.white,
    padding: '12px 14px', borderRadius: 12, fontSize: 14, outline: 'none',
  }

  return (
    <Modal open={open} onClose={onClose} title="Send">
      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {['USDC', 'ETH'].map((t) => (
          <button key={t} onClick={() => setToken(t)} style={{
            flex: 1, padding: '10px 0', borderRadius: 999,
            background: token === t ? C.white : 'transparent',
            color: token === t ? C.bg : C.text2,
            border: '1px solid ' + (token === t ? C.white : C.lineStr),
            fontWeight: 600, cursor: 'pointer',
          }}>{t}</button>
        ))}
      </div>
      <div style={label}>To</div>
      <input value={to} onChange={(e) => setTo(e.target.value.trim())} placeholder="0x…"
             style={{ ...inp, fontFamily: FONT_MONO, fontSize: 13 }}/>
      <div style={{ ...label, marginTop: 14 }}>Amount</div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input type="number" inputMode="decimal" value={amt} onChange={(e) => setAmt(e.target.value)}
               placeholder="0.00" style={{ ...inp, fontFamily: FONT_MONO }}/>
        <button type="button" onClick={() => setAmt(
          token === 'USDC'
            ? formatUnits(balances.usdc, BASE.usdcDecimals)
            : formatUnits(balances.eth, 18)
        )} style={{
          padding: '0 16px', borderRadius: 12, background: C.surface2,
          border: '1px solid ' + C.line, color: C.text2, fontSize: 13, cursor: 'pointer',
        }}>Max</button>
      </div>
      <div style={{ marginTop: 8, fontSize: 11, color: C.muted, fontFamily: FONT_MONO }}>
        Balance: {token === 'USDC'
          ? formatUnits(balances.usdc, BASE.usdcDecimals)
          : formatUnits(balances.eth, 18).slice(0, 10)} {token}
      </div>
      {err && <div style={{ marginTop: 12, padding: '8px 12px', borderRadius: 10,
        background: 'rgba(255,122,138,0.12)', border: '1px solid rgba(255,122,138,0.3)',
        color: C.red, fontSize: 12 }}>{err}</div>}
      <button onClick={send} disabled={busy} style={{
        marginTop: 16, width: '100%', padding: '14px 0', borderRadius: 14,
        background: C.teal, color: C.bg, border: 0, fontWeight: 700, fontSize: 16,
        cursor: 'pointer', opacity: busy ? 0.7 : 1,
      }}>{busy ? 'Sending…' : `Send ${amt || '0'} ${token}`}</button>
      {hash && (
        <div style={{ marginTop: 14, padding: 12, borderRadius: 12, background: C.surface2,
          border: '1px solid ' + C.line, fontSize: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: C.muted }}>
            <span>Status</span>
            <span style={{ color: status === 'confirmed' ? C.green : status === 'failed' ? C.red : C.amber, fontWeight: 600 }}>
              {status === 'pending' && 'Pending…'}{status === 'confirmed' && 'Confirmed'}{status === 'failed' && 'Failed'}
            </span>
          </div>
          <div style={{ marginTop: 6, fontFamily: FONT_MONO, color: C.teal, wordBreak: 'break-all' }}>{hash}</div>
        </div>
      )}
    </Modal>
  )
}

function ReceiveSheet({ open, onClose, address }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try { await navigator.clipboard.writeText(address); setCopied(true); setTimeout(() => setCopied(false), 1500) } catch {}
  }
  return (
    <Modal open={open} onClose={onClose} title="Receive">
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 13, color: C.text2, marginBottom: 14 }}>
          Anyone with this address can send you USDC or ETH on Base.
        </div>
        {address && (
          <div style={{ display: 'inline-block', padding: 10, background: C.surface2,
            borderRadius: 16, border: '1px solid ' + C.line }}>
            <QRCode data={address} size={240} background={C.surface2} color={C.white}/>
          </div>
        )}
        <div style={{ marginTop: 14, padding: '10px 12px', borderRadius: 12,
          background: C.surface2, border: '1px solid ' + C.line,
          fontFamily: FONT_MONO, fontSize: 12, wordBreak: 'break-all', color: C.text2 }}>{address}</div>
        <button onClick={copy} style={{
          marginTop: 12, width: '100%', padding: '13px 0', borderRadius: 14,
          background: copied ? C.green : C.teal, color: C.bg, border: 0,
          fontWeight: 700, cursor: 'pointer', display: 'inline-flex',
          alignItems: 'center', justifyContent: 'center', gap: 8,
        }}><IconCopy size={16} stroke={C.bg}/>{copied ? 'Copied' : 'Copy address'}</button>
        <div style={{ marginTop: 10, fontSize: 11, color: C.muted }}>
          Network: <b style={{ color: C.text2 }}>Base mainnet</b>
        </div>
      </div>
    </Modal>
  )
}

/* ────────────────────────────────────────────────────────────────────────── *
 * Swap sheet — on-chain Uniswap V3 swap signed locally, no Uniswap UI involved
 * ────────────────────────────────────────────────────────────────────────── */
function SwapSheet({ open, onClose, wallet, balances, onSwapped }) {
  const [pay,   setPay]   = useState('USDC')   // pay token
  const [amt,   setAmt]   = useState('')
  const [out,   setOut]   = useState(0n)       // raw bigint quote
  const [quoting, setQuoting] = useState(false)
  const [allowance, setAllowance] = useState(0n)
  const [slippage, setSlippage] = useState(0.5) // %
  const [busy, setBusy] = useState(false)
  const [err,  setErr]  = useState('')
  const [hash, setHash] = useState('')
  const [status, setStatus] = useState('')
  const [stage,  setStage]  = useState('')      // '' | 'approving' | 'swapping'

  const receive = pay === 'USDC' ? 'ETH' : 'USDC'
  const payDec  = pay === 'USDC' ? BASE.usdcDecimals : 18
  const recDec  = receive === 'USDC' ? BASE.usdcDecimals : 18
  const tokenInAddr  = pay === 'USDC' ? BASE.usdc : BASE.weth
  const tokenOutAddr = pay === 'USDC' ? BASE.weth : BASE.usdc
  const needsApproval = pay === 'USDC'

  // Reset whenever the sheet opens
  useEffect(() => {
    if (!open) return
    setAmt(''); setOut(0n); setHash(''); setStatus(''); setErr(''); setStage('')
  }, [open])

  // Live allowance for USDC → ETH path
  useEffect(() => {
    if (!open || !needsApproval || !wallet?.address) return
    let cancelled = false
    getUsdcAllowance(wallet.address).then((a) => { if (!cancelled) setAllowance(a) }).catch(() => {})
    return () => { cancelled = true }
  }, [open, needsApproval, wallet?.address, hash])

  // Debounced quote refresh on amount / direction change
  useEffect(() => {
    if (!open) return
    setOut(0n)
    if (!amt || Number(amt) <= 0) return
    const id = setTimeout(async () => {
      try {
        setQuoting(true); setErr('')
        const amountIn = parseUnits(amt, payDec)
        const q = await getQuote({ tokenIn: tokenInAddr, tokenOut: tokenOutAddr, amountIn })
        setOut(q)
      } catch (e) {
        setOut(0n)
        setErr(e?.shortMessage || 'Could not get a quote')
      } finally { setQuoting(false) }
    }, 450)
    return () => clearTimeout(id)
  }, [amt, pay, open])

  const flip = () => { setPay(receive); setAmt(''); setOut(0n) }

  // Slippage-protected minimum
  const minOut = useMemo(() => {
    if (out === 0n) return 0n
    const bps = Math.round((100 - slippage) * 100) // e.g. 99.5% = 9950
    return (out * BigInt(bps)) / 10000n
  }, [out, slippage])

  const payBalRaw = pay === 'USDC' ? balances.usdc : balances.eth
  const payBalStr = pay === 'USDC' ? formatUnits(balances.usdc, BASE.usdcDecimals) : formatUnits(balances.eth, 18).slice(0, 10)

  const insufficientAllowance = needsApproval && amt && Number(amt) > 0 && allowance < parseUnits(amt || '0', payDec)
  const ctaLabel = busy
    ? (stage === 'approving' ? 'Approving…' : 'Swapping…')
    : insufficientAllowance
      ? `Approve USDC`
      : `Swap ${amt || '0'} ${pay} → ${receive}`

  const doSwap = async () => {
    setErr('')
    if (!amt || Number(amt) <= 0) return setErr('Enter an amount.')
    let amountIn
    try { amountIn = parseUnits(amt, payDec) }
    catch { return setErr('Invalid amount.') }
    if (amountIn > payBalRaw) return setErr(`Amount exceeds ${pay} balance.`)
    if (out === 0n) return setErr('No quote yet — wait a moment.')

    setBusy(true)
    try {
      // Approval step (only for USDC → ETH when allowance is short)
      if (insufficientAllowance) {
        setStage('approving')
        const tx = await approveUsdc(wallet, MAX_UINT256)
        setHash(tx.hash); setStatus('pending')
        const r = await tx.wait()
        if (r.status !== 1) throw new Error('Approval failed')
        setAllowance(MAX_UINT256)
        setStatus('confirmed')
        setStage('')
        setBusy(false)
        return // user taps Swap again
      }

      setStage('swapping')
      const tx = pay === 'USDC'
        ? await swapUsdcForEth(wallet, amountIn, minOut)
        : await swapEthForUsdc(wallet, amountIn, minOut)
      setHash(tx.hash); setStatus('pending')
      const r = await tx.wait()
      const ok = r.status === 1
      setStatus(ok ? 'confirmed' : 'failed')
      onSwapped({
        kind: 'swap',
        token: pay,
        receive,
        amount: amt,
        amountOut: formatUnits(out, recDec).slice(0, 10),
        hash: tx.hash,
        status: ok ? 'confirmed' : 'failed',
        ts: Date.now(),
      })
    } catch (e) {
      setErr(e?.shortMessage || e?.reason || e?.message || 'Swap failed')
      setStatus('failed')
    } finally { setBusy(false); setStage('') }
  }

  const card = {
    background: C.surface2, border: '1px solid ' + C.line,
    borderRadius: 14, padding: 14,
  }
  const label = { fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.15em' }

  // Display: out as a human-readable string
  const outStr = out === 0n ? '' : (() => {
    const s = formatUnits(out, recDec)
    const [w, f = ''] = s.split('.')
    return f ? `${w}.${f.slice(0, receive === 'USDC' ? 2 : 6)}` : w
  })()
  const rateStr = (() => {
    if (out === 0n || !amt || Number(amt) <= 0) return ''
    const num = Number(formatUnits(out, recDec))
    const denom = Number(amt)
    if (!num || !denom) return ''
    return `1 ${pay} ≈ ${(num / denom).toFixed(pay === 'USDC' ? 8 : 2)} ${receive}`
  })()

  return (
    <Modal open={open} onClose={onClose} title="Swap">
      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={label}>You pay</span>
          <button onClick={() => setAmt(pay === 'USDC' ? formatUnits(balances.usdc, BASE.usdcDecimals) : formatUnits(balances.eth, 18).slice(0, 8))}
            style={{ background: 'transparent', border: 0, color: C.teal, fontSize: 11, cursor: 'pointer', padding: 0 }}>
            Balance {payBalStr} · Max
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <input type="number" inputMode="decimal" min="0" step="0.000001"
            value={amt} onChange={(e) => setAmt(e.target.value)} placeholder="0.00"
            style={{ flex: 1, background: 'transparent', border: 0, color: C.white, fontSize: 22, outline: 'none', fontFamily: FONT_MONO }}/>
          <div style={{ background: C.surface, padding: '8px 14px', borderRadius: 999, fontWeight: 600 }}>{pay}</div>
        </div>
      </div>

      <div style={{ textAlign: 'center', margin: '6px 0' }}>
        <button onClick={flip} disabled={busy} style={{
          background: C.surface, border: '1px solid ' + C.line, borderRadius: '50%',
          width: 36, height: 36, color: C.teal, cursor: 'pointer', fontSize: 16,
        }}>⇅</button>
      </div>

      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={label}>You receive</span>
          {quoting && <span style={{ fontSize: 11, color: C.muted }}>quoting…</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1, fontSize: 22, color: outStr ? C.white : C.muted, fontFamily: FONT_MONO }}>
            {outStr || '0.00'}
          </div>
          <div style={{ background: C.surface, padding: '8px 14px', borderRadius: 999, fontWeight: 600 }}>{receive}</div>
        </div>
        {rateStr && (
          <div style={{ marginTop: 8, fontSize: 11, color: C.muted, fontFamily: FONT_MONO }}>{rateStr}</div>
        )}
      </div>

      <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <span style={{ ...label, textTransform: 'none', letterSpacing: 0 }}>Slippage tolerance</span>
        <div style={{ display: 'flex', gap: 6 }}>
          {[0.1, 0.5, 1.0].map((s) => (
            <button key={s} onClick={() => setSlippage(s)} style={{
              padding: '4px 10px', borderRadius: 999, fontSize: 12, cursor: 'pointer',
              background: slippage === s ? C.white : 'transparent',
              color: slippage === s ? C.bg : C.text2,
              border: '1px solid ' + (slippage === s ? C.white : C.lineStr),
              fontWeight: 600,
            }}>{s}%</button>
          ))}
        </div>
      </div>

      {err && (
        <div style={{
          marginTop: 12, padding: '8px 12px', borderRadius: 10,
          background: 'rgba(255,122,138,0.12)', border: '1px solid rgba(255,122,138,0.3)',
          color: C.red, fontSize: 12,
        }}>{err}</div>
      )}

      <button onClick={doSwap} disabled={busy || (!insufficientAllowance && out === 0n)}
        style={{
          marginTop: 14, width: '100%', padding: '14px 0', borderRadius: 14,
          background: insufficientAllowance ? C.amber : C.teal,
          color: C.bg, border: 0, fontWeight: 700, fontSize: 16,
          cursor: busy ? 'progress' : 'pointer',
          opacity: (busy || (!insufficientAllowance && out === 0n)) ? 0.55 : 1,
        }}>{ctaLabel}</button>

      {hash && (
        <div style={{
          marginTop: 14, padding: 12, borderRadius: 12, background: C.surface2,
          border: '1px solid ' + C.line, fontSize: 12,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: C.muted }}>
            <span>{stage === 'approving' || (insufficientAllowance && status !== 'confirmed') ? 'Approval' : 'Swap'} status</span>
            <span style={{ color: status === 'confirmed' ? C.green : status === 'failed' ? C.red : C.amber, fontWeight: 600 }}>
              {status === 'pending'   && 'Pending…'}
              {status === 'confirmed' && 'Confirmed'}
              {status === 'failed'    && 'Failed'}
            </span>
          </div>
          <div style={{ marginTop: 6, fontFamily: FONT_MONO, color: C.teal, wordBreak: 'break-all' }}>{hash}</div>
        </div>
      )}

      <div style={{ marginTop: 14, fontSize: 10, color: C.muted, textAlign: 'center', lineHeight: 1.5 }}>
        Executed on-chain via Uniswap V3 on Base. Your wallet signs locally — no browser, no third-party UI.
      </div>
    </Modal>
  )
}

/* ────────────────────────────────────────────────────────────────────────── *
 * Main wallet UI
 * ────────────────────────────────────────────────────────────────────────── */
function Home({ wallet, onLock }) {
  const [balances, setBalances] = useState({ eth: 0n, usdc: 0n })
  const [ethUsd,   setEthUsd]   = useState(0)
  const [tab,      setTab]      = useState('Assets')
  const [send,     setSend]     = useState(false)
  const [recv,     setRecv]     = useState(false)
  const [swap,     setSwap]     = useState(false)
  const [activity, setActivity] = useState([])
  const address = wallet.address

  const refresh = async () => {
    try { setBalances(await getBalances(address)) } catch {}
  }
  useEffect(() => {
    refresh()
    const id = setInterval(refresh, 10_000)
    return () => clearInterval(id)
  }, [address])
  useEffect(() => {
    const f = () => fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd')
      .then((r) => r.json()).then((j) => setEthUsd(Number(j?.ethereum?.usd) || 0)).catch(() => {})
    f(); const id = setInterval(f, 60_000); return () => clearInterval(id)
  }, [])

  const usdcNum = Number(formatUnits(balances.usdc, BASE.usdcDecimals))
  const ethNum  = Number(formatUnits(balances.eth, 18))
  const total   = usdcNum + ethNum * ethUsd
  const [whole, frac] = fmtUsd(total).split('.')

  const openOnramp = () => Browser.open({
    url: `https://pay.coinbase.com/buy/select-asset?destinationWallets=%5B%7B%22address%22%3A%22${address}%22%2C%22blockchains%22%3A%5B%22base%22%5D%7D%5D`,
  })

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(80% 50% at 50% 5%, rgba(0,224,184,0.10), transparent 60%),' + C.bg,
      color: C.white, paddingBottom: 120, fontFamily: 'Inter, sans-serif',
    }}>
      {/* TopBar */}
      <div style={{ padding: '52px 20px 6px', display: 'flex',
        alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{
          width: 38, height: 38, borderRadius: '50%',
          background: 'linear-gradient(135deg,#00E0B8 0%,#2A6FDB 60%,#7A4DFF 100%)',
        }}/>
        <div style={{
          background: C.surface, border: '1px solid ' + C.lineStr,
          padding: '8px 14px', borderRadius: 999, fontWeight: 600, fontSize: 14,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{ width: 14, height: 14, borderRadius: '50%',
            background: 'linear-gradient(135deg,#00E0B8,#2A6FDB)' }}/>
          {short(address)}
        </div>
        <button onClick={onLock} style={{
          width: 38, height: 38, borderRadius: '50%', background: C.surface,
          border: '1px solid ' + C.lineStr, color: C.text2, cursor: 'pointer',
          display: 'grid', placeItems: 'center',
        }}>
          <SvgIcon d={<><rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></>} size={16} stroke={C.text2}/>
        </button>
      </div>

      {/* Balance card */}
      <div style={{ position: 'relative', margin: '14px 16px 0' }}>
        <div style={{ position: 'absolute', inset: -30,
          background: 'radial-gradient(60% 60% at 50% 30%, rgba(0,224,184,0.35), transparent 70%)',
          filter: 'blur(20px)', pointerEvents: 'none' }}/>
        <div style={{ position: 'relative', borderRadius: 24, padding: '22px 22px 24px',
          background: 'radial-gradient(120% 90% at 100% 0%, rgba(0,224,184,0.55), transparent 55%),'
                    + 'linear-gradient(160deg,#003D34 0%,#0B1020 60%)',
          border: '1px solid rgba(0,224,184,0.25)',
          boxShadow: '0 20px 40px -10px rgba(0,224,184,0.25)', overflow: 'hidden' }}>
          <div style={{ fontSize: 10, color: 'rgba(244,247,251,0.65)',
            letterSpacing: '0.16em', textTransform: 'uppercase', fontFamily: FONT_MONO }}>
            Total balance · USD
          </div>
          <div style={{ fontWeight: 600, fontSize: 44, letterSpacing: '-0.035em',
            lineHeight: 1.02, margin: '10px 0 14px', fontFamily: FONT_HEAD,
            fontVariantNumeric: 'tabular-nums' }}>
            {whole}<span style={{ color: 'rgba(244,247,251,0.5)', fontSize: 28 }}>.{frac || '00'}</span>
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(60,214,140,0.16)', color: C.green,
            padding: '5px 10px', borderRadius: 999, fontWeight: 600, fontSize: 12,
            border: '1px solid rgba(60,214,140,0.28)' }}>
            Base · live
          </div>
        </div>
      </div>

      {/* Action row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, padding: '22px 20px 8px' }}>
        {[
          { label: 'Send',    Ic: IconSend, on: () => setSend(true)   },
          { label: 'Receive', Ic: IconRecv, on: () => setRecv(true)   },
          { label: 'Swap',    Ic: IconSwap, on: () => setSwap(true)    },
          { label: 'Buy',     Ic: IconBuy,  on: openOnramp             },
        ].map(({ label, Ic, on }) => (
          <button key={label} onClick={on} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
            background: 'transparent', border: 0, color: C.white, cursor: 'pointer',
          }}>
            <span style={{
              width: 54, height: 54, borderRadius: '50%',
              background: C.surface, border: '1px solid ' + C.lineStr,
              display: 'grid', placeItems: 'center',
            }}><Ic size={22} stroke={C.teal}/></span>
            <span style={{ fontSize: 12, fontWeight: 500 }}>{label}</span>
          </button>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, padding: '12px 20px' }}>
        {['Assets', 'Activity'].map((t) => {
          const on = tab === t
          return (
            <button key={t} onClick={() => setTab(t)} style={{
              border: '1px solid ' + (on ? C.lineStr : 'transparent'),
              background: on ? C.surface2 : 'transparent',
              color: on ? C.white : C.muted, padding: '8px 14px', borderRadius: 999,
              fontWeight: on ? 600 : 500, fontSize: 13, cursor: 'pointer',
            }}>{t}</button>
          )
        })}
      </div>

      {/* Asset list */}
      {tab === 'Assets' && (
        <div style={{ margin: '4px 16px 0', padding: '10px 16px',
          background: C.surface, border: '1px solid ' + C.line, borderRadius: 20 }}>
          {[
            { name: 'USD Coin', symbol: 'USDC', bg: '#2775CA', mark: '$',
              bal: formatUnits(balances.usdc, BASE.usdcDecimals), usd: usdcNum },
            { name: 'Ethereum', symbol: 'ETH', bg: '#1E2742', mark: 'Ξ',
              bal: formatUnits(balances.eth, 18).slice(0, 8), usd: ethNum * ethUsd },
          ].map((r, i, arr) => (
            <div key={r.symbol} style={{ display: 'grid', gridTemplateColumns: '40px 1fr auto',
              gap: 14, alignItems: 'center', padding: '14px 4px',
              borderBottom: i === arr.length - 1 ? 0 : '1px solid ' + C.line }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: r.bg,
                display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 700 }}>{r.mark}</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{r.name}</div>
                <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.muted, marginTop: 2 }}>Base</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 600, fontSize: 15 }}>${r.usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.muted, marginTop: 2 }}>{r.bal} {r.symbol}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'Activity' && (
        <div style={{ margin: '4px 16px 0', padding: activity.length ? '10px 16px' : '40px 20px',
          background: C.surface, border: '1px solid ' + C.line, borderRadius: 20,
          textAlign: activity.length ? 'left' : 'center', color: activity.length ? C.white : C.muted, fontSize: 14 }}>
          {!activity.length && 'Your recent transactions appear here.'}
          {activity.map((a, i) => {
            const isSwap = a.kind === 'swap'
            return (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '40px 1fr auto',
                gap: 14, alignItems: 'center', padding: '12px 4px',
                borderBottom: i === activity.length - 1 ? 0 : '1px solid ' + C.line }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: C.surface2,
                  display: 'grid', placeItems: 'center' }}>
                  {isSwap ? <IconSwap size={18} stroke={C.teal}/> : <IconSend size={18} stroke={C.teal}/>}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>
                    {isSwap ? `Swap ${a.token} → ${a.receive}` : `Sent ${a.token}`}
                  </div>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.muted, marginTop: 2 }}>
                    {isSwap ? 'Uniswap V3 on Base' : `to ${short(a.to)}`} · {new Date(a.ts).toLocaleString()}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>
                    {isSwap ? `+${a.amountOut} ${a.receive}` : `−${a.amount} ${a.token}`}
                  </div>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 11, marginTop: 2,
                    color: a.status === 'confirmed' ? C.green : a.status === 'failed' ? C.red : C.amber }}>{a.status}</div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <SendSheet    open={send} onClose={() => setSend(false)} wallet={wallet} balances={balances}
                    onSent={(e) => { setActivity((p) => [e, ...p].slice(0, 50)); refresh() }}/>
      <ReceiveSheet open={recv} onClose={() => setRecv(false)} address={address}/>
      <SwapSheet    open={swap} onClose={() => setSwap(false)} wallet={wallet} balances={balances}
                    onSwapped={(e) => { setActivity((p) => [e, ...p].slice(0, 50)); refresh() }}/>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────────────── *
 * Root native wallet shell
 * ────────────────────────────────────────────────────────────────────────── */
export default function NativeWalletApp() {
  const [state, setState] = useState('loading') // loading | onboard | locked | unlocked
  const [wallet, setWallet] = useState(null)

  useEffect(() => {
    (async () => {
      try {
        const has = await hasWallet()
        const ok  = await mnemonicConfirmed()
        setState(has && ok ? 'locked' : 'onboard')
      } catch { setState('onboard') }
    })()
  }, [])

  const lock = () => { setWallet(null); setState('locked') }
  const doReset = async () => {
    if (!confirm('This wipes the wallet from this phone. Make sure you have your recovery phrase. Continue?')) return
    await reset(); setWallet(null); setState('onboard')
  }

  if (state === 'loading') return <div style={{ background: C.bg, minHeight: '100vh' }}/>
  if (state === 'onboard') return <div style={{ background: C.bg, minHeight: '100vh' }}>
    <Onboarding onDone={(w) => { setWallet(w); setState('unlocked') }}/>
  </div>
  if (state === 'locked')  return <div style={{ background: C.bg, minHeight: '100vh' }}>
    <UnlockScreen onUnlocked={(w) => { setWallet(w); setState('unlocked') }} onReset={doReset}/>
  </div>
  return <Home wallet={wallet} onLock={lock}/>
}
