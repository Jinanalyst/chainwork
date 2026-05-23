import React, { useState } from 'react'
import { Icon } from './ui.jsx'

/**
 * Reusable card showing one platform escrow address.
 * Theme: 'dark' (default — for the Task Detail modal) | 'warm' (for the
 * post-task success page).
 */
export default function EscrowAddressCard({ wallet, theme = 'dark', reference }) {
  const [copied, setCopied] = useState(false)
  const [refCopied, setRefCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(wallet.address)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // ignore clipboard errors
    }
  }

  const copyRef = async () => {
    if (!reference) return
    try {
      await navigator.clipboard.writeText(reference)
      setRefCopied(true)
      setTimeout(() => setRefCopied(false), 1500)
    } catch {
      // ignore
    }
  }

  const memoLabel = wallet.chainShort === 'TRC20' ? 'Tron memo' : 'Payment memo'

  if (theme === 'warm') {
    return (
      <div className="rounded-2xl border border-warm-ink/10 bg-white/70 backdrop-blur p-4 md:p-5">
        <div className="flex items-center gap-3">
          <div className={`h-10 w-10 rounded-full grid place-items-center text-sm font-bold text-white shrink-0 bg-gradient-to-br ${wallet.tint}`}>
            {wallet.token === 'USDC' ? '$' : '₮'}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-warm-ink">
              {wallet.token} <span className="text-warm-ink/55 font-normal">· {wallet.chain}</span>
            </div>
            <div className="text-xs text-warm-ink/55">Send {wallet.token} on {wallet.chainShort} only</div>
          </div>
        </div>
        <div className="mt-3 rounded-xl bg-warm-ink/[0.04] border border-warm-ink/10 px-3 py-2 flex items-center gap-2">
          <code className="flex-1 min-w-0 text-xs md:text-sm font-mono text-warm-ink/85 truncate">
            {wallet.address}
          </code>
          <button
            onClick={copy}
            className="shrink-0 inline-flex items-center gap-1 text-xs font-medium rounded-full bg-[#1e5be3] text-white px-3 py-1.5 hover:bg-[#1a4cc0] transition"
          >
            {copied ? (
              <>
                <Icon path={<path d="M5 12l4 4 10-10" />} className="h-3.5 w-3.5" />
                Copied
              </>
            ) : (
              <>
                <Icon path={<><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></>} className="h-3.5 w-3.5" />
                Copy
              </>
            )}
          </button>
        </div>
        {reference && (
          <div className="mt-3 rounded-xl bg-[#1e5be3]/[0.06] border border-[#1e5be3]/30 px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-[0.18em] text-warm-ink/55">{memoLabel}</div>
                <code className="block text-xs md:text-sm font-mono text-warm-ink font-semibold truncate">{reference}</code>
              </div>
              <button
                onClick={copyRef}
                className="shrink-0 inline-flex items-center gap-1 text-[11px] font-medium rounded-full bg-warm-ink/85 text-white px-2.5 py-1 hover:bg-warm-ink transition"
              >
                {refCopied ? 'Copied' : 'Copy memo'}
              </button>
            </div>
            <div className="mt-1 text-[11px] text-warm-ink/55 leading-snug">
              Paste this in the {wallet.chainShort === 'TRC20' ? 'memo / message' : 'transaction note'} field so we can credit the payment to your account.
            </div>
          </div>
        )}
        {wallet.explorer && (
          <a
            href={wallet.explorer}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-xs text-[#1e5be3] hover:underline"
          >
            View on explorer
            <Icon path={<><path d="M14 3h7v7" /><path d="M10 14L21 3" /><path d="M21 14v7H3V3h7" /></>} className="h-3 w-3" />
          </a>
        )}
      </div>
    )
  }

  // dark
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <div className="flex items-center gap-3">
        <div className={`h-9 w-9 rounded-full grid place-items-center text-sm font-bold text-white shrink-0 bg-gradient-to-br ${wallet.tint}`}>
          {wallet.token === 'USDC' ? '$' : '₮'}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-sm">
            {wallet.token} <span className="text-white/55 font-normal">· {wallet.chain}</span>
          </div>
          <div className="text-[11px] text-white/45">Send {wallet.token} on {wallet.chainShort} only</div>
        </div>
      </div>
      <div className="mt-3 rounded-lg bg-white/[0.04] border border-white/10 px-3 py-2 flex items-center gap-2">
        <code className="flex-1 min-w-0 text-xs font-mono text-white/85 truncate">{wallet.address}</code>
        <button
          onClick={copy}
          className="shrink-0 inline-flex items-center gap-1 text-[11px] font-medium rounded-full bg-brand-500 hover:bg-brand-600 text-white px-2.5 py-1 transition"
        >
          {copied ? (
            <>
              <Icon path={<path d="M5 12l4 4 10-10" />} className="h-3 w-3" />
              Copied
            </>
          ) : (
            <>
              <Icon path={<><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></>} className="h-3 w-3" />
              Copy
            </>
          )}
        </button>
      </div>
      {reference && (
        <div className="mt-3 rounded-lg bg-brand-500/10 border border-brand-400/30 px-3 py-2">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-[0.18em] text-white/55">{memoLabel}</div>
              <code className="block text-xs font-mono text-white font-semibold truncate">{reference}</code>
            </div>
            <button
              onClick={copyRef}
              className="shrink-0 inline-flex items-center gap-1 text-[11px] font-medium rounded-full bg-white/15 hover:bg-white/25 text-white px-2.5 py-1 transition"
            >
              {refCopied ? 'Copied' : 'Copy memo'}
            </button>
          </div>
          <div className="mt-1 text-[10px] text-white/55 leading-snug">
            Paste in the {wallet.chainShort === 'TRC20' ? 'memo / message' : 'transaction note'} field so the payment is credited correctly.
          </div>
        </div>
      )}
      {wallet.explorer && (
        <a
          href={wallet.explorer}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-[11px] text-brand-300 hover:text-white"
        >
          View on explorer
          <Icon path={<><path d="M14 3h7v7" /><path d="M10 14L21 3" /><path d="M21 14v7H3V3h7" /></>} className="h-3 w-3" />
        </a>
      )}
    </div>
  )
}
