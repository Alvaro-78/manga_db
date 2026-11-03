import { isComplete, volumeLabel } from '../lib/volume'

// Estado y colección del manga como etiquetas cuadradas, para distinguirlas de los tags.
export function StatusBadge({ status }) {
  return <span className={`badge ${status}`}>{status}</span>
}

export default function MangaBadges({ manga }) {
  return (
    <>
      <StatusBadge status={manga.status} />
      <span className="badge coleccion">{volumeLabel(manga)}</span>
      {isComplete(manga) && <span className="badge serie-completa">Serie Completa</span>}
    </>
  )
}
