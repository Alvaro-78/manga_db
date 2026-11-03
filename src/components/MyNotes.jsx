import { useState } from 'react'
import { saveNote } from '../lib/notes'

// Notas personales del usuario sobre un manga (opcionales; solo las ve él).
export default function MyNotes({ mangaId, userId, initial }) {
  const [note, setNote] = useState(initial)
  const [draft, setDraft] = useState(null) // texto mientras se edita
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  async function save() {
    setBusy(true)
    setError(null)
    try {
      setNote(await saveNote(mangaId, userId, draft))
      setDraft(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  if (draft === null) {
    return note ? (
      <section className="notes card stack">
        <div className="row between">
          <h2>Mis notas</h2>
          <button className="ghost small" onClick={() => setDraft(note)}>Editar</button>
        </div>
        <p className="pre">{note}</p>
        <span className="muted small">Solo tú ves tus notas.</span>
      </section>
    ) : (
      <div>
        <button className="ghost small" onClick={() => setDraft('')}>+ Añadir notas</button>
      </div>
    )
  }

  return (
    <section className="notes card stack">
      <h2>Mis notas</h2>
      <textarea
        rows={5}
        maxLength={5000}
        autoFocus
        placeholder="Lo que quieras apuntar: por dónde vas, qué te pareció, a quién se lo prestaste…"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
      />
      <span className="muted small">Solo tú ves tus notas. Déjalas vacías y guarda para borrarlas.</span>
      {error && <p className="error">{error}</p>}
      <div className="row end">
        <button className="ghost" onClick={() => setDraft(null)} disabled={busy}>Cancelar</button>
        <button onClick={save} disabled={busy}>{busy ? 'Guardando…' : 'Guardar'}</button>
      </div>
    </section>
  )
}
