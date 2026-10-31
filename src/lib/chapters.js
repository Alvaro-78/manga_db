import { supabase } from './supabase'
import { removeImages, sortFilesNaturally, uploadImage } from './images'

// Sube las imágenes en orden y registra cada una como página, empezando después de `startAt`.
export async function addPages(user, chapter, files, startAt = 0, onProgress = () => {}) {
  const sorted = sortFilesNaturally(files)
  for (let i = 0; i < sorted.length; i++) {
    const path = await uploadImage(user.id, `mangas/${chapter.manga_id}/${chapter.id}`, sorted[i])
    const { error } = await supabase
      .from('pages')
      .insert({ chapter_id: chapter.id, page_number: startAt + i + 1, image_path: path })
    if (error) {
      await removeImages([path])
      throw error
    }
    onProgress(i + 1, sorted.length)
  }
}

// Borra el capítulo y sus imágenes de Storage (las filas de `pages` caen en cascada).
export async function deleteChapter(chapterId) {
  const { data: pages, error } = await supabase.from('pages').select('image_path').eq('chapter_id', chapterId)
  if (error) throw error
  await removeImages(pages.map((p) => p.image_path))
  const { error: delError } = await supabase.from('chapters').delete().eq('id', chapterId)
  if (delError) throw delError
}

// Borra el manga, sus capítulos, páginas e imágenes.
export async function deleteManga(manga) {
  const { data: pages, error } = await supabase
    .from('pages')
    .select('image_path, chapters!inner(manga_id)')
    .eq('chapters.manga_id', manga.id)
  if (error) throw error
  await removeImages([manga.cover_path, ...pages.map((p) => p.image_path)])
  const { error: delError } = await supabase.from('mangas').delete().eq('id', manga.id)
  if (delError) throw delError
}
