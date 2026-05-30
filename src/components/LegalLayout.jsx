import React from 'react'
import { Icon, navigate } from './ui.jsx'
import { useT } from '../i18n/index.jsx'

export const LegalSection = ({ title, children }) => (
  <section className="mt-10">
    <h2 className="text-xl md:text-2xl font-semibold text-white">{title}</h2>
    <div className="mt-3 space-y-3 text-white/70 leading-relaxed">{children}</div>
  </section>
)

export default function LegalLayout({ eyebrow, title, effective, children }) {
  const { t } = useT()
  return (
    <div className="mx-auto max-w-3xl px-6 py-14">
      <button
        onClick={() => navigate('#/')}
        className="text-sm text-white/55 hover:text-white inline-flex items-center gap-1.5 mb-6"
      >
        <Icon path={<path d="M15 18l-6-6 6-6" />} className="h-4 w-4" />
        {t('legal.backHome')}
      </button>

      <div className="text-[11px] uppercase tracking-[0.2em] text-accent-300 font-mono">{eyebrow}</div>
      <h1 className="mt-2 text-3xl md:text-5xl font-bold leading-tight">{title}</h1>
      {effective && <p className="mt-3 text-white/55 text-sm">{t('legal.effective')} {effective}</p>}

      {children}

      <div className="mt-16 pt-8 border-t border-white/5 text-xs text-white/40 space-y-1">
        <p>{t('footer.companyName')} · {t('footer.ceo')} {t('footer.ceoName')} · {t('footer.bizNumber')} {t('footer.bizNumberValue')}</p>
        <p>{t('footer.addressValue')}</p>
        <p>{t('footer.customerCenter')} <a className="hover:text-white" href="mailto:jangj6091@gmail.com">jangj6091@gmail.com</a></p>
      </div>
    </div>
  )
}
