/**
 * Tiny in-memory store shared between the hirer and worker dashboards.
 *
 * For the MVP this lives in module state with a subscribe/notify pattern
 * so changes from one dashboard surface instantly in the other (within
 * the same tab). When you wire Supabase, replace seed data + actions
 * with `.from(...).select(...)` and `.insert(...)` — keep the same shape
 * and the UI doesn't change.
 */

const SEED_TASKS = [
  // ---------- Active tasks (talent assigned) ----------
  {
    id: 1,
    title: 'Landing page for SaaS launch',
    category: 'Web Build',
    status: 'In progress',
    employer: { name: 'Sara Chen', company: 'Northwind Co.', contact: 'sara@northwind.co' },
    talent:   { name: 'Alex Park' },
    budget: '$950',
    deadline: 'Jun 4, 2026',
    lastActivity: '2h ago',
    progress: 60,
    paymentStructure: 'fifty-fifty',
    description: 'Single-page launch site for our new SaaS product. Hero, feature grid, pricing teaser, FAQ, and an email signup tied to Loops. Brand assets ready in Figma.',
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
      { id: 't4', label: 'Milestone 1 delivered', when: 'May 26', by: 'Alex Park' },
      { id: 't5', label: '50% kickoff approved · first half released', when: 'May 27', by: 'Sara Chen' },
    ],
    notes: [
      { id: 'n1', by: 'Sara Chen', when: 'Yesterday', body: 'Hero is looking great — can the CTA be a touch larger on mobile?' },
      { id: 'n2', by: 'Alex Park', when: 'Today',     body: 'Done, bumped to 18px and added more vertical padding. Pushing now.' },
    ],
  },
  {
    id: 2,
    title: 'AI chatbot integration',
    category: 'AI Automation',
    status: 'In escrow',
    employer: { name: 'Sara Chen', company: 'Northwind Co.', contact: 'sara@northwind.co' },
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
      { id: 't1', label: 'Task posted',    when: 'May 22', by: 'Sara Chen' },
      { id: 't2', label: 'Offer accepted', when: 'May 23', by: 'Sara Chen' },
      { id: 't3', label: 'Escrow funded',  when: 'May 23', by: 'System' },
      { id: 't4', label: 'Discovery call', when: 'May 24', by: 'Kenji Tanaka' },
    ],
    notes: [],
  },
  {
    id: 3,
    title: 'Fix Vercel deploy + auth bug',
    category: 'Web Fix',
    status: 'Awaiting review',
    employer: { name: 'Sara Chen', company: 'Northwind Co.', contact: 'sara@northwind.co' },
    talent:   { name: 'Alex Park' },
    budget: '$280',
    deadline: 'Today',
    lastActivity: '20m ago',
    progress: 90,
    paymentStructure: 'full-on-completion',
    description: 'Vercel build is failing on the auth route after a Next.js upgrade. Also need to fix a session loop that signs users out on refresh.',
    skills: ['Next.js', 'Auth', 'Vercel'],
    url: 'https://northwind.co/app',
    attachments: [{ id: 'a1', label: 'Build logs', url: '#' }],
    timeline: [
      { id: 't1', label: 'Task posted',                when: 'May 26', by: 'Sara Chen' },
      { id: 't2', label: 'Offer accepted',             when: 'May 26', by: 'Sara Chen' },
      { id: 't3', label: 'Escrow funded',              when: 'May 26', by: 'System' },
      { id: 't4', label: 'Fix submitted for review',   when: '20m ago', by: 'Alex Park' },
    ],
    notes: [
      { id: 'n1', by: 'Alex Park', when: '20m ago', body: 'Pushed a fix — build is green, sessions persist on refresh. Ready for review.' },
    ],
  },
  // ---------- Completed ----------
  {
    id: 4,
    title: 'Domain + email setup',
    category: 'Digital Support',
    status: 'Completed',
    employer: { name: 'Sara Chen', company: 'Northwind Co.', contact: 'sara@northwind.co' },
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
      { id: 't1', label: 'Task posted',    when: 'May 5',  by: 'Sara Chen' },
      { id: 't2', label: 'Offer accepted', when: 'May 5',  by: 'Sara Chen' },
      { id: 't3', label: 'Escrow funded',  when: 'May 5',  by: 'System' },
      { id: 't4', label: '100% approved · escrow released', when: 'May 10', by: 'Sara Chen' },
    ],
    notes: [],
  },
  // ---------- Open offers (no talent yet — visible to workers) ----------
  {
    id: 5,
    title: 'Token landing page redesign',
    category: 'Web3 Work',
    status: 'Open',
    employer: { name: 'Sara Chen', company: 'Northwind Co.', contact: 'sara@northwind.co' },
    talent:   null,
    budget: '$1,200',
    deadline: 'Jun 20, 2026',
    lastActivity: '2d ago',
    progress: 0,
    paymentStructure: 'fifty-fifty',
    description: 'Refresh our token landing page: hero with wallet connect, tokenomics block, roadmap, FAQ. Branding assets attached.',
    skills: ['React', 'Wagmi', 'Tailwind', 'WalletConnect'],
    url: 'https://northwind.co/token',
    attachments: [{ id: 'a1', label: 'Brand kit', url: '#' }],
    timeline: [
      { id: 't1', label: 'Task posted', when: '2 days ago', by: 'Sara Chen' },
    ],
    notes: [],
    postedAgo: '2 days ago',
    candidates: 4,
  },
  {
    id: 6,
    title: 'AI summary widget for news pages',
    category: 'AI Web Automation',
    status: 'Open',
    employer: { name: 'Sara Chen', company: 'Northwind Co.', contact: 'sara@northwind.co' },
    talent:   null,
    budget: '$600',
    deadline: 'Jun 12, 2026',
    lastActivity: '4h ago',
    progress: 0,
    paymentStructure: 'full-on-completion',
    description: 'Add an OpenAI-powered "summarize this article" widget to our news pages. Streaming response in a small drawer.',
    skills: ['Next.js', 'OpenAI API', 'Edge Functions'],
    url: 'https://northwind.co/news',
    attachments: [],
    timeline: [
      { id: 't1', label: 'Task posted', when: '4h ago', by: 'Sara Chen' },
    ],
    notes: [],
    postedAgo: '4 hours ago',
    candidates: 2,
  },
]

const SEED_THREADS = [
  {
    id: 'th1', taskId: 1, taskTitle: 'Landing page for SaaS launch',
    participants: { hirer: 'Sara Chen', worker: 'Alex Park' },
    workerAccent: 'from-brand-400 to-accent-400',
    hirerAccent:  'from-brand-300 to-brand-500',
    unread: 0,
    messages: [
      { id: 1, from: 'Alex Park',  when: '2d ago',    body: 'Started on the hero — your Figma assets look great.' },
      { id: 2, from: 'Sara Chen',  when: '2d ago',    body: 'Awesome, can you make the CTA larger on mobile?' },
      { id: 3, from: 'Alex Park',  when: 'Yesterday', body: 'Done — bumped to 18px and added more padding.' },
      { id: 4, from: 'Sara Chen',  when: 'Yesterday', body: 'Perfect. One more — can the testimonial photo swap for the new one in the brand folder?' },
      { id: 5, from: 'Alex Park',  when: '2h ago',    body: 'Done. Pushing now — should be live in 5 min.' },
    ],
  },
  {
    id: 'th2', taskId: 2, taskTitle: 'AI chatbot integration',
    participants: { hirer: 'Sara Chen', worker: 'Kenji Tanaka' },
    workerAccent: 'from-violet-500 to-accent-500',
    hirerAccent:  'from-brand-300 to-brand-500',
    unread: 2,
    messages: [
      { id: 1, from: 'Kenji Tanaka', when: '3d ago', body: 'Thanks for the brief — quick question about the FAQ format. Markdown OK?' },
      { id: 2, from: 'Sara Chen',    when: '3d ago', body: 'Yes Markdown is fine. I can also export plain text if easier.' },
      { id: 3, from: 'Kenji Tanaka', when: '1d ago', body: 'Got the RAG pipeline wired. Will share a preview link tomorrow.' },
      { id: 4, from: 'Kenji Tanaka', when: '1d ago', body: 'One thing — do you want streaming responses or full-message?' },
    ],
  },
  {
    id: 'th3', taskId: 3, taskTitle: 'Fix Vercel deploy + auth bug',
    participants: { hirer: 'Sara Chen', worker: 'Alex Park' },
    workerAccent: 'from-brand-400 to-accent-400',
    hirerAccent:  'from-brand-300 to-brand-500',
    unread: 1,
    messages: [
      { id: 1, from: 'Sara Chen', when: 'May 26',  body: 'Repo invite sent. Holler if you hit anything weird.' },
      { id: 2, from: 'Alex Park', when: '20m ago', body: 'Pushed a fix — build is green, sessions persist on refresh. Ready for review.' },
    ],
  },
]

let state = { tasks: SEED_TASKS, threads: SEED_THREADS }
const listeners = new Set()
const notify = () => listeners.forEach((fn) => fn())
const update = (updater) => { state = updater(state); notify() }
const uid = (prefix = 'id') => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`

const WORKER_ACCENTS = ['from-brand-400 to-accent-400', 'from-violet-500 to-accent-500', 'from-amber-400 to-rose-500', 'from-emerald-400 to-accent-600']
const accentFor = (name) => {
  const i = (name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) % WORKER_ACCENTS.length
  return WORKER_ACCENTS[i]
}

export const taskStore = {
  getState: () => state,
  subscribe: (fn) => { listeners.add(fn); return () => listeners.delete(fn) },

  // ---------- Queries ----------
  offers: () => state.tasks.filter((t) => t.status === 'Open' && !t.talent),
  tasksForWorker: (name) => state.tasks.filter((t) => t.talent?.name === name),
  tasksForHirer:  (name) => state.tasks.filter((t) => t.employer?.name === name),
  threadsForUser: (name) => state.threads.filter(
    (t) => t.participants?.hirer === name || t.participants?.worker === name,
  ),

  // ---------- Mutations ----------
  acceptOffer: (taskId, worker) => update((s) => {
    const task = s.tasks.find((t) => t.id === taskId)
    if (!task) return s
    const accent = accentFor(worker.name)
    const updatedTask = {
      ...task,
      talent: { name: worker.name },
      status: 'In escrow',
      lastActivity: 'just now',
      timeline: [
        ...(task.timeline || []),
        { id: uid('tl'), label: 'Offer accepted', when: 'just now', by: worker.name },
        { id: uid('tl'), label: 'Escrow funded',  when: 'just now', by: 'System' },
      ],
    }
    const newThread = {
      id: uid('th'),
      taskId,
      taskTitle: task.title,
      participants: { hirer: task.employer?.name, worker: worker.name },
      workerAccent: accent,
      hirerAccent:  'from-brand-300 to-brand-500',
      unread: 0,
      messages: [
        { id: uid('m'), from: worker.name, when: 'just now',
          body: `Hi ${task.employer?.name?.split(' ')[0] || 'there'} — accepted! Excited to get started. I'll send a kickoff plan shortly.` },
      ],
    }
    return {
      ...s,
      tasks:   s.tasks.map((t) => t.id === taskId ? updatedTask : t),
      threads: [...s.threads, newThread],
    }
  }),

  declineOffer: (taskId, workerName) => update((s) => ({
    ...s,
    // For MVP, declining just hides the offer for that worker. We tag it in
    // a per-task `declinedBy` array so the worker filter can skip it.
    tasks: s.tasks.map((t) => t.id === taskId
      ? { ...t, declinedBy: [...(t.declinedBy || []), workerName] }
      : t),
  })),

  updateProgress: (taskId, value) => update((s) => ({
    ...s,
    tasks: s.tasks.map((t) => t.id === taskId
      ? { ...t, progress: Math.max(0, Math.min(100, Number(value) || 0)), lastActivity: 'just now' }
      : t),
  })),

  approveMilestone: (taskId) => update((s) => ({
    ...s,
    tasks: s.tasks.map((t) => {
      if (t.id !== taskId) return t
      const isSplit = t.paymentStructure === 'fifty-fifty'
      const cur = t.progress ?? 0
      let nextProgress = 100
      let nextStatus   = 'Completed'
      let label        = isSplit ? 'Final 50% approved · escrow released' : '100% approved · escrow released'
      if (isSplit && cur < 50) {
        nextProgress = Math.max(50, cur)
        nextStatus   = 'In progress'
        label        = '50% kickoff approved · first half released'
      }
      return {
        ...t,
        progress: nextProgress,
        status: nextStatus,
        lastActivity: 'just now',
        timeline: [...(t.timeline || []), {
          id: uid('tl'), label, when: 'just now', by: t.employer?.name || 'Hirer',
        }],
      }
    }),
  })),

  requestAdjustment: (taskId, note) => update((s) => ({
    ...s,
    tasks: s.tasks.map((t) => {
      if (t.id !== taskId) return t
      return {
        ...t,
        status: t.status === 'Completed' ? t.status : 'In progress',
        lastActivity: 'just now',
        timeline: [...(t.timeline || []), {
          id: uid('tl'), label: 'Adjustment requested', when: 'just now',
          by: t.employer?.name || 'Hirer', adjustment: true, note,
        }],
      }
    }),
  })),

  addNote: (taskId, body, authorName) => update((s) => ({
    ...s,
    tasks: s.tasks.map((t) => t.id !== taskId ? t : {
      ...t,
      notes: [...(t.notes || []), { id: uid('n'), by: authorName, when: 'just now', body }],
    }),
  })),

  sendMessage: (threadId, body, from) => update((s) => ({
    ...s,
    threads: s.threads.map((th) => th.id !== threadId ? th : {
      ...th,
      // Sender's own send marks the thread read (other party "saw" it implicitly).
      unread: 0,
      messages: [...th.messages, { id: uid('m'), from, when: 'just now', body }],
    }),
  })),

  markThreadRead: (threadId) => update((s) => ({
    ...s,
    threads: s.threads.map((th) => th.id === threadId ? { ...th, unread: 0 } : th),
  })),
}
