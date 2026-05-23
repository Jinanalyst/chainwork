/**
 * Platform fee + currency helpers used across the worker dashboard.
 *
 * One knob — PLATFORM_FEE_RATE — controls everything that displays a
 * "gross / fee / net" breakdown.
 */

export const PLATFORM_FEE_RATE = 0.10 // 10% to the platform

export const platformFee = (gross) =>
  Math.round((Number(gross) || 0) * PLATFORM_FEE_RATE * 100) / 100

export const workerNet = (gross) => {
  const g = Number(gross) || 0
  return Math.round((g - platformFee(g)) * 100) / 100
}

export const fmtUSD = (n) => {
  if (n == null || isNaN(n)) return '$0'
  // Drop trailing .00 for whole numbers so "$950" stays clean
  const opts = Number.isInteger(n)
    ? { maximumFractionDigits: 0 }
    : { minimumFractionDigits: 2, maximumFractionDigits: 2 }
  return '$' + n.toLocaleString(undefined, opts)
}

/** Parse a formatted budget string like "$1,200" or "$1.2k" back to a number. */
export const parseBudget = (s) => {
  if (typeof s === 'number') return s
  if (!s) return 0
  const str = String(s).trim().toLowerCase()
  let mult = 1
  if (str.endsWith('k')) mult = 1_000
  if (str.endsWith('m')) mult = 1_000_000
  const n = parseFloat(str.replace(/[^0-9.]/g, ''))
  return isNaN(n) ? 0 : Math.round(n * mult)
}
