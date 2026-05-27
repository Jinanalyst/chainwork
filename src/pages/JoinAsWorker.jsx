import React from 'react'
import ConversationalForm from '../components/ConversationalForm.jsx'
import { useProfile } from '../hooks/useProfile.js'
import { useSession, slugify, handleFor } from '../hooks/useSession.js'
import { supabase } from '../lib/supabase.js'

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

async function reserveUniqueSlug(base, ownerId) {
  if (!base || !supabase) return base || null
  const candidates = [base, ...Array.from({ length: 5 }, (_, i) => `${base}-${i + 2}`)]
  for (const candidate of candidates) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('public_slug', candidate)
      .limit(1)
    if (error) {
      if (/column .* does not exist|42703/i.test(error.message)) {
        console.warn('[slug] public_slug column missing — skipping reservation. Apply migration 0013.')
        return null
      }
      console.warn('[slug] uniqueness probe failed:', error.message)
      return candidate
    }
    if (!data?.length || data[0].id === ownerId) return candidate
  }
  const tag = (ownerId || crypto.randomUUID()).toString().replace(/-/g, '').slice(0, 4)
  return `${base}-${tag}`
}

export default function JoinAsWorker() {
  const { profile, update } = useProfile()
  const { user } = useSession()

  return (
    <ConversationalForm
      eyebrow="Join as a worker"
      questions={QUESTIONS}
      submitLabel="Create my profile"
      successTitle="Welcome to ChainWork."
      successBody="Your profile is live. Hirers browsing /talents can find and message you right now."
      onSubmit={async (answers) => {
        const displayName = profile?.display_name
          || user?.user_metadata?.name
          || user?.user_metadata?.full_name
          || ''
        const slugBase = slugify(displayName) || handleFor(user)
        const slug = profile?.public_slug || await reserveUniqueSlug(slugBase, profile?.id)

        // Build a partial patch — only include fields the user actually
        // filled in. Without this, blank answers would overwrite existing
        // profile data (e.g. clear skills the user set elsewhere).
        const patch = {
          role:           'worker',
          role_chosen_at: profile?.role_chosen_at || new Date().toISOString(),
        }
        if (displayName && !profile?.display_name) patch.display_name = displayName
        const title = answers.role?.trim()
        if (title) patch.title = title
        const skills = parseSkills(answers.skills)
        if (skills.length) patch.skills = skills
        const portfolio = answers.portfolio?.trim()
        if (portfolio) patch.portfolio_url = portfolio
        const experience = answers.experience?.trim()
        if (experience) { patch.experience = experience; patch.bio = experience }
        const availability = answers.availability?.trim()
        if (availability) patch.availability = availability
        // Only include public_slug if the column exists (reserve returns
        // null when migration 0013 hasn't been applied).
        if (slug) patch.public_slug = slug
        const res = await update(patch)
        if (!res.ok) {
          const msg = res.error || 'unknown error'
          console.error('[JoinAsWorker] save failed:', msg)
          alert(
            'Could not save your profile: ' + msg +
            '\n\nIf this mentions a missing column, the Supabase migrations 0012 + 0013 still need to be run in the SQL editor.'
          )
          throw new Error(msg)
        }
      }}
    />
  )
}
