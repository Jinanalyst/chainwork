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
    hint: 'A rough range helps workers send realistic offers.',
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
