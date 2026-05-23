import { useEffect, useMemo, useState } from 'react'
import { isSupabaseConfigured, supabase } from '../lib/supabase.js'

const ACCENTS = [
  'from-brand-400 to-accent-400',
  'from-violet-400 to-brand-500',
  'from-emerald-400 to-accent-600',
  'from-amber-400 to-rose-500',
  'from-brand-300 to-accent-400',
  'from-accent-400 to-emerald-500',
]

const CATEGORY_KEYWORDS = {
  'web-dev': ['react', 'next', 'web', 'frontend', 'backend', 'api', 'vercel', 'tailwind', 'site', 'app'],
  'no-code': ['webflow', 'framer', 'shopify', 'wordpress', 'cms', 'no-code', 'nocode'],
  'ai-automation': ['ai', 'automation', 'openai', 'agent', 'chatbot', 'rag', 'n8n', 'zapier'],
  web3: ['web3', 'crypto', 'wallet', 'solidity', 'smart contract', 'dao', 'nft', 'solana'],
  'ui-ux': ['design', 'figma', 'brand', 'ux', 'ui', 'product designer'],
  content: ['copy', 'seo', 'content', 'marketing', 'newsletter', 'blog'],
}

const DEFAULT_SKILLS = ['Web builds', 'Fast fixes', 'Remote delivery']

const inferCategories = (text) => {
  const hay = (text || '').toLowerCase()
  const hits = Object.entries(CATEGORY_KEYWORDS)
    .filter(([, words]) => words.some((word) => hay.includes(word)))
    .map(([id]) => id)
  return hits.length ? hits : ['web-dev']
}

const inferSkills = (text) => {
  const hay = (text || '').toLowerCase()
  const skills = [
    ['React', 'react'],
    ['Next.js', 'next'],
    ['Tailwind', 'tailwind'],
    ['Vercel', 'vercel'],
    ['Supabase', 'supabase'],
    ['OpenAI API', 'openai'],
    ['Automation', 'automation'],
    ['Webflow', 'webflow'],
    ['Figma', 'figma'],
    ['Solidity', 'solidity'],
    ['SEO', 'seo'],
    ['Copywriting', 'copy'],
  ]
    .filter(([, key]) => hay.includes(key))
    .map(([label]) => label)
  return skills.length ? skills.slice(0, 6) : DEFAULT_SKILLS
}

const seededNumber = (value, min, max) => {
  const seed = String(value || 'chainwork').split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return min + (seed % (max - min + 1))
}

const normalizeTalent = (row, index) => {
  const text = [row.display_name, row.company, row.bio].filter(Boolean).join(' ')
  const name = row.display_name || 'ChainWork worker'
  const role = row.company || 'Verified ChainWork worker'
  const categories = inferCategories(text)

  return {
    id: row.id,
    name,
    handle: (name || row.id).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    role,
    location: 'Remote',
    accent: ACCENTS[index % ACCENTS.length],
    rating: 5,
    reviews: 0,
    hourlyRate: seededNumber(row.id, 45, 120),
    startingPrice: seededNumber(`${row.id}-start`, 120, 700),
    responseTime: '1d',
    verified: true,
    topRated: false,
    availability: 'Available now',
    categories,
    skills: inferSkills(text),
    about: row.bio || 'Verified ChainWork profile. Invite this worker with a focused brief to start the conversation.',
    portfolio: [ACCENTS[index % ACCENTS.length]],
    source: 'profile',
  }
}

export function useTalents() {
  const [state, setState] = useState({
    talents: [],
    loading: isSupabaseConfigured,
    source: 'profiles',
    error: null,
  })

  useEffect(() => {
    let cancelled = false
    if (!isSupabaseConfigured) {
      setState({ talents: [], loading: false, source: 'profiles', error: 'Supabase not configured' })
      return
    }

    const load = async () => {
      setState((s) => ({ ...s, loading: true, error: null }))
      try {
        const { data, error } = await supabase
          .from('worker_directory')
          .select('id, display_name, company, bio, avatar_url, updated_at')
          .order('updated_at', { ascending: false })
          .limit(60)
        if (cancelled) return
        if (error) {
          setState({ talents: [], loading: false, source: 'profiles', error: error.message })
          return
        }
        setState({
          talents: (data || []).map(normalizeTalent),
          loading: false,
          source: 'profiles',
          error: null,
        })
      } catch (e) {
        if (cancelled) return
        setState({ talents: [], loading: false, source: 'profiles', error: e?.message || String(e) })
      }
    }

    load()
    // Safety net so the page never sits on a stuck spinner.
    const fallback = setTimeout(() => {
      if (!cancelled) setState((s) => ({ ...s, loading: false }))
    }, 6000)

    return () => { cancelled = true; clearTimeout(fallback) }
  }, [])

  return useMemo(() => state, [state])
}
