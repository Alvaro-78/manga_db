import { Link, useNavigate } from 'react-router-dom'
import MangaForm from '../../components/MangaForm'

export default function AdminNewManga({ user, isAdmin }) {
  const navigate = useNavigate()
  return (
    <>
      <Link to="/admin" className="back">← Administrar</Link>
      <MangaForm
        user={user}
        isAdmin={isAdmin}
        onCancel={() => navigate('/admin')}
        // Tras crearlo, pasamos a su página de edición para añadir capítulos.
        onSaved={(m) => navigate(`/admin/manga/${m.id}`, { replace: true })}
      />
    </>
  )
}
