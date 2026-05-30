import React, { useMemo, useState } from 'react'
import { Icon } from '../components/ui.jsx'
import StarRating from '../components/StarRating.jsx'
import { CATEGORIES, CATEGORY_LABEL } from '../data/categories.jsx'
import { useJobs } from '../hooks/useJobs.js'
import { useT } from '../i18n/index.jsx'

// Minimum employer-rating buckets (1–5 stars, left by workers).
const RATING_RANGES = [
  { id: 'any',  test: () => true },
  { id: 'gte4', test: (r) => r != null && r >= 4 },
  { id: 'gte3', test: (r) => r != null && r >= 3 },
  { id: 'gte2', test: (r) => r != null && r >= 2 },
  { id: 'gte1', test: (r) => r != null && r >= 1 },
]

const SORTS = ['recent', 'ratingHigh', 'ratingLow']

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
          {o.label}
        </button>
      )
    })}
  </div>
)

const initials = (n) =>
  (n || '?').split(/\s+/).map((p) => p[0] || '').slice(0, 2).join('').toUpperCase()

const JobCard = ({ job, t }) => {
  const catLabel = job.category ? (CATEGORY_LABEL[job.category] || job.category) : null
  return (
    <div className="card flex flex-col h-full">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-brand-400 to-accent-400 grid place-items-center text-[11px] font-bold text-ink-950 overflow-hidden">
            {job.hirer.avatar
              ? <img src={job.hirer.avatar} alt="" className="h-full w-full object-cover" />
              : initials(job.hirer.name)}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium text-white/90 truncate">{job.hirer.name}</div>
            <div className="text-[11px] text-white/40">{job.postedAt}</div>
          </div>
        </div>
        {catLabel && (
          <span className="shrink-0 text-[10px] font-mono uppercase tracking-widest text-white/55 border border-white/10 rounded-full px-2 py-0.5">
            {catLabel}
          </span>
        )}
      </div>

      <h3 className="text-lg font-semibold leading-snug line-clamp-2">{job.title}</h3>
      {job.description && job.description !== job.title && (
        <p className="mt-2 text-sm text-white/60 leading-relaxed line-clamp-3">{job.description}</p>
      )}

      {job.skills.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-1.5">
          {job.skills.slice(0, 6).map((s) => (
            <li key={s} className="text-[11px] text-white/75 bg-white/[0.04] border border-white/10 rounded-full px-2 py-1">
              {s}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-auto pt-5 flex items-end justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-white/40">{t('jobs.rating')}</div>
          <div className="mt-0.5">
            {job.rating != null
              ? (
                <span className="inline-flex items-center gap-1.5">
                  <StarRating value={job.rating} size="sm" />
                  <span className="font-semibold text-white tabular-nums">{job.rating.toFixed(1)}</span>
                </span>
              )
              : <span className="text-white/45 text-sm">{t('jobs.ratingNew')}</span>}
          </div>
        </div>
        {job.paymentStructure && (
          <span className="text-[10px] text-accent-200 border border-accent-400/30 bg-accent-500/10 rounded-full px-2 py-0.5">
            {job.paymentStructure === 'fifty-fifty' ? t('jobs.split') : t('jobs.fullOnDone')}
          </span>
        )}
      </div>

      <a href="#/post-task" className="btn-ghost mt-5 !py-2 text-sm justify-center">
        {t('jobs.applyCta')}
        <Icon path={<path d="M5 12h14M13 5l7 7-7 7" />} className="h-4 w-4" />
      </a>
    </div>
  )
}

export default function Jobs() {
  const { t } = useT()
  const { jobs, loading, error } = useJobs()
  const [category, setCategory] = useState('all')
  const [rating, setRating] = useState('any')
  const [sort, setSort] = useState('recent')
  const [query, setQuery] = useState('')

  const categoryOptions = useMemo(
    () => [
      { id: 'all', label: t('jobs.allCategories') },
      ...CATEGORIES.map((c) => ({ id: c.id, label: c.title })),
    ],
    [t],
  )

  const ratingOptions = useMemo(
    () => RATING_RANGES.map((r) => ({ id: r.id, label: t(`jobs.filters.rating.${r.id}`) })),
    [t],
  )

  const sortOptions = useMemo(
    () => SORTS.map((id) => ({ id, label: t(`jobs.sort.${id}`) })),
    [t],
  )

  const filtered = useMemo(() => {
    const ratingTest = RATING_RANGES.find((r) => r.id === rating)?.test || (() => true)
    const q = query.trim().toLowerCase()
    const out = jobs.filter((j) => {
      if (category !== 'all' && j.category !== category) return false
      if (rating !== 'any' && !ratingTest(j.rating)) return false
      if (q) {
        const hay = `${j.title} ${j.description} ${j.skills.join(' ')} ${j.hirer.name}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
    if (sort === 'ratingHigh') out.sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1))
    else if (sort === 'ratingLow') out.sort((a, b) => (a.rating ?? Infinity) - (b.rating ?? Infinity))
    else out.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    return out
  }, [jobs, category, rating, sort, query])

  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center mb-10">
          <div className="text-xs uppercase tracking-[0.2em] text-accent-400 mb-3">{t('jobs.eyebrow')}</div>
          <h1 className="text-3xl md:text-5xl font-bold">{t('jobs.title')}</h1>
          <p className="mt-4 text-white/70 max-w-2xl mx-auto">{t('jobs.body')}</p>
          <div className="mt-4 text-xs text-white/40">
            {loading ? t('jobs.loading') : t('jobs.liveCount', { count: jobs.length })}
          </div>
        </div>

        <div className="max-w-xl mx-auto mb-6">
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2.5 focus-within:border-white/30 transition">
            <Icon path={<><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></>} className="h-4 w-4 text-white/45" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('jobs.searchPlaceholder')}
              className="flex-1 bg-transparent border-0 focus:outline-none text-sm placeholder:text-white/35"
            />
            {query && (
              <button onClick={() => setQuery('')} className="text-white/45 hover:text-white text-xs">{t('common.cancel')}</button>
            )}
          </div>
        </div>

        <div className="mb-10 rounded-2xl border border-white/10 bg-white/[0.02] p-4 md:p-5">
          <div className="flex flex-col gap-3">
            <div className="cw-scroll overflow-x-auto -mx-1 px-1 pb-1">
              <FilterChips label={t('jobs.labels.category')} options={categoryOptions} value={category} onChange={setCategory} />
            </div>
            <div className="cw-scroll overflow-x-auto -mx-1 px-1 pb-1">
              <FilterChips label={t('jobs.labels.rating')} options={ratingOptions} value={rating} onChange={setRating} />
            </div>
            <div className="cw-scroll overflow-x-auto -mx-1 px-1 pb-1">
              <FilterChips label={t('jobs.labels.sort')} options={sortOptions} value={sort} onChange={setSort} />
            </div>
          </div>
          <div className="mt-3 text-xs text-white/45">
            {t('jobs.showing', { shown: filtered.length, total: jobs.length })}
          </div>
        </div>

        {error ? (
          <div className="card text-center py-16">
            <div className="text-white/80">{t('jobs.errorTitle')}</div>
            <p className="text-xs text-white/45 mt-1 max-w-md mx-auto">{t('jobs.errorBody')}</p>
          </div>
        ) : loading ? (
          <div className="card text-center py-16 text-white/55 text-sm">{t('jobs.loading')}</div>
        ) : jobs.length === 0 ? (
          <div className="card text-center py-16">
            <div className="text-white/80">{t('jobs.emptyTitle')}</div>
            <p className="text-xs text-white/45 mt-1 max-w-md mx-auto">{t('jobs.emptyBody')}</p>
            <a href="#/post-task" className="btn-primary mt-5 inline-flex">{t('jobs.postCta')}</a>
          </div>
        ) : filtered.length === 0 ? (
          <div className="card text-center py-16">
            <div className="text-white/70">{t('jobs.noMatch')}</div>
            <button
              onClick={() => { setCategory('all'); setRating('any'); setQuery('') }}
              className="btn-ghost mt-4"
            >
              {t('jobs.resetFilters')}
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((j) => <JobCard key={j.id} job={j} t={t} />)}
          </div>
        )}
      </div>
    </section>
  )
}
