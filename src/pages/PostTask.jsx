import React from 'react'
import ConversationalForm from '../components/ConversationalForm.jsx'

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

export default function PostTask() {
  return (
    <ConversationalForm
      eyebrow="Post a task"
      questions={QUESTIONS}
      submitLabel="Post my task"
      successTitle="Your task is live."
      successBody="Trusted workers are being matched right now. You'll start seeing offers within a few hours."
      onSubmit={(answers) => {
        console.log('[ChainWork] task posted:', answers)
      }}
    />
  )
}
