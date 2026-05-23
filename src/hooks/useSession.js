import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'

export function useSession() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase) { setLoading(false); return }
    let mounted = true

    // Both paths must flip `loading` to false, otherwise gates that wait on
    // session-load (e.g. App's needsAuth gate) stay stuck when the persisted
    // session restores via onAuthStateChange before getSession() resolves.
    supabase.auth.getSession()
      .then(({ data }) => {
        if (!mounted) return
        setSession(data.session)
      })
      .catch((e) => { console.warn('[useSession] getSession failed:', e?.message || e) })
      .finally(() => { if (mounted) setLoading(false) })

    const { data: sub } = supabase.auth.onAuthStateChange((_evt, s) => {
      if (!mounted) return
      setSession(s)
      setLoading(false)
    })

    return () => { mounted = false; sub.subscription.unsubscribe() }
  }, [])

  return { session, loading, user: session?.user || null }
}

export function shortAddress(addr) {
  if (!addr) return ''
  return addr.slice(0, 6) + '…' + addr.slice(-4)
}

export function getWalletDisplay(user) {
  if (!user) return null
  const meta = user.user_metadata || {}
  return meta.wallet_address || meta.address || meta.sub || user.id?.slice(0, 6)
}
