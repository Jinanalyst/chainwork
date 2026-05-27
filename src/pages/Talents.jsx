import React, { useEffect, useMemo, useState } from 'react'
import { Icon, navigate } from '../components/ui.jsx'
import TalentCard from '../components/TalentCard.jsx'
import ReviewsModal from '../components/ReviewsModal.jsx'
import { TALENT_CATEGORIES } from '../data/talents.js'
import { useTalents } from '../hooks/useTalents.js'
import { useTaskStore } from '../hooks/useTaskStore.js'

const RATE_RANGES = [
  { id: 'any', label: 'Any rate', test: () => true },
  { id: 'lt50', label: 'Under $50/h', test: (t) => t.hourlyRate < 50 },
  { id: '50-80', label: '$50-$80/h', test: (t) => t.hourlyRate >= 50 && t.hourlyRate <= 80 },
  { id: '80-120', label: '$80-$120/h', test: (t) => t.hourlyRate > 80 && t.hourlyRate <= 120 },
  { id: 'gt120', label: '$120+/h', test: (t) => t.hourlyRate > 120 },
]

const AVAILS = [
  { id: 'any', label: 'Any time' },
  { id: 'now', label: 'Available now' },
  { id: 'soon', label: 'Available next week' },
  { id: 'limit', label: 'Limited' },
]

const SORTS = [
  { id: 'top', label: 'Top-rated first' },
  { id: 'price', label: 'Lowest starting price' },
  { id: 'fast', label: 'Fastest reply' },
]

const responseMinutes = (s) => {
  if (!s) return 9999
  const n = parseFloat(s)
  if (s.includes('m')) return n
  if (s.includes('h')) return n * 60
  if (s.includes('d')) return n * 1440
  return n
}

const FilterChips = ({ label, options, value, onChange }) => (
  <div className="flex items-center gap-2 min-w-max">
    <span className="text-[11px] uppercase tracking-[0.15em] text-white/40 mr-1">{label}</span>
    {options.map((o) => {
      const active = value === o.id
      return (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className={
            'rounded-full px-3 py-1.5 text-xs whitespace-nowrap border transition ' +
            (active
              ? 'bg-white text-ink-950 border-white'
              : 'bg-white/[0.03] text-white/75 border-white/10 hover:border-white/25 hover:text-white')
          }
        >
          {o.label ?? o.title}
        </button>
      )
    })}
  </div>
)

const Dialog = ({ title, children, onClose }) => (
  <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true">
    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
    <div className="relative w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border border-white/10 bg-ink-900 shadow-glow">
      <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-white/10 bg-ink-900/95 px-5 py-4 backdrop-blur">
        <div className="font-semibold">{title}</div>
        <button onClick={onClose} className="rounded-full p-2 text-white/55 hover:bg-white/10 hover:text-white" aria-label="Close">
          <Icon path={<><path d="M18 6 6 18" /><path d="m6 6 12 12" /></>} className="h-4 w-4" />
        </button>
      </div>
      {children}
    </div>
  </div>
)

const Metric = ({ label, value }) => (
  <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
    <div className="text-[10px] uppercase tracking-wider text-white/40">{label}</div>
    <div className="mt-0.5 font-semibold truncate">{value}</div>
  </div>
)

const TalentProfile = ({ talent, reviewCount, onInvite, onViewReviews, onClose }) => (
  <Dialog title={`${talent.name} profile`} onClose={onClose}>
    <div className="p-5 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <div className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${talent.accent} grid place-items-center text-xl font-bold text-ink-950`}>
          {(talent.name || '?').split(/\s+/).map((p) => p[0] || '').slice(0, 2).join('').toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-2xl font-bold">{talent.name}</h2>
            {talent.verified && <span className="rounded-full border border-accent-400/30 bg-accent-500/15 px-2 py-0.5 text-xs text-accent-300">Verified</span>}
            {talent.topRated && <span className="rounded-full border border-brand-400/30 bg-brand-500/15 px-2 py-0.5 text-xs text-brand-200">Top-rated</span>}
          </div>
          <div className="mt-1 text-white/70">{talent.role} - {talent.location}</div>
          <button
            type="button"
            onClick={() => onViewReviews(talent)}
            className="mt-2 inline-flex items-center gap-1.5 text-xs text-white/75 hover:text-white transition group"
          >
            <Icon path={<path d="M12 17.3l-6.2 3.7 1.6-7.1L2 9.2l7.2-.6L12 2l2.8 6.6 7.2.6-5.4 4.7 1.6 7.1z" />} className="h-3.5 w-3.5 text-amber-300" />
            <span className="font-medium">{talent.rating.toFixed(1)}</span>
            <span className="text-white/45 group-hover:text-white/65 underline-offset-2 group-hover:underline">
              View {reviewCount} review{reviewCount === 1 ? '' : 's'}
            </span>
          </button>
          <p className="mt-3 text-sm leading-relaxed text-white/70">{talent.about}</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        <Metric label="Rating" value={reviewCount ? talent.rating.toFixed(1) : 'New'} />
        <Metric label="Reviews" value={reviewCount} />
        <Metric label="From" value={`$${talent.startingPrice}`} />
        <Metric label="Replies" value={talent.responseTime} />
      </div>

      <div className="mt-6">
        <div className="text-xs uppercase tracking-wider text-white/40 mb-2">Skills</div>
        <div className="flex flex-wrap gap-2">
          {talent.skills.map((skill) => (
            <span key={skill} className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-white/80">{skill}</span>
          ))}
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="text-xs uppercase tracking-wider text-white/40 mb-2">Best for</div>
        <div className="text-sm text-white/75">
          Focused web tasks, scoped builds, production fixes, and clear handoffs with escrow-backed milestones.
        </div>
      </div>

      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        <button onClick={() => onInvite(talent)} className="btn-primary justify-center">
          Invite to a task
          <Icon path={<path d="M5 12h14M13 5l7 7-7 7" />} className="h-4 w-4" />
        </button>
        <button onClick={() => onViewReviews(talent)} className="btn-ghost justify-center">
          View reviews ({reviewCount})
        </button>
        <button onClick={onClose} className="btn-ghost justify-center">Keep browsing</button>
      </div>
    </div>
  </Dialog>
)

const InvitePanel = ({ talent, onClose }) => (
  <Dialog title={`Invite ${talent.name}`} onClose={onClose}>
    <div className="p-5 md:p-6">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="text-sm font-semibold">Start with a focused task brief</div>
        <p className="mt-2 text-sm leading-relaxed text-white/65">
          Your invite carries this worker into the post-task flow so the brief, budget, escrow choice, and contact details stay in one clean handoff.
        </p>
      </div>

      <div className="mt-5 grid sm:grid-cols-3 gap-3 text-sm">
        <Metric label="Worker" value={talent.name} />
        <Metric label="Starting at" value={`$${talent.startingPrice}`} />
        <Metric label="Availability" value={talent.availability} />
      </div>

      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => navigate(`#/post-task?talent=${encodeURIComponent(talent.handle || talent.id)}`)}
          className="btn-primary justify-center"
        >
          Continue to brief
          <Icon path={<path d="M5 12h14M13 5l7 7-7 7" />} className="h-4 w-4" />
        </button>
        <button onClick={onClose} className="btn-ghost justify-center">Cancel</button>
      </div>
    </div>
  </Dialog>
)

export default function Talents() {
  const { talents, loading, source, legacyFallback } = useTalents()
  const store = useTaskStore()
  const [category, setCategory] = useState('all')
  const [rate, setRate] = useState('any')
  const [avail, setAvail] = useState('any')
  const [sort, setSort] = useState('top')
  const [query, setQuery] = useState('')
  const [profileTalent, setProfileTalent] = useState(null)
  const [inviteTalent, setInviteTalent] = useState(null)
  const [reviewsTalent, setReviewsTalent] = useState(null)

  // Reviews are keyed by worker name in the shared task store.
  const reviewsForName = useMemo(() => {
    const map = new Map()
    for (const r of store.reviews || []) {
      const list = map.get(r.workerName) || []
      list.push(r)
      map.set(r.workerName, list)
    }
    return map
  }, [store.reviews])

  const reviewCountFor = (talent) =>
    (reviewsForName.get(talent?.name) || []).length || talent?.reviews || 0
  const openReviews = (talent) => setReviewsTalent(talent)

  useEffect(() => {
    const [, slug] = (window.location.hash || '').split('#/talents/')
    if (!slug || !talents.length) return
    const match = talents.find((t) => t.handle === slug || String(t.id) === slug)
    if (match) setProfileTalent(match)
  }, [talents])

  const filtered = useMemo(() => {
    const rateTest = RATE_RANGES.find((r) => r.id === rate)?.test || (() => true)
    const q = query.trim().toLowerCase()
    const out = talents.filter((t) => {
      if (category !== 'all' && !t.categories.includes(category)) return false
      if (!rateTest(t)) return false
      if (avail === 'now' && t.availability !== 'Available now') return false
      if (avail === 'soon' && t.availability !== 'Available next week') return false
      if (avail === 'limit' && t.availability !== 'Limited') return false
      if (q) {
        const hay = `${t.name} ${t.role} ${t.about} ${t.skills.join(' ')}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
    if (sort === 'price') out.sort((a, b) => a.startingPrice - b.startingPrice)
    else if (sort === 'fast') out.sort((a, b) => responseMinutes(a.responseTime) - responseMinutes(b.responseTime))
    else out.sort((a, b) => (Number(b.topRated) - Number(a.topRated)) || (b.rating - a.rating))
    return out
  }, [talents, category, rate, avail, sort, query])

  const openProfile = (talent) => {
    setProfileTalent(talent)
    if (talent.handle) window.history.replaceState(null, '', `#/talents/${talent.handle}`)
  }

  const closeProfile = () => {
    setProfileTalent(null)
    if ((window.location.hash || '').startsWith('#/talents/')) window.history.replaceState(null, '', '#/talents')
  }

  const openInvite = (talent) => {
    setProfileTalent(null)
    setInviteTalent(talent)
  }

  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-6">
        {legacyFallback && (
          <div className="mb-6 rounded-2xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100 flex items-start gap-3">
            <Icon
              path={<><path d="M12 9v4" /><path d="M12 17h.01" /><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /></>}
              className="h-5 w-5 shrink-0 mt-0.5 text-amber-300"
            />
            <div className="flex-1">
              <div className="font-semibold text-amber-50">Legacy schema fallback active</div>
              <p className="mt-1 text-amber-100/85 leading-relaxed">
                <code className="bg-amber-500/20 rounded px-1">worker_directory</code> is missing
                newer columns. Talent cards are rendering from minimal data only —
                skills, availability, public slugs, etc. will be empty until you apply
                migrations <code className="bg-amber-500/20 rounded px-1">0012_worker_join_fields.sql</code>
                {' '}+ <code className="bg-amber-500/20 rounded px-1">0013_public_slug.sql</code> in
                the Supabase SQL editor.
              </p>
            </div>
          </div>
        )}
        <div className="text-center mb-10">
          <div className="text-xs uppercase tracking-[0.2em] text-accent-400 mb-3">Talents</div>
          <h1 className="text-3xl md:text-5xl font-bold">Trusted workers, ready to ship.</h1>
          <p className="mt-4 text-white/70 max-w-2xl mx-auto">
            Browse verified web builders, fixers, and AI engineers. Filter by what you need, then invite the ones that fit.
          </p>
          <div className="mt-4 text-xs text-white/40">
            {loading ? 'Loading worker profiles...' : source === 'profiles' ? 'Live worker profiles' : 'Verified worker network'}
          </div>
        </div>

        <div className="max-w-xl mx-auto mb-6">
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2.5 focus-within:border-white/30 transition">
            <Icon path={<><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></>} className="h-4 w-4 text-white/45" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search talents by name, skill, or keyword..."
              className="flex-1 bg-transparent border-0 focus:outline-none text-sm placeholder:text-white/35"
            />
            {query && (
              <button onClick={() => setQuery('')} className="text-white/45 hover:text-white text-xs">Clear</button>
            )}
          </div>
        </div>

        <div className="mb-10 rounded-2xl border border-white/10 bg-white/[0.02] p-4 md:p-5">
          <div className="flex flex-col gap-3">
            <div className="overflow-x-auto -mx-1 px-1 pb-1">
              <FilterChips label="Category" options={TALENT_CATEGORIES} value={category} onChange={setCategory} />
            </div>
            <div className="overflow-x-auto -mx-1 px-1 pb-1">
              <FilterChips label="Rate" options={RATE_RANGES} value={rate} onChange={setRate} />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="overflow-x-auto -mx-1 px-1 pb-1 flex-1">
                <FilterChips label="Availability" options={AVAILS} value={avail} onChange={setAvail} />
              </div>
              <div className="overflow-x-auto -mx-1 px-1 pb-1">
                <FilterChips label="Sort" options={SORTS} value={sort} onChange={setSort} />
              </div>
            </div>
          </div>
          <div className="mt-3 text-xs text-white/45">
            Showing <span className="text-white">{filtered.length}</span> of {talents.length} talents
          </div>
        </div>

        {loading ? (
          <div className="card text-center py-16 text-white/55 text-sm">Loading talents…</div>
        ) : talents.length === 0 ? (
          <div className="card text-center py-16">
            <div className="text-white/80">No talents yet.</div>
            <p className="text-xs text-white/45 mt-1 max-w-md mx-auto">
              Once workers sign in and complete their profile they'll appear here.
            </p>
            <a href="#/join-as-worker" className="btn-primary mt-5 inline-flex">Join as a worker</a>
          </div>
        ) : filtered.length === 0 ? (
          <div className="card text-center py-16">
            <div className="text-white/70">No talents match those filters.</div>
            <button
              onClick={() => { setCategory('all'); setRate('any'); setAvail('any'); setQuery('') }}
              className="btn-ghost mt-4"
            >
              Reset filters
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((t) => (
              <TalentCard
                key={t.id}
                talent={t}
                onInvite={openInvite}
                onView={openProfile}
                onViewReviews={openReviews}
              />
            ))}
          </div>
        )}
      </div>

      {profileTalent && (
        <TalentProfile
          talent={profileTalent}
          reviewCount={reviewCountFor(profileTalent)}
          onInvite={openInvite}
          onViewReviews={openReviews}
          onClose={closeProfile}
        />
      )}
      {inviteTalent && <InvitePanel talent={inviteTalent} onClose={() => setInviteTalent(null)} />}
      <ReviewsModal
        open={!!reviewsTalent}
        workerName={reviewsTalent?.name || ''}
        reviews={reviewsTalent ? (reviewsForName.get(reviewsTalent.name) || []) : []}
        onClose={() => setReviewsTalent(null)}
      />
    </section>
  )
}
