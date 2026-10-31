import { supabase, BUCKET } from './supabase'

// Las URLs firmadas caducan; una hora es suficiente para una sesión de lectura.
const SIGNED_URL_TTL = 60 * 60

export async function uploadImage(userId, folder, file) {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `${userId}/${folder}/${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false })
  if (error) throw error
  return path
}

export async function removeImages(paths) {
  const list = paths.filter(Boolean)
  if (list.length === 0) return
  const { error } = await supabase.storage.from(BUCKET).remove(list)
  if (error) throw error
}

// Devuelve un objeto { path: signedUrl }.
export async function signedUrls(paths) {
  const list = [...new Set(paths.filter(Boolean))]
  if (list.length === 0) return {}
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrls(list, SIGNED_URL_TTL)
  if (error) throw error
  return Object.fromEntries(data.filter((d) => d.signedUrl).map((d) => [d.path, d.signedUrl]))
}

// Orden natural por nombre de archivo, para que "2.jpg" vaya antes que "10.jpg".
export function sortFilesNaturally(files) {
  const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })
  return [...files].sort((a, b) => collator.compare(a.name, b.name))
}
