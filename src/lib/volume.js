// Colección: tomo único (siempre serie completa) o varios tomos (con el detalle escrito a mano).
export function volumeLabel(manga) {
  if (manga.single_volume) return 'Tomo Único'
  return manga.volume ? `Tomos ${manga.volume}` : 'Tomos'
}

export function isComplete(manga) {
  return manga.single_volume || manga.series_complete
}
