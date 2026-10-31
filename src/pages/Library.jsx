import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { signedUrls } from '../lib/images'
import { STATUSES } from '../lib/statuses'

export default function Library() {
  const [mangas, setMangas] = useState(null)
  const [covers, setCovers] = useState({})
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    let cancelled = false
    async function load() {
      const { data, error } = await supabase
        .from('mangas')
        .select('*, chapters(count)')
        .order('title')
      if (cancelled) return
      if (error) return setError(error.message)
      setMangas(data)
      try {
        const urls = await signedUrls(data.map((m) => m.cover_path))
        if (!cancelled) setCovers(urls)
      } catch (err) {
        if (!cancelled) setError(err.message)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const visible = useMemo(() => {
    if (!mangas) return []
    const q = search.trim().toLowerCase()
    return mangas.filter(
      (m) =>
        (!statusFilter || m.status === statusFilter) &&
        (!q || m.title.toLowerCase().includes(q) || m.author?.toLowerCase().includes(q)),
    )
  }, [mangas, search, statusFilter])

  return (
    <>
      <div className="toolbar">
        <input
          type="search"
          placeholder="Buscar por título o autor"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">Todos</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {error && <p className="error">{error}</p>}
      {!mangas && !error && <p className="muted">Cargando…</p>}
      {mangas?.length === 0 && (
        <p className="muted center">
          Todavía no tienes mangas. Añádelos desde <Link to="/admin/nuevo" className="accent">Administrar</Link>.
        </p>
      )}
      {mangas?.length > 0 && visible.length === 0 && <p className="muted center">Ningún manga coincide con la búsqueda.</p>}

      <ul className="grid">
        {visible.map((m) => (
          <li key={m.id}>
            <Link to={`/manga/${m.id}`} className="tile">
              {covers[m.cover_path] ? (
                <img src={covers[m.cover_path]} alt="" loading="lazy" />
              ) : (
                <div className="cover-placeholder">{m.title.slice(0, 1)}</div>
              )}
              <div className="tile-body">
                <strong>{m.title}</strong>
                <span className="muted small">
                  {m.chapters[0]?.count ?? 0} cap. · <span className={`badge ${m.status}`}>{m.status}</span>
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </>
  )
}
