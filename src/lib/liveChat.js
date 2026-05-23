/**
 * Live chat backed by Supabase Realtime.
 *
 * One thread per task (keyed by task_id). Hirer + worker drop into the same
 * room. Both sides identify themselves by wallet (read from the Supabase
 * Web3 JWT). Messages stream to subscribers via the `supabase_realtime`
 * publication on `public.chat_messages`.
 *
 * See supabase/migrations/0001_chat.sql for the schema + RLS.
 */

import { supabase, isSupabaseConfigured } from './supabase.js'

export function walletOf(user) {
  if (!user) return null
  const m = user.user_metadata || {}
  return m.wallet_address || m.address || m.sub || user.id || null
}

export function isLiveChatReady(user) {
  return !!(isSupabaseConfigured && walletOf(user))
}

/** Find — or create — the thread for this task, claiming our role slot. */
export async function ensureThread({ taskId, role, wallet }) {
  if (!supabase || !taskId) return null
  const key = String(taskId)

  const { data: existing, error: selErr } = await supabase
    .from('chat_threads')
    .select('*')
    .eq('task_id', key)
    .maybeSingle()
  if (selErr && selErr.code !== 'PGRST116') throw selErr

  if (existing) {
    const patch = {}
    if (wallet && role === 'hirer'  && !existing.hirer_wallet)  patch.hirer_wallet  = wallet
    if (wallet && role === 'worker' && !existing.worker_wallet) patch.worker_wallet = wallet
    if (Object.keys(patch).length === 0) return existing
    const { data: upd, error: updErr } = await supabase
      .from('chat_threads').update(patch).eq('id', existing.id).select().maybeSingle()
    if (updErr) throw updErr
    return upd || existing
  }

  const row = {
    task_id: key,
    hirer_wallet:  role === 'hirer'  ? wallet : null,
    worker_wallet: role === 'worker' ? wallet : null,
  }
  const { data, error } = await supabase
    .from('chat_threads').insert(row).select().maybeSingle()
  if (error) {
    // Race: another tab inserted first. Re-select.
    const { data: again } = await supabase
      .from('chat_threads').select('*').eq('task_id', key).maybeSingle()
    return again || null
  }
  return data
}

export async function loadMessages(threadId) {
  if (!supabase || !threadId) return []
  const { data, error } = await supabase
    .from('chat_messages').select('*')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data || []
}

export async function sendMessage({ threadId, body, wallet, name }) {
  if (!supabase || !threadId || !wallet || !body) return null
  const { data, error } = await supabase
    .from('chat_messages')
    .insert({ thread_id: threadId, sender_wallet: wallet, sender_name: name || null, body })
    .select().maybeSingle()
  if (error) throw error
  return data
}

/** Subscribe to new messages on a thread. Returns an unsubscribe function. */
export function subscribeMessages(threadId, onInsert) {
  if (!supabase || !threadId) return () => {}
  const channel = supabase
    .channel(`chat:${threadId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `thread_id=eq.${threadId}` },
      (payload) => onInsert(payload.new),
    )
    .subscribe()
  return () => { try { supabase.removeChannel(channel) } catch (_) { /* noop */ } }
}
