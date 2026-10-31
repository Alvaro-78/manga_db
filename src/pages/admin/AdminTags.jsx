import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { byName } from '../../lib/mangas'
import { createTag, loadTags } from '../../lib/tags'
import CamelHint from '../../components/CamelHint'
import TagManager from '../../components/TagManager'

// Gestión de tags (solo admins): crear, renombrar y borrar.
export default function AdminTags({ isAdmin }) {
  const [tags, setTags] = useState(null)
  const [newTag, setNewTag] = useState('')
  const [error, setError] = useState(null)

  useEffect(() => {
    loadTags().then(setTags, (err) => setError(err.message))
  }, [])

  async function create(e) {
    e.preventDefault()
    if (!newTag.trim()) return
    setError(null)
    try {
      const tag = await createTag(newTag)
      setTags((list) => [...list, tag].sort(byName))
      setNewTag('')
    } catch (err) {
      setError(err.message)
    }
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
      {tags ? <TagManager tags={tags} onChange={setTags} /> : !error && <p className="muted">Cargando…</p>}
    </>
  )
}
