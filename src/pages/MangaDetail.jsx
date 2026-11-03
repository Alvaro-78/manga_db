import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { signedUrls } from '../lib/images'
import { byName, setMangaTags } from '../lib/mangas'
import TagPicker from '../components/TagPicker'
import MangaBadges from '../components/MangaBadges'
import { formatAvg, ratingSummary, setRating } from '../lib/ratings'
import StarRating from '../components/StarRating'
import MyNotes from '../components/MyNotes'
import { tagStyle } from '../lib/tags'

export default function MangaDetail({ isAdmin, userId }) {
  const { mangaId } = useParams()
  const [manga, setManga] = useState(null)
  const [coverUrl, setCoverUrl] = useState(null)
  const [error, setError] = useState(null)
  const [editingTags, setEditingTags] = useState(null) // ids seleccionados mientras se editan
  const [tagError, setTagError] = useState(null)
  const [ratingBusy, setRatingBusy] = useState(false)
  const [ratingError, setRatingError] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const { data, error } = await supabase
        .from('mangas')
        .select('*, tags(id, name, hue), manga_ratings(user_id, rating), manga_notes(user_id, body)')
        .eq('id', mangaId)
        .single()
      if (cancelled) return
      if (error) return setError(error.message)
      setManga(data)
      const urls = await signedUrls([data.cover_path])
      if (!cancelled) setCoverUrl(urls[data.cover_path] ?? null)
    }
    load()
    return () => { cancelled = true }
  }, [mangaId])

  async function saveTags() {
    setTagError(null)
    try {
      await setMangaTags(manga.id, editingTags)
      const { data, error } = await supabase.from('mangas').select('tags(id, name, hue)').eq('id', manga.id).single()
      if (error) throw error
      setManga((m) => ({ ...m, tags: data.tags }))
      setEditingTags(null)
    } catch (err) {
      setTagError(err.message)
    }
  }

  async function rate(rating) {
    setRatingBusy(true)
    setRatingError(null)
    try {
      await setRating(manga.id, userId, rating)
      setManga((m) => ({
        ...m,
        manga_ratings: [
          ...m.manga_ratings.filter((r) => r.user_id !== userId),
          ...(rating ? [{ user_id: userId, rating }] : []),
        ],
      }))
    } catch (err) {
      setRatingError(err.message)
    } finally {
      setRatingBusy(false)
    }
  }

  if (error) return <p className="error">{error}</p>
  if (!manga) return <p className="muted">Cargando…</p>

  const { avg, count, mine } = ratingSummary(manga.manga_ratings, userId)

  return (
    <>
      <Link to="/" className="back">← Biblioteca</Link>
      <section className="detail">
        {coverUrl
          ? <img src={coverUrl} alt="" className="detail-cover" />
          : <div className="cover-placeholder detail-cover">{manga.title.slice(0, 1)}</div>}
        <div className="stack">
          <h1>{manga.title}</h1>
          {manga.author && <p className="muted">{manga.author}</p>}
          <div className="row">
            <MangaBadges manga={manga} />
          </div>
          <div className="rating-row">
            <StarRating value={avg} />
            <span className="muted small">
              {count ? `${formatAvg(avg)} · ${count} voto${count > 1 ? 's' : ''}` : 'Sin puntuar'}
            </span>
          </div>
          <div className="rating-row">
            <span className="small">Tu nota:</span>
            <StarRating value={mine} onChange={rate} disabled={ratingBusy} size="lg" />
            {mine && <span className="muted small">(pulsa tu nota para quitarla)</span>}
          </div>
          {ratingError && <p className="error">{ratingError}</p>}
          {editingTags ? (
            <div className="stack">
              <TagPicker selected={editingTags} onChange={setEditingTags} isAdmin={isAdmin} />
              {tagError && <p className="error">{tagError}</p>}
              <div className="row">
                <button onClick={saveTags}>Guardar tags</button>
                <button className="ghost" onClick={() => setEditingTags(null)}>Cancelar</button>
              </div>
            </div>
          ) : (
            <div className="tag-list">
              {[...manga.tags].sort(byName).map((t) => <span key={t.id} className="tag on colored" style={tagStyle(t)}>{t.name}</span>)}
              {isAdmin && (
                <button className="ghost small" onClick={() => setEditingTags(manga.tags.map((t) => t.id))}>
                  {manga.tags.length ? 'Editar tags' : '+ Añadir tags'}
                </button>
              )}
            </div>
          )}
          {manga.description && <p className="pre">{manga.description}</p>}
          <MyNotes
            key={manga.id}
            mangaId={manga.id}
            userId={userId}
            initial={manga.manga_notes.find((n) => n.user_id === userId)?.body ?? null}
          />
          {isAdmin && (
            <div className="row">
              <Link to={`/admin/manga/${manga.id}`} className="button ghost">Editar</Link>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
