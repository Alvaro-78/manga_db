import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { signedUrls } from '../lib/images'
import { STATUSES } from '../lib/statuses'
import MangaBadges from '../components/MangaBadges'
import { byName } from '../lib/mangas'
import { formatAvg, ratingSummary } from '../lib/ratings'
import StarRating from '../components/StarRating'
import { tagStyle } from '../lib/tags'

export default function Library({ isAdmin, userId }) {
  const [mangas, setMangas] = useState(null)
  const [covers, setCovers] = useState({})
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [tagFilter, setTagFilter] = useState('')

  useEffect(() => {
    let cancelled = false
    async function load() {
      const { data, error } = await supabase
        .from('mangas')
        .select('*, tags(id, name, hue), manga_ratings(user_id, rating)')
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
        (!tagFilter || m.tags.some((t) => t.id === tagFilter)) &&
        (!q || m.title.toLowerCase().includes(q) || m.author?.toLowerCase().includes(q)),
    )
  }, [mangas, search, statusFilter, tagFilter])

  // Tags usados en la biblioteca, para el filtro.
  const usedTags = useMemo(() => {
    const map = new Map()
    for (const m of mangas ?? []) for (const t of m.tags) map.set(t.id, t)
    return [...map.values()].sort(byName)
  }, [mangas])

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
        {usedTags.length > 0 && (
          <select value={tagFilter} onChange={(e) => setTagFilter(e.target.value)}>
            <option value="">Todos los tags</option>
            {usedTags.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        )}
      </div>

      {error && <p className="error">{error}</p>}
      {!mangas && !error && <p className="muted">Cargando…</p>}
      {mangas?.length === 0 && (
        <p className="muted center">
          {isAdmin
            ? <>Todavía no hay mangas. Añádelos desde <Link to="/admin/nuevo" className="accent">Administrar</Link>.</>
            : 'Todavía no hay mangas en la biblioteca.'}
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
                <TileRating ratings={m.manga_ratings} userId={userId} />
                <div className="tag-list small-tags">
                  <MangaBadges manga={m} />
                </div>
                {m.tags.length > 0 && (
                  <div className="tag-list small-tags tags-divided">
                    {[...m.tags].sort(byName).map((t) => <span key={t.id} className="tag on colored" style={tagStyle(t)}>{t.name}</span>)}
                  </div>
                )}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </>
  )
}

function TileRating({ ratings, userId }) {
  const { avg, count, mine } = ratingSummary(ratings, userId)
  if (!count) return <span className="muted small">Sin puntuar</span>
  return (
    <span className="rating-row small" title={mine ? `Tu nota: ${mine}` : undefined}>
      <StarRating value={avg} size="sm" />
      <span className="muted">{formatAvg(avg)} ({count})</span>
    </span>
  )
}
