import React, { useEffect, useMemo, useState } from 'react'
import { Icon, navigate } from '../components/ui.jsx'
import ExperienceManager from '../components/ExperienceManager.jsx'
import PortfolioManager from '../components/PortfolioManager.jsx'
import ActiveTaskList from '../components/ActiveTaskList.jsx'
import OfferCard from '../components/OfferCard.jsx'
import ProfileEditor from '../components/ProfileEditor.jsx'
import ShareProfileModal from '../components/ShareProfileModal.jsx'
import ReviewsModal from '../components/ReviewsModal.jsx'
import StarRating from '../components/StarRating.jsx'
import { useTasks } from '../hooks/useTasks.js'
import { useTaskStore } from '../hooks/useTaskStore.js'
import { taskStore } from '../lib/taskStore.js'
import { useSession, getWalletDisplay, shortAddress } from '../hooks/useSession.js'
import { useProfile } from '../hooks/useProfile.js'
import { isLiveChatReady } from '../lib/liveChat.js'
import LiveChatPanel from '../components/LiveChatPanel.jsx'
import RoleSwitcher from '../components/RoleSwitcher.jsx'
import { PLATFORM_FEE_RATE, platformFee, workerNet, fmtUSD } from '../lib/fees.js'

// Stats are driven entirely from the live task data below — start at 0.
const buildStats = (liveTasks) => {
  const inEscrow = liveTasks
    .filter((t) => /escrow|progress|review/i.test(t.status || ''))
    .reduce((sum, t) => sum + Number(String(t.budget || '').replace(/[^0-9.]/g, '')) || 0, 0)
  return [
    { label: 'Lifetime earnings', gross: 0,        delta: 'No payouts yet' },
    { label: 'This month',        gross: 0,        delta: '—' },
    { label: 'In escrow',         gross: inEscrow, delta: `Across ${liveTasks.length} task${liveTasks.length === 1 ? '' : 's'}` },
    { label: 'Available',         value: 0,        delta: 'Ready to withdraw' },
  ]
}

const ensureProtocol = (u) => {
  if (!u) return ''
  return /^https?:\/\//i.test(u) || /^mailto:/i.test(u) ? u : `https://${u}`
}

// Built from profile + session at render-time. See DEFAULT_PROFILE_FROM_PROFILE().
const EMPTY_PROFILE = {
  name: '', role: '', location: '', email: '', bio: '', portfolioUrl: '',
  socials: { github: '', twitter: '', linkedin: '', website: '' },
}

const EMPTY_LIST = []

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

// Worker messages: rooms for active tasks (working together) and offers
// the worker has engaged with (offering phase). Live via Supabase Realtime.
const WorkerMessages = ({ tasks, offers, displayName }) => {
  const { user } = useSession()
  const live = isLiveChatReady(user)

  const rooms = useMemo(() => {
    const a = (tasks || []).map((t) => ({
      taskId: t.id, title: t.title,
      sub: `with ${t.employer?.name || 'hirer'} · ${t.status || ''}`,
      kind: 'task',
    }))
    const b = (offers || []).map((o) => ({
      taskId: o.id, title: o.title,
      sub: `offer from ${o.employer?.name || 'hirer'}`,
      kind: 'offer',
    }))
    return [...a, ...b]
  }, [tasks, offers])

  const [selected, setSelected] = useState(rooms[0]?.taskId ?? null)
  const selectedRoom = rooms.find((r) => r.taskId === selected) || rooms[0]

  if (!live) {
    return (
      <Section title="Messages">
        <div className="card text-center py-10">
          <div className="text-sm text-white/70">Connect your wallet to chat live.</div>
          <div className="text-[11px] text-white/45 mt-1">Use the Connect wallet button in the top nav.</div>
        </div>
      </Section>
    )
  }

  if (rooms.length === 0) {
    return (
      <Section title="Messages">
        <div className="card text-center py-10">
          <div className="text-white/70">No conversations yet.</div>
          <div className="text-xs text-white/45 mt-1">Open an offer or accept a task to start chatting.</div>
        </div>
      </Section>
    )
  }

  return (
    <Section
      title="Messages"
      action={(
        <span className="inline-flex items-center gap-1 text-[11px] text-accent-300">
          <span className="h-1.5 w-1.5 rounded-full bg-accent-400 animate-pulse" /> Live
        </span>
      )}
    >
      <div className="grid lg:grid-cols-[320px_1fr] gap-4">
        <div className="card !p-3">
          <div className="text-xs uppercase tracking-wider text-white/45 px-2 mb-2">Conversations</div>
          <div className="space-y-1">
            {rooms.map((r) => (
              <button
                key={`${r.kind}-${r.taskId}`}
                onClick={() => setSelected(r.taskId)}
                className={
                  'w-full text-left rounded-xl px-3 py-3 transition border ' +
                  (selectedRoom?.taskId === r.taskId
                    ? 'bg-white/[0.08] border-white/15'
                    : 'hover:bg-white/[0.04] border-transparent')
                }
              >
                <div className="text-sm font-medium truncate">{r.title}</div>
                <div className="text-[11px] text-white/55 truncate">{r.sub}</div>
              </button>
            ))}
          </div>
        </div>
        <div>
          {selectedRoom && (
            <LiveChatPanel
              key={selectedRoom.taskId}
              taskId={selectedRoom.taskId}
              role="worker"
              displayName={displayName}
              title={selectedRoom.title}
              subtitle={selectedRoom.sub}
              emptyHint={selectedRoom.kind === 'offer'
                ? 'Introduce yourself to the hirer — they will see this live.'
                : 'No messages yet — say hello.'}
            />
          )}
        </div>
      </div>
    </Section>
  )
}


export default function WorkerDashboard() {
  const [tab, setTab] = useState('overview')
  const { user } = useSession()
  const { profile: profileRow } = useProfile()
  const [editOpen, setEditOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [reviewsOpen, setReviewsOpen] = useState(false)
  const { tasks: liveTasks, loading: tasksLoading, addNote } = useTasks()
  const store = useTaskStore()

  // Hydrate local editable profile from the Supabase profiles row.
  const walletDisplay = getWalletDisplay(user)
  const defaultName = walletDisplay && walletDisplay.length > 12 ? shortAddress(walletDisplay) : (walletDisplay || '')
  const [profile, setProfile] = useState({
    ...EMPTY_PROFILE,
    name: defaultName,
  })
  useEffect(() => {
    if (!profileRow) return
    setProfile((p) => ({
      ...p,
      name:         profileRow.display_name || defaultName || p.name,
      role:         profileRow.role_label   || p.role,
      bio:          profileRow.bio          || p.bio,
      email:        profileRow.contact_email || p.email,
    }))
  }, [profileRow, defaultName])

  const selfName = profile.name || defaultName || 'You'

  const reviews = useMemo(
    () => store.reviews.filter((r) => r.workerName === selfName),
    [store.reviews, selfName],
  )
  const ratingStats = useMemo(() => {
    if (!reviews.length) return { avg: 0, count: 0 }
    const sum = reviews.reduce((n, r) => n + (r.rating || 0), 0)
    return { avg: sum / reviews.length, count: reviews.length }
  }, [reviews])

  const myStoreTasks = useMemo(
    () => store.tasks.filter((t) => t.talent?.name === selfName),
    [store.tasks, selfName],
  )
  const offers = useMemo(
    () => store.tasks.filter(
      (t) => t.status === 'Open' && !t.talent && !(t.declinedBy || []).includes(selfName),
    ),
    [store.tasks, selfName],
  )

  // Live (Supabase) tasks take precedence; otherwise shared store rows.
  const usingReal   = liveTasks.length > 0
  const tasks       = usingReal ? liveTasks : myStoreTasks
  const taskAddNote = usingReal ? addNote   : (id, body) => taskStore.addNote(id, body, selfName)

  const stats = useMemo(() => buildStats(tasks), [tasks])

  const acceptOffer = async (offer) => {
    taskStore.acceptOffer(offer.id, { name: selfName })
    setTab('tasks')
  }
  const declineOffer = (offer) => taskStore.declineOffer(offer.id, selfName)

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
                <button
                  onClick={() => setReviewsOpen(true)}
                  className="flex items-center gap-1.5 hover:text-white transition group"
                >
                  <Icon path={<path d="M12 17.3l-6.2 3.7 1.6-7.1L2 9.2l7.2-.6L12 2l2.8 6.6 7.2.6-5.4 4.7 1.6 7.1z" />} className="h-4 w-4 text-amber-300" />
                  <span className="text-white font-medium">
                    {ratingStats.count ? ratingStats.avg.toFixed(1) : '—'}
                  </span>
                  <span className="underline-offset-2 group-hover:underline">
                    ({ratingStats.count} review{ratingStats.count !== 1 ? 's' : ''})
                  </span>
                </button>
              </div>
              <div className="mt-3">
                <RoleSwitcher otherRole="hirer" />
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
              ['messages',   'Messages'],
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
                {stats.map((s) => <Stat key={s.label} {...s} />)}
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
                selfName={selfName}
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
              <PayoutTable rows={EMPTY_LIST} />
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
                  selfName={selfName}
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

        {tab === 'messages' && (
          <WorkerMessages
            tasks={tasks}
            offers={offers}
            displayName={selfName}
          />
        )}

        {tab === 'payments' && (
          <>
            <Section title="Balance">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {stats.map((s) => <Stat key={s.label} {...s} />)}
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <button className="btn-primary">Withdraw {fmtUSD(640)}</button>
                <button className="btn-ghost">Set auto-payout</button>
              </div>
            </Section>

            <Section title="Stablecoin wallets" action={<button className="text-sm text-brand-300 hover:text-white">+ Add wallet</button>}>
              <div className="card text-center py-10 text-sm text-white/55">
                <div className="text-white/80">No payout wallets yet.</div>
                <div className="text-xs text-white/45 mt-1">Add a USDC or USDT address to start receiving payouts.</div>
              </div>
            </Section>

            <Section title="Payout history">
              <PayoutTable rows={EMPTY_LIST} dense={false} />
              <p className="mt-3 text-xs text-white/45 text-center">Your completed payouts will appear here.</p>
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

      <ReviewsModal
        open={reviewsOpen}
        workerName={selfName}
        reviews={reviews}
        onClose={() => setReviewsOpen(false)}
      />
    </section>
  )
}
