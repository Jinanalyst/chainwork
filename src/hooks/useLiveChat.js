import { useCallback, useEffect, useRef, useState } from 'react'
import { useSession } from './useSession.js'
import {
  ensureThread, loadMessages, sendMessage as svcSend,
  subscribeMessages, isLiveChatReady, walletOf,
} from '../lib/liveChat.js'

/**
 * Live chat for a given task. Returns the current messages, a `send`
 * function, and `ready` (true once Supabase + a wallet are connected).
 *
 *   role:        'hirer' | 'worker' — used to claim a slot on the thread
 *   displayName: shown next to your messages on the other side
 */
export function useLiveChat({ taskId, role, displayName }) {
  const { user } = useSession()
  const wallet = walletOf(user)
  const ready = isLiveChatReady(user) && !!taskId

  const [threadId, setThreadId] = useState(null)
  const [messages, setMessages] = useState([])
  const [error, setError]       = useState(null)
  const seen = useRef(new Set())

  // Resolve (or create) the thread and load history.
  useEffect(() => {
    if (!ready) { setThreadId(null); setMessages([]); seen.current = new Set(); return }
    let cancelled = false
    ;(async () => {
      try {
        const th = await ensureThread({ taskId, role, wallet })
        if (cancelled || !th) return
        setThreadId(th.id)
        const msgs = await loadMessages(th.id)
        if (cancelled) return
        seen.current = new Set(msgs.map((m) => m.id))
        setMessages(msgs)
      } catch (e) { if (!cancelled) setError(e) }
    })()
    return () => { cancelled = true }
  }, [ready, taskId, role, wallet])

  // Subscribe to realtime inserts.
  useEffect(() => {
    if (!threadId) return
    const unsub = subscribeMessages(threadId, (msg) => {
      if (seen.current.has(msg.id)) return
      seen.current.add(msg.id)
      setMessages((prev) => [...prev, msg])
    })
    return unsub
  }, [threadId])

  const send = useCallback(async (body) => {
    const text = (body || '').trim()
    if (!threadId || !wallet || !text) return
    try {
      const inserted = await svcSend({ threadId, body: text, wallet, name: displayName })
      if (inserted && !seen.current.has(inserted.id)) {
        seen.current.add(inserted.id)
        setMessages((prev) => [...prev, inserted])
      }
    } catch (e) { setError(e) }
  }, [threadId, wallet, displayName])

  return { ready, threadId, messages, send, error, wallet }
}
