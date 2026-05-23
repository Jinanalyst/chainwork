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
    let user = null
    try { user = (await supabase.auth.getUser()).data?.user || null } catch {}
    if (!user) { setProfile(null); setLoading(false); return }

    const { data, error: err } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()
    if (err) { setError(err); setLoading(false); return }

    // Self-heal: if the handle_new_user trigger didn't fire (commonly seen
    // with OAuth providers on some Supabase setups), insert a minimal
    // profile row so downstream code (role picker, dashboards, etc.) has
    // something to read.
    if (!data) {
      const meta = user.user_metadata || {}
      const seed = {
        id:            user.id,
        wallet_address: meta.wallet_address || meta.address || meta.sub || null,
        wallet_chain:   meta.chain || meta.wallet_chain || (meta.iss?.includes('linkedin') ? 'linkedin' : null),
        display_name:   meta.name || meta.full_name || null,
        avatar_url:     meta.picture || meta.avatar_url || null,
        contact_email:  user.email || meta.email || null,
      }
      const { data: created, error: insErr } = await supabase
        .from('profiles')
        .upsert(seed, { onConflict: 'id' })
        .select()
        .maybeSingle()
      if (insErr) {
        console.warn('[useProfile] self-heal upsert failed:', insErr.message)
        setProfile(null)
        setError(insErr)
        setLoading(false)
        return
      }
      setProfile(created || null)
      setLoading(false)
      return
    }

    setProfile(data)
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
