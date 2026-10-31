import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { removeImages, uploadImage } from '../lib/images'
import { STATUSES } from '../lib/statuses'

// Crea un manga (sin `manga`) o edita uno existente.
export default function MangaForm({ user, manga, onSaved, onCancel }) {
  const [title, setTitle] = useState(manga?.title ?? '')
  const [author, setAuthor] = useState(manga?.author ?? '')
  const [description, setDescription] = useState(manga?.description ?? '')
  const [status, setStatus] = useState(manga?.status ?? 'leyendo')
  const [singleVolume, setSingleVolume] = useState(manga?.single_volume ?? false)
  const [volume, setVolume] = useState(manga?.volume ?? '')
  const [cover, setCover] = useState(null)
  const [fileInputKey, setFileInputKey] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      let cover_path = manga?.cover_path ?? null
      if (cover) {
        cover_path = await uploadImage(user.id, 'covers', cover)
        if (manga?.cover_path) await removeImages([manga.cover_path])
      }
      const fields = {
        title: title.trim(),
        author: author.trim() || null,
        description: description.trim() || null,
        status,
        single_volume: singleVolume,
        volume: singleVolume ? null : volume.trim() || null,
        cover_path,
      }
      const query = manga
        ? supabase.from('mangas').update(fields).eq('id', manga.id)
        : supabase.from('mangas').insert(fields)
      const { data, error } = await query.select().single()
      if (error) throw error
      setCover(null)
      setFileInputKey((k) => k + 1)
      onSaved(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="card stack">
      <h2>{manga ? 'Datos del manga' : 'Nuevo manga'}</h2>
      <label>
        Título
        <input required value={title} onChange={(e) => setTitle(e.target.value)} />
      </label>
      <div className="row">
        <label className="grow">
          Autor
          <input value={author} onChange={(e) => setAuthor(e.target.value)} />
        </label>
        <label>
          Estado
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
      </div>
      <fieldset className="volume-field">
        <legend>Tomo</legend>
        <label className="inline">
          <input type="radio" name="volume-kind" checked={singleVolume} onChange={() => setSingleVolume(true)} />
          Tomo único
        </label>
        <label className="inline">
          <input type="radio" name="volume-kind" checked={!singleVolume} onChange={() => setSingleVolume(false)} />
          Tomo
          <input
            className="volume-input"
            placeholder="p. ej. 3 o 1-5"
            value={volume}
            disabled={singleVolume}
            onChange={(e) => setVolume(e.target.value)}
          />
        </label>
        <span className={`badge ${singleVolume ? 'serie-completa' : 'serie-incompleta'}`}>
          {singleVolume ? 'Serie completa' : 'Serie incompleta'}
        </span>
      </fieldset>
      <label>
        Descripción / notas
        <textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
      </label>
      <label>
        Portada {manga?.cover_path && <span className="muted small">(deja vacío para mantener la actual)</span>}
        <input key={fileInputKey} type="file" accept="image/*" onChange={(e) => setCover(e.target.files[0] ?? null)} />
      </label>
      {error && <p className="error">{error}</p>}
      <div className="row end">
        {onCancel && <button type="button" className="ghost" onClick={onCancel} disabled={busy}>Cancelar</button>}
        <button disabled={busy}>{busy ? 'Guardando…' : 'Guardar'}</button>
      </div>
    </form>
  )
}
