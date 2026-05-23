import React from 'react'

/**
 * Canonical category list — used by:
 *   • Home page Categories section
 *   • Talents page filter
 *   • Matching helper
 *
 * Add or rename here and it propagates everywhere.
 */
export const CATEGORIES = [
  {
    id: 'web-dev',
    tag: 'Dev',
    title: 'Web Development',
    blurb: 'Custom sites and web apps built from scratch — front-end, back-end, deploys, fixes.',
    examples: ['Landing page', 'SaaS MVP', 'Web app', 'API integration', 'Bug fix', 'Vercel deploy'],
    accent: 'from-brand-400/30 to-brand-500/10',
    icon: <><path d="M16 18l6-6-6-6" /><path d="M8 6l-6 6 6 6" /></>,
  },
  {
    id: 'no-code',
    tag: 'No-Code',
    title: 'No-Code & Website Builder',
    blurb: 'Fast builds in Webflow, Framer, Wordpress, or Shopify — without writing code.',
    examples: ['Webflow site', 'Framer landing', 'WordPress theme', 'Shopify store', 'Squarespace setup', 'Wix migration'],
    accent: 'from-amber-400/30 to-rose-500/10',
    icon: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
  },
  {
    id: 'ai-automation',
    tag: 'AI',
    title: 'AI Automation',
    blurb: 'Chatbots, agents, summarizers, and AI-powered workflows on top of your site.',
    examples: ['AI chatbot', 'RAG over docs', 'Email automation', 'Content summarizer', 'OpenAI API', 'Lead-capture bot'],
    accent: 'from-violet-400/30 to-brand-500/10',
    icon: <><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" /></>,
  },
  {
    id: 'web3',
    tag: 'Web3',
    title: 'Web3 & Crypto',
    blurb: 'Wallet UIs, token sites, NFT and DAO dashboards, smart contracts and on-chain data.',
    examples: ['Token landing', 'Wallet connect UI', 'NFT mint page', 'DAO dashboard', 'Smart contract', 'On-chain widget'],
    accent: 'from-accent-400/30 to-brand-400/10',
    icon: <><path d="M12 2l9 5v10l-9 5-9-5V7z" /><path d="M3 7l9 5 9-5M12 12v10" /></>,
  },
  {
    id: 'ui-ux',
    tag: 'Design',
    title: 'UI/UX & Design',
    blurb: 'Product design, brand identity, design systems, and conversion-focused layouts.',
    examples: ['Figma redesign', 'Design system', 'Brand identity', 'Logo + assets', 'Marketing illustrations', 'App UX'],
    accent: 'from-accent-400/30 to-emerald-500/10',
    icon: <><circle cx="13.5" cy="6.5" r=".8" /><circle cx="17.5" cy="11.5" r=".8" /><circle cx="8.5" cy="7.5" r=".8" /><circle cx="6.5" cy="12.5" r=".8" /><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c3.31 0 6-2.69 6-6 0-4.42-4.48-8-10-8z" /></>,
  },
  {
    id: 'content',
    tag: 'Content',
    title: 'Content & Marketing',
    blurb: 'Copywriting, SEO, content strategy, email sequences, social media setup.',
    examples: ['Landing page copy', 'Blog series', 'SEO audit', 'Email sequence', 'Social posts', 'Newsletter setup'],
    accent: 'from-brand-300/30 to-accent-400/10',
    icon: <><path d="M3 11l16-6v14L3 13v-2z" /><path d="M7 15.5a3 3 0 1 1-2-5.6" /></>,
  },
]

// Used by filter rows that need an explicit "All" option
export const CATEGORIES_WITH_ALL = [
  { id: 'all', title: 'All' },
  ...CATEGORIES.map(({ id, title }) => ({ id, title })),
]

// Quick id → title lookup
export const CATEGORY_LABEL = Object.fromEntries(CATEGORIES.map((c) => [c.id, c.title]))
