import AdminMangaList from '../../components/AdminMangaList'

// Mangas de segunda mano (solo admins).
export default function SecondHand({ isAdmin }) {
  return (
    <AdminMangaList
      isAdmin={isAdmin}
      table="second_hand"
      text={{ title: 'Segunda mano', subtitle: 'Mangas de segunda mano.', item: 'manga', empty: 'No hay mangas de segunda mano.' }}
    />
  )
}
