import React, { useState } from 'react'
import { Icon, navigate } from '../components/ui.jsx'

const CATEGORIES = [
  { id: 'web-build',       title: 'Web Build',          blurb: 'New site or page' },
  { id: 'web-fix',         title: 'Web Fix',            blurb: 'Bugs, deploys, perf' },
  { id: 'ai-automation',   title: 'AI Web Automation',  blurb: 'Chatbots, workflows' },
  { id: 'web3',            title: 'Web3 Work',          blurb: 'Wallets, NFTs, DAOs' },
  { id: 'app-pwa',         title: 'App & PWA Launch',   blurb: 'Mobile-first launch' },
  { id: 'digital-support', title: 'Digital Support',    blurb: 'Domain, email, SEO' },
]

const INDUSTRIES = ['SaaS', 'E-commerce', 'AI / ML', 'Web3 / Crypto', 'Creator / Media', 'Agency', 'Non-profit', 'Other']
const TEAM_SIZES = ['Just me', '2–10', '11–50', '51–200', '200+']
const BUDGETS = [
  { id: 'lt100',   label: 'Under $100' },
  { id: '100-500', label: '$100 – $500' },
  { id: '500-2k',  label: '$500 – $2,000' },
  { id: '2k-10k',  label: '$2,000 – $10,000' },
  { id: 'gt10k',   label: '$10,000+' },
]
const PAYMENT_METHODS = [
  { id: 'card',       label: 'Card / Bank',  hint: 'Visa, Mastercard, ACH, SEPA' },
  { id: 'stablecoin', label: 'Stablecoin',   hint: 'USDC, USDT — no FX' },
  { id: 'crypto',     label: 'Crypto',       hint: 'ETH, SOL, BTC (optional)' },
]
const DELIVERY = [
  { id: '24h',  label: 'Within 24 hours' },
  { id: '3d',   label: 'Within 3 days' },
  { id: '1w',   label: 'Within 1 week' },
  { id: '2w',   label: 'Within 2 weeks' },
  { id: 'flex', label: 'Flexible' },
]
const DIFFICULTY = [
  { id: 'easy',   label: 'Easy',   hint: 'Quick tweak or setup' },
  { id: 'medium', label: 'Medium', hint: 'Moderate scope' },
  { id: 'hard',   label: 'Hard',   hint: 'Specialised / complex' },
]

const STEPS = [
  { id: 1, title: 'About you',    sub: 'Company & context' },
  { id: 2, title: 'Task type',    sub: 'Category & summary' },
  { id: 3, title: 'Requirements', sub: 'Skills & deliverables' },
  { id: 4, title: 'Budget',       sub: 'Payment & timeline' },
  { id: 5, title: 'Review',       sub: 'Confirm & post' },
]

const Field = ({ label, hint, children }) => (
  <label className="block">
    <div className="flex items-baseline justify-between mb-1.5">
      <span className="text-sm font-medium text-white/85">{label}</span>
      {hint && <span className="text-xs text-white/40">{hint}</span>}
    </div>
    {children}
  </label>
)

const TextInput = (props) => (
  <input
    {...props}
    className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-white/35 focus:outline-none focus:border-brand-300 transition"
  />
)

const TextArea = (props) => (
  <textarea
    {...props}
    className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-white/35 focus:outline-none focus:border-brand-300 transition resize-y min-h-[110px]"
  />
)

const Select = ({ options, value, onChange, placeholder }) => (
  <select
    value={value || ''}
    onChange={(e) => onChange(e.target.value)}
    className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-brand-300"
  >
    <option value="" disabled>{placeholder}</option>
    {options.map((o) => <option key={o} value={o} className="bg-ink-900">{o}</option>)}
  </select>
)

const Choice = ({ active, onClick, title, hint }) => (
  <button
    type="button"
    onClick={onClick}
    className={
      'text-left rounded-xl border px-4 py-3 transition ' +
      (active
        ? 'border-brand-300 bg-brand-500/15 text-white'
        : 'border-white/10 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.06] text-white/85')
    }
  >
    <div className="font-medium">{title}</div>
    {hint && <div className="text-xs text-white/55 mt-0.5">{hint}</div>}
  </button>
)

const Stepper = ({ current }) => (
  <div className="mb-10">
    <div className="hidden md:flex items-center justify-between gap-2">
      {STEPS.map((s, i) => {
        const done = s.id < current
        const active = s.id === current
        return (
          <React.Fragment key={s.id}>
            <div className="flex items-center gap-3 min-w-0">
              <div className={
                'h-9 w-9 shrink-0 rounded-full grid place-items-center text-sm font-semibold border ' +
                (done ? 'bg-accent-500 border-accent-500 text-ink-950'
                  : active ? 'bg-brand-500 border-brand-500 text-white'
                  : 'bg-white/5 border-white/15 text-white/60')
              }>
                {done ? <Icon path={<path d="M5 12l4 4 10-10" />} className="h-4 w-4" /> : s.id}
              </div>
              <div className="min-w-0">
                <div className={'text-xs uppercase tracking-wider ' + (active || done ? 'text-white' : 'text-white/50')}>{s.title}</div>
                <div className="text-[11px] text-white/45 truncate">{s.sub}</div>
              </div>
            </div>
            {i < STEPS.length - 1 && (
              <div className={'flex-1 h-px ' + (done ? 'bg-accent-500/60' : 'bg-white/10')} />
            )}
          </React.Fragment>
        )
      })}
    </div>
    <div className="md:hidden">
      <div className="flex items-center justify-between text-sm">
        <div className="font-semibold">Step {current} of {STEPS.length}</div>
        <div className="text-white/60">{STEPS[current - 1].title}</div>
      </div>
      <div className="mt-3 h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-brand-400 to-accent-400 transition-all" style={{ width: `${(current / STEPS.length) * 100}%` }} />
      </div>
    </div>
  </div>
)

const initialForm = {
  companyName: '',
  website: '',
  industry: '',
  teamSize: '',
  about: '',
  category: '',
  taskTitle: '',
  taskDescription: '',
  skills: [],
  skillsDraft: '',
  deliverables: '',
  references: '',
  difficulty: '',
  budget: '',
  paymentMethod: '',
  delivery: '',
}

const SummaryRow = ({ label, value }) => (
  <div className="grid grid-cols-3 gap-3 py-2 border-b border-white/5 last:border-0">
    <div className="text-xs uppercase tracking-wider text-white/45">{label}</div>
    <div className="col-span-2 text-sm text-white/90 whitespace-pre-wrap">{value || <span className="text-white/35">—</span>}</div>
  </div>
)

export default function PostTask() {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState(initialForm)
  const [submitted, setSubmitted] = useState(false)

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const addSkill = (raw) => {
    const v = raw.trim().replace(/,$/, '')
    if (!v) return
    if (form.skills.includes(v)) { set('skillsDraft', ''); return }
    setForm((f) => ({ ...f, skills: [...f.skills, v], skillsDraft: '' }))
  }
  const removeSkill = (s) => set('skills', form.skills.filter((x) => x !== s))

  const canContinue = (() => {
    if (step === 1) return form.companyName && form.industry && form.teamSize
    if (step === 2) return form.category && form.taskTitle && form.taskDescription
    if (step === 3) return form.skills.length > 0 && form.deliverables && form.difficulty
    if (step === 4) return form.budget && form.paymentMethod && form.delivery
    return true
  })()

  if (submitted) {
    return (
      <section className="py-24">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-accent-500/15 border border-accent-500/40 grid place-items-center text-accent-400 mb-6">
            <Icon path={<path d="M5 12l5 5L20 7" />} className="h-7 w-7" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold">Task posted.</h1>
          <p className="mt-3 text-white/70">
            Trusted workers in <span className="text-white">{CATEGORIES.find((c) => c.id === form.category)?.title}</span> are being matched now. You'll get the first offers within a few hours.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={() => { setSubmitted(false); setForm(initialForm); setStep(1) }} className="btn-ghost">Post another</button>
            <button onClick={() => navigate('#/')} className="btn-primary">Back to home</button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-16">
      <div className="mx-auto max-w-4xl px-6">
        <div className="mb-8">
          <button onClick={() => navigate('#/')} className="text-sm text-white/60 hover:text-white flex items-center gap-1.5">
            <Icon path={<path d="M15 18l-6-6 6-6" />} className="h-4 w-4" />
            Back to home
          </button>
          <h1 className="mt-4 text-3xl md:text-4xl font-bold">Post a task</h1>
          <p className="mt-2 text-white/65">Answer a few quick questions — most clients finish in under 3 minutes.</p>
        </div>

        <Stepper current={step} />

        <div className="card p-6 md:p-8">
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold">Tell us about you</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Company or project name">
                  <TextInput placeholder="Acme Studio" value={form.companyName} onChange={(e) => set('companyName', e.target.value)} />
                </Field>
                <Field label="Website" hint="Optional">
                  <TextInput placeholder="https://acme.com" value={form.website} onChange={(e) => set('website', e.target.value)} />
                </Field>
                <Field label="Industry">
                  <Select options={INDUSTRIES} value={form.industry} onChange={(v) => set('industry', v)} placeholder="Pick one" />
                </Field>
                <Field label="Team size">
                  <Select options={TEAM_SIZES} value={form.teamSize} onChange={(v) => set('teamSize', v)} placeholder="Pick one" />
                </Field>
              </div>
              <Field label="Brief about your business" hint="2–3 sentences is plenty">
                <TextArea placeholder="We're a small DTC coffee brand launching a new product line next month…" value={form.about} onChange={(e) => set('about', e.target.value)} />
              </Field>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold">What kind of task is this?</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {CATEGORIES.map((c) => (
                  <Choice key={c.id} active={form.category === c.id} onClick={() => set('category', c.id)} title={c.title} hint={c.blurb} />
                ))}
              </div>
              <Field label="Task title" hint="One clear line">
                <TextInput placeholder="Build a landing page for our product launch" value={form.taskTitle} onChange={(e) => set('taskTitle', e.target.value)} />
              </Field>
              <Field label="What needs to be done?" hint="Goals, context, anything inspiring">
                <TextArea placeholder="We need a single-page launch site with a hero, feature grid, FAQ and email signup. Branded assets ready." value={form.taskDescription} onChange={(e) => set('taskDescription', e.target.value)} />
              </Field>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold">Requirements</h2>
              <Field label="Skills needed" hint="Press Enter to add">
                <div className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 focus-within:border-brand-300 transition">
                  <div className="flex flex-wrap gap-1.5">
                    {form.skills.map((s) => (
                      <span key={s} className="inline-flex items-center gap-1 rounded-full bg-brand-500/15 border border-brand-400/30 px-2.5 py-1 text-xs">
                        {s}
                        <button type="button" onClick={() => removeSkill(s)} className="text-white/60 hover:text-white">×</button>
                      </span>
                    ))}
                    <input
                      value={form.skillsDraft}
                      onChange={(e) => set('skillsDraft', e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addSkill(form.skillsDraft) }
                        if (e.key === 'Backspace' && !form.skillsDraft && form.skills.length) {
                          removeSkill(form.skills[form.skills.length - 1])
                        }
                      }}
                      onBlur={() => addSkill(form.skillsDraft)}
                      placeholder={form.skills.length ? '' : 'e.g. React, Tailwind, Vercel'}
                      className="flex-1 min-w-[160px] bg-transparent px-2 py-1.5 text-sm focus:outline-none placeholder:text-white/35"
                    />
                  </div>
                </div>
              </Field>
              <Field label="Deliverables" hint="What you'll receive at the end">
                <TextArea placeholder={"e.g.\n— Deployed live site on a domain we provide\n— Source code in a GitHub repo\n— Lighthouse score ≥ 90"} value={form.deliverables} onChange={(e) => set('deliverables', e.target.value)} />
              </Field>
              <Field label="References / inspiration" hint="Links to sites, screenshots, briefs — optional">
                <TextArea placeholder="https://stripe.com, https://linear.app" value={form.references} onChange={(e) => set('references', e.target.value)} />
              </Field>
              <Field label="Difficulty">
                <div className="grid sm:grid-cols-3 gap-3">
                  {DIFFICULTY.map((d) => (
                    <Choice key={d.id} active={form.difficulty === d.id} onClick={() => set('difficulty', d.id)} title={d.label} hint={d.hint} />
                  ))}
                </div>
              </Field>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold">Budget & timeline</h2>
              <Field label="Budget range">
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {BUDGETS.map((b) => (
                    <Choice key={b.id} active={form.budget === b.id} onClick={() => set('budget', b.id)} title={b.label} />
                  ))}
                </div>
              </Field>
              <Field label="How would you like to pay?">
                <div className="grid sm:grid-cols-3 gap-3">
                  {PAYMENT_METHODS.map((p) => (
                    <Choice key={p.id} active={form.paymentMethod === p.id} onClick={() => set('paymentMethod', p.id)} title={p.label} hint={p.hint} />
                  ))}
                </div>
              </Field>
              <Field label="Delivery time">
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {DELIVERY.map((d) => (
                    <Choice key={d.id} active={form.delivery === d.id} onClick={() => set('delivery', d.id)} title={d.label} />
                  ))}
                </div>
              </Field>
              <div className="rounded-xl border border-accent-500/20 bg-accent-500/[0.06] px-4 py-3 text-sm text-white/80 flex gap-3">
                <Icon path={<><path d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6z" /><path d="M9 12l2 2 4-4" /></>} className="h-5 w-5 text-accent-400 shrink-0 mt-0.5" />
                <div>Your payment is held in escrow and only released when you approve the work. If something goes wrong, our dispute team steps in.</div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold">Review your task</h2>
              <div className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2">
                <SummaryRow label="Company"     value={form.companyName} />
                <SummaryRow label="Website"     value={form.website} />
                <SummaryRow label="Industry"    value={form.industry} />
                <SummaryRow label="Team size"   value={form.teamSize} />
                <SummaryRow label="About"       value={form.about} />
                <SummaryRow label="Category"    value={CATEGORIES.find((c) => c.id === form.category)?.title} />
                <SummaryRow label="Title"       value={form.taskTitle} />
                <SummaryRow label="Description" value={form.taskDescription} />
                <SummaryRow label="Skills"      value={form.skills.join(', ')} />
                <SummaryRow label="Deliverables" value={form.deliverables} />
                <SummaryRow label="References"  value={form.references} />
                <SummaryRow label="Difficulty"  value={DIFFICULTY.find((d) => d.id === form.difficulty)?.label} />
                <SummaryRow label="Budget"      value={BUDGETS.find((b) => b.id === form.budget)?.label} />
                <SummaryRow label="Payment"     value={PAYMENT_METHODS.find((p) => p.id === form.paymentMethod)?.label} />
                <SummaryRow label="Delivery"    value={DELIVERY.find((d) => d.id === form.delivery)?.label} />
              </div>
              <p className="text-xs text-white/55">By posting, you agree to ChainWork's terms and escrow policy.</p>
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1}
            className="btn-ghost disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Icon path={<path d="M15 18l-6-6 6-6" />} className="h-4 w-4" />
            Back
          </button>
          {step < STEPS.length ? (
            <button
              onClick={() => setStep((s) => Math.min(STEPS.length, s + 1))}
              disabled={!canContinue}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
              <Icon path={<path d="M5 12h14M13 5l7 7-7 7" />} className="h-4 w-4" />
            </button>
          ) : (
            <button onClick={() => setSubmitted(true)} className="btn-primary">
              Post task
              <Icon path={<path d="M5 12l5 5L20 7" />} className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
