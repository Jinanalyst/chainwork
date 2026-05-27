import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import ko from './locales/ko.js'
import en from './locales/en.js'

const DICTS = { ko, en }
const STORAGE_KEY = 'chainwork.lang'

function detectLang() {
  if (typeof window === 'undefined') return 'ko'
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (saved === 'ko' || saved === 'en') return saved
  } catch {}
  const nav = (typeof navigator !== 'undefined' && (navigator.language || navigator.userLanguage)) || ''
  return nav.toLowerCase().startsWith('ko') ? 'ko' : 'en'
}

function lookup(dict, key) {
  if (!dict || !key) return undefined
  if (dict[key] !== undefined) return dict[key]
  const parts = key.split('.')
  let node = dict
  for (const p of parts) {
    if (node && typeof node === 'object' && p in node) node = node[p]
    else return undefined
  }
  return node
}

function format(str, vars) {
  if (typeof str !== 'string' || !vars) return str
  return str.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => (vars[k] !== undefined ? String(vars[k]) : ''))
}

const I18nContext = createContext({ lang: 'ko', setLang: () => {}, t: (k) => k })

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(detectLang)

  useEffect(() => {
    try { window.localStorage.setItem(STORAGE_KEY, lang) } catch {}
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang
    }
  }, [lang])

  const setLang = useCallback((next) => {
    if (next === 'ko' || next === 'en') setLangState(next)
  }, [])

  const t = useCallback((key, vars) => {
    const primary = lookup(DICTS[lang], key)
    if (primary !== undefined) return format(primary, vars)
    const fallback = lookup(DICTS.en, key)
    if (fallback !== undefined) return format(fallback, vars)
    return key
  }, [lang])

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useT() {
  return useContext(I18nContext)
}
