// Colección: un solo tomo, o varios tomos (con el detalle escrito a mano).
export function volumeLabel(manga) {
  if (manga.single_volume) return 'Tomo'
  return manga.volume ? `Tomos ${manga.volume}` : null
}
