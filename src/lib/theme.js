// Tema de la app: 'auto' (el del sistema), 'light' u 'dark'. Se recuerda en este navegador.
const KEY = 'theme'
export const THEMES = ['auto', 'light', 'dark']

export function getTheme() {
  try {
    const t = localStorage.getItem(KEY)
    return THEMES.includes(t) ? t : 'auto'
  } catch {
    return 'auto'
  }
}

export function applyTheme(theme) {
  const root = document.documentElement
  if (theme === 'auto') root.removeAttribute('data-theme')
  else root.setAttribute('data-theme', theme)
  try { localStorage.setItem(KEY, theme) } catch { /* sin almacenamiento: solo dura esta visita */ }
}
