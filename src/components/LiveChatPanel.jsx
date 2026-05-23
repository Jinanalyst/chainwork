import React, { useEffect, useRef, useState } from 'react'
import { Icon } from './ui.jsx'
import { useLiveChat } from '../hooks/useLiveChat.js'
import { shortAddress } from '../hooks/useSession.js'

const fmtTime = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  const diff = (Date.now() - d.getTime()) / 1000
  if (diff < 60)    return 'just now'
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

/**
 * Reusable live-chat panel. Drops into any task context.
 *
 *   taskId       string|number — uniquely identifies the chat room
 *   role         'hirer' | 'worker' — claims the corresponding slot
 *   displayName  optional name shown alongside the wallet on the other side
 *   title, subtitle, emptyHint  optional UI strings
 */
export default function LiveChatPanel({
  taskId, role, displayName,
  title, subtitle, emptyHint,
}) {
  const { ready, messages, send, wallet, error } = useLiveChat({ taskId, role, displayName })
  const [draft, setDraft] = useState('')
  const scroller = useRef(null)

  useEffect(() => {
    if (scroller.current) scroller.current.scrollTop = scroller.current.scrollHeight
  }, [messages.length])

  if (!ready) {
    return (
      <div className="card text-center py-10">
        <div className="text-sm text-white/70">Connect your wallet to chat live.</div>
        <div className="text-[11px] text-white/45 mt-1">Use the Connect wallet button in the top nav.</div>
      </div>
    )
  }

  const submit = () => {
    const v = draft.trim()
    if (!v) return
    send(v)
    setDraft('')
  }

  return (
    <div className="card !p-0 flex flex-col min-h-[50vh] max-h-[70vh]">
      {(title || subtitle) && (
        <div className="px-4 py-3 border-b border-white/10">
          {title    && <div className="font-semibold truncate">{title}</div>}
          {subtitle && <div className="text-[11px] text-white/55 truncate">{subtitle}</div>}
        </div>
      )}

      <div ref={scroller} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-sm text-white/50 text-center py-8">
            {emptyHint || 'No messages yet — say hello.'}
          </div>
        )}
        {messages.map((m) => {
          const me = m.sender_wallet === wallet
          return (
            <div key={m.id} className={'flex ' + (me ? 'justify-end' : 'justify-start')}>
              <div className={
                'max-w-[78%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ' + (me
                  ? 'bg-gradient-to-br from-brand-500 to-brand-700 text-white rounded-br-md'
                  : 'bg-white/[0.06] border border-white/10 text-white/90 rounded-bl-md')
              }>
                {!me && (
                  <div className="text-[10px] uppercase tracking-wider text-white/45 mb-1">
                    {m.sender_name || shortAddress(m.sender_wallet)}
                  </div>
                )}
                <div className="whitespace-pre-wrap break-words">{m.body}</div>
                <div className={'text-[10px] mt-1 ' + (me ? 'text-white/65' : 'text-white/40')}>
                  {fmtTime(m.created_at)}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="px-3 py-3 border-t border-white/10">
        <div className="flex items-end gap-2 rounded-2xl bg-white/[0.04] border border-white/10 px-3 py-2 focus-within:border-brand-300 transition">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() } }}
            rows={1}
            placeholder="Message…"
            className="flex-1 bg-transparent outline-none resize-none text-sm py-1.5 max-h-32"
          />
          <button
            onClick={submit}
            disabled={!draft.trim()}
            className="btn-primary !py-1.5 !px-3 text-xs disabled:opacity-50"
          >
            Send
            <Icon path={<path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />} className="h-3.5 w-3.5" />
          </button>
        </div>
        {error && (
          <div className="mt-2 text-xs text-rose-300">
            {String(error.message || error)}
          </div>
        )}
      </div>
    </div>
  )
}
