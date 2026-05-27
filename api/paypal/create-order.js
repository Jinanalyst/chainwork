import {
  paypalFetch,
  validateCreateOrder,
  readJsonBody,
  sendJson,
  getSupabase,
  PAYPAL_MODE,
} from './_helpers.js'

/**
 * POST /api/paypal/create-order
 * Body: { payment_type, amount, currency, description, user_id? }
 *
 * Creates a PayPal order in the configured mode (sandbox by default) and
 * returns { id, status }. If Supabase service-role creds are configured, a
 * pending payment row is inserted for later reconciliation.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'method_not_allowed' })
  }

  try {
    const body = await readJsonBody(req)
    const v = validateCreateOrder(body)
    if (v.errors.length) {
      return sendJson(res, 400, { error: 'invalid_request', details: v.errors })
    }

    const order = await paypalFetch('/v2/checkout/orders', {
      method: 'POST',
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          custom_id:   v.payment_type,
          description: v.description || `ChainWork ${v.payment_type}`,
          amount: {
            currency_code: v.currency,
            value: v.value,
          },
        }],
        application_context: {
          brand_name: 'ChainWork',
          shipping_preference: 'NO_SHIPPING',
          user_action: 'PAY_NOW',
        },
      }),
    })

    // Best-effort Supabase pending record. Failure here must not block the
    // PayPal flow — the capture-order handler will upsert again.
    try {
      const sb = await getSupabase()
      if (sb && order?.id) {
        await sb.from('payments').insert({
          user_id:         body?.user_id || null,
          paypal_order_id: order.id,
          payment_type:    v.payment_type,
          amount:          v.amount,
          currency:        v.currency,
          status:          'pending',
          metadata: {
            mode:        PAYPAL_MODE,
            description: v.description,
            created_via: 'create-order',
          },
        })
      }
    } catch (e) {
      console.warn('[paypal/create-order] supabase insert failed:', e?.message)
    }

    return sendJson(res, 200, { id: order.id, status: order.status })
  } catch (err) {
    console.error('[paypal/create-order] failed:', err)
    return sendJson(res, err.status || 500, {
      error: err.code || 'create_order_failed',
      message: err.message,
    })
  }
}
