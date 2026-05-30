import React from 'react'
import { useT } from '../i18n/index.jsx'

/**
 * Canonical category list — used by:
 *   • Home page Categories section
 *   • Talents / Jobs page filters
 *   • Post-task category step
 *   • Matching helper
 *
 * Structural data (id, accent, icon) lives here; the human-readable text
 * (tag, title, blurb, examples) is translated and lives in the i18n
 * dictionaries under the `cat.<id>` key. Use the hooks below to get the
 * localized categories inside React components.
 */
export const CATEGORY_META = [
  {
    id: 'web-dev',
    accent: 'from-brand-400/30 to-brand-500/10',
    icon: <><path d="M16 18l6-6-6-6" /><path d="M8 6l-6 6 6 6" /></>,
  },
  {
    id: 'no-code',
    accent: 'from-amber-400/30 to-rose-500/10',
    icon: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
  },
  {
    id: 'ai-automation',
    accent: 'from-violet-400/30 to-brand-500/10',
    icon: <><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" /></>,
  },
  {
    id: 'marketing',
    accent: 'from-accent-400/30 to-brand-400/10',
    icon: <><path d="M3 11l16-6v14L3 13v-2z" /><path d="M7 15.5a3 3 0 1 1-2-5.6" /></>,
  },
  {
    id: 'ui-ux',
    accent: 'from-accent-400/30 to-emerald-500/10',
    icon: <><circle cx="13.5" cy="6.5" r=".8" /><circle cx="17.5" cy="11.5" r=".8" /><circle cx="8.5" cy="7.5" r=".8" /><circle cx="6.5" cy="12.5" r=".8" /><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c3.31 0 6-2.69 6-6 0-4.42-4.48-8-10-8z" /></>,
  },
  {
    id: 'content',
    accent: 'from-brand-300/30 to-accent-400/10',
    icon: <><path d="M4 6h16M4 12h10M4 18h7" /></>,
  },
  {
    id: 'writing',
    accent: 'from-sky-400/30 to-brand-400/10',
    icon: <><path d="M12 19l7-7 3 3-7 7-3-3z" /><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" /><path d="M2 2l7.586 7.586" /><circle cx="11" cy="11" r="2" /></>,
  },
  {
    id: 'design-graphics',
    accent: 'from-pink-400/30 to-violet-500/10',
    icon: <><circle cx="13.5" cy="6.5" r=".8" /><circle cx="17.5" cy="11.5" r=".8" /><circle cx="8.5" cy="7.5" r=".8" /><circle cx="6.5" cy="12.5" r=".8" /><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c3.31 0 6-2.69 6-6 0-4.42-4.48-8-10-8z" /></>,
  },
  {
    id: 'video-motion',
    accent: 'from-rose-400/30 to-amber-500/10',
    icon: <><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M10 9l5 3-5 3V9z" /></>,
  },
  {
    id: 'data-analytics',
    accent: 'from-emerald-400/30 to-brand-500/10',
    icon: <><path d="M3 3v18h18" /><rect x="7" y="11" width="3" height="6" /><rect x="12" y="7" width="3" height="10" /><rect x="17" y="13" width="3" height="4" /></>,
  },
]

// Plain id list (incl. "all") for non-React id checks (e.g. URL param validation).
export const CATEGORY_IDS = ['all', ...CATEGORY_META.map((c) => c.id)]

/** Localized categories (structural meta merged with translated text). */
export function useCategories() {
  const { t } = useT()
  return CATEGORY_META.map((c) => ({
    ...c,
    tag: t(`cat.${c.id}.tag`),
    title: t(`cat.${c.id}.title`),
    blurb: t(`cat.${c.id}.blurb`),
    examples: t(`cat.${c.id}.examples`),
  }))
}

/** Localized categories prefixed with an "All" option — for filter rows. */
export function useCategoriesWithAll() {
  const { t } = useT()
  const cats = useCategories()
  return [{ id: 'all', title: t('categories.all') }, ...cats.map(({ id, title }) => ({ id, title }))]
}

/** Localized id → title lookup. */
export function useCategoryLabel() {
  const cats = useCategories()
  return Object.fromEntries(cats.map((c) => [c.id, c.title]))
}
