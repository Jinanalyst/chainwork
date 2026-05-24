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

import { Capacitor } from '@capacitor/core'
import { Preferences } from '@capacitor/preferences'
import { BiometricAuth, BiometryError } from '@aparajita/capacitor-biometric-auth'
import { LocalNotifications } from '@capacitor/local-notifications'
import { Wallet, HDNodeWallet, Mnemonic, JsonRpcProvider, parseUnits, formatUnits, Contract } from 'ethers'

const isNative = () => { try { return Capacitor.isNativePlatform() } catch { return false } }

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

/* ── biometric unlock ─────────────────────────────────────────────────
 *
 * On native Android (Capacitor): uses BiometricPrompt via
 *   @aparajita/capacitor-biometric-auth. The biometric prompt gates access
 *   to the stored passcode; the passcode is AES-GCM encrypted at rest in
 *   Capacitor Preferences (sandboxed per-app on Android).
 *
 * In browser (vite preview / chainwork.chainbrief.kr): falls back to
 *   WebAuthn `navigator.credentials.create/get` against the device's
 *   platform authenticator (Face ID / Touch ID / Windows Hello).
 *
 * Note: storage is sandboxed but not Secure-Enclave/Keystore bound. Phase 2
 * will move the encryption key into Android Keystore behind BiometricPrompt.
 */
const BIO_KEY = 'chainpay.biometric.v1'

function b64encode(bytes) { return btoa(String.fromCharCode(...new Uint8Array(bytes))) }
function b64decode(s) { return Uint8Array.from(atob(s), (c) => c.charCodeAt(0)) }

async function deriveBioKey(material) {
  const km = await crypto.subtle.importKey('raw', material, 'PBKDF2', false, ['deriveKey'])
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: new TextEncoder().encode('chainpay-biometric-v1'), iterations: 120_000, hash: 'SHA-256' },
    km, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'],
  )
}

export async function biometricAvailable() {
  if (isNative()) {
    try {
      const r = await BiometricAuth.checkBiometry()
      return !!r?.isAvailable
    } catch { return false }
  }
  if (typeof window === 'undefined') return false
  if (!window.PublicKeyCredential || !window.isSecureContext) return false
  try { return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable() }
  catch { return false }
}

export async function hasBiometric() {
  const { value } = await Preferences.get({ key: BIO_KEY })
  return !!value
}

export async function enableBiometric(passcode) {
  // Verify passcode first.
  await unlock(passcode)

  if (isNative()) {
    // Prompt biometric to confirm enrolment.
    try {
      await BiometricAuth.authenticate({
        reason: 'Enable Face ID for ChainPay',
        cancelTitle: 'Cancel',
        androidTitle: 'ChainPay',
        androidSubtitle: 'Use your fingerprint or face to unlock',
        allowDeviceCredential: false,
      })
    } catch (e) {
      const msg = e instanceof BiometryError ? e.message : (e?.message || 'Biometric prompt cancelled.')
      throw new Error(msg)
    }
    // Encrypt the passcode using a key derived from an app-level secret.
    // The secret is generated once per install and lives alongside the blob
    // — gating happens at the BiometricPrompt layer above.
    let { value: secretB64 } = await Preferences.get({ key: BIO_KEY + '.secret' })
    if (!secretB64) {
      const s = crypto.getRandomValues(new Uint8Array(32))
      secretB64 = b64encode(s)
      await Preferences.set({ key: BIO_KEY + '.secret', value: secretB64 })
    }
    const key = await deriveBioKey(b64decode(secretB64))
    const iv  = crypto.getRandomValues(new Uint8Array(12))
    const enc = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(passcode))
    await Preferences.set({ key: BIO_KEY, value: JSON.stringify({
      kind: 'native', ivB64: b64encode(iv), encB64: b64encode(enc),
    }) })
    return
  }

  // Browser path — WebAuthn enrolment.
  const challenge = crypto.getRandomValues(new Uint8Array(32))
  const userId    = crypto.getRandomValues(new Uint8Array(16))
  const cred = await navigator.credentials.create({
    publicKey: {
      challenge,
      rp: { name: 'ChainPay' },
      user: { id: userId, name: 'chainpay-user', displayName: 'ChainPay wallet' },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7   },
        { type: 'public-key', alg: -257 },
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
        residentKey: 'preferred',
      },
      timeout: 60_000,
      attestation: 'none',
    },
  })
  if (!cred) throw new Error('Biometric setup was cancelled.')
  const credentialId = new Uint8Array(cred.rawId)
  const key = await deriveBioKey(credentialId)
  const iv  = crypto.getRandomValues(new Uint8Array(12))
  const enc = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(passcode))
  await Preferences.set({ key: BIO_KEY, value: JSON.stringify({
    kind: 'webauthn',
    credentialIdB64: b64encode(credentialId),
    ivB64:           b64encode(iv),
    encB64:          b64encode(enc),
  }) })
}

export async function disableBiometric() {
  await Preferences.remove({ key: BIO_KEY })
  await Preferences.remove({ key: BIO_KEY + '.secret' })
}

/** Run the biometric prompt and return an unlocked wallet on success. */
export async function biometricUnlock() {
  const { value } = await Preferences.get({ key: BIO_KEY })
  if (!value) throw new Error('Biometrics are not set up on this device.')
  const blob = JSON.parse(value)

  if (blob.kind === 'native') {
    if (!isNative()) throw new Error('This wallet was enrolled on a different platform. Re-enable Face ID.')
    try {
      await BiometricAuth.authenticate({
        reason: 'Unlock ChainPay',
        cancelTitle: 'Cancel',
        androidTitle: 'ChainPay',
        androidSubtitle: 'Use your fingerprint or face to unlock',
        allowDeviceCredential: false,
      })
    } catch (e) {
      const msg = e instanceof BiometryError ? e.message : (e?.message || 'Biometric prompt cancelled.')
      throw new Error(msg)
    }
    const { value: secretB64 } = await Preferences.get({ key: BIO_KEY + '.secret' })
    if (!secretB64) throw new Error('Biometric key missing. Re-enable Face ID.')
    const key = await deriveBioKey(b64decode(secretB64))
    let passBytes
    try { passBytes = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: b64decode(blob.ivB64) }, key, b64decode(blob.encB64),
    ) } catch { throw new Error('Biometric key no longer matches. Disable & re-enable Face ID.') }
    return unlock(new TextDecoder().decode(passBytes))
  }

  // WebAuthn (browser) path.
  if (blob.kind !== 'webauthn' && !blob.credentialIdB64) throw new Error('Biometric record is corrupt.')
  const credentialId = b64decode(blob.credentialIdB64)
  const challenge = crypto.getRandomValues(new Uint8Array(32))
  const assertion = await navigator.credentials.get({
    publicKey: {
      challenge,
      allowCredentials: [{ id: credentialId, type: 'public-key' }],
      userVerification: 'required',
      timeout: 60_000,
    },
  })
  if (!assertion) throw new Error('Biometric prompt cancelled.')
  const key = await deriveBioKey(credentialId)
  let passBytes
  try { passBytes = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: b64decode(blob.ivB64) }, key, b64decode(blob.encB64),
  ) } catch { throw new Error('Biometric key no longer matches. Disable & re-enable Face ID.') }
  return unlock(new TextDecoder().decode(passBytes))
}

/* ── notifications (native LocalNotifications + web fallback) ─────────── */
export async function requestNotificationPermission() {
  if (isNative()) {
    try {
      const r = await LocalNotifications.requestPermissions()
      return r?.display === 'granted'
    } catch { return false }
  }
  if (typeof Notification === 'undefined') return false
  let perm = Notification.permission
  if (perm === 'default') perm = await Notification.requestPermission()
  return perm === 'granted'
}

export async function fireNotification(title, body) {
  if (isNative()) {
    try {
      await LocalNotifications.schedule({
        notifications: [{ id: Math.floor(Date.now() % 2_000_000_000), title, body, smallIcon: 'ic_stat_icon_config_sample' }],
      })
    } catch {}
    return
  }
  if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    try { new Notification(title, { body }) } catch {}
  }
}

/* ── price feed (USD + KRW, for the display-currency setting) ─────────── */
let _priceCache = { ts: 0, eth: { USD: 0, KRW: 0 }, usdcKrw: 1340 }
export async function getPrices() {
  const now = Date.now()
  if (now - _priceCache.ts < 60_000 && _priceCache.eth.USD > 0) return _priceCache
  try {
    const r = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum,usd-coin&vs_currencies=usd,krw')
    const j = await r.json()
    _priceCache = {
      ts: now,
      eth:     { USD: Number(j?.ethereum?.usd) || 0, KRW: Number(j?.ethereum?.krw) || 0 },
      usdcKrw: Number(j?.['usd-coin']?.krw) || _priceCache.usdcKrw,
    }
  } catch {}
  return _priceCache
}

/* ── tiny i18n for in-app strings ─────────────────────────────────────── */
const STRINGS = {
  en: {
    total_balance: 'Total balance', send: 'Send', receive: 'Receive', swap: 'Swap', buy: 'Buy',
    assets: 'Assets', activity: 'Activity', activity_empty: 'Your recent transactions appear here.',
    settings: 'Settings',
    sec_accounts: 'Accounts', sec_security: 'Security', sec_networks: 'Networks',
    sec_preferences: 'Preferences', sec_help: 'Help & legal',
    row_face_id: 'Face ID / Biometrics', row_auto_lock: 'Auto-lock', row_recovery: 'Recovery phrase',
    row_display_currency: 'Display currency', row_language: 'Language', row_notifications: 'Notifications',
    row_help: 'Help center', row_privacy: 'Privacy & terms',
    detail_face_off: 'Sign in with your device biometric — passcode still required to send.',
    detail_face_unavailable: 'No platform biometric detected on this device.',
    detail_face_on: 'Enrolled. Tap the toggle to disable.',
    detail_recovery: 'Reveal — verify your backup is correct',
    auto_1m: '1 minute', auto_5m: '5 minutes', auto_never: 'Never',
    lock_signout: 'Lock & sign out',
    reset_wallet: 'Reset wallet (requires recovery phrase to restore)',
    welcome_back: 'Welcome back', enter_passcode: 'Enter your passcode to unlock ChainPay.',
    unlock: 'Unlock', unlock_face: 'Unlock with Face ID', forgot: 'Forgot passcode · reset wallet',
    confirm_passcode: 'Confirm passcode', enable: 'Enable', cancel: 'Cancel',
    notif_enabled: 'ChainPay notifications are on.', notif_blocked: 'Notifications were blocked in browser settings.',
  },
  ko: {
    total_balance: '전체 잔액', send: '보내기', receive: '받기', swap: '스왑', buy: '구매',
    assets: '자산', activity: '활동', activity_empty: '최근 거래가 여기에 표시됩니다.',
    settings: '설정',
    sec_accounts: '계정', sec_security: '보안', sec_networks: '네트워크',
    sec_preferences: '환경설정', sec_help: '도움말 및 약관',
    row_face_id: 'Face ID / 생체인증', row_auto_lock: '자동 잠금', row_recovery: '복구 문구',
    row_display_currency: '표시 통화', row_language: '언어', row_notifications: '알림',
    row_help: '도움말 센터', row_privacy: '개인정보 및 약관',
    detail_face_off: '기기 생체인증으로 잠금 해제 — 송금은 여전히 암호가 필요합니다.',
    detail_face_unavailable: '이 기기에서 사용 가능한 생체인증을 찾을 수 없습니다.',
    detail_face_on: '등록 완료. 스위치를 눌러 해제하세요.',
    detail_recovery: '확인 — 백업이 올바른지 표시',
    auto_1m: '1분', auto_5m: '5분', auto_never: '사용 안 함',
    lock_signout: '잠금 및 로그아웃',
    reset_wallet: '지갑 초기화 (복원하려면 복구 문구 필요)',
    welcome_back: '다시 오신 것을 환영합니다', enter_passcode: '암호를 입력하여 ChainPay를 잠금 해제하세요.',
    unlock: '잠금 해제', unlock_face: 'Face ID로 잠금 해제', forgot: '암호 분실 · 지갑 초기화',
    confirm_passcode: '암호 확인', enable: '활성화', cancel: '취소',
    notif_enabled: 'ChainPay 알림이 켜졌습니다.', notif_blocked: '브라우저 설정에서 알림이 차단되었습니다.',
  },
}
export function t(lang, key) { return (STRINGS[lang] || STRINGS.en)[key] || STRINGS.en[key] || key }

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
