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
