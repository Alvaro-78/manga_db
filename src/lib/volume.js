// Tomo único = serie completa; cualquier otro caso = serie incompleta.
export function volumeLabel(manga) {
  if (manga.single_volume) return 'Tomo único'
  return manga.volume ? `Tomo ${manga.volume}` : null
}

export function seriesLabel(manga) {
  return manga.single_volume ? 'Serie completa' : 'Serie incompleta'
}
