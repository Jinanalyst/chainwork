import { Resend } from 'resend'

/**
 * ChainWork notification dispatcher.
 *
 * Runs as a Vercel Serverless Function at /api/notify.
 *
 * Env vars (set in Vercel → Settings → Environment Variables):
 *   RESEND_API_KEY       — required. Your Resend secret key (re_...).
 *   RESEND_FROM          — sender, e.g. "ChainWork <notifications@yourdomain.com>".
 *                          Defaults to "ChainWork <onboarding@resend.dev>" which
 *                          only delivers to *your own* account email until you
 *                          verify a domain in Resend.
 *   NOTIFY_OVERRIDE_TO   — optional. When set, every notification is redirected
 *                          to this address. Great for testing.
 *
 * Payload from the client:
 *   { type: 'offer_accepted' | ..., to: 'email@x.com', data: {...} }
 */

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
const FROM      = process.env.RESEND_FROM        || 'ChainWork <onboarding@resend.dev>'
const OVERRIDE  = process.env.NOTIFY_OVERRIDE_TO || null

const brand = (inner) => `
  <div style="font-family:Inter,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:#070a13;padding:32px 16px;color:#e6edf7;">
    <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="max-width:560px;margin:0 auto;background:#0b0f1c;border:1px solid rgba(255,255,255,0.08);border-radius:20px;overflow:hidden;">
      <tr><td style="padding:24px 28px;border-bottom:1px solid rgba(255,255,255,0.06);">
        <div style="font-size:20px;font-weight:800;letter-spacing:-0.01em;">
          <span style="color:#e6edf7;">Chain</span><span style="color:#4a8cff;">Work</span>
        </div>
      </td></tr>
      <tr><td style="padding:28px;">${inner}</td></tr>
      <tr><td style="padding:18px 28px;border-top:1px solid rgba(255,255,255,0.06);font-size:11px;color:rgba(230,237,247,0.45);">
        You're receiving this because you have an active ChainWork account. Open
        <a href="https://chainwork.app" style="color:#7eb6ff;">your dashboard</a> to manage notifications.
      </td></tr>
    </table>
  </div>
`

const btn = (href, label) => `
  <a href="${href}" style="display:inline-block;background:linear-gradient(90deg,#7eb6ff,#5eead4);color:#0b0f1c;text-decoration:none;font-weight:700;padding:10px 18px;border-radius:999px;margin-top:18px;">${label}</a>
`

const h = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({
  '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
})[c])

const TEMPLATES = {
  offer_accepted: ({ taskTitle, workerName, dashboardUrl }) => ({
    subject: `${workerName} accepted "${taskTitle}"`,
    html: brand(`
      <p style="font-size:14px;color:rgba(230,237,247,0.7);margin:0 0 6px;">A worker has accepted your task</p>
      <h1 style="font-size:22px;margin:0 0 12px;">${h(workerName)} is on it.</h1>
      <p style="font-size:14px;line-height:1.6;color:rgba(230,237,247,0.8);margin:0;">
        They've accepted <strong>${h(taskTitle)}</strong>. A chat thread has been opened on your hirer dashboard so you can kick off the work.
      </p>
      ${btn(dashboardUrl || 'https://chainwork.app/#/hirer', 'Open hirer dashboard')}
    `),
    text: `${workerName} accepted "${taskTitle}". Open your dashboard to chat: ${dashboardUrl || 'https://chainwork.app/#/hirer'}`,
  }),

  submitted_for_review: ({ taskTitle, workerName, dashboardUrl }) => ({
    subject: `${workerName} submitted "${taskTitle}" for review`,
    html: brand(`
      <p style="font-size:14px;color:rgba(230,237,247,0.7);margin:0 0 6px;">A milestone is ready for your approval</p>
      <h1 style="font-size:22px;margin:0 0 12px;">${h(workerName)} delivered.</h1>
      <p style="font-size:14px;line-height:1.6;color:rgba(230,237,247,0.8);margin:0;">
        <strong>${h(taskTitle)}</strong> is awaiting your review. Approve to release the next milestone payout, or request adjustments if anything needs to change.
      </p>
      ${btn(dashboardUrl || 'https://chainwork.app/#/hirer', 'Review and approve')}
    `),
    text: `${workerName} submitted "${taskTitle}" for review. ${dashboardUrl || 'https://chainwork.app/#/hirer'}`,
  }),

  milestone_approved: ({ taskTitle, hirerName, milestone, dashboardUrl }) => ({
    subject: `${hirerName} approved a milestone on "${taskTitle}"`,
    html: brand(`
      <p style="font-size:14px;color:rgba(230,237,247,0.7);margin:0 0 6px;">Payment released</p>
      <h1 style="font-size:22px;margin:0 0 12px;">${h(hirerName)} approved ${h(milestone || 'the milestone')}.</h1>
      <p style="font-size:14px;line-height:1.6;color:rgba(230,237,247,0.8);margin:0;">
        Your payout for <strong>${h(taskTitle)}</strong> is on its way to your wallet (within 24h). Nice work.
      </p>
      ${btn(dashboardUrl || 'https://chainwork.app/#/worker', 'Open worker dashboard')}
    `),
    text: `${hirerName} approved ${milestone || 'the milestone'} on "${taskTitle}". Open your dashboard: ${dashboardUrl || 'https://chainwork.app/#/worker'}`,
  }),

  adjustment_requested: ({ taskTitle, hirerName, note, dashboardUrl }) => ({
    subject: `${hirerName} requested adjustments on "${taskTitle}"`,
    html: brand(`
      <p style="font-size:14px;color:rgba(230,237,247,0.7);margin:0 0 6px;">Action needed</p>
      <h1 style="font-size:22px;margin:0 0 12px;">${h(hirerName)} asked for a tweak.</h1>
      <p style="font-size:14px;line-height:1.6;color:rgba(230,237,247,0.8);margin:0 0 14px;">
        On <strong>${h(taskTitle)}</strong>:
      </p>
      <blockquote style="margin:0;padding:12px 14px;background:rgba(245,158,11,0.10);border:1px solid rgba(245,158,11,0.30);border-radius:10px;color:#fde68a;font-size:14px;line-height:1.6;">
        ${h(note || 'See the task timeline for details.')}
      </blockquote>
      ${btn(dashboardUrl || 'https://chainwork.app/#/worker', 'Open task')}
    `),
    text: `${hirerName} requested adjustments on "${taskTitle}": ${note || ''}`,
  }),

  new_message: ({ taskTitle, fromName, preview, dashboardUrl }) => ({
    subject: `New message from ${fromName} · ${taskTitle}`,
    html: brand(`
      <p style="font-size:14px;color:rgba(230,237,247,0.7);margin:0 0 6px;">New message</p>
      <h1 style="font-size:20px;margin:0 0 12px;">${h(fromName)} sent you a message.</h1>
      <p style="font-size:12px;color:rgba(230,237,247,0.55);margin:0 0 10px;">
        On <strong>${h(taskTitle)}</strong>
      </p>
      <blockquote style="margin:0;padding:12px 14px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.10);border-radius:10px;color:#e6edf7;font-size:14px;line-height:1.6;">
        ${h(preview)}
      </blockquote>
      ${btn(dashboardUrl || 'https://chainwork.app/', 'Reply on ChainWork')}
    `),
    text: `${fromName} sent you a message on "${taskTitle}": ${preview}`,
  }),

  review_received: ({ taskTitle, hirerName, rating, body, dashboardUrl }) => ({
    subject: `${hirerName} left you a ${rating}-star review`,
    html: brand(`
      <p style="font-size:14px;color:rgba(230,237,247,0.7);margin:0 0 6px;">New review</p>
      <h1 style="font-size:22px;margin:0 0 12px;">${h(hirerName)} rated you ${h(rating)}/5.</h1>
      <p style="font-size:13px;color:rgba(230,237,247,0.55);margin:0 0 10px;">On <strong>${h(taskTitle)}</strong></p>
      <blockquote style="margin:0;padding:12px 14px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.10);border-radius:10px;color:#e6edf7;font-size:14px;line-height:1.6;">
        ${h(body)}
      </blockquote>
      ${btn(dashboardUrl || 'https://chainwork.app/#/worker', 'View your reviews')}
    `),
    text: `${hirerName} rated you ${rating}/5 on "${taskTitle}": ${body}`,
  }),

  task_posted: ({ taskTitle, hirerName, dashboardUrl }) => ({
    subject: `Your task "${taskTitle}" is live`,
    html: brand(`
      <p style="font-size:14px;color:rgba(230,237,247,0.7);margin:0 0 6px;">Task posted</p>
      <h1 style="font-size:22px;margin:0 0 12px;">Your task is live.</h1>
      <p style="font-size:14px;line-height:1.6;color:rgba(230,237,247,0.8);margin:0;">
        <strong>${h(taskTitle)}</strong> is now visible to matched workers. You'll get the first offers within a few hours.
      </p>
      ${btn(dashboardUrl || 'https://chainwork.app/#/hirer', 'Open hirer dashboard')}
    `),
    text: `Your task "${taskTitle}" is live. ${dashboardUrl || 'https://chainwork.app/#/hirer'}`,
  }),
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }
  if (!resend) {
    return res.status(503).json({ ok: false, skipped: true, reason: 'RESEND_API_KEY not configured' })
  }

  let body = req.body
  // Vercel parses JSON automatically when content-type is application/json.
  // But guard against runtimes that don't.
  if (typeof body === 'string') {
    try { body = JSON.parse(body) } catch { body = {} }
  }
  const { type, to, data } = body || {}

  if (!type || !TEMPLATES[type]) {
    return res.status(400).json({ ok: false, error: `Unknown notification type: ${type}` })
  }
  const recipient = OVERRIDE || to
  if (!recipient) {
    return res.status(400).json({ ok: false, error: 'No recipient (and no NOTIFY_OVERRIDE_TO)' })
  }

  const { subject, html, text } = TEMPLATES[type](data || {})

  try {
    const result = await resend.emails.send({
      from: FROM,
      to:   recipient,
      subject,
      html,
      text,
    })
    if (result?.error) {
      return res.status(502).json({ ok: false, error: result.error.message || 'Resend error' })
    }
    return res.status(200).json({ ok: true, id: result?.data?.id, to: recipient, type })
  } catch (e) {
    return res.status(500).json({ ok: false, error: e?.message || 'Unknown error' })
  }
}
