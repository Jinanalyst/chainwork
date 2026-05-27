import React, { useEffect, useRef, useState } from 'react'
import { Icon } from './ui.jsx'

/**
 * Full-screen conversational profile editor. Same one-question-at-a-time
 * feel as the hirer post-task flow, but in the dark dashboard theme so it
 * doesn't context-switch you out of your workspace.
 */

const initials = (n) =>
  (n || '?').split(/\s+/).map((p) => p[0] || '').slice(0, 2).join('').toUpperCase()

export const WORKER_QUESTIONS = [
  { id: 'name',         prompt: "What's your full name?",                 placeholder: 'Your full name',             required: true,  shortLabel: 'Name' },
  { id: 'role',         prompt: 'What do you do?',                         placeholder: 'Full-stack web + AI worker', required: true,  shortLabel: 'Role',
    hint: 'A short title hirers will see on your profile and offers.' },
  { id: 'location',     prompt: 'Where are you based?',                    placeholder: 'City, Country',              required: true,  shortLabel: 'Location' },
  { id: 'email',        prompt: "What's your contact email?",              placeholder: 'you@example.com',            required: true,  type: 'email', shortLabel: 'Contact',
    hint: 'Only matched hirers will see this.' },
  { id: 'skills',       prompt: 'What skills do you have?',                placeholder: 'React, Tailwind, Solidity, OpenAI API…', required: false, shortLabel: 'Skills',
    hint: 'Separate with commas — list whatever you reach for most.' },
  { id: 'availability', prompt: 'What kind of work are you available for?', placeholder: 'Small fixes, part-time projects, full builds…', required: false, shortLabel: 'Availability' },
  { id: 'bio',          prompt: 'Tell us about yourself.',                 placeholder: 'I ship landing pages, AI chatbots, and Web3 dashboards for early-stage teams.', long: true, shortLabel: 'Bio',
    hint: 'A sentence or two. Strong specifics beat fluff.' },
  { id: 'portfolioUrl', prompt: 'Drop your portfolio link.',               placeholder: 'https://yourportfolio.dev',  required: false, type: 'url', shortLabel: 'Portfolio',
    hint: 'Optional — case studies, GitHub, anywhere your best work lives.' },
  { id: '__socials',    prompt: 'Add your social links.',                  hint: 'Optional — leave blank to skip.', shortLabel: 'Socials',
    kind: 'socials' },
]

export const DEFAULT_SOCIAL_FIELDS = [
  { key: 'github',   label: 'GitHub',      placeholder: 'github.com/your-handle' },
  { key: 'twitter',  label: 'X / Twitter', placeholder: 'x.com/your-handle' },
  { key: 'linkedin', label: 'LinkedIn',    placeholder: 'linkedin.com/in/your-handle' },
  { key: 'website',  label: 'Website',     placeholder: 'yoursite.com' },
]

// Build the working profile object from initial values, using the question
// list to know which keys to seed and the social-field list for socials.
const buildInitial = (initial = {}, questions, socialFields) => {
  const out = {}
  for (const q of questions) {
    if (q.kind === 'socials') continue
    out[q.id] = initial[q.id] ?? ''
  }
  out.socials = {}
  for (const f of socialFields) {
    out.socials[f.key] = initial.socials?.[f.key] || ''
  }
  return out
}

export default function ProfileEditor({
  open,
  initial,
  onClose,
  onSave,
  questions     = WORKER_QUESTIONS,
  socialFields  = DEFAULT_SOCIAL_FIELDS,
  eyebrow       = 'Edit profile',
}) {
  const QUESTIONS = questions
  const SOCIAL_FIELDS = socialFields
  const [idx, setIdx] = useState(0)
  const [profile, setProfile] = useState(() => buildInitial(initial, QUESTIONS, SOCIAL_FIELDS))
  const [saving, setSaving] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    if (open) { setIdx(0); setProfile(buildInitial(initial, QUESTIONS, SOCIAL_FIELDS)); setSaving(false) }
  }, [open, initial, QUESTIONS, SOCIAL_FIELDS])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => { if (open) inputRef.current?.focus() }, [idx, open])

  if (!open) return null

  const total = QUESTIONS.length
  const q = QUESTIONS[idx]
  const value = q.kind === 'socials' ? profile.socials : profile[q.id]
  const canContinue = q.kind === 'socials'
    ? true
    : (q.required ? String(value || '').trim().length > 0 : true)

  const set = (patch) => setProfile((p) => ({ ...p, ...patch }))
  const setSocial = (key, v) => setProfile((p) => ({ ...p, socials: { ...p.socials, [key]: v } }))

  const goBack = () => setIdx((i) => Math.max(0, i - 1))

  const goNext = async () => {
    if (!canContinue) return
    if (idx >= total - 1) {
      setSaving(true)
      try { await onSave?.(profile) } finally { setSaving(false); onClose() }
      return
    }
    setIdx((i) => i + 1)
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !(q.long && e.shiftKey)) {
      e.preventDefault()
      goNext()
    }
  }

  const progress = ((idx + 1) / total) * 100

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-ink-950">
      {/* Subtle radial glow for warmth */}
      <div className="pointer-events-none absolute inset-0 grid-overlay opacity-50" />
      <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 h-[28rem] w-[40rem] rounded-full bg-brand-500/20 blur-3xl" />

      {/* Top bar */}
      <div className="relative px-6 pt-6">
        <div className="mx-auto max-w-2xl flex items-center gap-4">
          <button
            onClick={() => (idx === 0 ? onClose() : goBack())}
            className="h-9 w-9 grid place-items-center rounded-full text-white/55 hover:text-white hover:bg-white/5 transition"
            aria-label="Back"
          >
            <Icon path={<path d="M15 18l-6-6 6-6" />} className="h-4 w-4" />
          </button>
          <div className="flex-1">
            <div className="text-[11px] uppercase tracking-[0.2em] text-accent-400 font-mono mb-2">{eyebrow}</div>
            <div className="h-[3px] rounded-full bg-white/10 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-brand-400 to-accent-400 transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>
          <div className="font-mono text-xs text-white/45 tabular-nums">
            {String(idx + 1).padStart(2, '0')} <span className="text-white/25">/</span> {String(total).padStart(2, '0')}
          </div>
          <button
            onClick={onClose}
            className="h-9 w-9 grid place-items-center rounded-full text-white/55 hover:text-white hover:bg-white/5 transition"
            aria-label="Close"
          >
            <Icon path={<path d="M6 6l12 12M18 6l-12 12" />} className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="relative flex-1 flex items-center px-6 py-12 overflow-y-auto">
        <div className="mx-auto w-full max-w-2xl">
          <div key={idx} className="animate-[fadein_.35s_ease]">
            <h2 className="text-2xl md:text-4xl font-medium leading-snug tracking-tight">
              {q.prompt}
              {!q.required && q.kind !== 'socials' && (
                <span className="ml-3 align-middle inline-block text-[11px] uppercase tracking-wider text-white/40 border border-white/15 rounded-full px-2 py-0.5">
                  Optional
                </span>
              )}
            </h2>
            {q.hint && <p className="mt-3 text-white/55 text-sm md:text-base">{q.hint}</p>}

            <div className="mt-10">
              {q.kind === 'socials' ? (
                <div className="space-y-4">
                  {SOCIAL_FIELDS.map((f, i) => (
                    <div key={f.key} className="flex items-baseline gap-3 border-b border-white/15 focus-within:border-white/40 transition-colors pb-2">
                      <span className="w-24 shrink-0 text-sm text-white/55">{f.label}</span>
                      <input
                        ref={i === 0 ? inputRef : null}
                        value={profile.socials[f.key]}
                        onChange={(e) => setSocial(f.key, e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); goNext() } }}
                        placeholder={f.placeholder}
                        className="flex-1 bg-transparent border-0 focus:outline-none text-base md:text-lg py-2 placeholder:text-white/25"
                      />
                    </div>
                  ))}
                </div>
              ) : q.long ? (
                <div className="flex items-end gap-3 border-b border-white/15 focus-within:border-white/40 transition-colors pb-2">
                  <textarea
                    ref={inputRef}
                    value={value || ''}
                    onChange={(e) => set({ [q.id]: e.target.value })}
                    onKeyDown={onKeyDown}
                    rows={2}
                    placeholder={q.placeholder}
                    className="flex-1 bg-transparent border-0 focus:outline-none text-lg md:text-xl py-2 resize-none placeholder:text-white/25"
                  />
                  <NextButton canContinue={canContinue} onClick={goNext} loading={saving} done={idx >= total - 1} />
                </div>
              ) : (
                <div className="flex items-end gap-3 border-b border-white/15 focus-within:border-white/40 transition-colors pb-2">
                  <input
                    ref={inputRef}
                    type={q.type || 'text'}
                    value={value || ''}
                    onChange={(e) => set({ [q.id]: e.target.value })}
                    onKeyDown={onKeyDown}
                    placeholder={q.placeholder}
                    className="flex-1 bg-transparent border-0 focus:outline-none text-lg md:text-xl py-2 placeholder:text-white/25"
                  />
                  <NextButton canContinue={canContinue} onClick={goNext} loading={saving} done={idx >= total - 1} />
                </div>
              )}
            </div>

            {q.kind === 'socials' && (
              <div className="mt-8 flex items-center justify-between">
                <span className="text-xs text-white/40">All fields optional — leave blank to skip.</span>
                <NextButton canContinue={canContinue} onClick={goNext} loading={saving} done inline />
              </div>
            )}

            <div className="mt-5 flex items-center gap-3 text-xs text-white/40">
              <span>Press</span>
              <kbd className="px-2 py-0.5 rounded-md border border-white/15 bg-white/[0.04] font-mono">Enter</kbd>
              <span>to continue</span>
              {q.long && <span className="opacity-70">· Shift + Enter for a new line</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const NextButton = ({ canContinue, onClick, loading, done, inline }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={!canContinue || loading}
    aria-label={done ? 'Save' : 'Next'}
    className={
      (inline
        ? 'inline-flex items-center gap-3 rounded-full px-5 py-2.5 font-semibold text-sm transition '
        : 'shrink-0 h-11 w-11 md:h-12 md:w-12 rounded-full grid place-items-center transition transform ') +
      (canContinue && !loading
        ? 'bg-gradient-to-r from-brand-300 to-accent-400 text-ink-950 hover:scale-[1.04] shadow-glow'
        : 'bg-white/[0.05] text-white/30 cursor-not-allowed')
    }
  >
    {inline ? (
      <>
        {done ? 'Save profile' : 'Continue'}
        <Icon path={done ? <path d="M5 12l5 5L20 7" /> : <path d="M5 12h14M13 5l7 7-7 7" />} className="h-4 w-4" />
      </>
    ) : (
      <Icon
        path={done ? <path d="M5 12l5 5L20 7" /> : <path d="M5 12h14M13 5l7 7-7 7" />}
        className="h-5 w-5"
      />
    )}
  </button>
)
