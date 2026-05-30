import React, { useEffect, useRef, useState } from 'react'
import { Icon, LogoMark, Wordmark, navigate } from './ui.jsx'
import { useT } from '../i18n/index.jsx'

/**
 * A soft, conversational onboarding flow.
 * Shows one underlined question at a time with an inline arrow button.
 * After all answers, renders a summary card + submit.
 */
export default function ConversationalForm({
  eyebrow,
  questions,
  successTitle = 'All set.',
  successBody  = "Thanks — we'll take it from here.",
  successExtra,                 // optional: JSX or (answers) => JSX rendered under the body
  submitLabel  = 'Submit',
  onSubmit,
}) {
  const { t } = useT()
  const total = questions.length
  const [idx, setIdx] = useState(0)
  const [answers, setAnswers] = useState(() =>
    questions.reduce((acc, q) => { acc[q.id] = ''; return acc }, {}),
  )
  const [submitted, setSubmitted] = useState(false)
  const inputRef = useRef(null)

  const onReview = idx === total
  const onDone   = submitted
  const q = onReview ? null : questions[idx]
  const value = q ? answers[q.id] : ''
  const canContinue = onReview || (q.optional ? true : value.trim().length > 0)

  useEffect(() => {
    if (!onReview && !onDone) inputRef.current?.focus()
  }, [idx, onReview, onDone])

  const setValue = (v) => setAnswers((a) => ({ ...a, [q.id]: v }))
  const goNext = () => {
    if (!canContinue) return
    setIdx((i) => Math.min(total, i + 1))
  }
  const goBack = () => {
    if (idx === 0) { navigate('#/'); return }
    setIdx((i) => Math.max(0, i - 1))
  }
  const submit = async () => {
    if (onSubmit) { try { await onSubmit(answers) } catch (e) { console.error(e) } }
    setSubmitted(true)
  }

  const progress = onReview ? 100 : (idx / total) * 100

  return (
    <div className="min-h-screen bg-cream text-warm-ink relative overflow-hidden">
      {/* warm ambient glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-24 h-[36rem] w-[36rem] rounded-full bg-warm-peach opacity-60 blur-3xl" />
        <div className="absolute -bottom-32 -right-24 h-[36rem] w-[36rem] rounded-full bg-warm-blush opacity-50 blur-3xl" />
      </div>

      {/* top bar */}
      <div className="relative z-10 px-6 pt-6">
        <div className="mx-auto max-w-2xl flex items-center justify-between">
          <a href="#/" className="flex items-center gap-2 text-warm-ink">
            <LogoMark className="h-8 w-8" />
            <span className="wordmark text-base">
              <span className="text-warm-ink">Chain</span>
              <span style={{ color: '#1e5be3' }}>Work</span>
            </span>
          </a>
          <button
            onClick={() => navigate('#/')}
            className="h-9 w-9 grid place-items-center rounded-full text-warm-ink/55 hover:text-warm-ink hover:bg-warm-ink/5 transition"
            aria-label={t('convForm.close')}
          >
            <Icon path={<path d="M6 6l12 12M18 6l-12 12" />} className="h-4 w-4" />
          </button>
        </div>

        {/* progress */}
        <div className="mx-auto max-w-2xl mt-8 flex items-center gap-4">
          <button
            onClick={goBack}
            disabled={onDone}
            className="h-8 w-8 grid place-items-center rounded-full text-warm-ink/45 hover:text-warm-ink hover:bg-warm-ink/5 transition disabled:opacity-0"
            aria-label={t('convForm.back')}
          >
            <Icon path={<path d="M15 18l-6-6 6-6" />} className="h-4 w-4" />
          </button>
          <div className="flex-1 h-[3px] rounded-full bg-warm-ink/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#1e5be3] to-[#14b8a6] transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="font-mono text-xs text-warm-ink/45 tabular-nums">
            {onReview ? `${total} / ${total}` : `${idx + 1} / ${total}`}
          </div>
        </div>
      </div>

      {/* body */}
      <div className="relative z-10 px-6 py-16 md:py-24">
        <div className="mx-auto max-w-2xl">
          {!onReview && !onDone && (
            <Question
              key={idx}
              eyebrow={eyebrow}
              q={q}
              value={value}
              onChange={setValue}
              onNext={goNext}
              inputRef={inputRef}
              canContinue={canContinue}
            />
          )}

          {onReview && !onDone && (
            <Summary
              eyebrow={eyebrow}
              questions={questions}
              answers={answers}
              onEdit={(i) => setIdx(i)}
              onSubmit={submit}
              submitLabel={submitLabel}
            />
          )}

          {onDone && (
            <Success
              title={successTitle}
              body={successBody}
              extra={typeof successExtra === 'function' ? successExtra(answers) : successExtra}
            />
          )}
        </div>
      </div>
    </div>
  )
}

// ---------- pieces ----------

const Question = ({ eyebrow, q, value, onChange, onNext, inputRef, canContinue }) => {
  const { t } = useT()
  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !(q.long && e.shiftKey)) {
      e.preventDefault()
      onNext()
    }
  }

  const pickChoice = (choiceId) => {
    onChange(choiceId)
    // Auto-advance after a brief beat so the user sees the selection
    setTimeout(() => onNext(), 280)
  }

  return (
    <div className="animate-[fadein_.4s_ease]">
      {eyebrow && (
        <div className="text-[11px] uppercase tracking-[0.22em] text-warm-ink/45 font-mono mb-5">
          {eyebrow}
        </div>
      )}
      <h2 className="text-2xl md:text-4xl font-medium leading-snug tracking-tight text-warm-ink">
        {q.prompt}
        {q.optional && (
          <span className="ml-3 align-middle inline-block text-[11px] uppercase tracking-wider text-warm-ink/40 border border-warm-ink/15 rounded-full px-2 py-0.5">
            {t('convForm.optional')}
          </span>
        )}
      </h2>
      {q.hint && <p className="mt-3 text-warm-ink/55 text-sm md:text-base">{q.hint}</p>}

      {q.choices ? (
        <ChoiceList
          choices={q.choices}
          value={value}
          onPick={pickChoice}
        />
      ) : (
        <>
          <div className="mt-10 flex items-end gap-3 border-b border-warm-ink/15 focus-within:border-warm-ink/40 transition-colors pb-2">
            {q.long ? (
              <textarea
                ref={inputRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={onKeyDown}
                rows={2}
                placeholder={q.placeholder}
                className="flex-1 bg-transparent border-0 focus:outline-none text-lg md:text-xl py-2 resize-none placeholder:text-warm-ink/30"
              />
            ) : (
              <input
                ref={inputRef}
                type={q.type || 'text'}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder={q.placeholder}
                className="flex-1 bg-transparent border-0 focus:outline-none text-lg md:text-xl py-2 placeholder:text-warm-ink/30"
              />
            )}
            <button
              type="button"
              onClick={onNext}
              disabled={!canContinue}
              aria-label={t('convForm.next')}
              className={
                'shrink-0 h-11 w-11 md:h-12 md:w-12 rounded-full grid place-items-center transition transform ' +
                (canContinue
                  ? 'bg-[#1e5be3] text-white hover:scale-[1.04] hover:bg-[#1a4cc0] shadow-[0_10px_30px_-12px_rgba(30,91,227,0.6)]'
                  : 'bg-warm-ink/10 text-warm-ink/30 cursor-not-allowed')
              }
            >
              <Icon path={<path d="M5 12h14M13 5l7 7-7 7" />} className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-5 flex items-center gap-3 text-xs text-warm-ink/40">
            <span>{t('convForm.press')}</span>
            <kbd className="px-2 py-0.5 rounded-md border border-warm-ink/15 bg-white/40 font-mono">{t('convForm.enterKey')}</kbd>
            <span>{t('convForm.toContinue')}</span>
            {q.long && <span className="opacity-70">{t('convForm.shiftEnter')}</span>}
          </div>
        </>
      )}
    </div>
  )
}

const ChoiceList = ({ choices, value, onPick }) => (
  <div className="mt-8 space-y-3">
    {choices.map((c, i) => {
      const active = value === c.id
      return (
        <button
          key={c.id}
          type="button"
          onClick={() => onPick(c.id)}
          className={
            'group w-full text-left rounded-2xl px-5 py-4 md:px-6 md:py-5 transition border ' +
            (active
              ? 'bg-white border-[#1e5be3] shadow-[0_20px_50px_-25px_rgba(30,91,227,0.55)]'
              : 'bg-white/60 border-warm-ink/10 hover:bg-white hover:border-warm-ink/25')
          }
        >
          <div className="flex items-start gap-4">
            <div className={
              'shrink-0 h-7 w-7 rounded-full grid place-items-center text-xs font-mono mt-0.5 transition ' +
              (active
                ? 'bg-[#1e5be3] text-white'
                : 'bg-warm-ink/8 text-warm-ink/55 border border-warm-ink/15')
            }>
              {active ? (
                <Icon path={<path d="M5 12l4 4 10-10" />} className="h-3.5 w-3.5" />
              ) : String.fromCharCode(65 + i) /* A, B, C… */}
            </div>
            <div className="flex-1 min-w-0">
              <div className={'font-semibold text-base md:text-lg ' + (active ? 'text-warm-ink' : 'text-warm-ink/90')}>
                {c.title}
              </div>
              {c.hint && (
                <div className="mt-1 text-sm text-warm-ink/55 leading-relaxed">
                  {c.hint}
                </div>
              )}
            </div>
          </div>
        </button>
      )
    })}
  </div>
)

const Summary = ({ eyebrow, questions, answers, onEdit, onSubmit, submitLabel }) => {
  const { t } = useT()
  return (
  <div className="animate-[fadein_.4s_ease]">
    {eyebrow && (
      <div className="text-[11px] uppercase tracking-[0.22em] text-warm-ink/45 font-mono mb-5">
        {t('convForm.review')}
      </div>
    )}
    <h2 className="text-2xl md:text-4xl font-medium tracking-tight">{t('convForm.reviewTitle')}</h2>
    <p className="mt-3 text-warm-ink/55">{t('convForm.reviewSub')}</p>

    <div className="mt-10 rounded-3xl bg-white/70 backdrop-blur border border-warm-ink/10 shadow-[0_30px_80px_-40px_rgba(60,40,20,0.25)] divide-y divide-warm-ink/10 overflow-hidden">
      {questions.map((q, i) => (
        <button
          key={q.id}
          type="button"
          onClick={() => onEdit(i)}
          className="w-full text-left flex items-start gap-4 px-6 py-5 hover:bg-warm-ink/[0.03] transition group"
        >
          <div className="text-[10px] font-mono uppercase tracking-wider text-warm-ink/35 mt-1 w-10 shrink-0">
            {String(i + 1).padStart(2, '0')}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm text-warm-ink/50">{q.shortLabel || q.prompt}</div>
            <div className="mt-1 text-base text-warm-ink whitespace-pre-wrap break-words">
              {q.choices
                ? (q.choices.find((c) => c.id === answers[q.id])?.title
                    || <span className="text-warm-ink/30">{t('convForm.notChosen')}</span>)
                : (answers[q.id]?.trim() || <span className="text-warm-ink/30">{t('convForm.notProvided')}</span>)}
            </div>
          </div>
          <span className="opacity-0 group-hover:opacity-100 text-xs text-warm-ink/50 mt-1">{t('convForm.edit')}</span>
        </button>
      ))}
    </div>

    <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
      <button
        type="button"
        onClick={onSubmit}
        className="inline-flex items-center gap-3 rounded-full bg-[#1e5be3] hover:bg-[#1a4cc0] text-white px-7 py-3.5 font-semibold transition shadow-[0_20px_40px_-20px_rgba(30,91,227,0.7)]"
      >
        {submitLabel}
        <Icon path={<path d="M5 12l5 5L20 7" />} className="h-4 w-4" />
      </button>
      <span className="text-xs text-warm-ink/45">{t('convForm.privacyNote')}</span>
    </div>
  </div>
  )
}

const Success = ({ title, body, extra }) => {
  const { t } = useT()
  return (
  <div className="animate-[fadein_.4s_ease] pt-4 md:pt-8">
    <div className="text-center">
      <div className="mx-auto h-16 w-16 rounded-full bg-[#14b8a6]/15 border border-[#14b8a6]/40 grid place-items-center text-[#0d9488] mb-6">
        <Icon path={<path d="M5 12l5 5L20 7" />} className="h-7 w-7" />
      </div>
      <h1 className="text-3xl md:text-5xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-4 text-warm-ink/65 text-lg max-w-md mx-auto">{body}</p>
    </div>

    {extra && <div className="mt-10">{extra}</div>}

    <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
      <button onClick={() => navigate('#/')} className="rounded-full border border-warm-ink/15 hover:border-warm-ink/35 px-6 py-3 font-medium transition">
        {t('convForm.backHome')}
      </button>
    </div>
  </div>
  )
}
