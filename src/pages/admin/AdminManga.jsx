import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { signedUrls } from '../../lib/images'
import { deleteChapter, deleteManga } from '../../lib/chapters'
import MangaForm from '../../components/MangaForm'
import ChapterForm from '../../components/ChapterForm'

export default function AdminManga({ user }) {
  const { mangaId } = useParams()
  const navigate = useNavigate()
  const [manga, setManga] = useState(null)
  const [coverUrl, setCoverUrl] = useState(null)
  const [error, setError] = useState(null)
  const [saved, setSaved] = useState(false)
  const [addingChapter, setAddingChapter] = useState(false)

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('mangas')
      .select('*, chapters(id, number, title, pages(count))')
      .eq('id', mangaId)
      .order('number', { referencedTable: 'chapters' })
      .single()
    if (error) return setError(error.message)
    setManga(data)
    const urls = await signedUrls([data.cover_path])
    setCoverUrl(urls[data.cover_path] ?? null)
  }, [mangaId])

  useEffect(() => { load() }, [load])

  async function handleDeleteManga() {
    if (!confirm(`¿Borrar “${manga.title}” con todos sus capítulos e imágenes?`)) return
    try {
      await deleteManga(manga)
      navigate('/admin', { replace: true })
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleDeleteChapter(ch) {
    if (!confirm(`¿Borrar el capítulo ${ch.number} y sus imágenes?`)) return
    try {
      await deleteChapter(ch.id)
      setManga((m) => ({ ...m, chapters: m.chapters.filter((c) => c.id !== ch.id) }))
    } catch (err) {
      setError(err.message)
    }
  }

  if (error && !manga) return <p className="error">{error}</p>
  if (!manga) return <p className="muted">Cargando…</p>

  const chapters = manga.chapters
  const nextNumber = chapters.length ? Math.floor(Math.max(...chapters.map((c) => Number(c.number)))) + 1 : 1

  return (
    <>
      <Link to="/admin" className="back">← Administrar</Link>
      <div className="row between">
        <h1>{manga.title}</h1>
        <div className="row">
          <Link to={`/manga/${manga.id}`} className="button ghost small">Ver en biblioteca</Link>
          <button className="ghost danger small" onClick={handleDeleteManga}>Borrar manga</button>
        </div>
      </div>
      {error && <p className="error">{error}</p>}

      <div className="admin-manga">
        {coverUrl
          ? <img src={coverUrl} alt="" className="detail-cover" />
          : <div className="cover-placeholder detail-cover">{manga.title.slice(0, 1)}</div>}
        <div className="grow">
          <MangaForm
            user={user}
            manga={manga}
            onSaved={() => { setSaved(true); setTimeout(() => setSaved(false), 2500); load() }}
          />
          {saved && <p className="ok">Cambios guardados.</p>}
        </div>
      </div>

      <div className="row between">
        <h2>Capítulos</h2>
        {!addingChapter && <button onClick={() => setAddingChapter(true)}>+ Capítulo</button>}
      </div>

      {addingChapter && (
        <ChapterForm
          user={user}
          mangaId={manga.id}
          defaultNumber={nextNumber}
          onCancel={() => setAddingChapter(false)}
          onSaved={() => { setAddingChapter(false); load() }}
        />
      )}

      {chapters.length === 0 && !addingChapter && <p className="muted">Sin capítulos todavía.</p>}

      <ul className="chapter-list">
        {chapters.map((ch) => (
          <li key={ch.id}>
            <div className="grow">
              <strong>Cap. {ch.number}</strong>
              {ch.title && <span> — {ch.title}</span>}
              <span className="muted small"> · {ch.pages[0]?.count ?? 0} pág.</span>
            </div>
            <Link to={`/admin/manga/${manga.id}/capitulo/${ch.id}`} className="button ghost small">Editar / imágenes</Link>
            <button className="ghost danger small" onClick={() => handleDeleteChapter(ch)}>Borrar</button>
          </li>
        ))}
      </ul>
    </>
  )
}
