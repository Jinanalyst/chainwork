import React, { useEffect, useState } from 'react'
import { Icon } from './ui.jsx'
import EscrowAddressCard from './EscrowAddressCard.jsx'
import { PLATFORM_WALLETS, ESCROW_RELEASE_NOTE } from '../lib/platform.js'
import { PLATFORM_FEE_RATE, platformFee, workerNet, fmtUSD, parseBudget } from '../lib/fees.js'

const uid = () =>
  (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : `id_${Math.random().toString(36).slice(2)}_${Date.now()}`

const STATUS_TONE = {
  'In escrow':       'info',
  'In progress':     'default',
  'Awaiting review': 'warn',
  'Completed':       'ok',
  'Disputed':        'rose',
}

const PAYMENT_STRUCTURE_LABEL = {
  'full-on-completion': 'Full on completion',
  'fifty-fifty':        'Split 50 / 50',
}
const PAYMENT_STRUCTURE_SHORT = {
  'full-on-completion': 'Full',
  'fifty-fifty':        '50 / 50',
}

/**
 * Whether each release milestone has already been paid out, plus the
 * gross USD slice and the worker's net after the platform fee.
 */
const releaseStepsFor = (task) => {
  const reached = (...statuses) => statuses.includes(task.status)
  const totalGross = parseBudget(task.budget)

  if (task.paymentStructure === 'fifty-fifty') {
    const half = Math.round((totalGross / 2) * 100) / 100
    return [
      { label: '50% at kickoff',  gross: half,        released: reached('In progress', 'Awaiting review', 'Completed') },
      { label: '50% on approval', gross: totalGross - half, released: reached('Completed') },
    ]
  }
  return [
    { label: '100% on approval', gross: totalGross, released: reached('Completed') },
  ]
}

const initials = (name) => (name || '?').split(/\s+/).map((p) => p[0] || '').slice(0, 2).join('').toUpperCase()

const Pill = ({ tone = 'default', children, className = '' }) => {
  const tones = {
    default: 'bg-white/[0.05] border-white/10 text-white/75',
    info:    'bg-brand-500/15 border-brand-400/30 text-brand-200',
    ok:      'bg-accent-500/15 border-accent-500/30 text-accent-300',
    warn:    'bg-amber-500/15 border-amber-400/30 text-amber-200',
    rose:    'bg-rose-500/15 border-rose-400/30 text-rose-200',
  }
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] ${tones[tone]} ${className}`}>
      {children}
    </span>
  )
}

const Avatar = ({ name, size = 'h-7 w-7', accent = 'from-brand-400 to-accent-400' }) => (
  <div className={`shrink-0 ${size} rounded-full bg-gradient-to-br ${accent} grid place-items-center text-[11px] font-bold text-ink-950`}>
    {initials(name)}
  </div>
)

// ---------- Card ----------

const TaskCard = ({ task, onOpen, onMessage }) => (
  <div className="card flex flex-col gap-4">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <Pill tone="info">{task.category}</Pill>
          <Pill tone={STATUS_TONE[task.status] || 'default'}>{task.status}</Pill>
        </div>
        <h3 className="mt-2 font-semibold leading-tight">{task.title}</h3>
      </div>
      <div className="text-right shrink-0">
        <div className="text-lg font-bold">{task.budget}</div>
        <div className="text-[11px] text-white/45">Budget</div>
        {task.paymentStructure && (
          <div className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-white/[0.04] border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-white/65">
            <Icon path={<><path d="M12 2v20M5 12h14" /></>} className="h-3 w-3" />
            {PAYMENT_STRUCTURE_SHORT[task.paymentStructure] || task.paymentStructure}
          </div>
        )}
      </div>
    </div>

    <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
      <Row label="Employer">
        <span className="flex items-center gap-2 min-w-0">
          <Avatar name={task.employer?.name} size="h-6 w-6" accent="from-brand-300 to-brand-500" />
          <span className="truncate">{task.employer?.name}{task.employer?.company && <span className="text-white/55"> · {task.employer.company}</span>}</span>
        </span>
      </Row>
      <Row label="Talent">
        <span className="flex items-center gap-2 min-w-0">
          <Avatar name={task.talent?.name} size="h-6 w-6" accent="from-accent-400 to-brand-400" />
          <span className="truncate">{task.talent?.name}</span>
        </span>
      </Row>
      <Row label="Deadline"><span className="text-white/85">{task.deadline}</span></Row>
      <Row label="Last activity"><span className="text-white/65">{task.lastActivity}</span></Row>
    </dl>

    {typeof task.progress === 'number' && (
      <div>
        <div className="flex justify-between text-[11px] text-white/55 mb-1">
          <span>Progress</span><span>{task.progress}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-brand-400 to-accent-400" style={{ width: `${task.progress}%` }} />
        </div>
      </div>
    )}

    <div className="flex gap-2">
      <button onClick={onOpen} className="btn-primary !py-2 !px-4 text-sm">
        Open
        <Icon path={<path d="M5 12h14M13 5l7 7-7 7" />} className="h-4 w-4" />
      </button>
      <button onClick={onMessage} className="btn-ghost !py-2 !px-4 text-sm">
        <Icon path={<><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z" /></>} className="h-4 w-4" />
        Message
      </button>
    </div>
  </div>
)

const Row = ({ label, children }) => (
  <div className="min-w-0">
    <div className="text-[10px] uppercase tracking-wider text-white/40">{label}</div>
    <div className="mt-0.5 truncate">{children}</div>
  </div>
)

// ---------- Detail modal ----------

const TaskDetailModal = ({ task, viewerRole = 'hirer', onClose, onAddNote, onMessage, onUpdateProgress, onSubmitForReview, onApproveMilestone, onRequestAdjustment }) => {
  const [draft, setDraft] = useState('')
  const [adjOpen, setAdjOpen] = useState(false)
  const [adjDraft, setAdjDraft] = useState('')

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const submitNote = () => {
    if (!draft.trim()) return
    onAddNote(task.id, draft.trim())
    setDraft('')
  }

  const submitAdjustment = () => {
    if (!adjDraft.trim()) return
    onRequestAdjustment?.(task.id, adjDraft.trim())
    setAdjDraft('')
    setAdjOpen(false)
  }

  const approve = () => onApproveMilestone?.(task.id)
  const isCompleted = task.status === 'Completed'

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-ink-950/85 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full sm:max-w-3xl max-h-[94vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border border-white/10 bg-ink-900 shadow-glow">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-ink-900/95 backdrop-blur px-6 py-4 border-b border-white/5 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Pill tone="info">{task.category}</Pill>
              <Pill tone={STATUS_TONE[task.status] || 'default'}>{task.status}</Pill>
            </div>
            <h2 className="mt-2 text-xl font-semibold leading-tight">{task.title}</h2>
          </div>
          <button onClick={onClose} className="h-8 w-8 grid place-items-center rounded-full text-white/60 hover:text-white hover:bg-white/5 shrink-0">
            <Icon path={<path d="M6 6l12 12M18 6l-12 12" />} className="h-4 w-4" />
          </button>
        </div>

        {/* Quick facts */}
        <div className="p-6 grid sm:grid-cols-2 gap-4">
          <Fact label="Budget"   value={task.budget} />
          <Fact label="Deadline" value={task.deadline} />
          <Fact label="URL"      value={task.url ? <a href={task.url} target="_blank" rel="noreferrer" className="text-brand-300 hover:text-white underline-offset-2 hover:underline break-all">{task.url.replace(/^https?:\/\//, '')}</a> : '—'} />
          <Fact label="Last activity" value={task.lastActivity} />
        </div>

        {/* Description */}
        <Section title="Description">
          <p className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap">
            {task.description || <span className="text-white/40">No description provided.</span>}
          </p>
        </Section>

        {/* Role-specific controls */}
        <Section title={viewerRole === 'worker' ? 'Your progress' : "Worker's progress · approval"}>
          <TaskControls
            task={task}
            viewerRole={viewerRole}
            onProgress={(v) => onUpdateProgress?.(task.id, v)}
            onSubmit={() => onSubmitForReview?.(task.id)}
            onApprove={approve}
            onRequestAdjustment={() => setAdjOpen((v) => !v)}
            adjOpen={adjOpen}
            adjDraft={adjDraft}
            setAdjDraft={setAdjDraft}
            submitAdjustment={submitAdjustment}
            cancelAdjustment={() => { setAdjOpen(false); setAdjDraft('') }}
          />
        </Section>

        {/* Payment structure */}
        {task.paymentStructure && (
          <Section title="Payment structure">
            <PaymentStructure task={task} />
          </Section>
        )}

        {/* Escrow — platform addresses for the hirer to fund into */}
        <Section title="Escrow">
          <EscrowPanel task={task} />
        </Section>

        {/* Skills */}
        {task.skills?.length > 0 && (
          <Section title="Required skills">
            <div className="flex flex-wrap gap-1.5">
              {task.skills.map((s) => (
                <span key={s} className="text-[11px] text-white/85 bg-white/[0.04] border border-white/10 rounded-full px-2.5 py-1">
                  {s}
                </span>
              ))}
            </div>
          </Section>
        )}

        {/* People */}
        <Section title="People">
          <div className="grid sm:grid-cols-2 gap-3">
            <PersonCard role="Employer" person={task.employer} accent="from-brand-300 to-brand-500" />
            <PersonCard role="Talent"   person={task.talent}   accent="from-accent-400 to-brand-400" />
          </div>
        </Section>

        {/* Attachments */}
        {task.attachments?.length > 0 && (
          <Section title="Attachments &amp; references">
            <ul className="space-y-1.5">
              {task.attachments.map((a) => (
                <li key={a.id}>
                  <a
                    href={a.url || '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-brand-300 hover:text-white"
                  >
                    <Icon path={<><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" /></>} className="h-4 w-4" />
                    {a.label}
                  </a>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Timeline */}
        <Section title="Status timeline">
          <ol className="relative pl-5">
            <div className="absolute left-1.5 top-1 bottom-1 w-px bg-white/10" />
            {(task.timeline || []).map((t, i) => {
              const isLast = i === task.timeline.length - 1
              const isAdj  = !!t.adjustment
              const isApprove = /approved/i.test(t.label)
              return (
                <li key={t.id || i} className="relative pb-4 last:pb-0">
                  <span className={
                    'absolute -left-[10px] top-1 h-3 w-3 rounded-full ring-4 ring-ink-900 ' +
                    (isAdj
                      ? 'bg-amber-400'
                      : isApprove
                        ? 'bg-accent-500'
                        : isLast
                          ? 'bg-gradient-to-br from-brand-400 to-accent-400'
                          : 'bg-white/30')
                  } />
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-white/85">{t.label}</span>
                    {isAdj && <Pill tone="warn">Adjustment</Pill>}
                    {isApprove && <Pill tone="ok">Approved</Pill>}
                  </div>
                  <div className="text-[11px] text-white/45">
                    {t.when}{t.by && <span> · {t.by}</span>}
                  </div>
                  {isAdj && t.note && (
                    <div className="mt-1.5 rounded-lg border border-amber-400/25 bg-amber-500/[0.06] px-3 py-2 text-xs text-amber-100 leading-relaxed">
                      {t.note}
                    </div>
                  )}
                </li>
              )
            })}
          </ol>
        </Section>

        {/* Notes */}
        <Section title="Notes">
          <div className="space-y-3">
            {(task.notes || []).map((n) => (
              <div key={n.id} className="flex gap-3">
                <Avatar name={n.by} size="h-8 w-8" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-medium">{n.by}</span>
                    <span className="text-[11px] text-white/45">{n.when}</span>
                  </div>
                  <p className="text-sm text-white/80 leading-relaxed mt-0.5 whitespace-pre-wrap">{n.body}</p>
                </div>
              </div>
            ))}
            {(!task.notes || task.notes.length === 0) && (
              <div className="text-sm text-white/45">No notes yet.</div>
            )}
            <div className="mt-3">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); submitNote() } }}
                rows={2}
                placeholder="Add a note…"
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/35 focus:outline-none focus:border-brand-300 transition resize-y min-h-[60px]"
              />
              <div className="mt-2 flex items-center justify-between">
                <span className="text-[11px] text-white/40">Tip: ⌘/Ctrl + Enter to submit</span>
                <button
                  onClick={submitNote}
                  disabled={!draft.trim()}
                  className="btn-primary !py-1.5 !px-3 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Post note
                </button>
              </div>
            </div>
          </div>
        </Section>

        <div className="sticky bottom-0 bg-ink-900/95 backdrop-blur px-6 py-4 border-t border-white/5 flex items-center justify-end gap-2">
          <button onClick={onClose} className="btn-ghost !py-2 !px-4 text-sm">Close</button>
          <button onClick={() => onMessage(task)} className="btn-primary !py-2 !px-4 text-sm">
            Message {task.employer?.name?.split(' ')[0] || 'employer'}
          </button>
        </div>
      </div>
    </div>
  )
}

const Section = ({ title, children }) => (
  <div className="px-6 py-5 border-t border-white/5">
    <div className="text-[11px] uppercase tracking-wider text-white/45 mb-3">{title}</div>
    {children}
  </div>
)

const EscrowPanel = ({ task }) => {
  const isCompleted     = task.status === 'Completed'
  const awaitingPayout  = task.status === 'Awaiting review'
  const isOpen          = task.status === 'Open' || task.status === 'In escrow'

  return (
    <div>
      <div className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 mb-4">
        <div className="flex items-start gap-3">
          <div className={
            'h-8 w-8 rounded-full grid place-items-center shrink-0 ' +
            (isCompleted
              ? 'bg-accent-500/15 border border-accent-500/40 text-accent-300'
              : awaitingPayout
                ? 'bg-amber-500/15 border border-amber-400/40 text-amber-200'
                : 'bg-brand-500/15 border border-brand-400/40 text-brand-200')
          }>
            <Icon
              path={isCompleted
                ? <path d="M5 12l5 5L20 7" />
                : <><rect x="4" y="10" width="16" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>}
              className="h-4 w-4"
            />
          </div>
          <div className="text-sm">
            <div className="font-medium text-white/90">
              {isCompleted
                ? `Released to worker's wallet`
                : awaitingPayout
                  ? 'Worker delivered — payout pending approval'
                  : 'Held in escrow by ChainWork'}
            </div>
            <div className="text-white/55 mt-0.5">
              {isCompleted
                ? 'Payout was sent manually within 24h of approval.'
                : awaitingPayout
                  ? 'Approve in the timeline above to release the next milestone.'
                  : ESCROW_RELEASE_NOTE}
            </div>
          </div>
        </div>
      </div>

      {isOpen && (
        <>
          <div className="text-[11px] uppercase tracking-wider text-white/45 mb-2">
            Platform escrow addresses
          </div>
          <p className="text-xs text-white/55 mb-3">
            Hirer: send <span className="text-white">{task.budget}</span> to one of these to fund the work. <strong>USDC → Base</strong>, <strong>USDT → Tron (TRC20)</strong>.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            {PLATFORM_WALLETS.map((w) => (
              <EscrowAddressCard key={w.id} wallet={w} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

const PaymentStructure = ({ task }) => {
  const steps        = releaseStepsFor(task)
  const releasedCount = steps.filter((s) => s.released).length
  const percent      = Math.round((releasedCount / steps.length) * 100)
  const label        = PAYMENT_STRUCTURE_LABEL[task.paymentStructure] || task.paymentStructure
  const totalGross   = parseBudget(task.budget)
  const totalNet     = workerNet(totalGross)

  return (
    <div>
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Icon path={<><path d="M12 2v20M5 12h14" /></>} className="h-4 w-4 text-accent-400" />
          <div className="font-medium">{label}</div>
        </div>
        <div className="text-xs text-white/55">
          Released <span className="text-white font-semibold">{percent}%</span>
          <span className="text-white/35"> of </span>
          <span className="text-white">{fmtUSD(totalGross)}</span>
          <span className="text-white/30"> · </span>
          <span className="text-accent-300">{fmtUSD(totalNet)} to worker</span>
        </div>
      </div>

      <div className="flex gap-1.5">
        {steps.map((s, i) => {
          const fee = platformFee(s.gross)
          const net = workerNet(s.gross)
          return (
            <div
              key={i}
              className={
                'flex-1 rounded-md px-3 py-2.5 text-[11px] border ' +
                (s.released
                  ? 'bg-accent-500/15 border-accent-500/40 text-accent-200'
                  : 'bg-white/[0.03] border-white/10 text-white/65')
              }
            >
              <div className="flex items-center gap-1.5">
                {s.released ? (
                  <Icon path={<path d="M5 12l4 4 10-10" />} className="h-3 w-3" />
                ) : (
                  <span className="h-2 w-2 rounded-full bg-white/30" />
                )}
                <span className="font-medium">{s.label}</span>
              </div>
              <div className="mt-1.5 text-sm font-semibold text-white">
                {fmtUSD(net)} <span className="text-[10px] font-normal text-white/55">to worker</span>
              </div>
              <div className="mt-0.5 text-[10px] text-white/45">
                {fmtUSD(s.gross)} gross · {fmtUSD(fee)} fee
              </div>
              <div className="mt-1 text-[10px] uppercase tracking-wider opacity-75">
                {s.released ? 'Released' : 'Pending'}
              </div>
            </div>
          )
        })}
      </div>

      <p className="mt-3 text-xs text-white/55 leading-relaxed">
        {task.paymentStructure === 'fifty-fifty'
          ? 'Half of the budget releases when work kicks off; the rest is held in escrow until approval.'
          : 'The full budget is held in escrow and releases the moment you approve the work.'}
        <span className="text-white/40"> ChainWork takes a {Math.round(PLATFORM_FEE_RATE * 100)}% platform fee on each release.</span>
      </p>
    </div>
  )
}

const Fact = ({ label, value }) => (
  <div className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
    <div className="text-[11px] uppercase tracking-wider text-white/45">{label}</div>
    <div className="mt-1 text-base text-white/95">{value || <span className="text-white/35">—</span>}</div>
  </div>
)

/**
 * Role-aware controls. The hirer owns approvals + adjustment requests;
 * the worker owns progress reporting and submitting for review.
 */
const TaskControls = (props) => {
  return props.viewerRole === 'worker'
    ? <WorkerControls {...props} />
    : <HirerControls  {...props} />
}

const ProgressBar = ({ progress, isSplit, label, dim }) => (
  <div>
    <div className="flex items-center justify-between mb-2">
      <div className="text-xs text-white/55">{label}</div>
      <div className="text-sm font-semibold tabular-nums">{progress}%</div>
    </div>
    <div className="relative h-3 rounded-full bg-white/10 overflow-hidden">
      <div
        className={'absolute inset-y-0 left-0 bg-gradient-to-r from-brand-400 to-accent-400 transition-all ' + (dim ? 'opacity-80' : '')}
        style={{ width: `${progress}%` }}
      />
      {isSplit && (
        <div className="absolute top-0 bottom-0 w-px bg-white/30" style={{ left: '50%' }} title="50% milestone" />
      )}
    </div>
  </div>
)

const WorkerControls = ({ task, onProgress, onSubmit }) => {
  const isCompleted    = task.status === 'Completed'
  const awaitingReview = task.status === 'Awaiting review'
  const isSplit        = task.paymentStructure === 'fifty-fifty'
  const progress       = task.progress ?? 0
  const readyMilestone = isSplit
    ? (progress >= 50 ? (progress >= 100 ? 'final delivery' : 'kickoff milestone') : null)
    : (progress >= 100 ? 'final delivery' : null)

  return (
    <div className="space-y-4">
      <div>
        <ProgressBar progress={progress} isSplit={isSplit} label="Your reported progress" />
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={progress}
          onChange={(e) => onProgress?.(Number(e.target.value))}
          disabled={isCompleted}
          className="w-full mt-2 accent-brand-400 disabled:opacity-40 disabled:cursor-not-allowed"
        />
        <div className="flex items-center justify-between text-[11px] text-white/45">
          <span>Drag to update — your hirer sees this live</span>
          {isSplit && <span>Tick at 50% marks the kickoff milestone</span>}
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
        {isCompleted ? (
          <div className="text-sm text-accent-200 flex items-center gap-2">
            <Icon path={<path d="M5 12l4 4 10-10" />} className="h-4 w-4" />
            Hirer approved — the final payout has been released to your wallet.
          </div>
        ) : awaitingReview ? (
          <div className="text-sm text-amber-100 flex items-center gap-2">
            <Icon path={<><circle cx="12" cy="12" r="9" /><path d="M12 8v4M12 16h.01" /></>} className="h-4 w-4 text-amber-300" />
            Submitted for review — waiting for {task.employer?.name || 'the hirer'} to approve.
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={onSubmit}
                disabled={!readyMilestone}
                className="btn-primary !py-2 !px-4 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                title={readyMilestone ? '' : 'Move the slider to a milestone to submit'}
              >
                <Icon path={<path d="M5 12l5 5L20 7" />} className="h-4 w-4" />
                Submit for review
              </button>
              <span className="text-[11px] text-white/45 self-center">
                {readyMilestone
                  ? `Ready: ${readyMilestone}.`
                  : isSplit
                    ? 'Reach 50% (kickoff) or 100% (final) to submit.'
                    : 'Reach 100% to submit.'}
              </span>
            </div>
            <p className="mt-3 text-[11px] text-white/45 leading-relaxed">
              Only the hirer can approve a milestone and release the payout. Submitting puts the task into <span className="text-white/70">Awaiting review</span> on their dashboard.
            </p>
          </>
        )}
      </div>
    </div>
  )
}

const HirerControls = ({
  task,
  onProgress,
  onApprove,
  onRequestAdjustment,
  adjOpen,
  adjDraft,
  setAdjDraft,
  submitAdjustment,
  cancelAdjustment,
}) => {
  const isCompleted    = task.status === 'Completed'
  const awaitingReview = task.status === 'Awaiting review'
  const isSplit        = task.paymentStructure === 'fifty-fifty'
  const progress       = task.progress ?? 0
  const nextMilestoneLabel =
    isCompleted ? null :
    (isSplit && progress < 50) ? 'Approve 50% kickoff' :
    isSplit                    ? 'Approve final 50%'  :
                                 'Approve & release 100%'

  // Can the hirer meaningfully approve right now?
  const canApprove =
    !isCompleted && (
      awaitingReview ||
      (isSplit && progress >= 50) ||
      progress >= 100
    )

  return (
    <div className="space-y-4">
      <div>
        <ProgressBar progress={progress} isSplit={isSplit} label={`Worker reports · status: ${task.status}`} dim={!awaitingReview} />
        <div className="mt-2 flex items-center justify-between text-[11px] text-white/45">
          <span>{task.talent?.name ? `${task.talent.name}'s progress` : 'Worker progress'} · last activity {task.lastActivity}</span>
          {isSplit && <span>Tick at 50% marks the kickoff milestone</span>}
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
        {isCompleted ? (
          <div className="text-sm text-accent-200 flex items-center gap-2">
            <Icon path={<path d="M5 12l4 4 10-10" />} className="h-4 w-4" />
            Task completed — final payout has been released.
          </div>
        ) : (
          <>
            {awaitingReview && (
              <div className="mb-3 rounded-lg border border-amber-400/25 bg-amber-500/[0.06] px-3 py-2 text-sm text-amber-100 flex items-center gap-2">
                <Icon path={<path d="M12 8v4M12 16h.01" />} className="h-4 w-4 text-amber-300" />
                <span>
                  {task.talent?.name || 'Worker'} submitted for review. Approve to release the next payout, or request adjustments.
                </span>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={onApprove}
                disabled={!canApprove}
                className="btn-primary !py-2 !px-4 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                title={canApprove ? '' : 'No milestone ready to approve yet'}
              >
                <Icon path={<path d="M5 12l4 4 10-10" />} className="h-4 w-4" />
                {nextMilestoneLabel}
              </button>
              <button
                onClick={onRequestAdjustment}
                className={
                  'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold border transition ' +
                  (adjOpen
                    ? 'bg-amber-500/20 border-amber-400/40 text-amber-100'
                    : 'bg-white/[0.04] border-white/15 text-white/85 hover:bg-white/[0.08] hover:border-white/30')
                }
              >
                <Icon path={<><circle cx="12" cy="12" r="9" /><path d="M12 8v4M12 16h.01" /></>} className="h-4 w-4" />
                {adjOpen ? 'Cancel adjustment' : 'Request adjustment'}
              </button>
            </div>

            {adjOpen && (
              <div className="mt-4 rounded-lg border border-amber-400/25 bg-amber-500/[0.04] p-3">
                <div className="text-xs text-amber-100/90 mb-2">
                  What needs to change? The worker will see this in the timeline.
                </div>
                <textarea
                  value={adjDraft}
                  onChange={(e) => setAdjDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                      e.preventDefault(); submitAdjustment()
                    }
                  }}
                  rows={2}
                  autoFocus
                  placeholder="e.g. Hero CTA needs to be bigger on mobile. Also swap the testimonial photo."
                  className="w-full rounded-lg bg-white/[0.04] border border-white/10 px-3 py-2 text-sm focus:outline-none focus:border-amber-400/50 transition resize-y min-h-[64px]"
                />
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[11px] text-white/40">⌘/Ctrl + Enter to send</span>
                  <div className="flex gap-2">
                    <button onClick={cancelAdjustment} className="btn-ghost !py-1.5 !px-3 text-xs">Cancel</button>
                    <button
                      onClick={submitAdjustment}
                      disabled={!adjDraft.trim()}
                      className="inline-flex items-center gap-1.5 rounded-full bg-amber-500 hover:bg-amber-400 text-ink-950 font-semibold px-3 py-1.5 text-xs disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      Send to worker
                      <Icon path={<path d="M5 12h14M13 5l7 7-7 7" />} className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            <p className="mt-3 text-[11px] text-white/45 leading-relaxed">
              Only you can approve — approving releases the next milestone payout from escrow. Adjustments add a note to the timeline and keep the funds locked.
            </p>
          </>
        )}
      </div>
    </div>
  )
}

const PersonCard = ({ role, person, accent }) => (
  <div className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 flex items-center gap-3">
    <Avatar name={person?.name} size="h-10 w-10" accent={accent} />
    <div className="min-w-0">
      <div className="text-[11px] uppercase tracking-wider text-white/45">{role}</div>
      <div className="font-medium truncate">{person?.name || '—'}</div>
      {(person?.company || person?.contact) && (
        <div className="text-xs text-white/55 truncate">
          {[person.company, person.contact].filter(Boolean).join(' · ')}
        </div>
      )}
    </div>
  </div>
)

// ---------- Public component ----------

export default function ActiveTaskList({
  tasks,
  limit,
  columns = 'md:grid-cols-2 lg:grid-cols-3',
  onAddNote,             // async (taskId, body) => { ok, error }
  onUpdateProgress,      // (taskId, value) => void  — worker action
  onSubmitForReview,     // (taskId) => void          — worker action
  onApproveMilestone,    // (taskId) => void          — hirer action
  onRequestAdjustment,   // (taskId, note) => void    — hirer action
  selfName,              // name to attribute optimistic notes to
  viewerRole = 'hirer',  // 'hirer' | 'worker' — controls which actions show
}) {
  const [items, setItems] = useState(tasks)
  const [openId, setOpenId] = useState(null)

  // keep in sync if parent updates
  useEffect(() => { setItems(tasks) }, [tasks])

  const open = items.find((t) => t.id === openId)
  const shown = typeof limit === 'number' ? items.slice(0, limit) : items

  const addNote = async (taskId, body) => {
    // Optimistic insert — replaced on next refresh from realtime
    const tmpId = 'tmp_' + Date.now()
    setItems((prev) => prev.map((t) => t.id === taskId
      ? { ...t, notes: [...(t.notes || []), { id: tmpId, by: selfName || t.talent?.name || 'You', when: 'just now', body }] }
      : t))
    if (onAddNote) {
      const res = await onAddNote(taskId, body)
      if (res && res.ok === false) {
        // Roll back on failure
        setItems((prev) => prev.map((t) => t.id === taskId
          ? { ...t, notes: (t.notes || []).filter((n) => n.id !== tmpId) }
          : t))
      }
    }
  }

  const updateProgress = (taskId, value) => {
    const v = Math.max(0, Math.min(100, Number(value) || 0))
    if (onUpdateProgress) { onUpdateProgress(taskId, v); return }
    setItems((prev) => prev.map((t) => t.id === taskId
      ? { ...t, progress: v, lastActivity: 'just now' }
      : t))
  }

  const approveMilestone = (taskId) => {
    if (onApproveMilestone) { onApproveMilestone(taskId); return }
    setItems((prev) => prev.map((t) => {
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
        progress:     nextProgress,
        status:       nextStatus,
        lastActivity: 'just now',
        timeline: [...(t.timeline || []), {
          id: 'tl_' + Date.now(),
          label,
          when: 'just now',
          by:   t.employer?.name || 'Hirer',
        }],
      }
    }))
  }

  const requestAdjustment = (taskId, note) => {
    if (onRequestAdjustment) { onRequestAdjustment(taskId, note); return }
    setItems((prev) => prev.map((t) => {
      if (t.id !== taskId) return t
      // Hold the next milestone — pull status back to "In progress" so the
      // worker knows there's something to act on.
      const nextStatus = t.status === 'Completed' ? t.status : 'In progress'
      return {
        ...t,
        status:       nextStatus,
        lastActivity: 'just now',
        timeline: [...(t.timeline || []), {
          id: 'tl_' + Date.now(),
          label: 'Adjustment requested',
          when:  'just now',
          by:    t.employer?.name || 'Hirer',
          adjustment: true,
          note,
        }],
      }
    }))
  }

  const message = (task) => {
    // wire to your messaging route when ready
    console.log('[ChainWork] open thread for', task.id)
  }

  return (
    <>
      <div className={`grid ${columns} gap-4`}>
        {shown.map((t) => (
          <TaskCard
            key={t.id}
            task={t}
            onOpen={() => setOpenId(t.id)}
            onMessage={() => message(t)}
          />
        ))}
      </div>
      {open && (
        <TaskDetailModal
          task={open}
          viewerRole={viewerRole}
          onClose={() => setOpenId(null)}
          onAddNote={addNote}
          onMessage={message}
          onUpdateProgress={updateProgress}
          onSubmitForReview={onSubmitForReview}
          onApproveMilestone={approveMilestone}
          onRequestAdjustment={requestAdjustment}
        />
      )}
    </>
  )
}
