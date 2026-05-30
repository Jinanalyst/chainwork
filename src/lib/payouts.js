import { supabase } from './supabase.js'

/**
 * Fetch the matched worker's payout destination for a task. The Supabase
 * RPC enforces that the caller is either the hirer on that task or an
 * admin — otherwise it returns no rows.
 */
export async function fetchTaskWorkerPayout(taskId) {
  if (!supabase || !taskId) return null
  const { data, error } = await supabase.rpc('task_worker_payout', { task_id: taskId })
  if (error) {
    console.warn('[task_worker_payout] failed:', error.message)
    return null
  }
  const row = Array.isArray(data) ? data[0] : data
  if (!row) return null
  return {
    workerId:            row.worker_id,
    displayName:         row.display_name,
    // 'wallet' | 'bank' | null (null = legacy rows from before 0016 — treat
    // as wallet if an address is present, otherwise unset).
    payoutMethod:        row.payout_method
                          || (row.payout_address ? 'wallet' : null),
    payoutAddress:       row.payout_address,
    payoutChain:         row.payout_chain,
    payoutToken:         row.payout_token,
    payoutBankName:      row.payout_bank_name      || null,
    payoutAccountHolder: row.payout_account_holder || null,
    // Account number is NOT returned by the RPC by design — KRW settles
    // via the ChainWork PG, the hirer never sees the worker's bank PII.
  }
}
