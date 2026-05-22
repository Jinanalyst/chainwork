import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'

export function useSession() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase) { setLoading(false); return }
    let mounted = true
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setSession(data.session)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, s) => {
      setSession(s)
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
