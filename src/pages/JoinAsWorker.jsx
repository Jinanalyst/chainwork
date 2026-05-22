import React from 'react'
import ConversationalForm from '../components/ConversationalForm.jsx'

const QUESTIONS = [
  {
    id: 'role',
    prompt: 'What is your main role?',
    shortLabel: 'Main role',
    placeholder: 'Front-end developer, AI engineer, designer…',
  },
  {
    id: 'skills',
    prompt: 'What skills do you have?',
    shortLabel: 'Skills',
    placeholder: 'React, Tailwind, Solidity, OpenAI API…',
    hint: 'Separate with commas — list whatever you reach for most.',
  },
  {
    id: 'portfolio',
    prompt: 'Show your portfolio link.',
    shortLabel: 'Portfolio',
    placeholder: 'https://yourportfolio.com',
    type: 'url',
  },
  {
    id: 'experience',
    prompt: 'Tell us about your web experience.',
    shortLabel: 'Experience',
    placeholder: 'I have 4 years building SaaS landing pages and dashboards…',
    long: true,
  },
  {
    id: 'availability',
    prompt: 'What kind of work are you available for?',
    shortLabel: 'Availability',
    placeholder: 'Small fixes, part-time projects, full builds…',
  },
]

export default function JoinAsWorker() {
  return (
    <ConversationalForm
      eyebrow="Join as a worker"
      questions={QUESTIONS}
      submitLabel="Create my profile"
      successTitle="Welcome to ChainWork."
      successBody="Your profile is being reviewed. You'll be matched to tasks that fit your skills within a day."
      onSubmit={(answers) => {
        console.log('[ChainWork] worker joined:', answers)
      }}
    />
  )
}
