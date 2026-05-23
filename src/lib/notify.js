/**
 * Client-side notification helper.
 *
 * Fires email notifications via the /api/notify Vercel function.
 * Fire-and-forget — never blocks UI, never throws. If the endpoint
 * isn't deployed (e.g. local Vite dev without `vercel dev`), we log
 * and move on.
 */

const APP_ORIGIN = typeof window !== 'undefined' ? window.location.origin : ''

// Compose a dashboard URL the email button can deep-link back to.
export const dashboardUrl = (hash = '/') =>
  `${APP_ORIGIN}/#${hash.startsWith('/') ? hash : '/' + hash}`

let lastWarn = 0
const warnOnce = (msg) => {
  if (Date.now() - lastWarn < 60_000) return
  lastWarn = Date.now()
  console.warn('[ChainWork notify]', msg)
}

export async function notify(type, to, data = {}) {
  if (!type) return { ok: false, reason: 'missing type' }
  if (!to)   return { ok: false, reason: 'missing recipient' }
  try {
    const res = await fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, to, data }),
    })
    if (res.status === 404) {
      warnOnce('/api/notify not available (local dev without `vercel dev`?). Notifications are skipped.')
      return { ok: false, reason: 'no endpoint' }
    }
    const json = await res.json().catch(() => ({}))
    if (!res.ok || json.ok === false) {
      console.warn('[ChainWork notify] failed:', res.status, json)
      return { ok: false, error: json.error || res.statusText }
    }
    if (json.skipped) {
      warnOnce(json.reason || 'Notifications not configured on server')
    }
    return json
  } catch (e) {
    warnOnce(`fetch error: ${e?.message || e}`)
    return { ok: false, error: e?.message }
  }
}
