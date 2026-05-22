import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../lib/supabase.js'

// ---------- formatting helpers ----------

const STATUS_LABEL = {
  open:             'Open',
  in_escrow:        'In escrow',
  in_progress:      'In progress',
  awaiting_review:  'Awaiting review',
  completed:        'Completed',
  disputed:         'Disputed',
  cancelled:        'Cancelled',
}

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

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : ''

const fmtMoney = (cents, currency = 'USD') => {
  if (cents == null) return '—'
  const v = cents / 100
  const formatted = v.toLocaleString(undefined, { maximumFractionDigits: 0 })
  return currency === 'USD' ? `$${formatted}` : `${formatted} ${currency}`
}

// ---------- shape DB row → UI task ----------

const shapeTask = (row) => ({
  id: row.id,
  title: row.title,
  category: row.category,
  status: STATUS_LABEL[row.status] || row.status,
  employer: row.employer ? {
    id:      row.employer.id,
    name:    row.employer.display_name,
    company: row.employer.company,
    contact: row.employer.contact_email,
  } : null,
  talent: row.talent ? {
    id:   row.talent.id,
    name: row.talent.display_name,
  } : null,
  budget:           fmtMoney(row.budget_cents, row.budget_currency),
  deadline:         fmtDate(row.deadline),
  lastActivity:     relTime(row.last_activity_at),
  progress:         row.progress ?? 0,
  paymentStructure: row.payment_structure || null,
  description:  row.description,
  skills:       row.skills || [],
  url:          row.url,
  attachments: (row.attachments || []).map((a) => ({ id: a.id, label: a.label, url: a.url })),
  timeline: (row.timeline || [])
    .slice()
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    .map((t) => ({ id: t.id, label: t.label, when: fmtDate(t.created_at), by: t.by_name })),
  notes: (row.notes || [])
    .slice()
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    .map((n) => ({
      id:   n.id,
      by:   n.author?.display_name || 'Anonymous',
      when: relTime(n.created_at),
      body: n.body,
    })),
  _raw: row,
})

const TASKS_SELECT = `
  *,
  employer:profiles!tasks_hirer_id_fkey  (id, display_name, company, contact_email),
  talent:profiles!tasks_talent_id_fkey   (id, display_name),
  attachments:task_attachments           (id, label, url),
  timeline:task_timeline                 (id, label, by_name, created_at),
  notes:task_notes                       (id, body, created_at, author:profiles!task_notes_author_id_fkey (id, display_name))
`

// ---------- hook ----------

export function useTasks() {
  const [tasks, setTasks]     = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const userIdRef = useRef(null)

  const load = useCallback(async () => {
    if (!supabase) { setLoading(false); return }
    setError(null)
    const { data: { user } } = await supabase.auth.getUser()
    userIdRef.current = user?.id || null
    if (!user) { setTasks([]); setLoading(false); return }

    const { data, error: err } = await supabase
      .from('tasks')
      .select(TASKS_SELECT)
      .or(`hirer_id.eq.${user.id},talent_id.eq.${user.id}`)
      .order('last_activity_at', { ascending: false })

    if (err) {
      console.error('[ChainWork] useTasks load error:', err)
      setError(err); setLoading(false); return
    }
    setTasks((data || []).map(shapeTask))
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  // Realtime: re-fetch on relevant inserts/updates. RLS filters delivery.
  useEffect(() => {
    if (!supabase) return
    const ch = supabase
      .channel('chainwork:tasks')
      .on('postgres_changes', { event: '*',      schema: 'public', table: 'tasks' },         () => load())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'task_notes' },    () => load())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'task_timeline' }, () => load())
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [load])

  const addNote = useCallback(async (taskId, body) => {
    if (!supabase) return { ok: false, error: 'Supabase not configured' }
    const userId = userIdRef.current
    if (!userId) return { ok: false, error: 'Not signed in' }
    const { error: err } = await supabase
      .from('task_notes')
      .insert({ task_id: taskId, author_id: userId, body })
    if (err) {
      console.error('[ChainWork] addNote failed:', err)
      return { ok: false, error: err.message }
    }
    return { ok: true }
  }, [])

  return useMemo(
    () => ({ tasks, loading, error, addNote, refresh: load, userId: userIdRef.current }),
    [tasks, loading, error, addNote, load],
  )
}
