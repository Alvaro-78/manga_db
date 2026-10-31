import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { signedUrls } from '../lib/images'
import { byName } from '../lib/mangas'
import { volumeLabel } from '../lib/volume'

export default function MangaDetail() {
  const { mangaId } = useParams()
  const [manga, setManga] = useState(null)
  const [coverUrl, setCoverUrl] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const { data, error } = await supabase
        .from('mangas')
        .select('*, tags(id, name)')
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

  if (error) return <p className="error">{error}</p>
  if (!manga) return <p className="muted">Cargando…</p>

  const collection = volumeLabel(manga)

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
            <span className={`badge ${manga.status}`}>{manga.status}</span>
            {collection && <span className="muted small">Colección: {collection}</span>}
          </div>
          {manga.tags.length > 0 && (
            <div className="tag-list">
              {[...manga.tags].sort(byName).map((t) => <span key={t.id} className="tag on">{t.name}</span>)}
            </div>
          )}
          {manga.description && <p className="pre">{manga.description}</p>}
          <div className="row">
            <Link to={`/admin/manga/${manga.id}`} className="button ghost">Editar</Link>
          </div>
        </div>
      </section>
    </>
  )
}
