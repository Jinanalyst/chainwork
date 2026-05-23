import React, { useRef, useState } from 'react'
import { Icon } from './ui.jsx'
import { useProfile } from '../hooks/useProfile.js'
import { uploadPortfolioFile, deletePortfolioFile } from '../lib/storage.js'

const initials = (n) =>
  (n || '?').split(/[\s-]+/).map((p) => p[0] || '').slice(0, 2).join('').toUpperCase()

/**
 * Clickable circular avatar. Shows the user's avatar_url image when set,
 * otherwise renders initials over a gradient. Clicking the avatar (or the
 * pencil overlay on hover) opens the file picker; the chosen image is
 * uploaded to Supabase Storage and the public URL is saved on the
 * profiles row.
 *
 * Props:
 *   name      — fallback for initials (display name or handle)
 *   size      — Tailwind sizing class set, e.g. "h-20 w-20 text-2xl rounded-2xl"
 *   accent    — gradient classes for the placeholder background
 *   ownerId   — auth.uid (required for the upload to pass storage RLS)
 */
export default function AvatarUploader({
  name,
  ownerId,
  size = 'h-20 w-20 text-2xl rounded-2xl',
  accent = 'from-brand-400 to-accent-400',
}) {
  const { profile, update } = useProfile()
  const inputRef = useRef(null)
  const [busy, setBusy] = useState(false)
  const [hover, setHover] = useState(false)
  const url = profile?.avatar_url

  const onPick = () => {
    if (!ownerId) {
      alert('Sign in first to upload a profile photo.')
      return
    }
    inputRef.current?.click()
  }

  const onChange = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !ownerId || busy) return
    if (!/^image\//.test(file.type)) { alert('Pick an image file.'); return }
    if (file.size > 5 * 1024 * 1024) { alert('Image must be under 5 MB.'); return }

    setBusy(true)
    const prevPath = profile?.avatar_storage_path || null
    try {
      const media = await uploadPortfolioFile(file, ownerId)
      const res = await update({
        avatar_url:          media.url,
        avatar_storage_path: media.storage_path,
      })
      if (!res.ok) {
        alert('Could not save avatar: ' + (res.error || 'unknown'))
      } else if (prevPath) {
        // Best-effort cleanup of the previous file.
        deletePortfolioFile(prevPath)
      }
    } catch (err) {
      alert('Upload failed: ' + (err?.message || 'unknown'))
    } finally {
      setBusy(false)
    }
  }

  const clear = async (e) => {
    e.stopPropagation()
    if (!url || busy) return
    if (!confirm('Remove your profile photo?')) return
    setBusy(true)
    const prevPath = profile?.avatar_storage_path || null
    const res = await update({ avatar_url: null, avatar_storage_path: null })
    setBusy(false)
    if (!res.ok) { alert('Could not remove: ' + (res.error || 'unknown')); return }
    if (prevPath) deletePortfolioFile(prevPath)
  }

  return (
    <div
      className={`relative shrink-0 ${size} grid place-items-center font-bold text-ink-950 overflow-hidden cursor-pointer group bg-gradient-to-br ${accent}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onPick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPick() } }}
      aria-label="Change profile photo"
      title="Click to change profile photo"
    >
      {url ? (
        <img src={url} alt={name || 'avatar'} className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <span>{initials(name)}</span>
      )}

      <div className={
        'absolute inset-0 grid place-items-center bg-ink-950/55 backdrop-blur-[2px] text-white transition-opacity ' +
        ((hover || busy) ? 'opacity-100' : 'opacity-0')
      }>
        {busy ? (
          <span className="text-[10px] uppercase tracking-wider">Uploading…</span>
        ) : (
          <div className="flex flex-col items-center gap-0.5">
            <Icon path={<><path d="M23 19V8a2 2 0 0 0-2-2h-3.2L16 4H8L6.2 6H3a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2z" /><circle cx="12" cy="13" r="4" /></>} className="h-5 w-5" />
            <span className="text-[9px] uppercase tracking-wider">Change</span>
          </div>
        )}
      </div>

      {url && !busy && hover && (
        <button
          onClick={clear}
          className="absolute top-1 right-1 h-5 w-5 rounded-full grid place-items-center bg-ink-950/80 hover:bg-ink-950 text-white"
          aria-label="Remove photo"
          title="Remove photo"
        >
          <Icon path={<path d="M6 6l12 12M18 6l-12 12" />} className="h-3 w-3" />
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onChange}
      />
    </div>
  )
}
