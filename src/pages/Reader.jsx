import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { signedUrls } from '../lib/images'

export default function Reader() {
  const { mangaId, chapterId } = useParams()
  const [chapter, setChapter] = useState(null)
  const [siblings, setSiblings] = useState([])
  const [urls, setUrls] = useState({})
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const [chapterRes, siblingsRes] = await Promise.all([
        supabase
          .from('chapters')
          .select('*, mangas(title), pages(id, page_number, image_path)')
          .eq('id', chapterId)
          .order('page_number', { referencedTable: 'pages' })
          .single(),
        supabase.from('chapters').select('id, number').eq('manga_id', mangaId).order('number'),
      ])
      if (cancelled) return
      if (chapterRes.error) return setError(chapterRes.error.message)
      setChapter(chapterRes.data)
      setSiblings(siblingsRes.data ?? [])
      const signed = await signedUrls(chapterRes.data.pages.map((p) => p.image_path))
      if (!cancelled) setUrls(signed)
    }
    window.scrollTo(0, 0)
    load()
    return () => { cancelled = true }
  }, [chapterId, mangaId])

  if (error) return <p className="error">{error}</p>
  if (!chapter) return <p className="muted">Cargando…</p>

  const idx = siblings.findIndex((s) => s.id === chapter.id)
  const prev = siblings[idx - 1]
  const next = siblings[idx + 1]

  const nav = (
    <nav className="reader-nav">
      {prev ? <Link to={`/manga/${mangaId}/capitulo/${prev.id}`}>← Cap. {prev.number}</Link> : <span />}
      <Link to={`/manga/${mangaId}`} className="muted">Índice</Link>
      {next ? <Link to={`/manga/${mangaId}/capitulo/${next.id}`}>Cap. {next.number} →</Link> : <span />}
    </nav>
  )

  return (
    <>
      <Link to={`/manga/${mangaId}`} className="back">← {chapter.mangas.title}</Link>
      <h1>Cap. {chapter.number}{chapter.title && ` — ${chapter.title}`}</h1>
      {chapter.notes && <p className="muted pre">{chapter.notes}</p>}

      {nav}
      {chapter.pages.length === 0 && <p className="muted center">Este capítulo no tiene páginas.</p>}
      <div className="pages">
        {chapter.pages.map((p) => (
          <figure key={p.id}>
            {urls[p.image_path] && <img src={urls[p.image_path]} alt={`Página ${p.page_number}`} loading="lazy" />}
          </figure>
        ))}
      </div>
      {chapter.pages.length > 0 && nav}
    </>
  )
}
