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
  weth:    '0x4200000000000000000000000000000000000006',
  usdcDecimals: 6,
  explorer: 'https://basescan.org',
  // Uniswap V3 on Base
  swapRouter: '0x2626664c2603336E57B271c5C0b26F421741e481', // SwapRouter02
  quoterV2:   '0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a',
  usdcWethFee: 500, // 0.05% — canonical USDC/WETH pool on Base
}

// PeripheryPayments constants used by SwapRouter02
const MSG_SENDER   = '0x0000000000000000000000000000000000000001'
const ADDRESS_THIS = '0x0000000000000000000000000000000000000002'

const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function transfer(address,uint256) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
]

const QUOTER_ABI = [
  // QuoterV2 — exactInput single-hop quote. Non-view: must be invoked via staticCall.
  'function quoteExactInputSingle((address tokenIn,address tokenOut,uint256 amountIn,uint24 fee,uint160 sqrtPriceLimitX96)) returns (uint256 amountOut, uint160 sqrtPriceX96After, uint32 initializedTicksCrossed, uint256 gasEstimate)',
]

const SWAP_ROUTER_ABI = [
  'function exactInputSingle((address tokenIn,address tokenOut,uint24 fee,address recipient,uint256 amountIn,uint256 amountOutMinimum,uint160 sqrtPriceLimitX96)) payable returns (uint256 amountOut)',
  'function unwrapWETH9(uint256 amountMinimum, address recipient) payable',
  'function multicall(bytes[] data) payable returns (bytes[] results)',
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

/**
 * Reveal the recovery phrase. Requires the passcode — we re-decrypt the
 * keystore each time to guarantee a freshly verified passcode and not just
 * pull it from the in-memory wallet (which could be unlocked indefinitely).
 * Returns the 12-word mnemonic string. Throws on wrong passcode.
 */
export async function revealMnemonic(passcode) {
  const { value } = await Preferences.get({ key: KEYSTORE_KEY })
  if (!value) throw new Error('No wallet stored on this device')
  const w = await Wallet.fromEncryptedJson(value, passcode)
  const phrase = w?.mnemonic?.phrase
  if (!phrase) throw new Error('No recovery phrase on this wallet (imported by private key only).')
  return phrase
}

/* ── settings preferences (cosmetic toggles persisted across launches) ── */
const SETTINGS_KEY = 'chainpay.settings.v1'
const DEFAULT_SETTINGS = {
  faceId:         false,
  autoLock:       '1m',
  displayCurrency: 'USD',
  language:       'en',
  notifications:  true,
  networks:       { base: true, eth: false, sol: false, pol: false, btc: false, arb: false, sui: false },
}
export async function loadSettings() {
  const { value } = await Preferences.get({ key: SETTINGS_KEY })
  if (!value) return DEFAULT_SETTINGS
  try { return { ...DEFAULT_SETTINGS, ...JSON.parse(value) } } catch { return DEFAULT_SETTINGS }
}
export async function saveSettings(next) {
  await Preferences.set({ key: SETTINGS_KEY, value: JSON.stringify(next) })
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

/* ── Uniswap V3 swap (USDC ↔ ETH on Base, executed inside ChainPay) ─── */

/**
 * Get a quote for swapping `amountIn` of `tokenIn` (raw units) into `tokenOut`.
 * Returns the raw output amount as bigint. Calls QuoterV2.staticCall — no gas.
 */
export async function getQuote({ tokenIn, tokenOut, amountIn }) {
  const q = new Contract(BASE.quoterV2, QUOTER_ABI, provider())
  const params = {
    tokenIn, tokenOut, amountIn,
    fee: BASE.usdcWethFee,
    sqrtPriceLimitX96: 0n,
  }
  const [amountOut] = await q.quoteExactInputSingle.staticCall(params)
  return amountOut
}

/** Read USDC allowance for the SwapRouter02 spender. */
export async function getUsdcAllowance(owner) {
  const c = new Contract(BASE.usdc, ERC20_ABI, provider())
  return c.allowance(owner, BASE.swapRouter)
}

/** Approve SwapRouter02 to pull USDC. Pass MAX to approve max uint256. */
export async function approveUsdc(wallet, amount) {
  const c = new Contract(BASE.usdc, ERC20_ABI, wallet)
  return c.approve(BASE.swapRouter, amount)
}

export const MAX_UINT256 = (1n << 256n) - 1n

/**
 * Swap ETH → USDC.
 * Sends `amountInWei` as msg.value. SwapRouter02 wraps to WETH internally.
 * `minOut` is the slippage-protected minimum USDC output (raw 6-decimal units).
 */
export async function swapEthForUsdc(wallet, amountInWei, minOut) {
  const r = new Contract(BASE.swapRouter, SWAP_ROUTER_ABI, wallet)
  const params = {
    tokenIn:  BASE.weth,
    tokenOut: BASE.usdc,
    fee:      BASE.usdcWethFee,
    recipient: wallet.address,
    amountIn: amountInWei,
    amountOutMinimum: minOut,
    sqrtPriceLimitX96: 0n,
  }
  return r.exactInputSingle(params, { value: amountInWei })
}

/**
 * Swap USDC → ETH.
 * Two-step multicall: swap USDC → WETH (kept in router), then unwrap WETH → ETH
 * and send to the user. Caller must ensure USDC allowance ≥ amountIn first.
 */
export async function swapUsdcForEth(wallet, amountIn, minOutWei) {
  const r = new Contract(BASE.swapRouter, SWAP_ROUTER_ABI, wallet)
  const swapParams = {
    tokenIn:  BASE.usdc,
    tokenOut: BASE.weth,
    fee:      BASE.usdcWethFee,
    recipient: ADDRESS_THIS,           // keep WETH inside router for unwrap
    amountIn,
    amountOutMinimum: minOutWei,
    sqrtPriceLimitX96: 0n,
  }
  const data1 = r.interface.encodeFunctionData('exactInputSingle', [swapParams])
  const data2 = r.interface.encodeFunctionData('unwrapWETH9', [minOutWei, wallet.address])
  return r.multicall([data1, data2])
}

export { formatUnits, parseUnits }
