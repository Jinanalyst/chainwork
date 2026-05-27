import React from 'react'
import { useT } from '../i18n/index.jsx'

export default function LanguageSwitcher({ className = '' }) {
  const { lang, setLang, t } = useT()
  const next = lang === 'ko' ? 'en' : 'ko'
  const label = next === 'ko' ? '한국어' : 'EN'
  return (
    <button
      type="button"
      onClick={() => setLang(next)}
      aria-label={t('lang.switchTo')}
      className={
        'inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/[0.04] hover:border-white/30 px-2.5 py-1.5 text-xs text-white/80 hover:text-white transition ' +
        className
      }
      title={t('lang.switchTo')}
    >
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
      </svg>
      <span className="font-medium">{label}</span>
    </button>
  )
}
