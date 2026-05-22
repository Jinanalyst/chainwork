import React from 'react'
import ConversationalForm from '../components/ConversationalForm.jsx'
import EscrowAddressCard from '../components/EscrowAddressCard.jsx'
import { PLATFORM_WALLETS, ESCROW_RELEASE_NOTE } from '../lib/platform.js'

const QUESTIONS = [
  {
    id: 'workType',
    prompt: 'What kind of web work do you need?',
    shortLabel: 'Type of work',
    placeholder: 'A landing page, an AI chatbot, a bug fix…',
    hint: 'Describe it the way you would to a friend.',
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

const FundingInstructions = ({ answers }) => {
  const isSplit = answers?.paymentStructure === 'fifty-fifty'
  const budget = (answers?.budget || '').trim()
  return (
    <div className="max-w-xl mx-auto">
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
            : <>Send <strong className="text-warm-ink">your full budget{budget && ` (${budget})`}</strong> to one of the addresses below. The funds release to the worker the moment you approve the work.</>}
        </p>
        <p className="mt-2 text-xs text-warm-ink/55">{ESCROW_RELEASE_NOTE}</p>

        <div className="mt-5 space-y-3">
          {PLATFORM_WALLETS.map((w) => (
            <EscrowAddressCard key={w.id} wallet={w} theme="warm" />
          ))}
        </div>

        <div className="mt-5 rounded-xl border border-amber-300/40 bg-amber-100/60 px-4 py-3 text-xs text-amber-900 leading-relaxed">
          <strong>Double-check the chain.</strong> USDC goes to the Base address. USDT goes to the Tron (TRC20) address. Sending on the wrong network can result in lost funds.
        </div>
      </div>
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
      successExtra={(answers) => <FundingInstructions answers={answers} />}
      onSubmit={(answers) => {
        console.log('[ChainWork] task posted:', answers)
      }}
    />
  )
}
