import { toCamelCase } from '../lib/mangas'

// Avisa de cómo quedará el nombre del tag cuando no coincide con lo escrito.
export default function CamelHint({ text }) {
  const camel = toCamelCase(text)
  if (!text.trim() || camel === text.trim()) return null
  return <span className="muted small">Se guardará como <strong>{camel}</strong></span>
}
