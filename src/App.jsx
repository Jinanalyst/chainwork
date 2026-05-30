import React, { useMemo, useState, useEffect } from 'react'
import { Capacitor } from '@capacitor/core'
import NativeWalletApp from './components/NativeWalletApp.jsx'
import { LogoMark, Wordmark, Icon, useHashRoute, navigate } from './components/ui.jsx'
import { CATEGORIES as WEB_CATEGORIES } from './data/categories.jsx'
import SignInModal from './components/SignInModal.jsx'
import RoleSelectModal from './components/RoleSelectModal.jsx'
import LanguageSwitcher from './components/LanguageSwitcher.jsx'
import { useT } from './i18n/index.jsx'
import { useSession, shortAddress, getWalletDisplay, getWalletAddress, handleFor } from './hooks/useSession.js'
import { useProfile } from './hooks/useProfile.js'
import { supabase } from './lib/supabase.js'
import PostTask from './pages/PostTask.jsx'
import WorkerDashboard from './pages/WorkerDashboard.jsx'
import JoinAsWorker from './pages/JoinAsWorker.jsx'
import Talents from './pages/Talents.jsx'
import Jobs from './pages/Jobs.jsx'
import HirerDashboard from './pages/HirerDashboard.jsx'
import AdminPayments from './pages/AdminPayments.jsx'
import Privacy from './pages/Privacy.jsx'
import Terms from './pages/Terms.jsx'
import RefundPolicy from './pages/RefundPolicy.jsx'
import PaymentPolicy from './pages/PaymentPolicy.jsx'
import ServicePolicy from './pages/ServicePolicy.jsx'
import DisputePolicy from './pages/DisputePolicy.jsx'
import SellerPolicy from './pages/SellerPolicy.jsx'
import ProhibitedServices from './pages/ProhibitedServices.jsx'
import Contact from './pages/Contact.jsx'
import ChainPay from './pages/ChainPay.jsx'
import EmployerSubscriptionBadge from './components/EmployerSubscriptionBadge.jsx'
import NowPaymentsCheckoutButton from './components/NowPaymentsCheckoutButton.jsx'
import { isCurrentUserAdmin } from './lib/platform.js'
import About from './pages/About.jsx'
import Pricing from './pages/Pricing.jsx'
import Verification from './pages/Verification.jsx'
import BusinessInfo from './pages/BusinessInfo.jsx'

const UserChip = ({ user, onSignOut }) => {
  const { t } = useT()
  const [open, setOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [copied, setCopied] = useState(false)
  const address = getWalletAddress(user)
  const handle  = handleFor(user)
  const label   = handle || shortAddress(address) || t('nav.account')
  useEffect(() => {
    if (!user) { setIsAdmin(false); return }
    let cancelled = false
    isCurrentUserAdmin().then((v) => { if (!cancelled) setIsAdmin(v) })
    return () => { cancelled = true }
  }, [user?.id])
  const copyAddress = async () => {
    if (!address) return
    try {
      await navigator.clipboard.writeText(address)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {}
  }
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] hover:border-white/30 px-3 py-1.5 text-sm"
      >
        <span className="h-6 w-6 rounded-full bg-gradient-to-br from-brand-400 to-accent-400" />
        <span className="text-xs">{label}</span>
        <Icon path={<path d="M6 9l6 6 6-6" />} className="h-3.5 w-3.5 text-white/60" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-white/10 bg-ink-900 shadow-glow z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-white/5">
              <div className="text-[10px] uppercase tracking-[0.18em] text-white/45">{t('nav.signedInAs')}</div>
              <div className="mt-1 text-sm font-semibold">{handle || t('nav.account')}</div>
              {address && (
                <button
                  onClick={copyAddress}
                  className="mt-1 w-full text-left group inline-flex items-center justify-between gap-2 font-mono text-[11px] text-white/55 hover:text-white"
                >
                  <span className="truncate">{shortAddress(address)}</span>
                  <span className="text-[10px] text-white/45 group-hover:text-white shrink-0">
                    {copied ? t('common.copied') : t('common.copy')}
                  </span>
                </button>
              )}
            </div>
            <a href="#/hirer"     onClick={() => setOpen(false)} className="block px-4 py-2.5 text-sm hover:bg-white/5">{t('nav.hirerDashboard')}</a>
            <a href="#/worker"    onClick={() => setOpen(false)} className="block px-4 py-2.5 text-sm hover:bg-white/5">{t('nav.workerDashboard')}</a>
            <a href="#/post-task" onClick={() => setOpen(false)} className="block px-4 py-2.5 text-sm hover:bg-white/5">{t('nav.postTask')}</a>
            {isAdmin && (
              <a href="#/admin/payments" onClick={() => setOpen(false)} className="block px-4 py-2.5 text-sm hover:bg-white/5 border-t border-white/5 text-accent-200">{t('nav.adminPayments')}</a>
            )}
            <button onClick={() => { setOpen(false); onSignOut() }} className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 border-t border-white/5 text-rose-200">
              {t('nav.signOut')}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

const Nav = ({ route, user, onSignIn, onSignOut }) => {
  const { t } = useT()
  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-ink-950/60 border-b border-white/5">
      <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
        <a href="#/" className="flex items-center gap-2">
          <LogoMark className="h-9 w-9" />
          <Wordmark className="text-xl" />
        </a>
        <nav className="hidden md:flex items-center gap-8 text-sm text-white/70">
          <a href="#/"          className={'hover:text-white ' + (route === '#/' ? 'text-white' : '')}>{t('nav.home')}</a>
          <a href="#/jobs"      className={'hover:text-white ' + (route.startsWith('#/jobs') ? 'text-white' : '')}>{t('nav.jobs')}</a>
          <a href="#/talents"   className={'hover:text-white ' + (route.startsWith('#/talents') ? 'text-white' : '')}>{t('nav.talents')}</a>
          <a href="#/hirer"     className={'hover:text-white ' + ((route.startsWith('#/hirer') || route.startsWith('#/post-task')) ? 'text-white' : '')}>{t('nav.hirer')}</a>
          <a href="#/worker"    className={'hover:text-white ' + (route.startsWith('#/worker') ? 'text-white' : '')}>{t('nav.worker')}</a>
          <a href="#/pricing"   className={'hover:text-white ' + (route.startsWith('#/pricing') ? 'text-white' : '')}>{t('nav.pricing')}</a>
          <a href="#/about"     className={'hover:text-white ' + (route.startsWith('#/about') ? 'text-white' : '')}>{t('nav.about')}</a>
        </nav>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          {user ? (
            <UserChip user={user} onSignOut={onSignOut} />
          ) : (
            <>
              <button onClick={onSignIn} className="hidden sm:inline text-sm text-white/80 hover:text-white">{t('nav.signIn')}</button>
              <button onClick={onSignIn} className="btn-primary !py-2 !px-4 text-sm">{t('nav.getStarted')}</button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

const AuthGate = ({ title, sub, onSignIn }) => {
  const { t } = useT()
  return (
    <section className="py-24">
      <div className="mx-auto max-w-md px-6 text-center">
        <div className="mx-auto h-16 w-16 rounded-full bg-brand-500/15 border border-brand-400/30 grid place-items-center text-brand-200 mb-6">
          <Icon path={<><rect x="4" y="10" width="16" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>} className="h-7 w-7" />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold">{title}</h1>
        <p className="mt-2 text-white/65">{sub}</p>
        <button onClick={onSignIn} className="btn-primary mt-8 mx-auto">{t('auth.title')}</button>
        <p className="mt-4 text-xs text-white/45">{t('auth.description')}</p>
      </div>
    </section>
  )
}

const Hero = () => {
  const { t } = useT()
  const popular = t('hero.popular') || []
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 grid-overlay pointer-events-none" />
      <div className="relative mx-auto max-w-7xl px-6 pt-20 pb-28 md:pt-28 md:pb-36 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs text-white/80 mb-6">
          <span className="h-1.5 w-1.5 rounded-full bg-accent-400 animate-pulse" />
          {t('hero.pill')}
        </div>
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold leading-[1.05] tracking-tight">
          <Wordmark className="text-4xl md:text-6xl lg:text-7xl" />
        </h1>
        <p className="mt-6 text-2xl md:text-3xl font-semibold text-white/90 max-w-3xl mx-auto leading-snug">
          {t('hero.leadConnect')} <span className="gradient-text">{t('hero.leadPartners')}</span>{t('hero.leadEnd')}
        </p>
        <p className="mt-5 text-base md:text-lg text-white/70 max-w-2xl mx-auto">
          {t('hero.body')}
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <a href="#/post-task" className="btn-primary">
            {t('hero.cta')}
            <Icon path={<path d="M5 12h14M13 5l7 7-7 7" />} className="h-4 w-4" />
          </a>
          <a href="#categories" className="btn-ghost">{t('hero.browseCategories')}</a>
        </div>
        <div className="mt-12 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs text-white/50">
          <span className="uppercase tracking-[0.2em]">{t('hero.popularLabel')}</span>
          {(Array.isArray(popular) ? popular : []).map((label) => (
            <a key={label} href="#categories" className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 hover:border-white/25 hover:text-white transition">
              {label}
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}

const HOW_ICONS = [
  <><path d="M4 6h16M4 12h10M4 18h7" /></>,
  <><path d="M3 6h7v12H3zM14 6h7v8h-7zM14 18h7" /></>,
  <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>,
  <><rect x="2" y="6" width="20" height="12" rx="2" /><path d="M2 10h20" /></>,
  <><path d="M5 12l5 5L20 7" /></>,
  <><path d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6z" /><path d="M9 12l2 2 4-4" /></>,
]

const HowItWorks = () => {
  const { t } = useT()
  const stepsRaw = t('how.steps')
  const steps = Array.isArray(stepsRaw) ? stepsRaw : []
  return (
    <section id="how" className="relative py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center mb-14">
          <div className="text-xs uppercase tracking-[0.2em] text-accent-400 mb-3">{t('how.eyebrow')}</div>
          <h2 className="text-3xl md:text-5xl font-bold">{t('how.title')}</h2>
          <p className="mt-4 text-white/70 max-w-2xl mx-auto">
            {t('how.body')}
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {steps.map((s, i) => (
            <div key={i} className="card relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-brand-400/30 to-accent-400/30 border border-white/10 flex items-center justify-center text-brand-200">
                  <Icon path={HOW_ICONS[i] || HOW_ICONS[0]} className="h-5 w-5" />
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

const Categories = () => {
  const { t } = useT()
  const [category, setCategory] = useState('all')

  const visible = useMemo(
    () => (category === 'all' ? CATEGORIES : CATEGORIES.filter((c) => c.id === category)),
    [category],
  )

  return (
    <section id="categories" className="py-24 relative">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center mb-10">
          <div className="text-xs uppercase tracking-[0.2em] text-accent-400 mb-3">{t('categories.eyebrow')}</div>
          <h2 className="text-3xl md:text-5xl font-bold">{t('categories.title')}</h2>
          <p className="mt-4 text-white/70 max-w-2xl mx-auto">
            {t('categories.body')}
          </p>
        </div>

        {/* Filters */}
        <div className="mb-10 rounded-2xl border border-white/10 bg-white/[0.02] p-4 md:p-5">
          <div className="flex flex-col gap-3">
            <div className="cw-scroll overflow-x-auto -mx-1 px-1 pb-1">
              <div className="flex items-center gap-2 min-w-max">
                <span className="text-[11px] uppercase tracking-[0.15em] text-white/40 mr-1">{t('categories.labels.category')}</span>
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
                  {t('categories.all')}
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
              <a href={`#/talents?category=${c.id}`} className="btn-primary mt-6 !py-2.5 !px-5 text-sm self-start">
                {t('categories.findTalent')}
                <Icon path={<path d="M5 12h14M13 5l7 7-7 7" />} className="h-4 w-4" />
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

const Trust = () => {
  const { t } = useT()
  const items = t('trust.items')
  const list = Array.isArray(items) ? items : []
  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center mb-10">
          <div className="text-xs uppercase tracking-[0.2em] text-accent-400 mb-3">{t('trust.eyebrow')}</div>
          <h2 className="text-2xl md:text-4xl font-bold">{t('trust.title')}</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {list.map(([k, v], i) => (
            <div key={i} className="card">
              <div className="text-sm font-semibold text-white">{k}</div>
              <div className="text-xs text-white/60 mt-1 leading-relaxed">{v}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

const TwoSides = () => {
  const { t } = useT()
  const hirerBullets = t('twoSides.hirer.bullets')
  const workerBullets = t('twoSides.worker.bullets')
  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-6 grid lg:grid-cols-2 gap-8">
        <div id="talent" className="card p-8 md:p-10 relative overflow-hidden">
          <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-brand-500/20 blur-3xl" />
          <div className="relative">
            <div className="text-xs uppercase tracking-[0.2em] text-brand-300 mb-3">{t('twoSides.hirer.eyebrow')}</div>
            <h3 className="text-3xl font-bold">{t('twoSides.hirer.title')}</h3>
            <ul className="mt-6 space-y-3 text-white/80">
              {(Array.isArray(hirerBullets) ? hirerBullets : []).map((b, i) => (
                <li key={i} className="flex gap-3">
                  <Icon path={<path d="M5 12l5 5L20 7" />} className="h-5 w-5 text-accent-400 shrink-0 mt-0.5" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#/post-task" className="btn-primary">{t('twoSides.hirer.ctaPost')}</a>
              <a href="#/hirer" className="btn-ghost">{t('twoSides.hirer.ctaDashboard')}</a>
            </div>
          </div>
        </div>
        <div id="work" className="card p-8 md:p-10 relative overflow-hidden">
          <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-accent-500/20 blur-3xl" />
          <div className="relative">
            <div className="text-xs uppercase tracking-[0.2em] text-accent-400 mb-3">{t('twoSides.worker.eyebrow')}</div>
            <h3 className="text-3xl font-bold">{t('twoSides.worker.title')}</h3>
            <ul className="mt-6 space-y-3 text-white/80">
              {(Array.isArray(workerBullets) ? workerBullets : []).map((b, i) => (
                <li key={i} className="flex gap-3">
                  <Icon path={<path d="M5 12l5 5L20 7" />} className="h-5 w-5 text-accent-400 shrink-0 mt-0.5" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
            <a href="#/join-as-worker" className="btn-ghost mt-8">{t('twoSides.worker.cta')}</a>
          </div>
        </div>
      </div>
    </section>
  )
}

const PAYMENT_ICONS = [
  <><path d="M5 12l5 5L20 7" /></>,
  <><path d="M3 12h18M12 3v18" /></>,
  <><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></>,
]
const PAYMENT_ACCENTS = [
  'from-brand-400/30 to-brand-500/10',
  'from-accent-400/30 to-accent-500/10',
  'from-emerald-400/30 to-brand-500/10',
]

const Payments = () => {
  const { t } = useT()
  const raw = t('payments.structures')
  const structures = Array.isArray(raw) ? raw : []

  return (
    <section id="payments" className="py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center mb-12">
          <div className="text-xs uppercase tracking-[0.2em] text-accent-400 mb-3">{t('payments.eyebrow')}</div>
          <h2 className="text-3xl md:text-5xl font-bold">{t('payments.title')}</h2>
          <p className="mt-4 text-white/70 max-w-2xl mx-auto">
            {t('payments.body')}
          </p>
        </div>

        <div
          className={
            'grid gap-5 ' +
            (structures.length >= 3
              ? 'md:grid-cols-3'
              : 'sm:grid-cols-2 max-w-4xl mx-auto')
          }
        >
          {structures.map((s, i) => (
            <div key={i} className="card relative overflow-hidden">
              {s.pill && (
                <span className="absolute top-5 right-5 inline-flex items-center rounded-full bg-accent-500/20 border border-accent-500/40 text-accent-200 text-[10px] font-semibold tracking-wider px-2 py-0.5">
                  {s.pill}
                </span>
              )}
              <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${PAYMENT_ACCENTS[i] || PAYMENT_ACCENTS[0]} border border-white/10 flex items-center justify-center text-white mb-4`}>
                <Icon path={PAYMENT_ICONS[i] || PAYMENT_ICONS[0]} className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-white/70 leading-relaxed">{s.blurb}</p>
              <ul className="mt-5 space-y-2">
                {(s.bullets || []).map((b, j) => (
                  <li key={j} className="flex gap-2 text-sm text-white/80">
                    <Icon path={<path d="M5 12l5 5L20 7" />} className="h-4 w-4 text-accent-400 shrink-0 mt-0.5" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center text-xs text-white/45">
          {t('payments.footnote', { link: '' }).split('{{link}}')[0]}
          <a href="#/pricing" className="text-brand-300 hover:text-white">{t('payments.footnoteLink')}</a>
          {t('payments.footnote', { link: '' }).split('{{link}}')[1] || ''}
        </div>
      </div>
    </section>
  )
}

const CTA = () => {
  const { t } = useT()
  // Single flat product: ChainWork Verified Employer — 990,000 KRW / year, paid
  // in USDT (BEP20) via NOWPayments. The IPN webhook activates the subscription
  // once the payment is finished.
  const { user } = useSession()
  const benefits = t('cta.benefits')

  return (
    <section id="pro" className="py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-brand-700/40 via-ink-800 to-accent-600/30 p-8 md:p-14">
          <div className="absolute inset-0 grid-overlay opacity-50" />
          <div className="relative grid md:grid-cols-2 gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-accent-400/40 bg-accent-400/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-accent-200">
                <span className="h-1.5 w-1.5 rounded-full bg-accent-300" />
                {t('cta.eyebrow')}
              </div>
              <h2 className="mt-4 text-3xl md:text-5xl font-bold leading-tight">
                {t('cta.titleA')} <span className="bg-gradient-to-r from-brand-300 to-accent-300 bg-clip-text text-transparent">{t('cta.titleB')}</span>.
              </h2>
              <p className="mt-4 text-white/75 max-w-lg">
                {t('cta.body')}
              </p>
              <ul className="mt-6 space-y-2 text-sm text-white/75">
                {(Array.isArray(benefits) ? benefits : []).map((b, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Icon path={<path d="M5 12l5 5L20 7" />} className="h-4 w-4 text-accent-300 shrink-0 mt-0.5" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>

              {user && (
                <div className="mt-6">
                  <EmployerSubscriptionBadge />
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-ink-900/70 backdrop-blur p-6 md:p-8">
              <div className="text-xs uppercase tracking-[0.2em] text-white/50">{t('cta.planName')}</div>

              <div className="mt-4 flex items-baseline gap-2">
                <span className="font-mono text-4xl md:text-5xl font-bold tabular-nums bg-gradient-to-r from-brand-300 to-accent-300 bg-clip-text text-transparent">
                  990,000
                </span>
                <span className="text-lg text-white/70">KRW</span>
                <span className="text-sm text-white/50">{t('cta.perYear')}</span>
              </div>

              <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/70">
                {t('cta.payNote')}
              </div>

              <div className="mt-6">
                <NowPaymentsCheckoutButton
                  userId={user?.id}
                  description={t('cta.checkoutNote')}
                />
              </div>

              <p className="mt-4 text-center text-xs text-white/45">
                <a href="#/pricing" className="hover:text-white">{t('cta.seePricing')}</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

const Footer = () => {
  const { t } = useT()
  return (
    <footer className="border-t border-white/5 py-12">
      <div className="mx-auto max-w-7xl px-6 flex flex-col gap-6 text-sm text-white/50">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-2">
            <LogoMark className="h-6 w-6" />
            <span>© {new Date().getFullYear()} <Wordmark className="text-sm" /></span>
          </div>
          <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs md:text-sm">
            <a href="#/about" className="hover:text-white">{t('footer.about')}</a>
            <a href="#/pricing" className="hover:text-white">{t('footer.pricing')}</a>
            <a href="#/verification" className="hover:text-white">{t('footer.verification')}</a>
            <a href="#/terms" className="hover:text-white">{t('footer.terms')}</a>
            <a href="#/privacy" className="hover:text-white">{t('footer.privacy')}</a>
            <a href="#/payment-policy" className="hover:text-white">{t('footer.paymentPolicy')}</a>
            <a href="#/refund-policy" className="hover:text-white">{t('footer.refundPolicy')}</a>
            <a href="#/dispute-policy" className="hover:text-white">{t('footer.disputePolicy')}</a>
            <a href="#/service-policy" className="hover:text-white">{t('footer.servicePolicy')}</a>
            <a href="#/seller-policy" className="hover:text-white">{t('footer.sellerPolicy')}</a>
            <a href="#/prohibited-services" className="hover:text-white">{t('footer.prohibited')}</a>
            <a href="#/business-info" className="hover:text-white">{t('footer.businessInfo')}</a>
            <a href="#/contact" className="hover:text-white">{t('footer.contact')}</a>
          </nav>
        </div>
        <div className="border-t border-white/5 pt-4 grid gap-1 text-xs text-white/40 leading-relaxed">
          <p>
            <span className="text-white/60">{t('footer.company')}</span> {t('footer.companyName')} ·
            <span className="text-white/60"> {t('footer.ceo')}</span> {t('footer.ceoName')} ·
            <span className="text-white/60"> {t('footer.bizNumber')}</span> {t('footer.bizNumberValue')}
          </p>
          <p>
            <span className="text-white/60">{t('footer.mailOrder')}</span> {t('footer.mailOrderValue')}
          </p>
          <p>
            <span className="text-white/60">{t('footer.address')}</span> {t('footer.addressValue')}
          </p>
          <p>
            <span className="text-white/60">{t('footer.customerCenter')}</span>{' '}
            <a href="mailto:jangj6091@gmail.com" className="hover:text-white">jangj6091@gmail.com</a>{' '}
            · <span className="text-white/60">{t('footer.phone')}</span> {t('footer.phoneValue')}
          </p>
          <p className="text-white/35 mt-2">
            {t('footer.disclaimer')}
          </p>
        </div>
      </div>
    </footer>
  )
}

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
  // Inside the installed ChainPay APK we bypass the entire ChainWork web app
  // (no marketing pages, no Supabase session needed) and boot straight into
  // the self-custodial wallet.
  if (Capacitor.isNativePlatform()) return <NativeWalletApp/>

  const { t } = useT()
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
  const signOut = () => {
    if (typeof window !== 'undefined') {
      try {
        for (const storage of [window.localStorage, window.sessionStorage]) {
          const remove = []
          for (let i = 0; i < storage.length; i++) {
            const k = storage.key(i)
            if (k && (/^sb-/.test(k) || k.startsWith('chainwork.') || k.includes('supabase'))) {
              remove.push(k)
            }
          }
          for (const k of remove) { try { storage.removeItem(k) } catch {} }
        }
        if (window.indexedDB?.databases) {
          window.indexedDB.databases().then((dbs) => {
            for (const db of dbs || []) {
              if (db.name && /supabase|gotrue/i.test(db.name)) {
                try { window.indexedDB.deleteDatabase(db.name) } catch {}
              }
            }
          }).catch(() => {})
        }
      } catch {}
    }

    if (supabase) {
      try { supabase.auth.signOut({ scope: 'local' }) } catch {}
      try { supabase.auth.signOut() } catch {}
    }

    if (typeof window !== 'undefined') {
      window.location.href = window.location.origin + window.location.pathname
    }
  }

  const isOnboarding =
    route.startsWith('#/post-task') || route.startsWith('#/join-as-worker')
  const needsAuth = isOnboarding || route.startsWith('#/worker') || route.startsWith('#/hirer') || route.startsWith('#/admin')

  let page
  if (route.startsWith('#/about')) {
    page = <About />
  } else if (route.startsWith('#/pricing')) {
    page = <Pricing />
  } else if (route.startsWith('#/verification')) {
    page = <Verification />
  } else if (route.startsWith('#/business-info')) {
    page = <BusinessInfo />
  } else if (route.startsWith('#/privacy')) {
    page = <Privacy />
  } else if (route.startsWith('#/terms')) {
    page = <Terms />
  } else if (route.startsWith('#/refund-policy')) {
    page = <RefundPolicy />
  } else if (route.startsWith('#/payment-policy')) {
    page = <PaymentPolicy />
  } else if (route.startsWith('#/service-policy')) {
    page = <ServicePolicy />
  } else if (route.startsWith('#/dispute-policy')) {
    page = <DisputePolicy />
  } else if (route.startsWith('#/seller-policy')) {
    page = <SellerPolicy />
  } else if (route.startsWith('#/prohibited-services')) {
    page = <ProhibitedServices />
  } else if (route.startsWith('#/contact')) {
    page = <Contact />
  } else if (route.startsWith('#/pay')) {
    page = <ChainPay />
  } else if (route.startsWith('#/jobs')) {
    page = <Jobs />
  } else if (route.startsWith('#/talents')) {
    page = <Talents />
  } else if (route.startsWith('#/admin/payments')) {
    page = user
      ? <AdminPayments />
      : <AuthGate title={t('auth.gate.adminTitle')} sub={t('auth.gate.adminSub')} onSignIn={openSignIn} />
  } else if (route.startsWith('#/hirer')) {
    page = user
      ? <HirerDashboard />
      : <AuthGate title={t('auth.gate.hirerTitle')} sub={t('auth.gate.hirerSub')} onSignIn={openSignIn} />
  } else if (route.startsWith('#/post-task')) {
    page = user
      ? <PostTask />
      : <AuthGate title={t('auth.gate.postTaskTitle')} sub={t('auth.gate.postTaskSub')} onSignIn={openSignIn} />
  } else if (route.startsWith('#/join-as-worker')) {
    page = user
      ? <JoinAsWorker />
      : <AuthGate title={t('auth.gate.joinWorkerTitle')} sub={t('auth.gate.joinWorkerSub')} onSignIn={openSignIn} />
  } else if (route.startsWith('#/worker')) {
    page = user
      ? <WorkerDashboard />
      : <AuthGate title={t('auth.gate.workerTitle')} sub={t('auth.gate.workerSub')} onSignIn={openSignIn} />
  } else {
    page = <Home />
  }

  const isStandalone = route.startsWith('#/pay')
  const showChrome = !isStandalone && (!isOnboarding || !user)

  return (
    <div className="min-h-screen flex flex-col">
      {showChrome && <Nav route={route} user={user} onSignIn={openSignIn} onSignOut={signOut} />}
      <main className="flex-1">
        {needsAuth && loading && !user ? (
          <div className="py-24 text-center text-white/50 text-sm">{t('common.loading')}</div>
        ) : page}
      </main>
      {showChrome && <Footer />}
      <SignInModal open={signInOpen} onClose={closeSignIn} onSignedIn={() => closeSignIn()} />
      <RoleSelectModal open={roleModalOpen} onClose={() => setRoleModalOpen(false)} />
    </div>
  )
}
