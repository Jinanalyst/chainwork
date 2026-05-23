import { supabase } from './supabase.js'

const BUCKET = 'portfolio-media'

const uid = () =>
  (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : `id_${Math.random().toString(36).slice(2)}_${Date.now()}`

const extOf = (name = '', mime = '') => {
  const fromName = name.includes('.') ? name.split('.').pop().toLowerCase() : ''
  if (fromName) return fromName
  if (mime.startsWith('image/')) return mime.replace('image/', '')
  if (mime.startsWith('video/')) return mime.replace('video/', '')
  return 'bin'
}

/**
 * Upload one file to Supabase Storage under `{ownerId}/{uuid}.{ext}` and
 * return a persistent public URL. Throws on failure.
 */
export async function uploadPortfolioFile(file, ownerId) {
  if (!supabase)  throw new Error('Supabase not configured')
  if (!ownerId)   throw new Error('Not signed in')
  if (!file)      throw new Error('No file')

  const key = `${ownerId}/${uid()}.${extOf(file.name, file.type)}`
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(key, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || undefined,
    })
  if (error) throw new Error(error.message)

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(key)
  return {
    id:       uid(),
    kind:     file.type?.startsWith('video/') ? 'video' : 'image',
    url:      data.publicUrl,
    storage_path: key,
    name:     file.name,
    sizeKb:   Math.round(file.size / 1024),
    caption:  '',
  }
}

/**
 * Upload many files in parallel. Returns an array of media entries (in input
 * order). Individual failures bubble up via the rejected entry — caller
 * decides whether to keep partial successes.
 */
export async function uploadPortfolioFiles(files, ownerId) {
  const list = Array.from(files || [])
  const results = await Promise.allSettled(list.map((f) => uploadPortfolioFile(f, ownerId)))
  return results.map((r, i) => (
    r.status === 'fulfilled'
      ? { ok: true,  media: r.value }
      : { ok: false, error: r.reason?.message || 'Upload failed', name: list[i]?.name }
  ))
}

/**
 * Best-effort delete of an object given its storage_path (e.g. "{uid}/{file}").
 * Silent on failure — UI shouldn't block on cleanup.
 */
export async function deletePortfolioFile(storage_path) {
  if (!supabase || !storage_path) return
  await supabase.storage.from(BUCKET).remove([storage_path]).catch(() => {})
}
