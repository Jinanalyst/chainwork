import {
  paypalFetch,
  readJsonBody,
  sendJson,
  getSupabase,
  PAYPAL_MODE,
} from './_helpers.js'

/**
 * POST /api/paypal/capture-order
 * Body: { order_id, user_id? }
 *
 * Captures the PayPal order, verifies status === COMPLETED, then upserts the
 * payment row in Supabase. Returns a normalised summary the frontend can use
 * to show a success/failure message.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'method_not_allowed' })
  }

  try {
    const body = await readJsonBody(req)
    const orderId = String(body?.order_id || '').trim()
    if (!orderId) {
      return sendJson(res, 400, { error: 'invalid_request', details: ['missing order_id'] })
    }

    const result = await paypalFetch(`/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {
      method: 'POST',
    })

    const pu      = result?.purchase_units?.[0]
    const capture = pu?.payments?.captures?.[0]
    const status  = capture?.status || result?.status

    const success = status === 'COMPLETED'
    const dbStatus = success ? 'paid' : 'failed'

    const amount   = capture?.amount?.value ? Number(capture.amount.value) : null
    const currency = capture?.amount?.currency_code || null
    const captureId = capture?.id || null
    const paymentType = pu?.custom_id || null

    // Upsert the payment record. We use paypal_order_id as the natural key
    // because create-order inserted a 'pending' row with it.
    try {
      const sb = await getSupabase()
      if (sb) {
        const patch = {
          paypal_order_id:   orderId,
          paypal_capture_id: captureId,
          payment_type:      paymentType,
          amount,
          currency,
          status:            dbStatus,
          updated_at:        new Date().toISOString(),
          metadata: {
            mode:           PAYPAL_MODE,
            paypal_status:  status,
            captured_at:    capture?.create_time || null,
            payer_email:    result?.payer?.email_address || null,
          },
        }
        if (body?.user_id) patch.user_id = body.user_id

        const { error: upErr } = await sb
          .from('payments')
          .upsert(patch, { onConflict: 'paypal_order_id' })
        if (upErr) console.warn('[paypal/capture-order] supabase upsert failed:', upErr.message)
      }
    } catch (e) {
      console.warn('[paypal/capture-order] supabase write failed:', e?.message)
    }

    if (!success) {
      return sendJson(res, 402, {
        error:  'capture_not_completed',
        status,
        order_id: orderId,
      })
    }

    return sendJson(res, 200, {
      success: true,
      status,
      order_id:   orderId,
      capture_id: captureId,
      amount,
      currency,
      payment_type: paymentType,
    })
  } catch (err) {
    console.error('[paypal/capture-order] failed:', err)
    return sendJson(res, err.status || 500, {
      error:   err.code || 'capture_order_failed',
      message: err.message,
    })
  }
}
