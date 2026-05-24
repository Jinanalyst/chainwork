import React from 'react'
import ConversationalForm from '../components/ConversationalForm.jsx'
import { useProfile } from '../hooks/useProfile.js'

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

const parseSkills = (raw) =>
  String(raw || '')
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 24)

export default function JoinAsWorker() {
  const { update } = useProfile()

  return (
    <ConversationalForm
      eyebrow="Join as a worker"
      questions={QUESTIONS}
      submitLabel="Create my profile"
      successTitle="Welcome to ChainWork."
      successBody="Your profile is live. Hirers browsing /talents can find and message you right now."
      onSubmit={async (answers) => {
        const patch = {
          role:          'worker',
          title:         answers.role?.trim()         || null,
          skills:        parseSkills(answers.skills),
          portfolio_url: answers.portfolio?.trim()    || null,
          experience:    answers.experience?.trim()   || null,
          bio:           answers.experience?.trim()   || null,
          availability:  answers.availability?.trim() || null,
        }
        const res = await update(patch)
        if (!res.ok) {
          alert('Could not save your profile: ' + (res.error || 'unknown error'))
          throw new Error(res.error || 'Save failed')
        }
      }}
    />
  )
}
