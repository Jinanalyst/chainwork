import React, { useEffect, useMemo, useState } from 'react'
import ConversationalForm from '../components/ConversationalForm.jsx'
import EscrowAddressCard from '../components/EscrowAddressCard.jsx'
import PaymentProofForm from '../components/PaymentProofForm.jsx'
import NowPaymentsCheckoutButton from '../components/NowPaymentsCheckoutButton.jsx'
import { PLATFORM_WALLETS, PLATFORM_BANK, ESCROW_RELEASE_NOTE, taskReference, getEmployerSubscription } from '../lib/platform.js'
import { matchTalents, inferCategories, pickTargetedWorkers } from '../lib/matching.js'
import { navigate } from '../components/ui.jsx'
import { useTalents } from '../hooks/useTalents.js'
import { useSession } from '../hooks/useSession.js'
import { supabase } from '../lib/supabase.js'
import { useT } from '../i18n/index.jsx'

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

import { useCategories, useCategoryLabel } from '../data/categories.jsx'

const initials = (n) =>
  (n || '?').split(/\s+/).map((p) => p[0] || '').slice(0, 2).join('').toUpperCase()

// Build the question set with localized copy. Category choices are injected
// separately at render time with the localized category list.
const buildQuestions = (t) => [
  {
    id: 'workType',
    prompt: t('postTask.questions.workType.prompt'),
    shortLabel: t('postTask.questions.workType.shortLabel'),
    placeholder: t('postTask.questions.workType.placeholder'),
    hint: t('postTask.questions.workType.hint'),
  },
  {
    id: 'category',
    prompt: t('postTask.questions.category.prompt'),
    shortLabel: t('postTask.questions.category.shortLabel'),
    hint: t('postTask.questions.category.hint'),
    // choices are injected at render time with localized category labels
  },
  {
    id: 'projectUrl',
    prompt: t('postTask.questions.projectUrl.prompt'),
    shortLabel: t('postTask.questions.projectUrl.shortLabel'),
    placeholder: t('postTask.questions.projectUrl.placeholder'),
    type: 'url',
    optional: true,
    hint: t('postTask.questions.projectUrl.hint'),
  },
  {
    id: 'budget',
    prompt: t('postTask.questions.budget.prompt'),
    shortLabel: t('postTask.questions.budget.shortLabel'),
    placeholder: t('postTask.questions.budget.placeholder'),
    hint: t('postTask.questions.budget.hint'),
  },
  {
    id: 'paymentStructure',
    prompt: t('postTask.questions.paymentStructure.prompt'),
    shortLabel: t('postTask.questions.paymentStructure.shortLabel'),
    hint: t('postTask.questions.paymentStructure.hint'),
    choices: [
      {
        id: 'full-on-completion',
        title: t('postTask.questions.paymentStructure.full.title'),
        hint: t('postTask.questions.paymentStructure.full.hint'),
      },
      {
        id: 'fifty-fifty',
        title: t('postTask.questions.paymentStructure.split.title'),
        hint: t('postTask.questions.paymentStructure.split.hint'),
      },
    ],
  },
  {
    id: 'startWhen',
    prompt: t('postTask.questions.startWhen.prompt'),
    shortLabel: t('postTask.questions.startWhen.shortLabel'),
    placeholder: t('postTask.questions.startWhen.placeholder'),
  },
  {
    id: 'contact',
    prompt: t('postTask.questions.contact.prompt'),
    shortLabel: t('postTask.questions.contact.shortLabel'),
    placeholder: t('postTask.questions.contact.placeholder'),
    hint: t('postTask.questions.contact.hint'),
  },
]

const WarmTalentRow = ({ talent }) => {
  const { t } = useT()
  return (
  <div className="flex items-center gap-3 rounded-2xl border border-warm-ink/10 bg-white/70 px-4 py-3">
    <div className={`shrink-0 h-11 w-11 rounded-2xl bg-gradient-to-br ${talent.accent} grid place-items-center text-sm font-bold text-ink-950`}>
      {initials(talent.name)}
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="font-semibold text-warm-ink truncate">{talent.name}</span>
        {talent.topRated && (
          <span className="text-[10px] uppercase tracking-wider rounded-full bg-[#1e5be3]/10 text-[#1e5be3] border border-[#1e5be3]/25 px-1.5 py-0.5">
            {t('postTask.matched.topRated')}
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
      <div className="text-xs text-warm-ink/55">{t('postTask.matched.from')}</div>
      <div className="font-semibold text-warm-ink">${talent.startingPrice}</div>
    </div>
  </div>
  )
}

const MatchedTalents = ({ answers }) => {
  const { t } = useT()
  const { talents, loading } = useTalents()
  const CATEGORY_LABEL = useCategoryLabel()
  const matches = matchTalents(answers, talents, { limit: 4 })
  const cats = inferCategories(answers.workType)
  if (loading || matches.length === 0) return null
  return (
    <div className="max-w-xl mx-auto">
      <div className="rounded-2xl border border-warm-ink/10 bg-white/70 backdrop-blur p-5 md:p-6">
        <div className="flex items-center justify-between gap-3 mb-1">
          <h2 className="text-lg font-semibold text-warm-ink">{t('postTask.matched.title')}</h2>
          <a href="#/talents" className="text-xs text-[#1e5be3] hover:underline">{t('postTask.matched.browseAll')}</a>
        </div>
        <p className="text-sm text-warm-ink/65">
          {t('postTask.matched.basedOn')}{cats.length ? <> · {t('postTask.matched.bestFitIn')} <span className="text-warm-ink font-medium">{CATEGORY_LABEL[cats[0]] || cats[0]}</span></> : null}
        </p>
        <div className="mt-4 space-y-2.5">
          {matches.map((tal) => <WarmTalentRow key={tal.id} talent={tal} />)}
        </div>
        <button
          onClick={() => navigate('#/talents')}
          className="mt-4 w-full text-center text-xs text-warm-ink/60 hover:text-warm-ink"
        >
          {t('postTask.matched.seeMore')}
        </button>
      </div>
    </div>
  )
}


const PaymentMethodTabs = ({ method, onChange }) => {
  const { t } = useT()
  // KRW bank transfer is paused while domestic regulation + PG approval are
  // pending, so escrow is funded with USDC/USDT (NowPayments-compatible) only.
  const tabs = [
    { id: 'crypto', title: t('postTask.funding.tabCrypto'), sub: t('postTask.funding.tabCryptoSub') },
  ]
  return (
    <div className="grid grid-cols-1 gap-2 rounded-2xl border border-warm-ink/10 bg-white/60 p-1">
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
  const { t } = useT()
  const isSplit = answers?.paymentStructure === 'fifty-fifty'
  const budget = (answers?.budget || '').trim()
  const [method, setMethod] = useState('crypto')

  // The funded amount is rendered bold inside the sentence; split the
  // localized template on a sentinel so word order works in any language.
  const amountText = isSplit
    ? (budget ? t('postTask.funding.splitAmountOf', { budget }) : t('postTask.funding.splitAmount'))
    : (budget ? t('postTask.funding.fullAmountOf', { budget }) : t('postTask.funding.fullAmount'))
  const SENTINEL = '@@AMT@@'
  const bodyTemplate = isSplit
    ? t('postTask.funding.splitBody', { half: SENTINEL })
    : t('postTask.funding.fullBody', { amount: SENTINEL })
  const [bodyBefore, bodyAfter] = bodyTemplate.split(SENTINEL)

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
          <h2 className="text-lg font-semibold text-warm-ink">{t('postTask.funding.title')}</h2>
        </div>
        <p className="text-sm text-warm-ink/70 leading-relaxed">
          {bodyBefore}<strong className="text-warm-ink">{amountText}</strong>{bodyAfter}
        </p>
        <p className="mt-2 text-xs text-warm-ink/55">{ESCROW_RELEASE_NOTE}</p>

        <div className="mt-4 rounded-xl bg-[#1e5be3]/10 border border-[#1e5be3]/30 px-4 py-3 text-sm text-warm-ink">
          <div className="text-[10px] uppercase tracking-[0.18em] text-warm-ink/55">{t('postTask.funding.reference')}</div>
          <code className="block mt-0.5 text-base font-mono font-semibold text-[#1e5be3]">{reference}</code>
          <div className="mt-1 text-[11px] text-warm-ink/55">
            {t('postTask.funding.referenceNote')}
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
              <strong>{t('postTask.funding.chainWarnTitle')}</strong> {t('postTask.funding.chainWarnBody')}
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

// Full-page "Become Verified Employer" wall shown when the signed-in user has
// no active subscription. Doubles as the payment page: it embeds the
// NOWPayments checkout button so the employer can pay (990,000 KRW / USDT BEP20)
// right here. Once the IPN webhook activates their subscription, the gate in
// PostTask opens and they reach the job form.
const VerifiedEmployerWall = () => {
  const { t } = useT()
  const { user } = useSession()
  const benefits = t('postTask.wall.benefits')
  const body = t('postTask.wall.body', { price: t('postTask.wall.price') })
  return (
    <div className="min-h-screen bg-cream text-warm-ink relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-24 h-[36rem] w-[36rem] rounded-full bg-warm-peach opacity-60 blur-3xl" />
        <div className="absolute -bottom-32 -right-24 h-[36rem] w-[36rem] rounded-full bg-warm-blush opacity-50 blur-3xl" />
      </div>
      <div className="relative mx-auto max-w-xl px-6 py-20">
        <button onClick={() => navigate('#/')} className="text-sm text-warm-ink/55 hover:text-warm-ink">{t('postTask.wall.back')}</button>
        <div className="mt-6 rounded-3xl border border-warm-ink/10 bg-white/70 backdrop-blur p-7 md:p-9">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1e5be3]/15 text-[#1e5be3] px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.15em]">
            {t('postTask.wall.badge')}
          </span>
          <h1 className="mt-4 text-2xl md:text-3xl font-bold text-warm-ink">{t('postTask.wall.title')}</h1>
          <p className="mt-2 text-sm text-warm-ink/70 leading-relaxed">
            {body}
          </p>
          <ul className="mt-5 space-y-2 text-sm text-warm-ink/80">
            {(Array.isArray(benefits) ? benefits : []).map((b) => (
              <li key={b} className="flex items-start gap-2">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-[#1e5be3] shrink-0 mt-0.5"><path d="M5 12l5 5L20 7" /></svg>
                <span>{b}</span>
              </li>
            ))}
          </ul>
          {/* The actual payment affordance: pay the subscription right here. */}
          <div className="mt-7">
            <NowPaymentsCheckoutButton userId={user?.id} />
          </div>
          <div className="mt-4 text-center">
            <a href="#/pricing" className="text-sm text-warm-ink/55 hover:text-warm-ink underline">{t('postTask.wall.seePricing')}</a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PostTask() {
  const { t } = useT()
  const categories = useCategories()
  const questions = useMemo(
    () =>
      buildQuestions(t).map((q) =>
        q.id === 'category'
          ? { ...q, choices: categories.map((c) => ({ id: c.id, title: c.title, hint: c.blurb })) }
          : q,
      ),
    [categories, t],
  )

  // Hard gate: an active Verified Employer subscription is required to post.
  // Unpaid users get the payment wall (VerifiedEmployerWall) instead of the form.
  const [sub, setSub] = useState(undefined)
  useEffect(() => {
    let cancelled = false
    // Guard against a hung auth/RPC call: if the check doesn't settle within a
    // few seconds, stop showing "Checking…" and fall through to the payment
    // wall (the safe default — the user can still pay there).
    const timeout = new Promise((resolve) => setTimeout(() => resolve({ active: false }), 6000))
    Promise.race([getEmployerSubscription(), timeout])
      .then((s) => { if (!cancelled) setSub(s) })
      .catch((e) => {
        console.warn('[PostTask] subscription check failed:', e?.message || e)
        if (!cancelled) setSub({ active: false })
      })
    return () => { cancelled = true }
  }, [])

  if (sub === undefined) {
    return (
      <div className="min-h-screen bg-cream text-warm-ink grid place-items-center text-sm text-warm-ink/55">
        {t('postTask.checkingSub')}
      </div>
    )
  }
  if (!sub || !sub.active) {
    return <VerifiedEmployerWall />
  }

  return (
    <ConversationalForm
      eyebrow={t('postTask.eyebrow')}
      questions={questions}
      submitLabel={t('postTask.submit')}
      successTitle={t('postTask.successTitle')}
      successBody={t('postTask.successBody')}
      successExtra={(answers) => {
        const reference = taskReference(answers?._taskId || answers?.workType || Date.now())
        return (
          <div className="space-y-8">
            <MatchedTalents answers={answers} />
            <FundingInstructions answers={answers} reference={reference} />
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
