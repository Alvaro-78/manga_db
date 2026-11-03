import { useState } from 'react'
import { THEMES, applyTheme, getTheme } from '../lib/theme'

const LABELS = { auto: '◐ Auto', light: '☀ Claro', dark: '☾ Oscuro' }

// Botón que va pasando por Auto → Claro → Oscuro.
export default function ThemeToggle() {
  const [theme, setTheme] = useState(getTheme)

  function next() {
    const t = THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length]
    applyTheme(t)
    setTheme(t)
  }

  return (
    <button className="ghost small" onClick={next} title="Cambiar tema (automático, claro u oscuro)">
      {LABELS[theme]}
    </button>
  )
}
