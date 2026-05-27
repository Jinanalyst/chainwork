import { publicClientId, PAYPAL_MODE, sendJson } from './_helpers.js'

/**
 * GET /api/paypal/config
 * Returns the PUBLIC client id + mode so the browser can load the PayPal SDK
 * without us baking a Vite env variable into the bundle. The secret is never
 * exposed here.
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') return sendJson(res, 405, { error: 'method_not_allowed' })

  const clientId = publicClientId()
  if (!clientId) {
    return sendJson(res, 500, {
      error: 'paypal_not_configured',
      message: 'PAYPAL_CLIENT_ID (or NEXT_PUBLIC_PAYPAL_CLIENT_ID) is not set on the server.',
    })
  }
  return sendJson(res, 200, {
    client_id: clientId,
    mode:      PAYPAL_MODE,
  })
}
