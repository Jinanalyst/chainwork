import React, { useEffect, useState } from 'react'
import { Icon } from './ui.jsx'
import StarRating from './StarRating.jsx'

/**
 * Modal where a hirer rates + writes a review for the worker on a task.
 * Submits via `onSubmit({ rating, body })`, then closes.
 */
export default function LeaveReviewModal({ open, task, onClose, onSubmit }) {
  const [rating, setRating] = useState(5)
  const [body, setBody]     = useState('')
  const [busy, setBusy]     = useState(false)

  useEffect(() => {
    if (!open) return
    setRating(5)
    setBody('')
    setBusy(false)
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open || !task) return null

  const valid = rating >= 1 && body.trim().length > 0

  const submit = async () => {
    if (!valid || busy) return
    setBusy(true)
    try { await onSubmit({ rating, body: body.trim() }) } finally { setBusy(false); onClose() }
  }

  const ratingLabel = ['', 'Not great', 'Below expectations', 'Met expectations', 'Above expectations', 'Outstanding'][rating]

  return (
    <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-ink-950/85 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl border border-white/10 bg-ink-900 shadow-glow">
        <div className="px-6 py-4 border-b border-white/5 flex items-start justify-between">
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-wider text-accent-400 font-mono">Leave a review</div>
            <div className="mt-1 font-semibold truncate">{task.talent?.name || 'Worker'}</div>
            <div className="text-xs text-white/55 truncate">{task.title}</div>
          </div>
          <button onClick={onClose} className="h-8 w-8 grid place-items-center rounded-full text-white/60 hover:text-white hover:bg-white/5 shrink-0">
            <Icon path={<path d="M6 6l12 12M18 6l-12 12" />} className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-4">
            <div className="text-xs uppercase tracking-wider text-white/45 mb-2">How did it go?</div>
            <div className="flex items-center gap-3">
              <StarRating value={rating} onChange={setRating} size="lg" />
              <span className="text-sm text-white/65">{ratingLabel}</span>
            </div>
          </div>

          <label className="block">
            <div className="text-sm font-medium text-white/85 mb-1.5">What stood out?</div>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); submit() } }}
              rows={4}
              autoFocus
              placeholder="Communication, quality, speed — a few sentences future hirers can trust."
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-white/35 focus:outline-none focus:border-brand-300 transition resize-y min-h-[110px]"
            />
            <div className="mt-1 text-[11px] text-white/45 flex justify-between">
              <span>Your review appears on {task.talent?.name?.split(' ')[0] || 'their'} profile</span>
              <span>⌘/Ctrl + Enter to submit</span>
            </div>
          </label>
        </div>

        <div className="px-6 py-4 border-t border-white/5 flex items-center justify-end gap-2">
          <button onClick={onClose} className="btn-ghost !py-2 !px-4 text-sm">Cancel</button>
          <button
            onClick={submit}
            disabled={!valid || busy}
            className="btn-primary !py-2 !px-4 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Icon path={<path d="M5 12l5 5L20 7" />} className="h-4 w-4" />
            {busy ? 'Posting…' : 'Post review'}
          </button>
        </div>
      </div>
    </div>
  )
}
