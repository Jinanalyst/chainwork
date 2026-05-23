import React, { useMemo, useState } from 'react'
import { Icon, navigate } from '../components/ui.jsx'
import ExperienceManager from '../components/ExperienceManager.jsx'
import PortfolioManager from '../components/PortfolioManager.jsx'
import ActiveTaskList from '../components/ActiveTaskList.jsx'
import OfferCard from '../components/OfferCard.jsx'
import ProfileEditor from '../components/ProfileEditor.jsx'
import ShareProfileModal from '../components/ShareProfileModal.jsx'
import { useTasks } from '../hooks/useTasks.js'
import { useTaskStore } from '../hooks/useTaskStore.js'
import { taskStore } from '../lib/taskStore.js'
import { PLATFORM_FEE_RATE, platformFee, workerNet, fmtUSD } from '../lib/fees.js'

// `gross` stats (subject to the 10% fee) display NET as the headline number
// with the gross underneath. `value` stats (e.g. cash already in your wallet)
// skip the breakdown.
const STATS = [
  { label: 'Lifetime earnings', gross: 48920, delta: '+12% YoY' },
  { label: 'This month',        gross: 3180,  delta: '+$420 vs last' },
  { label: 'In escrow',         gross: 1450,  delta: 'Across 3 tasks' },
  { label: 'Available',         value: 640,   delta: 'Ready to withdraw' },
]

const ME = { name: 'Alex Park' }

const ensureProtocol = (u) => {
  if (!u) return ''
  return /^https?:\/\//i.test(u) || /^mailto:/i.test(u) ? u : `https://${u}`
}

// Default profile values shown until the user edits them. Lifted to state
// in the component so Edit + Share can mutate / read live values.
const DEFAULT_PROFILE = {
  name:         'Alex Park',
  role:         'Full-stack web + AI worker',
  location:     'Seoul, KR',
  email:        'alex@chainwork.test',
  bio:          'Shipping landing pages, AI chatbots, and Web3 dashboards for early-stage teams. Focus on fast, well-deployed builds.',
  portfolioUrl: 'https://alexpark.dev',
  socials: {
    github:   'github.com/alexpark',
    twitter:  'x.com/alexpark',
    linkedin: 'linkedin.com/in/alexpark',
    website:  'alexpark.dev',
  },
}

const ACTIVE_TASKS = [
  {
    id: 1,
    title: 'Landing page for SaaS launch',
    category: 'Web Build',
    status: 'In escrow',
    employer: { name: 'Sara Chen', company: 'Northwind Co.', contact: 'sara@northwind.co' },
    talent:   ME,
    budget: '$950',
    deadline: 'Jun 4, 2026',
    lastActivity: '2h ago',
    progress: 60,
    paymentStructure: 'fifty-fifty',
    description: "Single-page launch site for our new SaaS product. Hero, feature grid, pricing teaser, FAQ, and an email signup tied to Loops. Brand assets are ready in Figma — keep it clean, fast, and mobile-first.",
    skills: ['React', 'Tailwind', 'Vercel', 'Figma'],
    url: 'https://northwind.co',
    attachments: [
      { id: 'a1', label: 'Brand guidelines (Figma)', url: 'https://figma.com' },
      { id: 'a2', label: 'Reference landing pages',  url: 'https://stripe.com' },
    ],
    timeline: [
      { id: 't1', label: 'Task posted',          when: 'May 18', by: 'Sara Chen' },
      { id: 't2', label: 'Offer accepted',       when: 'May 19', by: 'Sara Chen' },
      { id: 't3', label: 'Escrow funded',        when: 'May 19', by: 'System' },
      { id: 't4', label: 'Milestone 1 delivered', when: 'May 26', by: ME.name },
      { id: 't5', label: 'Milestone 1 approved', when: 'May 27', by: 'Sara Chen' },
    ],
    notes: [
      { id: 'n1', by: 'Sara Chen', when: 'Yesterday', body: 'Hero is looking great — can the CTA be a touch larger on mobile?' },
      { id: 'n2', by: ME.name,     when: 'Today',     body: 'Done, bumped to 18px and added more vertical padding. Pushing now.' },
    ],
  },
  {
    id: 2,
    title: 'AI chatbot integration',
    category: 'AI Automation',
    status: 'In progress',
    employer: { name: 'Mia Tan', company: 'Verde Wellness', contact: 'mia@verde.co' },
    talent:   ME,
    budget: '$1,800',
    deadline: 'Jun 8, 2026',
    lastActivity: '1d ago',
    progress: 25,
    paymentStructure: 'fifty-fifty',
    description: "Embed a help chatbot on the product pages. Use OpenAI with a small RAG over the FAQ + product catalog. Needs a streaming UI and lead-capture when the bot can't answer.",
    skills: ['Next.js', 'OpenAI API', 'Edge Functions'],
    url: 'https://verde.example.com',
    attachments: [
      { id: 'a1', label: 'Product catalog CSV', url: '#' },
      { id: 'a2', label: 'FAQ doc',             url: '#' },
    ],
    timeline: [
      { id: 't1', label: 'Task posted',    when: 'May 22', by: 'Mia Tan' },
      { id: 't2', label: 'Offer accepted', when: 'May 23', by: 'Mia Tan' },
      { id: 't3', label: 'Escrow funded',  when: 'May 23', by: 'System' },
      { id: 't4', label: 'Discovery call', when: 'May 24', by: 'Mia Tan' },
    ],
    notes: [],
  },
  {
    id: 3,
    title: 'Fix Vercel deploy + auth bug',
    category: 'Web Fix',
    status: 'Awaiting review',
    employer: { name: 'Dan Park', company: 'Lumen Labs', contact: 'dan@lumen.xyz' },
    talent:   ME,
    budget: '$280',
    deadline: 'Today',
    lastActivity: '20m ago',
    progress: 90,
    paymentStructure: 'full-on-completion',
    description: "Vercel build is failing on the auth route after a Next.js upgrade. Also need to fix a session loop that signs users out on refresh. Repo access provided.",
    skills: ['Next.js', 'Auth', 'Vercel'],
    url: 'https://lumen.xyz',
    attachments: [
      { id: 'a1', label: 'GitHub repo',  url: 'https://github.com' },
      { id: 'a2', label: 'Build logs',   url: '#' },
    ],
    timeline: [
      { id: 't1', label: 'Task posted',         when: 'May 26', by: 'Dan Park' },
      { id: 't2', label: 'Offer accepted',      when: 'May 26', by: 'Dan Park' },
      { id: 't3', label: 'Escrow funded',       when: 'May 26', by: 'System' },
      { id: 't4', label: 'Fix submitted for review', when: '20m ago', by: ME.name },
    ],
    notes: [
      { id: 'n1', by: ME.name, when: '20m ago', body: 'Pushed a fix — build is green, sessions persist on refresh. Ready for review.' },
    ],
  },
]

// Amounts are gross USD. The platform takes 10% — workers receive 90%.
const PAYOUTS = [
  { id: 1, when: 'May 18', title: 'Token landing page',      amount: 1200, method: 'USDC', chain: 'Base',     status: 'Paid' },
  { id: 2, when: 'May 14', title: 'PWA setup for shop site', amount:  540, method: 'USDT', chain: 'Ethereum', status: 'Paid' },
  { id: 3, when: 'May 09', title: 'Mobile responsive fixes', amount:  180, method: 'USDC', chain: 'Solana',   status: 'Paid' },
  { id: 4, when: 'May 03', title: 'OpenAI API integration',  amount:  760, method: 'USDT', chain: 'Polygon',  status: 'Paid' },
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
  { id: 'usdc-base',     token: 'USDC', chain: 'Base',     address: '0xA3…7Cf2', kind: 'Primary',  tint: 'from-brand-400 to-brand-700' },
  { id: 'usdt-eth',      token: 'USDT', chain: 'Ethereum', address: '0xA3…7Cf2', kind: 'Backup',   tint: 'from-accent-400 to-accent-700' },
  { id: 'usdc-solana',   token: 'USDC', chain: 'Solana',   address: 'F3a…9Kp1',  kind: 'Backup',   tint: 'from-brand-400 to-brand-700' },
]

const Stat = ({ label, gross, value, delta }) => {
  const hasFee  = gross !== undefined
  const display = hasFee ? workerNet(gross) : value
  return (
    <div className="card">
      <div className="text-xs uppercase tracking-wider text-white/45 flex items-center gap-2">
        {label}
        {hasFee && (
          <span className="rounded-full bg-white/[0.05] border border-white/10 px-1.5 py-0.5 text-[9px] text-white/55">NET</span>
        )}
      </div>
      <div className="text-2xl md:text-3xl font-bold mt-1 gradient-text">{fmtUSD(display)}</div>
      {hasFee ? (
        <div className="text-[11px] text-white/55 mt-1">
          {fmtUSD(gross)} gross
          <span className="text-white/30"> · </span>
          {fmtUSD(platformFee(gross))} fee
        </div>
      ) : (
        <div className="text-[11px] text-white/55 mt-1">{delta}</div>
      )}
    </div>
  )
}

const Pill = ({ children, tone = 'default' }) => {
  const tones = {
    default: 'bg-white/[0.05] border-white/10 text-white/70',
    info:    'bg-brand-500/15 border-brand-400/30 text-brand-200',
    ok:      'bg-accent-500/15 border-accent-500/30 text-accent-300',
    warn:    'bg-amber-500/15 border-amber-400/30 text-amber-200',
  }
  return <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] ${tones[tone]}`}>{children}</span>
}

const TokenChip = ({ token }) => (
  <span className={
    'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium ' +
    (token === 'USDC'
      ? 'bg-brand-500/15 border-brand-400/30 text-brand-200'
      : 'bg-accent-500/15 border-accent-500/30 text-accent-200')
  }>
    <span className={
      'h-3.5 w-3.5 rounded-full grid place-items-center text-[8px] font-bold text-white ' +
      (token === 'USDC' ? 'bg-brand-500' : 'bg-accent-600')
    }>
      {token === 'USDC' ? '$' : '₮'}
    </span>
    {token}
  </span>
)

const PayoutTable = ({ rows }) => {
  const totals = rows.reduce(
    (acc, r) => {
      acc.gross += r.amount
      acc.fee   += platformFee(r.amount)
      acc.net   += workerNet(r.amount)
      return acc
    },
    { gross: 0, fee: 0, net: 0 },
  )
  return (
    <div className="card !p-0 overflow-hidden">
      <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between text-xs">
        <div className="text-white/55">
          Platform fee: <span className="text-white/85 font-medium">10%</span>
          <span className="text-white/30"> · </span>
          You receive: <span className="text-accent-300 font-medium">90%</span>
        </div>
        <div className="text-white/55">
          Lifetime net: <span className="text-white font-semibold">{fmtUSD(totals.net)}</span>
          <span className="text-white/35"> of </span>
          <span className="text-white/75">{fmtUSD(totals.gross)} gross</span>
        </div>
      </div>
      <div className="grid grid-cols-12 px-5 py-3 text-[11px] uppercase tracking-wider text-white/40 border-b border-white/10">
        <div className="col-span-2">Date</div>
        <div className="col-span-4">Task</div>
        <div className="col-span-2">Token · Chain</div>
        <div className="col-span-1 text-right">Gross</div>
        <div className="col-span-1 text-right">Fee 10%</div>
        <div className="col-span-2 text-right">You receive</div>
      </div>
      {rows.map((p) => {
        const fee = platformFee(p.amount)
        const net = workerNet(p.amount)
        return (
          <div key={p.id} className="grid grid-cols-12 px-5 py-3 text-sm border-b border-white/5 last:border-0 hover:bg-white/[0.02] items-center">
            <div className="col-span-2 text-white/65">{p.when}</div>
            <div className="col-span-4 min-w-0">
              <div className="truncate">{p.title}</div>
              <div className="text-[11px] text-white/40 mt-0.5"><Pill tone="ok">{p.status}</Pill></div>
            </div>
            <div className="col-span-2">
              <TokenChip token={p.method} />
              <div className="text-[11px] text-white/45 mt-0.5">{p.chain}</div>
            </div>
            <div className="col-span-1 text-right text-white/65">{fmtUSD(p.amount)}</div>
            <div className="col-span-1 text-right text-rose-200/80">−{fmtUSD(fee)}</div>
            <div className="col-span-2 text-right font-semibold text-accent-300">{fmtUSD(net)}</div>
          </div>
        )
      })}
    </div>
  )
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


export default function WorkerDashboard() {
  const [tab, setTab] = useState('overview')
  const [profile, setProfile] = useState(DEFAULT_PROFILE)
  const [editOpen, setEditOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const { tasks: liveTasks, loading: tasksLoading, addNote } = useTasks()
  const store = useTaskStore()

  // From the shared store, my active/completed tasks + offers I haven't declined.
  const myStoreTasks = useMemo(
    () => store.tasks.filter((t) => t.talent?.name === ME.name),
    [store.tasks],
  )
  const offers = useMemo(
    () => store.tasks.filter(
      (t) => t.status === 'Open' && !t.talent && !(t.declinedBy || []).includes(ME.name),
    ),
    [store.tasks],
  )

  // Show real (Supabase) tasks if available, otherwise the shared mock store.
  const usingReal   = liveTasks.length > 0
  const tasks       = usingReal ? liveTasks : myStoreTasks
  const taskAddNote = usingReal ? addNote   : (id, body) => taskStore.addNote(id, body, ME.name)

  const acceptOffer = async (offer) => {
    taskStore.acceptOffer(offer.id, { name: ME.name })
    setTab('tasks')
  }
  const declineOffer = (offer) => taskStore.declineOffer(offer.id, ME.name)

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
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-brand-400 to-accent-400 grid place-items-center text-2xl font-bold text-ink-950 shrink-0">
              {(profile.name || '?').split(/\s+/).map((p) => p[0] || '').slice(0, 2).join('').toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-bold">{profile.name || 'Your name'}</h1>
                <Pill tone="ok"><Icon path={<path d="M5 12l4 4 10-10" />} className="h-3 w-3" /> Verified</Pill>
                <Pill tone="info">Top-rated</Pill>
              </div>
              <div className="mt-1 text-white/70">
                {profile.role || '—'}{profile.location && <span> · {profile.location}</span>}
              </div>
              {profile.bio && <p className="mt-2 text-sm text-white/60 max-w-2xl">{profile.bio}</p>}
              <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-white/60">
                <span className="flex items-center gap-1">
                  <Icon path={<path d="M12 17.3l-6.2 3.7 1.6-7.1L2 9.2l7.2-.6L12 2l2.8 6.6 7.2.6-5.4 4.7 1.6 7.1z" />} className="h-4 w-4 text-amber-300" />
                  <span className="text-white">4.9</span> (37 reviews)
                </span>
                <span>Joined Mar 2024</span>
                <span>97% on-time</span>
              </div>
              {/* Contact + portfolio + socials surface row */}
              {(profile.email || profile.portfolioUrl || profile.socials) && (
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                  {profile.email && (
                    <a href={`mailto:${profile.email}`} className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.04] border border-white/10 hover:border-white/25 px-2.5 py-1 text-white/80">
                      <Icon path={<><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></>} className="h-3 w-3" />
                      {profile.email}
                    </a>
                  )}
                  {profile.portfolioUrl && (
                    <a href={ensureProtocol(profile.portfolioUrl)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.04] border border-white/10 hover:border-white/25 px-2.5 py-1 text-white/80">
                      <Icon path={<><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></>} className="h-3 w-3" />
                      Portfolio
                    </a>
                  )}
                  {Object.entries(profile.socials || {}).filter(([, v]) => v).map(([k, v]) => (
                    <a key={k} href={ensureProtocol(v)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.04] border border-white/10 hover:border-white/25 px-2.5 py-1 text-white/80 capitalize">
                      {k}
                    </a>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setEditOpen(true)} className="btn-ghost">
                <Icon path={<><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4z" /></>} className="h-4 w-4" />
                Edit profile
              </button>
              <button onClick={() => setShareOpen(true)} className="btn-primary">
                <Icon path={<><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" /></>} className="h-4 w-4" />
                Share
              </button>
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div className="mb-8 border-b border-white/10 overflow-x-auto">
          <div className="flex gap-1 min-w-max">
            {[
              ['overview',   'Overview'],
              ['offers',     `Offers${offers.length ? ` (${offers.length})` : ''}`],
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

            <Section
              title="Active tasks"
              action={<button onClick={() => setTab('tasks')} className="text-sm text-brand-300 hover:text-white">View all →</button>}
            >
              <ActiveTaskList
                tasks={tasks}
                limit={3}
                columns="md:grid-cols-2 lg:grid-cols-3"
                onAddNote={taskAddNote}
                onUpdateProgress={usingReal ? undefined : taskStore.updateProgress}
                onSubmitForReview={usingReal ? undefined : taskStore.submitForReview}
                selfName={ME.name}
                viewerRole="worker"
              />
              {!usingReal && !tasksLoading && (
                <div className="mt-3 text-[11px] text-white/40">
                  Showing sample tasks. Post or accept a task in Supabase to see real data here.
                </div>
              )}
            </Section>

            {offers.length > 0 && (
              <Section
                title={`Incoming offers (${offers.length})`}
                action={<button onClick={() => setTab('offers')} className="text-sm text-brand-300 hover:text-white">See all →</button>}
              >
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {offers.slice(0, 3).map((o) => (
                    <OfferCard key={o.id} offer={o} onAccept={acceptOffer} onDecline={declineOffer} />
                  ))}
                </div>
              </Section>
            )}

            <Section title="Recent payouts" action={<button onClick={() => setTab('payments')} className="text-sm text-brand-300 hover:text-white">View all →</button>}>
              <PayoutTable rows={PAYOUTS} />
            </Section>
          </>
        )}

        {tab === 'offers' && (
          <Section
            title={`Incoming offers${offers.length ? ` (${offers.length})` : ''}`}
            action={<span className="text-xs text-white/45">Matched to your skills · accept to start work</span>}
          >
            {offers.length === 0 ? (
              <div className="card text-center py-12">
                <div className="text-white/70">No open offers right now.</div>
                <div className="text-xs text-white/45 mt-1">We'll surface new matches here as hirers post them.</div>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {offers.map((o) => (
                  <OfferCard key={o.id} offer={o} onAccept={acceptOffer} onDecline={declineOffer} />
                ))}
              </div>
            )}
          </Section>
        )}

        {tab === 'tasks' && (
          <Section title="Active tasks">
            {tasksLoading ? (
              <div className="card text-center py-12 text-white/60 text-sm">Loading…</div>
            ) : (
              <>
                <ActiveTaskList
                  tasks={tasks}
                  columns="md:grid-cols-2"
                  onAddNote={taskAddNote}
                  onUpdateProgress={usingReal ? undefined : taskStore.updateProgress}
                  onSubmitForReview={usingReal ? undefined : taskStore.submitForReview}
                  selfName={ME.name}
                  viewerRole="worker"
                />
                {!usingReal && (
                  <div className="mt-3 text-[11px] text-white/40">
                    Showing sample tasks. Post or accept a task to see real data here.
                  </div>
                )}
              </>
            )}
          </Section>
        )}

        {tab === 'payments' && (
          <>
            <Section title="Balance">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {STATS.map((s) => <Stat key={s.label} {...s} />)}
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <button className="btn-primary">Withdraw {fmtUSD(640)}</button>
                <button className="btn-ghost">Set auto-payout</button>
              </div>
            </Section>

            <Section title="Stablecoin wallets" action={<button className="text-sm text-brand-300 hover:text-white">+ Add wallet</button>}>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {PAYMENT_METHODS.map((m) => (
                  <div key={m.id} className="card">
                    <div className="flex items-start justify-between">
                      <div className={`h-10 w-10 rounded-full grid place-items-center text-sm font-bold text-white bg-gradient-to-br ${m.tint}`}>
                        {m.token === 'USDC' ? '$' : '₮'}
                      </div>
                      <Pill tone={m.kind === 'Primary' ? 'ok' : 'default'}>{m.kind}</Pill>
                    </div>
                    <div className="mt-3 font-semibold">{m.token} <span className="text-white/55 font-normal">· {m.chain}</span></div>
                    <div className="font-mono text-xs text-white/55 mt-0.5">{m.address}</div>
                    <div className="mt-3 flex gap-2">
                      <button className="btn-ghost !py-1.5 !px-3 text-xs">Manage</button>
                      {m.kind !== 'Primary' && (
                        <button className="text-xs text-brand-300 hover:text-white px-2 py-1.5">Make primary</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            <Section title="Payout history">
              <PayoutTable rows={PAYOUTS} dense={false} />
            </Section>
          </>
        )}

        {tab === 'portfolio' && (
          <section className="mb-10">
            <PortfolioManager />
          </section>
        )}

        {tab === 'experience' && (
          <section className="mb-10">
            <ExperienceManager />
          </section>
        )}
      </div>

      <ProfileEditor
        open={editOpen}
        initial={profile}
        onClose={() => setEditOpen(false)}
        onSave={(next) => setProfile(next)}
      />

      <ShareProfileModal
        open={shareOpen}
        profile={profile}
        onClose={() => setShareOpen(false)}
      />
    </section>
  )
}
