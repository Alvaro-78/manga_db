import { useState } from 'react'
import { byName } from '../lib/mangas'
import { deleteTag, renameTag, tagStyle } from '../lib/tags'
import CamelHint from './CamelHint'

// Lista de tags con renombrar y borrar (solo admins). `onChange` recibe la lista nueva.
export default function TagManager({ tags, onChange, onDeleted = () => {} }) {
  const [editing, setEditing] = useState(null) // { id, name }
  const [error, setError] = useState(null)

  async function save() {
    if (!editing.name.trim()) return
    setError(null)
    try {
      const tag = await renameTag(editing.id, editing.name)
      onChange(tags.map((t) => (t.id === tag.id ? tag : t)).sort(byName))
      setEditing(null)
    } catch (err) {
      setError(err.message)
    }
  }

  async function remove(tag) {
    if (!confirm(`¿Borrar el tag “${tag.name}”? Se quitará de todos los mangas que lo lleven.`)) return
    setError(null)
    try {
      await deleteTag(tag.id)
      onChange(tags.filter((t) => t.id !== tag.id))
      onDeleted(tag.id)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <>
      {error && <p className="error">{error}</p>}
      {tags.length === 0 && <p className="muted small">Todavía no hay tags.</p>}
      <ul className="tag-manager">
        {tags.map((t) => (
          <li key={t.id}>
            {editing?.id === t.id ? (
              <div className="stack grow">
                <div className="row tag-new">
                  <input
                    autoFocus
                    maxLength={40}
                    value={editing.name}
                    onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') { e.preventDefault(); save() }
                      if (e.key === 'Escape') setEditing(null)
                    }}
                  />
                  <button type="button" className="small" onClick={save} disabled={!editing.name.trim()}>Guardar</button>
                  <button type="button" className="ghost small" onClick={() => setEditing(null)}>Cancelar</button>
                </div>
                <CamelHint text={editing.name} />
              </div>
            ) : (
              <>
                <span className="grow"><span className="tag on colored" style={tagStyle(t)}>{t.name}</span></span>
                <button type="button" className="ghost small" onClick={() => setEditing({ id: t.id, name: t.name })}>Renombrar</button>
                <button type="button" className="ghost danger small" onClick={() => remove(t)}>Borrar</button>
              </>
            )}
          </li>
        ))}
      </ul>
    </>
  )
}
