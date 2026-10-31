import { supabase } from './supabase'
import { removeImages } from './images'

// Borra el manga y su portada (sus tags caen en cascada).
export async function deleteManga(manga) {
  await removeImages([manga.cover_path])
  const { error } = await supabase.from('mangas').delete().eq('id', manga.id)
  if (error) throw error
}

// Deja al manga exactamente con estos tags.
export async function setMangaTags(mangaId, tagIds) {
  const { error } = await supabase.from('manga_tags').delete().eq('manga_id', mangaId)
  if (error) throw error
  if (tagIds.length === 0) return
  const { error: insError } = await supabase
    .from('manga_tags')
    .insert(tagIds.map((tag_id) => ({ manga_id: mangaId, tag_id })))
  if (insError) throw insError
}

export const byName = (a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })
