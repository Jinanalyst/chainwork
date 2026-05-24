import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Icon } from '../components/ui.jsx'
import { useSession, getWalletAddress } from '../hooks/useSession.js'
import { PLATFORM_WALLETS, savePaymentProof, userReference } from '../lib/platform.js'

/* ────────────────────────────────────────────────────────────────────────── *
 * Chain config — USDC on Base mainnet
 * ────────────────────────────────────────────────────────────────────────── */
const BASE_CHAIN_ID_HEX = '0x2105'
const BASE_RPC          = 'https://mainnet.base.org'
const USDC_BASE         = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
const USDC_DECIMALS     = 6
const ESCROW_USDC = PLATFORM_WALLETS.find((w) => w.id === 'usdc-base')?.address || ''

const ACTIVITY_KEY = 'chainpay.activity.v1'

/* ─── colour tokens lifted from the prototype ─────────────────────────── */
const C = {
  bg:       '#0B1020',
  surface:  '#141A2E',
  surface2: '#1E2742',
  line:     'rgba(244,247,251,0.08)',
  lineStr:  'rgba(244,247,251,0.14)',
  white:    '#F4F7FB',
  text2:    '#C5CCDF',
  muted:    '#6B7390',
  teal:     '#00E0B8',
  amber:    '#FFB547',
  green:    '#3CD68C',
  red:      '#FF7A8A',
}

/* ────────────────────────────────────────────────────────────────────────── *
 * Hex / number helpers
 * ────────────────────────────────────────────────────────────────────────── */
const stripHex   = (h) => (h || '0x0').replace(/^0x/, '')
const hexToBig   = (h) => BigInt(h || '0x0')
const pad32      = (hex) => stripHex(hex).padStart(64, '0')
const addrPad    = (a) => pad32((a || '').toLowerCase())
const uintPad    = (n) => pad32(n.toString(16))
const isAddr     = (a) => /^0x[a-fA-F0-9]{40}$/.test(a || '')

const formatUnits = (raw, decimals, maxFrac = decimals) => {
  const s = raw.toString().padStart(decimals + 1, '0')
  const whole = s.slice(0, -decimals)
  const frac  = s.slice(-decimals).replace(/0+$/, '').slice(0, maxFrac)
  return frac ? `${whole}.${frac}` : whole
}
const parseUnits = (str, decimals) => {
  const [w = '0', f = ''] = String(str).trim().split('.')
  const frac = (f + '0'.repeat(decimals)).slice(0, decimals)
  return BigInt(w || '0') * 10n ** BigInt(decimals) + BigInt(frac || '0')
}
const fmtUsd = (n) => {
  if (!Number.isFinite(n)) return '$0.00'
  return n.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 2 })
}

async function rpc(method, params) {
  const r = await fetch(BASE_RPC, {
    method:  'POST',
    headers: { 'content-type': 'application/json' },
    body:    JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  })
  const j = await r.json()
  if (j.error) throw new Error(j.error.message || 'RPC error')
  return j.result
}
async function fetchUsdcBalance(a) {
  if (!a) return 0n
  return hexToBig(await rpc('eth_call', [{ to: USDC_BASE, data: '0x70a08231' + addrPad(a) }, 'latest']))
}
async function fetchEthBalance(a) {
  if (!a) return 0n
  return hexToBig(await rpc('eth_getBalance', [a, 'latest']))
}
async function fetchEthUsd() {
  try {
    const r = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd')
    const j = await r.json()
    return Number(j?.ethereum?.usd) || 0
  } catch { return 0 }
}

/* ────────────────────────────────────────────────────────────────────────── *
 * Local activity store
 * ────────────────────────────────────────────────────────────────────────── */
const loadActivity = () => {
  try { return JSON.parse(localStorage.getItem(ACTIVITY_KEY) || '[]') } catch { return [] }
}
const saveActivity = (list) => {
  try { localStorage.setItem(ACTIVITY_KEY, JSON.stringify(list.slice(0, 50))) } catch {}
}

/* ────────────────────────────────────────────────────────────────────────── *
 * Tiny SVG icons (stroke 1.6) — match the prototype set
 * ────────────────────────────────────────────────────────────────────────── */
const SvgIcon = ({ d, size = 20, stroke = C.white, sw = 1.6, fill = 'none' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke}
       strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">{d}</svg>
)
const IconQR    = (p) => <SvgIcon {...p} d={<><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><path d="M14 14h3v3h-3zM20 14v3M14 20h3M20 20v1"/></>} />
const IconCaret = (p) => <SvgIcon {...p} d={<path d="M6 9l6 6 6-6"/>} />
const IconSend  = (p) => <SvgIcon {...p} d={<path d="M5 19L19 5M19 5H9M19 5v10"/>} />
const IconRecv  = (p) => <SvgIcon {...p} d={<path d="M19 5L5 19M5 19h10M5 19V9"/>} />
const IconSwap  = (p) => <SvgIcon {...p} d={<><path d="M4 7h13M14 4l3 3-3 3"/><path d="M20 17H7M10 20l-3-3 3-3"/></>} />
const IconBuy   = (p) => <SvgIcon {...p} d={<path d="M12 5v14M5 12h14"/>} />
const IconHome  = (p) => <SvgIcon {...p} d={<path d="M3 11l9-7 9 7v9a1 1 0 01-1 1h-5v-7H9v7H4a1 1 0 01-1-1v-9z"/>} />
const IconCard  = (p) => <SvgIcon {...p} d={<><rect x="3" y="6" width="18" height="13" rx="2.5"/><path d="M3 10h18M7 15h3"/></>} />
const IconEarn  = (p) => <SvgIcon {...p} d={<path d="M4 17l5-6 4 4 7-9"/>} />
const IconBrow  = (p) => <SvgIcon {...p} d={<><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.7 4 6 4 9s-1.5 6.3-4 9c-2.5-2.7-4-6-4-9s1.5-6.3 4-9z"/></>} />
const IconClose = (p) => <SvgIcon {...p} d={<path d="M6 6l12 12M18 6L6 18"/>} />
const IconCopy  = (p) => <SvgIcon {...p} d={<><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></>} />
const IconExt   = (p) => <SvgIcon {...p} d={<><path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4"/><path d="M14 4h6v6M20 4l-9 9"/></>} />

/* ────────────────────────────────────────────────────────────────────────── *
 * Wallet hook — connection + live balances + price
 * ────────────────────────────────────────────────────────────────────────── */
function useWallet() {
  const [address, setAddress] = useState('')
  const [chainId, setChainId] = useState(null)
  const [usdc,    setUsdc]    = useState(0n)
  const [ethBal,  setEthBal]  = useState(0n)
  const [ethUsd,  setEthUsd]  = useState(0)
  const [loading, setLoading] = useState(false)
  const [err,     setErr]     = useState('')
  const eth1193 = typeof window !== 'undefined' ? window.ethereum : null

  const connect = async () => {
    setErr('')
    if (!eth1193) { setErr('No browser wallet detected. Install MetaMask to use ChainPay.'); return }
    try {
      const accs = await eth1193.request({ method: 'eth_requestAccounts' })
      setAddress(accs?.[0] || '')
      setChainId(await eth1193.request({ method: 'eth_chainId' }))
    } catch (e) { setErr(e?.message || 'Connection rejected') }
  }

  const switchToBase = async () => {
    if (!eth1193) return
    setErr('')
    try {
      await eth1193.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: BASE_CHAIN_ID_HEX }] })
    } catch (e) {
      if (e?.code === 4902) {
        try {
          await eth1193.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: BASE_CHAIN_ID_HEX,
              chainName: 'Base',
              nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
              rpcUrls: [BASE_RPC],
              blockExplorerUrls: ['https://basescan.org'],
            }],
          })
        } catch (e2) { setErr(e2?.message || 'Could not add Base') }
      } else { setErr(e?.message || 'Network switch rejected') }
    }
  }

  useEffect(() => {
    if (!eth1193) return
    const onAccs  = (a) => setAddress(a?.[0] || '')
    const onChain = (c) => setChainId(c)
    eth1193.on?.('accountsChanged', onAccs)
    eth1193.on?.('chainChanged',    onChain)
    eth1193.request?.({ method: 'eth_accounts' }).then((a) => { if (a?.[0]) setAddress(a[0]) }).catch(() => {})
    eth1193.request?.({ method: 'eth_chainId' }).then(setChainId).catch(() => {})
    return () => {
      eth1193.removeListener?.('accountsChanged', onAccs)
      eth1193.removeListener?.('chainChanged',    onChain)
    }
  }, [eth1193])

  const refresh = async () => {
    if (!address) return
    setLoading(true)
    try {
      const [u, e] = await Promise.all([fetchUsdcBalance(address), fetchEthBalance(address)])
      setUsdc(u); setEthBal(e)
    } catch (e) { setErr(e?.message || 'Balance fetch failed') }
    finally { setLoading(false) }
  }
  useEffect(() => {
    if (!address) return
    refresh()
    const id = setInterval(refresh, 10_000)
    return () => clearInterval(id)
  }, [address])

  useEffect(() => {
    fetchEthUsd().then(setEthUsd)
    const id = setInterval(() => fetchEthUsd().then(setEthUsd), 60_000)
    return () => clearInterval(id)
  }, [])

  const usdcNum = Number(formatUnits(usdc, USDC_DECIMALS))
  const ethNum  = Number(formatUnits(ethBal, 18))
  const totalUsd = usdcNum + ethNum * ethUsd

  return {
    eth1193, address, chainId, usdc, ethBal, ethUsd, usdcNum, ethNum, totalUsd,
    loading, err, setErr, connect, switchToBase, refresh,
    onBase: chainId === BASE_CHAIN_ID_HEX,
  }
}

/* ────────────────────────────────────────────────────────────────────────── *
 * Modal shell
 * ────────────────────────────────────────────────────────────────────────── */
function Modal({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])
  if (!open) return null
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)',
        display: 'grid', placeItems: 'center', padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 420, maxHeight: '85vh', overflow: 'auto',
          background: C.surface, color: C.white,
          border: '1px solid ' + C.lineStr,
          borderRadius: 20, boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 18px', borderBottom: '1px solid ' + C.line,
        }}>
          <div style={{ fontWeight: 600, fontSize: 16 }}>{title}</div>
          <button onClick={onClose} style={{
            background: 'transparent', border: 0, color: C.text2, cursor: 'pointer', padding: 4,
          }}><IconClose size={20} stroke={C.text2}/></button>
        </div>
        <div style={{ padding: 18 }}>{children}</div>
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────────────── *
 * Send / Receive / Swap / Buy modals
 * ────────────────────────────────────────────────────────────────────────── */
function SendModal({ open, onClose, w, pushActivity, prefillTo = '' }) {
  const { user } = useSession()
  const [token,   setToken]   = useState('USDC')
  const [to,      setTo]      = useState(prefillTo)
  const [amount,  setAmount]  = useState('')
  const [memo,    setMemo]    = useState(() => userReference(user))
  const [busy,    setBusy]    = useState(false)
  const [hash,    setHash]    = useState('')
  const [status,  setStatus]  = useState('')
  const [error,   setError]   = useState('')

  useEffect(() => { if (open) { setTo(prefillTo); setAmount(''); setHash(''); setStatus(''); setError('') } }, [open, prefillTo])

  const send = async () => {
    setError('')
    if (!w.address)   return setError('Connect a wallet first.')
    if (!isAddr(to))  return setError('Recipient must be a valid 0x address.')
    if (!amount || Number(amount) <= 0) return setError('Enter an amount.')
    if (!w.onBase)    return setError('Switch to Base network first.')

    let tx
    try {
      if (token === 'USDC') {
        const raw = parseUnits(amount, USDC_DECIMALS)
        if (raw > w.usdc) return setError('Amount exceeds USDC balance.')
        const data = '0xa9059cbb' + addrPad(to) + uintPad(raw)
        tx = { from: w.address, to: USDC_BASE, data, value: '0x0' }
      } else {
        const raw = parseUnits(amount, 18)
        if (raw > w.ethBal) return setError('Amount exceeds ETH balance.')
        tx = { from: w.address, to, value: '0x' + raw.toString(16) }
      }
    } catch { return setError('Invalid amount.') }

    setBusy(true)
    try {
      const h = await w.eth1193.request({ method: 'eth_sendTransaction', params: [tx] })
      setHash(h); setStatus('pending')
      pushActivity({
        kind: 'send', token, amount, to, hash: h, status: 'pending', ts: Date.now(),
      })

      const poll = async () => {
        try {
          const r = await rpc('eth_getTransactionReceipt', [h])
          if (r) {
            const ok = r.status === '0x1'
            setStatus(ok ? 'confirmed' : 'failed')
            pushActivity({ kind: 'send', token, amount, to, hash: h, status: ok ? 'confirmed' : 'failed', ts: Date.now() })
            w.refresh()
            if (ok) {
              try {
                await savePaymentProof({
                  kind: to.toLowerCase() === ESCROW_USDC.toLowerCase() ? 'task' : 'transfer',
                  reference: memo, amount: `${amount} ${token}`, token, chain: 'Base',
                  toAddress: to, fromWallet: w.address, txHash: h,
                })
              } catch {}
            }
            return
          }
        } catch {}
        setTimeout(poll, 3000)
      }
      poll()
    } catch (e) {
      setError(e?.message || 'Transaction rejected')
    } finally { setBusy(false) }
  }

  const label = { fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 6 }
  const inp   = {
    width: '100%', boxSizing: 'border-box',
    background: C.surface2, border: '1px solid ' + C.line, color: C.white,
    padding: '10px 12px', borderRadius: 12, fontFamily: 'inherit', fontSize: 14, outline: 'none',
  }

  return (
    <Modal open={open} onClose={onClose} title="Send">
      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {['USDC', 'ETH'].map((t) => (
          <button key={t} onClick={() => setToken(t)} style={{
            flex: 1, padding: '8px 0', borderRadius: 999,
            background: token === t ? C.white : 'transparent',
            color: token === t ? C.bg : C.text2,
            border: '1px solid ' + (token === t ? C.white : C.lineStr),
            fontWeight: 600, cursor: 'pointer',
          }}>{t}</button>
        ))}
      </div>

      <div style={label}>To</div>
      <input value={to} onChange={(e) => setTo(e.target.value.trim())} placeholder="0x…"
             style={{ ...inp, fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }} />
      <button onClick={() => setTo(ESCROW_USDC)} style={{
        marginTop: 6, background: 'transparent', border: 0, color: C.teal,
        fontSize: 12, cursor: 'pointer', padding: 0,
      }}>Use ChainWork escrow address</button>

      <div style={{ ...label, marginTop: 14 }}>Amount</div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input type="number" min="0" step="0.000001" value={amount}
               onChange={(e) => setAmount(e.target.value)} placeholder="0.00"
               style={{ ...inp, fontFamily: 'JetBrains Mono, monospace' }} />
        <button onClick={() => setAmount(
          token === 'USDC'
            ? formatUnits(w.usdc, USDC_DECIMALS)
            : formatUnits(w.ethBal, 18, 8)
        )} style={{
          padding: '0 14px', borderRadius: 12, background: C.surface2,
          border: '1px solid ' + C.line, color: C.text2, fontSize: 12, cursor: 'pointer',
        }}>Max</button>
      </div>
      <div style={{ marginTop: 6, fontSize: 11, color: C.muted, fontFamily: 'JetBrains Mono, monospace' }}>
        Balance: {token === 'USDC' ? formatUnits(w.usdc, USDC_DECIMALS) : formatUnits(w.ethBal, 18, 6)} {token}
      </div>

      <div style={{ ...label, marginTop: 14 }}>Memo / reference</div>
      <input value={memo} onChange={(e) => setMemo(e.target.value)} style={{ ...inp, fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }} />

      {error && (
        <div style={{
          marginTop: 12, padding: '8px 12px', borderRadius: 10,
          background: 'rgba(255,122,138,0.12)', border: '1px solid rgba(255,122,138,0.3)',
          color: C.red, fontSize: 12,
        }}>{error}</div>
      )}

      <button onClick={send} disabled={busy || !w.onBase}
        style={{
          marginTop: 16, width: '100%', padding: '12px 0', borderRadius: 14,
          background: C.teal, color: C.bg, border: 0, fontWeight: 700, fontSize: 15,
          cursor: busy ? 'progress' : 'pointer', opacity: busy ? 0.7 : 1,
        }}>
        {busy ? 'Awaiting signature…' : `Send ${amount || '0'} ${token}`}
      </button>

      {hash && (
        <div style={{
          marginTop: 14, padding: 12, borderRadius: 12, background: C.surface2,
          border: '1px solid ' + C.line, fontSize: 12,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: C.muted }}>
            <span>Status</span>
            <span style={{
              color: status === 'confirmed' ? C.green : status === 'failed' ? C.red : C.amber,
              fontWeight: 600,
            }}>
              {status === 'pending'   && 'Pending…'}
              {status === 'confirmed' && 'Confirmed'}
              {status === 'failed'    && 'Failed'}
            </span>
          </div>
          <a href={`https://basescan.org/tx/${hash}`} target="_blank" rel="noreferrer" style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginTop: 6, color: C.teal, textDecoration: 'none',
            fontFamily: 'JetBrains Mono, monospace',
          }}>
            <span>{hash.slice(0, 10)}…{hash.slice(-8)}</span>
            <IconExt size={14} stroke={C.teal}/>
          </a>
        </div>
      )}
    </Modal>
  )
}

function ReceiveModal({ open, onClose, address }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try { await navigator.clipboard.writeText(address); setCopied(true); setTimeout(() => setCopied(false), 1500) } catch {}
  }
  const qrUrl = address
    ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&bgcolor=141A2E&color=F4F7FB&qzone=2&data=${encodeURIComponent(address)}`
    : ''
  return (
    <Modal open={open} onClose={onClose} title="Receive">
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 13, color: C.text2, marginBottom: 14 }}>
          Share this address to receive USDC, ETH, or any ERC-20 on Base.
        </div>
        {qrUrl && (
          <div style={{
            display: 'inline-block', padding: 8, background: C.surface2,
            borderRadius: 16, border: '1px solid ' + C.line,
          }}>
            <img src={qrUrl} width={240} height={240} alt="Wallet QR" style={{ display: 'block', borderRadius: 8 }} />
          </div>
        )}
        <div style={{
          marginTop: 16, fontFamily: 'JetBrains Mono, monospace', fontSize: 12,
          background: C.surface2, border: '1px solid ' + C.line,
          borderRadius: 12, padding: '10px 12px', wordBreak: 'break-all', color: C.text2,
        }}>{address || 'Connect a wallet'}</div>
        <button onClick={copy} disabled={!address} style={{
          marginTop: 12, width: '100%', padding: '11px 0', borderRadius: 12,
          background: copied ? C.green : C.teal, color: C.bg, border: 0,
          fontWeight: 700, cursor: address ? 'pointer' : 'not-allowed',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <IconCopy size={16} stroke={C.bg}/>
          {copied ? 'Copied' : 'Copy address'}
        </button>
        <div style={{ marginTop: 10, fontSize: 11, color: C.muted }}>
          Network: <b style={{ color: C.text2 }}>Base mainnet</b> · Don't send from other chains.
        </div>
      </div>
    </Modal>
  )
}

function SwapModal({ open, onClose, w }) {
  // Real-time mid-market price quote; actual swap routed via Uniswap web app
  const [fromTok, setFromTok] = useState('USDC')
  const [toTok,   setToTok]   = useState('ETH')
  const [amount,  setAmount]  = useState('')
  const price = w.ethUsd || 0
  const out = useMemo(() => {
    const n = Number(amount)
    if (!n || !price) return ''
    if (fromTok === 'USDC' && toTok === 'ETH') return (n / price).toFixed(6)
    if (fromTok === 'ETH' && toTok === 'USDC') return (n * price).toFixed(2)
    return n.toFixed(6)
  }, [amount, price, fromTok, toTok])

  const flip = () => { setFromTok(toTok); setToTok(fromTok); setAmount(out || '') }
  const uniHref = `https://app.uniswap.org/#/swap?chain=base&inputCurrency=${fromTok === 'USDC' ? USDC_BASE : 'ETH'}&outputCurrency=${toTok === 'USDC' ? USDC_BASE : 'ETH'}`

  const card = {
    background: C.surface2, border: '1px solid ' + C.line, borderRadius: 14, padding: 14,
  }

  return (
    <Modal open={open} onClose={onClose} title="Swap">
      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: C.muted, marginBottom: 6 }}>
          <span>You pay</span>
          <span>Balance {fromTok === 'USDC' ? formatUnits(w.usdc, USDC_DECIMALS) : formatUnits(w.ethBal, 18, 6)}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <input type="number" min="0" step="0.000001" value={amount}
                 onChange={(e) => setAmount(e.target.value)} placeholder="0.00"
                 style={{ flex: 1, background: 'transparent', border: 0, color: C.white, fontSize: 22, outline: 'none', fontFamily: 'JetBrains Mono, monospace' }} />
          <div style={{ background: C.surface, padding: '6px 12px', borderRadius: 999, fontWeight: 600 }}>{fromTok}</div>
        </div>
      </div>

      <div style={{ textAlign: 'center', margin: '6px 0' }}>
        <button onClick={flip} style={{
          background: C.surface, border: '1px solid ' + C.line, borderRadius: '50%',
          width: 36, height: 36, color: C.teal, cursor: 'pointer',
        }}>⇅</button>
      </div>

      <div style={card}>
        <div style={{ fontSize: 11, color: C.muted, marginBottom: 6 }}>You receive (estimated)</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1, fontSize: 22, color: out ? C.white : C.muted, fontFamily: 'JetBrains Mono, monospace' }}>
            {out || '0.00'}
          </div>
          <div style={{ background: C.surface, padding: '6px 12px', borderRadius: 999, fontWeight: 600 }}>{toTok}</div>
        </div>
      </div>

      <div style={{ marginTop: 10, fontSize: 11, color: C.muted, textAlign: 'center' }}>
        Rate: 1 ETH ≈ {fmtUsd(price)} · live
      </div>

      <a href={uniHref} target="_blank" rel="noreferrer" style={{
        display: 'block', marginTop: 16, padding: '12px 0', textAlign: 'center',
        background: C.teal, color: C.bg, fontWeight: 700, fontSize: 15,
        borderRadius: 14, textDecoration: 'none',
      }}>Continue on Uniswap ↗</a>
      <div style={{ marginTop: 8, fontSize: 11, color: C.muted, textAlign: 'center' }}>
        Routed through Uniswap on Base for best execution. Your wallet signs the swap there.
      </div>
    </Modal>
  )
}

function BuyModal({ open, onClose, address }) {
  const moonpay = `https://buy.moonpay.com/?currencyCode=usdc_base&walletAddress=${address}`
  const coinbase = `https://pay.coinbase.com/buy/select-asset?destinationWallets=%5B%7B%22address%22%3A%22${address}%22%2C%22blockchains%22%3A%5B%22base%22%5D%7D%5D`
  const card = {
    display: 'block', padding: '14px 16px', borderRadius: 14,
    background: C.surface2, border: '1px solid ' + C.line, color: C.white,
    textDecoration: 'none', marginBottom: 10,
  }
  return (
    <Modal open={open} onClose={onClose} title="Buy crypto">
      <div style={{ fontSize: 13, color: C.text2, marginBottom: 14 }}>
        Top up USDC or ETH straight to your wallet on Base.
      </div>
      <a href={address ? coinbase : '#'} target="_blank" rel="noreferrer" style={card}>
        <div style={{ fontWeight: 600 }}>Coinbase Onramp</div>
        <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>Card / bank · USD, EUR, KRW · low fees</div>
      </a>
      <a href={address ? moonpay : '#'} target="_blank" rel="noreferrer" style={card}>
        <div style={{ fontWeight: 600 }}>MoonPay</div>
        <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>Card / Apple Pay · 160+ countries</div>
      </a>
      {!address && (
        <div style={{ marginTop: 4, fontSize: 11, color: C.amber }}>
          Connect a wallet first so the onramp knows where to send the funds.
        </div>
      )}
    </Modal>
  )
}

/* ────────────────────────────────────────────────────────────────────────── *
 * Wallet UI — mirrors the prototype's home screen
 * ────────────────────────────────────────────────────────────────────────── */
function WalletApp() {
  const w = useWallet()
  const [tab,    setTab]   = useState('Assets')
  const [send,   setSend]  = useState(false)
  const [recv,   setRecv]  = useState(false)
  const [swap,   setSwap]  = useState(false)
  const [buy,    setBuy]   = useState(false)
  const [activity, setActivityList] = useState(loadActivity)

  const pushActivity = (entry) => {
    setActivityList((cur) => {
      // dedupe by hash if present
      const without = entry.hash ? cur.filter((x) => x.hash !== entry.hash) : cur
      const next = [entry, ...without]
      saveActivity(next)
      return next
    })
  }

  const short = (a) => a ? `${a.slice(0, 6)}…${a.slice(-4)}` : ''
  const total = w.totalUsd
  const [whole, frac] = fmtUsd(total).split('.')

  /* ── chrome ─────────────────────────────────────────────────────────── */
  const TopBar = () => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px 6px' }}>
      <div style={{
        width: 38, height: 38, borderRadius: '50%',
        background: 'linear-gradient(135deg,#00E0B8 0%,#2A6FDB 60%,#7A4DFF 100%)',
        boxShadow: 'inset 0 0 0 2px rgba(11,16,32,0.6)',
      }}/>
      <button onClick={w.address ? undefined : w.connect} style={{
        border: '1px solid ' + C.lineStr, background: C.surface, color: C.white,
        padding: '8px 14px 8px 12px', borderRadius: 999,
        display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: 14,
        cursor: w.address ? 'default' : 'pointer',
      }}>
        <span style={{ width: 14, height: 14, borderRadius: '50%',
          background: w.address ? 'linear-gradient(135deg,#00E0B8,#2A6FDB)' : C.muted }}/>
        {w.address ? short(w.address) : 'Connect wallet'}
        <IconCaret size={16} stroke={C.text2}/>
      </button>
      <button onClick={() => setRecv(true)} style={{
        width: 38, height: 38, borderRadius: '50%',
        background: C.surface, border: '1px solid ' + C.lineStr,
        display: 'grid', placeItems: 'center', cursor: 'pointer',
      }}><IconQR size={18} stroke={C.white}/></button>
    </div>
  )

  const BalanceCard = () => (
    <div style={{ position: 'relative', margin: '14px 16px 0' }}>
      <div style={{
        position: 'absolute', inset: -30,
        background: 'radial-gradient(60% 60% at 50% 30%, rgba(0,224,184,0.35), transparent 70%)',
        filter: 'blur(20px)', pointerEvents: 'none',
      }}/>
      <div style={{
        position: 'relative', borderRadius: 24, padding: '22px 22px 24px',
        background:
          'radial-gradient(120% 90% at 100% 0%, rgba(0,224,184,0.55), transparent 55%),' +
          'linear-gradient(160deg,#003D34 0%,#0B1020 60%)',
        border: '1px solid rgba(0,224,184,0.25)',
        boxShadow: '0 20px 40px -10px rgba(0,224,184,0.25)',
        overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 10, color: 'rgba(244,247,251,0.65)', letterSpacing: '0.16em', textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace' }}>
            Total balance · USD
          </div>
          <div style={{
            fontSize: 10, color: C.teal, letterSpacing: '0.14em', textTransform: 'uppercase',
            display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'JetBrains Mono, monospace',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.teal, boxShadow: '0 0 8px ' + C.teal }}/>
            Base · live
          </div>
        </div>
        <div style={{
          fontWeight: 600, fontSize: 48, letterSpacing: '-0.035em', lineHeight: 1.02,
          margin: '10px 0 14px', fontVariantNumeric: 'tabular-nums',
          fontFamily: 'Space Grotesk, sans-serif',
        }}>
          {whole}<span style={{ color: 'rgba(244,247,251,0.5)', fontSize: 32 }}>.{frac || '00'}</span>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(60,214,140,0.16)', color: C.green,
            padding: '5px 10px', borderRadius: 999, fontWeight: 600, fontSize: 12,
            border: '1px solid rgba(60,214,140,0.28)',
          }}>
            {w.loading ? 'Syncing…' : w.address ? 'Live' : 'Not connected'}
          </div>
          <div style={{ fontSize: 12, color: 'rgba(244,247,251,0.55)', fontFamily: 'JetBrains Mono, monospace' }}>
            ETH ≈ {fmtUsd(w.ethUsd)}
          </div>
        </div>
        {!w.address && (
          <button onClick={w.connect} style={{
            marginTop: 14, padding: '10px 16px', borderRadius: 12,
            background: C.teal, color: C.bg, border: 0, fontWeight: 700, cursor: 'pointer',
          }}>Connect wallet</button>
        )}
        {w.address && !w.onBase && (
          <button onClick={w.switchToBase} style={{
            marginTop: 14, padding: '8px 14px', borderRadius: 999,
            background: 'rgba(255,181,71,0.18)', color: C.amber,
            border: '1px solid rgba(255,181,71,0.4)', fontWeight: 600, fontSize: 12, cursor: 'pointer',
          }}>Switch to Base</button>
        )}
        {w.err && (
          <div style={{
            marginTop: 12, fontSize: 11, color: C.red,
            background: 'rgba(255,122,138,0.08)', border: '1px solid rgba(255,122,138,0.25)',
            padding: '6px 10px', borderRadius: 10,
          }}>{w.err}</div>
        )}
      </div>
    </div>
  )

  const ActionRow = () => {
    const actions = [
      { label: 'Send',    Ic: IconSend, on: () => setSend(true) },
      { label: 'Receive', Ic: IconRecv, on: () => setRecv(true) },
      { label: 'Swap',    Ic: IconSwap, on: () => setSwap(true) },
      { label: 'Buy',     Ic: IconBuy,  on: () => setBuy(true)  },
    ]
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, padding: '22px 24px 8px' }}>
        {actions.map(({ label, Ic, on }) => (
          <button key={label} onClick={on} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
            background: 'transparent', border: 0, cursor: 'pointer', color: C.white,
          }}>
            <span style={{
              width: 54, height: 54, borderRadius: '50%',
              background: C.surface, border: '1px solid ' + C.lineStr,
              display: 'grid', placeItems: 'center',
            }}><Ic size={22} stroke={C.teal}/></span>
            <span style={{ fontWeight: 500, fontSize: 12 }}>{label}</span>
          </button>
        ))}
      </div>
    )
  }

  const Tabs = () => (
    <div style={{ display: 'flex', gap: 6, padding: '12px 20px' }}>
      {['Assets', 'Collectibles', 'Activity'].map((t) => {
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
  )

  const ChainDot = ({ kind }) => {
    const map = {
      usdc: { bg: '#2775CA', mark: <span style={{ color: '#fff', fontWeight: 700 }}>$</span> },
      eth:  { bg: '#1E2742', mark: <span style={{ color: '#9FA8C6', fontWeight: 700, fontSize: 12 }}>Ξ</span> },
    }
    const x = map[kind] || map.eth
    return (
      <div style={{
        width: 40, height: 40, borderRadius: '50%', background: x.bg,
        display: 'grid', placeItems: 'center', flexShrink: 0,
      }}>{x.mark}</div>
    )
  }

  const AssetList = () => {
    const rows = [
      {
        logo: 'usdc', name: 'USD Coin', chain: 'Base', price: '1.00', change: 0.0,
        balance: `${formatUnits(w.usdc, USDC_DECIMALS)} USDC`,
        usd: w.usdcNum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      },
      {
        logo: 'eth', name: 'Ethereum', chain: 'Base', price: w.ethUsd ? w.ethUsd.toFixed(2) : '—', change: 0.0,
        balance: `${formatUnits(w.ethBal, 18, 6)} ETH`,
        usd: (w.ethNum * w.ethUsd).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      },
    ]
    return (
      <div style={{
        margin: '4px 16px 0', padding: '10px 16px 6px',
        background: C.surface, border: '1px solid ' + C.line, borderRadius: 20,
      }}>
        {rows.map((r, i) => (
          <div key={r.name} style={{
            display: 'grid', gridTemplateColumns: '40px 1fr auto', gap: 14, alignItems: 'center',
            padding: '14px 4px', borderBottom: i === rows.length - 1 ? 0 : '1px solid ' + C.line,
          }}>
            <ChainDot kind={r.logo}/>
            <div>
              <div style={{ fontWeight: 600, fontSize: 15 }}>{r.name}</div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6, marginTop: 2,
                fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: C.muted,
              }}>
                <span>{r.chain}</span>
                <span style={{ width: 2, height: 2, borderRadius: '50%', background: C.muted }}/>
                <span>${r.price}</span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 600, fontSize: 15, fontVariantNumeric: 'tabular-nums' }}>${r.usd}</div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: C.muted, marginTop: 2 }}>{r.balance}</div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const ActivityList = () => (
    <div style={{
      margin: '4px 16px 0', padding: activity.length ? '10px 16px 6px' : '40px 20px',
      background: C.surface, border: '1px solid ' + C.line, borderRadius: 20,
      textAlign: activity.length ? 'left' : 'center', color: activity.length ? C.white : C.muted,
      fontSize: 14,
    }}>
      {!activity.length && 'Recent transactions appear here.'}
      {activity.map((a, i) => (
        <div key={a.hash || i} style={{
          display: 'grid', gridTemplateColumns: '40px 1fr auto', gap: 14, alignItems: 'center',
          padding: '12px 4px', borderBottom: i === activity.length - 1 ? 0 : '1px solid ' + C.line,
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%', background: C.surface2,
            display: 'grid', placeItems: 'center',
          }}><IconSend size={18} stroke={C.teal}/></div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>Sent {a.token}</div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: C.muted, marginTop: 2 }}>
              to {a.to ? `${a.to.slice(0, 6)}…${a.to.slice(-4)}` : ''} · {new Date(a.ts).toLocaleString()}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 600, fontSize: 14 }}>−{a.amount} {a.token}</div>
            <a href={a.hash ? `https://basescan.org/tx/${a.hash}` : '#'} target="_blank" rel="noreferrer" style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: 11, marginTop: 2, textDecoration: 'none',
              color: a.status === 'confirmed' ? C.green : a.status === 'failed' ? C.red : C.amber,
            }}>{a.status || 'pending'} ↗</a>
          </div>
        </div>
      ))}
    </div>
  )

  const BottomNav = () => {
    const items = [
      { key: 'home',  label: 'Home',    Ic: IconHome,  active: true  },
      { key: 'swap',  label: 'Swap',    Ic: IconSwap,  active: false, on: () => setSwap(true) },
      { key: 'card',  label: 'Card',    Ic: IconCard,  active: false },
      { key: 'earn',  label: 'Earn',    Ic: IconEarn,  active: false, highlight: true },
      { key: 'brow',  label: 'Browser', Ic: IconBrow,  active: false },
    ]
    return (
      <div style={{
        position: 'absolute', left: 14, right: 14, bottom: 18,
        borderRadius: 28, padding: '10px 6px',
        background: 'rgba(20,26,46,0.78)', backdropFilter: 'blur(20px)',
        border: '1px solid ' + C.lineStr,
        boxShadow: '0 12px 40px rgba(0,0,0,0.45)',
        display: 'grid', gridTemplateColumns: 'repeat(5,1fr)',
      }}>
        {items.map(({ key, label, Ic, active, highlight, on }) => (
          <button key={key} onClick={on} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            padding: '6px 0 4px', position: 'relative',
            background: 'transparent', border: 0, cursor: on ? 'pointer' : 'default',
          }}>
            {highlight && (
              <span style={{
                position: 'absolute', top: 4, right: 'calc(50% - 16px)',
                width: 6, height: 6, borderRadius: '50%',
                background: C.amber, boxShadow: '0 0 8px ' + C.amber,
              }}/>
            )}
            <Ic size={22} stroke={active ? C.teal : 'rgba(244,247,251,0.6)'} sw={active ? 2 : 1.7}/>
            <span style={{
              fontSize: 10, fontWeight: active ? 600 : 500,
              color: active ? C.teal : 'rgba(244,247,251,0.6)',
            }}>{label}</span>
          </button>
        ))}
      </div>
    )
  }

  /* ── iPhone-shaped frame (responsive) ───────────────────────────────── */
  return (
    <div style={{
      width: '100%', maxWidth: 420, margin: '0 auto', position: 'relative',
      borderRadius: 44, overflow: 'hidden',
      background: C.bg, color: C.white,
      border: '1px solid ' + C.lineStr,
      boxShadow: '0 30px 80px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.04)',
      aspectRatio: '390 / 844',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        background:
          'radial-gradient(80% 50% at 50% 5%, rgba(0,224,184,0.10), transparent 60%),' +
          C.bg,
        paddingTop: 50, paddingBottom: 110,
        overflowY: 'auto', overflowX: 'hidden',
        scrollbarWidth: 'none',
      }}>
        <TopBar/>
        <BalanceCard/>
        <ActionRow/>
        <Tabs/>
        {tab === 'Assets'       && <AssetList/>}
        {tab === 'Collectibles' && (
          <div style={{
            margin: '4px 16px 0', padding: '48px 20px', textAlign: 'center',
            background: C.surface, border: '1px solid ' + C.line, borderRadius: 20,
            color: C.muted, fontSize: 14,
          }}>NFTs on Base will show here once detected.</div>
        )}
        {tab === 'Activity'     && <ActivityList/>}
      </div>
      <BottomNav/>

      <SendModal    open={send} onClose={() => setSend(false)} w={w} pushActivity={pushActivity} prefillTo={ESCROW_USDC}/>
      <ReceiveModal open={recv} onClose={() => setRecv(false)} address={w.address}/>
      <SwapModal    open={swap} onClose={() => setSwap(false)} w={w}/>
      <BuyModal     open={buy}  onClose={() => setBuy(false)}  address={w.address}/>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────────────── *
 * Page sections
 * ────────────────────────────────────────────────────────────────────────── */
const Hero = ({ onLaunch }) => (
  <section className="relative overflow-hidden">
    <div className="absolute inset-0 grid-overlay pointer-events-none" />
    <div className="relative mx-auto max-w-7xl px-6 pt-20 pb-12 md:pt-28 text-center">
      <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs text-white/80 mb-6">
        <span className="h-1.5 w-1.5 rounded-full bg-accent-400 animate-pulse" />
        ChainPay · Wallet for ChainWork
      </div>
      <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold leading-[1.05] tracking-tight">
        Paying in crypto, <span className="gradient-text">as easy as a text.</span>
      </h1>
      <p className="mt-6 text-lg md:text-xl text-white/75 max-w-2xl mx-auto">
        ChainPay is the self-custodial wallet built into ChainWork. Send USDC,
        fund escrow, and watch balances update on-chain — all from one screen.
      </p>
      <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
        <button onClick={onLaunch} className="btn-primary">
          Open the wallet
          <Icon path={<path d="M5 12h14M13 5l7 7-7 7" />} className="h-4 w-4" />
        </button>
        <a href="#how-chainpay" className="btn-ghost">How it works</a>
      </div>
    </div>
  </section>
)

const Intro = () => {
  const cards = [
    {
      title: 'Self-custodial',
      body: 'Your keys live in your wallet — MetaMask, Rabby, Coinbase Wallet. ChainPay never touches your seed phrase.',
    },
    {
      title: 'USDC on Base',
      body: 'Payments settle in USDC on Base — sub-cent gas, ~2 second confirmations, stable USD value.',
    },
    {
      title: 'Built into ChainWork',
      body: 'One tap funds a task: the escrow address and reference are pre-filled and the proof files itself.',
    },
  ]
  return (
    <section id="how-chainpay" className="py-12">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid md:grid-cols-3 gap-5">
          {cards.map((c) => (
            <div key={c.title} className="card">
              <h3 className="text-lg font-semibold">{c.title}</h3>
              <p className="mt-2 text-sm text-white/70 leading-relaxed">{c.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

const WalletStage = () => (
  <section id="wallet" className="py-16">
    <div className="mx-auto max-w-7xl px-6">
      <div className="text-center mb-10">
        <div className="text-xs uppercase tracking-[0.2em] text-accent-400 mb-3">Live wallet</div>
        <h2 className="text-3xl md:text-4xl font-bold">Your ChainPay home screen.</h2>
        <p className="mt-3 text-sm text-white/65 max-w-xl mx-auto">
          Balances refresh from Base mainnet every 10 seconds. Send, receive, swap, and buy — all real,
          signed by the wallet you connect.
        </p>
      </div>
      <WalletApp/>
    </div>
  </section>
)

export default function ChainPay() {
  const launch = () => {
    const el = document.getElementById('wallet')
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  return (
    <>
      <Hero onLaunch={launch}/>
      <Intro/>
      <WalletStage/>
    </>
  )
}
