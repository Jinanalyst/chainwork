import React, { useState } from 'react'
import { Icon, navigate } from '../components/ui.jsx'
import ExperienceManager from '../components/ExperienceManager.jsx'

const STATS = [
  { label: 'Lifetime earnings', value: '$48,920', delta: '+12% YoY' },
  { label: 'This month',        value: '$3,180',  delta: '+$420 vs last' },
  { label: 'In escrow',         value: '$1,450',  delta: '3 active tasks' },
  { label: 'Available',         value: '$640',    delta: 'Withdraw any time' },
]

const ACTIVE_TASKS = [
  { id: 1, title: 'Landing page for SaaS launch',   client: 'Northwind Co.',   category: 'Web Build',    progress: 60, due: 'In 2 days',     amount: '$950',  status: 'In escrow' },
  { id: 2, title: 'AI chatbot integration',          client: 'Verde Wellness',  category: 'AI Automation',progress: 25, due: 'In 6 days',     amount: '$1,800', status: 'In progress' },
  { id: 3, title: 'Fix Vercel deploy + auth bug',    client: 'Lumen Labs',      category: 'Web Fix',      progress: 90, due: 'Today',          amount: '$280',  status: 'Awaiting review' },
]

const PAYOUTS = [
  { id: 1, when: 'May 18',  title: 'Token landing page',       amount: '$1,200', method: 'USDC',  status: 'Paid' },
  { id: 2, when: 'May 14',  title: 'PWA setup for shop site',  amount: '$540',   method: 'Bank',  status: 'Paid' },
  { id: 3, when: 'May 09',  title: 'Mobile responsive fixes',  amount: '$180',   method: 'USDC',  status: 'Paid' },
  { id: 4, when: 'May 03',  title: 'OpenAI API integration',   amount: '$760',   method: 'Card',  status: 'Paid' },
]

const PORTFOLIO = [
  { id: 1, title: 'Northwind launch site',     category: 'Web Build',       client: 'Northwind Co.',  payout: '$950',   color: 'from-brand-400 to-brand-700' },
  { id: 2, title: 'Verde AI assistant',        category: 'AI Automation',   client: 'Verde Wellness', payout: '$1,800', color: 'from-violet-400 to-brand-500' },
  { id: 3, title: 'Lumen wallet UI',           category: 'Web3',            client: 'Lumen Labs',     payout: '$2,400', color: 'from-accent-400 to-brand-500' },
  { id: 4, title: 'Shoply PWA conversion',     category: 'App & PWA',       client: 'Shoply',         payout: '$620',   color: 'from-emerald-400 to-accent-600' },
  { id: 5, title: 'Auth + checkout fixes',     category: 'Web Fix',         client: 'Pebble Studio',  payout: '$480',   color: 'from-amber-400 to-rose-500' },
  { id: 6, title: 'Domain + email setup',      category: 'Digital Support', client: 'Bayside Coffee', payout: '$140',   color: 'from-brand-300 to-accent-400' },
]

const EXPERIENCE = [
  { period: '2024 – Present', role: 'Independent web + AI worker', org: 'ChainWork', desc: 'Shipping landing pages, AI chatbots, and Web3 dashboards for early-stage teams.' },
  { period: '2022 – 2024',    role: 'Senior front-end engineer',   org: 'Pixel & Pine Studio', desc: 'Led front-end for 20+ client launches — Next.js, Tailwind, Vercel.' },
  { period: '2020 – 2022',    role: 'Full-stack developer',        org: 'Northgate Labs',     desc: 'Built internal AI tooling and dashboards for analytics teams.' },
  { period: '2018 – 2020',    role: 'Web developer',               org: 'Freelance',          desc: 'Small business sites, Shopify themes, WordPress migrations.' },
]

const PAYMENT_METHODS = [
  { id: 'bank',   label: 'Chase Bank ••2841', kind: 'Primary',  icon: <><rect x="3" y="6" width="18" height="12" rx="2" /><path d="M3 10h18" /></> },
  { id: 'wallet', label: '0xA3…7Cf2 (Base)',   kind: 'Crypto',   icon: <><circle cx="12" cy="12" r="9" /><path d="M9 9.5a2.5 2.5 0 0 1 5 0c0 1.4-1.5 1.9-2.5 2.5-1 .6-2.5 1.1-2.5 2.5a2.5 2.5 0 0 0 5 0" /></> },
  { id: 'card',   label: 'Mastercard ••4416', kind: 'Backup',   icon: <><rect x="3" y="6" width="18" height="12" rx="2" /><path d="M3 10h18M7 15h3" /></> },
]

const Stat = ({ label, value, delta }) => (
  <div className="card">
    <div className="text-xs uppercase tracking-wider text-white/45">{label}</div>
    <div className="text-2xl md:text-3xl font-bold mt-1 gradient-text">{value}</div>
    <div className="text-[11px] text-white/55 mt-1">{delta}</div>
  </div>
)

const Pill = ({ children, tone = 'default' }) => {
  const tones = {
    default: 'bg-white/[0.05] border-white/10 text-white/70',
    info:    'bg-brand-500/15 border-brand-400/30 text-brand-200',
    ok:      'bg-accent-500/15 border-accent-500/30 text-accent-300',
    warn:    'bg-amber-500/15 border-amber-400/30 text-amber-200',
  }
  return <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] ${tones[tone]}`}>{children}</span>
}

const Section = ({ title, children, action }) => (
  <section className="mb-10">
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-xl font-semibold">{title}</h2>
      {action}
    </div>
    {children}
  </section>
)

const ActiveTask = ({ t }) => (
  <div className="card flex flex-col gap-3">
    <div className="flex items-start justify-between gap-3">
      <div>
        <div className="flex items-center gap-2 flex-wrap">
          <Pill tone="info">{t.category}</Pill>
          <Pill tone={t.status === 'Awaiting review' ? 'warn' : t.status === 'In escrow' ? 'ok' : 'default'}>{t.status}</Pill>
        </div>
        <h3 className="mt-2 font-semibold">{t.title}</h3>
        <div className="text-xs text-white/55 mt-0.5">{t.client} · Due {t.due}</div>
      </div>
      <div className="text-right">
        <div className="text-lg font-bold">{t.amount}</div>
        <div className="text-[11px] text-white/45">In escrow</div>
      </div>
    </div>
    <div>
      <div className="flex justify-between text-[11px] text-white/55 mb-1">
        <span>Progress</span><span>{t.progress}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-brand-400 to-accent-400" style={{ width: `${t.progress}%` }} />
      </div>
    </div>
    <div className="flex gap-2">
      <button className="btn-ghost !py-1.5 !px-3 text-xs">Open</button>
      <button className="btn-ghost !py-1.5 !px-3 text-xs">Message client</button>
    </div>
  </div>
)

export default function WorkerDashboard() {
  const [tab, setTab] = useState('overview')

  return (
    <section className="py-12">
      <div className="mx-auto max-w-7xl px-6">
        <button onClick={() => navigate('#/')} className="text-sm text-white/60 hover:text-white flex items-center gap-1.5 mb-6">
          <Icon path={<path d="M15 18l-6-6 6-6" />} className="h-4 w-4" />
          Back to home
        </button>

        {/* Profile header */}
        <div className="card relative overflow-hidden mb-8">
          <div className="absolute -top-24 -right-20 h-64 w-64 rounded-full bg-brand-500/20 blur-3xl" />
          <div className="relative flex flex-col md:flex-row md:items-center gap-6">
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-brand-400 to-accent-400 grid place-items-center text-2xl font-bold text-ink-950 shrink-0">AP</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-bold">Alex Park</h1>
                <Pill tone="ok"><Icon path={<path d="M5 12l4 4 10-10" />} className="h-3 w-3" /> Verified</Pill>
                <Pill tone="info">Top-rated</Pill>
              </div>
              <div className="mt-1 text-white/70">Full-stack web + AI worker · Seoul, KR</div>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-white/60">
                <span className="flex items-center gap-1">
                  <Icon path={<path d="M12 17.3l-6.2 3.7 1.6-7.1L2 9.2l7.2-.6L12 2l2.8 6.6 7.2.6-5.4 4.7 1.6 7.1z" />} className="h-4 w-4 text-amber-300" />
                  <span className="text-white">4.9</span> (37 reviews)
                </span>
                <span>Joined Mar 2024</span>
                <span>97% on-time</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="btn-ghost">Edit profile</button>
              <button className="btn-primary">Share</button>
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div className="mb-8 border-b border-white/10 overflow-x-auto">
          <div className="flex gap-1 min-w-max">
            {[
              ['overview',   'Overview'],
              ['tasks',      'Active tasks'],
              ['payments',   'Payments'],
              ['portfolio',  'Portfolio'],
              ['experience', 'Experience'],
            ].map(([id, label]) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={
                  'px-4 py-3 text-sm border-b-2 -mb-px transition ' +
                  (tab === id ? 'border-brand-300 text-white' : 'border-transparent text-white/55 hover:text-white')
                }
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Overview */}
        {tab === 'overview' && (
          <>
            <Section title="Earnings overview">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {STATS.map((s) => <Stat key={s.label} {...s} />)}
              </div>
            </Section>

            <Section title="Active tasks" action={<button onClick={() => setTab('tasks')} className="text-sm text-brand-300 hover:text-white">View all →</button>}>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ACTIVE_TASKS.map((t) => <ActiveTask key={t.id} t={t} />)}
              </div>
            </Section>

            <Section title="Recent payouts" action={<button onClick={() => setTab('payments')} className="text-sm text-brand-300 hover:text-white">View all →</button>}>
              <div className="card !p-0 overflow-hidden">
                <div className="grid grid-cols-12 px-5 py-3 text-[11px] uppercase tracking-wider text-white/40 border-b border-white/10">
                  <div className="col-span-2">Date</div>
                  <div className="col-span-5">Task</div>
                  <div className="col-span-2">Method</div>
                  <div className="col-span-2 text-right">Amount</div>
                  <div className="col-span-1 text-right">Status</div>
                </div>
                {PAYOUTS.map((p) => (
                  <div key={p.id} className="grid grid-cols-12 px-5 py-3 text-sm border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                    <div className="col-span-2 text-white/65">{p.when}</div>
                    <div className="col-span-5 truncate">{p.title}</div>
                    <div className="col-span-2 text-white/65">{p.method}</div>
                    <div className="col-span-2 text-right font-semibold">{p.amount}</div>
                    <div className="col-span-1 text-right"><Pill tone="ok">{p.status}</Pill></div>
                  </div>
                ))}
              </div>
            </Section>
          </>
        )}

        {tab === 'tasks' && (
          <Section title="Active tasks">
            <div className="grid md:grid-cols-2 gap-4">
              {ACTIVE_TASKS.map((t) => <ActiveTask key={t.id} t={t} />)}
            </div>
          </Section>
        )}

        {tab === 'payments' && (
          <>
            <Section title="Balance">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {STATS.map((s) => <Stat key={s.label} {...s} />)}
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <button className="btn-primary">Withdraw $640</button>
                <button className="btn-ghost">Set auto-payout</button>
              </div>
            </Section>

            <Section title="Payment methods" action={<button className="text-sm text-brand-300 hover:text-white">+ Add method</button>}>
              <div className="grid md:grid-cols-3 gap-4">
                {PAYMENT_METHODS.map((m) => (
                  <div key={m.id} className="card">
                    <div className="flex items-start justify-between">
                      <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 grid place-items-center text-white/80">
                        <Icon path={m.icon} className="h-5 w-5" />
                      </div>
                      <Pill>{m.kind}</Pill>
                    </div>
                    <div className="mt-3 font-medium">{m.label}</div>
                    <div className="mt-3 flex gap-2">
                      <button className="btn-ghost !py-1.5 !px-3 text-xs">Manage</button>
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            <Section title="Payout history">
              <div className="card !p-0 overflow-hidden">
                {PAYOUTS.map((p) => (
                  <div key={p.id} className="grid grid-cols-12 px-5 py-3 text-sm border-b border-white/5 last:border-0">
                    <div className="col-span-2 text-white/65">{p.when}</div>
                    <div className="col-span-5">{p.title}</div>
                    <div className="col-span-2 text-white/65">{p.method}</div>
                    <div className="col-span-2 text-right font-semibold">{p.amount}</div>
                    <div className="col-span-1 text-right"><Pill tone="ok">{p.status}</Pill></div>
                  </div>
                ))}
              </div>
            </Section>
          </>
        )}

        {tab === 'portfolio' && (
          <Section title="Portfolio" action={<button className="text-sm text-brand-300 hover:text-white">+ Add project</button>}>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {PORTFOLIO.map((p) => (
                <div key={p.id} className="card !p-0 overflow-hidden">
                  <div className={`h-36 bg-gradient-to-br ${p.color} relative`}>
                    <div className="absolute inset-0 opacity-30 grid-overlay" />
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <Pill tone="info">{p.category}</Pill>
                    </div>
                    <h3 className="font-semibold">{p.title}</h3>
                    <div className="text-xs text-white/55 mt-0.5">{p.client}</div>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="text-sm font-semibold">{p.payout}</div>
                      <button className="text-xs text-brand-300 hover:text-white">View case →</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {tab === 'experience' && (
          <section className="mb-10">
            <ExperienceManager />
          </section>
        )}
      </div>
    </section>
  )
}
