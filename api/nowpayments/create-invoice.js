import {
  NOWPAYMENTS_API_BASE,
  PRICE_PER_HIRE_USD,
  clampHires,
  buildOrderId,
  sendJson,
  readJsonBody,
  ipnCallbackUrl,
  getSupabase,
} from './_shared.js'

/**
 * POST /api/nowpayments/create-invoice
 * Body: { user_id, hires }
 *
 * Creates a NOWPayments hosted invoice for a ChainWork Pro membership and
 * returns { invoice_url, id } for the browser to redirect to. The order_id is
 * "chainwork:<user_id>:<hires>" so the IPN webhook can attribute the payment and
 * grant the right number of hires once it reaches "finished".
 *
 * A pending payments row is best-effort inserted for reconciliation; the
 * webhook upserts the authoritative state.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'method_not_allowed' })
  }

  const apiKey = process.env.NOWPAYMENTS_API_KEY
  if (!apiKey) {
    console.error('[nowpayments/create-invoice] NOWPAYMENTS_API_KEY is not set')
    return sendJson(res, 500, { error: 'api_key_not_configured' })
  }

  const body = await readJsonBody(req)
  const userId = body?.user_id ? String(body.user_id) : null
  if (!userId) {
    return sendJson(res, 400, { error: 'invalid_request', details: ['missing user_id'] })
  }

  const hires = clampHires(body?.hires)
  const priceAmount = +(hires * PRICE_PER_HIRE_USD).toFixed(2)
  const orderId = buildOrderId(userId, hires)
  const ipnUrl = ipnCallbackUrl(req)

  // Where NOWPayments sends the buyer back to after the hosted checkout.
  const origin = (() => {
    const host = req.headers['x-forwarded-host'] || req.headers.host
    if (!host) return null
    const proto = req.headers['x-forwarded-proto'] || 'https'
    return `${proto}://${host}`
  })()

  try {
    const invoiceReq = {
      price_amount: priceAmount,
      price_currency: 'usd',
      order_id: orderId,
      order_description: `ChainWork Employer Pro Membership — ${hires} hires / year`,
      is_fixed_rate: true,
    }
    if (ipnUrl) invoiceReq.ipn_callback_url = ipnUrl
    if (origin) {
      invoiceReq.success_url = `${origin}/#/?pro=success`
      invoiceReq.cancel_url = `${origin}/#/?pro=cancel`
    }

    const npRes = await fetch(`${NOWPAYMENTS_API_BASE}/invoice`, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invoiceReq),
    })

    const data = await npRes.json().catch(() => ({}))
    if (!npRes.ok || !data?.invoice_url) {
      const message = data?.message || data?.statusText || `invoice creation failed (${npRes.status})`
      console.error('[nowpayments/create-invoice] failed:', message)
      return sendJson(res, 502, { error: 'invoice_creation_failed', message })
    }

    // Best-effort pending record — never block checkout on this. The webhook
    // upserts the authoritative row keyed on nowpayments_payment_id; here we
    // only have the invoice id, so we stash it in metadata for reconciliation.
    try {
      const sb = await getSupabase()
      if (sb) {
        await sb.from('payments').insert({
          provider: 'nowpayments',
          user_id: userId,
          payment_type: 'employer_pro_membership',
          amount: priceAmount,
          currency: 'USD',
          status: 'pending',
          metadata: {
            created_via: 'create-invoice',
            nowpayments_invoice_id: data.id != null ? String(data.id) : null,
            order_id: orderId,
            hires,
          },
        })
      }
    } catch (e) {
      console.warn('[nowpayments/create-invoice] pending insert failed:', e?.message)
    }

    return sendJson(res, 200, {
      invoice_url: data.invoice_url,
      id: data.id,
      order_id: orderId,
      hires,
      amount: priceAmount,
      currency: 'USD',
    })
  } catch (err) {
    console.error('[nowpayments/create-invoice] error:', err)
    return sendJson(res, 500, { error: 'create_invoice_failed', message: err?.message })
  }
}
