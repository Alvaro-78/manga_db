import AdminMangaList from '../../components/AdminMangaList'

// Mangas pedidos a las tiendas (solo admins).
export default function Orders({ isAdmin }) {
  return (
    <AdminMangaList
      isAdmin={isAdmin}
      table="orders"
      text={{ title: 'Pedidos', subtitle: 'Mangas pedidos a las tiendas.', item: 'pedido', empty: 'No hay pedidos.' }}
    />
  )
}
