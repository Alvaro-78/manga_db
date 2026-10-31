import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { signedUrls } from '../lib/images'
import { seriesLabel, volumeLabel } from '../lib/volume'

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
        .select('*, chapters(id, number, title, notes, pages(count))')
        .eq('id', mangaId)
        .order('number', { referencedTable: 'chapters' })
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

  const chapters = manga.chapters
  const first = chapters[0]

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
            {volumeLabel(manga) && <span className="muted small">{volumeLabel(manga)}</span>}
            <span className={`badge ${manga.single_volume ? 'serie-completa' : 'serie-incompleta'}`}>{seriesLabel(manga)}</span>
          </div>
          {manga.description && <p className="pre">{manga.description}</p>}
          <div className="row">
            {first && <Link to={`/manga/${manga.id}/capitulo/${first.id}`} className="button">Empezar a leer</Link>}
            <Link to={`/admin/manga/${manga.id}`} className="button ghost">Editar</Link>
          </div>
        </div>
      </section>

      <h2 className="section-title">Capítulos</h2>
      {chapters.length === 0 && <p className="muted">Sin capítulos todavía.</p>}
      <ul className="chapter-list">
        {chapters.map((ch) => (
          <li key={ch.id}>
            <Link to={`/manga/${manga.id}/capitulo/${ch.id}`} className="grow">
              <strong>Cap. {ch.number}</strong>
              {ch.title && <span> — {ch.title}</span>}
              <span className="muted small"> · {ch.pages[0]?.count ?? 0} pág.</span>
              {ch.notes && <p className="muted small pre">{ch.notes}</p>}
            </Link>
          </li>
        ))}
      </ul>
    </>
  )
}
