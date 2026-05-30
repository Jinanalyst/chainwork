import { useCallback, useEffect, useMemo, useState } from 'react'
import { isSupabaseConfigured, supabase } from '../lib/supabase.js'
import { inferCategories } from '../lib/matching.js'

// ---------- formatting helpers ----------

const relTime = (iso) => {
  if (!iso) return ''
  const ms = Date.now() - new Date(iso).getTime()
  if (ms < 60_000)        return 'just now'
  const m = Math.floor(ms / 60_000)
  if (m < 60)             return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24)             return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 30)             return `${d}d ago`
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

const fmtMoney = (cents, currency = 'USD') => {
  if (cents == null) return null
  const v = cents / 100
  const formatted = v.toLocaleString(undefined, { maximumFractionDigits: 0 })
  return currency === 'USD' ? `$${formatted}` : `${formatted} ${currency}`
}

// ---------- shape DB row → UI job ----------

const shapeJob = (row) => {
  // Prefer the category the hirer explicitly chose; fall back to inferring
  // one from the title/description so legacy posts are still categorized.
  const category = row.category || inferCategories(`${row.title} ${row.description || ''}`)[0] || null
  return {
    id: row.id,
    title: row.title || 'Untitled job',
    description: row.description || '',
    category,
    skills: Array.isArray(row.skills) ? row.skills.filter(Boolean) : [],
    budgetCents: row.budget_cents ?? null,
    budgetCurrency: row.budget_currency || 'USD',
    budget: fmtMoney(row.budget_cents, row.budget_currency),
    // Employer's average rating (1–5), left by workers. Null until the
    // employer-rating backend is wired (and hirer_rating added to JOB_COLS).
    rating: row.hirer_rating != null ? Number(row.hirer_rating) : null,
    paymentStructure: row.payment_structure || null,
    hirer: {
      name: row.hirer_company || row.hirer_name || 'A ChainWork hirer',
      avatar: row.hirer_avatar || null,
    },
    postedAt: relTime(row.created_at),
    createdAt: row.created_at,
    _raw: row,
  }
}

const JOB_COLS =
  'id, title, description, category, skills, budget_cents, budget_currency, payment_structure, deadline, created_at, last_activity_at, hirer_name, hirer_company, hirer_avatar'

// ---------- hook ----------

export function useJobs() {
  const [jobs, setJobs]       = useState([])
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [error, setError]     = useState(null)

  const load = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) {
      setJobs([]); setLoading(false); return
    }
    setError(null)
    const { data, error: err } = await supabase
      .from('job_listings')
      .select(JOB_COLS)
      .order('created_at', { ascending: false })
      .limit(200)

    if (err) {
      console.error('[ChainWork] useJobs load error:', err)
      setError(err.message); setJobs([]); setLoading(false); return
    }
    setJobs((data || []).map(shapeJob))
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  // Realtime: re-fetch the board whenever a task is posted or its status
  // changes (open → in_escrow drops it off the board). RLS scopes delivery;
  // signed-out visitors simply won't receive live pushes, which is fine —
  // the next page load reflects the latest state.
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return
    const ch = supabase
      .channel('chainwork:jobs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => load())
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [load])

  return useMemo(() => ({ jobs, loading, error, refresh: load }), [jobs, loading, error, load])
}
