import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Icon, navigate } from '../components/ui.jsx'
import ActiveTaskList from '../components/ActiveTaskList.jsx'
import { fmtUSD, parseBudget, workerNet } from '../lib/fees.js'
import { useTaskStore } from '../hooks/useTaskStore.js'
import { taskStore } from '../lib/taskStore.js'
import { useSession, getWalletDisplay, shortAddress } from '../hooks/useSession.js'
import { useProfile } from '../hooks/useProfile.js'
import { isLiveChatReady } from '../lib/liveChat.js'
import LiveChatPanel from '../components/LiveChatPanel.jsx'
import ProMembershipBadge from '../components/ProMembershipBadge.jsx'
import RoleSwitcher from '../components/RoleSwitcher.jsx'
import HirerProfileEditor from '../components/HirerProfileEditor.jsx'

// Shape kept for layout / accent; identity now comes from the signed-in user.
const HIRER = {
  name:    '',
  company: '',
  email:   '',
  accent:  'from-brand-300 to-brand-500',
  joined:  '',
}

// (Mock data kept for reference; the live source is the shared taskStore.)
// eslint-disable-next-line no-unused-vars
const _DEMO_POSTED_TASKS = [
  {
    id: 1,
    title: 'Landing page for SaaS launch',
    category: 'Web Build',
    status: 'In progress',
    employer: { name: HIRER.name, company: HIRER.company, contact: HIRER.email },
    talent:   { name: 'Alex Park' },
    budget: '$950',
    deadline: 'Jun 4, 2026',
    lastActivity: '2h ago',
    progress: 60,
    paymentStructure: 'fifty-fifty',
    description: 'Single-page launch site for our new SaaS product. Hero, feature grid, pricing teaser, FAQ, and an email signup tied to Loops.',
    skills: ['React', 'Tailwind', 'Vercel', 'Figma'],
    url: 'https://northwind.co',
    attachments: [
      { id: 'a1', label: 'Brand guidelines (Figma)', url: 'https://figma.com' },
      { id: 'a2', label: 'Reference landing pages',  url: 'https://stripe.com' },
    ],
    timeline: [
      { id: 't1', label: 'Task posted',          when: 'May 18', by: HIRER.name },
      { id: 't2', label: 'Offer accepted',       when: 'May 19', by: HIRER.name },
      { id: 't3', label: 'Escrow funded',        when: 'May 19', by: 'System' },
      { id: 't4', label: 'Milestone 1 delivered', when: 'May 26', by: 'Alex Park' },
      { id: 't5', label: '50% kickoff approved · first half released', when: 'May 27', by: HIRER.name },
    ],
    notes: [
      { id: 'n1', by: HIRER.name,  when: 'Yesterday', body: 'Hero is looking great — can the CTA be a touch larger on mobile?' },
      { id: 'n2', by: 'Alex Park', when: 'Today',     body: 'Done, bumped to 18px and added more vertical padding. Pushing now.' },
    ],
  },
  {
    id: 2,
    title: 'AI chatbot integration',
    category: 'AI Automation',
    status: 'In escrow',
    employer: { name: HIRER.name, company: HIRER.company, contact: HIRER.email },
    talent:   { name: 'Kenji Tanaka' },
    budget: '$1,800',
    deadline: 'Jun 14, 2026',
    lastActivity: '1d ago',
    progress: 20,
    paymentStructure: 'fifty-fifty',
    description: 'Embed a help chatbot on the product pages. OpenAI + small RAG over the FAQ and product catalog.',
    skills: ['Next.js', 'OpenAI API', 'Edge Functions'],
    url: 'https://northwind.co/help',
    attachments: [{ id: 'a1', label: 'FAQ doc', url: '#' }],
    timeline: [
      { id: 't1', label: 'Task posted',    when: 'May 22', by: HIRER.name },
      { id: 't2', label: 'Offer accepted', when: 'May 23', by: HIRER.name },
      { id: 't3', label: 'Escrow funded',  when: 'May 23', by: 'System' },
      { id: 't4', label: 'Discovery call', when: 'May 24', by: 'Kenji Tanaka' },
    ],
    notes: [],
  },
  {
    id: 3,
    title: 'Domain + email setup',
    category: 'Digital Support',
    status: 'Completed',
    employer: { name: HIRER.name, company: HIRER.company, contact: HIRER.email },
    talent:   { name: 'Sophie Dubois' },
    budget: '$140',
    deadline: 'May 10',
    lastActivity: '12d ago',
    progress: 100,
    paymentStructure: 'full-on-completion',
    description: 'Connect a custom domain and set up branded email + analytics for the marketing site.',
    skills: ['Domain setup', 'DNS', 'Email', 'Analytics'],
    url: 'https://northwind.co',
    attachments: [],
    timeline: [
      { id: 't1', label: 'Task posted',    when: 'May 5', by: HIRER.name },
      { id: 't2', label: 'Offer accepted', when: 'May 5', by: HIRER.name },
      { id: 't3', label: 'Escrow funded',  when: 'May 5', by: 'System' },
      { id: 't4', label: '100% approved · escrow released', when: 'May 10', by: HIRER.name },
    ],
    notes: [],
  },
]

const INITIAL_THREADS = [
  {
    id: 'th1',
    taskId: 1,
    taskTitle: 'Landing page for SaaS launch',
    worker: { name: 'Alex Park', accent: 'from-brand-400 to-accent-400' },
    unread: 0,
    messages: [
      { id: 1, by: 'Alex Park',   byMe: false, when: '2d ago',    body: 'Started on the hero — your Figma assets look great.' },
      { id: 2, by: HIRER.name,    byMe: true,  when: '2d ago',    body: 'Awesome, can you make the CTA larger on mobile?' },
      { id: 3, by: 'Alex Park',   byMe: false, when: 'Yesterday', body: 'Done — bumped to 18px and added more padding.' },
      { id: 4, by: HIRER.name,    byMe: true,  when: 'Yesterday', body: 'Perfect. One more — can the testimonial photo swap for the new one in the brand folder?' },
      { id: 5, by: 'Alex Park',   byMe: false, when: '2h ago',    body: 'Done. Pushing now — should be live in 5 min.' },
    ],
  },
  {
    id: 'th2',
    taskId: 2,
    taskTitle: 'AI chatbot integration',
    worker: { name: 'Kenji Tanaka', accent: 'from-violet-500 to-accent-500' },
    unread: 2,
    messages: [
      { id: 1, by: 'Kenji Tanaka', byMe: false, when: '3d ago', body: 'Thanks for the brief — quick question about the FAQ format. Markdown OK?' },
      { id: 2, by: HIRER.name,     byMe: true,  when: '3d ago', body: 'Yes Markdown is fine. I can also export plain text if easier.' },
      { id: 3, by: 'Kenji Tanaka', byMe: false, when: '1d ago', body: 'Got the RAG pipeline wired. Will share a preview link tomorrow.' },
      { id: 4, by: 'Kenji Tanaka', byMe: false, when: '1d ago', body: 'One thing — do you want streaming responses or full-message?' },
    ],
  },
  {
    id: 'th3',
    taskId: 3,
    taskTitle: 'Domain + email setup',
    worker: { name: 'Sophie Dubois', accent: 'from-brand-300 to-accent-400' },
    unread: 0,
    messages: [
      { id: 1, by: 'Sophie Dubois', byMe: false, when: 'May 9',  body: 'All set! DNS propagated, email working, analytics tracking. Let me know if anything is off.' },
      { id: 2, by: HIRER.name,      byMe: true,  when: 'May 10', body: 'Looks great — approved!' },
    ],
  },
]

// ---------- Helpers ----------

const initials = (n) =>
  (n || '?').split(/\s+/).map((p) => p[0] || '').slice(0, 2).join('').toUpperCase()

const Pill = ({ children, tone = 'default' }) => {
  const tones = {
    default: 'bg-white/[0.05] border-white/10 text-white/70',
    info:    'bg-brand-500/15 border-brand-400/30 text-brand-200',
    ok:      'bg-accent-500/15 border-accent-500/30 text-accent-300',
    warn:    'bg-amber-500/15 border-amber-400/30 text-amber-200',
  }
  return <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] ${tones[tone]}`}>{children}</span>
}

const Stat = ({ label, value, hint, valueClass = 'gradient-text' }) => (
  <div className="card">
    <div className="text-xs uppercase tracking-wider text-white/45">{label}</div>
    <div className={`text-2xl md:text-3xl font-bold mt-1 ${valueClass}`}>{value}</div>
    {hint && <div className="text-[11px] text-white/55 mt-1">{hint}</div>}
  </div>
)

const Section = ({ title, children, action }) => (
  <section className="mb-10">
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-xl font-semibold">{title}</h2>
      {action}
    </div>
    {children}
  </section>
)

// ---------- Messages / chat ----------

const ThreadRow = ({ thread, active, onClick }) => {
  const last = thread.messages[thread.messages.length - 1]
  return (
    <button
      onClick={onClick}
      className={
        'w-full text-left rounded-xl px-3 py-3 transition flex gap-3 items-start ' +
        (active ? 'bg-white/[0.08] border border-white/15' : 'hover:bg-white/[0.04] border border-transparent')
      }
    >
      <div className={`shrink-0 h-9 w-9 rounded-full grid place-items-center text-xs font-bold text-ink-950 bg-gradient-to-br ${thread.worker.accent}`}>
        {initials(thread.worker.name)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium truncate">{thread.worker.name}</span>
          {last && <span className="text-[10px] text-white/45 shrink-0">{last.when}</span>}
        </div>
        <div className="text-[11px] text-white/55 truncate">{thread.taskTitle}</div>
        {last && <div className="text-xs text-white/65 truncate mt-0.5">{last.body}</div>}
      </div>
      {thread.unread > 0 && (
        <span className="ml-1 shrink-0 self-center inline-flex items-center justify-center h-5 min-w-[20px] rounded-full bg-brand-500 text-white text-[10px] font-semibold px-1.5">
          {thread.unread}
        </span>
      )}
    </button>
  )
}

const Bubble = ({ msg }) => {
  const me = msg.byMe
  return (
    <div className={'flex ' + (me ? 'justify-end' : 'justify-start')}>
      <div className={'max-w-[78%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ' +
        (me
          ? 'bg-gradient-to-br from-brand-500 to-brand-700 text-white rounded-br-md'
          : 'bg-white/[0.06] border border-white/10 text-white/90 rounded-bl-md'
        )}>
        {!me && <div className="text-[10px] uppercase tracking-wider text-white/45 mb-1">{msg.by}</div>}
        <div className="whitespace-pre-wrap break-words">{msg.body}</div>
        <div className={'text-[10px] mt-1 ' + (me ? 'text-white/65' : 'text-white/40')}>{msg.when}</div>
      </div>
    </div>
  )
}

const Conversation = ({ thread, onSend, onBack, onOpenTask }) => {
  const [draft, setDraft] = useState('')
  const scrollerRef = useRef(null)

  useEffect(() => {
    if (scrollerRef.current) {
      scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight
    }
  }, [thread?.id, thread?.messages?.length])

  if (!thread) {
    return (
      <div className="card flex items-center justify-center text-sm text-white/55 min-h-[60vh]">
        Select a conversation to start chatting.
      </div>
    )
  }

  const send = () => {
    const v = draft.trim()
    if (!v) return
    onSend(thread.id, v)
    setDraft('')
  }

  return (
    <div className="card !p-0 flex flex-col min-h-[60vh] max-h-[78vh]">
      <div className="px-4 py-3 border-b border-white/10 flex items-center gap-3">
        {onBack && (
          <button onClick={onBack} className="lg:hidden h-8 w-8 grid place-items-center rounded-full text-white/70 hover:text-white hover:bg-white/5">
            <Icon path={<path d="M15 18l-6-6 6-6" />} className="h-4 w-4" />
          </button>
        )}
        <div className={`h-9 w-9 rounded-full grid place-items-center text-xs font-bold text-ink-950 bg-gradient-to-br ${thread.worker.accent}`}>
          {initials(thread.worker.name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-semibold truncate">{thread.worker.name}</div>
          <button
            onClick={() => onOpenTask(thread.taskId)}
            className="text-[11px] text-brand-300 hover:text-white truncate text-left"
          >
            {thread.taskTitle} ↗
          </button>
        </div>
      </div>

      <div ref={scrollerRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {thread.messages.map((m) => <Bubble key={m.id} msg={m} />)}
      </div>

      <div className="px-3 py-3 border-t border-white/10">
        <div className="flex items-end gap-2 rounded-2xl bg-white/[0.04] border border-white/10 px-3 py-2 focus-within:border-brand-300 transition">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
            }}
            rows={1}
            placeholder="Message…"
            className="flex-1 bg-transparent border-0 focus:outline-none text-sm py-1.5 resize-none max-h-32 placeholder:text-white/35"
          />
          <button
            onClick={send}
            disabled={!draft.trim()}
            className="shrink-0 h-9 w-9 rounded-full grid place-items-center bg-brand-500 hover:bg-brand-600 text-white disabled:opacity-40 disabled:cursor-not-allowed transition"
            aria-label="Send"
          >
            <Icon path={<path d="M5 12h14M13 5l7 7-7 7" />} className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-1 text-[10px] text-white/35 text-right">Enter to send · Shift + Enter for new line</div>
      </div>
    </div>
  )
}

const Messages = ({ threads, selectedId, onSelect, onSend, onOpenTask, displayName }) => {
  const selected = threads.find((t) => t.id === selectedId) || threads[0]
  // Mobile-first: when a thread is selected on small screens we hide the list.
  const [mobileView, setMobileView] = useState('list') // 'list' | 'thread'
  const { user } = useSession()
  const live = isLiveChatReady(user)

  return (
    <div className="grid lg:grid-cols-[320px_1fr] gap-4">
      <div className={(mobileView === 'thread' ? 'hidden lg:block ' : 'block ') + 'card !p-3'}>
        <div className="text-xs uppercase tracking-wider text-white/45 px-2 mb-2 flex items-center justify-between">
          <span>Conversations</span>
          {live && (
            <span className="inline-flex items-center gap-1 text-[10px] text-accent-300 normal-case tracking-normal">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-400 animate-pulse" /> Live
            </span>
          )}
        </div>
        <div className="space-y-1">
          {threads.map((t) => (
            <ThreadRow
              key={t.id}
              thread={t}
              active={selected?.id === t.id}
              onClick={() => { onSelect(t.id); setMobileView('thread') }}
            />
          ))}
        </div>
      </div>
      <div className={mobileView === 'list' ? 'hidden lg:block' : 'block'}>
        {live && selected ? (
          <LiveChatPanel
            taskId={selected.taskId}
            role="hirer"
            displayName={displayName}
            title={selected.worker?.name || 'Conversation'}
            subtitle={selected.taskTitle}
          />
        ) : (
          <Conversation
            thread={selected}
            onSend={onSend}
            onBack={() => setMobileView('list')}
            onOpenTask={onOpenTask}
          />
        )}
      </div>
    </div>
  )
}

// ---------- Page ----------

export default function HirerDashboard() {
  const [tab, setTab] = useState('overview')
  const store = useTaskStore()
  const { user } = useSession()
  const { profile: profileRow, update: updateProfileRow } = useProfile()

  // Editable profile mirror — hydrated from the Supabase row when it loads.
  const walletDisplay = getWalletDisplay(user)
  const defaultName = walletDisplay && walletDisplay.length > 12 ? shortAddress(walletDisplay) : (walletDisplay || '')
  const [profile, setProfile] = useState({
    name: '', company: '', role: '', location: '', email: '', bio: '', websiteUrl: '',
    socials: { twitter: '', linkedin: '', website: '' },
  })
  const [editOpen, setEditOpen] = useState(false)
  useEffect(() => {
    setProfile((p) => ({
      ...p,
      name:       profileRow?.display_name  || defaultName || p.name,
      company:    profileRow?.company       || p.company,
      role:       profileRow?.title         || p.role,
      location:   profileRow?.location      || p.location,
      email:      profileRow?.contact_email || p.email,
      bio:        profileRow?.bio           || p.bio,
      websiteUrl: profileRow?.portfolio_url || p.websiteUrl,
      socials: {
        twitter:  profileRow?.socials?.twitter  || p.socials.twitter,
        linkedin: profileRow?.socials?.linkedin || p.socials.linkedin,
        website:  profileRow?.socials?.website  || p.socials.website,
      },
    }))
  }, [profileRow, defaultName])

  const selfName    = profile.name || defaultName || ''
  const selfCompany = profile.company || ''
  const selfEmail   = profile.email || ''

  const saveProfile = async (next) => {
    setProfile(next)
    const patch = {
      display_name:  next.name?.trim()       || null,
      company:       next.company?.trim()    || null,
      title:         next.role?.trim()       || null,
      location:      next.location?.trim()   || null,
      contact_email: next.email?.trim()      || null,
      bio:           next.bio?.trim()        || null,
      portfolio_url: next.websiteUrl?.trim() || null,
      socials:       next.socials || {},
    }
    const res = await updateProfileRow(patch)
    if (!res.ok) alert('Could not save profile: ' + (res.error || 'unknown'))
  }

  const tasks = useMemo(
    () => store.tasks.filter((t) => t.employer?.name === selfName),
    [store.tasks, selfName],
  )
  const threads = useMemo(
    () => store.threads.filter((t) => t.participants?.hirer === selfName),
    [store.threads, selfName],
  )

  const [selectedThread, setSelectedThread] = useState(null)
  const effectiveSelectedThread = selectedThread || threads[0]?.id

  const adaptedThreads = useMemo(
    () => threads.map((t) => ({
      ...t,
      worker: { name: t.participants?.worker, accent: t.workerAccent },
      messages: t.messages.map((m) => ({
        id: m.id,
        by: m.from,
        byMe: m.from === selfName,
        when: m.when,
        body: m.body,
      })),
    })),
    [threads, selfName],
  )

  const sendMessage = (threadId, body) => taskStore.sendMessage(threadId, body, selfName)

  const openTaskFromMessage = (taskId) => {
    setTab('tasks')
    // ActiveTaskList opens its own modal; the user can click "Open" from the card.
  }

  // ---- Stats ----
  const stats = useMemo(() => {
    const active     = tasks.filter((t) => t.status !== 'Completed')
    const completed  = tasks.filter((t) => t.status === 'Completed')
    const inEscrow   = active.reduce((sum, t) => sum + parseBudget(t.budget), 0)
    const totalSpent = completed.reduce((sum, t) => sum + parseBudget(t.budget), 0)
    return {
      activeCount:    active.length,
      completedCount: completed.length,
      inEscrow,
      totalSpent,
    }
  }, [tasks])

  const totalUnread = threads.reduce((n, t) => n + (t.unread || 0), 0)

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
            <div className={`h-20 w-20 rounded-2xl bg-gradient-to-br ${HIRER.accent} grid place-items-center text-2xl font-bold text-ink-950 shrink-0`}>
              {initials(selfName || '?')}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-bold">{selfName || 'Your account'}</h1>
                <Pill tone="info">Hirer</Pill>
                {selfCompany && <Pill>{selfCompany}</Pill>}
              </div>
              {(profile.role || profile.location) && (
                <div className="mt-1 text-white/70">
                  {profile.role || '—'}{profile.location && <span> · {profile.location}</span>}
                </div>
              )}
              {profile.bio && <p className="mt-2 text-sm text-white/60 max-w-2xl">{profile.bio}</p>}
              <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-white/60">
                {selfEmail && (
                  <a href={`mailto:${selfEmail}`} className="hover:text-white transition inline-flex items-center gap-1.5">
                    <Icon path={<><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></>} className="h-3.5 w-3.5" />
                    {selfEmail}
                  </a>
                )}
                <span>{stats.activeCount} active · {stats.completedCount} completed</span>
              </div>
              {(profile.websiteUrl || profile.socials?.twitter || profile.socials?.linkedin || profile.socials?.website) && (
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                  {profile.websiteUrl && (
                    <a href={profile.websiteUrl.startsWith('http') ? profile.websiteUrl : `https://${profile.websiteUrl}`} target="_blank" rel="noreferrer"
                       className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.04] border border-white/10 hover:border-white/25 px-2.5 py-1 text-white/80">
                      <Icon path={<><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></>} className="h-3 w-3" />
                      Website
                    </a>
                  )}
                  {Object.entries(profile.socials || {}).filter(([, v]) => v).map(([k, v]) => (
                    <a key={k} href={v.startsWith('http') ? v : `https://${v}`} target="_blank" rel="noreferrer"
                       className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.04] border border-white/10 hover:border-white/25 px-2.5 py-1 text-white/80 capitalize">
                      {k}
                    </a>
                  ))}
                </div>
              )}
              <div className="mt-3">
                <RoleSwitcher otherRole="worker" />
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => setEditOpen(true)} className="btn-ghost">
                <Icon path={<><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4z" /></>} className="h-4 w-4" />
                Edit profile
              </button>
              <button onClick={() => navigate('#/talents')} className="btn-ghost">Browse talents</button>
              <button onClick={() => navigate('#/post-task')} className="btn-primary">
                <Icon path={<path d="M12 5v14M5 12h14" />} className="h-4 w-4" />
                Post a task
              </button>
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div className="mb-8 border-b border-white/10 overflow-x-auto">
          <div className="flex gap-1 min-w-max">
            {[
              ['overview', 'Overview'],
              ['tasks',    'My tasks'],
              ['messages', `Messages${totalUnread ? ` (${totalUnread})` : ''}`],
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

        {tab === 'overview' && (
          <>
            <Section title="Spend overview">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Stat label="Active tasks"  value={stats.activeCount}    hint="Currently in flight" valueClass="text-white" />
                <Stat label="In escrow"     value={fmtUSD(stats.inEscrow)} hint="Locked across active tasks" />
                <Stat label="Completed"     value={stats.completedCount} hint="All-time" valueClass="text-white" />
                <Stat label="Total spent"   value={fmtUSD(stats.totalSpent)} hint="Paid out to workers" />
              </div>
            </Section>

            <Section title="Membership">
              <ProMembershipBadge />
            </Section>

            <Section
              title="Active tasks"
              action={<button onClick={() => setTab('tasks')} className="text-sm text-brand-300 hover:text-white">View all →</button>}
            >
              <ActiveTaskList
                tasks={tasks.filter((t) => t.status !== 'Completed')}
                limit={3}
                columns="md:grid-cols-2 lg:grid-cols-3"
                selfName={selfName}
                onAddNote={(id, body) => { taskStore.addNote(id, body, selfName); return { ok: true } }}
                onApproveMilestone={taskStore.approveMilestone}
                onRequestAdjustment={taskStore.requestAdjustment}
                viewerRole="hirer"
              />
            </Section>

            <Section
              title="Recent messages"
              action={<button onClick={() => setTab('messages')} className="text-sm text-brand-300 hover:text-white">Open inbox →</button>}
            >
              <div className="card !p-3 space-y-1">
                {adaptedThreads.slice(0, 3).map((t) => (
                  <ThreadRow
                    key={t.id}
                    thread={t}
                    onClick={() => { setSelectedThread(t.id); setTab('messages') }}
                  />
                ))}
                {adaptedThreads.length === 0 && (
                  <div className="text-sm text-white/55 px-3 py-6 text-center">
                    No messages yet — once a worker accepts an offer, a chat opens here.
                  </div>
                )}
              </div>
            </Section>
          </>
        )}

        {tab === 'tasks' && (
          <Section
            title="My tasks"
            action={<button onClick={() => navigate('#/post-task')} className="text-sm text-brand-300 hover:text-white">+ Post another</button>}
          >
            <ActiveTaskList
              tasks={tasks}
              columns="md:grid-cols-2"
              selfName={selfName}
              onAddNote={(id, body) => { taskStore.addNote(id, body, selfName); return { ok: true } }}
              onUpdateProgress={taskStore.updateProgress}
              onApproveMilestone={taskStore.approveMilestone}
              onRequestAdjustment={taskStore.requestAdjustment}
            />
          </Section>
        )}

        {tab === 'messages' && (
          <Section
            title="Messages"
            action={<span className="text-xs text-white/45">{adaptedThreads.length} conversation{adaptedThreads.length !== 1 ? 's' : ''}</span>}
          >
            {adaptedThreads.length === 0 ? (
              <div className="card text-center py-12">
                <div className="text-white/70">No conversations yet.</div>
                <div className="text-xs text-white/45 mt-1">A chat opens once a worker accepts one of your tasks.</div>
              </div>
            ) : (
              <Messages
                threads={adaptedThreads}
                selectedId={effectiveSelectedThread}
                onSelect={setSelectedThread}
                onSend={sendMessage}
                onOpenTask={openTaskFromMessage}
                displayName={selfName}
              />
            )}
          </Section>
        )}
      </div>

      <HirerProfileEditor
        open={editOpen}
        initial={profile}
        onClose={() => setEditOpen(false)}
        onSave={saveProfile}
      />
    </section>
  )
}
