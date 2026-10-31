import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { addPages } from '../lib/chapters'

// Crea un capítulo con sus páginas (sin `chapter`) o edita los datos de uno existente.
export default function ChapterForm({ user, mangaId, chapter, defaultNumber, onSaved, onCancel }) {
  const [number, setNumber] = useState(chapter?.number ?? defaultNumber)
  const [title, setTitle] = useState(chapter?.title ?? '')
  const [notes, setNotes] = useState(chapter?.notes ?? '')
  const [files, setFiles] = useState([])
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(null)
  const [error, setError] = useState(null)

  async function submit(e) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    const fields = { number, title: title.trim() || null, notes: notes.trim() || null }
    const query = chapter
      ? supabase.from('chapters').update(fields).eq('id', chapter.id)
      : supabase.from('chapters').insert({ ...fields, manga_id: mangaId })
    const { data: saved, error } = await query.select().single()
    if (error) {
      setBusy(false)
      return setError(error.message)
    }
    if (!chapter && files.length > 0) {
      try {
        setProgress({ done: 0, total: files.length })
        await addPages(user, saved, files, 0, (done, total) => setProgress({ done, total }))
      } catch (err) {
        setBusy(false)
        setProgress(null)
        return setError(`El capítulo se creó, pero falló la subida de imágenes: ${err.message}`)
      }
    }
    setBusy(false)
    setProgress(null)
    onSaved(saved)
  }

  return (
    <form onSubmit={submit} className="card stack">
      <h2>{chapter ? 'Datos del capítulo' : 'Nuevo capítulo'}</h2>
      <div className="row">
        <label>
          Número
          <input type="number" step="any" required value={number} onChange={(e) => setNumber(e.target.value)} className="num" />
        </label>
        <label className="grow">
          Título (opcional)
          <input value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>
      </div>
      <label>
        Notas (opcional)
        <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </label>
      {!chapter && (
        <label>
          Páginas <span className="muted small">(puedes seleccionar varias; se ordenan por nombre de archivo)</span>
          <input type="file" accept="image/*" multiple onChange={(e) => setFiles([...e.target.files])} />
        </label>
      )}
      {progress && <progress value={progress.done} max={progress.total} />}
      {error && <p className="error">{error}</p>}
      <div className="row end">
        {onCancel && <button type="button" className="ghost" onClick={onCancel} disabled={busy}>Cancelar</button>}
        <button disabled={busy}>
          {progress ? `Subiendo ${progress.done}/${progress.total}…` : busy ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </form>
  )
}
