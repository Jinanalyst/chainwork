import React, { useMemo, useState } from 'react'
import { Icon, navigate } from '../components/ui.jsx'
import TalentCard from '../components/TalentCard.jsx'
import { TALENTS, TALENT_CATEGORIES } from '../data/talents.js'

const RATE_RANGES = [
  { id: 'any',   label: 'Any rate',    test: () => true },
  { id: 'lt50',  label: 'Under $50/h', test: (t) => t.hourlyRate < 50 },
  { id: '50-80', label: '$50–$80/h',   test: (t) => t.hourlyRate >= 50 && t.hourlyRate <= 80 },
  { id: '80-120',label: '$80–$120/h',  test: (t) => t.hourlyRate > 80 && t.hourlyRate <= 120 },
  { id: 'gt120', label: '$120+/h',     test: (t) => t.hourlyRate > 120 },
]
const AVAILS = [
  { id: 'any',   label: 'Any time' },
  { id: 'now',   label: 'Available now' },
  { id: 'soon',  label: 'Available next week' },
  { id: 'limit', label: 'Limited' },
]
const SORTS = [
  { id: 'top',    label: 'Top-rated first' },
  { id: 'price',  label: 'Lowest starting price' },
  { id: 'fast',   label: 'Fastest reply' },
]

const responseMinutes = (s) => {
  if (!s) return 9999
  const n = parseFloat(s)
  if (s.includes('m')) return n
  if (s.includes('h')) return n * 60
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
          {o.label}
        </button>
      )
    })}
  </div>
)

export default function Talents() {
  const [category, setCategory] = useState('all')
  const [rate, setRate]         = useState('any')
  const [avail, setAvail]       = useState('any')
  const [sort, setSort]         = useState('top')
  const [query, setQuery]       = useState('')

  const filtered = useMemo(() => {
    const rateTest = RATE_RANGES.find((r) => r.id === rate)?.test || (() => true)
    const q = query.trim().toLowerCase()
    const out = TALENTS.filter((t) => {
      if (category !== 'all' && !t.categories.includes(category)) return false
      if (!rateTest(t)) return false
      if (avail === 'now'   && t.availability !== 'Available now')           return false
      if (avail === 'soon'  && t.availability !== 'Available next week')     return false
      if (avail === 'limit' && t.availability !== 'Limited')                 return false
      if (q) {
        const hay = (t.name + ' ' + t.role + ' ' + t.about + ' ' + t.skills.join(' ')).toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
    if (sort === 'price') out.sort((a, b) => a.startingPrice - b.startingPrice)
    else if (sort === 'fast') out.sort((a, b) => responseMinutes(a.responseTime) - responseMinutes(b.responseTime))
    else out.sort((a, b) => (Number(b.topRated) - Number(a.topRated)) || (b.rating - a.rating))
    return out
  }, [category, rate, avail, sort, query])

  const invite = (talent) => {
    // For MVP: jump to post-task and let the hirer kick off a brief.
    // Later: open a "Send invite" modal that targets this talent.
    console.log('[ChainWork] invite talent', talent.id)
    navigate('#/post-task')
  }

  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center mb-10">
          <div className="text-xs uppercase tracking-[0.2em] text-accent-400 mb-3">Talents</div>
          <h1 className="text-3xl md:text-5xl font-bold">Trusted workers, ready to ship.</h1>
          <p className="mt-4 text-white/70 max-w-2xl mx-auto">
            Browse verified web builders, fixers, and AI engineers. Filter by what you need, then invite the ones that fit.
          </p>
        </div>

        {/* Search */}
        <div className="max-w-xl mx-auto mb-6">
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2.5 focus-within:border-white/30 transition">
            <Icon path={<><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></>} className="h-4 w-4 text-white/45" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search talents by name, skill, or keyword…"
              className="flex-1 bg-transparent border-0 focus:outline-none text-sm placeholder:text-white/35"
            />
            {query && (
              <button onClick={() => setQuery('')} className="text-white/45 hover:text-white text-xs">Clear</button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="mb-10 rounded-2xl border border-white/10 bg-white/[0.02] p-4 md:p-5">
          <div className="flex flex-col gap-3">
            <div className="overflow-x-auto -mx-1 px-1 pb-1">
              <FilterChips
                label="Category"
                options={TALENT_CATEGORIES}
                value={category}
                onChange={setCategory}
              />
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
            Showing <span className="text-white">{filtered.length}</span> of {TALENTS.length} talents
          </div>
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
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
                onInvite={invite}
                onView={(talent) => console.log('view', talent.id)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
