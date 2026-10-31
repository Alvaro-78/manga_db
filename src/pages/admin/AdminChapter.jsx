import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { removeImages, signedUrls } from '../../lib/images'
import { addPages, deleteChapter } from '../../lib/chapters'
import ChapterForm from '../../components/ChapterForm'

export default function AdminChapter({ user }) {
  const { mangaId, chapterId } = useParams()
  const navigate = useNavigate()
  const [chapter, setChapter] = useState(null)
  const [urls, setUrls] = useState({})
  const [error, setError] = useState(null)
  const [saved, setSaved] = useState(false)
  const [progress, setProgress] = useState(null)
  const [reordering, setReordering] = useState(false)

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('chapters')
      .select('*, mangas(title), pages(id, page_number, image_path)')
      .eq('id', chapterId)
      .order('page_number', { referencedTable: 'pages' })
      .single()
    if (error) return setError(error.message)
    setChapter(data)
    setUrls(await signedUrls(data.pages.map((p) => p.image_path)))
  }, [chapterId])

  useEffect(() => { load() }, [load])

  async function handleAddPages(e) {
    const files = [...e.target.files]
    e.target.value = ''
    if (files.length === 0) return
    setError(null)
    const last = chapter.pages.at(-1)?.page_number ?? 0
    setProgress({ done: 0, total: files.length })
    try {
      await addPages(user, chapter, files, last, (done, total) => setProgress({ done, total }))
    } catch (err) {
      setError(err.message)
    }
    setProgress(null)
    load()
  }

  async function handleDeletePage(page, index) {
    if (!confirm(`¿Borrar la página ${index + 1}?`)) return
    try {
      await removeImages([page.image_path])
      const { error } = await supabase.from('pages').delete().eq('id', page.id)
      if (error) throw error
      setChapter((c) => ({ ...c, pages: c.pages.filter((p) => p.id !== page.id) }))
    } catch (err) {
      setError(err.message)
    }
  }

  // Intercambia la posición de dos páginas contiguas.
  async function handleMove(index, delta) {
    const a = chapter.pages[index]
    const b = chapter.pages[index + delta]
    if (!b) return
    setReordering(true)
    const results = await Promise.all([
      supabase.from('pages').update({ page_number: b.page_number }).eq('id', a.id),
      supabase.from('pages').update({ page_number: a.page_number }).eq('id', b.id),
    ])
    setReordering(false)
    const failed = results.find((r) => r.error)
    if (failed) {
      setError(failed.error.message)
      return load()
    }
    setChapter((c) => {
      const pages = [...c.pages]
      pages[index] = { ...b, page_number: a.page_number }
      pages[index + delta] = { ...a, page_number: b.page_number }
      return { ...c, pages }
    })
  }

  async function handleDeleteChapter() {
    if (!confirm(`¿Borrar el capítulo ${chapter.number} y sus imágenes?`)) return
    try {
      await deleteChapter(chapter.id)
      navigate(`/admin/manga/${mangaId}`, { replace: true })
    } catch (err) {
      setError(err.message)
    }
  }

  if (error && !chapter) return <p className="error">{error}</p>
  if (!chapter) return <p className="muted">Cargando…</p>

  return (
    <>
      <Link to={`/admin/manga/${mangaId}`} className="back">← {chapter.mangas.title}</Link>
      <div className="row between">
        <h1>Cap. {chapter.number}{chapter.title && ` — ${chapter.title}`}</h1>
        <div className="row">
          <Link to={`/manga/${mangaId}/capitulo/${chapter.id}`} className="button ghost small">Leer</Link>
          <button className="ghost danger small" onClick={handleDeleteChapter}>Borrar capítulo</button>
        </div>
      </div>
      {error && <p className="error">{error}</p>}

      <ChapterForm
        key={chapter.id}
        user={user}
        mangaId={mangaId}
        chapter={chapter}
        onSaved={() => { setSaved(true); setTimeout(() => setSaved(false), 2500); load() }}
      />
      {saved && <p className="ok">Cambios guardados.</p>}

      <div className="row between">
        <h2>Páginas ({chapter.pages.length})</h2>
      </div>

      <div className="card stack">
        <label>
          Añadir imágenes al final <span className="muted small">(se ordenan por nombre de archivo)</span>
          <input type="file" accept="image/*" multiple onChange={handleAddPages} disabled={progress !== null} />
        </label>
        {progress && (
          <>
            <progress value={progress.done} max={progress.total} />
            <span className="muted small">Subiendo {progress.done}/{progress.total}…</span>
          </>
        )}
      </div>

      {chapter.pages.length === 0 && <p className="muted">Este capítulo no tiene páginas todavía.</p>}

      <ul className="page-grid">
        {chapter.pages.map((p, i) => (
          <li key={p.id}>
            {urls[p.image_path]
              ? <img src={urls[p.image_path]} alt={`Página ${i + 1}`} loading="lazy" />
              : <div className="cover-placeholder" />}
            <div className="page-tools">
              <button className="ghost small" title="Mover antes" disabled={i === 0 || reordering} onClick={() => handleMove(i, -1)}>←</button>
              <span className="small">{i + 1}</span>
              <button className="ghost small" title="Mover después" disabled={i === chapter.pages.length - 1 || reordering} onClick={() => handleMove(i, 1)}>→</button>
              <button className="ghost danger small" title="Borrar página" onClick={() => handleDeletePage(p, i)}>✕</button>
            </div>
          </li>
        ))}
      </ul>
    </>
  )
}
