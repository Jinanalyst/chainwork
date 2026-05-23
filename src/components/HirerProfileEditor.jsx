import React from 'react'
import ProfileEditor from './ProfileEditor.jsx'

// Hirer-specific question flow: same engine as the worker editor, different
// fields. Keys here map to the editor's internal profile shape; the consumer
// (HirerDashboard.saveProfile) maps them to DB columns.
const QUESTIONS = [
  { id: 'name',       prompt: "What's your full name?",            placeholder: 'Your full name',         required: true,  shortLabel: 'Name' },
  { id: 'company',    prompt: "What's your company name?",          placeholder: 'Acme Inc.',              required: false, shortLabel: 'Company',
    hint: 'Optional — leave blank if you hire as an individual.' },
  { id: 'role',       prompt: 'What is your role there?',           placeholder: 'Founder, Hiring manager…', required: false, shortLabel: 'Role',
    hint: 'Shown next to your name on offers and chats.' },
  { id: 'location',   prompt: 'Where is your team based?',          placeholder: 'City, Country',          required: false, shortLabel: 'Location' },
  { id: 'email',      prompt: "What's your contact email?",          placeholder: 'you@company.com',        required: true,  type: 'email', shortLabel: 'Contact',
    hint: 'Only workers you engage with will see this.' },
  { id: 'bio',        prompt: "Tell workers what you typically hire for.", placeholder: 'We post landing-page builds, AI integrations, and Web3 dashboards.', long: true, required: false, shortLabel: 'About',
    hint: 'A sentence or two helps the right workers self-select.' },
  { id: 'websiteUrl', prompt: 'Company or personal website?',        placeholder: 'https://yourcompany.com', required: false, type: 'url', shortLabel: 'Website',
    hint: 'Optional — gives workers context before they accept.' },
  { id: '__socials',  prompt: 'Add your social links.',              hint: 'Optional — leave blank to skip.', shortLabel: 'Socials',
    kind: 'socials' },
]

const SOCIAL_FIELDS = [
  { key: 'twitter',  label: 'X / Twitter', placeholder: 'x.com/your-handle' },
  { key: 'linkedin', label: 'LinkedIn',    placeholder: 'linkedin.com/in/your-handle' },
  { key: 'website',  label: 'Other',       placeholder: 'a second site or link' },
]

export default function HirerProfileEditor({ open, initial, onClose, onSave }) {
  return (
    <ProfileEditor
      open={open}
      initial={initial}
      onClose={onClose}
      onSave={onSave}
      questions={QUESTIONS}
      socialFields={SOCIAL_FIELDS}
      eyebrow="Edit hirer profile"
    />
  )
}
