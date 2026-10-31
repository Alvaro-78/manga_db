import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { byName } from '../lib/mangas'

// Elige los tags de un manga. Un admin puede además crear tags nuevos.
export default function TagPicker({ selected, onChange, isAdmin }) {
  const [tags, setTags] = useState([])
  const [newTag, setNewTag] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    supabase.from('tags').select('id, name').then(({ data, error }) => {
      if (error) setError(error.message)
      else setTags([...data].sort(byName))
    })
  }, [])

  function toggle(id) {
    onChange(selected.includes(id) ? selected.filter((t) => t !== id) : [...selected, id])
  }

  async function create() {
    const name = newTag.trim()
    if (!name) return
    const existing = tags.find((t) => t.name.toLowerCase() === name.toLowerCase())
    if (existing) {
      if (!selected.includes(existing.id)) onChange([...selected, existing.id])
      setNewTag('')
      return
    }
    setBusy(true)
    setError(null)
    const { data, error } = await supabase.from('tags').insert({ name }).select('id, name').single()
    setBusy(false)
    if (error) return setError(error.message)
    setTags((list) => [...list, data].sort(byName))
    onChange([...selected, data.id])
    setNewTag('')
  }

  return (
    <fieldset className="tag-field">
      <legend>Tags</legend>
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
      {isAdmin && (
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
        </div>
      )}
      {error && <p className="error">{error}</p>}
    </fieldset>
  )
}
