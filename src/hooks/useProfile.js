import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'

/**
 * Loads the current signed-in user's profiles row and exposes a helper to
 * update / upsert it. Returns { profile, loading, error, refresh, update }.
 */
export function useProfile() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  const load = useCallback(async () => {
    if (!supabase) { setLoading(false); return }
    setError(null)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setProfile(null); setLoading(false); return }
    const { data, error: err } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()
    if (err) { setError(err); setLoading(false); return }
    setProfile(data || null)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (!supabase) return
    const { data: sub } = supabase.auth.onAuthStateChange(() => load())
    return () => sub.subscription.unsubscribe()
  }, [load])

  const update = useCallback(async (patch) => {
    if (!supabase) return { ok: false, error: 'Supabase not configured' }
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { ok: false, error: 'Not signed in' }
    const row = { id: user.id, ...patch }
    const { data, error: err } = await supabase
      .from('profiles')
      .upsert(row, { onConflict: 'id' })
      .select()
      .maybeSingle()
    if (err) return { ok: false, error: err.message }
    setProfile(data)
    return { ok: true, profile: data }
  }, [])

  return { profile, loading, error, refresh: load, update }
}
