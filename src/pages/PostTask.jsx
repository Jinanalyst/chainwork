import React, { useEffect, useState } from 'react'
import ConversationalForm from '../components/ConversationalForm.jsx'
import EscrowAddressCard from '../components/EscrowAddressCard.jsx'
import PaymentProofForm from '../components/PaymentProofForm.jsx'
import ProMembershipBadge from '../components/ProMembershipBadge.jsx'
import { PLATFORM_WALLETS, PLATFORM_BANK, ESCROW_RELEASE_NOTE, taskReference, getProMembership } from '../lib/platform.js'
import { matchTalents, inferCategories, pickTargetedWorkers } from '../lib/matching.js'
import { navigate } from '../components/ui.jsx'
import { useTalents } from '../hooks/useTalents.js'
import { supabase } from '../lib/supabase.js'

// Pull the first $ amount out of a free-text budget like "$500-$2,000".
// Returns cents (integer) or null if nothing parseable found.
function parseBudgetCents(text) {
  if (!text) return null
  const m = String(text).replace(/,/g, '').match(/(\d+(?:\.\d+)?)/g)
  if (!m || !m.length) return null
  const n = Number(m[0])
  if (!isFinite(n) || n <= 0) return null
  return Math.round(n * 100)
}

async function createTaskAndFanOutOffers(answers) {
  if (!supabase) return { ok: false, error: 'Supabase not configured' }
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'not-signed-in' }

  const cats = inferCategories(answers?.workType)
  const insertPayload = {
    hirer_id:          user.id,
    title:             (answers?.workType || 'Untitled task').slice(0, 200),
    description:       answers?.workType || null,
    // Hirer's explicit choice wins; fall back to inferring from the brief so
    // the job still lands in a category on the public Jobs board.
    category:          answers?.category || cats[0] || null,
    budget_cents:      parseBudgetCents(answers?.budget),
    budget_currency:   'USD',
    url:               answers?.projectUrl || null,
    status:            'open',
    payment_structure: answers?.paymentStructure || null,
  }
  const { data: task, error: tErr } = await supabase
    .from('tasks')
    .insert(insertPayload)
    .select('id')
    .single()
  if (tErr || !task) {
    console.error('[ChainWork] task insert failed:', tErr)
    return { ok: false, error: tErr?.message || 'insert failed' }
  }

  // Fan out: one offer per category-matched worker.
  const { data: workers, error: wErr } = await supabase
    .from('worker_directory')
    .select('id, skills')
  if (wErr) {
    console.warn('[ChainWork] worker fetch failed (task created, no offers fanned):', wErr)
    return { ok: true, taskId: task.id, offersCreated: 0 }
  }
  const targeted = pickTargetedWorkers(answers, workers || [])
    .filter((w) => w.id && w.id !== user.id)

  if (!targeted.length) return { ok: true, taskId: task.id, offersCreated: 0 }

  const rows = targeted.map((w) => ({
    task_id: task.id,
    worker_id: w.id,
    status: 'pending',
  }))
  const { error: oErr } = await supabase.from('offers').insert(rows)
  if (oErr) {
    console.error('[ChainWork] offers insert failed:', oErr)
    return { ok: true, taskId: task.id, offersCreated: 0, offerError: oErr.message }
  }
  return { ok: true, taskId: task.id, offersCreated: rows.length }
}

import { CATEGORY_LABEL, CATEGORIES } from '../data/categories.jsx'

const initials = (n) =>
  (n || '?').split(/\s+/).map((p) => p[0] || '').slice(0, 2).join('').toUpperCase()

const QUESTIONS = [
  {
    id: 'workType',
    prompt: 'What kind of web work do you need?',
    shortLabel: 'Type of work',
    placeholder: 'A landing page, an AI chatbot, a bug fix…',
    hint: 'Describe it the way you would to a friend.',
  },
  {
    id: 'category',
    prompt: 'Which category best fits this job?',
    shortLabel: 'Category',
    hint: 'This is how workers find your job on the Jobs board.',
    choices: CATEGORIES.map((c) => ({ id: c.id, title: c.title, hint: c.blurb })),
  },
  {
    id: 'projectUrl',
    prompt: 'What is your website or project URL?',
    shortLabel: 'Website / project URL',
    placeholder: 'https://your-site.com',
    type: 'url',
    optional: true,
    hint: "If you don't have one yet, just press Enter.",
  },
  {
    id: 'budget',
    prompt: 'What is your budget?',
    shortLabel: 'Budget',
    placeholder: 'e.g. $500 – $2,000',
    hint: 'A rough range in USDC or USDT helps workers send realistic offers.',
  },
  {
    id: 'paymentStructure',
    prompt: 'How would you like to pay?',
    shortLabel: 'Payment structure',
    hint: 'Both options are held in escrow until you approve the work.',
    choices: [
      {
        id: 'full-on-completion',
        title: 'Full on completion',
        hint: '100% sits in escrow now, released the moment you approve the finished work. Lowest risk — best for short, well-defined tasks.',
      },
      {
        id: 'fifty-fifty',
        title: 'Split 50 / 50',
        hint: '50% released at kickoff, 50% on final approval. Shares risk evenly — good for longer builds or first-time pairings.',
      },
    ],
  },
  {
    id: 'startWhen',
    prompt: 'When do you want to start?',
    shortLabel: 'Start time',
    placeholder: 'This week, next month, flexible…',
  },
  {
    id: 'contact',
    prompt: 'How can freelancers contact you?',
    shortLabel: 'Contact',
    placeholder: 'Email or Telegram',
    hint: "We'll only share this with the worker you accept.",
  },
]

const WarmTalentRow = ({ talent }) => (
  <div className="flex items-center gap-3 rounded-2xl border border-warm-ink/10 bg-white/70 px-4 py-3">
    <div className={`shrink-0 h-11 w-11 rounded-2xl bg-gradient-to-br ${talent.accent} grid place-items-center text-sm font-bold text-ink-950`}>
      {initials(talent.name)}
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="font-semibold text-warm-ink truncate">{talent.name}</span>
        {talent.topRated && (
          <span className="text-[10px] uppercase tracking-wider rounded-full bg-[#1e5be3]/10 text-[#1e5be3] border border-[#1e5be3]/25 px-1.5 py-0.5">
            Top-rated
          </span>
        )}
      </div>
      <div className="text-xs text-warm-ink/65 truncate">{talent.role} · {talent.location}</div>
      <div className="flex flex-wrap gap-1 mt-1">
        {talent.skills.slice(0, 3).map((s) => (
          <span key={s} className="text-[10px] text-warm-ink/70 bg-warm-ink/[0.05] border border-warm-ink/10 rounded-full px-1.5 py-0.5">{s}</span>
        ))}
      </div>
    </div>
    <div className="text-right shrink-0">
      <div className="text-xs text-warm-ink/55">From</div>
      <div className="font-semibold text-warm-ink">${talent.startingPrice}</div>
    </div>
  </div>
)

const MatchedTalents = ({ answers }) => {
  const { talents, loading } = useTalents()
  const matches = matchTalents(answers, talents, { limit: 4 })
  const cats = inferCategories(answers.workType)
  if (loading || matches.length === 0) return null
  return (
    <div className="max-w-xl mx-auto">
      <div className="rounded-2xl border border-warm-ink/10 bg-white/70 backdrop-blur p-5 md:p-6">
        <div className="flex items-center justify-between gap-3 mb-1">
          <h2 className="text-lg font-semibold text-warm-ink">Matched talents</h2>
          <a href="#/talents" className="text-xs text-[#1e5be3] hover:underline">Browse all →</a>
        </div>
        <p className="text-sm text-warm-ink/65">
          Based on your brief{cats.length ? <> · best fit in <span className="text-warm-ink font-medium">{CATEGORY_LABEL[cats[0]] || cats[0]}</span></> : null}
        </p>
        <div className="mt-4 space-y-2.5">
          {matches.map((t) => <WarmTalentRow key={t.id} talent={t} />)}
        </div>
        <button
          onClick={() => navigate('#/talents')}
          className="mt-4 w-full text-center text-xs text-warm-ink/60 hover:text-warm-ink"
        >
          See more talents in this category →
        </button>
      </div>
    </div>
  )
}

const ProCoveredCard = ({ pro }) => (
  <div className="max-w-xl mx-auto">
    <div className="rounded-2xl border border-[#1e5be3]/30 bg-[#1e5be3]/[0.06] p-5 md:p-6">
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1e5be3] text-white px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.15em]">
          Covered by Pro
        </span>
        <code className="font-mono text-xs text-warm-ink/65">{pro.reference}</code>
      </div>
      <h2 className="mt-3 text-lg font-semibold text-warm-ink">No escrow funding needed for this hire.</h2>
      <p className="mt-1 text-sm text-warm-ink/65 leading-relaxed">
        This task counts as <strong className="text-warm-ink">1 of your {pro.hiresIncluded}</strong> ChainWork Pro hires. After this post you'll have{' '}
        <strong className="text-warm-ink">{Math.max(0, pro.hiresRemaining - 1)} hires remaining</strong> until renewal.
      </p>
      <div className="mt-4">
        <ProMembershipBadge variant="warm" />
      </div>
    </div>
  </div>
)

const ProGate = ({ answers, reference }) => {
  const [pro, setPro] = useState(undefined)
  useEffect(() => {
    let cancelled = false
    getProMembership().then((p) => { if (!cancelled) setPro(p) })
    return () => { cancelled = true }
  }, [])

  if (pro === undefined) {
    return <div className="max-w-xl mx-auto text-center text-warm-ink/55 text-sm">Checking membership…</div>
  }
  if (pro && pro.active && pro.hiresRemaining > 0) {
    return <ProCoveredCard pro={pro} />
  }
  return <FundingInstructions answers={answers} reference={reference} />
}

const PaymentMethodTabs = ({ method, onChange }) => {
  const tabs = [
    { id: 'crypto', title: 'Crypto', sub: 'USDC / USDT' },
    { id: 'bank',   title: '한국 계좌', sub: 'KRW · 토스뱅크' },
  ]
  return (
    <div className="grid grid-cols-2 gap-2 rounded-2xl border border-warm-ink/10 bg-white/60 p-1">
      {tabs.map((t) => {
        const active = method === t.id
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            className={
              'rounded-xl px-3 py-2 text-sm text-left transition ' +
              (active
                ? 'bg-[#1e5be3] text-white font-semibold shadow-sm'
                : 'text-warm-ink/75 hover:bg-white')
            }
          >
            {t.title}
            <div className={'text-[10px] mt-0.5 ' + (active ? 'text-white/80' : 'text-warm-ink/50')}>
              {t.sub}
            </div>
          </button>
        )
      })}
    </div>
  )
}

const BankDepositCard = ({ reference }) => {
  const [copied, setCopied] = useState(null) // 'acct' | 'ref' | null
  const copy = async (text, key) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(key)
      setTimeout(() => setCopied(null), 1500)
    } catch {}
  }
  return (
    <div className="rounded-2xl border border-warm-ink/10 bg-white/70 p-4 md:p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="h-10 w-10 rounded-full bg-[#1e5be3]/10 border border-[#1e5be3]/30 grid place-items-center text-[#1e5be3]">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
            <rect x="3" y="7" width="18" height="13" rx="2" />
            <path d="M3 11h18" />
          </svg>
        </div>
        <div>
          <div className="font-semibold text-warm-ink">한국 계좌 이체 (KRW)</div>
          <div className="text-xs text-warm-ink/65">{PLATFORM_BANK.bankName} · {PLATFORM_BANK.bankNameEn}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-y-2 gap-x-3 items-center">
        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-warm-ink/55">계좌번호 · Account number</div>
          <code className="block mt-0.5 text-base font-mono font-semibold text-warm-ink">{PLATFORM_BANK.accountNumber}</code>
        </div>
        <button
          onClick={() => copy(PLATFORM_BANK.accountNumber, 'acct')}
          className="text-xs rounded-full border border-warm-ink/15 hover:border-warm-ink/40 px-3 py-1.5 text-warm-ink"
        >
          {copied === 'acct' ? 'Copied' : 'Copy account'}
        </button>

        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-warm-ink/55">예금주 · Account holder</div>
          <div className="mt-0.5 text-sm text-warm-ink">{PLATFORM_BANK.accountHolder}</div>
        </div>
        <div />

        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-warm-ink/55">송금 메모 · Transfer memo</div>
          <code className="block mt-0.5 text-sm font-mono font-semibold text-[#1e5be3]">{reference}</code>
        </div>
        <button
          onClick={() => copy(reference, 'ref')}
          className="text-xs rounded-full border border-warm-ink/15 hover:border-warm-ink/40 px-3 py-1.5 text-warm-ink"
        >
          {copied === 'ref' ? 'Copied' : 'Copy memo'}
        </button>
      </div>

      <div className="mt-4 rounded-xl border border-amber-300/40 bg-amber-100/60 px-3 py-2 text-xs text-amber-900 leading-relaxed">
        <strong>입금자명에 위 메모 코드를 꼭 포함해 주세요.</strong>
        메모가 없으면 입금 확인이 늦어질 수 있습니다. 입금 확인 후 영업일 기준 24시간 이내에
        에스크로로 처리됩니다.
      </div>
    </div>
  )
}

const FundingInstructions = ({ answers, reference }) => {
  const isSplit = answers?.paymentStructure === 'fifty-fifty'
  const budget = (answers?.budget || '').trim()
  const [method, setMethod] = useState('crypto')

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <div className="rounded-2xl border border-warm-ink/10 bg-white/70 backdrop-blur p-5 md:p-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-8 w-8 rounded-full bg-[#1e5be3]/10 border border-[#1e5be3]/30 grid place-items-center text-[#1e5be3]">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <rect x="4" y="10" width="16" height="10" rx="2" />
              <path d="M8 10V7a4 4 0 0 1 8 0v3" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-warm-ink">Fund the escrow</h2>
        </div>
        <p className="text-sm text-warm-ink/70 leading-relaxed">
          {isSplit
            ? <>Send <strong className="text-warm-ink">50% of your budget{budget && ` (of ${budget})`}</strong> now to start work. The remaining 50% releases on final approval.</>
            : <>Choose how you want to fund <strong className="text-warm-ink">your full budget{budget && ` (${budget})`}</strong>. The funds release to the worker the moment you approve the work.</>}
        </p>
        <p className="mt-2 text-xs text-warm-ink/55">{ESCROW_RELEASE_NOTE}</p>

        <div className="mt-4 rounded-xl bg-[#1e5be3]/10 border border-[#1e5be3]/30 px-4 py-3 text-sm text-warm-ink">
          <div className="text-[10px] uppercase tracking-[0.18em] text-warm-ink/55">Your task reference</div>
          <code className="block mt-0.5 text-base font-mono font-semibold text-[#1e5be3]">{reference}</code>
          <div className="mt-1 text-[11px] text-warm-ink/55">
            Include this code in the transaction memo so we credit the payment to this task.
          </div>
        </div>

        <div className="mt-5">
          <PaymentMethodTabs method={method} onChange={setMethod} />
        </div>

        {method === 'crypto' && (
          <>
            <div className="mt-5 space-y-3">
              {PLATFORM_WALLETS.map((w) => (
                <EscrowAddressCard key={w.id} wallet={w} theme="warm" reference={reference} />
              ))}
            </div>
            <div className="mt-5 rounded-xl border border-amber-300/40 bg-amber-100/60 px-4 py-3 text-xs text-amber-900 leading-relaxed">
              <strong>Double-check the chain.</strong> USDC goes to the Base address. USDT goes to the Tron (TRC20) address. Sending on the wrong network can result in lost funds.
            </div>
          </>
        )}

        {method === 'bank' && (
          <div className="mt-5">
            <BankDepositCard reference={reference} />
          </div>
        )}
      </div>

      {/* Manual on-chain proof submission still applies to the crypto path. */}
      {method === 'crypto' && (
        <PaymentProofForm reference={reference} kind="task" amount={budget} theme="warm" />
      )}
    </div>
  )
}

export default function PostTask() {
  return (
    <ConversationalForm
      eyebrow="Post a task"
      questions={QUESTIONS}
      submitLabel="Post my task"
      successTitle="Your task is live."
      successBody="Send your budget to one of the escrow addresses below to start the work. You'll see offers from trusted workers within a few hours."
      successExtra={(answers) => {
        const reference = taskReference(answers?._taskId || answers?.workType || Date.now())
        return (
          <div className="space-y-8">
            <MatchedTalents answers={answers} />
            <ProGate answers={answers} reference={reference} />
          </div>
        )
      }}
      onSubmit={async (answers) => {
        const res = await createTaskAndFanOutOffers(answers)
        if (!res.ok) {
          if (res.error === 'not-signed-in') {
            console.warn('[ChainWork] task posted without sign-in; not persisted')
          } else {
            console.error('[ChainWork] task post failed:', res.error)
          }
          return
        }
        answers._taskId = res.taskId
        console.log('[ChainWork] task posted:', res.taskId, 'offers fanned:', res.offersCreated)
      }}
    />
  )
}
