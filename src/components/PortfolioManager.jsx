import React, { useEffect, useRef, useState } from 'react'
import { Icon } from './ui.jsx'
import { supabase } from '../lib/supabase.js'
import { uploadPortfolioFiles, deletePortfolioFile } from '../lib/storage.js'

/**
 * Editable portfolio of work samples.
 *
 * Each project carries: title, description, role, skills, public URL,
 * proof links (GitHub, Live site, Client confirmation…), and optional
 * media (images / videos).
 *
 * Media is held as object URLs in this MVP — swap for Supabase Storage
 * to persist.
 */

const uid = () =>
  (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : `id_${Math.random().toString(36).slice(2)}_${Date.now()}`

const PROOF_PRESETS = ['GitHub', 'Live site', 'Client confirmation', 'Case study', 'Figma']
const COVER_PRESETS = [
  'from-brand-400 to-brand-700',
  'from-violet-400 to-brand-500',
  'from-accent-400 to-brand-500',
  'from-emerald-400 to-accent-600',
  'from-amber-400 to-rose-500',
  'from-brand-300 to-accent-400',
]

// Portfolio entries are loaded from Supabase per-user; nothing is seeded.
const INITIAL = []

const blankProject = () => ({
  id: uid(),
  title: '',
  description: '',
  role: '',
  skills: [],
  url: '',
  proof: [],
  cover: COVER_PRESETS[Math.floor(Math.random() * COVER_PRESETS.length)],
  media: [],
})

const filesToMedia = (fileList) =>
  Array.from(fileList).map((f) => ({
    id: uid(),
    kind: f.type.startsWith('video/') ? 'video' : 'image',
    url: URL.createObjectURL(f),
    name: f.name,
    caption: '',
  }))

const normalizeUrl = (u) => {
  if (!u) return ''
  if (/^https?:\/\//i.test(u)) return u
  return 'https://' + u.replace(/^\/+/, '')
}

const stripProtocol = (u) => (u || '').replace(/^https?:\/\//i, '').replace(/\/$/, '')

// Map DB row → UI shape used by ProjectCard / EditModal.
const fromRow = (r) => ({
  id:          r.id,
  title:       r.title || '',
  description: r.description || '',
  role:        r.role || '',
  skills:      r.skills || [],
  url:         r.url || '',
  proof:       Array.isArray(r.proof) ? r.proof : [],
  media:       Array.isArray(r.media) ? r.media : [],
  cover:       r.cover || COVER_PRESETS[0],
})

const toRow = (p, ownerId) => ({
  id:          p.id,
  owner_id:    ownerId,
  title:       p.title?.trim() || '',
  description: p.description || null,
  role:        p.role || null,
  skills:      p.skills || [],
  url:         p.url || null,
  proof:       p.proof || [],
  // Persist only uploaded entries (http(s) URL). Skip in-flight optimistic
  // placeholders (blob: URLs / uploading=true).
  media:       (p.media || [])
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
  cover:       p.cover || null,
})

export default function PortfolioManager({ ownerId: ownerIdProp = null } = {}) {
  const [projects, setProjects] = useState(INITIAL)
  const [editing, setEditing]   = useState(null)
  const [detail, setDetail]     = useState(null)
  const [loading, setLoading]   = useState(true)
  const [ownerId, setOwnerId]   = useState(ownerIdProp)

  useEffect(() => { setOwnerId(ownerIdProp) }, [ownerIdProp])

  // Load this user's portfolio from Supabase. ownerId comes from the parent
  // (WorkerDashboard) which already has the session — no extra auth round
  // trip here so the spinner can't hang on a slow token refresh.
  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!supabase || !ownerIdProp) return
      try {
        const { data, error } = await supabase
          .from('portfolio_items')
          .select('*')
          .eq('owner_id', ownerIdProp)
          .order('position', { ascending: true })
          .order('created_at', { ascending: false })
        if (cancelled) return
        if (error) console.warn('[portfolio] load failed:', error.message)
        else setProjects((data || []).map(fromRow))
      } catch (e) {
        console.warn('[portfolio] load threw:', e?.message || e)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    setLoading(true)
    load()
    // Safety net: never sit on the spinner forever.
    const fallback = setTimeout(() => { if (!cancelled) setLoading(false) }, 6000)
    return () => { cancelled = true; clearTimeout(fallback) }
  }, [ownerIdProp])

  // When there's no signed-in user we have nothing to load — clear the spinner.
  useEffect(() => {
    if (!supabase || !ownerIdProp) setLoading(false)
  }, [ownerIdProp])

  const startAdd  = () => setEditing(blankProject())
  const startEdit = (p) => setEditing(structuredClone(p))
  const cancel    = () => setEditing(null)

  const save = async (p) => {
    if (!supabase || !ownerId) {
      // Fall back to local-only if not signed in.
      setProjects((prev) => {
        const exists = prev.some((x) => x.id === p.id)
        return exists ? prev.map((x) => (x.id === p.id ? p : x)) : [p, ...prev]
      })
      setEditing(null)
      return
    }
    const row = toRow(p, ownerId)
    const { data, error } = await supabase
      .from('portfolio_items')
      .upsert(row, { onConflict: 'id' })
      .select()
      .maybeSingle()
    if (error) {
      alert('Could not save project: ' + error.message)
      return
    }
    const saved = fromRow(data)
    setProjects((prev) => {
      const exists = prev.some((x) => x.id === saved.id)
      return exists ? prev.map((x) => (x.id === saved.id ? saved : x)) : [saved, ...prev]
    })
    setEditing(null)
  }

  const remove = async (id) => {
    const target = projects.find((p) => p.id === id)
    if (supabase && ownerId) {
      const { error } = await supabase.from('portfolio_items').delete().eq('id', id)
      if (error) { alert('Could not delete: ' + error.message); return }
    }
    // Best-effort cleanup of any uploaded media tied to this row.
    ;(target?.media || []).forEach((m) => { if (m.storage_path) deletePortfolioFile(m.storage_path) })
    setProjects((prev) => prev.filter((p) => p.id !== id))
    setEditing(null)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Portfolio</h2>
        <button
          onClick={startAdd}
          className="inline-flex items-center gap-1.5 text-sm text-brand-300 hover:text-white"
        >
          <Icon path={<path d="M12 5v14M5 12h14" />} className="h-4 w-4" />
          Add project
        </button>
      </div>

      {loading ? (
        <div className="card text-center py-12 text-white/60 text-sm">Loading…</div>
      ) : projects.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-white/70">No portfolio projects yet.</div>
          <button onClick={startAdd} className="btn-primary mt-4">Add your first project</button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((p) => (
            <ProjectCard
              key={p.id}
              project={p}
              onEdit={() => startEdit(p)}
              onOpenMedia={(i) => setDetail({ project: p, mediaIndex: i })}
            />
          ))}
        </div>
      )}

      {editing && (
        <EditModal
          project={editing}
          ownerId={ownerId}
          onChange={setEditing}
          onSave={save}
          onCancel={cancel}
          onDelete={remove}
        />
      )}

      {detail && (
        <DetailModal
          project={detail.project}
          startIndex={detail.mediaIndex}
          onClose={() => setDetail(null)}
        />
      )}
    </div>
  )
}

// ---------- Card ----------

const ProjectCard = ({ project, onEdit, onOpenMedia }) => {
  const cover = project.media?.[0]
  return (
    <div className="card !p-0 overflow-hidden group flex flex-col">
      <button
        onClick={() => cover ? onOpenMedia(0) : onEdit()}
        className={`h-36 relative overflow-hidden ${cover ? '' : `bg-gradient-to-br ${project.cover}`}`}
      >
        {cover ? (
          cover.kind === 'video' ? (
            <video src={cover.url} className="h-full w-full object-cover" muted />
          ) : (
            <img src={cover.url} alt={project.title} className="h-full w-full object-cover" />
          )
        ) : (
          <div className="absolute inset-0 opacity-30 grid-overlay" />
        )}
        {project.media?.length > 1 && (
          <span className="absolute bottom-2 right-2 text-[10px] uppercase tracking-wider bg-ink-950/70 text-white/85 rounded-full px-2 py-0.5">
            +{project.media.length - 1} media
          </span>
        )}
      </button>

      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold leading-tight">{project.title || 'Untitled project'}</h3>
          <button
            onClick={onEdit}
            className="opacity-60 group-hover:opacity-100 transition shrink-0 h-7 w-7 grid place-items-center rounded-full hover:bg-white/5 text-white/70 hover:text-white"
            aria-label="Edit"
          >
            <Icon path={<><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4z" /></>} className="h-3.5 w-3.5" />
          </button>
        </div>

        {project.description && (
          <p className="mt-1 text-sm text-white/65 leading-relaxed">{project.description}</p>
        )}

        <dl className="mt-4 space-y-2 text-sm">
          {project.role && (
            <Row label="Role"><span className="text-white/85">{project.role}</span></Row>
          )}
          {project.skills?.length > 0 && (
            <Row label="Skills">
              <div className="flex flex-wrap gap-1">
                {project.skills.map((s) => (
                  <span key={s} className="text-[11px] text-white/80 bg-white/[0.04] border border-white/10 rounded-full px-2 py-0.5">
                    {s}
                  </span>
                ))}
              </div>
            </Row>
          )}
          {project.url && (
            <Row label="URL">
              <a
                href={normalizeUrl(project.url)}
                target="_blank"
                rel="noreferrer"
                className="text-brand-300 hover:text-white underline-offset-2 hover:underline break-all"
              >
                {stripProtocol(project.url)}
              </a>
            </Row>
          )}
          {project.proof?.length > 0 && (
            <Row label="Proof">
              <div className="flex flex-wrap gap-1.5">
                {project.proof.map((p) => {
                  const has = !!p.url
                  return has ? (
                    <a
                      key={p.id}
                      href={normalizeUrl(p.url)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-white/85 bg-brand-500/10 hover:bg-brand-500/20 border border-brand-400/25 rounded-full px-2 py-0.5 transition"
                    >
                      {p.label}
                      <Icon path={<><path d="M14 3h7v7" /><path d="M10 14L21 3" /><path d="M21 14v7H3V3h7" /></>} className="h-3 w-3" />
                    </a>
                  ) : (
                    <span
                      key={p.id}
                      className="text-[11px] text-white/55 bg-white/[0.03] border border-white/10 rounded-full px-2 py-0.5"
                      title="Link not provided"
                    >
                      {p.label}
                    </span>
                  )
                })}
              </div>
            </Row>
          )}
        </dl>

        {(project.media?.length > 0) && (
          <div className="mt-4 pt-4 border-t border-white/5">
            <button
              onClick={() => onOpenMedia(0)}
              className="text-xs text-brand-300 hover:text-white"
            >
              View case →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

const Row = ({ label, children }) => (
  <div className="grid grid-cols-[64px_1fr] gap-3 items-start">
    <dt className="text-[11px] uppercase tracking-wider text-white/40 pt-0.5">{label}</dt>
    <dd>{children}</dd>
  </div>
)

// ---------- Edit modal ----------

const EditModal = ({ project, ownerId, onChange, onSave, onCancel, onDelete }) => {
  const update = (k, v) => onChange({ ...project, [k]: v })
  const fileInputRef = useRef(null)
  // Latest media list — accessed inside upload callbacks via a ref so we
  // don't capture stale closures.
  const mediaRef = useRef(project.media || [])
  useEffect(() => { mediaRef.current = project.media || [] }, [project.media])
  const [dragOver, setDragOver] = useState(false)
  const [skillsDraft, setSkillsDraft] = useState('')

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onCancel() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  const addSkill = (raw) => {
    const v = (raw || '').trim().replace(/,$/, '')
    if (!v) return
    if ((project.skills || []).includes(v)) { setSkillsDraft(''); return }
    update('skills', [...(project.skills || []), v])
    setSkillsDraft('')
  }
  const removeSkill = (s) => update('skills', project.skills.filter((x) => x !== s))

  const addFiles = async (fileList) => {
    if (!fileList || !fileList.length) return
    const files = Array.from(fileList)

    // Optimistic placeholders: show the local preview immediately while the
    // upload runs in the background. Each placeholder carries a temporary
    // blob URL + `uploading: true`.
    const placeholders = files.map((f) => ({
      id:        uid(),
      kind:      f.type.startsWith('video/') ? 'video' : 'image',
      url:       URL.createObjectURL(f),
      name:      f.name,
      sizeKb:    Math.round(f.size / 1024),
      caption:   '',
      uploading: true,
    }))
    mediaRef.current = [...(project.media || []), ...placeholders]
    update('media', mediaRef.current)

    if (!ownerId) {
      // Not signed in — keep optimistic entries as local-only previews.
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
      if (res.ok) {
        try { URL.revokeObjectURL(placeholder.url) } catch {}
        next[idx] = res.media
      } else {
        try { URL.revokeObjectURL(placeholder.url) } catch {}
        next.splice(idx, 1)
        console.warn('[portfolio] upload failed:', res.error, res.name)
      }
    })
    mediaRef.current = next
    update('media', next)

    const failed = results.filter((r) => !r.ok)
    if (failed.length) {
      alert(`${failed.length} file(s) failed to upload: ${failed.map((f) => f.name || '').join(', ')}`)
    }
  }
  const removeMedia = (id) => {
    const m = (project.media || []).find((x) => x.id === id)
    if (m?.storage_path) deletePortfolioFile(m.storage_path)
    else if (m?.url?.startsWith('blob:')) { try { URL.revokeObjectURL(m.url) } catch {} }
    update('media', (project.media || []).filter((m) => m.id !== id))
  }
  const setCaption = (id, caption) =>
    update('media', (project.media || []).map((m) => (m.id === id ? { ...m, caption } : m)))

  const addProof = (label = '') =>
    update('proof', [...(project.proof || []), { id: uid(), label, url: '' }])
  const updateProof = (id, patch) =>
    update('proof', project.proof.map((p) => (p.id === id ? { ...p, ...patch } : p)))
  const removeProof = (id) => update('proof', project.proof.filter((p) => p.id !== id))

  const valid = project.title.trim().length > 0

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-ink-950/80 backdrop-blur-md" onClick={onCancel} />
      <div className="relative w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border border-white/10 bg-ink-900 shadow-glow">
        <div className="sticky top-0 z-10 bg-ink-900/95 backdrop-blur px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <div className="font-semibold">{project.title ? 'Edit project' : 'Add project'}</div>
          <button onClick={onCancel} className="h-8 w-8 grid place-items-center rounded-full text-white/60 hover:text-white hover:bg-white/5">
            <Icon path={<path d="M6 6l12 12M18 6l-12 12" />} className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <Field label="Title">
            <Text value={project.title} onChange={(v) => update('title', v)} placeholder="Chain Brief Landing Page" />
          </Field>
          <Field label="Description" hint="One line that captures what the project is">
            <Text value={project.description} onChange={(v) => update('description', v)} placeholder="Crypto news platform landing page redesign." />
          </Field>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Role">
              <Text value={project.role} onChange={(v) => update('role', v)} placeholder="Frontend / UI" />
            </Field>
            <Field label="Public URL" hint="Live site or product page">
              <Text value={project.url} onChange={(v) => update('url', v)} placeholder="chainbrief.kr" />
            </Field>
          </div>

          <Field label="Skills" hint="Press Enter to add">
            <div className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 focus-within:border-brand-300 transition">
              <div className="flex flex-wrap gap-1.5">
                {(project.skills || []).map((s) => (
                  <span key={s} className="inline-flex items-center gap-1 rounded-full bg-brand-500/15 border border-brand-400/30 px-2.5 py-1 text-xs">
                    {s}
                    <button type="button" onClick={() => removeSkill(s)} className="text-white/60 hover:text-white">×</button>
                  </span>
                ))}
                <input
                  value={skillsDraft}
                  onChange={(e) => setSkillsDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addSkill(skillsDraft) }
                    if (e.key === 'Backspace' && !skillsDraft && project.skills?.length) {
                      removeSkill(project.skills[project.skills.length - 1])
                    }
                  }}
                  onBlur={() => addSkill(skillsDraft)}
                  placeholder={project.skills?.length ? '' : 'e.g. React, Tailwind, Supabase'}
                  className="flex-1 min-w-[160px] bg-transparent px-2 py-1.5 text-sm focus:outline-none placeholder:text-white/35"
                />
              </div>
            </div>
          </Field>

          <Field label="Proof links" hint="Anywhere a hirer can verify the work">
            {(project.proof || []).length > 0 && (
              <div className="space-y-2 mb-3">
                {project.proof.map((p) => (
                  <div key={p.id} className="grid grid-cols-[10rem_1fr_auto] gap-2 items-center">
                    <Text value={p.label} onChange={(v) => updateProof(p.id, { label: v })} placeholder="Label" />
                    <Text value={p.url}   onChange={(v) => updateProof(p.id, { url: v })}   placeholder="https://…" />
                    <button
                      onClick={() => removeProof(p.id)}
                      className="h-9 w-9 grid place-items-center rounded-full text-white/55 hover:text-white hover:bg-white/5"
                      aria-label="Remove proof"
                    >
                      <Icon path={<path d="M6 6l12 12M18 6l-12 12" />} className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex flex-wrap gap-1.5">
              {PROOF_PRESETS.filter((label) => !(project.proof || []).some((p) => p.label === label)).map((label) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => addProof(label)}
                  className="text-[11px] text-white/75 bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 rounded-full px-2.5 py-1"
                >
                  + {label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => addProof('')}
                className="text-[11px] text-brand-300 hover:text-white rounded-full px-2.5 py-1"
              >
                + Custom
              </button>
            </div>
          </Field>

          <Field label="Cover &amp; media">
            <div
              onDragEnter={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragOver={(e)  => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files) }}
              onClick={() => fileInputRef.current?.click()}
              className={
                'rounded-2xl border-2 border-dashed transition px-5 py-7 text-center cursor-pointer ' +
                (dragOver ? 'border-brand-300 bg-brand-500/10' : 'border-white/10 hover:border-white/25 bg-white/[0.02]')
              }
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
              <div className="text-xs text-white/45 mt-1">First media becomes the cover · images or videos</div>
            </div>

            {project.media?.length > 0 && (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                {project.media.map((m, i) => (
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
                      >
                        <Icon path={<path d="M6 6l12 12M18 6l-12 12" />} className="h-3.5 w-3.5" />
                      </button>
                      {i === 0 && (
                        <span className="absolute bottom-1.5 left-1.5 text-[10px] uppercase tracking-wider bg-brand-500/80 text-white rounded px-1.5 py-0.5">
                          Cover
                        </span>
                      )}
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
              Images and videos are stored in Supabase Storage and survive reloads. Sign in to upload.
            </p>
          </Field>
        </div>

        <div className="sticky bottom-0 bg-ink-900/95 backdrop-blur px-6 py-4 border-t border-white/5 flex items-center justify-between gap-3">
          <button onClick={() => onDelete(project.id)} className="text-sm text-rose-300 hover:text-rose-200">
            Delete project
          </button>
          <div className="flex items-center gap-2">
            <button onClick={onCancel} className="btn-ghost !py-2 !px-4 text-sm">Cancel</button>
            <button
              onClick={() => valid && onSave(project)}
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

// ---------- Detail / lightbox modal ----------

const DetailModal = ({ project, startIndex = 0, onClose }) => {
  const media = project.media || []
  const [i, setI] = useState(Math.min(startIndex, Math.max(0, media.length - 1)))
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

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6">
      <div className="absolute inset-0 bg-ink-950/90 backdrop-blur" onClick={onClose} />
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-2xl border border-white/10 bg-ink-900 overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="font-semibold truncate">{project.title}</div>
            {project.description && <div className="text-sm text-white/65 truncate">{project.description}</div>}
          </div>
          <button onClick={onClose} className="h-8 w-8 grid place-items-center rounded-full text-white/70 hover:text-white hover:bg-white/5 shrink-0">
            <Icon path={<path d="M6 6l12 12M18 6l-12 12" />} className="h-4 w-4" />
          </button>
        </div>

        <div className="relative flex-1 bg-black grid place-items-center min-h-[40vh]">
          {current ? (
            current.kind === 'video' ? (
              <video src={current.url} controls autoPlay className="max-h-[60vh] w-full object-contain" />
            ) : (
              <img src={current.url} alt={current.caption || current.name} className="max-h-[60vh] w-full object-contain" />
            )
          ) : (
            <div className={`h-[40vh] w-full bg-gradient-to-br ${project.cover}`}>
              <div className="h-full w-full opacity-30 grid-overlay" />
            </div>
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

        <div className="px-5 py-4 border-t border-white/5 space-y-3 text-sm">
          {current?.caption && <div className="text-white/85">{current.caption}</div>}
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-white/70">
            {project.role && <span><span className="text-white/40 mr-1">Role:</span>{project.role}</span>}
            {project.url  && (
              <span>
                <span className="text-white/40 mr-1">URL:</span>
                <a href={normalizeUrl(project.url)} target="_blank" rel="noreferrer" className="text-brand-300 hover:text-white underline-offset-2 hover:underline">
                  {stripProtocol(project.url)}
                </a>
              </span>
            )}
          </div>
          {project.skills?.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {project.skills.map((s) => (
                <span key={s} className="text-[11px] text-white/80 bg-white/[0.04] border border-white/10 rounded-full px-2 py-0.5">{s}</span>
              ))}
            </div>
          )}
          {project.proof?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {project.proof.map((p) => p.url ? (
                <a
                  key={p.id}
                  href={normalizeUrl(p.url)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-white bg-brand-500/15 hover:bg-brand-500/25 border border-brand-400/25 rounded-full px-2.5 py-1 transition"
                >
                  {p.label}
                  <Icon path={<><path d="M14 3h7v7" /><path d="M10 14L21 3" /><path d="M21 14v7H3V3h7" /></>} className="h-3 w-3" />
                </a>
              ) : (
                <span key={p.id} className="text-[11px] text-white/55 bg-white/[0.03] border border-white/10 rounded-full px-2.5 py-1">
                  {p.label}
                </span>
              ))}
            </div>
          )}
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
