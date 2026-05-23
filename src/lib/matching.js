/**
 * Tiny keyword-overlap matcher. Good enough for MVP; swap for embeddings
 * later if signal isn't strong enough.
 */

import { TALENTS } from '../data/talents.js'

const STOP = new Set([
  'the','and','for','with','from','that','this','our','need','want','have',
  'are','was','will','you','your','use','using','any','some','also','want',
  'just','about','can','build','built','make','made','site','website','app',
  'task','tasks','project','help','please','simple','small','large','small'
])

const tokens = (s) =>
  String(s || '')
    .toLowerCase()
    .split(/[^a-z0-9+#.]+/)
    .filter((t) => t.length > 2 && !STOP.has(t))

// Heuristic category inference from the hirer's free-text "workType".
const CATEGORY_HINTS = {
  'web-dev':       ['landing','launch','mvp','website','webapp','dashboard','api','backend','frontend','deploy','vercel','nextjs','react','fix','bug','responsive','login','auth','speed','slow','crash','feature','build','custom','code'],
  'no-code':       ['webflow','framer','wordpress','shopify','wix','squarespace','no-code','nocode','cms','theme','plugin','elementor','bubble'],
  'ai-automation': ['ai','chatbot','gpt','openai','automation','automate','rag','summarize','agent','llm','workflow','zapier','n8n','make','llama'],
  'web3':          ['web3','wallet','token','nft','dao','crypto','solana','ethereum','onchain','solidity','mint','staking','tokenomics','defi'],
  'ui-ux':         ['design','ui','ux','figma','prototype','wireframe','brand','identity','logo','illustration','redesign','design-system','typography','palette'],
  'content':       ['copy','copywriting','seo','content','blog','article','newsletter','email','marketing','social','strategy','funnel','editorial'],
}

export function inferCategories(workType) {
  const toks = new Set(tokens(workType))
  const hits = []
  for (const [cat, hints] of Object.entries(CATEGORY_HINTS)) {
    const score = hints.reduce((n, h) => n + (toks.has(h) ? 1 : 0), 0)
    if (score > 0) hits.push({ cat, score })
  }
  hits.sort((a, b) => b.score - a.score)
  return hits.map((h) => h.cat)
}

export function scoreTalent(talent, answers = {}) {
  const inferred = inferCategories(answers.workType)
  const queryTokens = [
    ...tokens(answers.workType),
    ...tokens(answers.budget),
    ...tokens(answers.startWhen),
  ]
  const haystack = [
    talent.role,
    talent.about,
    ...talent.skills,
    ...talent.categories,
  ].join(' ').toLowerCase()

  let score = 0
  for (const t of queryTokens) {
    if (haystack.includes(t)) score += 1
  }
  // Category boost: strong signal
  for (const cat of inferred) {
    if (talent.categories.includes(cat)) score += 3
  }
  // Soft signals
  if (talent.verified)              score += 0.5
  if (talent.topRated)              score += 0.5
  if (talent.availability === 'Available now') score += 0.4
  // Tiny tie-breaker: rating
  score += (talent.rating - 4.5) * 0.4
  return score
}

export function matchTalents(answers, { limit = 4 } = {}) {
  return TALENTS
    .map((t) => ({ talent: t, score: scoreTalent(t, answers) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((m) => m.talent)
}
