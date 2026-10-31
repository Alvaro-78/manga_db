import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

const EMPTY = { title: '', author: '', volume: '', publisher: '' }

// Mangas pedidos a las tiendas (solo admins).
export default function Orders({ isAdmin }) {
  const [orders, setOrders] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [editingId, setEditingId] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!isAdmin) return
    supabase.from('orders').select('*').order('created_at', { ascending: false })
      .then(({ data, error }) => (error ? setError(error.message) : setOrders(data)))
  }, [isAdmin])

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  function startEdit(order) {
    setEditingId(order.id)
    setForm({
      title: order.title,
      author: order.author ?? '',
      volume: order.volume ?? '',
      publisher: order.publisher ?? '',
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancel() {
    setEditingId(null)
    setForm(EMPTY)
  }

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const fields = {
      title: form.title.trim(),
      author: form.author.trim() || null,
      volume: form.volume.trim() || null,
      publisher: form.publisher.trim() || null,
    }
    const query = editingId
      ? supabase.from('orders').update(fields).eq('id', editingId)
      : supabase.from('orders').insert(fields)
    const { data, error } = await query.select().single()
    setBusy(false)
    if (error) return setError(error.message)
    setOrders((list) => (editingId ? list.map((o) => (o.id === data.id ? data : o)) : [data, ...list]))
    cancel()
  }

  async function remove(order) {
    if (!confirm(`¿Quitar “${order.title}” de los pedidos?`)) return
    const { error } = await supabase.from('orders').delete().eq('id', order.id)
    if (error) return setError(error.message)
    setOrders((list) => list.filter((o) => o.id !== order.id))
    if (editingId === order.id) cancel()
  }

  if (!isAdmin) return <p className="muted">Solo un admin puede ver los pedidos.</p>

  return (
    <>
      <h1>Pedidos</h1>
      <p className="muted small">Mangas pedidos a las tiendas.</p>

      <form onSubmit={submit} className="card stack">
        <h2>{editingId ? 'Editar pedido' : 'Nuevo pedido'}</h2>
        <label>
          Título
          <input required value={form.title} onChange={set('title')} />
        </label>
        <div className="row">
          <label className="grow">
            Autor
            <input value={form.author} onChange={set('author')} />
          </label>
          <label>
            Tomo
            <input className="volume-input" placeholder="p. ej. 3" value={form.volume} onChange={set('volume')} />
          </label>
        </div>
        <label>
          Editorial
          <input value={form.publisher} onChange={set('publisher')} />
        </label>
        {error && <p className="error">{error}</p>}
        <div className="row end">
          {editingId && <button type="button" className="ghost" onClick={cancel} disabled={busy}>Cancelar</button>}
          <button disabled={busy}>{busy ? 'Guardando…' : editingId ? 'Guardar' : '+ Añadir pedido'}</button>
        </div>
      </form>

      {!orders && !error && <p className="muted">Cargando…</p>}
      {orders?.length === 0 && <p className="muted center">No hay pedidos.</p>}

      <ul className="admin-list orders">
        {orders?.map((o) => (
          <li key={o.id}>
            <div className="grow order-line">
              {[
                ['Título', o.title],
                ['Autor', o.author],
                ['Tomo', o.volume],
                ['Editorial', o.publisher],
              ]
                .filter(([, value]) => value)
                .map(([label, value]) => (
                  <span key={label}><span className="muted">{label}:</span> {value}</span>
                ))}
            </div>
            <div className="row actions">
              <button className="ghost small" onClick={() => startEdit(o)}>Editar</button>
              <button className="ghost danger small" onClick={() => remove(o)}>Quitar</button>
            </div>
          </li>
        ))}
      </ul>
    </>
  )
}
