import { supabase } from './supabase'

// Guarda las notas del usuario sobre un manga, o las borra si quedan vacías.
export async function saveNote(mangaId, userId, body) {
  const text = body.trim()
  const query = text
    ? supabase.from('manga_notes').upsert(
        { manga_id: mangaId, user_id: userId, body: text, updated_at: new Date().toISOString() },
        { onConflict: 'manga_id,user_id' },
      )
    : supabase.from('manga_notes').delete().eq('manga_id', mangaId).eq('user_id', userId)
  const { error } = await query
  if (error) throw error
  return text || null
}
