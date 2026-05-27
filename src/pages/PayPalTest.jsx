import React, { useEffect, useRef, useState } from 'react'
import { Icon, navigate } from '../components/ui.jsx'

const TEST_ITEMS = [
  {
    key:          'employer_pro_membership',
    title:        'Employer Pro Membership',
    description:  'ChainWork Employer Pro Membership Test',
    amount:       9.99,
    currency:     'USD',
  },
  {
    key:          'project_posting_fee',
    title:        'Project Posting Fee',
    description:  'ChainWork Project Posting Fee Test',
    amount:       4.99,
    currency:     'USD',
  },
  {
    key:          'business_matching_service',
    title:        'Business Matching Service',
    description:  'ChainWork Business Matching Service Test',
    amount:       19.99,
    currency:     'USD',
  },
]

// Idempotent loader for the PayPal JS SDK. Loads once per (clientId, currency)
// pair and caches the promise so re-renders don't re-inject the script tag.
const sdkPromises = new Map()
function loadPaypalSdk({ clientId, currency }) {
  const key = `${clientId}::${currency}`
  if (sdkPromises.has(key)) return sdkPromises.get(key)

  const p = new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject(new Error('SSR not supported'))
    if (window.paypal) return resolve(window.paypal)

    const existing = document.querySelector('script[data-paypal-sdk]')
    if (existing) {
      existing.addEventListener('load',  () => resolve(window.paypal))
      existing.addEventListener('error', () => reject(new Error('PayPal SDK script failed to load')))
      return
    }

    const s = document.createElement('script')
    const params = new URLSearchParams({
      'client-id':         clientId,
      currency,
      intent:              'capture',
      'disable-funding':   'credit',
      components:          'buttons',
    })
    s.src     = `https://www.paypal.com/sdk/js?${params.toString()}`
    s.async   = true
    s.dataset.paypalSdk = '1'
    s.onload  = () => resolve(window.paypal)
    s.onerror = () => reject(new Error('PayPal SDK script failed to load'))
    document.head.appendChild(s)
  })
  sdkPromises.set(key, p)
  return p
}

function StatusBadge({ kind, children }) {
  const tones = {
    idle:    'bg-white/[0.04] border-white/10 text-white/55',
    loading: 'bg-brand-500/15 border-brand-400/30 text-brand-200',
    success: 'bg-emerald-500/15 border-emerald-400/30 text-emerald-200',
    error:   'bg-rose-500/15 border-rose-400/30 text-rose-200',
    cancel:  'bg-amber-500/15 border-amber-400/30 text-amber-200',
  }
  return (
    <div className={'mt-3 rounded-lg border px-3 py-2 text-xs ' + (tones[kind] || tones.idle)}>
      {children}
    </div>
  )
}

function PayPalButton({ item, paypal, onResult }) {
  const ref = useRef(null)

  useEffect(() => {
    if (!paypal || !ref.current) return
    ref.current.innerHTML = ''
    const buttons = paypal.Buttons({
      style: { layout: 'horizontal', color: 'blue', shape: 'rect', label: 'pay', tagline: false, height: 40 },

      createOrder: async () => {
        onResult({ kind: 'loading', message: 'Creating order…' })
        const res = await fetch('/api/paypal/create-order', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            payment_type: item.key,
            amount:       item.amount,
            currency:     item.currency,
            description:  item.description,
          }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok || !data?.id) {
          const message = data?.message || data?.error || `create-order failed (${res.status})`
          onResult({ kind: 'error', message })
          throw new Error(message)
        }
        onResult({ kind: 'loading', message: `Order ${data.id} created. Waiting for buyer approval…` })
        return data.id
      },

      onApprove: async (approved) => {
        onResult({ kind: 'loading', message: `Capturing order ${approved.orderID}…` })
        const res = await fetch('/api/paypal/capture-order', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order_id: approved.orderID }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok || !data?.success) {
          const message = data?.message || data?.error || `capture-order failed (${res.status})`
          onResult({ kind: 'error', message, raw: data })
          return
        }
        onResult({
          kind: 'success',
          message: `Payment captured ✓ (${data.amount} ${data.currency})`,
          raw: data,
        })
      },

      onCancel: () => onResult({ kind: 'cancel', message: 'Buyer cancelled the PayPal checkout.' }),
      onError:  (err) => onResult({ kind: 'error', message: err?.message || 'PayPal button error' }),
    })

    if (buttons.isEligible()) {
      buttons.render(ref.current).catch((e) => onResult({ kind: 'error', message: e?.message || 'render failed' }))
    } else {
      onResult({ kind: 'error', message: 'PayPal Buttons not eligible for this account / currency.' })
    }

    return () => { try { buttons.close() } catch {} }
  }, [paypal, item.key])

  return <div ref={ref} />
}

function ItemCard({ item, paypal, sdkError }) {
  const [state, setState] = useState({ kind: 'idle', message: 'Awaiting checkout…' })
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-base font-semibold text-white">{item.title}</h3>
        <div className="font-mono text-sm text-accent-200">{item.currency} {item.amount.toFixed(2)}</div>
      </div>
      <p className="mt-1 text-xs text-white/55">{item.description}</p>
      <div className="mt-4 min-h-[44px]">
        {sdkError ? (
          <div className="text-xs text-rose-200">SDK unavailable — {sdkError}</div>
        ) : !paypal ? (
          <div className="text-xs text-white/45">Loading PayPal SDK…</div>
        ) : (
          <PayPalButton item={item} paypal={paypal} onResult={setState} />
        )}
      </div>
      <StatusBadge kind={state.kind}>{state.message}</StatusBadge>
      {state.raw && (
        <details className="mt-2">
          <summary className="text-[11px] text-white/40 cursor-pointer">Raw response</summary>
          <pre className="mt-2 text-[10px] text-white/55 overflow-auto max-h-40 leading-snug">
            {JSON.stringify(state.raw, null, 2)}
          </pre>
        </details>
      )}
    </div>
  )
}

export default function PayPalTest() {
  const [paypal,    setPaypal]    = useState(null)
  const [mode,      setMode]      = useState(null)
  const [sdkError,  setSdkError]  = useState(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res  = await fetch('/api/paypal/config')
        const data = await res.json().catch(() => ({}))
        if (!res.ok || !data?.client_id) {
          throw new Error(data?.message || data?.error || `config endpoint returned ${res.status}`)
        }
        if (cancelled) return
        setMode(data.mode || 'sandbox')
        const sdk = await loadPaypalSdk({ clientId: data.client_id, currency: 'USD' })
        if (cancelled) return
        setPaypal(sdk)
      } catch (e) {
        if (!cancelled) setSdkError(e?.message || 'unknown error')
      }
    })()
    return () => { cancelled = true }
  }, [])

  return (
    <div className="mx-auto max-w-3xl px-6 py-14">
      <button
        onClick={() => navigate('#/')}
        className="text-sm text-white/55 hover:text-white inline-flex items-center gap-1.5 mb-6"
      >
        <Icon path={<path d="M15 18l-6-6 6-6" />} className="h-4 w-4" />
        Back to home
      </button>

      <div className="text-[11px] uppercase tracking-[0.2em] text-accent-300 font-mono">Internal · Sandbox testing</div>
      <h1 className="mt-2 text-3xl md:text-4xl font-bold leading-tight">PayPal checkout — Sandbox test</h1>
      <p className="mt-3 text-white/65 text-sm leading-relaxed">
        Pay securely with PayPal or major cards. International payments are processed through
        PayPal Sandbox for testing. ChainWork supports employer memberships, project posting fees,
        business matching services, and work-related service payments.
      </p>

      <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] text-white/65">
        <span className={'h-1.5 w-1.5 rounded-full ' + (mode === 'live' ? 'bg-rose-400' : 'bg-emerald-400')} />
        Mode: <span className="font-mono text-white/90">{mode || '…'}</span>
      </div>

      {sdkError && (
        <div className="mt-6 rounded-xl border border-rose-400/30 bg-rose-500/10 p-4 text-sm text-rose-100">
          <div className="font-semibold">PayPal SDK failed to load</div>
          <div className="mt-1 text-xs text-rose-200/80">{sdkError}</div>
          <div className="mt-2 text-xs text-rose-200/70">
            Confirm <code>PAYPAL_CLIENT_ID</code> (or <code>NEXT_PUBLIC_PAYPAL_CLIENT_ID</code>) is set on the server
            and that <code>/api/paypal/config</code> responds with a client id.
          </div>
        </div>
      )}

      <div className="mt-8 grid gap-4">
        {TEST_ITEMS.map((it) => (
          <ItemCard key={it.key} item={it} paypal={paypal} sdkError={sdkError} />
        ))}
      </div>

      <div className="mt-10 text-xs text-white/40 leading-relaxed">
        This page is for sandbox testing only and is not linked from the public site. Switch
        <code className="mx-1 font-mono text-white/60">PAYPAL_MODE=live</code> only after all flows pass.
      </div>
    </div>
  )
}
