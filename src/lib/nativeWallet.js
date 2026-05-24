/**
 * Native (in-app) wallet for ChainPay Android.
 *
 * Generates and signs locally using ethers v6. Stores the encrypted JSON
 * keystore via Capacitor Preferences. The user picks a passcode at first
 * launch; the keystore is decrypted into memory only after unlock.
 *
 * Threat model for this prototype:
 *   - Passcode-derived key wraps the secp256k1 private key (scrypt + AES-GCM
 *     via ethers' standard encryptedJson format).
 *   - Storage is sandboxed by Android per-app, so other apps can't read it
 *     without root.
 *   - NOT backed by Android Keystore yet (Phase 2). Acceptable for a debug-
 *     signed early-access build; do not store life-savings in this.
 */

import { Preferences } from '@capacitor/preferences'
import { Wallet, HDNodeWallet, Mnemonic, JsonRpcProvider, parseUnits, formatUnits, Contract } from 'ethers'

const KEYSTORE_KEY = 'chainpay.keystore.v1'
const MNEMONIC_FLAG = 'chainpay.mnemonic-confirmed.v1'

export const BASE = {
  chainId: 8453,
  rpc:     'https://mainnet.base.org',
  usdc:    '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  usdcDecimals: 6,
  explorer: 'https://basescan.org',
}

const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function transfer(address,uint256) returns (bool)',
]

let _provider = null
export function provider() {
  if (!_provider) _provider = new JsonRpcProvider(BASE.rpc, BASE.chainId, { staticNetwork: true })
  return _provider
}

/** Has the user ever set up a wallet on this device? */
export async function hasWallet() {
  const { value } = await Preferences.get({ key: KEYSTORE_KEY })
  return !!value
}

/** Has the user confirmed they backed up the mnemonic? */
export async function mnemonicConfirmed() {
  const { value } = await Preferences.get({ key: MNEMONIC_FLAG })
  return value === '1'
}
export async function setMnemonicConfirmed() {
  await Preferences.set({ key: MNEMONIC_FLAG, value: '1' })
}

/**
 * Create a brand-new wallet from a fresh 12-word mnemonic.
 * Returns the wallet (in-memory only — caller must encrypt + persist with `save`).
 */
export function createWallet() {
  const mnemonic = Mnemonic.fromEntropy(crypto.getRandomValues(new Uint8Array(16)))
  const hd = HDNodeWallet.fromMnemonic(mnemonic, "m/44'/60'/0'/0/0")
  return { wallet: hd.connect(provider()), mnemonic: mnemonic.phrase }
}

/** Import an existing 12/24-word mnemonic. */
export function importMnemonic(phrase) {
  const m = Mnemonic.fromPhrase(phrase.trim())
  const hd = HDNodeWallet.fromMnemonic(m, "m/44'/60'/0'/0/0")
  return { wallet: hd.connect(provider()), mnemonic: m.phrase }
}

/**
 * Encrypt a wallet with the user's passcode and persist it.
 * Uses ethers' standard encryptedJson keystore (scrypt + AES-CTR).
 */
export async function save(walletOrPk, passcode) {
  const w = typeof walletOrPk === 'string' ? new Wallet(walletOrPk) : walletOrPk
  const json = await w.encrypt(passcode)
  await Preferences.set({ key: KEYSTORE_KEY, value: json })
}

/** Unlock the stored wallet with the passcode. Throws on wrong passcode. */
export async function unlock(passcode) {
  const { value } = await Preferences.get({ key: KEYSTORE_KEY })
  if (!value) throw new Error('No wallet stored on this device')
  const w = await Wallet.fromEncryptedJson(value, passcode)
  return w.connect(provider())
}

/** Wipe the wallet (used by "Reset wallet" + onboarding restarts). */
export async function reset() {
  await Preferences.remove({ key: KEYSTORE_KEY })
  await Preferences.remove({ key: MNEMONIC_FLAG })
}

/* ── balances + sends ─────────────────────────────────────────────────── */
export async function getBalances(address) {
  const p = provider()
  const usdc = new Contract(BASE.usdc, ERC20_ABI, p)
  const [eth, u] = await Promise.all([
    p.getBalance(address),
    usdc.balanceOf(address),
  ])
  return { eth, usdc: u }
}

export async function sendUSDC(wallet, to, amountStr) {
  const c = new Contract(BASE.usdc, ERC20_ABI, wallet)
  const raw = parseUnits(amountStr, BASE.usdcDecimals)
  const tx = await c.transfer(to, raw)
  return tx
}

export async function sendETH(wallet, to, amountStr) {
  const value = parseUnits(amountStr, 18)
  const tx = await wallet.sendTransaction({ to, value })
  return tx
}

export { formatUnits, parseUnits }
