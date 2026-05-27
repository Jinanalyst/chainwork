import React, { useEffect, useRef, useState } from 'react'

// Idempotent loader for the PayPal JS SDK. Loaded once per (clientId, currency)
// pair; subsequent mounts reuse the same <script>.
const sdkPromises = new Map()
function loadPaypalSdk({ clientId, currency }) {
  const key = `${clientId}::${currency}`
  if (sdkPromises.has(key)) return sdkPromises.get(key)

  const p = new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject(new Error('SSR not supported'))
    // PayPal stashes itself on window.paypal once any SDK script has loaded.
    // If we've already loaded for a different currency, calling Buttons() with
    // the wrong currency will fail — force one SDK per currency by tagging the
    // script with the currency.
    const selector = `script[data-paypal-sdk-currency="${currency}"]`
    const existing = document.querySelector(selector)
    if (existing) {
      if (window.paypal) return resolve(window.paypal)
      existing.addEventListener('load',  () => resolve(window.paypal))
      existing.addEventListener('error', () => reject(new Error('PayPal SDK script failed to load')))
      return
    }
    const s = document.createElement('script')
    const params = new URLSearchParams({
      'client-id':       clientId,
      currency,
      intent:            'capture',
      'disable-funding': 'credit',
      components:        'buttons',
    })
    s.src   = `https://www.paypal.com/sdk/js?${params.toString()}`
    s.async = true
    s.dataset.paypalSdkCurrency = currency
    s.onload  = () => resolve(window.paypal)
    s.onerror = () => reject(new Error('PayPal SDK script failed to load'))
    document.head.appendChild(s)
  })
  sdkPromises.set(key, p)
  return p
}

// Module-level cache for the /api/paypal/config response.
let configPromise = null
function fetchPaypalConfig() {
  if (configPromise) return configPromise
  configPromise = fetch('/api/paypal/config')
    .then(async (res) => {
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data?.client_id) {
        throw new Error(data?.message || data?.error || `config endpoint returned ${res.status}`)
      }
      return data
    })
    .catch((e) => { configPromise = null; throw e })
  return configPromise
}

const tones = {
  idle:    'bg-white/[0.04] border-white/10 text-white/55',
  loading: 'bg-brand-500/15 border-brand-400/30 text-brand-200',
  success: 'bg-emerald-500/15 border-emerald-400/30 text-emerald-200',
  error:   'bg-rose-500/15 border-rose-400/30 text-rose-200',
  cancel:  'bg-amber-500/15 border-amber-400/30 text-amber-200',
}

/**
 * <PayPalCheckoutButton />
 *
 * Drop-in PayPal Sandbox checkout. Reads the public client id from
 * /api/paypal/config so secrets stay server-side, then renders the
 * official PayPal Buttons widget.
 *
 *   item: { key, amount, currency, description }
 *   onResult?: ({ kind, message, raw }) => void
 *   showStatus?: boolean (default true)
 *   userId?: string (passed through to the API for Supabase persistence)
 */
export default function PayPalCheckoutButton({
  item,
  onResult,
  showStatus = true,
  userId,
}) {
  const mountRef = useRef(null)
  const [paypal,   setPaypal]   = useState(null)
  const [mode,     setMode]     = useState(null)
  const [sdkError, setSdkError] = useState(null)
  const [state,    setState]    = useState({ kind: 'idle', message: '결제 준비 중…' })

  const report = (next) => {
    setState(next)
    if (typeof onResult === 'function') onResult(next)
  }

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const cfg = await fetchPaypalConfig()
        if (cancelled) return
        setMode(cfg.mode || 'sandbox')
        const sdk = await loadPaypalSdk({ clientId: cfg.client_id, currency: item.currency })
        if (!cancelled) setPaypal(sdk)
      } catch (e) {
        if (!cancelled) setSdkError(e?.message || 'unknown error')
      }
    })()
    return () => { cancelled = true }
  }, [item.currency])

  useEffect(() => {
    if (!paypal || !mountRef.current) return
    mountRef.current.innerHTML = ''
    const buttons = paypal.Buttons({
      style: { layout: 'horizontal', color: 'blue', shape: 'rect', label: 'pay', tagline: false, height: 44 },

      createOrder: async () => {
        report({ kind: 'loading', message: 'PayPal 주문 생성 중…' })
        const res = await fetch('/api/paypal/create-order', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            payment_type: item.key,
            amount:       item.amount,
            currency:     item.currency,
            description:  item.description,
            user_id:      userId || undefined,
          }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok || !data?.id) {
          const message = data?.message || data?.error || `create-order failed (${res.status})`
          report({ kind: 'error', message })
          throw new Error(message)
        }
        report({ kind: 'loading', message: `주문 ${data.id} 생성됨 · 결제 승인 대기 중` })
        return data.id
      },

      onApprove: async (approved) => {
        report({ kind: 'loading', message: `결제 캡처 중 (${approved.orderID})…` })
        const res = await fetch('/api/paypal/capture-order', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order_id: approved.orderID, user_id: userId || undefined }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok || !data?.success) {
          const message = data?.message || data?.error || `capture-order failed (${res.status})`
          report({ kind: 'error', message, raw: data })
          return
        }
        report({
          kind: 'success',
          message: `결제 완료 ✓ ${data.currency} ${data.amount}`,
          raw: data,
        })
      },

      onCancel: () => report({ kind: 'cancel', message: '결제가 취소되었습니다.' }),
      onError:  (err) => report({ kind: 'error', message: err?.message || 'PayPal 버튼 오류' }),
    })

    if (buttons.isEligible()) {
      buttons.render(mountRef.current).catch((e) =>
        report({ kind: 'error', message: e?.message || 'render failed' }),
      )
    } else {
      report({ kind: 'error', message: '이 계정/통화 조합에서는 PayPal 버튼을 사용할 수 없습니다.' })
    }

    return () => { try { buttons.close() } catch {} }
  }, [paypal, item.key, item.amount, item.currency])

  return (
    <div className="w-full">
      {sdkError ? (
        <div className="rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-100">
          PayPal SDK를 불러오지 못했습니다 — {sdkError}
        </div>
      ) : !paypal ? (
        <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/55">
          PayPal SDK 로딩 중…
        </div>
      ) : (
        <div ref={mountRef} />
      )}
      {showStatus && (
        <>
          <div className={'mt-3 rounded-lg border px-3 py-2 text-xs ' + (tones[state.kind] || tones.idle)}>
            {state.message}
            {mode && state.kind === 'idle' && <span className="ml-2 text-white/40">· mode: {mode}</span>}
          </div>
          {state.raw && (
            <details className="mt-2">
              <summary className="text-[11px] text-white/40 cursor-pointer">Raw response</summary>
              <pre className="mt-2 text-[10px] text-white/55 overflow-auto max-h-40 leading-snug">
                {JSON.stringify(state.raw, null, 2)}
              </pre>
            </details>
          )}
        </>
      )}
    </div>
  )
}
