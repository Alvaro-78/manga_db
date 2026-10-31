import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { signedUrls } from '../../lib/images'
import { deleteManga } from '../../lib/mangas'

export default function AdminList() {
  const [mangas, setMangas] = useState(null)
  const [covers, setCovers] = useState({})
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    let cancelled = false
    async function load() {
      const { data, error } = await supabase
        .from('mangas')
        .select('*')
        .order('created_at', { ascending: false })
      if (cancelled) return
      if (error) return setError(error.message)
      setMangas(data)
      const urls = await signedUrls(data.map((m) => m.cover_path))
      if (!cancelled) setCovers(urls)
    }
    load()
    return () => { cancelled = true }
  }, [])

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    return (mangas ?? []).filter((m) => !q || m.title.toLowerCase().includes(q))
  }, [mangas, search])

  async function handleDelete(manga) {
    if (!confirm(`¿Borrar “${manga.title}” y su portada?`)) return
    try {
      await deleteManga(manga)
      setMangas((list) => list.filter((m) => m.id !== manga.id))
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <>
      <div className="row between">
        <h1>Administrar</h1>
        <Link to="/admin/nuevo" className="button">+ Nuevo manga</Link>
      </div>

      <div className="toolbar">
        <input type="search" placeholder="Buscar por título" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {error && <p className="error">{error}</p>}
      {!mangas && !error && <p className="muted">Cargando…</p>}
      {mangas?.length === 0 && <p className="muted center">No hay mangas. Crea el primero con “+ Nuevo manga”.</p>}

      <ul className="admin-list">
        {visible.map((m) => (
          <li key={m.id}>
            {covers[m.cover_path]
              ? <img src={covers[m.cover_path]} alt="" className="thumb" loading="lazy" />
              : <div className="cover-placeholder thumb">{m.title.slice(0, 1)}</div>}
            <div className="grow">
              <strong>{m.title}</strong>
              <div className="muted small">
                {m.author && `${m.author} · `}<span className={`badge ${m.status}`}>{m.status}</span>
              </div>
            </div>
            <div className="row actions">
              <Link to={`/admin/manga/${m.id}`} className="button ghost small">Editar</Link>
              <button className="ghost danger small" onClick={() => handleDelete(m)}>Borrar</button>
            </div>
          </li>
        ))}
      </ul>
    </>
  )
}
