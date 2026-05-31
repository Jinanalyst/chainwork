import React, { useEffect, useMemo, useState } from 'react'
import { Icon, navigate } from '../components/ui.jsx'
import TalentCard, { LevelBadge } from '../components/TalentCard.jsx'
import ReviewsModal from '../components/ReviewsModal.jsx'
import { CATEGORY_IDS, useCategoriesWithAll } from '../data/categories.jsx'
import { levelOf } from '../data/talents.js'
import { useTalents } from '../hooks/useTalents.js'
import { useTaskStore } from '../hooks/useTaskStore.js'
import { useT } from '../i18n/index.jsx'

const RATING_RANGES = [
  { id: 'any', label: 'Any rating', test: () => true },
  { id: 'gte4', label: '4.0+', test: (t) => t.rating != null && t.rating >= 4 },
  { id: 'gte3', label: '3.0+', test: (t) => t.rating != null && t.rating >= 3 },
  { id: 'gte2', label: '2.0+', test: (t) => t.rating != null && t.rating >= 2 },
  { id: 'gte1', label: '1.0+', test: (t) => t.rating != null && t.rating >= 1 },
]

// Tiers, highest → lowest, so Expert leads the filter row.
const LEVELS = [
  { id: 'any', label: 'Any level' },
  { id: 'expert', label: 'Expert' },
  { id: 'verified', label: 'Verified' },
  { id: 'rookie', label: 'Rookie' },
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

const TalentProfile = ({ talent, reviewCount, onInvite, onViewReviews, onClose }) => {
  const { t } = useT()
  return (
  <Dialog title={t('talents.profile.titleSuffix', { name: talent.name })} onClose={onClose}>
    <div className="p-5 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <div className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${talent.accent} grid place-items-center text-xl font-bold text-ink-950`}>
          {(talent.name || '?').split(/\s+/).map((p) => p[0] || '').slice(0, 2).join('').toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-2xl font-bold">{talent.name}</h2>
            <LevelBadge level={levelOf(talent, reviewCount)} label={t(`talents.level.${levelOf(talent, reviewCount)}`)} className="!text-xs !px-2" />
            {talent.topRated && <span className="rounded-full border border-brand-400/30 bg-brand-500/15 px-2 py-0.5 text-xs text-brand-200">{t('talents.profile.topRated')}</span>}
          </div>
          <div className="mt-1 text-white/70">{talent.role} - {talent.location}</div>
          <button
            type="button"
            onClick={() => onViewReviews(talent)}
            className="mt-2 inline-flex items-center gap-1.5 text-xs text-white/75 hover:text-white transition group"
          >
            <span className="font-medium">{talent.rating.toFixed(1)}</span>
            <span className="text-white/45 group-hover:text-white/65 underline-offset-2 group-hover:underline">
              {t('talents.profile.viewReviews', { n: reviewCount })}
            </span>
          </button>
          <p className="mt-3 text-sm leading-relaxed text-white/70">{talent.about}</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        <Metric label={t('talents.profile.ratingLabel')} value={reviewCount ? talent.rating.toFixed(1) : t('talents.profile.newRating')} />
        <Metric label={t('talents.profile.reviewsLabel')} value={reviewCount} />
        <Metric label={t('talents.profile.fromLabel')} value={`$${talent.startingPrice}`} />
        <Metric label={t('talents.profile.repliesLabel')} value={talent.responseTime} />
      </div>

      <div className="mt-6">
        <div className="text-xs uppercase tracking-wider text-white/40 mb-2">{t('talents.profile.skills')}</div>
        <div className="flex flex-wrap gap-2">
          {talent.skills.map((skill) => (
            <span key={skill} className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-white/80">{skill}</span>
          ))}
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="text-xs uppercase tracking-wider text-white/40 mb-2">{t('talents.profile.bestFor')}</div>
        <div className="text-sm text-white/75">
          {t('talents.profile.bestForText')}
        </div>
      </div>

      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        <button onClick={() => onInvite(talent)} className="btn-primary justify-center">
          {t('talents.profile.invite')}
          <Icon path={<path d="M5 12h14M13 5l7 7-7 7" />} className="h-4 w-4" />
        </button>
        <button onClick={() => onViewReviews(talent)} className="btn-ghost justify-center">
          {t('talents.profile.viewReviewsCta', { n: reviewCount })}
        </button>
        <button onClick={onClose} className="btn-ghost justify-center">{t('talents.profile.keepBrowsing')}</button>
      </div>
    </div>
  </Dialog>
  )
}

const InvitePanel = ({ talent, onClose }) => {
  const { t } = useT()
  return (
  <Dialog title={t('talents.invitePanel.title', { name: talent.name })} onClose={onClose}>
    <div className="p-5 md:p-6">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="text-sm font-semibold">{t('talents.invitePanel.briefHeading')}</div>
        <p className="mt-2 text-sm leading-relaxed text-white/65">
          {t('talents.invitePanel.briefText')}
        </p>
      </div>

      <div className="mt-5 grid sm:grid-cols-3 gap-3 text-sm">
        <Metric label={t('talents.invitePanel.worker')} value={talent.name} />
        <Metric label={t('talents.invitePanel.startingAt')} value={`$${talent.startingPrice}`} />
        <Metric label={t('talents.invitePanel.availability')} value={talent.availability} />
      </div>

      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => navigate(`#/post-task?talent=${encodeURIComponent(talent.handle || talent.id)}`)}
          className="btn-primary justify-center"
        >
          {t('talents.invitePanel.continue')}
          <Icon path={<path d="M5 12h14M13 5l7 7-7 7" />} className="h-4 w-4" />
        </button>
        <button onClick={onClose} className="btn-ghost justify-center">{t('talents.invitePanel.cancel')}</button>
      </div>
    </div>
  </Dialog>
  )
}

export default function Talents() {
  const { t } = useT()
  const { talents, loading, source, legacyFallback } = useTalents()
  const store = useTaskStore()
  const categoryOptions = useCategoriesWithAll()
  const ratingOptions = RATING_RANGES.map((r) => ({ id: r.id, label: t(`talents.rating.${r.id}`, r.label) }))
  const levelOptions = LEVELS.map((l) => ({ id: l.id, label: t(`talents.level.${l.id}`, l.label) }))
  const availOptions = AVAILS.map((a) => ({ id: a.id, label: t(`talents.avail.${a.id}`, a.label) }))
  const sortOptions = SORTS.map((s) => ({ id: s.id, label: t(`talents.sort.${s.id}`, s.label) }))
  const initialCategory = useMemo(() => {
    const q = (window.location.hash || '').split('?')[1]
    const requested = q && new URLSearchParams(q).get('category')
    return CATEGORY_IDS.includes(requested) ? requested : 'all'
  }, [])
  const [category, setCategory] = useState(initialCategory)
  const [level, setLevel] = useState('any')
  const [rating, setRating] = useState('any')
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
    const ratingTest = RATING_RANGES.find((r) => r.id === rating)?.test || (() => true)
    const q = query.trim().toLowerCase()
    const out = talents.filter((t) => {
      if (category !== 'all' && !t.categories.includes(category)) return false
      if (level !== 'any' && levelOf(t) !== level) return false
      if (!ratingTest(t)) return false
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
  }, [talents, category, level, rating, avail, sort, query])

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
          <div className="text-xs uppercase tracking-[0.2em] text-accent-400 mb-3">{t('talents.eyebrow')}</div>
          <h1 className="text-3xl md:text-5xl font-bold">{t('talents.heroTitle')}</h1>
          <p className="mt-4 text-white/70 max-w-2xl mx-auto">
            {t('talents.subtitle')}
          </p>
          <div className="mt-4 text-xs text-white/40">
            {loading ? t('talents.status.loading') : source === 'profiles' ? t('talents.status.live') : t('talents.status.network')}
          </div>
        </div>

        <div className="max-w-xl mx-auto mb-6">
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2.5 focus-within:border-white/30 transition">
            <Icon path={<><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></>} className="h-4 w-4 text-white/45" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('talents.searchPlaceholder')}
              className="flex-1 bg-transparent border-0 focus:outline-none text-sm placeholder:text-white/35"
            />
            {query && (
              <button onClick={() => setQuery('')} className="text-white/45 hover:text-white text-xs">{t('talents.clear')}</button>
            )}
          </div>
        </div>

        <div className="mb-10 rounded-2xl border border-white/10 bg-white/[0.02] p-4 md:p-5">
          <div className="flex flex-col gap-3">
            <div className="cw-scroll overflow-x-auto -mx-1 px-1 pb-1">
              <FilterChips label={t('talents.filters.category')} options={categoryOptions} value={category} onChange={setCategory} />
            </div>
            <div className="cw-scroll overflow-x-auto -mx-1 px-1 pb-1">
              <FilterChips label={t('talents.filters.level')} options={levelOptions} value={level} onChange={setLevel} />
            </div>
            <div className="cw-scroll overflow-x-auto -mx-1 px-1 pb-1">
              <FilterChips label={t('talents.filters.rating')} options={ratingOptions} value={rating} onChange={setRating} />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="cw-scroll overflow-x-auto -mx-1 px-1 pb-1 flex-1">
                <FilterChips label={t('talents.filters.availability')} options={availOptions} value={avail} onChange={setAvail} />
              </div>
              <div className="cw-scroll overflow-x-auto -mx-1 px-1 pb-1">
                <FilterChips label={t('talents.filters.sort')} options={sortOptions} value={sort} onChange={setSort} />
              </div>
            </div>
          </div>
          <div className="mt-3 text-xs text-white/45">
            {t('talents.showing', { filtered: filtered.length, total: talents.length })}
          </div>
        </div>

        {loading ? (
          <div className="card text-center py-16 text-white/55 text-sm">{t('talents.loadingTalents')}</div>
        ) : talents.length === 0 ? (
          <div className="card text-center py-16">
            <div className="text-white/80">{t('talents.emptyState.none')}</div>
            <p className="text-xs text-white/45 mt-1 max-w-md mx-auto">
              {t('talents.emptyState.noneHint')}
            </p>
            <a href="#/join-as-worker" className="btn-primary mt-5 inline-flex">{t('talents.emptyState.join')}</a>
          </div>
        ) : filtered.length === 0 ? (
          <div className="card text-center py-16">
            <div className="text-white/70">{t('talents.emptyState.noMatch')}</div>
            <button
              onClick={() => { setCategory('all'); setLevel('any'); setRating('any'); setAvail('any'); setQuery('') }}
              className="btn-ghost mt-4"
            >
              {t('talents.emptyState.reset')}
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
