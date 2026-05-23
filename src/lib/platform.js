/**
 * Platform escrow configuration.
 *
 * For the MVP, ChainWork operates a manual escrow: hirers send their budget
 * to one of these platform-controlled addresses, and we release the payout
 * to the worker's wallet by hand within 24h of approval.
 *
 * When we ship programmatic escrow (smart contract or Supabase + custodial),
 * replace this file with addresses derived per-task instead of a global one.
 */

export const PLATFORM_WALLETS = [
  {
    id:       'usdc-base',
    token:    'USDC',
    chain:    'Base',
    chainShort: 'Base',
    address:  '0x7a459149d910087d358cb46a9f70fd650738f446',
    explorer: 'https://basescan.org/address/0x7a459149d910087d358cb46a9f70fd650738f446',
    tint:     'from-brand-400 to-brand-700',
    note:     'EVM address — send USDC on Base only. Do not send from Ethereum mainnet.',
  },
  {
    id:       'usdt-tron',
    token:    'USDT',
    chain:    'Tron (TRC20)',
    chainShort: 'TRC20',
    address:  'TCUMVPmaTXfk4Xk9vHeyHED1DLAkw6DEAQ',
    explorer: 'https://tronscan.org/#/address/TCUMVPmaTXfk4Xk9vHeyHED1DLAkw6DEAQ',
    tint:     'from-accent-400 to-accent-700',
    note:     'Tron address — send USDT on TRC20 only.',
  },
]

export const ESCROW_RELEASE_NOTE =
  'ChainWork holds funds in escrow and releases payouts to the worker\'s wallet manually within 24 hours of approval.'

export const truncateAddress = (a) =>
  a && a.length > 14 ? `${a.slice(0, 6)}…${a.slice(-6)}` : (a || '')

/**
 * Payment references / memos.
 *
 * Each payment to a shared platform wallet carries a unique short code so we
 * can attribute incoming USDC/USDT to the right hirer, task, or Pro
 * membership. Hirers include the code in the on-chain memo (Tron supports
 * memos natively) and ALSO submit the tx hash via the proof form so an admin
 * can verify on-chain even when the memo is missing.
 *
 *   CW-T-XXXXXX  → task escrow funding
 *   CW-U-XXXXXX  → per-user / per-hirer reference
 *   CW-P-XXXXXX  → ChainWork Pro yearly membership (with hire count suffix)
 */

// Deterministic short hash → 6 char base32-ish code. Same seed → same code.
const REF_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ' // no 0/1/I/O
function shortHash(seed) {
  const s = String(seed || '')
  let h = 2166136261 >>> 0
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619) >>> 0
  }
  let out = ''
  for (let i = 0; i < 6; i++) {
    out += REF_ALPHABET[h % REF_ALPHABET.length]
    h = Math.floor(h / REF_ALPHABET.length) || (h * 2654435761) >>> 0
  }
  return out
}

export function taskReference(taskId) {
  return `CW-T-${shortHash(`task:${taskId || Date.now()}`)}`
}

export function userReference(user) {
  const seed = user?.id || user?.email || user?.user_metadata?.wallet_address || 'anon'
  return `CW-U-${shortHash(`user:${seed}`)}`
}

export function proReference(user, hires) {
  const base = shortHash(`pro:${user?.id || user?.email || 'anon'}`)
  return `CW-P-${base}-N${hires}`
}

const PROOF_STORAGE_KEY = 'chainwork.paymentProofs.v1'

export function savePaymentProof(proof) {
  if (typeof window === 'undefined') return
  const list = loadPaymentProofs()
  list.unshift({
    ...proof,
    submittedAt: new Date().toISOString(),
  })
  try {
    window.localStorage.setItem(PROOF_STORAGE_KEY, JSON.stringify(list.slice(0, 200)))
  } catch {
    // quota / private mode — ignore
  }
}

export function loadPaymentProofs() {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(PROOF_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}
