import { useEffect, useMemo, useState } from 'react'
import { isSupabaseConfigured, supabase } from '../lib/supabase.js'
import { handleFor, slugFor } from './useSession.js'

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
  const realSkills = Array.isArray(row.skills) ? row.skills.filter(Boolean) : []
  const text = [row.display_name, row.title, row.company, row.bio, realSkills.join(' ')].filter(Boolean).join(' ')
  // Deterministic dashed-words handle from the wallet address (or row id as
  // last resort). Used as the display name when the worker hasn't set one.
  const dashedHandle = handleFor(row.wallet_address || row.id)
  const name = row.display_name || dashedHandle || 'ChainWork worker'
  // Public URL slug — name-based when available, dashed-words otherwise.
  const publicSlug = slugFor(row) || dashedHandle
  const role = row.title || row.company || 'Verified ChainWork worker'
  const categories = inferCategories(text)

  return {
    id: row.id,
    name,
    handle: publicSlug || dashedHandle || (name || row.id).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    role,
    location: row.location || 'Remote',
    accent: ACCENTS[index % ACCENTS.length],
    rating: 5,
    reviews: 0,
    hourlyRate: seededNumber(row.id, 45, 120),
    startingPrice: seededNumber(`${row.id}-start`, 120, 700),
    responseTime: '1d',
    verified: true,
    topRated: false,
    availability: row.availability || 'Available now',
    categories,
    skills: realSkills.length ? realSkills.slice(0, 8) : inferSkills(text),
    about: row.bio || 'Verified ChainWork profile. Invite this worker with a focused brief to start the conversation.',
    portfolio: [ACCENTS[index % ACCENTS.length]],
    portfolioUrl: row.portfolio_url || null,
    source: 'profile',
  }
}

export function useTalents() {
  const [state, setState] = useState({
    talents: [],
    loading: isSupabaseConfigured,
    source: 'profiles',
    error: null,
    legacyFallback: false,
  })

  useEffect(() => {
    let cancelled = false
    if (!isSupabaseConfigured) {
      setState({ talents: [], loading: false, source: 'profiles', error: 'Supabase not configured' })
      return
    }

    // Two-tier select so the directory still loads on databases that
    // haven't applied the latest migrations yet. Newest columns first;
    // if Postgres reports a missing column we retry with the legacy set.
    const FULL_COLS   = 'id, display_name, public_slug, title, company, location, bio, skills, availability, portfolio_url, avatar_url, wallet_address, updated_at'
    const LEGACY_COLS = 'id, display_name, company, bio, avatar_url, wallet_address, updated_at'

    const fetchDirectory = async () => {
      let usedLegacy = false
      let res = await supabase
        .from('worker_directory')
        .select(FULL_COLS)
        .order('updated_at', { ascending: false })
        .limit(60)
      // PostgREST 42703 = undefined_column. Fall back gracefully so a
      // half-migrated DB still produces a usable Talents page.
      if (res.error && /column .* does not exist|42703/i.test(res.error.message)) {
        console.warn('[useTalents] worker_directory missing newer columns — retrying with legacy schema. Apply migrations 0012 + 0013 to fix.')
        usedLegacy = true
        res = await supabase
          .from('worker_directory')
          .select(LEGACY_COLS)
          .order('updated_at', { ascending: false })
          .limit(60)
      }
      return { ...res, usedLegacy }
    }

    const load = async () => {
      setState((s) => ({ ...s, loading: true, error: null }))
      try {
        const { data, error, usedLegacy } = await fetchDirectory()
        if (cancelled) return
        if (error) {
          setState({ talents: [], loading: false, source: 'profiles', error: error.message, legacyFallback: usedLegacy })
          return
        }
        setState({
          talents: (data || []).map(normalizeTalent),
          loading: false,
          source: 'profiles',
          error: null,
          legacyFallback: usedLegacy,
        })
      } catch (e) {
        if (cancelled) return
        setState({ talents: [], loading: false, source: 'profiles', error: e?.message || String(e), legacyFallback: false })
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
