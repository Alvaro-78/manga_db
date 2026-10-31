import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { byName, toCamelCase } from '../../lib/mangas'

// Gestión de tags (solo admins): crear, renombrar y borrar.
export default function AdminTags({ isAdmin }) {
  const [tags, setTags] = useState(null)
  const [editing, setEditing] = useState(null) // { id, name }
  const [newTag, setNewTag] = useState('')
  const [error, setError] = useState(null)

  useEffect(() => {
    supabase.from('tags').select('id, name').then(({ data, error }) => {
      if (error) setError(error.message)
      else setTags([...data].sort(byName))
    })
  }, [])

  async function create(e) {
    e.preventDefault()
    const name = toCamelCase(newTag)
    if (!name) return
    setError(null)
    const { data, error } = await supabase.from('tags').insert({ name }).select('id, name').single()
    if (error) return setError(friendly(error))
    setTags((list) => [...list, data].sort(byName))
    setNewTag('')
  }

  async function rename(e) {
    e.preventDefault()
    const name = toCamelCase(editing.name)
    if (!name) return
    setError(null)
    const { error } = await supabase.from('tags').update({ name }).eq('id', editing.id)
    if (error) return setError(friendly(error))
    setTags((list) => list.map((t) => (t.id === editing.id ? { ...t, name } : t)).sort(byName))
    setEditing(null)
  }

  async function remove(tag) {
    if (!confirm(`¿Borrar el tag “${tag.name}”? Se quitará de todos los mangas que lo lleven.`)) return
    setError(null)
    const { error } = await supabase.from('tags').delete().eq('id', tag.id)
    if (error) return setError(friendly(error))
    setTags((list) => list.filter((t) => t.id !== tag.id))
  }

  if (!isAdmin) return <p className="muted">Solo un admin puede gestionar los tags.</p>

  return (
    <>
      <Link to="/admin" className="back">← Administrar</Link>
      <h1>Tags</h1>

      <form onSubmit={create} className="row tag-new">
        <input placeholder="Nuevo tag" maxLength={40} value={newTag} onChange={(e) => setNewTag(e.target.value)} />
        <button disabled={!newTag.trim()}>+ Crear tag</button>
      </form>
      <CamelHint text={newTag} />

      {error && <p className="error">{error}</p>}
      {!tags && !error && <p className="muted">Cargando…</p>}
      {tags?.length === 0 && <p className="muted">Todavía no hay tags.</p>}

      <ul className="admin-list">
        {tags?.map((t) => (
          <li key={t.id}>
            {editing?.id === t.id ? (
              <form onSubmit={rename} className="row grow tag-new">
                <input
                  autoFocus
                  maxLength={40}
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                />
                <button disabled={!editing.name.trim()}>Guardar</button>
                <button type="button" className="ghost" onClick={() => setEditing(null)}>Cancelar</button>
                <CamelHint text={editing.name} />
              </form>
            ) : (
              <>
                <span className="grow"><span className="tag on">{t.name}</span></span>
                <div className="row actions">
                  <button className="ghost small" onClick={() => setEditing({ id: t.id, name: t.name })}>Renombrar</button>
                  <button className="ghost danger small" onClick={() => remove(t)}>Borrar</button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
    </>
  )
}

function CamelHint({ text }) {
  const camel = toCamelCase(text)
  if (!text.trim() || camel === text.trim()) return null
  return <p className="muted small">Se guardará como <strong>{camel}</strong></p>
}

function friendly(error) {
  return error.code === '23505' ? 'Ya existe un tag con ese nombre.' : error.message
}
