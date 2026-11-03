import { supabase } from './supabase'

// Media, número de votos y nota del usuario a partir de las filas de manga_ratings.
export function ratingSummary(ratings = [], userId) {
  const count = ratings.length
  const avg = count ? ratings.reduce((s, r) => s + r.rating, 0) / count : null
  const mine = ratings.find((r) => r.user_id === userId)?.rating ?? null
  return { avg, count, mine }
}

// Guarda la nota del usuario (1–5) o la quita si `rating` es null.
export async function setRating(mangaId, userId, rating) {
  const query = rating
    ? supabase.from('manga_ratings').upsert(
        { manga_id: mangaId, user_id: userId, rating, updated_at: new Date().toISOString() },
        { onConflict: 'manga_id,user_id' },
      )
    : supabase.from('manga_ratings').delete().eq('manga_id', mangaId).eq('user_id', userId)
  const { error } = await query
  if (error) throw error
}

export const formatAvg = (avg) => avg.toLocaleString('es', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
