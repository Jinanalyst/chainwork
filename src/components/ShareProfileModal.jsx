import React, { useEffect, useState } from 'react'
import { Icon } from './ui.jsx'

const slugify = (s = '') =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

export default function ShareProfileModal({ open, profile, onClose }) {
  const [copied, setCopied] = useState(false)
  useEffect(() => {
    if (!open) return
    setCopied(false)
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const slug = slugify(profile?.name) || 'me'
  const url = `${origin}/#/talents/${slug}`
  const text = `Check out ${profile?.name || 'this'} on ChainWork — ${profile?.role || 'verified worker for web tasks'}.`

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch { /* ignore */ }
  }

  const SHARE_TARGETS = [
    {
      id: 'twitter',
      label: 'X / Twitter',
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      icon: <path d="M4 4l16 16M20 4L4 20" />,
      accent: 'from-white/15 to-white/5',
    },
    {
      id: 'linkedin',
      label: 'LinkedIn',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      icon: <><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M8 11v6M8 8v.01M12 17v-4a2 2 0 0 1 4 0v4" /></>,
      accent: 'from-brand-500/30 to-brand-700/10',
    },
    {
      id: 'email',
      label: 'Email',
      href: `mailto:?subject=${encodeURIComponent('My ChainWork profile')}&body=${encodeURIComponent(text + '\n\n' + url)}`,
      icon: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></>,
      accent: 'from-accent-500/30 to-accent-700/10',
    },
    {
      id: 'whatsapp',
      label: 'WhatsApp',
      href: `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`,
      icon: <><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z" /></>,
      accent: 'from-emerald-400/30 to-accent-600/10',
    },
  ]

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-ink-950/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-ink-900 shadow-glow p-6 md:p-7">
        <button onClick={onClose} className="absolute top-4 right-4 h-8 w-8 grid place-items-center rounded-full text-white/60 hover:text-white hover:bg-white/5">
          <Icon path={<path d="M6 6l12 12M18 6l-12 12" />} className="h-4 w-4" />
        </button>

        <h2 className="text-xl font-bold">Share your profile</h2>
        <p className="mt-1 text-sm text-white/65">Send hirers straight to your public ChainWork page.</p>

        {/* URL row */}
        <div className="mt-5 flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2">
          <Icon path={<><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></>} className="h-4 w-4 text-white/50 shrink-0" />
          <code className="flex-1 min-w-0 text-xs md:text-sm font-mono text-white/85 truncate">{url}</code>
          <button
            onClick={copy}
            className="shrink-0 inline-flex items-center gap-1 text-xs font-medium rounded-full bg-brand-500 hover:bg-brand-600 text-white px-3 py-1.5 transition"
          >
            {copied ? (
              <>
                <Icon path={<path d="M5 12l4 4 10-10" />} className="h-3.5 w-3.5" />
                Copied
              </>
            ) : (
              <>
                <Icon path={<><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></>} className="h-3.5 w-3.5" />
                Copy link
              </>
            )}
          </button>
        </div>

        {/* Social targets */}
        <div className="mt-5 grid grid-cols-2 gap-2.5">
          {SHARE_TARGETS.map((s) => (
            <a
              key={s.id}
              href={s.href}
              target="_blank"
              rel="noreferrer"
              className="rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/25 px-4 py-3 flex items-center gap-3 transition"
            >
              <div className={`h-9 w-9 rounded-xl bg-gradient-to-br ${s.accent} border border-white/10 grid place-items-center text-white/85`}>
                <Icon path={s.icon} className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium">{s.label}</span>
            </a>
          ))}
        </div>

        <p className="mt-5 text-[11px] text-white/45 text-center">
          Your portfolio, experience, and earnings stay private — only what you publish appears here.
        </p>
      </div>
    </div>
  )
}
