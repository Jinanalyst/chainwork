import React, { useState } from 'react'
import { Icon } from './ui.jsx'
import { useProfile } from '../hooks/useProfile.js'
import { navigate } from './ui.jsx'

/**
 * Small inline control on each dashboard.
 *   - `otherRole = 'worker'` on the hirer dashboard: offers "Also become a worker"
 *   - `otherRole = 'hirer'`  on the worker dashboard: offers "Also become a hirer"
 *
 * If the user is already 'both', shows a "Switch to {otherRole} dashboard" link
 * instead. If their role is not yet set (null), renders nothing — the
 * first-time picker handles that case.
 */
export default function RoleSwitcher({ otherRole }) {
  const { profile, update } = useProfile()
  const [busy, setBusy] = useState(false)

  if (!profile || !profile.role) return null

  const role = profile.role
  const isBoth = role === 'both'

  const upgradeToBoth = async () => {
    if (busy) return
    setBusy(true)
    await update({ role: 'both', role_chosen_at: new Date().toISOString() })
    setBusy(false)
  }

  const targetHref = otherRole === 'hirer' ? '#/hirer' : '#/worker'

  if (isBoth) {
    return (
      <button
        onClick={() => navigate(targetHref)}
        className="inline-flex items-center gap-1.5 rounded-full border border-white/15 hover:border-white/35 px-3 py-1.5 text-xs text-white/75 hover:text-white transition"
      >
        <Icon path={<><path d="M16 3h5v5" /><path d="M8 21H3v-5" /><path d="M21 3l-7 7" /><path d="M3 21l7-7" /></>} className="h-3.5 w-3.5" />
        Switch to {otherRole} dashboard
      </button>
    )
  }

  // role === 'hirer' or 'worker' (single)
  return (
    <button
      onClick={upgradeToBoth}
      disabled={busy}
      className="inline-flex items-center gap-1.5 rounded-full border border-accent-400/40 bg-accent-400/10 hover:bg-accent-400/15 px-3 py-1.5 text-xs text-accent-100 transition disabled:opacity-60"
    >
      <Icon path={<><circle cx="12" cy="12" r="9" /><path d="M12 8v8M8 12h8" /></>} className="h-3.5 w-3.5" />
      {busy ? 'Updating…' : `Also become a ${otherRole}`}
    </button>
  )
}
