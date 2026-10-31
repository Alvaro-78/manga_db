import { useEffect, useState } from 'react'
import { byName } from '../lib/mangas'
import { createTag, loadTags } from '../lib/tags'
import CamelHint from './CamelHint'
import TagManager from './TagManager'

// Elige los tags de un manga. Un admin puede además crear, renombrar y borrar tags aquí mismo.
export default function TagPicker({ selected, onChange, isAdmin }) {
  const [tags, setTags] = useState([])
  const [managing, setManaging] = useState(false)
  const [newTag, setNewTag] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadTags().then(setTags, (err) => setError(err.message))
  }, [])

  function toggle(id) {
    onChange(selected.includes(id) ? selected.filter((t) => t !== id) : [...selected, id])
  }

  async function create() {
    if (!newTag.trim()) return
    setBusy(true)
    setError(null)
    try {
      const tag = await createTag(newTag)
      setTags((list) => [...list, tag].sort(byName))
      onChange([...selected, tag.id])
      setNewTag('')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <fieldset className="tag-field">
      <legend>Tags</legend>
      {managing ? (
        <TagManager
          tags={tags}
          onChange={setTags}
          onDeleted={(id) => onChange(selected.filter((t) => t !== id))}
        />
      ) : (
        <>
          {tags.length === 0 && <span className="muted small">Todavía no hay tags.</span>}
          <div className="tag-list">
            {tags.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`tag ${selected.includes(t.id) ? 'on' : ''}`}
                aria-pressed={selected.includes(t.id)}
                onClick={() => toggle(t.id)}
              >
                {t.name}
              </button>
            ))}
          </div>
        </>
      )}
      {isAdmin && (
        <>
          <div className="row tag-new">
            <input
              placeholder="Nuevo tag"
              maxLength={40}
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); create() } }}
            />
            <button type="button" className="ghost" onClick={create} disabled={busy || !newTag.trim()}>
              {busy ? 'Creando…' : '+ Crear tag'}
            </button>
            <button type="button" className="ghost" onClick={() => setManaging((m) => !m)}>
              {managing ? 'Listo' : 'Editar tags'}
            </button>
          </div>
          <CamelHint text={newTag} />
        </>
      )}
      {error && <p className="error">{error}</p>}
    </fieldset>
  )
}
