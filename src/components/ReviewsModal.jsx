import React, { useEffect, useMemo } from 'react'
import { Icon } from './ui.jsx'
import StarRating from './StarRating.jsx'

const initials = (n) =>
  (n || '?').split(/\s+/).map((p) => p[0] || '').slice(0, 2).join('').toUpperCase()

export default function ReviewsModal({ open, workerName, reviews, onClose }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const stats = useMemo(() => {
    if (!reviews?.length) return { avg: 0, count: 0, dist: [0, 0, 0, 0, 0] }
    const sum = reviews.reduce((n, r) => n + (r.rating || 0), 0)
    const dist = [1, 2, 3, 4, 5].map((n) => reviews.filter((r) => Math.round(r.rating) === n).length)
    return { avg: sum / reviews.length, count: reviews.length, dist }
  }, [reviews])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-ink-950/85 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border border-white/10 bg-ink-900 shadow-glow">
        <div className="sticky top-0 z-10 bg-ink-900/95 backdrop-blur px-6 py-4 border-b border-white/5 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-wider text-accent-400 font-mono">Reviews</div>
            <div className="mt-1 font-semibold truncate">{workerName}</div>
          </div>
          <button onClick={onClose} className="h-8 w-8 grid place-items-center rounded-full text-white/60 hover:text-white hover:bg-white/5 shrink-0">
            <Icon path={<path d="M6 6l12 12M18 6l-12 12" />} className="h-4 w-4" />
          </button>
        </div>

        {/* Summary */}
        <div className="px-6 py-5 border-b border-white/5">
          <div className="flex items-end gap-6 flex-wrap">
            <div>
              <div className="text-4xl font-bold tabular-nums">{stats.avg.toFixed(1)}</div>
              <StarRating value={stats.avg} size="sm" />
              <div className="text-xs text-white/55 mt-1">{stats.count} review{stats.count !== 1 ? 's' : ''}</div>
            </div>
            <div className="flex-1 min-w-[200px] space-y-1">
              {[5, 4, 3, 2, 1].map((n) => {
                const count = stats.dist[n - 1]
                const pct = stats.count ? (count / stats.count) * 100 : 0
                return (
                  <div key={n} className="flex items-center gap-2 text-xs">
                    <span className="w-3 text-white/55">{n}</span>
                    <Icon path={<path d="M12 17.3l-6.2 3.7 1.6-7.1L2 9.2l7.2-.6L12 2l2.8 6.6 7.2.6-5.4 4.7 1.6 7.1z" />} className="h-3 w-3 text-amber-300" />
                    <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full bg-amber-300/70" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-6 text-right text-white/55 tabular-nums">{count}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* List */}
        <div className="px-6 py-5 space-y-5">
          {reviews?.length ? reviews.slice().reverse().map((r) => (
            <div key={r.id} className="flex gap-3">
              <div className={`shrink-0 h-10 w-10 rounded-full grid place-items-center text-xs font-bold text-ink-950 bg-gradient-to-br from-brand-300 to-brand-500`}>
                {initials(r.hirerName)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold">{r.hirerName}</span>
                  {r.hirerCompany && <span className="text-xs text-white/55">· {r.hirerCompany}</span>}
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  <StarRating value={r.rating} size="sm" />
                  <span className="text-xs text-white/55">{r.createdAt}</span>
                </div>
                {r.taskTitle && (
                  <div className="mt-1 text-[11px] text-white/40 uppercase tracking-wider">on “{r.taskTitle}”</div>
                )}
                <p className="mt-2 text-sm text-white/85 leading-relaxed whitespace-pre-wrap">{r.body}</p>
              </div>
            </div>
          )) : (
            <div className="text-center py-12">
              <div className="text-white/65">No reviews yet.</div>
              <div className="text-xs text-white/40 mt-1">Once a hirer approves a completed task, they can leave the first review here.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
