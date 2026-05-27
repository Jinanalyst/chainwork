import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../lib/supabase.js'

const fmtMoney = (cents, currency = 'USD') => {
  if (cents == null) return '—'
  const v = cents / 100
  const formatted = v.toLocaleString(undefined, { maximumFractionDigits: 0 })
  return currency === 'USD' ? `$${formatted}` : `${formatted} ${currency}`
}

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : ''

const relTime = (iso) => {
  if (!iso) return ''
  const ms = Date.now() - new Date(iso).getTime()
  if (ms < 60_000) return 'just now'
  const m = Math.floor(ms / 60_000)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}

const shapeOffer = (row) => {
  const t = row.task || {}
  return {
    id:               row.id,
    status:           row.status,
    taskId:           t.id,
    title:            t.title,
    description:      t.description,
    category:         t.category || 'general',
    skills:           t.skills || [],
    budget:           fmtMoney(t.budget_cents, t.budget_currency),
    deadline:         fmtDate(t.deadline),
    paymentStructure: t.payment_structure,
    postedAgo:        relTime(t.created_at),
    employer: t.employer ? {
      id:      t.employer.id,
      name:    t.employer.display_name,
      company: t.employer.company,
    } : null,
    _raw: row,
  }
}

const OFFERS_SELECT = `
  id, status, created_at,
  task:tasks (
    id, title, description, category, skills,
    budget_cents, budget_currency, deadline,
    payment_structure, created_at,
    employer:profiles!tasks_hirer_id_fkey (id, display_name, company)
  )
`

export function useOffers() {
  const [offers, setOffers]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const userIdRef = useRef(null)

  const load = useCallback(async () => {
    if (!supabase) { setLoading(false); return }
    setError(null)
    const { data: { user } } = await supabase.auth.getUser()
    userIdRef.current = user?.id || null
    if (!user) { setOffers([]); setLoading(false); return }

    const { data, error: err } = await supabase
      .from('offers')
      .select(OFFERS_SELECT)
      .eq('worker_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (err) {
      console.error('[ChainWork] useOffers load error:', err)
      setError(err); setLoading(false); return
    }
    setOffers((data || []).filter((r) => r.task).map(shapeOffer))
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  // Realtime: re-fetch on any offer change for this worker.
  useEffect(() => {
    if (!supabase) return
    const ch = supabase
      .channel('chainwork:offers')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'offers' }, () => load())
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [load])

  const respond = useCallback(async (offerId, status) => {
    if (!supabase) return { ok: false, error: 'Supabase not configured' }
    const userId = userIdRef.current
    if (!userId) return { ok: false, error: 'Not signed in' }
    const { error: err } = await supabase
      .from('offers')
      .update({ status, responded_at: new Date().toISOString() })
      .eq('id', offerId)
      .eq('worker_id', userId)
    if (err) {
      console.error('[ChainWork] offer respond failed:', err)
      return { ok: false, error: err.message }
    }
    // If accepted, claim the task: set talent_id + status='in_progress'.
    if (status === 'accepted') {
      const offer = offers.find((o) => o.id === offerId)
      if (offer?.taskId) {
        const { error: tErr } = await supabase
          .from('tasks')
          .update({ talent_id: userId, status: 'in_progress', last_activity_at: new Date().toISOString() })
          .eq('id', offer.taskId)
          .eq('status', 'open')
        if (tErr) console.warn('[ChainWork] task claim failed:', tErr)
      }
    }
    setOffers((cur) => cur.filter((o) => o.id !== offerId))
    return { ok: true }
  }, [offers])

  const accept  = useCallback((id) => respond(id, 'accepted'), [respond])
  const decline = useCallback((id) => respond(id, 'declined'), [respond])

  return useMemo(
    () => ({ offers, loading, error, accept, decline, refresh: load }),
    [offers, loading, error, accept, decline, load],
  )
}
