import React, { useEffect, useRef, useState } from 'react'
import { Icon } from './ui.jsx'
import { supabase } from '../lib/supabase.js'
import { uploadPortfolioFiles, deletePortfolioFile } from '../lib/storage.js'

/**
 * Editable work-experience timeline with portfolio-style media uploads.
 *
 * NOTE: media files are kept in-memory via object URLs for the MVP — they
 * don't persist across reloads. Wire `uploadFile()` to Supabase Storage
 * (`supabase.storage.from('portfolio').upload(...)`) to make this durable.
 */

const uid = () =>
  (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : `id_${Math.random().toString(36).slice(2)}_${Date.now()}`

// Loaded from Supabase per-user; nothing is seeded.
const INITIAL = []

const blankEntry = () => ({
  id: uid(),
  period: '',
  role: '',
  org: '',
  desc: '',
  media: [],
})

const filesToMedia = (fileList) =>
  Array.from(fileList).map((f) => ({
    id: uid(),
    kind: f.type.startsWith('video/') ? 'video' : 'image',
    url: URL.createObjectURL(f),
    name: f.name,
    caption: '',
    sizeKb: Math.round(f.size / 1024),
  }))

const fromRow = (r) => ({
  id:     r.id,
  period: r.period || '',
  role:   r.role || '',
  org:    r.org || '',
  desc:   r.description || '',
  media:  Array.isArray(r.media) ? r.media : [],
})

const toRow = (e, ownerId) => ({
  id:          e.id,
  owner_id:    ownerId,
  period:      e.period || null,
  role:        e.role || null,
  org:         e.org || null,
  description: e.desc || null,
  // Persist uploaded entries only; skip in-flight optimistic placeholders.
  media:       (e.media || [])
    .filter((m) => !m.uploading && /^https?:\/\//i.test(m.url || ''))
    .map((m) => ({
      id:           m.id,
      kind:         m.kind,
      url:          m.url,
      storage_path: m.storage_path || null,
      name:         m.name || null,
      sizeKb:       m.sizeKb || null,
      caption:      m.caption || '',
    })),
})

export default function ExperienceManager() {
  const [entries, setEntries] = useState(INITIAL)
  const [editing, setEditing] = useState(null)
  const [detail, setDetail]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [ownerId, setOwnerId] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!supabase) return
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (cancelled || !user) return
        setOwnerId(user.id)
        const { data, error } = await supabase
          .from('experience_items')
          .select('*')
          .eq('owner_id', user.id)
          .order('position', { ascending: true })
          .order('created_at', { ascending: false })
        if (cancelled) return
        if (error) console.warn('[experience] load failed:', error.message)
        else setEntries((data || []).map(fromRow))
      } catch (e) {
        console.warn('[experience] load threw:', e?.message || e)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const startAdd  = () => setEditing(blankEntry())
  const startEdit = (entry) => setEditing(structuredClone(entry))
  const cancel    = () => setEditing(null)

  const save = async (entry) => {
    if (!supabase || !ownerId) {
      setEntries((prev) => {
        const exists = prev.some((e) => e.id === entry.id)
        return exists ? prev.map((e) => (e.id === entry.id ? entry : e)) : [entry, ...prev]
      })
      setEditing(null)
      return
    }
    const row = toRow(entry, ownerId)
    const { data, error } = await supabase
      .from('experience_items')
      .upsert(row, { onConflict: 'id' })
      .select()
      .maybeSingle()
    if (error) {
      alert('Could not save entry: ' + error.message)
      return
    }
    const saved = fromRow(data)
    setEntries((prev) => {
      const exists = prev.some((e) => e.id === saved.id)
      return exists ? prev.map((e) => (e.id === saved.id ? saved : e)) : [saved, ...prev]
    })
    setEditing(null)
  }

  const remove = async (id) => {
    const target = entries.find((e) => e.id === id)
    if (supabase && ownerId) {
      const { error } = await supabase.from('experience_items').delete().eq('id', id)
      if (error) { alert('Could not delete: ' + error.message); return }
    }
    ;(target?.media || []).forEach((m) => { if (m.storage_path) deletePortfolioFile(m.storage_path) })
    setEntries((prev) => prev.filter((e) => e.id !== id))
    setEditing(null)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Experience</h2>
        <button
          onClick={startAdd}
          className="inline-flex items-center gap-1.5 text-sm text-brand-300 hover:text-white"
        >
          <Icon path={<path d="M12 5v14M5 12h14" />} className="h-4 w-4" />
          Add entry
        </button>
      </div>

      {loading && (
        <div className="card text-center py-12 text-white/60 text-sm">Loading…</div>
      )}

      {!loading && entries.length === 0 && (
        <div className="card text-center py-12">
          <div className="text-white/70">No experience added yet.</div>
          <button onClick={startAdd} className="btn-primary mt-4">Add your first entry</button>
        </div>
      )}

      <div className="relative pl-6">
        {entries.length > 0 && (
          <div className="absolute left-2 top-1 bottom-1 w-px bg-white/10" />
        )}
        {entries.map((e) => (
          <div key={e.id} className="relative pb-6 last:pb-0">
            <span className="absolute -left-4 top-3 h-3 w-3 rounded-full bg-gradient-to-br from-brand-400 to-accent-400 ring-4 ring-ink-950" />
            <EntryCard
              entry={e}
              onEdit={() => startEdit(e)}
              onOpenMedia={(mediaIndex) => setDetail({ entry: e, mediaIndex })}
            />
          </div>
        ))}
      </div>

      {editing && (
        <EditModal
          entry={editing}
          ownerId={ownerId}
          onChange={setEditing}
          onSave={save}
          onCancel={cancel}
          onDelete={remove}
        />
      )}

      {detail && (
        <DetailModal
          entry={detail.entry}
          startIndex={detail.mediaIndex}
          onClose={() => setDetail(null)}
        />
      )}
    </div>
  )
}

// ---------- Entry card ----------

const EntryCard = ({ entry, onEdit, onOpenMedia }) => (
  <div className="card group">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="text-xs text-white/45 uppercase tracking-wider">{entry.period || 'Period —'}</div>
        <div className="mt-1 font-semibold">
          {entry.role || 'Role —'}
          {entry.org && <span className="text-white/55 font-normal"> · {entry.org}</span>}
        </div>
        {entry.desc && <div className="mt-2 text-sm text-white/70 leading-relaxed whitespace-pre-wrap">{entry.desc}</div>}
      </div>
      <button
        onClick={onEdit}
        className="opacity-60 group-hover:opacity-100 transition shrink-0 h-8 w-8 grid place-items-center rounded-full hover:bg-white/5 text-white/70 hover:text-white"
        aria-label="Edit"
      >
        <Icon path={<><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4z" /></>} className="h-4 w-4" />
      </button>
    </div>

    {entry.media?.length > 0 && (
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {entry.media.slice(0, 4).map((m, i) => (
          <MediaThumb key={m.id} media={m} onClick={() => onOpenMedia(i)} />
        ))}
        {entry.media.length > 4 && (
          <button
            onClick={() => onOpenMedia(4)}
            className="aspect-square rounded-lg border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] grid place-items-center text-sm text-white/75 transition"
          >
            +{entry.media.length - 4} more
          </button>
        )}
      </div>
    )}
  </div>
)

const MediaThumb = ({ media, onClick }) => (
  <button
    onClick={onClick}
    className="relative aspect-square rounded-lg overflow-hidden border border-white/10 group/thumb"
  >
    {media.kind === 'video' ? (
      <>
        <video src={media.url} className="h-full w-full object-cover" muted preload="metadata" />
        <div className="absolute inset-0 bg-black/30 grid place-items-center">
          <div className="h-9 w-9 rounded-full bg-white/85 grid place-items-center text-ink-950">
            <Icon path={<path d="M6 4l14 8-14 8z" />} className="h-4 w-4" />
          </div>
        </div>
      </>
    ) : (
      <img src={media.url} alt={media.caption || media.name} className="h-full w-full object-cover" />
    )}
    <div className="absolute inset-0 bg-gradient-to-t from-ink-950/60 via-transparent opacity-0 group-hover/thumb:opacity-100 transition" />
  </button>
)

// ---------- Edit modal ----------

const EditModal = ({ entry, ownerId, onChange, onSave, onCancel, onDelete }) => {
  const update = (k, v) => onChange({ ...entry, [k]: v })
  const fileInputRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)
  const mediaRef = useRef(entry.media || [])
  useEffect(() => { mediaRef.current = entry.media || [] }, [entry.media])

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onCancel() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  const addFiles = async (fileList) => {
    if (!fileList || !fileList.length) return
    const files = Array.from(fileList)

    const placeholders = files.map((f) => ({
      id:        uid(),
      kind:      f.type.startsWith('video/') ? 'video' : 'image',
      url:       URL.createObjectURL(f),
      name:      f.name,
      sizeKb:    Math.round(f.size / 1024),
      caption:   '',
      uploading: true,
    }))
    mediaRef.current = [...(entry.media || []), ...placeholders]
    update('media', mediaRef.current)

    if (!ownerId) {
      mediaRef.current = mediaRef.current.map((m) =>
        placeholders.some((p) => p.id === m.id) ? { ...m, uploading: false } : m
      )
      update('media', mediaRef.current)
      return
    }

    const results = await uploadPortfolioFiles(files, ownerId)
    let next = mediaRef.current.slice()
    results.forEach((res, i) => {
      const placeholder = placeholders[i]
      const idx = next.findIndex((m) => m.id === placeholder.id)
      if (idx < 0) return
      try { URL.revokeObjectURL(placeholder.url) } catch {}
      if (res.ok) next[idx] = res.media
      else        { next.splice(idx, 1); console.warn('[experience] upload failed:', res.error, res.name) }
    })
    mediaRef.current = next
    update('media', next)

    const failed = results.filter((r) => !r.ok)
    if (failed.length) {
      alert(`${failed.length} file(s) failed to upload: ${failed.map((f) => f.name || '').join(', ')}`)
    }
  }

  const removeMedia = (id) => {
    const m = (entry.media || []).find((x) => x.id === id)
    if (m?.storage_path) deletePortfolioFile(m.storage_path)
    else if (m?.url?.startsWith('blob:')) { try { URL.revokeObjectURL(m.url) } catch {} }
    update('media', (entry.media || []).filter((m) => m.id !== id))
  }

  const setCaption = (id, caption) => {
    update('media', (entry.media || []).map((m) => (m.id === id ? { ...m, caption } : m)))
  }

  const valid = entry.role.trim() && entry.period.trim()

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-ink-950/80 backdrop-blur-md" onClick={onCancel} />
      <div className="relative w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border border-white/10 bg-ink-900 shadow-glow">
        <div className="sticky top-0 z-10 bg-ink-900/95 backdrop-blur px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <div className="font-semibold">{entry.role ? 'Edit experience' : 'Add experience'}</div>
          <button onClick={onCancel} className="h-8 w-8 grid place-items-center rounded-full text-white/60 hover:text-white hover:bg-white/5">
            <Icon path={<path d="M6 6l12 12M18 6l-12 12" />} className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Period">
              <Text value={entry.period} onChange={(v) => update('period', v)} placeholder="2024 – Present" />
            </Field>
            <Field label="Organisation">
              <Text value={entry.org} onChange={(v) => update('org', v)} placeholder="ChainWork" />
            </Field>
          </div>
          <Field label="Role">
            <Text value={entry.role} onChange={(v) => update('role', v)} placeholder="Senior front-end engineer" />
          </Field>
          <Field label="Description" hint="What did you ship? Anything you're proud of?">
            <TextBlock value={entry.desc} onChange={(v) => update('desc', v)} placeholder="Shipped 20+ launches, owned design-system, accessibility, Core Web Vitals…" />
          </Field>

          <Field label="Portfolio media" hint="Drop images or videos to show off the work">
            <div
              onDragEnter={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragOver={(e)  => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault(); setDragOver(false)
                addFiles(e.dataTransfer.files)
              }}
              className={
                'rounded-2xl border-2 border-dashed transition px-5 py-7 text-center cursor-pointer ' +
                (dragOver
                  ? 'border-brand-300 bg-brand-500/10'
                  : 'border-white/10 hover:border-white/25 bg-white/[0.02]')
              }
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                className="hidden"
                onChange={(e) => { addFiles(e.target.files); e.target.value = '' }}
              />
              <div className="mx-auto h-10 w-10 rounded-full bg-white/5 border border-white/10 grid place-items-center text-white/70 mb-2">
                <Icon path={<><path d="M12 16V4M5 11l7-7 7 7" /><path d="M4 20h16" /></>} className="h-5 w-5" />
              </div>
              <div className="text-sm text-white/80">Drag &amp; drop or <span className="text-brand-300 underline-offset-2 hover:underline">browse files</span></div>
              <div className="text-xs text-white/45 mt-1">Images and videos · up to 25MB each</div>
            </div>

            {entry.media?.length > 0 && (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                {entry.media.map((m) => (
                  <div key={m.id} className="rounded-xl border border-white/10 overflow-hidden bg-white/[0.03]">
                    <div className="relative aspect-video">
                      {m.kind === 'video' ? (
                        <video src={m.url} className="h-full w-full object-cover" muted />
                      ) : (
                        <img src={m.url} alt={m.name} className="h-full w-full object-cover" />
                      )}
                      <button
                        onClick={() => removeMedia(m.id)}
                        className="absolute top-1.5 right-1.5 h-7 w-7 grid place-items-center rounded-full bg-ink-950/70 hover:bg-ink-950 text-white"
                        aria-label="Remove"
                      >
                        <Icon path={<path d="M6 6l12 12M18 6l-12 12" />} className="h-3.5 w-3.5" />
                      </button>
                      <span className="absolute bottom-1.5 left-1.5 text-[10px] uppercase tracking-wider bg-ink-950/70 text-white/80 rounded px-1.5 py-0.5">
                        {m.kind}
                      </span>
                      {m.uploading && (
                        <div className="absolute inset-0 grid place-items-center bg-ink-950/55 backdrop-blur-sm text-[11px] text-white">
                          <span className="inline-flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-brand-300 animate-pulse" />
                            Uploading…
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-2">
                      <input
                        value={m.caption}
                        onChange={(e) => setCaption(m.id, e.target.value)}
                        placeholder="Add a caption…"
                        className="w-full bg-transparent border-0 focus:outline-none text-xs text-white/85 placeholder:text-white/30"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <p className="text-[11px] text-white/45 mt-2">
              Uploads are local-only in this preview — wire Supabase Storage to make them permanent.
            </p>
          </Field>
        </div>

        <div className="sticky bottom-0 bg-ink-900/95 backdrop-blur px-6 py-4 border-t border-white/5 flex items-center justify-between gap-3">
          <button
            onClick={() => onDelete(entry.id)}
            className="text-sm text-rose-300 hover:text-rose-200"
          >
            Delete entry
          </button>
          <div className="flex items-center gap-2">
            <button onClick={onCancel} className="btn-ghost !py-2 !px-4 text-sm">Cancel</button>
            <button
              onClick={() => valid && onSave(entry)}
              disabled={!valid}
              className="btn-primary !py-2 !px-4 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const Field = ({ label, hint, children }) => (
  <label className="block">
    <div className="flex items-baseline justify-between mb-1.5">
      <span className="text-sm font-medium text-white/85">{label}</span>
      {hint && <span className="text-xs text-white/40">{hint}</span>}
    </div>
    {children}
  </label>
)

const Text = ({ value, onChange, placeholder }) => (
  <input
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-white placeholder:text-white/35 focus:outline-none focus:border-brand-300 transition"
  />
)

const TextBlock = ({ value, onChange, placeholder }) => (
  <textarea
    value={value}
    onChange={(e) => onChange(e.target.value)}
    rows={4}
    placeholder={placeholder}
    className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-white placeholder:text-white/35 focus:outline-none focus:border-brand-300 transition resize-y min-h-[100px]"
  />
)

// ---------- Detail / lightbox modal ----------

const DetailModal = ({ entry, startIndex = 0, onClose }) => {
  const [i, setI] = useState(startIndex)
  const media = entry.media || []
  const current = media[i]

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') setI((x) => Math.min(media.length - 1, x + 1))
      if (e.key === 'ArrowLeft')  setI((x) => Math.max(0, x - 1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [media.length, onClose])

  if (!current) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6">
      <div className="absolute inset-0 bg-ink-950/90 backdrop-blur" onClick={onClose} />
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-2xl border border-white/10 bg-ink-900 overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs text-white/45 uppercase tracking-wider">{entry.period}</div>
            <div className="font-semibold truncate">
              {entry.role}
              {entry.org && <span className="text-white/55 font-normal"> · {entry.org}</span>}
            </div>
          </div>
          <button onClick={onClose} className="h-8 w-8 grid place-items-center rounded-full text-white/70 hover:text-white hover:bg-white/5 shrink-0">
            <Icon path={<path d="M6 6l12 12M18 6l-12 12" />} className="h-4 w-4" />
          </button>
        </div>

        <div className="relative flex-1 bg-black grid place-items-center min-h-[50vh]">
          {current.kind === 'video' ? (
            <video src={current.url} controls autoPlay className="max-h-[70vh] w-full object-contain" />
          ) : (
            <img src={current.url} alt={current.caption || current.name} className="max-h-[70vh] w-full object-contain" />
          )}
          {media.length > 1 && (
            <>
              <button
                onClick={() => setI((x) => Math.max(0, x - 1))}
                disabled={i === 0}
                className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 grid place-items-center rounded-full bg-ink-950/70 hover:bg-ink-950 text-white disabled:opacity-30"
              >
                <Icon path={<path d="M15 18l-6-6 6-6" />} className="h-5 w-5" />
              </button>
              <button
                onClick={() => setI((x) => Math.min(media.length - 1, x + 1))}
                disabled={i === media.length - 1}
                className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 grid place-items-center rounded-full bg-ink-950/70 hover:bg-ink-950 text-white disabled:opacity-30"
              >
                <Icon path={<path d="M9 6l6 6-6 6" />} className="h-5 w-5" />
              </button>
            </>
          )}
        </div>

        <div className="px-5 py-3 border-t border-white/5">
          {current.caption && <div className="text-sm text-white/85 mb-2">{current.caption}</div>}
          {entry.desc && <div className="text-sm text-white/65 leading-relaxed whitespace-pre-wrap">{entry.desc}</div>}
        </div>

        {media.length > 1 && (
          <div className="px-5 py-3 border-t border-white/5 flex gap-2 overflow-x-auto">
            {media.map((m, idx) => (
              <button
                key={m.id}
                onClick={() => setI(idx)}
                className={
                  'shrink-0 h-14 w-20 rounded-md overflow-hidden border transition ' +
                  (idx === i ? 'border-brand-300' : 'border-white/10 opacity-70 hover:opacity-100')
                }
              >
                {m.kind === 'video' ? (
                  <video src={m.url} className="h-full w-full object-cover" muted />
                ) : (
                  <img src={m.url} alt="" className="h-full w-full object-cover" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
