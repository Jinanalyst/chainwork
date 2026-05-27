import React, { useState } from 'react'
import { Icon, navigate } from './ui.jsx'
import { useProfile } from '../hooks/useProfile.js'
import { useT } from '../i18n/index.jsx'

const ROLE_OPTIONS = [
  {
    id:     'hirer',
    titleKey: 'auth.roleModal.hirer',
    subKey:   'auth.roleModal.hirerDesc',
    route:  '#/hirer',
    accent: 'from-brand-400 to-brand-700',
    icon:   <><circle cx="9" cy="7" r="4" /><path d="M2 21v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2" /><path d="M16 11l2 2 4-4" /></>,
  },
  {
    id:     'worker',
    titleKey: 'auth.roleModal.worker',
    subKey:   'auth.roleModal.workerDesc',
    route:  '#/worker',
    accent: 'from-accent-400 to-accent-700',
    icon:   <><path d="M3 7h18M3 12h18M3 17h12" /></>,
  },
  {
    id:     'both',
    titleKey: 'auth.roleModal.both',
    subKey:   'auth.roleModal.bothDesc',
    route:  '#/hirer',
    accent: 'from-violet-500 to-accent-500',
    icon:   <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>,
  },
]

/**
 * First-time role picker. Opens once after sign-in when the user's
 * profiles row has no role_chosen_at. Writes profile.role +
 * role_chosen_at and navigates to the matching dashboard.
 */
export default function RoleSelectModal({ open, onClose }) {
  const { t } = useT()
  const { update } = useProfile()
  const [busy, setBusy] = useState(false)
  const [picked, setPicked] = useState(null)

  if (!open) return null

  const choose = async (option) => {
    if (busy) return
    setPicked(option.id); setBusy(true)
    const res = await update({
      role:           option.id,
      role_chosen_at: new Date().toISOString(),
    })
    setBusy(false)
    if (!res.ok) { setPicked(null); return }
    onClose?.()
    navigate(option.route)
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-ink-950/85 backdrop-blur-md" />
      <div className="relative w-full max-w-2xl rounded-3xl border border-white/10 bg-ink-900 shadow-glow p-6 md:p-10">
        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-bold">{t('auth.roleModal.welcome')}</h2>
          <p className="mt-2 text-sm text-white/65">{t('auth.roleModal.title')}</p>
          <p className="mt-1 text-[11px] text-white/40">{t('auth.roleModal.sub')}</p>
        </div>

        <div className="mt-8 grid sm:grid-cols-3 gap-4">
          {ROLE_OPTIONS.map((o) => (
            <button
              key={o.id}
              onClick={() => choose(o)}
              disabled={busy}
              className={
                'group text-left rounded-2xl border transition p-5 flex flex-col gap-3 ' +
                (picked === o.id
                  ? 'border-white/40 bg-white/[0.06]'
                  : 'border-white/10 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.06]') +
                (busy ? ' opacity-70 cursor-wait' : '')
              }
            >
              <div className={`h-11 w-11 rounded-xl grid place-items-center text-white bg-gradient-to-br ${o.accent}`}>
                <Icon path={o.icon} className="h-5 w-5" />
              </div>
              <div>
                <div className="font-semibold">{t(o.titleKey)}</div>
                <div className="mt-0.5 text-xs text-white/55">{t(o.subKey)}</div>
              </div>
              <div className="mt-auto inline-flex items-center text-xs text-brand-300 group-hover:text-white">
                {picked === o.id && busy ? t('auth.roleModal.saving') : t('auth.roleModal.continue')}
                <Icon path={<path d="M9 6l6 6-6 6" />} className="h-3.5 w-3.5 ml-1" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
