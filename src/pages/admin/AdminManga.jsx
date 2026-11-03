import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { signedUrls } from '../../lib/images'
import { deleteManga } from '../../lib/mangas'
import MangaForm from '../../components/MangaForm'

export default function AdminManga({ user, isAdmin }) {
  const { mangaId } = useParams()
  const navigate = useNavigate()
  const [manga, setManga] = useState(null)
  const [coverUrl, setCoverUrl] = useState(null)
  const [error, setError] = useState(null)
  const [saved, setSaved] = useState(false)

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('mangas')
      .select('*, tags(id, name, hue)')
      .eq('id', mangaId)
      .single()
    if (error) return setError(error.message)
    setManga(data)
    const urls = await signedUrls([data.cover_path])
    setCoverUrl(urls[data.cover_path] ?? null)
  }, [mangaId])

  useEffect(() => { load() }, [load])

  async function handleDeleteManga() {
    if (!confirm(`¿Borrar “${manga.title}” y su portada?`)) return
    try {
      await deleteManga(manga)
      navigate('/admin', { replace: true })
    } catch (err) {
      setError(err.message)
    }
  }

  if (error && !manga) return <p className="error">{error}</p>
  if (!manga) return <p className="muted">Cargando…</p>

  return (
    <>
      <Link to="/admin" className="back">← Administrar</Link>
      <div className="row between">
        <h1>{manga.title}</h1>
        <div className="row">
          <Link to={`/manga/${manga.id}`} className="button ghost small">Ver en biblioteca</Link>
          <button className="ghost danger small" onClick={handleDeleteManga}>Borrar manga</button>
        </div>
      </div>
      {error && <p className="error">{error}</p>}

      <div className="admin-manga">
        {coverUrl
          ? <img src={coverUrl} alt="" className="detail-cover" />
          : <div className="cover-placeholder detail-cover">{manga.title.slice(0, 1)}</div>}
        <div className="grow">
          <MangaForm
            user={user}
            isAdmin={isAdmin}
            manga={manga}
            onSaved={() => { setSaved(true); setTimeout(() => setSaved(false), 2500); load() }}
          />
          {saved && <p className="ok">Cambios guardados.</p>}
        </div>
      </div>
    </>
  )
}
