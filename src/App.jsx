import React, { useMemo, useState, useEffect } from 'react'
import { LogoMark, Wordmark, Icon, useHashRoute, navigate } from './components/ui.jsx'
import { CATEGORIES as WEB_CATEGORIES } from './data/categories.jsx'
import SignInModal from './components/SignInModal.jsx'
import RoleSelectModal from './components/RoleSelectModal.jsx'
import { useSession, shortAddress, getWalletDisplay } from './hooks/useSession.js'
import { useProfile } from './hooks/useProfile.js'
import { supabase } from './lib/supabase.js'
import PostTask from './pages/PostTask.jsx'
import WorkerDashboard from './pages/WorkerDashboard.jsx'
import JoinAsWorker from './pages/JoinAsWorker.jsx'
import Talents from './pages/Talents.jsx'
import HirerDashboard from './pages/HirerDashboard.jsx'
import AdminPayments from './pages/AdminPayments.jsx'
import EscrowAddressCard from './components/EscrowAddressCard.jsx'
import PaymentProofForm from './components/PaymentProofForm.jsx'
import ProMembershipBadge from './components/ProMembershipBadge.jsx'
import { PLATFORM_WALLETS, proReference, isCurrentUserAdmin } from './lib/platform.js'

const UserChip = ({ user, onSignOut }) => {
  const [open, setOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const display = getWalletDisplay(user)
  const label = display && display.length > 12 ? shortAddress(display) : display
  useEffect(() => {
    if (!user) { setIsAdmin(false); return }
    let cancelled = false
    isCurrentUserAdmin().then((v) => { if (!cancelled) setIsAdmin(v) })
    return () => { cancelled = true }
  }, [user?.id])
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] hover:border-white/30 px-3 py-1.5 text-sm"
      >
        <span className="h-6 w-6 rounded-full bg-gradient-to-br from-brand-400 to-accent-400" />
        <span className="font-mono text-xs">{label || 'Account'}</span>
        <Icon path={<path d="M6 9l6 6 6-6" />} className="h-3.5 w-3.5 text-white/60" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-white/10 bg-ink-900 shadow-glow z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-white/5">
              <div className="text-xs text-white/45">Signed in as</div>
              <div className="font-mono text-sm truncate">{display}</div>
            </div>
            <a href="#/hirer"     onClick={() => setOpen(false)} className="block px-4 py-2.5 text-sm hover:bg-white/5">Hirer dashboard</a>
            <a href="#/worker"    onClick={() => setOpen(false)} className="block px-4 py-2.5 text-sm hover:bg-white/5">Worker dashboard</a>
            <a href="#/post-task" onClick={() => setOpen(false)} className="block px-4 py-2.5 text-sm hover:bg-white/5">Post a task</a>
            {isAdmin && (
              <a href="#/admin/payments" onClick={() => setOpen(false)} className="block px-4 py-2.5 text-sm hover:bg-white/5 border-t border-white/5 text-accent-200">Admin · Payment proofs</a>
            )}
            <button onClick={() => { setOpen(false); onSignOut() }} className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 border-t border-white/5 text-rose-200">
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  )
}

const Nav = ({ route, user, onSignIn, onSignOut }) => (
  <header className="sticky top-0 z-50 backdrop-blur-md bg-ink-950/60 border-b border-white/5">
    <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
      <a href="#/" className="flex items-center gap-2">
        <LogoMark className="h-9 w-9" />
        <Wordmark className="text-xl" />
      </a>
      <nav className="hidden md:flex items-center gap-8 text-sm text-white/70">
        <a href="#/"        className={'hover:text-white ' + (route === '#/' ? 'text-white' : '')}>Home</a>
        <a href="#/talents" className={'hover:text-white ' + (route.startsWith('#/talents') ? 'text-white' : '')}>Talents</a>
        <a href="#/hirer"   className={'hover:text-white ' + ((route.startsWith('#/hirer') || route.startsWith('#/post-task')) ? 'text-white' : '')}>For hirers</a>
        <a href="#/worker"  className={'hover:text-white ' + (route.startsWith('#/worker') ? 'text-white' : '')}>For workers</a>
      </nav>
      <div className="flex items-center gap-3">
        {user ? (
          <UserChip user={user} onSignOut={onSignOut} />
        ) : (
          <>
            <button onClick={onSignIn} className="hidden sm:inline text-sm text-white/80 hover:text-white">Sign in</button>
            <button onClick={onSignIn} className="btn-primary !py-2 !px-4 text-sm">Connect wallet</button>
          </>
        )}
      </div>
    </div>
  </header>
)

const AuthGate = ({ title, sub, onSignIn }) => (
  <section className="py-24">
    <div className="mx-auto max-w-md px-6 text-center">
      <div className="mx-auto h-16 w-16 rounded-full bg-brand-500/15 border border-brand-400/30 grid place-items-center text-brand-200 mb-6">
        <Icon path={<><rect x="4" y="10" width="16" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>} className="h-7 w-7" />
      </div>
      <h1 className="text-2xl md:text-3xl font-bold">{title}</h1>
      <p className="mt-2 text-white/65">{sub}</p>
      <button onClick={onSignIn} className="btn-primary mt-8 mx-auto">Connect wallet</button>
      <p className="mt-4 text-xs text-white/45">Ethereum &amp; Solana supported · no email needed</p>
    </div>
  </section>
)

const Hero = () => (
  <section className="relative overflow-hidden">
    <div className="absolute inset-0 grid-overlay pointer-events-none" />
    <div className="relative mx-auto max-w-7xl px-6 pt-20 pb-28 md:pt-28 md:pb-36 text-center">
      <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs text-white/80 mb-6">
        <span className="h-1.5 w-1.5 rounded-full bg-accent-400 animate-pulse" />
        Now in early access · Post a task in under 60 seconds
      </div>
      <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold leading-[1.05] tracking-tight">
        <Wordmark className="text-4xl md:text-6xl lg:text-7xl" />
      </h1>
      <p className="mt-6 text-2xl md:text-3xl font-semibold text-white/90 max-w-3xl mx-auto leading-snug">
        Small tasks. <span className="gradient-text">Trusted workers.</span> Flexible payments.
      </p>
      <p className="mt-5 text-base md:text-lg text-white/70 max-w-2xl mx-auto">
        Web builds, bug fixes, AI automation, Web3 projects, and launch support —
        matched with trusted workers. Post a task, compare offers, and get it done safely.
      </p>
      <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
        <a href="#/post-task" className="btn-primary">
          Post a task
          <Icon path={<path d="M5 12h14M13 5l7 7-7 7" />} className="h-4 w-4" />
        </a>
        <a href="#categories" className="btn-ghost">Browse categories</a>
      </div>
      <div className="mt-12 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs text-white/50">
        <span className="uppercase tracking-[0.2em]">Popular today</span>
        {['Landing page', 'Vercel deploy fix', 'AI chatbot', 'Wallet connect UI', 'PWA setup', 'Domain + email setup'].map((t) => (
          <a key={t} href="#categories" className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 hover:border-white/25 hover:text-white transition">
            {t}
          </a>
        ))}
      </div>
    </div>
  </section>
)

const HowItWorks = () => {
  const steps = [
    {
      title: 'Post a task',
      body: 'Describe what you need in plain English — a landing page, a bug fix, an AI chatbot, a wallet UI. Set your budget and timeline.',
      icon: <><path d="M4 6h16M4 12h10M4 18h7" /></>,
    },
    {
      title: 'Compare offers',
      body: 'Trusted workers send focused offers with price, turnaround, and reputation. Pick the one that fits — no bidding wars, no spam.',
      icon: <><path d="M3 6h7v12H3zM14 6h7v8h-7zM14 18h7" /></>,
    },
    {
      title: 'Get it done safely',
      body: 'Your payment is held in escrow until the work is approved. The worker ships, you confirm, the payment releases — disputes handled fairly.',
      icon: <><path d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6z" /><path d="M9 12l2 2 4-4" /></>,
    },
  ]
  return (
    <section id="how" className="relative py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center mb-14">
          <div className="text-xs uppercase tracking-[0.2em] text-accent-400 mb-3">How it works</div>
          <h2 className="text-3xl md:text-5xl font-bold">Post. Compare. Done safely.</h2>
          <p className="mt-4 text-white/70 max-w-2xl mx-auto">
            From the brief to the payout, ChainWork handles the middle so you can focus on the work itself.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 relative">
          <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          {steps.map((s, i) => (
            <div key={s.title} className="card relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-brand-400/30 to-accent-400/30 border border-white/10 flex items-center justify-center text-brand-200">
                  <Icon path={s.icon} className="h-5 w-5" />
                </div>
                <div className="text-xs font-mono text-white/40">0{i + 1}</div>
              </div>
              <h3 className="text-xl font-semibold">{s.title}</h3>
              <p className="mt-2 text-white/70 text-sm leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

const CATEGORIES = WEB_CATEGORIES

const FILTERS = {
  budget: [
    { id: 'any',  label: 'Any budget' },
    { id: 'lt100', label: 'Under $100' },
    { id: '100-500', label: '$100 – $500' },
    { id: '500-2k', label: '$500 – $2k' },
    { id: 'gt2k', label: '$2k+' },
  ],
  difficulty: [
    { id: 'any',  label: 'Any level' },
    { id: 'easy', label: 'Easy' },
    { id: 'medium', label: 'Medium' },
    { id: 'hard', label: 'Hard' },
  ],
  delivery: [
    { id: 'any',  label: 'Any time' },
    { id: '24h',  label: 'Within 24h' },
    { id: '3d',   label: 'Within 3 days' },
    { id: '1w',   label: 'Within 1 week' },
    { id: 'flex', label: 'Flexible' },
  ],
}

const FilterRow = ({ label, options, value, onChange }) => (
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

const Categories = () => {
  const [category, setCategory] = useState('all')
  const [budget, setBudget] = useState('any')
  const [difficulty, setDifficulty] = useState('any')
  const [delivery, setDelivery] = useState('any')

  const visible = useMemo(
    () => (category === 'all' ? CATEGORIES : CATEGORIES.filter((c) => c.id === category)),
    [category],
  )

  return (
    <section id="categories" className="py-24 relative">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center mb-10">
          <div className="text-xs uppercase tracking-[0.2em] text-accent-400 mb-3">Categories</div>
          <h2 className="text-3xl md:text-5xl font-bold">Find the right worker for your web task.</h2>
          <p className="mt-4 text-white/70 max-w-2xl mx-auto">
            From landing pages and bug fixes to AI automation and Web3 projects, ChainWork helps you get small digital work done faster.
          </p>
        </div>

        {/* Filters */}
        <div className="mb-10 rounded-2xl border border-white/10 bg-white/[0.02] p-4 md:p-5">
          <div className="flex flex-col gap-3">
            <div className="overflow-x-auto -mx-1 px-1 pb-1">
              <div className="flex items-center gap-2 min-w-max">
                <span className="text-[11px] uppercase tracking-[0.15em] text-white/40 mr-1">Category</span>
                <button
                  type="button"
                  onClick={() => setCategory('all')}
                  className={
                    'rounded-full px-3 py-1.5 text-xs whitespace-nowrap border transition ' +
                    (category === 'all'
                      ? 'bg-white text-ink-950 border-white'
                      : 'bg-white/[0.03] text-white/75 border-white/10 hover:border-white/25 hover:text-white')
                  }
                >
                  All
                </button>
                {CATEGORIES.map((c) => {
                  const active = category === c.id
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCategory(c.id)}
                      className={
                        'rounded-full px-3 py-1.5 text-xs whitespace-nowrap border transition ' +
                        (active
                          ? 'bg-white text-ink-950 border-white'
                          : 'bg-white/[0.03] text-white/75 border-white/10 hover:border-white/25 hover:text-white')
                      }
                    >
                      {c.title}
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="overflow-x-auto -mx-1 px-1 pb-1">
              <FilterRow label="Budget" options={FILTERS.budget} value={budget} onChange={setBudget} />
            </div>
            <div className="overflow-x-auto -mx-1 px-1 pb-1">
              <FilterRow label="Difficulty" options={FILTERS.difficulty} value={difficulty} onChange={setDifficulty} />
            </div>
            <div className="overflow-x-auto -mx-1 px-1 pb-1">
              <FilterRow label="Delivery" options={FILTERS.delivery} value={delivery} onChange={setDelivery} />
            </div>
          </div>
        </div>

        {/* Category cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {visible.map((c) => (
            <div key={c.id} className="card flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${c.accent} border border-white/10 flex items-center justify-center text-white`}>
                  <Icon path={c.icon} className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-white/50 border border-white/10 rounded-full px-2 py-0.5">
                  {c.tag}
                </span>
              </div>
              <h3 className="text-lg font-semibold">{c.title}</h3>
              <p className="mt-2 text-sm text-white/65 leading-relaxed">{c.blurb}</p>
              <ul className="mt-4 flex flex-wrap gap-1.5">
                {c.examples.map((e) => (
                  <li key={e} className="text-[11px] text-white/75 bg-white/[0.04] border border-white/10 rounded-full px-2 py-1">
                    {e}
                  </li>
                ))}
              </ul>
              <a href="#/post-task" className="btn-primary mt-6 !py-2.5 !px-5 text-sm self-start">
                Post a task
                <Icon path={<path d="M5 12h14M13 5l7 7-7 7" />} className="h-4 w-4" />
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

const Trust = () => (
  <section className="py-20">
    <div className="mx-auto max-w-7xl px-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
          ['Escrow-protected', 'Your payment is held safely until the work is approved'],
          ['Trusted workers', 'Verified profiles with a reputation history you can check'],
          ['Stablecoin payments', 'Settle in USDC or USDT — instant, borderless, predictable'],
          ['Fair disputes', 'Neutral resolution with a clear, documented record'],
        ].map(([k, v]) => (
          <div key={k} className="card">
            <div className="text-sm font-semibold text-white">{k}</div>
            <div className="text-xs text-white/60 mt-1 leading-relaxed">{v}</div>
          </div>
        ))}
      </div>
    </div>
  </section>
)

const TwoSides = () => (
  <section className="py-24">
    <div className="mx-auto max-w-7xl px-6 grid lg:grid-cols-2 gap-8">
      <div id="talent" className="card p-8 md:p-10 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-brand-500/20 blur-3xl" />
        <div className="relative">
          <div className="text-xs uppercase tracking-[0.2em] text-brand-300 mb-3">For business owners</div>
          <h3 className="text-3xl font-bold">Post a task. Get offers in minutes.</h3>
          <ul className="mt-6 space-y-3 text-white/80">
            {[
              'Describe the task in plain English — we match you with trusted workers',
              'Compare price, turnaround, and reputation side-by-side',
              'Escrow protects your budget until the work is approved',
              'Pay in USDC or USDT — escrow-held until you approve',
            ].map((t) => (
              <li key={t} className="flex gap-3">
                <Icon path={<path d="M5 12l5 5L20 7" />} className="h-5 w-5 text-accent-400 shrink-0 mt-0.5" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#/post-task" className="btn-primary">Post a task</a>
            <a href="#/hirer" className="btn-ghost">Open hirer dashboard</a>
          </div>
        </div>
      </div>
      <div id="work" className="card p-8 md:p-10 relative overflow-hidden">
        <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-accent-500/20 blur-3xl" />
        <div className="relative">
          <div className="text-xs uppercase tracking-[0.2em] text-accent-400 mb-3">For workers</div>
          <h3 className="text-3xl font-bold">Pick tasks. Ship work. Get paid your way.</h3>
          <ul className="mt-6 space-y-3 text-white/80">
            {[
              'Browse tasks that match your skills — builds, fixes, AI, Web3, launch',
              'Send focused offers, no bidding wars',
              'Build a reputation that follows you across projects',
              'Withdraw the moment a task is approved — no long holds',
            ].map((t) => (
              <li key={t} className="flex gap-3">
                <Icon path={<path d="M5 12l5 5L20 7" />} className="h-5 w-5 text-accent-400 shrink-0 mt-0.5" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
          <a href="#/join-as-worker" className="btn-ghost mt-8">Join as a worker</a>
        </div>
      </div>
    </div>
  </section>
)

const TokenBadge = ({ sym, name, tint }) => (
  <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
    <div className={`h-10 w-10 rounded-full grid place-items-center text-sm font-bold text-white shadow-inner ${tint}`}>
      {sym === 'USDC' ? '$' : '₮'}
    </div>
    <div className="min-w-0">
      <div className="font-semibold">{sym}</div>
      <div className="text-xs text-white/55">{name}</div>
    </div>
  </div>
)

const ReleaseFlow = ({ left, right, rightEmphasis = true }) => (
  <div className="mt-5 flex items-center gap-2">
    <div className="flex-1 rounded-full bg-white/[0.04] border border-white/10 px-3 py-2 text-center text-xs text-white/75">
      {left}
    </div>
    <Icon path={<path d="M5 12h14M13 5l7 7-7 7" />} className="h-4 w-4 text-white/45 shrink-0" />
    <div className={
      'flex-1 rounded-full px-3 py-2 text-center text-xs border ' +
      (rightEmphasis
        ? 'bg-brand-500/15 border-brand-400/30 text-brand-200'
        : 'bg-accent-500/15 border-accent-500/30 text-accent-200')
    }>
      {right}
    </div>
  </div>
)

const Payments = () => {
  const structures = [
    {
      key: 'completion',
      pill: 'Most popular',
      title: 'Pay on completion',
      blurb: '100% of the budget sits in escrow when the task starts, then releases the moment you approve the work.',
      flow: { left: 'Escrow funded', right: '100% on approval', emphasis: true },
      bullets: [
        'Lowest risk for hirers — pay only for what ships',
        'Best for short, well-defined tasks',
        'Workers know the full budget is already locked in',
      ],
      accent: 'from-brand-400/30 to-brand-500/10',
      icon: <><path d="M5 12l5 5L20 7" /></>,
    },
    {
      key: 'split',
      title: 'Split 50 / 50',
      blurb: '50% releases to the worker at kickoff, the remaining 50% on final approval.',
      flow: { left: '50% at kickoff', right: '50% on approval', emphasis: false },
      bullets: [
        'Shares risk evenly between both sides',
        'Signals commitment for longer builds',
        'Common for first-time client / worker pairings',
      ],
      accent: 'from-accent-400/30 to-accent-500/10',
      icon: <><path d="M3 12h18M12 3v18" /></>,
    },
  ]

  return (
    <section id="payments" className="py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center mb-12">
          <div className="text-xs uppercase tracking-[0.2em] text-accent-400 mb-3">Stablecoin payments</div>
          <h2 className="text-3xl md:text-5xl font-bold">Held in escrow. Released on approval.</h2>
          <p className="mt-4 text-white/70 max-w-2xl mx-auto">
            Settle in <span className="text-white font-semibold">USDC</span> or <span className="text-white font-semibold">USDT</span> — predictable, borderless, and instant. Pick the release structure that fits the work.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {structures.map((s) => (
            <div key={s.key} className="card relative overflow-hidden">
              {s.pill && (
                <span className="absolute top-5 right-5 inline-flex items-center rounded-full bg-accent-500/20 border border-accent-500/40 text-accent-200 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5">
                  {s.pill}
                </span>
              )}
              <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${s.accent} border border-white/10 flex items-center justify-center text-white mb-4`}>
                <Icon path={s.icon} className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-white/70 leading-relaxed">{s.blurb}</p>
              <ReleaseFlow left={s.flow.left} right={s.flow.right} rightEmphasis={s.flow.emphasis} />
              <ul className="mt-5 space-y-2">
                {s.bullets.map((b) => (
                  <li key={b} className="flex gap-2 text-sm text-white/80">
                    <Icon path={<path d="M5 12l5 5L20 7" />} className="h-4 w-4 text-accent-400 shrink-0 mt-0.5" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14">
          <div className="text-center text-xs uppercase tracking-[0.2em] text-white/45 mb-5">Supported stablecoins</div>
          <div className="grid sm:grid-cols-2 gap-4 max-w-xl mx-auto">
            <TokenBadge sym="USDC" name="USD Coin" tint="bg-gradient-to-br from-brand-400 to-brand-700" />
            <TokenBadge sym="USDT" name="Tether"   tint="bg-gradient-to-br from-accent-400 to-accent-700" />
          </div>
          <div className="text-center text-xs text-white/45 mt-5">
            Available on Ethereum, Solana, Base &amp; Polygon · gas covered by the platform on first withdrawal
          </div>
        </div>
      </div>
    </section>
  )
}

const CTA = () => {
  const PRICE_PER_HIRE = 300
  const MIN_HIRES = 1
  const MAX_HIRES = 100
  const [hires, setHires] = useState(5)
  const [showPay, setShowPay] = useState(false)
  const { user } = useSession()
  const total = hires * PRICE_PER_HIRE
  const percent = ((hires - MIN_HIRES) / (MAX_HIRES - MIN_HIRES)) * 100
  const estimatedStandardFees = hires * 2500 * 0.10
  const savings = Math.max(0, estimatedStandardFees - total)
  const proRef = proReference(user, hires)

  return (
    <section id="pro" className="py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-brand-700/40 via-ink-800 to-accent-600/30 p-8 md:p-14">
          <div className="absolute inset-0 grid-overlay opacity-50" />
          <div className="relative grid md:grid-cols-2 gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-accent-400/40 bg-accent-400/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-accent-200">
                <span className="h-1.5 w-1.5 rounded-full bg-accent-300" />
                ChainWork Pro
              </div>
              <h2 className="mt-4 text-3xl md:text-5xl font-bold leading-tight">
                Hire more, <span className="bg-gradient-to-r from-brand-300 to-accent-300 bg-clip-text text-transparent">pay less</span>.
              </h2>
              <p className="mt-4 text-white/75 max-w-lg">
                ChainWork Pro is a yearly membership built for teams that hire at scale. Replace per‑contract platform fees with a flat annual rate — just <span className="text-white font-semibold">$300 per hire</span>, billed once a year.
              </p>
              <ul className="mt-6 space-y-2 text-sm text-white/75">
                {[
                  'Flat $300 / hire / year — no per‑task platform fees',
                  'Priority access to vetted talent & faster escrow release',
                  'Dedicated account manager and dispute fast‑track',
                ].map((b) => (
                  <li key={b} className="flex items-start gap-2">
                    <Icon path={<path d="M5 12l5 5L20 7" />} className="h-4 w-4 text-accent-300 shrink-0 mt-0.5" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>

              {user && (
                <div className="mt-6">
                  <ProMembershipBadge />
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-ink-900/70 backdrop-blur p-6 md:p-8">
              <div className="flex items-baseline justify-between">
                <div className="text-xs uppercase tracking-[0.2em] text-white/50">Freelancers to hire</div>
                <div className="font-mono text-2xl font-bold tabular-nums">{hires}</div>
              </div>

              <div className="mt-4">
                <input
                  type="range"
                  min={MIN_HIRES}
                  max={MAX_HIRES}
                  step={1}
                  value={hires}
                  onChange={(e) => setHires(Number(e.target.value))}
                  className="cw-range w-full"
                  style={{ '--cw-range-fill': `${percent}%` }}
                  aria-label="Number of freelancers to hire per year"
                />
                <div className="mt-2 flex justify-between text-[11px] text-white/40 font-mono">
                  <span>{MIN_HIRES}</span>
                  <span>25</span>
                  <span>50</span>
                  <span>75</span>
                  <span>{MAX_HIRES}+</span>
                </div>
              </div>

              <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] p-5">
                <div className="flex items-center justify-between text-sm text-white/70">
                  <span>{hires} × $300 / year</span>
                  <span className="font-mono tabular-nums">${total.toLocaleString()}</span>
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-xs uppercase tracking-[0.2em] text-white/50">Yearly membership</span>
                  <span className="font-mono text-4xl font-bold tabular-nums bg-gradient-to-r from-brand-300 to-accent-300 bg-clip-text text-transparent">
                    ${total.toLocaleString()}
                  </span>
                </div>
                {savings > 0 && (
                  <div className="mt-3 text-xs text-accent-200">
                    Est. savings vs. standard fees: <span className="font-mono">${savings.toLocaleString()}</span> / year
                  </div>
                )}
              </div>

              <button
                onClick={() => setShowPay((v) => !v)}
                className="btn-primary mt-6 w-full justify-center"
              >
                {showPay ? 'Hide payment details' : 'Get ChainWork Pro'}
              </button>
              <p className="mt-3 text-center text-xs text-white/45">Billed yearly · cancel before renewal anytime</p>
            </div>
          </div>

          {showPay && (
            <div className="relative mt-10 grid md:grid-cols-2 gap-6">
              <div className="rounded-2xl border border-white/10 bg-ink-900/70 backdrop-blur p-6">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.2em] text-white/50">Membership reference</div>
                    <code className="block mt-1 text-lg font-mono font-semibold text-accent-200">{proRef}</code>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] uppercase tracking-[0.2em] text-white/50">To pay</div>
                    <div className="font-mono text-xl font-bold tabular-nums">${total.toLocaleString()}</div>
                  </div>
                </div>
                <p className="text-xs text-white/55 leading-relaxed mb-4">
                  This reference encodes your account and the <span className="text-white">{hires}-hire</span> plan. Include it as the transaction memo so we activate the right membership.
                </p>
                <div className="grid sm:grid-cols-1 gap-3">
                  {PLATFORM_WALLETS.map((w) => (
                    <EscrowAddressCard key={w.id} wallet={w} reference={proRef} />
                  ))}
                </div>
              </div>

              <div>
                <PaymentProofForm reference={proRef} kind="pro-membership" amount={`$${total.toLocaleString()}`} />
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

const Footer = () => (
  <footer className="border-t border-white/5 py-12">
    <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-white/50">
      <div className="flex items-center gap-2">
        <LogoMark className="h-6 w-6" />
        <span>© {new Date().getFullYear()} <Wordmark className="text-sm" /></span>
      </div>
      <div className="flex items-center gap-6">
        <a href="#" className="hover:text-white">Privacy</a>
        <a href="#" className="hover:text-white">Terms</a>
        <a href="#" className="hover:text-white">Contact</a>
      </div>
    </div>
  </footer>
)

const Home = () => (
  <>
    <Hero />
    <Categories />
    <HowItWorks />
    <Trust />
    <TwoSides />
    <Payments />
    <CTA />
  </>
)

export default function App() {
  const route = useHashRoute()
  const { user, loading } = useSession()
  const { profile, loading: profileLoading } = useProfile()
  const [signInOpen, setSignInOpen] = useState(false)
  const [roleModalOpen, setRoleModalOpen] = useState(false)

  // First-time picker: open once after sign-in when the profile row has no
  // role_chosen_at. Doesn't block any routes — modal renders on top.
  useEffect(() => {
    if (!user || profileLoading) { setRoleModalOpen(false); return }
    setRoleModalOpen(!profile?.role_chosen_at)
  }, [user, profile, profileLoading])

  const openSignIn  = () => setSignInOpen(true)
  const closeSignIn = () => setSignInOpen(false)
  const signOut     = async () => { if (supabase) await supabase.auth.signOut() }

  // Onboarding routes render their own minimal chrome — hide the global nav/footer.
  const isOnboarding =
    route.startsWith('#/post-task') || route.startsWith('#/join-as-worker')
  const needsAuth = isOnboarding || route.startsWith('#/worker') || route.startsWith('#/hirer') || route.startsWith('#/admin')

  let page
  if (route.startsWith('#/talents')) {
    page = <Talents />
  } else if (route.startsWith('#/admin/payments')) {
    page = user
      ? <AdminPayments />
      : <AuthGate title="Sign in to access admin" sub="Admin tools require a signed-in account flagged as admin." onSignIn={openSignIn} />
  } else if (route.startsWith('#/hirer')) {
    page = user
      ? <HirerDashboard />
      : <AuthGate title="Sign in to open your hirer dashboard" sub="Your posted tasks, escrow, and chats with workers live behind your wallet." onSignIn={openSignIn} />
  } else if (route.startsWith('#/post-task')) {
    page = user
      ? <PostTask />
      : <AuthGate title="Sign in to post a task" sub="Connect a wallet to keep your tasks, offers, and escrow safe." onSignIn={openSignIn} />
  } else if (route.startsWith('#/join-as-worker')) {
    page = user
      ? <JoinAsWorker />
      : <AuthGate title="Sign in to join as a worker" sub="Connect a wallet so your portfolio and earnings stay yours." onSignIn={openSignIn} />
  } else if (route.startsWith('#/worker')) {
    page = user
      ? <WorkerDashboard />
      : <AuthGate title="Sign in to open your dashboard" sub="Your portfolio, earnings, and active tasks live behind your wallet." onSignIn={openSignIn} />
  } else {
    page = <Home />
  }

  const showChrome = !isOnboarding || !user // show dark nav for unauthed AuthGate too

  return (
    <div className="min-h-screen flex flex-col">
      {showChrome && <Nav route={route} user={user} onSignIn={openSignIn} onSignOut={signOut} />}
      <main className="flex-1">
        {needsAuth && loading && !user ? (
          <div className="py-24 text-center text-white/50 text-sm">Loading…</div>
        ) : page}
      </main>
      {showChrome && <Footer />}
      <SignInModal open={signInOpen} onClose={closeSignIn} onSignedIn={() => closeSignIn()} />
      <RoleSelectModal open={roleModalOpen} onClose={() => setRoleModalOpen(false)} />
    </div>
  )
}
